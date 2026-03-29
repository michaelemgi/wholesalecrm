"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, DollarSign, Clock, Package,
  Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus,
  ArrowUpDown, Filter, Download, X, Trash2, Loader2, FileText,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import BulkReportModal, { BulkReportConfig } from "@/components/BulkReportModal";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const statusColors: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400",
  Confirmed: "bg-blue-500/20 text-blue-400",
  Processing: "bg-indigo-500/20 text-indigo-400",
  Picking: "bg-purple-500/20 text-purple-400",
  Packed: "bg-amber-500/20 text-amber-400",
  Shipped: "bg-cyan-500/20 text-cyan-400",
  Delivered: "bg-emerald-500/20 text-emerald-400",
  Returned: "bg-red-500/20 text-red-400",
};

const paymentColors: Record<string, string> = {
  Unpaid: "bg-gray-500/20 text-gray-400",
  Partial: "bg-amber-500/20 text-amber-400",
  Paid: "bg-emerald-500/20 text-emerald-400",
  Overdue: "bg-red-500/20 text-red-400",
};

const allStatuses = ["All", "Draft", "Confirmed", "Processing", "Picking", "Packed", "Shipped", "Delivered", "Returned"];
const allPaymentStatuses = ["All", "Unpaid", "Partial", "Paid", "Overdue"];

