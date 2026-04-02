"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, Phone, MapPin, Globe, Package,
  Search, X, Plus, Minus, Check, Clock, Calendar,
  DollarSign, Truck, ShoppingCart, Send, Star,
  AlertCircle, CheckCircle2, FileText, ChevronRight,
  RotateCcw, Pencil, Trash2, RefreshCw, Repeat, Download,
  ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import DateRangeFilter, { DateRange } from "@/components/DateRangeFilter";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Product } from "@/types";

// --- Supplier Data ---
interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  category: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  standingOrder: StandingOrder | null;
}

interface StandingOrder {
  frequency: "Weekly" | "Bi-Weekly" | "Monthly";
  dayOfWeek: string;
  items: StandingOrderItem[];
  isActive: boolean;
  lastSent: string;
  nextDue: string;
}

interface StandingOrderItem {
  productId: string;
  productName: string;
  sku: string;
  defaultQty: number;
  unitCost: number;
}

// Build suppliers from the product catalog's supplier field
const supplierNames = ["Global Supply Co.", "Pacific Trade Inc.", "Midwest Wholesale", "Southern Distributors", "Atlantic Imports"];

const supplierDetails: Record<string, Omit<Supplier, "id" | "name">> = {
  "Global Supply Co.": {
    contactName: "Marcus Chen",
    email: "orders@globalsupply.com",
    phone: "+1 (415) 555-0192",
    address: "1200 Market Street, San Francisco, CA 94102",
    website: "www.globalsupply.com",
    category: "Food & Beverage",
    paymentTerms: "Net 30",
    leadTimeDays: 5,
    rating: 4.8,
    totalOrders: 142,
    totalSpend: 892400,
    lastOrderDate: "2026-03-22",
    standingOrder: {
      frequency: "Weekly",
      dayOfWeek: "Friday",
      items: [],
      isActive: true,
      lastSent: "2026-03-21",
      nextDue: "2026-03-28",
    },
  },
  "Pacific Trade Inc.": {
    contactName: "Lisa Yamamoto",
    email: "purchasing@pacifictrade.com",
    phone: "+1 (310) 555-0847",
    address: "4500 Pacific Coast Hwy, Long Beach, CA 90802",
    website: "www.pacifictrade.com",
    category: "Food & Beverage, Specialty",
    paymentTerms: "Net 45",
    leadTimeDays: 8,
    rating: 4.5,
    totalOrders: 89,
    totalSpend: 456800,
    lastOrderDate: "2026-03-18",
    standingOrder: {
      frequency: "Bi-Weekly",
      dayOfWeek: "Monday",
      items: [],
      isActive: true,
      lastSent: "2026-03-17",
      nextDue: "2026-03-31",
    },
  },
  "Midwest Wholesale": {
    contactName: "Dave Robinson",
    email: "orders@midwestwholesale.com",
    phone: "+1 (312) 555-0634",
    address: "880 Industrial Blvd, Chicago, IL 60607",
    website: "www.midwestwholesale.com",
    category: "Food, Building Materials",
    paymentTerms: "Net 30",
    leadTimeDays: 4,
    rating: 4.6,
    totalOrders: 198,
    totalSpend: 1240000,
    lastOrderDate: "2026-03-25",
    standingOrder: {
      frequency: "Weekly",
      dayOfWeek: "Wednesday",
      items: [],
      isActive: true,
      lastSent: "2026-03-26",
      nextDue: "2026-04-02",
    },
  },
  "Southern Distributors": {
    contactName: "Rachel Adams",
    email: "supply@southerndist.com",
    phone: "+1 (713) 555-0291",
    address: "2100 Commerce Drive, Houston, TX 77003",
    website: "www.southerndist.com",
    category: "Building Materials, Industrial",
    paymentTerms: "Net 60",
    leadTimeDays: 6,
    rating: 4.3,
    totalOrders: 67,
    totalSpend: 378500,
    lastOrderDate: "2026-03-12",
    standingOrder: null,
  },
  "Atlantic Imports": {
    contactName: "Sofia Morales",
    email: "orders@atlanticimports.com",
    phone: "+1 (212) 555-0573",
    address: "350 Broadway, Suite 800, New York, NY 10013",
    website: "www.atlanticimports.com",
    category: "Specialty Foods, Imports",
    paymentTerms: "Net 30",
    leadTimeDays: 10,
    rating: 4.7,
    totalOrders: 54,
    totalSpend: 289600,
    lastOrderDate: "2026-03-20",
    standingOrder: {
      frequency: "Monthly",
      dayOfWeek: "1st",
      items: [],
      isActive: false,
      lastSent: "2026-03-01",
      nextDue: "2026-04-01",
    },
  },
};

