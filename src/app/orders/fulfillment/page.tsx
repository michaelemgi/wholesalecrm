// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Package, Truck, CheckCircle2, RotateCcw,
  Calendar, ExternalLink,
  ArrowUpDown, ChevronUp, ChevronDown, Clock, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";
import { fetcher } from "@/lib/fetcher";

const shipmentStatusColors: Record<string, string> = {
  "Picked Up": "bg-blue-500/20 text-blue-400",
  "In Transit": "bg-amber-500/20 text-amber-400",
  "Out for Delivery": "bg-cyan-500/20 text-cyan-400",
  Delivered: "bg-emerald-500/20 text-emerald-400",
  Exception: "bg-red-500/20 text-red-400",
};

const returnStatusColors: Record<string, string> = {
  Pending: "bg-amber-500/20 text-amber-400",
  Approved: "bg-blue-500/20 text-blue-400",
  "Refund Issued": "bg-emerald-500/20 text-emerald-400",
  Rejected: "bg-red-500/20 text-red-400",
  Closed: "bg-gray-500/20 text-gray-400",
};

type SortField = "orderId" | "customer" | "carrier" | "status" | "shipped" | "estimatedDelivery";
type SortDir = "asc" | "desc";

export default function FulfillmentPage() {
  const { data: shipmentsRaw } = useSWR("/api/shipments", fetcher);
  const { data: returnsRaw } = useSWR("/api/returns", fetcher);

  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [sortField, setSortField] = useState<SortField>("shipped");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Normalize shipment data from API
  const shipments = useMemo(() => {
    if (!shipmentsRaw) return [];
    return shipmentsRaw.map((s: any) => ({
      id: s.id,
      orderId: s.order?.orderNumber || s.orderId,
      customer: s.customer?.name || "Unknown",
      trackingNumber: s.trackingNumber,
      carrier: s.carrier,
      status: s.status,
      shipped: s.shippedAt || "",
      estimatedDelivery: s.estimatedDelivery || "",
    }));
  }, [shipmentsRaw]);

  // Normalize returns from API
  const returns = useMemo(() => {
    if (!returnsRaw) return [];
    return returnsRaw.map((r: any) => ({
      id: r.id,
      rmaNumber: r.rmaNumber,
      orderId: r.order?.orderNumber || r.orderId,
      customer: r.customer?.name || "Unknown",
      reason: r.reason,
      status: r.status,
      amount: r.refundAmount || 0,
      createdAt: r.createdAt,
    }));
  }, [returnsRaw]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortField }) => (
    <th
      onClick={() => toggleSort(field)}
      className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-text-secondary transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );

  const filteredShipments = dateRange.startDate
    ? shipments.filter((s: any) => isInRange(s.shipped, dateRange))
    : shipments;

  const sortedShipments = useMemo(() => {
    return [...filteredShipments].sort((a: any, b: any) => {
      const aVal = (a[sortField] || "").toString();
      const bVal = (b[sortField] || "").toString();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredShipments, sortField, sortDir]);

  // Build delivery schedule from upcoming shipments
  const deliverySchedule = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const schedule: Record<string, { customer: string; orderId: string }[]> = {};
    days.forEach((d) => (schedule[d] = []));

    shipments
      .filter((s: any) => s.status !== "Delivered" && s.estimatedDelivery)
      .forEach((s: any) => {
        const d = new Date(s.estimatedDelivery);
        const dayIdx = d.getDay(); // 0=Sun, 1=Mon...
        if (dayIdx >= 1 && dayIdx <= 5) {
          schedule[days[dayIdx - 1]].push({ customer: s.customer, orderId: s.orderId });
        }
      });
    return schedule;
  }, [shipments]);

  const inTransit = shipments.filter((s: any) => s.status === "In Transit" || s.status === "Picked Up").length;
  const delivered = shipments.filter((s: any) => s.status === "Delivered").length;
  const outForDelivery = shipments.filter((s: any) => s.status === "Out for Delivery").length;
  const returnsPending = returns.filter((r: any) => r.status === "Pending").length;

  const kpis = [
    { label: "Out for Delivery", value: outForDelivery, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "In Transit", value: inTransit, icon: Truck, color: "text-warning", bg: "bg-warning/10" },
    { label: "Delivered", value: delivered, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Returns Pending", value: returnsPending, icon: RotateCcw, color: "text-danger", bg: "bg-danger/10" },
  ];

  if (!shipmentsRaw || !returnsRaw) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-surface-hover rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="glass-card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Fulfillment Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Monitor shipments, deliveries, and returns in real time</p>
        </div>
        <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />
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
              className="glass-card p-5 hover:border-border-light transition-colors"
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

      {/* Shipment Tracking */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold text-text-primary">Shipment Tracking</h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3 w-3 text-text-muted" />
              <select
                value={`${sortField}-${sortDir}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split("-") as [SortField, SortDir];
                  setSortField(f);
                  setSortDir(d);
                }}
                className="text-xs bg-surface-hover border border-border rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="shipped-desc">Shipped (Newest)</option>
                <option value="shipped-asc">Shipped (Oldest)</option>
                <option value="estimatedDelivery-asc">Est. Delivery (Soonest)</option>
                <option value="estimatedDelivery-desc">Est. Delivery (Latest)</option>
                <option value="customer-asc">Customer (A-Z)</option>
                <option value="customer-desc">Customer (Z-A)</option>
                <option value="status-asc">Status (A-Z)</option>
                <option value="carrier-asc">Carrier (A-Z)</option>
              </select>
            </div>
            <span className="text-xs text-text-muted">{sortedShipments.length} shipments</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Tracking #</th>
                <SortHeader label="Order" field="orderId" />
                <SortHeader label="Customer" field="customer" />
                <SortHeader label="Carrier" field="carrier" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Shipped" field="shipped" />
                <SortHeader label="Est. Delivery" field="estimatedDelivery" />
              </tr>
            </thead>
            <tbody>
              {sortedShipments.map((s: any, i: number) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-primary">{s.trackingNumber}</span>
                      <ExternalLink className="h-3 w-3 text-text-muted cursor-pointer hover:text-primary" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-text-primary">{s.orderId}</td>
                  <td className="py-3 px-4 text-text-secondary">{s.customer}</td>
                  <td className="py-3 px-4 text-text-muted">{s.carrier}</td>
                  <td className="py-3 px-4">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", shipmentStatusColors[s.status] || "bg-gray-500/20 text-gray-400")}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">{s.shipped ? formatDate(s.shipped) : "—"}</td>
                  <td className="py-3 px-4 text-text-muted text-xs">{s.estimatedDelivery ? formatDate(s.estimatedDelivery) : "—"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delivery Schedule + Returns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Delivery Schedule */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">Delivery Schedule</h2>
            <span className="ml-auto text-xs text-text-muted">Upcoming deliveries</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(deliverySchedule).map(([day, deliveries], dayIdx) => (
                <motion.div key={day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + dayIdx * 0.05 }} className="space-y-2">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-text-primary uppercase">{day}</p>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {deliveries.map((d: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-surface-hover/60 border border-border/50 hover:border-border-light transition-colors cursor-pointer">
                        <p className="text-xs font-medium text-text-primary truncate">{d.customer}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Package className="h-2.5 w-2.5 text-text-muted" />
                          <span className="text-[10px] text-text-muted">{d.orderId}</span>
                        </div>
                      </div>
                    ))}
                    {deliveries.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-[10px] text-text-muted border border-dashed border-border/50 rounded-lg">
                        No deliveries
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Returns */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-danger" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">Returns</h2>
            <span className="ml-auto text-xs text-text-muted">{returns.length} total</span>
          </div>
          <div className="p-4 space-y-3">
            {returns.map((ret: any, i: number) => (
              <motion.div
                key={ret.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-danger">{ret.rmaNumber}</span>
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", returnStatusColors[ret.status] || "bg-gray-500/20 text-gray-400")}>
                    {ret.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-text-primary truncate">{ret.customer}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-text-muted">{ret.reason}</span>
                  {ret.amount > 0 && <span className="text-xs font-semibold text-text-primary">{formatCurrency(ret.amount)}</span>}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-2.5 w-2.5 text-text-muted" />
                  <span className="text-[10px] text-text-muted">{formatDate(ret.createdAt)}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-text-muted ml-1" />
                  <span className="text-[10px] text-text-muted">{ret.orderId}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
