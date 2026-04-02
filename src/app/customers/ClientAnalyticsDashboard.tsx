// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Building2, DollarSign, TrendingUp, TrendingDown,
  Package, ShoppingCart, ArrowUpRight, ArrowDownRight,
  ChevronDown, BarChart3, PieChart as PieChartIcon, CalendarRange,
  Search, Star, Repeat, AlertTriangle, Award, Target, Zap,
  Download, GitCompareArrows, ToggleLeft, ToggleRight, FileText,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import type { Customer, Order, Product } from "@/types";
import GapAnalysis from "./GapAnalysis";

// ─── Utilities ────────────────────────────────────────────────────
type CompareMode = "previous" | "lastYear" | "custom" | "off";

function computePreviousPeriod(range: DateRange): DateRange {
  if (!range.startDate || !range.endDate) return { startDate: "", endDate: "", label: "" };
  const start = new Date(range.startDate + "T00:00:00");
  const end = new Date(range.endDate + "T00:00:00");
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { startDate: prevStart.toISOString().split("T")[0], endDate: prevEnd.toISOString().split("T")[0], label: "Previous Period" };
}

function computeSamePeriodLastYear(range: DateRange): DateRange {
  if (!range.startDate || !range.endDate) return { startDate: "", endDate: "", label: "" };
  const start = new Date(range.startDate + "T00:00:00");
  const end = new Date(range.endDate + "T00:00:00");
  const prevStart = new Date(start);
  prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevEnd = new Date(end);
  prevEnd.setFullYear(prevEnd.getFullYear() - 1);
  return { startDate: prevStart.toISOString().split("T")[0], endDate: prevEnd.toISOString().split("T")[0], label: "Same Period Last Year" };
}

function formatDateShort(d: string) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pctChange(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) return current > 0 ? 100 : undefined;
  return ((current - previous) / previous) * 100;
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#84cc16", "#f97316", "#14b8a6"];
const tooltipStyle = { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 };
const tooltipLabel = { color: "#94a3b8", marginBottom: 4 };

