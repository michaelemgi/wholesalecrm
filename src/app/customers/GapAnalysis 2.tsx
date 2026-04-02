// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package, Target, AlertTriangle, TrendingUp, Search,
  Download, Filter, BarChart3, ShoppingCart,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import type { Customer, Order, Product } from "@/types";

// --- Types ---
type GapStatus = "ordering" | "not_ordered" | "stopped";

interface GapProduct {
  productId: string;
  name: string;
  category: string;
  sku: string;
  status: GapStatus;
  qty: number;
  revenue: number;
  lastOrdered: string | null;
  avgCustomerSpend: number;
  recommendedAction: string;
}

// --- Utilities ---
function formatDateShort(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysSince(d: string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

// --- KPI Card ---
function GapKPI({ label, value, subtext, icon: Icon, iconColor, barValue, barMax }: {
  label: string; value: string; subtext?: string;
  icon: React.ElementType; iconColor: string;
  barValue?: number; barMax?: number;
}) {
  return (
    <div className="p-4 rounded-lg bg-surface-hover">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <p className="text-xl font-bold font-heading text-text-primary mt-1">{value}</p>
      {subtext && <p className="text-[10px] text-text-muted mt-0.5">{subtext}</p>}
      {barValue !== undefined && barMax !== undefined && barMax > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (barValue / barMax) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-[9px] text-text-muted mt-1">{((barValue / barMax) * 100).toFixed(0)}% coverage</p>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export default function GapAnalysis({
  client,
  orders,
  products,
  allOrders,
}: {
  client: Customer;
  orders: Order[];
  products: Product[];
  allOrders: Order[];
}) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "ordering" | "not_ordered" | "stopped">("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "status" | "revenue" | "lastOrdered">("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Compute gap analysis data
  const { gapProducts, categories: cats, kpis } = useMemo(() => {
    // Get all orders for this client
    const clientOrders = orders.filter(o => o.customerId === client.id);

    // Build map of what this client has ordered
    const orderedProducts: Record<string, { qty: number; revenue: number; lastOrdered: string }> = {};

    clientOrders.forEach(o => {
      o.items?.forEach(item => {
        const pid = item.productId;
        if (!orderedProducts[pid]) {
          orderedProducts[pid] = { qty: 0, revenue: 0, lastOrdered: o.createdAt };
        }
        orderedProducts[pid].qty += item.quantity;
        orderedProducts[pid].revenue += item.total;
        if (new Date(o.createdAt) > new Date(orderedProducts[pid].lastOrdered)) {
          orderedProducts[pid].lastOrdered = o.createdAt;
        }
      });
    });

    // Calculate average spend per product across all customers (for untapped revenue estimation)
    const productSpendAcrossCustomers: Record<string, { totalRevenue: number; customerCount: number }> = {};
    allOrders.forEach(o => {
      o.items?.forEach(item => {
        const pid = item.productId;
        if (!productSpendAcrossCustomers[pid]) {
          productSpendAcrossCustomers[pid] = { totalRevenue: 0, customerCount: 0 };
        }
        productSpendAcrossCustomers[pid].totalRevenue += item.total;
      });
    });
    // Count unique customers per product
    const productCustomers: Record<string, Set<string>> = {};
    allOrders.forEach(o => {
      o.items?.forEach(item => {
        if (!productCustomers[item.productId]) productCustomers[item.productId] = new Set();
        productCustomers[item.productId].add(o.customerId);
      });
    });
    Object.entries(productCustomers).forEach(([pid, custs]) => {
      if (productSpendAcrossCustomers[pid]) {
        productSpendAcrossCustomers[pid].customerCount = custs.size;
      }
    });

    // Build gap products list from full catalog
    const allCats = new Set<string>();
    const gapList: GapProduct[] = products.map(p => {
      allCats.add(p.category);
      const ordered = orderedProducts[p.id];
      const avgSpend = productSpendAcrossCustomers[p.id]
        ? productSpendAcrossCustomers[p.id].totalRevenue / Math.max(1, productSpendAcrossCustomers[p.id].customerCount)
        : p.unitPrice * 25;

      let status: GapStatus;
      let recommendedAction: string;

      if (ordered) {
        const days = daysSince(ordered.lastOrdered);
        if (days > 60) {
          status = "stopped";
          recommendedAction = `Last ordered ${days} days ago. Re-engage with promotional offer or check-in call.`;
        } else {
          status = "ordering";
          recommendedAction = ordered.qty > 50
            ? "Strong performer. Consider volume discount to increase order size."
            : "Active but low volume. Cross-sell with related products.";
        }
      } else {
        status = "not_ordered";
        recommendedAction = "Never ordered. Introduce via sample or trial pricing.";
      }

      return {
        productId: p.id,
        name: p.name,
        category: p.category,
        sku: p.sku,
        status,
        qty: ordered?.qty || 0,
        revenue: ordered?.revenue || 0,
        lastOrdered: ordered?.lastOrdered || null,
        avgCustomerSpend: avgSpend,
        recommendedAction,
      };
    });

    // KPI calculations
    const ordering = gapList.filter(g => g.status === "ordering");
    const notOrdered = gapList.filter(g => g.status === "not_ordered");
    const stopped = gapList.filter(g => g.status === "stopped");
    const untappedRevenue = notOrdered.reduce((s, g) => s + g.avgCustomerSpend, 0);
    const stoppedRevenue = stopped.reduce((s, g) => s + g.avgCustomerSpend, 0);

    return {
      gapProducts: gapList,
      categories: ["All", ...Array.from(allCats).sort()],
      kpis: {
        totalProducts: products.length,
        orderedProducts: ordering.length,
        notOrderedCount: notOrdered.length,
        stoppedCount: stopped.length,
        untappedRevenue,
        stoppedRevenue,
        coveragePct: products.length > 0 ? (ordering.length / products.length) * 100 : 0,
      },
    };
  }, [client, orders, products, allOrders]);

  // Filter + sort
  const displayProducts = useMemo(() => {
    let items = [...gapProducts];

    if (categoryFilter !== "All") items = items.filter(g => g.category === categoryFilter);
    if (statusFilter !== "all") items = items.filter(g => g.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(g => g.name.toLowerCase().includes(q) || g.sku.toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "status") {
        const order = { stopped: 0, not_ordered: 1, ordering: 2 };
        cmp = order[a.status] - order[b.status];
      }
      else if (sortField === "revenue") cmp = a.revenue - b.revenue;
      else if (sortField === "lastOrdered") {
        const aDate = a.lastOrdered ? new Date(a.lastOrdered).getTime() : 0;
        const bDate = b.lastOrdered ? new Date(b.lastOrdered).getTime() : 0;
        cmp = aDate - bDate;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return items;
  }, [gapProducts, categoryFilter, statusFilter, search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />;
  };

  const handleExport = () => {
    exportToCSV(
      displayProducts.map(g => ({
        product: g.name,
        sku: g.sku,
        category: g.category,
        status: g.status === "ordering" ? "Ordering" : g.status === "not_ordered" ? "Not Ordered" : "Stopped Ordering",
        qty: g.qty,
        revenue: `$${g.revenue.toFixed(2)}`,
        lastOrdered: g.lastOrdered ? formatDateShort(g.lastOrdered) : "Never",
        recommendedAction: g.recommendedAction,
      })),
      `gap-analysis-${client.name.replace(/\s+/g, "-")}`,
      [
        { key: "product", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
        { key: "qty", label: "Qty" },
        { key: "revenue", label: "Revenue" },
        { key: "lastOrdered", label: "Last Ordered" },
        { key: "recommendedAction", label: "Recommended Action" },
      ],
    );
  };

  const statusConfig = {
    ordering: { label: "Ordering", bg: "bg-emerald-500/15", text: "text-emerald-400" },
    not_ordered: { label: "Not Ordered", bg: "bg-amber-500/15", text: "text-amber-400" },
    stopped: { label: "Stopped", bg: "bg-red-500/15", text: "text-red-400" },
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GapKPI
          label="Product Coverage"
          value={`${kpis.orderedProducts} of ${kpis.totalProducts}`}
          subtext={`${kpis.coveragePct.toFixed(0)}% of catalog ordered`}
          icon={Package}
          iconColor="text-primary"
          barValue={kpis.orderedProducts}
          barMax={kpis.totalProducts}
        />
        <GapKPI
          label="Untapped Revenue Potential"
          value={formatCurrency(kpis.untappedRevenue)}
          subtext={`${kpis.notOrderedCount} products never ordered`}
          icon={Target}
          iconColor="text-amber-400"
        />
        <GapKPI
          label="At Risk Products"
          value={String(kpis.stoppedCount)}
          subtext={`${formatCurrency(kpis.stoppedRevenue)} est. at-risk revenue`}
          icon={AlertTriangle}
          iconColor="text-red-400"
        />
        <GapKPI
          label="Growth Opportunities"
          value={String(kpis.notOrderedCount)}
          subtext={`Products in catalog not yet ordered`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-colors"
        >
          {cats.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>

        <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border">
          {([
            { key: "all" as const, label: "All Products" },
            { key: "ordering" as const, label: "Ordered" },
            { key: "not_ordered" as const, label: "Not Ordered" },
            { key: "stopped" as const, label: "Stopped" },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                statusFilter === f.key ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors ml-auto"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th
                  className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                  onClick={() => toggleSort("name")}
                >
                  <span className="inline-flex items-center gap-1">Product <SortIcon field="name" /></span>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
                <th
                  className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[110px] cursor-pointer hover:text-text-primary select-none"
                  onClick={() => toggleSort("status")}
                >
                  <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[80px]">Qty</th>
                <th
                  className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[100px] cursor-pointer hover:text-text-primary select-none"
                  onClick={() => toggleSort("revenue")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">Revenue <SortIcon field="revenue" /></span>
                </th>
                <th
                  className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[110px] cursor-pointer hover:text-text-primary select-none"
                  onClick={() => toggleSort("lastOrdered")}
                >
                  <span className="inline-flex items-center gap-1">Last Ordered <SortIcon field="lastOrdered" /></span>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map((g, i) => {
                const sc = statusConfig[g.status];
                return (
                  <motion.tr
                    key={g.productId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      g.status === "stopped" ? "bg-red-500/[0.03]" :
                      g.status === "not_ordered" ? "bg-amber-500/[0.02]" :
                      "hover:bg-surface-hover/30"
                    )}
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-text-primary">{g.name}</p>
                      <p className="text-[10px] text-text-muted font-mono">{g.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted">{g.category}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium", sc.bg, sc.text)}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-text-secondary font-mono">
                      {g.qty > 0 ? formatNumber(g.qty) : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {g.revenue > 0 ? (
                        <span className="text-text-primary">{formatCurrency(g.revenue)}</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-text-muted">
                      {formatDateShort(g.lastOrdered)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[11px] text-text-muted leading-relaxed max-w-[280px]">{g.recommendedAction}</p>
                    </td>
                  </motion.tr>
                );
              })}
              {displayProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted text-sm">
                    No products match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-surface/30 text-xs text-text-muted">
          Showing {displayProducts.length} of {gapProducts.length} products
        </div>
      </div>
    </div>
  );
}
