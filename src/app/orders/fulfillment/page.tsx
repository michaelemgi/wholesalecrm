"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, CheckCircle2, RotateCcw,
  MapPin, Clock, Calendar, ExternalLink,
  ArrowRight, ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";

// -- Mock Data --

const shipments = [
  {
    id: "shp-001",
    orderId: "ORD-2801",
    customer: "Pacific Foods Distribution",
    trackingNumber: "TRK100042",
    carrier: "FedEx Ground",
    status: "In Transit",
    shipped: "2026-03-26",
    estimatedDelivery: "2026-03-29",
  },
  {
    id: "shp-002",
    orderId: "ORD-2805",
    customer: "Metro Building Supply",
    trackingNumber: "TRK100089",
    carrier: "UPS Standard",
    status: "Out for Delivery",
    shipped: "2026-03-25",
    estimatedDelivery: "2026-03-28",
  },
  {
    id: "shp-003",
    orderId: "ORD-2810",
    customer: "Titan Construction Materials",
    trackingNumber: "TRK100127",
    carrier: "LTL Freight",
    status: "In Transit",
    shipped: "2026-03-27",
    estimatedDelivery: "2026-03-31",
  },
  {
    id: "shp-004",
    orderId: "ORD-2812",
    customer: "Heritage Restaurant Group",
    trackingNumber: "TRK100145",
    carrier: "Local Delivery",
    status: "Delivered",
    shipped: "2026-03-26",
    estimatedDelivery: "2026-03-28",
  },
  {
    id: "shp-005",
    orderId: "ORD-2818",
    customer: "Green Valley Organics",
    trackingNumber: "TRK100183",
    carrier: "FedEx Ground",
    status: "In Transit",
    shipped: "2026-03-27",
    estimatedDelivery: "2026-03-30",
  },
  {
    id: "shp-006",
    orderId: "ORD-2822",
    customer: "Coastal Seafood Co.",
    trackingNumber: "TRK100201",
    carrier: "Cold Chain Express",
    status: "Out for Delivery",
    shipped: "2026-03-27",
    estimatedDelivery: "2026-03-28",
  },
  {
    id: "shp-007",
    orderId: "ORD-2825",
    customer: "Sunrise Bakery Group",
    trackingNumber: "TRK100219",
    carrier: "UPS Standard",
    status: "Delivered",
    shipped: "2026-03-25",
    estimatedDelivery: "2026-03-27",
  },
  {
    id: "shp-008",
    orderId: "ORD-2828",
    customer: "Midwest Grain Traders",
    trackingNumber: "TRK100234",
    carrier: "LTL Freight",
    status: "Picked Up",
    shipped: "2026-03-28",
    estimatedDelivery: "2026-04-02",
  },
];

const deliverySchedule: Record<string, { customer: string; orderId: string }[]> = {
  Mon: [
    { customer: "Pacific Foods Distribution", orderId: "ORD-2832" },
    { customer: "Sunrise Bakery Group", orderId: "ORD-2836" },
  ],
  Tue: [
    { customer: "Titan Construction Materials", orderId: "ORD-2840" },
  ],
  Wed: [
    { customer: "Heritage Restaurant Group", orderId: "ORD-2845" },
    { customer: "Green Valley Organics", orderId: "ORD-2848" },
    { customer: "Blue Ridge Beverages", orderId: "ORD-2850" },
  ],
  Thu: [
    { customer: "Coastal Seafood Co.", orderId: "ORD-2854" },
    { customer: "Pinnacle Hospitality Group", orderId: "ORD-2857" },
  ],
  Fri: [
    { customer: "Metro Building Supply", orderId: "ORD-2860" },
  ],
};

const returns = [
  {
    id: "ret-001",
    rmaNumber: "RMA-0042",
    orderId: "ORD-2790",
    customer: "Valley Produce Partners",
    reason: "Damaged in transit",
    status: "Pending Inspection",
    amount: 1240,
    createdAt: "2026-03-27",
  },
  {
    id: "ret-002",
    rmaNumber: "RMA-0043",
    orderId: "ORD-2785",
    customer: "Redwood Paper Products",
    reason: "Wrong item shipped",
    status: "Approved",
    amount: 890,
    createdAt: "2026-03-26",
  },
  {
    id: "ret-003",
    rmaNumber: "RMA-0044",
    orderId: "ORD-2778",
    customer: "Atlas Hardware Wholesale",
    reason: "Quality issue",
    status: "Refund Issued",
    amount: 2150,
    createdAt: "2026-03-25",
  },
  {
    id: "ret-004",
    rmaNumber: "RMA-0045",
    orderId: "ORD-2802",
    customer: "Continental Packaging",
    reason: "Order duplication",
    status: "Pending Inspection",
    amount: 3400,
    createdAt: "2026-03-28",
  },
];