export default function SalesOrdersPage() {
  const { data: mockOrders = [], mutate: mutateOrders } = useSWR<any[]>('/api/orders', fetcher);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const perPage = 10;

  const orderReportConfig: BulkReportConfig = useMemo(() => ({
    title: "Sales Order Report",
    entityName: "orders",
    buildReport: ({ currentDateRange, compareDateRange, hasCompare }) => {
      const curOrders = currentDateRange.startDate ? mockOrders.filter((o: any) => isInRange(o.createdAt, currentDateRange)) : mockOrders;
      const prevOrders = hasCompare ? mockOrders.filter((o: any) => isInRange(o.createdAt, compareDateRange)) : [];

      const pctChange = (c: number, p: number) => { if (!p) return c > 0 ? "+100%" : "—"; const ch = ((c - p) / p) * 100; return `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`; };

      // Group by customer
      const custStats: Record<string, { name: string; orders: number; revenue: number; items: number }> = {};
      const prevCustStats: Record<string, { orders: number; revenue: number }> = {};
      curOrders.forEach((o: any) => {
        if (!custStats[o.customerName]) custStats[o.customerName] = { name: o.customerName, orders: 0, revenue: 0, items: 0 };
        custStats[o.customerName].orders += 1;
        custStats[o.customerName].revenue += o.total;
        custStats[o.customerName].items += o.items?.length || 0;
      });
      if (hasCompare) {
        prevOrders.forEach((o: any) => {
          if (!prevCustStats[o.customerName]) prevCustStats[o.customerName] = { orders: 0, revenue: 0 };
          prevCustStats[o.customerName].orders += 1;
          prevCustStats[o.customerName].revenue += o.total;
        });
      }

      const rows = Object.values(custStats).map(s => {
        const prev = prevCustStats[s.name];
        return {
          customer: s.name, orders: s.orders, revenue: `$${s.revenue.toFixed(2)}`,
          avgOrder: `$${(s.revenue / s.orders).toFixed(2)}`, items: s.items,
          ...(hasCompare ? {
            prevOrders: prev?.orders || 0, prevRevenue: `$${(prev?.revenue || 0).toFixed(2)}`,
            orderChange: pctChange(s.orders, prev?.orders || 0), revenueChange: pctChange(s.revenue, prev?.revenue || 0),
          } : {}),
        };
      }).sort((a, b) => parseFloat(b.revenue.replace("$", "")) - parseFloat(a.revenue.replace("$", "")));

      const totalRev = curOrders.reduce((s: number, o: any) => s + o.total, 0);
      const prevTotalRev = hasCompare ? prevOrders.reduce((s: number, o: any) => s + o.total, 0) : 0;

      const columns = [
        { key: "customer", label: "Customer" }, { key: "orders", label: "Orders" },
        { key: "revenue", label: "Revenue" }, { key: "avgOrder", label: "Avg Order" }, { key: "items", label: "Items" },
        ...(hasCompare ? [
          { key: "prevOrders", label: "Prev Orders" }, { key: "prevRevenue", label: "Prev Revenue" },
          { key: "orderChange", label: "Order Change" }, { key: "revenueChange", label: "Rev Change" },
        ] : []),
      ];

      return {
        rows, columns,
        summary: [
          { label: "Total Orders", current: String(curOrders.length), ...(hasCompare ? { previous: String(prevOrders.length), change: pctChange(curOrders.length, prevOrders.length) } : {}) },
          { label: "Total Revenue", current: `$${totalRev.toFixed(0)}`, ...(hasCompare ? { previous: `$${prevTotalRev.toFixed(0)}`, change: pctChange(totalRev, prevTotalRev) } : {}) },
          { label: "Unique Customers", current: String(Object.keys(custStats).length) },
        ],
      };
    },
  }), [mockOrders]);

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      const matchesSearch =
        !searchQuery.trim() ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === "All" || order.paymentStatus === paymentFilter;
      const matchesDate = !dateRange.startDate || isInRange(order.createdAt, dateRange);
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [searchQuery, statusFilter, paymentFilter, dateRange, mockOrders]);

  const sortedOrders = useMemo(() => {
    const arr = [...filteredOrders];
    arr.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "orderNumber": aVal = a.orderNumber; bVal = b.orderNumber; break;
        case "customerName": aVal = a.customerName?.toLowerCase(); bVal = b.customerName?.toLowerCase(); break;
        case "total": aVal = a.total; bVal = b.total; break;
        case "createdAt": aVal = a.createdAt; bVal = b.createdAt; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "items": aVal = (a.items || []).length; bVal = (b.items || []).length; break;
        default: aVal = a.createdAt; bVal = b.createdAt;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredOrders, sortField, sortDir]);

  const totalPages = Math.ceil(sortedOrders.length / perPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  function SortHeader({ field, label, align }: { field: string; label: string; align?: string }) {
    const active = sortField === field;
    return (
      <th
        onClick={() => { if (active) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir(field === "createdAt" || field === "total" ? "desc" : "asc"); } }}
        className={cn("py-3 px-4 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors select-none", align === "right" ? "text-right" : "text-left", active ? "text-primary" : "text-text-muted")}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
        </span>
      </th>
    );
  }

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = filteredOrders.filter(
    (o) => !["Delivered", "Returned"].includes(o.status)
  ).length;
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  const kpis = [
    {
      label: "Total Orders",
      value: filteredOrders.length.toString(),
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Orders",
      value: pendingOrders.toString(),
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(Math.round(avgOrderValue)),
      icon: Package,
      color: "text-accent",
      bg: "bg-[#6366f120]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Sales Orders
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
            <FileText className="h-4 w-4" /> Report
          </button>
          <button onClick={() => exportToCSV(filteredOrders.map(o => ({ orderNumber: o.orderNumber, customer: o.customerName, status: o.status, items: o.items.length, total: o.total, paymentStatus: o.paymentStatus, shipping: o.shippingMethod, date: o.createdAt })), 'sales_orders', [{ key: 'orderNumber', label: 'Order #' }, { key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'items', label: 'Items Count' }, { key: 'total', label: 'Total' }, { key: 'paymentStatus', label: 'Payment Status' }, { key: 'shipping', label: 'Shipping' }, { key: 'date', label: 'Date' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Create Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
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
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    kpi.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text-primary">
                {kpi.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-3"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {allStatuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {allPaymentStatuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Payments" : s}
              </option>
            ))}
          </select>

          <select
            value={`${sortField}-${sortDir}`}
            onChange={(e) => { const [f, d] = e.target.value.split("-"); setSortField(f); setSortDir(d as "asc" | "desc"); }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="total-desc">Total High–Low</option>
            <option value="total-asc">Total Low–High</option>
            <option value="customerName-asc">Customer A–Z</option>
            <option value="customerName-desc">Customer Z–A</option>
            <option value="orderNumber-desc">Order # Desc</option>
          </select>
        </div>

        <span className="text-xs text-text-muted ml-auto">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <SortHeader field="orderNumber" label="Order #" />
                <SortHeader field="customerName" label="Customer" />
                <SortHeader field="status" label="Status" />
                <SortHeader field="items" label="Items" align="right" />
                <SortHeader field="total" label="Total" align="right" />
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Payment</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Shipping</th>
                <SortHeader field="createdAt" label="Date" />
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-medium text-primary">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {order.customerName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-muted">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="py-3 px-4 font-bold text-text-primary">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        paymentColors[order.paymentStatus]
                      )}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">
                    {order.shippingMethod}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-text-muted">
            {sortedOrders.length === 0
              ? "No orders found"
              : `Showing ${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, sortedOrders.length)} of ${sortedOrders.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-text-muted" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1
              )
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                typeof p === "string" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-text-muted text-xs">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
                      currentPage === p
                        ? "bg-primary text-white"
                        : "text-text-muted hover:bg-surface-hover"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateOrderModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              mutateOrders();
              setShowCreateModal(false);
            }}
          />
        )}
        {showReportModal && (
          <BulkReportModal config={orderReportConfig} onClose={() => setShowReportModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   CREATE ORDER MODAL
   ================================================================ */

interface LineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const TAX_RATE = 0.085;

const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "COD"];
const SHIPPING_METHODS = [
  "UPS Standard",
  "FedEx Ground",
  "LTL Freight",
  "Local Delivery",
  "Customer Pickup",
];

function CreateOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { data: customers = [] } = useSWR<any[]>("/api/customers", fetcher);
  const { data: products = [] } = useSWR<any[]>("/api/products", fetcher);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productId: "", productName: "", sku: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [shippingMethod, setShippingMethod] = useState("UPS Standard");
  const [assignedRep, setAssignedRep] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shippingEstimate = shippingMethod === "Customer Pickup" ? 0 : subtotal > 0 ? 50 : 0;
  const total = Math.round((subtotal + tax + shippingEstimate) * 100) / 100;

  const handleCustomerChange = useCallback(
    (id: string) => {
      const c = customers.find((c: any) => c.id === id);
      setCustomerId(id);
      setCustomerName(c?.companyName ?? c?.name ?? "");
    },
    [customers]
  );

  const handleProductChange = useCallback(
    (index: number, productId: string) => {
      const p = products.find((p: any) => p.id === productId);
      if (!p) return;
      setLineItems((prev) => {
        const next = [...prev];
        const qty = next[index].quantity || 1;
        next[index] = {
          productId: p.id,
          productName: p.name,
          sku: p.sku ?? "",
          quantity: qty,
          unitPrice: p.wholesalePrice ?? p.price ?? 0,
          total: qty * (p.wholesalePrice ?? p.price ?? 0),
        };
        return next;
      });
    },
    [products]
  );

  const handleQtyChange = (index: number, qty: number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: qty,
        total: Math.round(qty * next[index].unitPrice * 100) / 100,
      };
      return next;
    });
  };

  const addLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      { productId: "", productName: "", sku: "", quantity: 1, unitPrice: 0, total: 0 },
    ]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const canSubmit =
    customerId &&
    lineItems.length > 0 &&
    lineItems.every((li) => li.productId && li.quantity > 0) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const ts = Date.now();
      const orderNumber = `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const body = {
        id: `ord-${ts}`,
        orderNumber,
        customerId,
        customerName,
        status: "Draft",
        subtotal,
        tax,
        shipping: shippingEstimate,
        discount: 0,
        total,
        paymentTerms,
        paymentStatus: "Unpaid",
        shippingMethod,
        assignedRep,
        notes,
        items: lineItems.map((li, i) => ({
          id: `oi-${ts}-${String(i + 1).padStart(2, "0")}`,
          productId: li.productId,
          productName: li.productName,
          sku: li.sku,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          total: li.total,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create order");
      onCreated();
    } catch (err) {
      console.error(err);
      alert("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-text-primary">
                  Create Sales Order
                </h2>
                <p className="text-xs text-text-muted">
                  Add a new order with line items and shipping details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customer & Rep row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName ?? c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Assigned Rep
                </label>
                <input
                  type="text"
                  value={assignedRep}
                  onChange={(e) => setAssignedRep(e.target.value)}
                  placeholder="e.g. Adam Groogan"
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Line Items *
                </label>
                <button
                  onClick={addLineItem}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>

              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_80px_100px_100px_36px] gap-2 text-[10px] font-medium text-text-muted uppercase tracking-wider px-1">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span>Line Total</span>
                  <span />
                </div>

                {lineItems.map((li, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_80px_100px_100px_36px] gap-2 items-center"
                  >
                    <select
                      value={li.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
                    >
                      <option value="">Select product...</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={li.quantity}
                      onChange={(e) =>
                        handleQtyChange(idx, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="h-9 flex items-center px-2 rounded-lg bg-surface-hover/50 text-sm text-text-secondary">
                      {formatCurrency(li.unitPrice)}
                    </div>
                    <div className="h-9 flex items-center px-2 rounded-lg bg-surface-hover/50 text-sm font-medium text-text-primary">
                      {formatCurrency(li.total)}
                    </div>
                    <button
                      onClick={() => removeLineItem(idx)}
                      disabled={lineItems.length <= 1}
                      className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Shipping row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Shipping Method
                </label>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {SHIPPING_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional order notes..."
                rows={3}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Totals */}
            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="text-text-secondary">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Tax (8.5%)</span>
                <span className="text-text-secondary">{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Shipping Estimate</span>
                <span className="text-text-secondary">{formatCurrency(shippingEstimate)}</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between text-base font-bold">
                <span className="text-text-primary">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Order
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
