// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, Mail, Download, Send, Users, Calendar,
  ChevronDown, ChevronUp, Check, AlertCircle, FileText,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import type { Product } from "@/types";

// --- Mock Price Change Data ---
interface PriceChange {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  pctChange: number;
  dateChanged: string;
  effectiveFrom: string;
  affectedCustomers: AffectedCustomer[];
  notified: boolean;
}

interface AffectedCustomer {
  id: string;
  name: string;
  email: string;
  rep: string;
  customPrice: number | null;
}

function generateMockPriceChanges(): PriceChange[] {
  return [
    {
      id: "pc-1",
      productId: "prod-001",
      productName: "Premium Kraft Corrugated Boxes (24x18x12)",
      sku: "PKG-KB-2412",
      category: "Packaging",
      oldPrice: 4.25,
      newPrice: 4.75,
      pctChange: 11.76,
      dateChanged: "2026-03-28",
      effectiveFrom: "2026-04-07",
      notified: false,
      affectedCustomers: [
        { id: "cust-001", name: "Metro Foods Distribution", email: "purchasing@metrofoods.com", rep: "Adam Groogan", customPrice: 4.10 },
        { id: "cust-003", name: "Pacific Coast Imports", email: "orders@pacificcoast.com", rep: "Sarah Mitchell", customPrice: null },
        { id: "cust-005", name: "Heartland Provisions", email: "supply@heartlandprov.com", rep: "Adam Groogan", customPrice: 3.95 },
      ],
    },
    {
      id: "pc-2",
      productId: "prod-002",
      productName: "Food-Grade Pallet Wrap (18\" x 1500ft)",
      sku: "PKG-PW-1815",
      category: "Packaging",
      oldPrice: 28.50,
      newPrice: 31.00,
      pctChange: 8.77,
      dateChanged: "2026-03-27",
      effectiveFrom: "2026-04-07",
      notified: false,
      affectedCustomers: [
        { id: "cust-001", name: "Metro Foods Distribution", email: "purchasing@metrofoods.com", rep: "Adam Groogan", customPrice: 27.00 },
        { id: "cust-002", name: "Golden State Wholesale", email: "procurement@goldenstate.com", rep: "David Lee", customPrice: null },
      ],
    },
    {
      id: "pc-3",
      productId: "prod-003",
      productName: "Industrial Cleaning Solution (5 Gal)",
      sku: "CHM-ICS-5G",
      category: "Chemicals",
      oldPrice: 42.00,
      newPrice: 38.50,
      pctChange: -8.33,
      dateChanged: "2026-03-26",
      effectiveFrom: "2026-04-01",
      notified: true,
      affectedCustomers: [
        { id: "cust-004", name: "Summit Building Supply", email: "ops@summitbuilding.com", rep: "Rachel Green", customPrice: 40.00 },
        { id: "cust-006", name: "Valley Agricultural Co-op", email: "admin@valleyag.com", rep: "Sarah Mitchell", customPrice: null },
        { id: "cust-007", name: "Coastal Marine Supply", email: "purchasing@coastalmarine.com", rep: "David Lee", customPrice: 39.50 },
        { id: "cust-001", name: "Metro Foods Distribution", email: "purchasing@metrofoods.com", rep: "Adam Groogan", customPrice: null },
      ],
    },
    {
      id: "pc-4",
      productId: "prod-004",
      productName: "Portland Cement Type I/II (94lb bag)",
      sku: "BLD-PC-94",
      category: "Building Materials",
      oldPrice: 12.80,
      newPrice: 14.20,
      pctChange: 10.94,
      dateChanged: "2026-03-25",
      effectiveFrom: "2026-04-14",
      notified: false,
      affectedCustomers: [
        { id: "cust-004", name: "Summit Building Supply", email: "ops@summitbuilding.com", rep: "Rachel Green", customPrice: 12.00 },
        { id: "cust-008", name: "NorthStar Construction", email: "purchasing@northstarcon.com", rep: "Adam Groogan", customPrice: 12.50 },
      ],
    },
    {
      id: "pc-5",
      productId: "prod-005",
      productName: "Organic Quinoa (25kg Bulk)",
      sku: "FNB-OQ-25K",
      category: "Food & Beverage",
      oldPrice: 89.00,
      newPrice: 95.50,
      pctChange: 7.30,
      dateChanged: "2026-03-24",
      effectiveFrom: "2026-04-07",
      notified: false,
      affectedCustomers: [
        { id: "cust-001", name: "Metro Foods Distribution", email: "purchasing@metrofoods.com", rep: "Adam Groogan", customPrice: 85.00 },
        { id: "cust-003", name: "Pacific Coast Imports", email: "orders@pacificcoast.com", rep: "Sarah Mitchell", customPrice: 87.00 },
        { id: "cust-009", name: "Fresh Fields Market Group", email: "buying@freshfields.com", rep: "David Lee", customPrice: null },
      ],
    },
    {
      id: "pc-6",
      productId: "prod-006",
      productName: "A4 Copy Paper (80gsm, 5-Ream Box)",
      sku: "PPR-A4-80-5R",
      category: "Paper Goods",
      oldPrice: 24.99,
      newPrice: 22.99,
      pctChange: -8.00,
      dateChanged: "2026-03-23",
      effectiveFrom: "2026-04-01",
      notified: true,
      affectedCustomers: [
        { id: "cust-002", name: "Golden State Wholesale", email: "procurement@goldenstate.com", rep: "David Lee", customPrice: null },
        { id: "cust-005", name: "Heartland Provisions", email: "supply@heartlandprov.com", rep: "Adam Groogan", customPrice: 23.50 },
      ],
    },
    {
      id: "pc-7",
      productId: "prod-007",
      productName: "NPK Fertilizer 20-20-20 (50lb)",
      sku: "AGR-NPK-50",
      category: "Agriculture",
      oldPrice: 34.00,
      newPrice: 37.50,
      pctChange: 10.29,
      dateChanged: "2026-03-22",
      effectiveFrom: "2026-04-14",
      notified: false,
      affectedCustomers: [
        { id: "cust-006", name: "Valley Agricultural Co-op", email: "admin@valleyag.com", rep: "Sarah Mitchell", customPrice: 32.50 },
        { id: "cust-010", name: "Greenfield Growers Inc", email: "ops@greenfieldgrowers.com", rep: "Rachel Green", customPrice: null },
        { id: "cust-005", name: "Heartland Provisions", email: "supply@heartlandprov.com", rep: "Adam Groogan", customPrice: 33.00 },
      ],
    },
    {
      id: "pc-8",
      productId: "prod-008",
      productName: "Stainless Steel Fasteners Kit (500pc)",
      sku: "IND-SSF-500",
      category: "Industrial",
      oldPrice: 67.50,
      newPrice: 72.00,
      pctChange: 6.67,
      dateChanged: "2026-03-20",
      effectiveFrom: "2026-04-07",
      notified: false,
      affectedCustomers: [
        { id: "cust-004", name: "Summit Building Supply", email: "ops@summitbuilding.com", rep: "Rachel Green", customPrice: 65.00 },
        { id: "cust-008", name: "NorthStar Construction", email: "purchasing@northstarcon.com", rep: "Adam Groogan", customPrice: null },
      ],
    },
  ];
}