// Build full supplier objects with their products
function buildMockSuppliers(products: Product[]): Supplier[] {
  return supplierNames.map((name, i) => {
    const details = { ...supplierDetails[name], standingOrder: supplierDetails[name].standingOrder ? { ...supplierDetails[name].standingOrder! } : null };
    const supplierProducts = products.filter(p => p.supplier === name);

    // Auto-populate standing order items from their product catalog
    if (details.standingOrder) {
      details.standingOrder.items = supplierProducts.slice(0, 3 + (i % 3)).map(p => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        defaultQty: 20 + ((i * 7 + supplierProducts.indexOf(p) * 13) % 80),
        unitCost: Math.round(p.wholesalePrice * (0.55 + (i % 3) * 0.05) * 100) / 100,
      }));
    }

    return {
      id: `sup-${(i + 1).toString().padStart(3, "0")}`,
      name,
      ...details,
    };
  });
}

// --- Quick Order Line ---
interface OrderLine {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitCost: number;
}

export default function SuppliersPage() {
  const { data: mockProducts = [], isLoading } = useSWR<Product[]>('/api/products', fetcher);

  const mockSuppliers = useMemo(() => buildMockSuppliers(mockProducts), [mockProducts]);

  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierTab, setSupplierTab] = useState<"overview" | "products" | "order" | "standing">("overview");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Supplier>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Order creation state
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Standing order edit state
  const [editingStanding, setEditingStanding] = useState(false);
  const [standingLines, setStandingLines] = useState<StandingOrderItem[]>([]);
  const [standingSaved, setStandingSaved] = useState(false);

  // Product quick order state (from product catalog view)
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [quickOrderQty, setQuickOrderQty] = useState(20);
  const [quickOrderSent, setQuickOrderSent] = useState(false);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    if (!search) return mockSuppliers;
    const q = search.toLowerCase();
    return mockSuppliers.filter(s =>
      s.name.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [search, mockSuppliers]);

  // Sort suppliers
  const sortedSuppliers = useMemo(() => {
    const sorted = [...filteredSuppliers].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [filteredSuppliers, sortField, sortDir]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Sort header helper
  const SortHeader = ({ field, children }: { field: keyof Supplier; children: React.ReactNode }) => (
    <button
      onClick={() => {
        if (sortField === field) {
          setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
          setSortField(field);
          setSortDir("asc");
        }
      }}
      className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
    >
      {children}
      {sortField === field ? (
        sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  // Open supplier detail
  const openSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierTab("overview");
    setOrderLines([]);
    setOrderSent(false);
    setShowEmailPreview(false);
    setEditingStanding(false);
    setStandingSaved(false);
    if (supplier.standingOrder) {
      setStandingLines([...supplier.standingOrder.items]);
    }
  };

  // Get products for a supplier
  const getSupplierProducts = (supplierName: string) =>
    mockProducts.filter(p => p.supplier === supplierName);

  // Start a new order pre-populated with standing order items
  const startOrderFromStanding = () => {
    if (!selectedSupplier?.standingOrder) return;
    setOrderLines(
      selectedSupplier.standingOrder.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        qty: item.defaultQty,
        unitCost: item.unitCost,
      }))
    );
    setOrderNotes("");
    setOrderSent(false);
    setShowEmailPreview(false);
    setSupplierTab("order");
  };

  // Start blank order
  const startBlankOrder = () => {
    setOrderLines([]);
    setOrderNotes("");
    setOrderSent(false);
    setShowEmailPreview(false);
    setSupplierTab("order");
  };

  // Add product to order
  const addToOrder = (product: Product) => {
    if (orderLines.find(l => l.productId === product.id)) return;
    setOrderLines(prev => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        qty: 20,
        unitCost: Math.round(product.wholesalePrice * 0.6 * 100) / 100,
      },
    ]);
  };

  // Update order line
  const updateOrderLine = (index: number, field: "qty" | "unitCost", value: number) => {
    setOrderLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index] };
      if (field === "qty") line.qty = Math.max(1, value);
      if (field === "unitCost") line.unitCost = Math.max(0.01, Math.round(value * 100) / 100);
      updated[index] = line;
      return updated;
    });
  };

  const removeOrderLine = (index: number) => {
    setOrderLines(prev => prev.filter((_, i) => i !== index));
  };

  // Confirm & send order (simulated)
  const confirmOrder = () => {
    setOrderSent(true);
    setShowEmailPreview(false);
  };

  // Standing order helpers
  const updateStandingQty = (index: number, qty: number) => {
    setStandingLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], defaultQty: Math.max(1, qty) };
      return updated;
    });
  };

  const removeStandingLine = (index: number) => {
    setStandingLines(prev => prev.filter((_, i) => i !== index));
  };

  const addToStanding = (product: Product) => {
    if (standingLines.find(l => l.productId === product.id)) return;
    setStandingLines(prev => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        defaultQty: 20,
        unitCost: Math.round(product.wholesalePrice * 0.6 * 100) / 100,
      },
    ]);
  };

  const saveStandingOrder = () => {
    setEditingStanding(false);
    setStandingSaved(true);
    setTimeout(() => setStandingSaved(false), 2500);
  };

  // Quick order from product
  const sendQuickOrder = () => {
    setQuickOrderSent(true);
    setTimeout(() => { setQuickOrderSent(false); setQuickOrderProduct(null); }, 3000);
  };

  // Order totals
  const orderTotal = orderLines.reduce((s, l) => s + l.qty * l.unitCost, 0);
  const orderItemCount = orderLines.reduce((s, l) => s + l.qty, 0);

  // Stats
  const totalSuppliers = mockSuppliers.length;
  const activeStanding = mockSuppliers.filter(s => s.standingOrder?.isActive).length;
  const totalSpend = mockSuppliers.reduce((s, sup) => s + sup.totalSpend, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Suppliers</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage supplier relationships, standing orders, and place purchase orders directly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter onChange={setDateRange} defaultPreset="All Time" />
          <button onClick={() => exportToCSV(sortedSuppliers.map(s => ({ name: s.name, category: s.category, products: getSupplierProducts(s.name).length, reliability: s.rating, avgLeadTime: s.leadTimeDays + ' days', totalSpend: s.totalSpend, status: s.standingOrder?.isActive ? 'Active' : 'Inactive' })), 'suppliers', [{ key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'products', label: 'Products' }, { key: 'reliability', label: 'Reliability' }, { key: 'avgLeadTime', label: 'Avg Lead Time' }, { key: 'totalSpend', label: 'Total Spend' }, { key: 'status', label: 'Status' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
          <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Suppliers", value: totalSuppliers.toString(), icon: Building2, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active Standing Orders", value: activeStanding.toString(), icon: Repeat, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Spend (YTD)", value: formatCurrency(totalSpend), icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
          { label: "Avg Lead Time", value: "6 days", icon: Clock, color: "text-accent", bg: "bg-[#6366f120]" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{kpi.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text-primary">{kpi.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
          />
        </div>
        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split("-") as [keyof Supplier, "asc" | "desc"];
            setSortField(field);
            setSortDir(dir);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="rating-desc">Rating High–Low</option>
          <option value="rating-asc">Rating Low–High</option>
          <option value="totalSpend-desc">Spend High–Low</option>
          <option value="totalSpend-asc">Spend Low–High</option>
          <option value="lastOrderDate-desc">Last Order Newest</option>
          <option value="lastOrderDate-asc">Last Order Oldest</option>
          <option value="category-asc">Category A–Z</option>
        </select>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSuppliers.map((supplier, i) => {
          const products = getSupplierProducts(supplier.name);
          return (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openSupplier(supplier)}
              className="glass-card p-5 hover:border-primary/40 transition-all cursor-pointer group"
            >
              {/* Supplier Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0">
                    {supplier.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{supplier.name}</h3>
                    <p className="text-[10px] text-text-muted">{supplier.category}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Contact */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{supplier.phone}</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted">Products</p>
                  <p className="text-sm font-semibold text-text-primary">{products.length}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted">Total Spend</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(supplier.totalSpend)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-text-primary">{supplier.rating}</span>
                  </div>
                </div>
              </div>

              {/* Standing Order Badge */}
              {supplier.standingOrder?.isActive && (
                <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <Repeat className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">
                    Standing Order · {supplier.standingOrder.frequency} ({supplier.standingOrder.dayOfWeek})
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ====== SUPPLIER DETAIL SLIDE-OUT ====== */}
      <AnimatePresence>
        {selectedSupplier && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedSupplier(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[780px] max-w-[95vw] bg-bg-primary border-l border-border z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-border shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {selectedSupplier.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-heading text-text-primary">{selectedSupplier.name}</h2>
                      <p className="text-xs text-text-muted">{selectedSupplier.contactName} · {selectedSupplier.category}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                    <X className="h-5 w-5 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 px-5 border-b border-border shrink-0">
                {[
                  { key: "overview" as const, label: "Overview" },
                  { key: "products" as const, label: `Products (${getSupplierProducts(selectedSupplier.name).length})` },
                  { key: "order" as const, label: "Create Order" },
                  { key: "standing" as const, label: "Standing Order" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setSupplierTab(tab.key); if (tab.key === "order") { setOrderSent(false); setShowEmailPreview(false); } }}
                    className={cn(
                      "px-3 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap",
                      supplierTab === tab.key ? "text-primary" : "text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {tab.label}
                    {supplierTab === tab.key && (
                      <motion.div layoutId="supplier-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                  {/* === OVERVIEW TAB === */}
                  {supplierTab === "overview" && (
                    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {/* Contact Info */}
                      <div className="glass-card p-4 space-y-2.5">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Contact Information</h4>
                        {[
                          { icon: Mail, label: selectedSupplier.email },
                          { icon: Phone, label: selectedSupplier.phone },
                          { icon: MapPin, label: selectedSupplier.address },
                          { icon: Globe, label: selectedSupplier.website },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <item.icon className="h-3.5 w-3.5 text-text-muted shrink-0" />
                            <span className="text-sm text-text-secondary">{item.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Total Orders", value: selectedSupplier.totalOrders.toString(), color: "text-primary" },
                          { label: "Total Spend", value: formatCurrency(selectedSupplier.totalSpend), color: "text-success" },
                          { label: "Lead Time", value: `${selectedSupplier.leadTimeDays} days`, color: "text-accent" },
                          { label: "Payment Terms", value: selectedSupplier.paymentTerms, color: "text-warning" },
                          { label: "Last Order", value: formatDate(selectedSupplier.lastOrderDate), color: "text-text-primary" },
                          { label: "Rating", value: `${selectedSupplier.rating} / 5.0`, color: "text-amber-400" },
                        ].map((stat, i) => (
                          <div key={i} className="p-3 rounded-lg bg-surface-hover/50">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</p>
                            <p className={cn("text-sm font-semibold mt-0.5", stat.color)}>{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={startOrderFromStanding}
                          disabled={!selectedSupplier.standingOrder}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-sm font-semibold text-primary transition-colors disabled:opacity-30"
                        >
                          <Repeat className="h-4 w-4" />
                          Order from Standing
                        </button>
                        <button
                          onClick={startBlankOrder}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-sm font-semibold text-emerald-400 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Create New Order
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* === PRODUCTS TAB === */}
                  {supplierTab === "products" && (
                    <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <p className="text-xs text-text-muted">Products we source from {selectedSupplier.name}. Click &quot;Quick Order&quot; to order directly.</p>
                      {getSupplierProducts(selectedSupplier.name).map((product, i) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="glass-card p-3 flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary">{product.name}</p>
                            <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
                              <span>{product.sku}</span>
                              <span>{product.category}</span>
                              <span>Stock: {product.stockLevel}</span>
                              <span>Lead: {product.leadTimeDays}d</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 mr-2">
                            <p className="text-xs text-text-muted">Wholesale</p>
                            <p className="text-sm font-bold text-text-primary">{formatCurrency(product.wholesalePrice)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickOrderProduct(product);
                              setQuickOrderQty(20);
                              setQuickOrderSent(false);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors whitespace-nowrap"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Quick Order
                          </button>
                          <button
                            onClick={() => { addToOrder(product); setSupplierTab("order"); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                          >
                            <Plus className="h-3 w-3" />
                            Add to Order
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* === CREATE ORDER TAB === */}
                  {supplierTab === "order" && (
                    <motion.div key="order" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {!orderSent ? (
                        <>
                          {/* Order header */}
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-text-primary">New Purchase Order</h3>
                              <p className="text-xs text-text-muted">To: {selectedSupplier.name} ({selectedSupplier.email})</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedSupplier.standingOrder && orderLines.length === 0 && (
                                <button
                                  onClick={startOrderFromStanding}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                >
                                  <Repeat className="h-3 w-3" />
                                  Load Standing Order
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Add products to order */}
                          {orderLines.length === 0 && !selectedSupplier.standingOrder && (
                            <div className="text-center py-8 glass-card">
                              <ShoppingCart className="h-8 w-8 text-text-muted mx-auto mb-3" />
                              <p className="text-sm text-text-muted">No items in order yet.</p>
                              <p className="text-xs text-text-muted mt-1">Go to the Products tab to add items, or load from standing order.</p>
                            </div>
                          )}

                          {orderLines.length === 0 && selectedSupplier.standingOrder && (
                            <div className="text-center py-8 glass-card">
                              <Repeat className="h-8 w-8 text-primary mx-auto mb-3" />
                              <p className="text-sm text-text-primary font-medium">Standing order available</p>
                              <p className="text-xs text-text-muted mt-1 mb-3">
                                {selectedSupplier.standingOrder.items.length} items · {selectedSupplier.standingOrder.frequency} on {selectedSupplier.standingOrder.dayOfWeek}
                              </p>
                              <button
                                onClick={startOrderFromStanding}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
                              >
                                <Repeat className="h-4 w-4" />
                                Load Standing Order Items
                              </button>
                            </div>
                          )}

                          {/* Order Lines */}
                          {orderLines.length > 0 && (
                            <div className="glass-card overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3">Product</th>
                                    <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[100px]">Qty</th>
                                    <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[100px]">Unit Cost</th>
                                    <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Total</th>
                                    <th className="p-3 w-[40px]"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {orderLines.map((line, idx) => (
                                    <tr key={line.productId} className="border-b border-border/50 last:border-0">
                                      <td className="p-3">
                                        <p className="text-xs font-medium text-text-primary">{line.productName}</p>
                                        <p className="text-[10px] text-text-muted">{line.sku}</p>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center justify-center gap-1">
                                          <button onClick={() => updateOrderLine(idx, "qty", line.qty - 1)} className="p-0.5 rounded bg-surface-hover hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors">
                                            <Minus className="h-3 w-3" />
                                          </button>
                                          <input
                                            type="number"
                                            value={line.qty}
                                            onChange={(e) => updateOrderLine(idx, "qty", parseInt(e.target.value) || 1)}
                                            className="w-14 text-center text-xs font-mono font-bold bg-surface-hover border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <button onClick={() => updateOrderLine(idx, "qty", line.qty + 1)} className="p-0.5 rounded bg-surface-hover hover:bg-emerald-500/20 text-text-muted hover:text-emerald-400 transition-colors">
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                          <span className="text-xs text-text-muted">$</span>
                                          <input
                                            type="number"
                                            value={line.unitCost}
                                            onChange={(e) => updateOrderLine(idx, "unitCost", parseFloat(e.target.value) || 0)}
                                            className="w-16 text-right text-xs font-mono font-bold bg-surface-hover border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="text-xs font-mono font-semibold text-text-primary">{formatCurrency(line.qty * line.unitCost)}</span>
                                      </td>
                                      <td className="p-3">
                                        <button onClick={() => removeOrderLine(idx)} className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="border-t border-border p-3 flex items-center justify-between bg-surface-hover/30">
                                <span className="text-xs text-text-muted">{orderLines.length} items · {orderItemCount} units</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text-muted">Order Total:</span>
                                  <span className="text-lg font-bold font-heading text-text-primary">{formatCurrency(orderTotal)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Add more products */}
                          {orderLines.length > 0 && (
                            <button
                              onClick={() => setSupplierTab("products")}
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                              Add more products from catalog
                            </button>
                          )}

                          {/* Order Notes */}
                          {orderLines.length > 0 && (
                            <div>
                              <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">Order Notes (optional)</label>
                              <textarea
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                placeholder="Any special instructions for this order..."
                                rows={2}
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
                              />
                            </div>
                          )}

                          {/* Email Preview */}
                          <AnimatePresence>
                            {showEmailPreview && orderLines.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="glass-card p-4 border-primary/20 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Email Preview</h4>
                                  </div>
                                  <div className="bg-surface-hover/50 rounded-lg p-4 space-y-2 text-xs text-text-secondary font-mono">
                                    <p><span className="text-text-muted">To:</span> {selectedSupplier.email}</p>
                                    <p><span className="text-text-muted">Subject:</span> Purchase Order — WholesaleOS</p>
                                    <div className="border-t border-border/50 pt-2 mt-2">
                                      <p>Hi {selectedSupplier.contactName},</p>
                                      <br />
                                      <p>Please find below our purchase order:</p>
                                      <br />
                                      <div className="space-y-1 pl-2 border-l-2 border-primary/30">
                                        {orderLines.map((line) => (
                                          <p key={line.productId}>• {line.productName} ({line.sku}) — Qty: {line.qty} × ${line.unitCost.toFixed(2)} = {formatCurrency(line.qty * line.unitCost)}</p>
                                        ))}
                                      </div>
                                      <br />
                                      <p className="font-semibold">Total: {formatCurrency(orderTotal)}</p>
                                      {orderNotes && (
                                        <>
                                          <br />
                                          <p><span className="text-text-muted">Notes:</span> {orderNotes}</p>
                                        </>
                                      )}
                                      <br />
                                      <p>Payment Terms: {selectedSupplier.paymentTerms}</p>
                                      <p>Expected Delivery: {selectedSupplier.leadTimeDays} business days</p>
                                      <br />
                                      <p>Kind regards,</p>
                                      <p>WholesaleOS Purchasing Team</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        /* Order Sent Success */
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-4"
                        >
                          <div className="glass-card p-6 border-emerald-500/30 bg-emerald-500/5 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mx-auto mb-3">
                              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-emerald-400 mb-1">Order Sent!</h3>
                            <p className="text-sm text-text-muted">
                              Purchase order emailed to <span className="font-semibold text-text-primary">{selectedSupplier.email}</span>
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="glass-card p-3 text-center">
                              <p className="text-[10px] uppercase text-text-muted font-medium">Items</p>
                              <p className="text-lg font-bold text-text-primary">{orderLines.length}</p>
                            </div>
                            <div className="glass-card p-3 text-center">
                              <p className="text-[10px] uppercase text-text-muted font-medium">Units</p>
                              <p className="text-lg font-bold text-text-primary">{orderItemCount}</p>
                            </div>
                            <div className="glass-card p-3 text-center">
                              <p className="text-[10px] uppercase text-text-muted font-medium">Total</p>
                              <p className="text-lg font-bold text-emerald-400">{formatCurrency(orderTotal)}</p>
                            </div>
                          </div>

                          <div className="glass-card p-4">
                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Order Summary</h4>
                            {orderLines.map((line) => (
                              <div key={line.productId} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                                <span className="text-xs text-text-primary">{line.productName}</span>
                                <span className="text-xs font-mono text-text-muted">{line.qty} × ${line.unitCost.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* === STANDING ORDER TAB === */}
                  {supplierTab === "standing" && (
                    <motion.div key="standing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {selectedSupplier.standingOrder ? (
                        <>
                          {/* Standing order info */}
                          <div className="glass-card p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold text-text-primary">Standing Order</h4>
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                  selectedSupplier.standingOrder.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"
                                )}>
                                  {selectedSupplier.standingOrder.isActive ? "Active" : "Paused"}
                                </span>
                              </div>
                              <button
                                onClick={() => setEditingStanding(!editingStanding)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                {editingStanding ? "Cancel" : "Edit"}
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-2 rounded-lg bg-surface-hover/50">
                                <p className="text-[10px] text-text-muted uppercase">Frequency</p>
                                <p className="text-sm font-semibold text-text-primary">{selectedSupplier.standingOrder.frequency}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-surface-hover/50">
                                <p className="text-[10px] text-text-muted uppercase">Day</p>
                                <p className="text-sm font-semibold text-text-primary">{selectedSupplier.standingOrder.dayOfWeek}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-surface-hover/50">
                                <p className="text-[10px] text-text-muted uppercase">Next Due</p>
                                <p className="text-sm font-semibold text-primary">{formatDate(selectedSupplier.standingOrder.nextDue)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Saved toast */}
                          <AnimatePresence>
                            {standingSaved && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-400">Standing order updated — next order will use new quantities</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Standing order items */}
                          <div className="glass-card overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3">Product</th>
                                  <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[100px]">Default Qty</th>
                                  <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Unit Cost</th>
                                  <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Total</th>
                                  {editingStanding && <th className="p-3 w-[40px]"></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {standingLines.map((line, idx) => (
                                  <tr key={line.productId} className="border-b border-border/50 last:border-0">
                                    <td className="p-3">
                                      <p className="text-xs font-medium text-text-primary">{line.productName}</p>
                                      <p className="text-[10px] text-text-muted">{line.sku}</p>
                                    </td>
                                    <td className="p-3">
                                      {editingStanding ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <button onClick={() => updateStandingQty(idx, line.defaultQty - 1)} className="p-0.5 rounded bg-surface-hover hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors">
                                            <Minus className="h-3 w-3" />
                                          </button>
                                          <input
                                            type="number"
                                            value={line.defaultQty}
                                            onChange={(e) => updateStandingQty(idx, parseInt(e.target.value) || 1)}
                                            className="w-14 text-center text-xs font-mono font-bold bg-surface-hover border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                          <button onClick={() => updateStandingQty(idx, line.defaultQty + 1)} className="p-0.5 rounded bg-surface-hover hover:bg-emerald-500/20 text-text-muted hover:text-emerald-400 transition-colors">
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-mono font-semibold text-text-primary text-center block">{line.defaultQty}</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className="text-xs font-mono text-text-muted">${line.unitCost.toFixed(2)}</span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className="text-xs font-mono font-semibold text-text-primary">{formatCurrency(line.defaultQty * line.unitCost)}</span>
                                    </td>
                                    {editingStanding && (
                                      <td className="p-3">
                                        <button onClick={() => removeStandingLine(idx)} className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="border-t border-border p-3 flex items-center justify-between bg-surface-hover/30">
                              <span className="text-xs text-text-muted">{standingLines.length} items</span>
                              <span className="text-sm font-bold text-text-primary">
                                {formatCurrency(standingLines.reduce((s, l) => s + l.defaultQty * l.unitCost, 0))}
                              </span>
                            </div>
                          </div>

                          {/* Add product to standing order */}
                          {editingStanding && (
                            <div>
                              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Add Product to Standing Order</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {getSupplierProducts(selectedSupplier.name)
                                  .filter(p => !standingLines.find(l => l.productId === p.id))
                                  .map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => addToStanding(p)}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors text-left"
                                    >
                                      <Plus className="h-3 w-3 text-primary shrink-0" />
                                      <span className="text-xs text-text-primary flex-1 truncate">{p.name}</span>
                                      <span className="text-[10px] text-text-muted">{p.sku}</span>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Save / Use standing order */}
                          <div className="flex items-center gap-3">
                            {editingStanding && (
                              <button
                                onClick={saveStandingOrder}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                              >
                                <Check className="h-4 w-4" />
                                Save Changes
                              </button>
                            )}
                            {!editingStanding && (
                              <button
                                onClick={startOrderFromStanding}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Create Order from Standing
                              </button>
                            )}
                          </div>

                          {/* Info about auto-email */}
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-blue-400">Auto-Email on Confirm</p>
                              <p className="text-[10px] text-text-muted mt-0.5">
                                When you confirm an order, it automatically emails {selectedSupplier.email} with the full order details. If you change quantities from the standing order, the email reflects the updated amounts.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 glass-card">
                          <Repeat className="h-8 w-8 text-text-muted mx-auto mb-3" />
                          <p className="text-sm text-text-muted">No standing order set up for this supplier.</p>
                          <p className="text-xs text-text-muted mt-1">Create an order first, then save it as a standing order template.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Panel Footer */}
              {supplierTab === "order" && !orderSent && orderLines.length > 0 && (
                <div className="shrink-0 border-t border-border p-4 flex items-center gap-3">
                  <button
                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-text-secondary bg-surface-hover hover:bg-surface-hover/80 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {showEmailPreview ? "Hide" : "Preview"} Email
                  </button>
                  <button
                    onClick={confirmOrder}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="h-4 w-4" />
                    Confirm & Email Order to {selectedSupplier.contactName}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====== QUICK ORDER MODAL ====== */}
      <AnimatePresence>
        {quickOrderProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setQuickOrderProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-bg-primary border border-border rounded-2xl shadow-2xl z-[61] overflow-hidden"
            >
              {!quickOrderSent ? (
                <>
                  <div className="p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">Quick Order</h3>
                        <p className="text-xs text-text-muted">{quickOrderProduct.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{quickOrderProduct.name}</p>
                        <p className="text-[10px] text-text-muted">{quickOrderProduct.sku} · Supplier: {quickOrderProduct.supplier}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">Quantity</label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setQuickOrderQty(q => Math.max(1, q - 10))} className="p-1.5 rounded-lg bg-surface-hover hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            value={quickOrderQty}
                            onChange={(e) => setQuickOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 text-center text-sm font-mono font-bold bg-surface-hover border border-border rounded-lg px-2 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => setQuickOrderQty(q => q + 10)} className="p-1.5 rounded-lg bg-surface-hover hover:bg-emerald-500/20 text-text-muted hover:text-emerald-400 transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider block mb-1">Est. Total</label>
                        <div className="px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm font-mono font-bold text-text-primary text-center">
                          {formatCurrency(quickOrderQty * quickOrderProduct.wholesalePrice * 0.6)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-text-muted">
                        Order will be emailed to <span className="font-semibold text-text-secondary">{quickOrderProduct.supplier}</span> on confirm
                      </p>
                    </div>
                  </div>

                  <div className="p-5 border-t border-border flex items-center gap-3">
                    <button onClick={() => setQuickOrderProduct(null)} className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary bg-surface-hover rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={sendQuickOrder}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <Send className="h-4 w-4" />
                      Confirm & Send Order
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mx-auto mb-3">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-1">Order Sent!</h3>
                  <p className="text-xs text-text-muted">
                    {quickOrderQty}× {quickOrderProduct.name} ordered from {quickOrderProduct.supplier}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