const tierConfig: Record<string, { bg: string; text: string }> = {
  Enterprise: { bg: "bg-blue-500/15", text: "text-blue-400" },
  "Mid-Market": { bg: "bg-purple-500/15", text: "text-purple-400" },
  SMB: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

// ─── KPI Card ─────────────────────────────────────────────────────
function KPI({ label, value, change, prefix, prevValue, icon: Icon, iconColor }: {
  label: string; value: string; change?: number; prefix?: string; prevValue?: string;
  icon?: React.ElementType; iconColor?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-surface-hover">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
        {Icon && <Icon className={cn("h-4 w-4", iconColor || "text-text-muted")} />}
      </div>
      <p className="text-xl font-bold font-heading text-text-primary mt-1">{prefix}{value}</p>
      {change !== undefined && (
        <div className="flex items-center justify-between mt-1">
          <div className={cn("flex items-center gap-1 text-xs font-medium", change >= 0 ? "text-emerald-400" : "text-red-400")}>
            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}% vs prev period
          </div>
          {prevValue && <span className="text-[10px] text-text-muted">was {prevValue}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────
export default function ClientAnalyticsDashboard({
  customers, orders, products,
}: {
  customers: Customer[];
  orders: Order[];
  products: Product[];
}) {
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [analyticsView, setAnalyticsView] = useState<"overview" | "client">("overview");
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>("previous");
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [customCompareStart, setCustomCompareStart] = useState("");
  const [customCompareEnd, setCustomCompareEnd] = useState("");

  const compareRange = useMemo(() => {
    if (compareMode === "off" || !dateRange.startDate) return { startDate: "", endDate: "", label: "" };
    if (compareMode === "lastYear") return computeSamePeriodLastYear(dateRange);
    if (compareMode === "custom" && customCompareStart && customCompareEnd) {
      return { startDate: customCompareStart, endDate: customCompareEnd, label: "Custom Compare" };
    }
    return computePreviousPeriod(dateRange);
  }, [dateRange, compareMode, customCompareStart, customCompareEnd]);
  const hasCompare = compareRange.startDate !== "";

  // Filter orders by date range
  const currentOrders = useMemo(
    () => dateRange.startDate ? orders.filter(o => isInRange(o.createdAt, dateRange)) : orders,
    [orders, dateRange]
  );
  const prevOrders = useMemo(
    () => hasCompare ? orders.filter(o => isInRange(o.createdAt, compareRange)) : [],
    [orders, compareRange, hasCompare]
  );

  const selectedClient = customers.find(c => c.id === selectedClientId) || null;

  // Client search filtering
  const filteredClients = useMemo(() => {
    if (!clientSearch) return customers;
    const q = clientSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
  }, [customers, clientSearch]);

  // Select a client and switch to client view
  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setAnalyticsView("client");
    setShowClientDropdown(false);
    setClientSearch("");
  };

  // ─── OVERVIEW ANALYTICS ─────────────────────────────────────────
  const overviewData = useMemo(() => {
    // Revenue per client (current period)
    const clientRevenue: Record<string, { name: string; tier: string; revenue: number; orders: number; products: Set<string>; avgOrderValue: number }> = {};
    customers.forEach(c => {
      clientRevenue[c.id] = { name: c.name, tier: c.accountTier, revenue: 0, orders: 0, products: new Set(), avgOrderValue: 0 };
    });
    currentOrders.forEach(o => {
      if (clientRevenue[o.customerId]) {
        clientRevenue[o.customerId].revenue += o.total;
        clientRevenue[o.customerId].orders += 1;
        o.items?.forEach(item => clientRevenue[o.customerId].products.add(item.productName || item.productId));
      }
    });
    Object.values(clientRevenue).forEach(c => {
      c.avgOrderValue = c.orders > 0 ? c.revenue / c.orders : 0;
    });

    // Previous period revenue per client
    const prevClientRevenue: Record<string, { revenue: number; orders: number }> = {};
    customers.forEach(c => { prevClientRevenue[c.id] = { revenue: 0, orders: 0 }; });
    prevOrders.forEach(o => {
      if (prevClientRevenue[o.customerId]) {
        prevClientRevenue[o.customerId].revenue += o.total;
        prevClientRevenue[o.customerId].orders += 1;
      }
    });

    // Top clients by revenue
    const topClients = Object.entries(clientRevenue)
      .map(([id, data]) => ({
        id,
        ...data,
        productCount: data.products.size,
        prevRevenue: prevClientRevenue[id]?.revenue || 0,
        prevOrders: prevClientRevenue[id]?.orders || 0,
        revenueChange: pctChange(data.revenue, prevClientRevenue[id]?.revenue || 0),
        orderChange: pctChange(data.orders, prevClientRevenue[id]?.orders || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Revenue by tier
    const tierRevenue: Record<string, number> = {};
    const prevTierRevenue: Record<string, number> = {};
    topClients.forEach(c => {
      tierRevenue[c.tier] = (tierRevenue[c.tier] || 0) + c.revenue;
      prevTierRevenue[c.tier] = (prevTierRevenue[c.tier] || 0) + c.prevRevenue;
    });

    // Growth leaders & at-risk
    const growthLeaders = [...topClients].filter(c => c.prevRevenue > 0 && (c.revenueChange || 0) > 0).sort((a, b) => (b.revenueChange || 0) - (a.revenueChange || 0)).slice(0, 5);
    const atRisk = [...topClients].filter(c => c.prevRevenue > 0 && (c.revenueChange || 0) < -10).sort((a, b) => (a.revenueChange || 0) - (b.revenueChange || 0)).slice(0, 5);

    // Totals
    const totalRevenue = topClients.reduce((s, c) => s + c.revenue, 0);
    const totalPrevRevenue = topClients.reduce((s, c) => s + c.prevRevenue, 0);
    const totalOrders = topClients.reduce((s, c) => s + c.orders, 0);
    const totalPrevOrders = topClients.reduce((s, c) => s + c.prevOrders, 0);
    const activeClients = topClients.filter(c => c.orders > 0).length;
    const prevActiveClients = topClients.filter(c => c.prevOrders > 0).length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const prevAvgOrderValue = totalPrevOrders > 0 ? totalPrevRevenue / totalPrevOrders : 0;

    return {
      topClients,
      tierRevenue: Object.entries(tierRevenue).map(([tier, revenue]) => ({
        tier, revenue, prevRevenue: prevTierRevenue[tier] || 0,
      })),
      growthLeaders,
      atRisk,
      totalRevenue, totalPrevRevenue,
      totalOrders, totalPrevOrders,
      activeClients, prevActiveClients,
      avgOrderValue, prevAvgOrderValue,
    };
  }, [customers, currentOrders, prevOrders]);

  // ─── CLIENT DETAIL ANALYTICS ────────────────────────────────────
  const clientData = useMemo(() => {
    if (!selectedClient) return null;

    const clientOrders = currentOrders.filter(o => o.customerId === selectedClient.id);
    const prevClientOrders = prevOrders.filter(o => o.customerId === selectedClient.id);

    // Product breakdown
    const productSpend: Record<string, { name: string; category: string; qty: number; revenue: number; orders: number }> = {};
    const prevProductSpend: Record<string, { name: string; qty: number; revenue: number }> = {};

    clientOrders.forEach(o => {
      o.items?.forEach(item => {
        const key = item.productName || item.productId;
        if (!productSpend[key]) productSpend[key] = { name: key, category: "", qty: 0, revenue: 0, orders: 0 };
        productSpend[key].qty += item.quantity;
        productSpend[key].revenue += item.total;
        productSpend[key].orders += 1;
        // Try to find category
        const prod = products.find(p => p.id === item.productId || p.name === item.productName);
        if (prod) productSpend[key].category = prod.category;
      });
    });

    prevClientOrders.forEach(o => {
      o.items?.forEach(item => {
        const key = item.productName || item.productId;
        if (!prevProductSpend[key]) prevProductSpend[key] = { name: key, qty: 0, revenue: 0 };
        prevProductSpend[key].qty += item.quantity;
        prevProductSpend[key].revenue += item.total;
      });
    });

    const productBreakdown = Object.values(productSpend)
      .map(p => ({
        ...p,
        prevQty: prevProductSpend[p.name]?.qty || 0,
        prevRevenue: prevProductSpend[p.name]?.revenue || 0,
        revenueChange: pctChange(p.revenue, prevProductSpend[p.name]?.revenue || 0),
        qtyChange: pctChange(p.qty, prevProductSpend[p.name]?.qty || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Category breakdown
    const categorySpend: Record<string, number> = {};
    const prevCategorySpend: Record<string, number> = {};
    productBreakdown.forEach(p => {
      const cat = p.category || "Other";
      categorySpend[cat] = (categorySpend[cat] || 0) + p.revenue;
      prevCategorySpend[cat] = (prevCategorySpend[cat] || 0) + p.prevRevenue;
    });

    // Monthly revenue trend
    const monthlyRevenue: Record<string, { month: string; revenue: number; orders: number }> = {};
    clientOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthlyRevenue[key]) monthlyRevenue[key] = { month: label, revenue: 0, orders: 0 };
      monthlyRevenue[key].revenue += o.total;
      monthlyRevenue[key].orders += 1;
    });
    const prevMonthlyRevenue: Record<string, { month: string; revenue: number }> = {};
    prevClientOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "numeric" });
      if (!prevMonthlyRevenue[key]) prevMonthlyRevenue[key] = { month: label, revenue: 0 };
      prevMonthlyRevenue[key].revenue += o.total;
    });

    const monthlyTrend = Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);

    // Order frequency
    const orderDates = clientOrders.map(o => new Date(o.createdAt).getTime()).sort();
    const avgDaysBetweenOrders = orderDates.length > 1
      ? Math.round((orderDates[orderDates.length - 1] - orderDates[0]) / (86400000 * (orderDates.length - 1)))
      : 0;

    // Totals
    const totalRevenue = clientOrders.reduce((s, o) => s + o.total, 0);
    const prevTotalRevenue = prevClientOrders.reduce((s, o) => s + o.total, 0);
    const totalOrdersCount = clientOrders.length;
    const prevTotalOrders = prevClientOrders.length;
    const uniqueProducts = new Set(productBreakdown.map(p => p.name)).size;
    const prevUniqueProducts = new Set(Object.keys(prevProductSpend)).size;
    const avgOrder = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    const prevAvgOrder = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
    const growingProducts = productBreakdown.filter(p => (p.revenueChange || 0) > 5).length;
    const decliningProducts = productBreakdown.filter(p => (p.revenueChange || 0) < -5).length;

    return {
      productBreakdown,
      categorySpend: Object.entries(categorySpend).map(([cat, revenue]) => ({
        category: cat, revenue, prevRevenue: prevCategorySpend[cat] || 0,
        change: pctChange(revenue, prevCategorySpend[cat] || 0),
      })).sort((a, b) => b.revenue - a.revenue),
      monthlyTrend,
      totalRevenue, prevTotalRevenue,
      totalOrders: totalOrdersCount, prevTotalOrders,
      uniqueProducts, prevUniqueProducts,
      avgOrder, prevAvgOrder,
      avgDaysBetweenOrders,
      growingProducts, decliningProducts,
    };
  }, [selectedClient, currentOrders, prevOrders, products]);

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 relative z-[60]">
        <div className="flex items-center gap-3">
          {analyticsView === "client" && (
            <button
              onClick={() => { setAnalyticsView("overview"); setSelectedClientId(""); }}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors"
            >
              <BarChart3 className="h-4 w-4" /> All Clients
            </button>
          )}
          {/* Client Selector */}
          <div className="relative">
            <button
              onClick={() => setShowClientDropdown(!showClientDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary hover:border-primary/50 transition-colors"
            >
              <Users className="h-4 w-4 text-text-muted" />
              {selectedClient ? selectedClient.name : "All Clients Overview"}
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            </button>
            {showClientDropdown && (
              <div className="absolute top-full mt-1 left-0 w-80 bg-[#1a1f2e] border border-border rounded-xl shadow-2xl z-[100] overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setAnalyticsView("overview"); setSelectedClientId(""); setShowClientDropdown(false); setClientSearch(""); }}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-hover transition-colors", !selectedClientId && "bg-primary/10 text-primary")}
                  >
                    <BarChart3 className="h-4 w-4 text-text-muted shrink-0" />
                    <span className="font-medium">All Clients Overview</span>
                  </button>
                  {filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectClient(c.id)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-hover transition-colors", selectedClientId === c.id && "bg-primary/10 text-primary")}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[9px] font-bold text-primary shrink-0">
                        {c.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{c.name}</p>
                        <p className="text-[10px] text-text-muted">{c.accountTier} · {c.industry}</p>
                      </div>
                      <span className="ml-auto text-xs text-text-muted shrink-0">{formatCurrency(c.totalRevenue)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter onChange={(r) => { setDateRange(r); if (r.startDate && compareMode === "off") setCompareMode("previous"); }} defaultPreset="All Time" />
          {/* Compare Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowComparePanel(!showComparePanel)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                hasCompare ? "bg-purple-500/15 border-purple-500/30 text-purple-400" : "bg-surface border-border text-text-muted hover:text-text-primary hover:border-primary/50"
              )}
            >
              <GitCompareArrows className="h-4 w-4" />
              {hasCompare ? (
                compareMode === "lastYear" ? "vs Last Year" : compareMode === "custom" ? "vs Custom" : "vs Prev Period"
              ) : "Compare"}
            </button>
            {showComparePanel && (
              <div className="absolute top-full mt-1 right-0 w-72 bg-[#0f1729] border border-border rounded-xl shadow-2xl z-[100] overflow-hidden" style={{ background: '#0f1729' }}>
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-semibold text-text-primary uppercase tracking-wider">Compare Against</p>
                </div>
                <div className="p-2 space-y-1">
                  {([["previous", "Previous Period", "Same duration, immediately before"], ["lastYear", "Same Period Last Year", "Same dates, one year ago"], ["custom", "Custom Period", "Choose any date range"], ["off", "No Comparison", "Turn off comparison"]] as const).map(([mode, label, desc]) => (
                    <button
                      key={mode}
                      onClick={() => { setCompareMode(mode); if (mode !== "custom") setShowComparePanel(false); }}
                      className={cn("w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                        compareMode === mode ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-text-secondary"
                      )}
                    >
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-[10px] text-text-muted">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {compareMode === "custom" && (
                  <div className="p-3 border-t border-border space-y-2">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">From</label>
                      <input type="date" value={customCompareStart} onChange={e => setCustomCompareStart(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">To</label>
                      <input type="date" value={customCompareEnd} onChange={e => setCustomCompareEnd(e.target.value)}
                        className="w-full mt-1 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
                    </div>
                    <button onClick={() => setShowComparePanel(false)}
                      className="w-full mt-1 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors">
                      Apply
                    </button>
                  </div>
                )}
                {hasCompare && compareRange.startDate && (
                  <div className="px-3 py-2 border-t border-border bg-surface/50">
                    <p className="text-[10px] text-text-muted">Comparing: <span className="text-text-secondary">{formatDateShort(compareRange.startDate)} — {formatDateShort(compareRange.endDate)}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Export */}
          <button
            onClick={() => {
              if (analyticsView === "client" && clientData && selectedClient) {
                exportToCSV(clientData.productBreakdown.map((p: any) => ({
                  product: p.name, category: p.category, qty: p.qty, revenue: p.revenue,
                  prevQty: p.prevQty, prevRevenue: p.prevRevenue,
                  revenueChange: p.revenueChange !== undefined ? `${p.revenueChange.toFixed(1)}%` : "",
                })), `${selectedClient.name.replace(/\s+/g, "-")}-analytics`, [
                  { key: "product", label: "Product" }, { key: "category", label: "Category" },
                  { key: "qty", label: "Qty" }, { key: "revenue", label: "Revenue" },
                  { key: "prevQty", label: "Prev Qty" }, { key: "prevRevenue", label: "Prev Revenue" },
                  { key: "revenueChange", label: "Change %" },
                ]);
              } else {
                exportToCSV(overviewData.topClients.map((c: any) => ({
                  client: c.name, tier: c.tier, orders: c.orders, revenue: c.revenue,
                  prevRevenue: c.prevRevenue, avgOrder: c.avgOrderValue, products: c.productCount,
                  revenueChange: c.revenueChange !== undefined ? `${c.revenueChange.toFixed(1)}%` : "",
                })), "client-analytics-overview", [
                  { key: "client", label: "Client" }, { key: "tier", label: "Tier" },
                  { key: "orders", label: "Orders" }, { key: "revenue", label: "Revenue" },
                  { key: "prevRevenue", label: "Prev Revenue" }, { key: "revenueChange", label: "Change %" },
                  { key: "avgOrder", label: "Avg Order" }, { key: "products", label: "Products" },
                ]);
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Compare Banner */}
      {hasCompare && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <GitCompareArrows className="h-4 w-4 text-purple-400 shrink-0" />
          <p className="text-xs text-purple-300">
            <span className="font-medium">Comparing:</span>{" "}
            {dateRange.label !== "All Time" ? `${formatDateShort(dateRange.startDate)} — ${formatDateShort(dateRange.endDate)}` : "All Time"}{" "}
            <span className="text-purple-400/60">vs</span>{" "}
            {formatDateShort(compareRange.startDate)} — {formatDateShort(compareRange.endDate)}
            {compareMode === "lastYear" && " (last year)"}
          </p>
          <button onClick={() => setCompareMode("off")} className="ml-auto text-[10px] text-purple-400 hover:text-purple-300 font-medium uppercase tracking-wider">
            Clear
          </button>
        </div>
      )}

      {analyticsView === "overview" ? (
        <OverviewAnalytics data={overviewData} hasCompare={hasCompare} onSelectClient={selectClient} />
      ) : clientData && selectedClient ? (
        <ClientDetailAnalytics client={selectedClient} data={clientData} hasCompare={hasCompare} orders={orders} products={products} />
      ) : (
        <div className="text-center py-20 text-text-muted">Select a client to view analytics</div>
      )}
    </div>
  );
}

// ─── OVERVIEW ANALYTICS VIEW ──────────────────────────────────────
function OverviewAnalytics({ data, hasCompare, onSelectClient }: {
  data: any; hasCompare: boolean; onSelectClient: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KPI
          label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={DollarSign} iconColor="text-emerald-400"
          change={hasCompare ? pctChange(data.totalRevenue, data.totalPrevRevenue) : undefined}
          prevValue={hasCompare ? formatCurrency(data.totalPrevRevenue) : undefined}
        />
        <KPI
          label="Total Orders" value={formatNumber(data.totalOrders)} icon={ShoppingCart} iconColor="text-blue-400"
          change={hasCompare ? pctChange(data.totalOrders, data.totalPrevOrders) : undefined}
          prevValue={hasCompare ? formatNumber(data.totalPrevOrders) : undefined}
        />
        <KPI
          label="Active Clients" value={formatNumber(data.activeClients)} icon={Users} iconColor="text-purple-400"
          change={hasCompare ? pctChange(data.activeClients, data.prevActiveClients) : undefined}
          prevValue={hasCompare ? formatNumber(data.prevActiveClients) : undefined}
        />
        <KPI
          label="Avg Order Value" value={formatCurrency(data.avgOrderValue)} icon={Target} iconColor="text-amber-400"
          change={hasCompare ? pctChange(data.avgOrderValue, data.prevAvgOrderValue) : undefined}
          prevValue={hasCompare ? formatCurrency(data.prevAvgOrderValue) : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Clients by Revenue */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Top 10 Clients by Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topClients.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabel}
                  formatter={(v: number, name: string) => [formatCurrency(v), name === "revenue" ? "Current" : "Previous"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Current" />
                {hasCompare && <Bar dataKey="prevRevenue" fill="#3b82f640" radius={[0, 4, 4, 0]} name="Previous" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Tier */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Account Tier</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.tierRevenue}
                  dataKey="revenue"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  label={({ tier, percent }) => `${tier} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#64748b" }}
                >
                  {data.tierRevenue.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Tier breakdown below */}
          <div className="space-y-2 mt-2">
            {data.tierRevenue.map((t: any, i: number) => {
              const change = hasCompare ? pctChange(t.revenue, t.prevRevenue) : undefined;
              return (
                <div key={t.tier} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                    <span className="text-text-secondary">{t.tier}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-primary font-medium">{formatCurrency(t.revenue)}</span>
                    {change !== undefined && (
                      <span className={cn("text-[10px] font-medium", change >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Growth Leaders & At-Risk */}
      <div className="grid grid-cols-2 gap-6">
        {/* Growth Leaders */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-text-primary">Growth Leaders</h3>
            <span className="text-[10px] text-text-muted">(vs previous period)</span>
          </div>
          {data.growthLeaders.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">Select a date range to see comparison data</p>
          ) : (
            <div className="space-y-3">
              {data.growthLeaders.map((c: any, i: number) => (
                <button key={c.id} onClick={() => onSelectClient(c.id)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left">
                  <span className="text-[10px] font-bold text-text-muted w-5">{i + 1}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-[9px] font-bold text-emerald-400 shrink-0">
                    {c.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                    <p className="text-[10px] text-text-muted">{c.tier} · {formatCurrency(c.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">+{(c.revenueChange || 0).toFixed(1)}%</span>
                    <p className="text-[10px] text-text-muted">was {formatCurrency(c.prevRevenue)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* At-Risk Clients */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-text-primary">At-Risk Clients</h3>
            <span className="text-[10px] text-text-muted">(spending declining &gt;10%)</span>
          </div>
          {data.atRisk.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">{hasCompare ? "No at-risk clients detected" : "Select a date range to see comparison data"}</p>
          ) : (
            <div className="space-y-3">
              {data.atRisk.map((c: any, i: number) => (
                <button key={c.id} onClick={() => onSelectClient(c.id)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left">
                  <span className="text-[10px] font-bold text-text-muted w-5">{i + 1}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-[9px] font-bold text-red-400 shrink-0">
                    {c.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                    <p className="text-[10px] text-text-muted">{c.tier} · {formatCurrency(c.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-400">{(c.revenueChange || 0).toFixed(1)}%</span>
                    <p className="text-[10px] text-text-muted">was {formatCurrency(c.prevRevenue)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Client Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">All Clients Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">#</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Tier</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Orders</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Revenue</th>
                {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Prev Revenue</th>}
                {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Change</th>}
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Avg Order</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Products</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.topClients.map((c: any, i: number) => {
                const share = data.totalRevenue > 0 ? (c.revenue / data.totalRevenue) * 100 : 0;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectClient(c.id)}
                    className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-text-muted text-xs">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[9px] font-bold text-primary shrink-0">
                          {c.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                        </div>
                        <span className="font-medium text-text-primary">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", tierConfig[c.tier]?.bg, tierConfig[c.tier]?.text)}>
                        {c.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-text-secondary">{c.orders}</td>
                    <td className="py-3 px-4 text-right text-text-primary font-medium">{formatCurrency(c.revenue)}</td>
                    {hasCompare && <td className="py-3 px-4 text-right text-text-muted text-xs">{formatCurrency(c.prevRevenue)}</td>}
                    {hasCompare && (
                      <td className="py-3 px-4 text-right">
                        {c.revenueChange !== undefined ? (
                          <span className={cn("text-xs font-medium", c.revenueChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {c.revenueChange >= 0 ? "+" : ""}{c.revenueChange.toFixed(1)}%
                          </span>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(c.avgOrderValue)}</td>
                    <td className="py-3 px-4 text-right text-text-muted">{c.productCount}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-surface overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(share, 100)}%` }} />
                        </div>
                        <span className="text-xs text-text-muted w-10 text-right">{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT DETAIL ANALYTICS VIEW ─────────────────────────────────
function ClientDetailAnalytics({ client, data, hasCompare, orders, products }: {
  client: Customer; data: any; hasCompare: boolean; orders: Order[]; products: Product[];
}) {
  const [productSort, setProductSort] = useState<"revenue" | "qty" | "change">("revenue");
  const [detailTab, setDetailTab] = useState<"analytics" | "gap">("analytics");

  const sortedProducts = useMemo(() => {
    const arr = [...data.productBreakdown];
    if (productSort === "revenue") arr.sort((a: any, b: any) => b.revenue - a.revenue);
    else if (productSort === "qty") arr.sort((a: any, b: any) => b.qty - a.qty);
    else arr.sort((a: any, b: any) => (b.revenueChange || 0) - (a.revenueChange || 0));
    return arr;
  }, [data.productBreakdown, productSort]);

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
            {client.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-text-primary">{client.name}</h2>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tierConfig[client.accountTier]?.bg, tierConfig[client.accountTier]?.text)}>
                {client.accountTier}
              </span>
            </div>
            <p className="text-sm text-text-muted">{client.industry} · {client.region} · Rep: {client.assignedRep}</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { key: "analytics" as const, label: "Performance Analytics", icon: BarChart3 },
          { key: "gap" as const, label: "Gap Analysis", icon: Target },
        ]).map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setDetailTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
                detailTab === tab.key ? "text-primary" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
              {detailTab === tab.key && (
                <motion.div layoutId="client-detail-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {detailTab === "gap" && (
        <GapAnalysis client={client} orders={orders} products={products} allOrders={orders} />
      )}

      {detailTab === "analytics" && (<>
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPI
          label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={DollarSign} iconColor="text-emerald-400"
          change={hasCompare ? pctChange(data.totalRevenue, data.prevTotalRevenue) : undefined}
          prevValue={hasCompare ? formatCurrency(data.prevTotalRevenue) : undefined}
        />
        <KPI
          label="Orders" value={formatNumber(data.totalOrders)} icon={ShoppingCart} iconColor="text-blue-400"
          change={hasCompare ? pctChange(data.totalOrders, data.prevTotalOrders) : undefined}
          prevValue={hasCompare ? String(data.prevTotalOrders) : undefined}
        />
        <KPI
          label="Avg Order Value" value={formatCurrency(data.avgOrder)} icon={Target} iconColor="text-amber-400"
          change={hasCompare ? pctChange(data.avgOrder, data.prevAvgOrder) : undefined}
          prevValue={hasCompare ? formatCurrency(data.prevAvgOrder) : undefined}
        />
        <KPI
          label="Unique Products" value={formatNumber(data.uniqueProducts)} icon={Package} iconColor="text-purple-400"
          change={hasCompare ? pctChange(data.uniqueProducts, data.prevUniqueProducts) : undefined}
          prevValue={hasCompare ? String(data.prevUniqueProducts) : undefined}
        />
        <KPI
          label="Growing Products" value={String(data.growingProducts)} icon={TrendingUp} iconColor="text-emerald-400"
        />
        <KPI
          label="Declining Products" value={String(data.decliningProducts)} icon={TrendingDown} iconColor="text-red-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Spend by Product */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spend by Product</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedProducts.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v: number, name: string) => [formatCurrency(v), name === "revenue" ? "Current" : "Previous"]} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Current" />
                {hasCompare && <Bar dataKey="prevRevenue" fill="#3b82f640" radius={[0, 4, 4, 0]} name="Previous" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spend by Category</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categorySpend}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#64748b" }}
                >
                  {data.categorySpend.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {data.categorySpend.map((c: any, i: number) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-text-secondary">{c.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-primary font-medium">{formatCurrency(c.revenue)}</span>
                  {hasCompare && c.change !== undefined && (
                    <span className={cn("text-[10px] font-medium", c.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {c.change >= 0 ? "+" : ""}{c.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      {data.monthlyTrend.length > 1 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="clientRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#clientRevGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Order Frequency */}
      {data.avgDaysBetweenOrders > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <Repeat className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-text-primary">Order Frequency</p>
              <p className="text-xs text-text-muted">This client orders approximately every <span className="text-primary font-semibold">{data.avgDaysBetweenOrders} days</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Product Spend Breakdown</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Sort by:</span>
            {(["revenue", "qty", "change"] as const).map(s => (
              <button
                key={s}
                onClick={() => setProductSort(s)}
                className={cn("px-2.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
                  productSort === s ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-primary"
                )}
              >
                {s === "change" ? "% Change" : s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Qty</th>
                {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Prev Qty</th>}
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Revenue</th>
                {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Prev Revenue</th>}
                {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Change</th>}
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p: any) => {
                const status = !hasCompare ? "neutral" : (p.revenueChange || 0) > 5 ? "growing" : (p.revenueChange || 0) < -5 ? "declining" : "stable";
                return (
                  <tr key={p.name} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-text-primary">{p.name}</td>
                    <td className="py-3 px-4 text-text-muted text-xs">{p.category || "—"}</td>
                    <td className="py-3 px-4 text-right text-text-secondary">{formatNumber(p.qty)}</td>
                    {hasCompare && <td className="py-3 px-4 text-right text-text-muted text-xs">{formatNumber(p.prevQty)}</td>}
                    <td className="py-3 px-4 text-right text-text-primary font-medium">{formatCurrency(p.revenue)}</td>
                    {hasCompare && <td className="py-3 px-4 text-right text-text-muted text-xs">{formatCurrency(p.prevRevenue)}</td>}
                    {hasCompare && (
                      <td className="py-3 px-4 text-right">
                        {p.revenueChange !== undefined ? (
                          <span className={cn("text-xs font-medium", p.revenueChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {p.revenueChange >= 0 ? "+" : ""}{p.revenueChange.toFixed(1)}%
                          </span>
                        ) : <span className="text-text-muted text-xs">—</span>}
                      </td>
                    )}
                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        status === "growing" ? "bg-emerald-500/15 text-emerald-400" :
                        status === "declining" ? "bg-red-500/15 text-red-400" :
                        status === "stable" ? "bg-blue-500/15 text-blue-400" :
                        "bg-gray-500/15 text-gray-400"
                      )}>
                        {status === "growing" && <TrendingUp className="h-3 w-3" />}
                        {status === "declining" && <TrendingDown className="h-3 w-3" />}
                        {status === "growing" ? "Growing" : status === "declining" ? "Declining" : status === "stable" ? "Stable" : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sortedProducts.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-text-muted text-sm">No product data available for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
    </div>
  );
}