// --- Email Preview ---
function EmailPreview({ change, customer }: { change: PriceChange; customer: AffectedCustomer }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 text-xs font-mono leading-relaxed text-text-secondary">
      <p className="text-text-muted mb-2"><span className="text-text-primary font-semibold">Subject:</span> Price Update Notice — {change.productName}</p>
      <hr className="border-border my-2" />
      <p>Dear {customer.name},</p>
      <br />
      <p>We&apos;re writing to inform you of an upcoming price adjustment to the following product(s) in your account:</p>
      <br />
      <div className="pl-4 border-l-2 border-primary/30 space-y-1">
        <p className="text-text-primary font-semibold">{change.productName} — {change.sku}</p>
        <p>Previous Price: <span className="text-red-400">{formatCurrency(change.oldPrice)}</span></p>
        <p>New Price: <span className="text-emerald-400">{formatCurrency(change.newPrice)}</span></p>
        <p>Effective From: <span className="text-primary">{new Date(change.effectiveFrom + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></p>
      </div>
      <br />
      <p>Please review your upcoming orders accordingly. If you have any questions, don&apos;t hesitate to reach out.</p>
      <br />
      <p>Best regards,</p>
      <p className="text-text-primary">{customer.rep}</p>
      <p className="text-primary">WholesaleOS</p>
    </div>
  );
}

// --- Notify Modal ---
function NotifyModal({ change, onClose, onSend }: {
  change: PriceChange;
  onClose: () => void;
  onSend: (changeId: string) => void;
}) {
  const [effectiveDate, setEffectiveDate] = useState(change.effectiveFrom);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        onSend(change.id);
        onClose();
      }, 1200);
    }, 1500);
  };

  const handleExport = () => {
    exportToCSV(
      change.affectedCustomers.map(c => ({
        customer: c.name,
        email: c.email,
        product: change.productName,
        sku: change.sku,
        oldPrice: `$${change.oldPrice.toFixed(2)}`,
        newPrice: `$${change.newPrice.toFixed(2)}`,
        pctChange: `${change.pctChange >= 0 ? "+" : ""}${change.pctChange.toFixed(1)}%`,
        effectiveDate,
        rep: c.rep,
      })),
      `price-change-notice-${change.sku}`,
      [
        { key: "customer", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "product", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "oldPrice", label: "Old Price" },
        { key: "newPrice", label: "New Price" },
        { key: "pctChange", label: "% Change" },
        { key: "effectiveDate", label: "Effective Date" },
        { key: "rep", label: "Rep" },
      ],
    );
  };

  const selectedCustomer = change.affectedCustomers[selectedCustomerIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-raised border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-heading font-bold text-text-primary">Notify Customers — Price Change</h3>
            <p className="text-xs text-text-muted mt-0.5">{change.productName} ({change.sku})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Price Summary */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover">
            <div className="text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Old Price</p>
              <p className="text-lg font-bold text-red-400 font-mono">{formatCurrency(change.oldPrice)}</p>
            </div>
            <div className="text-primary text-lg">&rarr;</div>
            <div className="text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">New Price</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(change.newPrice)}</p>
            </div>
            <div className={cn("ml-auto px-3 py-1.5 rounded-full text-xs font-bold",
              change.pctChange >= 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
            )}>
              {change.pctChange >= 0 ? "+" : ""}{change.pctChange.toFixed(1)}%
            </div>
          </div>

          {/* Effective Date */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Date Effective From</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Affected Customers */}
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Affected Customers ({change.affectedCustomers.length})</h4>
            <div className="space-y-1">
              {change.affectedCustomers.map((cust, idx) => (
                <button
                  key={cust.id}
                  onClick={() => setSelectedCustomerIdx(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                    selectedCustomerIdx === idx
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-surface-hover border border-transparent"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary">
                    {cust.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{cust.name}</p>
                    <p className="text-[10px] text-text-muted">{cust.email} &middot; Rep: {cust.rep}</p>
                  </div>
                  {cust.customPrice && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Custom: {formatCurrency(cust.customPrice)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Email Preview */}
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Email Preview — {selectedCustomer.name}
            </h4>
            <EmailPreview change={{ ...change, effectiveFrom: effectiveDate }} customer={selectedCustomer} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/50">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <Download className="h-4 w-4" /> Export to CSV
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || sent}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                sent
                  ? "bg-emerald-500 text-white"
                  : "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25"
              )}
            >
              {sent ? (
                <><Check className="h-4 w-4" /> Notifications Sent</>
              ) : sending ? (
                <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <><Send className="h-4 w-4" /> Send Notifications ({change.affectedCustomers.length})</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Component ---
export default function PriceChangeAlerts() {
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>(generateMockPriceChanges);
  const [notifyModal, setNotifyModal] = useState<PriceChange | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSent, setBulkSent] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "notified">("all");
  const [sortField, setSortField] = useState<"date" | "pctChange" | "customers">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let items = [...priceChanges];
    if (filterStatus === "pending") items = items.filter(pc => !pc.notified);
    if (filterStatus === "notified") items = items.filter(pc => pc.notified);

    items.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = a.dateChanged.localeCompare(b.dateChanged);
      else if (sortField === "pctChange") cmp = Math.abs(a.pctChange) - Math.abs(b.pctChange);
      else cmp = a.affectedCustomers.length - b.affectedCustomers.length;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return items;
  }, [priceChanges, filterStatus, sortField, sortDir]);

  const pendingCount = priceChanges.filter(pc => !pc.notified).length;
  const totalAffected = priceChanges.filter(pc => !pc.notified).reduce((s, pc) => s + pc.affectedCustomers.length, 0);

  const handleNotifySingle = (changeId: string) => {
    setPriceChanges(prev => prev.map(pc => pc.id === changeId ? { ...pc, notified: true } : pc));
  };

  const handleBulkNotify = () => {
    setBulkSending(true);
    setTimeout(() => {
      setPriceChanges(prev => prev.map(pc => ({ ...pc, notified: true })));
      setBulkSending(false);
      setBulkSent(true);
      setTimeout(() => setBulkSent(false), 3000);
    }, 2000);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
            <Bell className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold text-text-primary">Price Change Notices</h3>
            <p className="text-[10px] text-text-muted">
              {pendingCount} pending {pendingCount === 1 ? "notice" : "notices"} &middot; {totalAffected} customers to notify
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter Tabs */}
          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border">
            {(["all", "pending", "notified"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                  filterStatus === f ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-primary"
                )}
              >
                {f} {f === "pending" && pendingCount > 0 && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-400">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          {/* Bulk Notify */}
          {pendingCount > 0 && (
            <button
              onClick={handleBulkNotify}
              disabled={bulkSending || bulkSent}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all",
                bulkSent
                  ? "bg-emerald-500 text-white"
                  : "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25"
              )}
            >
              {bulkSent ? (
                <><Check className="h-3.5 w-3.5" /> All Sent</>
              ) : bulkSending ? (
                <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <><Mail className="h-3.5 w-3.5" /> Bulk Notify ({pendingCount})</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[100px]">Old Price</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[100px]">New Price</th>
                <th
                  className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[90px] cursor-pointer hover:text-text-primary transition-colors select-none"
                  onClick={() => toggleSort("pctChange")}
                >
                  <span className="inline-flex items-center gap-1">
                    % Change
                    {sortField === "pctChange" && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                  </span>
                </th>
                <th
                  className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[110px] cursor-pointer hover:text-text-primary transition-colors select-none"
                  onClick={() => toggleSort("date")}
                >
                  <span className="inline-flex items-center gap-1">
                    Effective
                    {sortField === "date" && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                  </span>
                </th>
                <th
                  className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[110px] cursor-pointer hover:text-text-primary transition-colors select-none"
                  onClick={() => toggleSort("customers")}
                >
                  <span className="inline-flex items-center gap-1">
                    Customers
                    {sortField === "customers" && (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
                  </span>
                </th>
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[120px]">Status</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pc, i) => (
                <motion.tr
                  key={pc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-text-primary">{pc.productName}</p>
                    <p className="text-[10px] text-text-muted font-mono">{pc.sku} &middot; {pc.category}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-mono text-text-muted line-through">{formatCurrency(pc.oldPrice)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn("text-sm font-mono font-bold", pc.pctChange >= 0 ? "text-red-400" : "text-emerald-400")}>
                      {formatCurrency(pc.newPrice)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                      pc.pctChange >= 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                    )}>
                      {pc.pctChange >= 0 ? "+" : ""}{pc.pctChange.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs text-text-secondary">
                      {new Date(pc.effectiveFrom + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-text-muted" />
                      <span className="text-xs font-medium text-text-primary">{pc.affectedCustomers.length}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {pc.notified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">
                        <Check className="h-3 w-3" /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium">
                        <AlertCircle className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setNotifyModal(pc)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        pc.notified
                          ? "border border-border text-text-muted hover:bg-surface-hover hover:text-text-primary"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {pc.notified ? "View" : "Notify"}
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted text-sm">
                    No price changes found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notify Modal */}
      <AnimatePresence>
        {notifyModal && (
          <NotifyModal
            change={notifyModal}
            onClose={() => setNotifyModal(null)}
            onSend={handleNotifySingle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