const shipmentStatusColors: Record<string, string> = {
  "Picked Up": "bg-blue-500/20 text-blue-400",
  "In Transit": "bg-amber-500/20 text-amber-400",
  "Out for Delivery": "bg-cyan-500/20 text-cyan-400",
  Delivered: "bg-emerald-500/20 text-emerald-400",
};

const returnStatusColors: Record<string, string> = {
  "Pending Inspection": "bg-amber-500/20 text-amber-400",
  Approved: "bg-blue-500/20 text-blue-400",
  "Refund Issued": "bg-emerald-500/20 text-emerald-400",
};

type SortField = "orderId" | "customer" | "carrier" | "status" | "shipped" | "estimatedDelivery";
type SortDir = "asc" | "desc";

export default function FulfillmentPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [sortField, setSortField] = useState<SortField>("shipped");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );

  const filteredShipments = dateRange.startDate
    ? shipments.filter((s) => isInRange(s.shipped, dateRange))
    : shipments;

  const sortedShipments = useMemo(() => {
    return [...filteredShipments].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredShipments, sortField, sortDir]);

  const readyToShip = 8;
  const inTransit = shipments.filter(
    (s) => s.status === "In Transit" || s.status === "Picked Up"
  ).length;
  const deliveredToday = shipments.filter(
    (s) => s.status === "Delivered"
  ).length;
  const returnsPending = returns.filter(
    (r) => r.status === "Pending Inspection"
  ).length;

  const kpis = [
    {
      label: "Ready to Ship",
      value: readyToShip,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "In Transit",
      value: inTransit,
      icon: Truck,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Delivered Today",
      value: deliveredToday,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Returns Pending",
      value: returnsPending,
      icon: RotateCcw,
      color: "text-danger",
      bg: "bg-danger/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Fulfillment Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Monitor shipments, deliveries, and returns in real time
          </p>
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

      {/* Shipment Tracking */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-sm font-semibold text-text-primary">
            Shipment Tracking
          </h2>
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
                <option value="orderId-asc">Order (A-Z)</option>
              </select>
            </div>
            <span className="text-xs text-text-muted">
              {sortedShipments.length} active shipments
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Tracking #
                </th>
                <SortHeader label="Order" field="orderId" />
                <SortHeader label="Customer" field="customer" />
                <SortHeader label="Carrier" field="carrier" />
                <SortHeader label="Status" field="status" />
                <SortHeader label="Shipped" field="shipped" />
                <SortHeader label="Est. Delivery" field="estimatedDelivery" />
              </tr>
            </thead>
            <tbody>
              {sortedShipments.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.03 }}
                  className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-primary">
                        {s.trackingNumber}
                      </span>
                      <ExternalLink className="h-3 w-3 text-text-muted cursor-pointer hover:text-primary" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-text-primary">
                    {s.orderId}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {s.customer}
                  </td>
                  <td className="py-3 px-4 text-text-muted">{s.carrier}</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        shipmentStatusColors[s.status] || "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">
                    {formatDate(s.shipped)}
                  </td>
                  <td className="py-3 px-4 text-text-muted text-xs">
                    {formatDate(s.estimatedDelivery)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delivery Schedule + Returns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Delivery Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-2 glass-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">
              Delivery Schedule
            </h2>
            <span className="ml-auto text-xs text-text-muted">
              Week of Mar 30 - Apr 3
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(deliverySchedule).map(([day, deliveries], dayIdx) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + dayIdx * 0.05 }}
                  className="space-y-2"
                >
                  <div className="text-center">
                    <p className="text-xs font-semibold text-text-primary uppercase">
                      {day}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Mar {30 + dayIdx > 31 ? `Apr ${30 + dayIdx - 31}` : 30 + dayIdx}
                    </p>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {deliveries.map((d, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-surface-hover/60 border border-border/50 hover:border-border-light transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-medium text-text-primary truncate">
                          {d.customer}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Package className="h-2.5 w-2.5 text-text-muted" />
                          <span className="text-[10px] text-text-muted">
                            {d.orderId}
                          </span>
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-danger" />
            <h2 className="font-heading text-sm font-semibold text-text-primary">
              Returns
            </h2>
            <span className="ml-auto text-xs text-text-muted">
              {returns.length} total
            </span>
          </div>
          <div className="p-4 space-y-3">
            {returns.map((ret, i) => (
              <motion.div
                key={ret.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-danger">
                    {ret.rmaNumber}
                  </span>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      returnStatusColors[ret.status] || "bg-gray-500/20 text-gray-400"
                    )}
                  >
                    {ret.status}
                  </span>
                </div>
                <p className="text-xs font-medium text-text-primary truncate">
                  {ret.customer}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-text-muted">
                    {ret.reason}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">
                    {formatCurrency(ret.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-2.5 w-2.5 text-text-muted" />
                  <span className="text-[10px] text-text-muted">
                    {formatDate(ret.createdAt)}
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 text-text-muted ml-1" />
                  <span className="text-[10px] text-text-muted">
                    {ret.orderId}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
