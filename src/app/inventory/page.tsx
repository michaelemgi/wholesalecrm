"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, DollarSign, AlertTriangle, XCircle,
  Search, LayoutGrid, List, ChevronLeft, ChevronRight,
  Filter, ArrowUpDown, ChevronUp, ChevronDown, Warehouse, Clock, RefreshCw,
  TrendingDown, Bell, X, Save, History, TrendingUp,
  Pencil, Check, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, ClipboardCheck, Loader2, Users, Building2,
  ShoppingCart, ArrowRight, Tag, Download, Plus, FileUp,
  ArrowLeftRight, Trash2, FileText, ExternalLink, Lightbulb,
  FlaskConical, Rocket, Beaker, Star, Globe, Image as ImageIcon,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";
import { exportToCSV } from "@/lib/export";
import BulkReportModal, { BulkReportConfig } from "@/components/BulkReportModal";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Product } from "@/types";
import PriceChangeAlerts from "./PriceChangeAlerts";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// --- Constants ---
const PRODUCTS_PER_PAGE = 15;
const categories = ["All", "Food & Beverage", "Building Materials", "Packaging", "Industrial", "Chemicals", "Agriculture", "Paper Goods"];

const statusConfig: Record<Product["status"], { bg: string; text: string }> = {
  Active: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  "Low Stock": { bg: "bg-amber-500/15", text: "text-amber-400" },
  "Out of Stock": { bg: "bg-red-500/15", text: "text-red-400" },
  Discontinued: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

// --- Generate mock price history for a product ---
function generatePriceHistory(product: Product) {
  const months = ["Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"];
  const jitter = (base: number, range: number) => +(base + (Math.random() - 0.5) * range).toFixed(2);
  const unitBuy = product.wholesalePrice;
  const wholesaleSell = Math.round(unitBuy * 1.2);
  const retailSell = Math.round(unitBuy * 1.5);

  return months.map((month, i) => {
    const factor = 0.88 + (i * 0.025); // prices trending slightly up over time
    return {
      month,
      unitPrice: i < 5 ? jitter(unitBuy * factor, unitBuy * 0.05) : unitBuy,
      wholesale: i < 5 ? jitter(wholesaleSell * factor, wholesaleSell * 0.05) : wholesaleSell,
      retail: i < 5 ? jitter(retailSell * factor, retailSell * 0.06) : retailSell,
    };
  });
}

// --- Generate mock change log ---
function generateChangeLog(product: Product) {
  const users = ["Adam Groogan", "Sarah Mitchell", "David Lee", "Rachel Green"];
  const tiers = ["Unit Price", "Wholesale", "Retail"];
  const unitBuy = product.wholesalePrice;
  const currentPrices: Record<string, number> = {
    "Unit Price": unitBuy,
    Wholesale: Math.round(unitBuy * 1.2),
    Retail: Math.round(unitBuy * 1.5),
  };

  const logs = [];
  const dates = [
    "Mar 15, 2026", "Mar 1, 2026", "Feb 18, 2026",
    "Feb 2, 2026", "Jan 20, 2026", "Jan 5, 2026",
    "Dec 12, 2025", "Nov 28, 2025",
  ];

  for (let i = 0; i < dates.length; i++) {
    const tier = tiers[i % tiers.length];
    const current = currentPrices[tier];
    const oldPrice = +(current * (0.9 + Math.random() * 0.15)).toFixed(2);
    logs.push({
      id: `log-${product.id}-${i}`,
      date: dates[i],
      user: users[i % users.length],
      tier,
      oldPrice,
      newPrice: i === 0 ? current : +(current * (0.92 + Math.random() * 0.12)).toFixed(2),
      reason: i % 3 === 0 ? "Supplier cost increase" : i % 3 === 1 ? "Competitive adjustment" : "Margin optimization",
    });
  }
  return logs;
}

// --- Stat Card ---
function StatCard({ label, value, icon: Icon, color, bg, index }: {
  label: string; value: string; icon: React.ElementType; color: string; bg: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-5 hover:border-border-light transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <div className="text-2xl font-bold font-heading text-text-primary">{value}</div>
    </motion.div>
  );
}

// --- Stock Bar ---
function StockBar({ current, reorderPoint, compact = false }: { current: number; reorderPoint: number; compact?: boolean }) {
  const capacity = reorderPoint * 4;
  const pct = Math.min((current / capacity) * 100, 100);
  const color = pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 rounded-full overflow-hidden", compact ? "h-1.5" : "h-2", "bg-surface-hover")}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      {!compact && <span className="text-xs text-text-muted w-10 text-right">{formatNumber(current)}</span>}
    </div>
  );
}

// --- Editable Price Cell ---
function EditablePrice({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    } else {
      setDraft(value.toString());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-text-muted text-xs">$</span>
        <input
          autoFocus
          type="number"
          step="0.01"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value.toString()); setEditing(false); } }}
          className="w-20 bg-background border border-primary rounded px-2 py-1 text-sm text-text-primary font-medium outline-none text-right"
        />
        <button onClick={commit} className="p-0.5 rounded hover:bg-emerald-500/20 text-emerald-400">
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value.toString()); setEditing(true); }}
      className="group flex items-center gap-1.5 text-right hover:bg-surface-hover rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
      title={`Edit ${label} price`}
    >
      <span className="text-text-primary font-medium">{formatCurrency(value)}</span>
      <Pencil className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// --- Product Detail Slide-out ---
function ProductDetailPanel({ product, onClose, onUpdatePrice }: {
  product: Product;
  onClose: () => void;
  onUpdatePrice: (productId: string, tier: string, newPrice: number) => void;
}) {
  const { data: mockCustomers = [] } = useSWR<any[]>('/api/customers', fetcher);
  const [activeDetailTab, setActiveDetailTab] = useState<"pricing" | "history" | "changelog">("pricing");
  const priceHistory = useMemo(() => generatePriceHistory(product), [product]);
  const changeLog = useMemo(() => generateChangeLog(product), [product]);

  // Simple 3-tier pricing: Unit Price (buy), Wholesale (+20%), Retail (+50%)
  const unitBuyPrice = product.wholesalePrice; // what we pay
  const wholesaleSellPrice = Math.round(unitBuyPrice * 1.2); // sell to wholesale customers
  const retailSellPrice = Math.round(unitBuyPrice * 1.5); // sell to retail

  const priceTiers = [
    { key: "unitPrice", label: "Unit Price (Buy)", value: unitBuyPrice, color: "#f59e0b" },
    { key: "wholesalePrice", label: "Wholesale (+20%)", value: wholesaleSellPrice, color: "#10b981" },
    { key: "retailPrice", label: "Retail (+50%)", value: retailSellPrice, color: "#3b82f6" },
  ];

  const cost = unitBuyPrice;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-[680px] max-w-full bg-background border-l border-border overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {/* Product Image */}
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded-xl object-cover border border-border shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-surface-hover flex items-center justify-center border border-border shrink-0">
                  <Package className="h-6 w-6 text-text-muted" />
                </div>
              )}
              <div>
                <h2 className="font-heading text-lg font-bold text-text-primary">{product.name}</h2>
                {product.brand && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-primary font-medium">{product.brand}</span>
                    {product.brandWebsite && (
                      <a href={product.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-text-muted">{product.sku}</span>
                  <span className="text-xs text-text-muted">{product.category}</span>
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", statusConfig[product.status].bg, statusConfig[product.status].text)}>
                    {product.status}
                  </span>
                </div>
                {product.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.split(",").map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Description */}
          {product.description && (
            <p className="text-xs text-text-secondary mt-3 leading-relaxed">{product.description}</p>
          )}

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 mt-4 border-b border-border -mb-4 -mx-6 px-6">
            {[
              { key: "pricing" as const, label: "Edit Pricing", icon: DollarSign },
              { key: "history" as const, label: "Price History", icon: TrendingUp },
              { key: "changelog" as const, label: "Change Log", icon: History },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveDetailTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative",
                  activeDetailTab === tab.key ? "text-primary" : "text-text-muted hover:text-text-secondary"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {activeDetailTab === tab.key && (
                  <motion.div layoutId="detail-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeDetailTab === "pricing" && (
              <motion.div key="pricing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* 3 Price Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-[10px] text-amber-400/70 uppercase font-semibold tracking-wider">Unit Price (Buy)</p>
                    </div>
                    <p className="text-2xl font-bold font-heading text-amber-400">{formatCurrency(unitBuyPrice)}</p>
                    <p className="text-[10px] text-text-muted mt-1">From {product.supplier}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                      <p className="text-[10px] text-emerald-400/70 uppercase font-semibold tracking-wider">Wholesale (+20%)</p>
                    </div>
                    <p className="text-2xl font-bold font-heading text-emerald-400">{formatCurrency(wholesaleSellPrice)}</p>
                    <p className="text-[10px] text-text-muted mt-1">Margin: {formatCurrency(wholesaleSellPrice - unitBuyPrice)} per unit</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-3.5 w-3.5 text-blue-400" />
                      <p className="text-[10px] text-blue-400/70 uppercase font-semibold tracking-wider">Retail (+50%)</p>
                    </div>
                    <p className="text-2xl font-bold font-heading text-blue-400">{formatCurrency(retailSellPrice)}</p>
                    <p className="text-[10px] text-text-muted mt-1">Margin: {formatCurrency(retailSellPrice - unitBuyPrice)} per unit</p>
                  </div>
                </div>

                {/* Quick Info Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-surface-hover">
                    <p className="text-[10px] text-text-muted uppercase">Stock Level</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{formatNumber(product.stockLevel)} <span className="text-[10px] font-normal text-text-muted">{product.unit}s</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-hover">
                    <p className="text-[10px] text-text-muted uppercase">Warehouse</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{product.warehouse}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-hover">
                    <p className="text-[10px] text-text-muted uppercase">Lead Time</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{product.leadTimeDays} days</p>
                  </div>
                </div>

                {/* Price tiers with margin from unit cost */}
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Pricing Breakdown</h4>
                  <div className="space-y-1">
                    {priceTiers.map((tier, i) => {
                      const margin = tier.value - unitBuyPrice;
                      const marginPct = unitBuyPrice > 0 ? ((margin) / unitBuyPrice) * 100 : 0;
                      return (
                        <motion.div
                          key={tier.key}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-surface-hover/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                            <span className="text-sm text-text-secondary w-20">{tier.label}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Markup from wholesale */}
                            <div className="text-right w-28">
                              <span className={cn("text-xs font-medium", marginPct >= 20 ? "text-emerald-400" : marginPct >= 10 ? "text-amber-400" : marginPct > 0 ? "text-red-400" : "text-red-500")}>
                                {marginPct > 0 ? "+" : ""}{marginPct.toFixed(0)}% markup
                              </span>
                              <span className="text-[10px] text-text-muted ml-1">
                                ({margin >= 0 ? "+" : ""}{formatCurrency(margin)})
                              </span>
                            </div>
                            {/* Editable price */}
                            <div className="w-28 flex justify-end">
                              <EditablePrice
                                value={tier.value}
                                label={tier.label}
                                onChange={(v) => onUpdatePrice(product.id, tier.key, v)}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Margin visualization — from unit buy price */}
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Profit Per Unit (from Buy Price)</h4>
                  <div className="space-y-2">
                    {priceTiers.map(tier => {
                      const profit = tier.value - unitBuyPrice;
                      const maxProfit = retailSellPrice - unitBuyPrice;
                      const pct = maxProfit > 0 ? Math.max(0, (profit / maxProfit) * 100) : 0;
                      return (
                        <div key={tier.key} className="flex items-center gap-3">
                          <span className="text-xs text-text-muted w-20">{tier.label}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-surface-hover overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: tier.color }}
                            />
                          </div>
                          <span className={cn("text-xs font-mono w-16 text-right font-semibold", profit > 0 ? "text-emerald-400" : "text-red-400")}>
                            {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CLIENT PRICING SECTION */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Client Pricing for this Product</h4>
                  </div>

                  <div className="glass-card overflow-hidden">
                    {(() => {
                      // Generate client pricing data for this product
                      const clientData = mockCustomers.map(customer => {
                        const seedNum = parseInt(customer.id.replace("cust-", ""), 10);
                        const tierDiscount = customer.accountTier === "Enterprise" ? 0.75 : customer.accountTier === "Mid-Market" ? 0.85 : 1.0;
                        const hasProduct = (customer.topProducts as string[] || []).some((tp: string) => product.name.includes(tp.split(" ")[0])) || (seedNum + parseInt(product.id.replace("prod-", ""), 10)) % 3 === 0;
                        if (!hasProduct) return null;

                        const customPrice = Math.round(product.unitPrice * tierDiscount * (0.95 + ((seedNum) % 5) * 0.02));
                        const markup = customPrice - product.wholesalePrice;
                        const markupPct = ((markup) / product.wholesalePrice) * 100;

                        // Simulate order volume for this product from this customer
                        const orderCount = 2 + (seedNum % 5);
                        const avgQty = 15 + ((seedNum * 7) % 50);
                        const totalSpend = customPrice * avgQty * orderCount;

                        return {
                          customer,
                          customPrice,
                          markup,
                          markupPct,
                          orderCount,
                          avgQty,
                          totalSpend,
                        };
                      }).filter(Boolean) as { customer: any; customPrice: number; markup: number; markupPct: number; orderCount: number; avgQty: number; totalSpend: number }[];

                      if (clientData.length === 0) {
                        return (
                          <div className="p-6 text-center">
                            <Users className="h-6 w-6 text-text-muted mx-auto mb-2" />
                            <p className="text-xs text-text-muted">No clients currently purchasing this product</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3">Client</th>
                                <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[80px]">Their Price</th>
                                <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[80px]">Your Profit</th>
                                <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[60px]">Orders</th>
                                <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[70px]">Avg Qty</th>
                                <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Total Spend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clientData.sort((a, b) => b.totalSpend - a.totalSpend).map((cd, idx) => (
                                <motion.tr
                                  key={cd.customer.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.03 }}
                                  className="border-b border-border/50 last:border-0 hover:bg-surface-hover/30 transition-colors"
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[8px] font-bold text-primary shrink-0">
                                        {cd.customer.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-text-primary">{cd.customer.name}</p>
                                        <p className="text-[10px] text-text-muted">{cd.customer.accountTier}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="text-xs font-mono font-bold text-text-primary">{formatCurrency(cd.customPrice)}</span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={cn(
                                      "text-xs font-mono font-bold",
                                      cd.markup > 0 ? "text-emerald-400" : "text-red-400"
                                    )}>
                                      {cd.markup >= 0 ? "+" : ""}{formatCurrency(cd.markup)}
                                    </span>
                                    <p className="text-[9px] text-text-muted">
                                      {cd.markupPct >= 0 ? "+" : ""}{cd.markupPct.toFixed(0)}%
                                    </p>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="text-xs font-mono text-text-secondary">{cd.orderCount}</span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="text-xs font-mono text-text-secondary">{cd.avgQty}</span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="text-xs font-mono font-bold text-text-primary">{formatCurrency(cd.totalSpend)}</span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="border-t border-border p-3 flex items-center justify-between bg-surface-hover/30">
                            <span className="text-xs text-text-muted">{clientData.length} clients buying this product</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-text-muted">Total Revenue:</span>
                              <span className="text-sm font-bold text-emerald-400">{formatCurrency(clientData.reduce((s, cd) => s + cd.totalSpend, 0))}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Save All Changes
                </button>
              </motion.div>
            )}

            {activeDetailTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Chart */}
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">6-Month Price Trend</h4>
                  <div className="glass-card p-4" style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} tickFormatter={(v) => `$${v}`} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                          formatter={(v) => [formatCurrency(Number(v))]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="unitPrice" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Unit Price (Buy)" />
                        <Line type="monotone" dataKey="wholesale" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Wholesale (+20%)" />
                        <Line type="monotone" dataKey="retail" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Retail (+50%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Unit Price (Buy)", current: unitBuyPrice, prev: priceHistory[0].unitPrice, color: "#f59e0b" },
                    { label: "Wholesale (+20%)", current: wholesaleSellPrice, prev: priceHistory[0].wholesale, color: "#10b981" },
                    { label: "Retail (+50%)", current: retailSellPrice, prev: priceHistory[0].retail, color: "#3b82f6" },
                  ].map(item => {
                    const change = ((item.current - item.prev) / item.prev) * 100;
                    return (
                      <div key={item.label} className="p-3 rounded-lg bg-surface-hover">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-text-muted">{item.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-lg font-bold font-heading text-text-primary">{formatCurrency(item.current)}</span>
                          <span className={cn("text-xs font-medium", change >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs 6mo ago
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeDetailTab === "changelog" && (
              <motion.div key="changelog" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Recent Price Changes</h4>
                <div className="space-y-0">
                  {changeLog.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-3 py-3 border-b border-border/50 last:border-0"
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        {i < changeLog.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{log.tier}</span>
                            <span className="text-xs text-text-muted">{log.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-text-muted line-through">{formatCurrency(log.oldPrice)}</span>
                            <ChevronRight className="h-3 w-3 text-text-muted" />
                            <span className={cn("font-medium", log.newPrice > log.oldPrice ? "text-emerald-400" : "text-red-400")}>
                              {formatCurrency(log.newPrice)}
                            </span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              log.newPrice > log.oldPrice ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                            )}>
                              {log.newPrice > log.oldPrice ? "+" : ""}{(((log.newPrice - log.oldPrice) / log.oldPrice) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                              {log.user.split(" ").map(n => n[0]).join("")}
                            </div>
                            {log.user}
                          </div>
                          <span className="text-text-muted/50">|</span>
                          <span>{log.reason}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Product Catalog Tab ---
function ProductCatalogTab({ products, onSelectProduct, brandFilter, onClearBrandFilter }: { products: Product[]; onSelectProduct: (p: Product) => void; brandFilter?: string | null; onClearBrandFilter?: () => void }) {
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = products;
    if (brandFilter) {
      result = result.filter(p => (p.brand || "Unbranded") === brandFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category !== "All") result = result.filter(p => p.category === category);
    return result;
  }, [products, search, category, brandFilter]);

  const sortedProducts = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "name": aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase(); break;
        case "sku": aVal = a.sku; bVal = b.sku; break;
        case "category": aVal = a.category; bVal = b.category; break;
        case "wholesalePrice": aVal = a.wholesalePrice; bVal = b.wholesalePrice; break;
        case "stockLevel": aVal = a.stockLevel; bVal = b.stockLevel; break;
        case "status": aVal = a.status; bVal = b.status; break;
        default: aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const paginated = sortedProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  function SortHeader({ field, label, align }: { field: string; label: string; align?: string }) {
    const active = sortField === field;
    return (
      <th
        onClick={() => { if (active) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir(field === "wholesalePrice" || field === "stockLevel" ? "desc" : "asc"); } }}
        className={cn("py-3 px-4 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors select-none", align === "right" ? "text-right" : "text-left", active ? "text-primary" : "text-text-muted")}
      >
        <span className={cn("inline-flex items-center gap-1", align === "right" ? "justify-end" : "")}>
          {label}
          {active ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-4">
      {/* Brand filter indicator */}
      {brandFilter && (
        <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm text-text-secondary">Showing products from <span className="font-semibold text-primary">{brandFilter}</span></span>
          <button onClick={onClearBrandFilter} className="ml-auto p-1 rounded hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="pl-10 pr-8 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-colors"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => { const [f, d] = e.target.value.split("-"); setSortField(f); setSortDir(d as "asc" | "desc"); }}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="wholesalePrice-desc">Price High–Low</option>
          <option value="wholesalePrice-asc">Price Low–High</option>
          <option value="stockLevel-desc">Stock High–Low</option>
          <option value="stockLevel-asc">Stock Low–High</option>
          <option value="category-asc">Category A–Z</option>
        </select>
        <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView("table")} className={cn("p-2.5 transition-colors", view === "table" ? "bg-primary/20 text-primary" : "text-text-muted hover:text-text-secondary")}>
            <List className="h-4 w-4" />
          </button>
          <button onClick={() => setView("grid")} className={cn("p-2.5 transition-colors", view === "grid" ? "bg-primary/20 text-primary" : "text-text-muted hover:text-text-secondary")}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table view */}
      {view === "table" ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <SortHeader field="sku" label="SKU" />
                  <SortHeader field="name" label="Product" />
                  <SortHeader field="category" label="Category" />
                  <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Unit Price</th>
                  <SortHeader field="wholesalePrice" label="Wholesale" align="right" />
                  <SortHeader field="stockLevel" label="Stock Level" />
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Warehouse</th>
                  <SortHeader field="status" label="Status" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onSelectProduct(p)}
                    className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-text-muted">{p.sku}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-9 w-9 rounded-lg object-cover border border-border shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-surface-hover flex items-center justify-center border border-border shrink-0">
                            <Package className="h-4 w-4 text-text-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-primary text-sm">{p.name}</p>
                          {p.brand && <p className="text-[10px] text-primary/70">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{p.category}</td>
                    <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(p.unitPrice)}</td>
                    <td className="py-3 px-4 text-right text-text-primary font-medium">{formatCurrency(p.wholesalePrice)}</td>
                    <td className="py-3 px-4 w-44">
                      <StockBar current={p.stockLevel} reorderPoint={p.reorderPoint} />
                    </td>
                    <td className="py-3 px-4 text-xs text-text-muted">{p.warehouse}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusConfig[p.status].bg, statusConfig[p.status].text)}>
                        {p.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-3 gap-4">
          {paginated.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectProduct(p)}
              className="glass-card p-4 hover:border-border-light transition-colors cursor-pointer"
            >

              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-28 object-cover rounded-lg mb-3 border border-border" />
              ) : (
                <div className="w-full h-28 rounded-lg mb-3 bg-surface-hover flex items-center justify-center border border-border">
                  <Package className="h-8 w-8 text-text-muted" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  {p.brand && <p className="text-[10px] text-primary/70 mt-0.5">{p.brand}</p>}
                  <p className="text-xs text-text-muted font-mono mt-0.5">{p.sku}</p>
                </div>
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ml-2", statusConfig[p.status].bg, statusConfig[p.status].text)}>
                  {p.status}
                </span>
              </div>
              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span className="text-text-muted">Category</span>
                  <span>{p.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Wholesale</span>
                  <span className="font-medium text-text-primary">{formatCurrency(p.wholesalePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Unit Price</span>
                  <span>{formatCurrency(p.unitPrice)}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-text-muted">Stock</span>
                    <span>{formatNumber(p.stockLevel)} {p.unit}s</span>
                  </div>
                  <StockBar current={p.stockLevel} reorderPoint={p.reorderPoint} compact />
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Warehouse</span>
                  <span>{p.warehouse}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing {(page - 1) * PRODUCTS_PER_PAGE + 1}-{Math.min(page * PRODUCTS_PER_PAGE, sortedProducts.length)} of {sortedProducts.length} products
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
                    page === pageNum ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Stock Levels Tab ---
function StockLevelsTab({ products, onSelectProduct }: { products: Product[]; onSelectProduct: (p: Product) => void }) {
  const sorted = useMemo(() =>
    [...products]
      .filter(p => p.status !== "Discontinued")
      .sort((a, b) => {
        const aRatio = a.stockLevel / a.reorderPoint;
        const bRatio = b.stockLevel / b.reorderPoint;
        return aRatio - bRatio;
      }),
    [products]
  );

  const lowStockAlerts = sorted.filter(p => p.status === "Low Stock" || p.status === "Out of Stock");
  const estimateDaysOfStock = (p: Product) => {
    if (p.stockLevel === 0) return 0;
    const dailyUsage = p.reorderPoint / (p.leadTimeDays * 1.5);
    return dailyUsage > 0 ? Math.round(p.stockLevel / dailyUsage) : 999;
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main list */}
      <div className="col-span-2 space-y-2">
        {sorted.slice(0, 25).map((p, i) => {
          const days = estimateDaysOfStock(p);
          const capacity = p.reorderPoint * 4;
          const pct = Math.min((p.stockLevel / capacity) * 100, 100);
          const gaugeColor = pct > 50 ? "#10b981" : pct > 25 ? "#f59e0b" : "#ef4444";
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelectProduct(p)}
              className="glass-card p-4 hover:border-border-light transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                    <span className="text-xs font-mono text-text-muted">{p.sku}</span>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ml-auto shrink-0", statusConfig[p.status].bg, statusConfig[p.status].text)}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Gauge bar */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">
                          {formatNumber(p.stockLevel)} / {formatNumber(capacity)} {p.unit}s
                        </span>
                        <span className="text-xs text-text-muted">Reorder: {formatNumber(p.reorderPoint)}</span>
                      </div>
                      <div className="h-3 bg-surface-hover rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.02 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: gaugeColor }}
                        />
                        {/* Reorder point marker */}
                        <div
                          className="absolute top-0 h-full w-0.5 bg-text-muted/50"
                          style={{ left: `${Math.min((p.reorderPoint / capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* Warehouse */}
                    <div className="shrink-0 text-right w-36">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Warehouse className="h-3 w-3" />
                        {p.warehouse}
                      </div>
                    </div>
                    {/* Days of stock */}
                    <div className="shrink-0 text-right w-24">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3 text-text-muted" />
                        <span className={cn(
                          "font-medium",
                          days <= 7 ? "text-danger" : days <= 14 ? "text-warning" : "text-text-secondary"
                        )}>
                          {days === 0 ? "None" : days > 90 ? "90+ days" : `${days} days`}
                        </span>
                      </div>
                    </div>
                    {/* Reorder status */}
                    <div className="shrink-0 w-28">
                      {p.stockLevel <= p.reorderPoint ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                          <RefreshCw className="h-3 w-3" /> Reorder Now
                        </span>
                      ) : p.stockLevel <= p.reorderPoint * 1.5 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="h-3 w-3" /> Watch
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Adequate</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts panel */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 sticky top-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-light">
              <Bell className="h-4 w-4 text-danger" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary font-heading">Low Stock Alerts</h3>
              <p className="text-xs text-text-muted">{lowStockAlerts.length} items need attention</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
            {lowStockAlerts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                onClick={() => onSelectProduct(p)}
                className="p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-xs font-medium text-text-primary leading-tight">{p.name}</p>
                  {p.stockLevel === 0 ? (
                    <XCircle className="h-3.5 w-3.5 text-danger shrink-0 ml-2" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 ml-2" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{formatNumber(p.stockLevel)} / {formatNumber(p.reorderPoint)} {p.unit}s</span>
                  <span className="font-mono">{p.sku}</span>
                </div>
                <StockBar current={p.stockLevel} reorderPoint={p.reorderPoint} compact />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- Price Books Tab ---
function PriceBooksTab({ products, onSelectProduct, onUpdatePrice }: { products: Product[]; onSelectProduct: (p: Product) => void; onUpdatePrice: (productId: string, tier: string, newPrice: number) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{ productId: string; field: "buy" | "wholesale" | "retail" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const totalPages = Math.ceil(filtered.length / 20);
  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const startEdit = (productId: string, field: "buy" | "wholesale" | "retail", currentValue: number) => {
    setEditingCell({ productId, field });
    setEditValue(currentValue.toString());
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const newPrice = parseFloat(editValue);
    if (isNaN(newPrice) || newPrice <= 0) { setEditingCell(null); return; }

    const product = products.find(p => p.id === editingCell.productId);
    if (!product) { setEditingCell(null); return; }

    if (editingCell.field === "buy") {
      // Update wholesale price (buy price) — and recalculate wholesale sell + retail
      onUpdatePrice(editingCell.productId, "wholesalePrice", Math.round(newPrice * 100) / 100);
    } else if (editingCell.field === "wholesale") {
      // They're setting a custom wholesale sell price — back-calculate the buy price
      // Or just store it as the unit price, keep buy price same
      onUpdatePrice(editingCell.productId, "unitPrice", Math.round(newPrice * 100) / 100);
      // Actually keep it simple: wholesale sell = they want this specific price
      // We store it by adjusting the unitPrice (retail-facing) proportionally
      // Simpler: just update the wholesale price to back-derive
      const buyPrice = product.wholesalePrice;
      // Store custom wholesale sell as the tier1Price field for now
      onUpdatePrice(editingCell.productId, "tier1Price", Math.round(newPrice * 100) / 100);
    } else if (editingCell.field === "retail") {
      onUpdatePrice(editingCell.productId, "unitPrice", Math.round(newPrice * 100) / 100);
    }

    setSavedFlash(editingCell.productId + editingCell.field);
    setTimeout(() => setSavedFlash(null), 1200);
    setEditingCell(null);
  };

  const jumpToNext = (currentProductId: string, currentField: "buy" | "wholesale" | "retail") => {
    const fields: ("buy" | "wholesale" | "retail")[] = ["buy", "wholesale", "retail"];
    const fieldIdx = fields.indexOf(currentField);

    // Save current first
    saveEdit();

    // Try next field on same row
    if (fieldIdx < fields.length - 1) {
      const nextField = fields[fieldIdx + 1];
      const product = products.find(p => p.id === currentProductId);
      if (product) {
        const val = nextField === "buy" ? product.wholesalePrice
          : nextField === "wholesale" ? (product.tier1Price || Math.round(product.wholesalePrice * 1.2))
          : product.unitPrice;
        setTimeout(() => startEdit(currentProductId, nextField, val), 50);
        return;
      }
    }

    // Move to first field of next row
    const currentIdx = paginated.findIndex(p => p.id === currentProductId);
    const nextProduct = paginated[currentIdx + 1];
    if (nextProduct) {
      setTimeout(() => startEdit(nextProduct.id, "buy", nextProduct.wholesalePrice), 50);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 ml-auto text-[10px] text-text-muted/60">
          <span>Click any price to edit</span>
          <span>•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[9px]">Tab</kbd> next field</span>
          <span><kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[9px]">Enter</kbd> save</span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[140px]">Unit Price (Buy)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[140px]">Wholesale Sell</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-[140px]">Retail Sell</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[90px]">WS Margin</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider w-[90px]">RT Margin</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, i) => {
                const buyPrice = p.wholesalePrice;
                const wsPrice = p.tier1Price || Math.round(buyPrice * 1.2);
                const rtPrice = p.unitPrice;
                const wsMargin = buyPrice > 0 ? ((wsPrice - buyPrice) / buyPrice * 100) : 0;
                const rtMargin = buyPrice > 0 ? ((rtPrice - buyPrice) / buyPrice * 100) : 0;
                const wsProfit = wsPrice - buyPrice;
                const rtProfit = rtPrice - buyPrice;

                const isBuyEditing = editingCell?.productId === p.id && editingCell?.field === "buy";
                const isWsEditing = editingCell?.productId === p.id && editingCell?.field === "wholesale";
                const isRtEditing = editingCell?.productId === p.id && editingCell?.field === "retail";
                const buyFlash = savedFlash === p.id + "buy";
                const wsFlash = savedFlash === p.id + "wholesale";
                const rtFlash = savedFlash === p.id + "retail";

                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-border/50 hover:bg-surface-hover/30 transition-colors group"
                  >
                    {/* Product name — click to open detail */}
                    <td className="py-2.5 px-4 cursor-pointer" onClick={() => onSelectProduct(p)}>
                      <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-[10px] text-text-muted font-mono">{p.sku} · {p.category}</p>
                    </td>

                    {/* Buy Price — editable */}
                    <td className="py-2.5 px-4 text-center">
                      {isBuyEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs text-text-muted">$</span>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { saveEdit(); }
                              else if (e.key === "Tab") { e.preventDefault(); jumpToNext(p.id, "buy"); }
                              else if (e.key === "Escape") setEditingCell(null);
                            }}
                            autoFocus
                            className="w-20 text-center text-sm font-mono font-bold bg-surface border-2 border-amber-400 rounded-lg px-2 py-1 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(p.id, "buy", buyPrice); }}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all",
                            buyFlash ? "bg-emerald-500/20 ring-1 ring-emerald-500/40" : "hover:bg-amber-500/10"
                          )}
                        >
                          <span className="text-sm font-mono font-bold text-amber-400">${buyPrice.toFixed(2)}</span>
                          <Pencil className="h-2.5 w-2.5 text-amber-400/30 group-hover:text-amber-400/70 transition-colors" />
                        </button>
                      )}
                    </td>

                    {/* Wholesale Sell — editable */}
                    <td className="py-2.5 px-4 text-center">
                      {isWsEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs text-text-muted">$</span>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { saveEdit(); }
                              else if (e.key === "Tab") { e.preventDefault(); jumpToNext(p.id, "wholesale"); }
                              else if (e.key === "Escape") setEditingCell(null);
                            }}
                            autoFocus
                            className="w-20 text-center text-sm font-mono font-bold bg-surface border-2 border-emerald-400 rounded-lg px-2 py-1 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(p.id, "wholesale", wsPrice); }}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all",
                            wsFlash ? "bg-emerald-500/20 ring-1 ring-emerald-500/40" : "hover:bg-emerald-500/10"
                          )}
                        >
                          <span className="text-sm font-mono font-bold text-emerald-400">${wsPrice.toFixed(2)}</span>
                          <Pencil className="h-2.5 w-2.5 text-emerald-400/30 group-hover:text-emerald-400/70 transition-colors" />
                        </button>
                      )}
                    </td>

                    {/* Retail Sell — editable */}
                    <td className="py-2.5 px-4 text-center">
                      {isRtEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs text-text-muted">$</span>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { saveEdit(); }
                              else if (e.key === "Tab") { e.preventDefault(); jumpToNext(p.id, "retail"); }
                              else if (e.key === "Escape") setEditingCell(null);
                            }}
                            autoFocus
                            className="w-20 text-center text-sm font-mono font-bold bg-surface border-2 border-blue-400 rounded-lg px-2 py-1 text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(p.id, "retail", rtPrice); }}
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all",
                            rtFlash ? "bg-emerald-500/20 ring-1 ring-emerald-500/40" : "hover:bg-blue-500/10"
                          )}
                        >
                          <span className="text-sm font-mono font-bold text-blue-400">${rtPrice.toFixed(2)}</span>
                          <Pencil className="h-2.5 w-2.5 text-blue-400/30 group-hover:text-blue-400/70 transition-colors" />
                        </button>
                      )}
                    </td>

                    {/* Wholesale Margin */}
                    <td className="py-2.5 px-4 text-right">
                      <span className={cn("text-xs font-bold", wsMargin >= 20 ? "text-emerald-400" : wsMargin >= 10 ? "text-amber-400" : "text-red-400")}>
                        {wsMargin.toFixed(0)}%
                      </span>
                      <p className="text-[9px] font-mono text-text-muted">+${wsProfit.toFixed(0)}</p>
                    </td>

                    {/* Retail Margin */}
                    <td className="py-2.5 px-4 text-right">
                      <span className={cn("text-xs font-bold", rtMargin >= 30 ? "text-emerald-400" : rtMargin >= 15 ? "text-amber-400" : "text-red-400")}>
                        {rtMargin.toFixed(0)}%
                      </span>
                      <p className="text-[9px] font-mono text-text-muted">+${rtProfit.toFixed(0)}</p>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 rounded-lg text-xs font-medium transition-colors", page === n ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Price Change Alerts Section */}
      <div className="mt-8 pt-6 border-t border-border">
        <PriceChangeAlerts />
      </div>
    </div>
  );
}

// --- Stocktake Tab ---
interface StocktakeItem {
  productId: string;
  productName: string;
  sku: string;
  systemStock: number;
  countedStock: number;
  variance: number;
  variancePct: number;
  status: "Match" | "Minor Variance" | "Major Variance";
  unit: string;
}

function generateStocktakeData(products: Product[]): StocktakeItem[] {
  // Use a seeded approach so results are consistent per render
  return products.slice(0, 30).map((p, i) => {
    // Deterministic "random" variance per product
    const seed = (i * 7 + 3) % 11;
    let countedStock: number;
    if (seed <= 3) {
      // Exact match
      countedStock = p.stockLevel;
    } else if (seed <= 6) {
      // Minor variance (under 10%)
      const dir = seed % 2 === 0 ? 1 : -1;
      const pctOff = (seed * 1.5 + 1) / 100;
      countedStock = Math.round(p.stockLevel * (1 + dir * pctOff));
    } else {
      // Major variance (over 10%)
      const dir = seed % 2 === 0 ? 1 : -1;
      const pctOff = (seed * 2.2 + 5) / 100;
      countedStock = Math.max(0, Math.round(p.stockLevel * (1 + dir * pctOff)));
    }

    const variance = countedStock - p.stockLevel;
    const variancePct = p.stockLevel > 0 ? (Math.abs(variance) / p.stockLevel) * 100 : countedStock > 0 ? 100 : 0;
    let status: StocktakeItem["status"] = "Match";
    if (variancePct > 0 && variancePct <= 10) status = "Minor Variance";
    else if (variancePct > 10) status = "Major Variance";

    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      systemStock: p.stockLevel,
      countedStock,
      variance,
      variancePct,
      status,
      unit: p.unit,
    };
  });
}

function StocktakeTab({ products }: { products: Product[] }) {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [stocktakeData, setStocktakeData] = useState<StocktakeItem[]>([]);
  const [applyConfirm, setApplyConfirm] = useState(false);

  const handleUpload = () => {
    setUploadState("uploading");
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState("processing");
          // Simulate processing
          setTimeout(() => {
            setStocktakeData(generateStocktakeData(products));
            setUploadState("done");
          }, 1500);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUpload();
  };

  const handleApply = () => {
    setApplyConfirm(true);
    setTimeout(() => setApplyConfirm(false), 3000);
  };

  const stats = useMemo(() => {
    if (stocktakeData.length === 0) return null;
    const matches = stocktakeData.filter(i => i.status === "Match").length;
    const minorVar = stocktakeData.filter(i => i.status === "Minor Variance").length;
    const majorVar = stocktakeData.filter(i => i.status === "Major Variance").length;
    const totalValueVariance = stocktakeData.reduce((s, item) => {
      const product = products.find(p => p.id === item.productId);
      const price = product?.wholesalePrice || 0;
      return s + (item.variance * price);
    }, 0);
    return { matches, minorVar, majorVar, totalItems: stocktakeData.length, totalValueVariance };
  }, [stocktakeData, products]);

  const statusConfig = {
    Match: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: CheckCircle2 },
    "Minor Variance": { bg: "bg-amber-500/15", text: "text-amber-400", icon: AlertCircle },
    "Major Variance": { bg: "bg-red-500/15", text: "text-red-400", icon: AlertTriangle },
  };

  return (
    <div className="space-y-6">
      {/* Last stocktake info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Last Stocktake</p>
            <p className="text-xs text-text-muted">March 14, 2026 — 48 items counted, 7 variances found</p>
          </div>
        </div>
        {uploadState === "done" && (
          <button
            onClick={() => { setUploadState("idle"); setStocktakeData([]); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-secondary text-sm font-medium transition-colors"
          >
            <Upload className="h-4 w-4" /> New Stocktake
          </button>
        )}
      </div>

      {/* Upload zone - show when idle or uploading */}
      {(uploadState === "idle" || uploadState === "uploading" || uploadState === "processing") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          {uploadState === "idle" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-colors",
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                  isDragOver ? "bg-primary/20" : "bg-surface-hover"
                )}>
                  <FileSpreadsheet className={cn("h-8 w-8", isDragOver ? "text-primary" : "text-text-muted")} />
                </div>
                <div>
                  <p className="text-base font-medium text-text-primary">
                    {isDragOver ? "Drop your file here" : "Upload Stocktake File"}
                  </p>
                  <p className="text-sm text-text-muted mt-1">Drag & drop a CSV or XLS file, or click to browse</p>
                </div>
                <button
                  onClick={handleUpload}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                >
                  <Upload className="h-4 w-4" /> Select File
                </button>
                <p className="text-xs text-text-muted">Supports CSV, XLS, XLSX. Max 10MB.</p>
              </div>
            </div>
          )}

          {(uploadState === "uploading" || uploadState === "processing") && (
            <div className="flex flex-col items-center gap-6 py-8">
              <motion.div
                animate={{ rotate: uploadState === "processing" ? 360 : 0 }}
                transition={{ repeat: uploadState === "processing" ? Infinity : 0, duration: 1, ease: "linear" }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20"
              >
                {uploadState === "processing" ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </motion.div>
              <div className="text-center">
                <p className="text-base font-medium text-text-primary">
                  {uploadState === "uploading" ? "Uploading stocktake file..." : "Processing & matching inventory..."}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  {uploadState === "uploading" ? "stocktake_march_2026.csv" : "Comparing against system stock levels"}
                </p>
              </div>
              <div className="w-80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">
                    {uploadState === "uploading" ? "Uploading" : "Analyzing"}
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {uploadState === "uploading" ? `${Math.min(Math.round(progress), 100)}%` : "Matching SKUs..."}
                  </span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: uploadState === "processing" ? "100%" : `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Results */}
      {uploadState === "done" && stats && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Items Counted", value: stats.totalItems.toString(), icon: ClipboardCheck, color: "text-primary", bg: "bg-primary-light" },
              { label: "Exact Matches", value: stats.matches.toString(), icon: CheckCircle2, color: "text-success", bg: "bg-success-light" },
              { label: "Variances Found", value: (stats.minorVar + stats.majorVar).toString(), icon: AlertTriangle, color: "text-warning", bg: "bg-warning-light" },
              { label: "Value Variance", value: formatCurrency(Math.abs(stats.totalValueVariance)), icon: DollarSign, color: stats.totalValueVariance < 0 ? "text-danger" : "text-success", bg: stats.totalValueVariance < 0 ? "bg-danger-light" : "bg-success-light" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{stat.label}</span>
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.bg)}>
                      <Icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-heading text-text-primary">{stat.value}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Product</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">SKU</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">System Stock</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Counted Stock</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Variance</th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stocktakeData.map((item, i) => {
                    const cfg = statusConfig[item.status];
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.tr
                        key={item.productId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-text-primary">{item.productName}</td>
                        <td className="py-3 px-4 font-mono text-xs text-text-muted">{item.sku}</td>
                        <td className="py-3 px-4 text-right text-text-secondary">{item.systemStock.toLocaleString()} {item.unit}s</td>
                        <td className="py-3 px-4 text-right text-text-primary font-medium">{item.countedStock.toLocaleString()} {item.unit}s</td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            "font-medium",
                            item.variance === 0 ? "text-text-muted" :
                            item.variance > 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {item.variance === 0 ? "0" : item.variance > 0 ? `+${item.variance.toLocaleString()}` : item.variance.toLocaleString()}
                            {item.variancePct > 0 && (
                              <span className="text-xs ml-1 text-text-muted">({item.variancePct.toFixed(1)}%)</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.bg, cfg.text)}>
                            <StatusIcon className="h-3 w-3" />
                            {item.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Apply button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between"
          >
            <p className="text-xs text-text-muted">
              Applying updates will adjust system stock levels to match counted quantities for all items with variances.
            </p>
            <button
              onClick={handleApply}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
                applyConfirm
                  ? "bg-emerald-600 text-white"
                  : "bg-primary hover:bg-primary-hover text-white"
              )}
            >
              {applyConfirm ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Updates Applied!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Apply Updates
                </>
              )}
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}

// --- CSV Parser ---
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header — handle quoted fields
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Map common header variations to our field names
  const headerMap: Record<string, string> = {
    sku: "sku", skucode: "sku", productsku: "sku", itemsku: "sku", code: "sku",
    name: "name", productname: "name", product: "name", itemname: "name", description: "name", item: "name",
    category: "category", productcategory: "category", cat: "category", type: "category",
    unitprice: "unitPrice", retailprice: "unitPrice", retail: "unitPrice", price: "unitPrice", listprice: "unitPrice", msrp: "unitPrice",
    wholesaleprice: "wholesalePrice", wholesale: "wholesalePrice", costprice: "wholesalePrice", cost: "wholesalePrice", buyprice: "wholesalePrice", landedcost: "wholesalePrice",
    tier1price: "tier1Price", tier1: "tier1Price",
    tier2price: "tier2Price", tier2: "tier2Price",
    tier3price: "tier3Price", tier3: "tier3Price",
    vipprice: "vipPrice", vip: "vipPrice",
    stocklevel: "stockLevel", stock: "stockLevel", qty: "stockLevel", quantity: "stockLevel", onhand: "stockLevel",
    reorderpoint: "reorderPoint", reorder: "reorderPoint", minstock: "reorderPoint",
    supplier: "supplier", vendor: "supplier",
    warehouse: "warehouse", location: "warehouse",
    unit: "unit", uom: "unit",
    weight: "weight",
    status: "status",
  };

  const mappedHeaders = headers.map(h => headerMap[h] || h);

  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    mappedHeaders.forEach((header, i) => {
      if (values[i] !== undefined && values[i] !== "") {
        row[header] = values[i];
      }
    });
    return row;
  });
}

// --- Import Modal ---
type ImportRow = Record<string, any> & { _match?: any; _action?: "create" | "update" | "skip" };

function ImportModal({
  onClose,
  existingProducts,
  onImportComplete
}: {
  onClose: () => void;
  existingProducts: Product[];
  onImportComplete: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    setError("");
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv") && !file.name.endsWith(".txt")) {
      setError("Please upload a CSV file (.csv, .tsv, or .txt)");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) { setError("File is empty"); return; }

      const rows = parseCSV(text);
      if (rows.length === 0) { setError("No data rows found. Make sure your CSV has headers and data."); return; }

      // Match against existing products
      const enriched = rows.map(row => {
        const enrichedRow: ImportRow = { ...row };
        // Find matching product by SKU or name
        let match = null;
        if (row.sku) {
          match = existingProducts.find(p => p.sku.toLowerCase() === row.sku.toLowerCase());
        }
        if (!match && row.name) {
          match = existingProducts.find(p => p.name.toLowerCase() === row.name.toLowerCase());
        }
        enrichedRow._match = match || null;
        enrichedRow._action = match ? "update" : "create";
        return enrichedRow;
      });

      setParsedRows(enriched);
      setStep("preview");
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setStep("importing");
    try {
      const products = parsedRows
        .filter(r => r._action !== "skip")
        .map(({ _match, _action, ...row }) => row);

      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      if (!res.ok) throw new Error("Import failed");
      const results = await res.json();
      setImportResults(results);
      setStep("done");
      toast.success("Products imported successfully");
    } catch (err: any) {
      toast.error(err.message || "Import failed");
      setError(err.message || "Import failed");
      setStep("preview");
    }
  };

  const toggleRowAction = (idx: number) => {
    setParsedRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      return { ...r, _action: r._action === "skip" ? (r._match ? "update" : "create") : "skip" };
    }));
  };

  const createCount = parsedRows.filter(r => r._action === "create").length;
  const updateCount = parsedRows.filter(r => r._action === "update").length;
  const skipCount = parsedRows.filter(r => r._action === "skip").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <FileUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary">Import Products</h2>
              <p className="text-xs text-text-muted">
                {step === "upload" && "Upload a CSV file to bulk import or update products"}
                {step === "preview" && `${parsedRows.length} rows found in ${fileName}`}
                {step === "importing" && "Processing your import..."}
                {step === "done" && "Import complete!"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-surface-hover/30"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <Upload className={cn("h-12 w-12 mx-auto mb-4", dragOver ? "text-primary" : "text-text-muted")} />
                <p className="text-lg font-medium text-text-primary mb-1">
                  {dragOver ? "Drop your file here" : "Drop CSV file here or click to browse"}
                </p>
                <p className="text-sm text-text-muted">Supports .csv, .tsv files</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* CSV Format Guide */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  CSV Format Guide
                </h3>
                <p className="text-xs text-text-muted mb-3">
                  Your CSV should have headers in the first row. We auto-detect common column names:
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    ["SKU *", "sku, code, itemsku, productsku"],
                    ["Product Name *", "name, product, item, description"],
                    ["Unit Price", "unitprice, retail, price, msrp, listprice"],
                    ["Wholesale Price", "wholesale, cost, buyprice, landedcost"],
                    ["Category", "category, type, cat"],
                    ["Stock Level", "stock, qty, quantity, onhand"],
                    ["Supplier", "supplier, vendor"],
                    ["Warehouse", "warehouse, location"],
                  ].map(([label, aliases]) => (
                    <div key={label} className="flex items-start gap-2 py-1">
                      <span className="text-xs font-medium text-text-primary w-28 shrink-0">{label}</span>
                      <span className="text-xs text-text-muted">{aliases}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-surface-hover/50">
                  <p className="text-xs font-medium text-text-muted mb-1">Example CSV:</p>
                  <code className="text-[11px] text-primary font-mono">
                    sku,name,unitprice,wholesale,category,stock<br />
                    SKU-9001,Premium Coffee Beans 5lb,48,32,Food &amp; Beverage,500<br />
                    SKU-1001,Organic Olive Oil 5L,45,30,Food &amp; Beverage,
                  </code>
                  <p className="text-[10px] text-text-muted mt-2">
                    * Existing products (matched by SKU or name) will have their prices updated. New products will be created.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csv = "sku,name,unitprice,wholesale,category,stock,supplier,warehouse\nSKU-9001,Premium Coffee Beans 5lb,48,32,Food & Beverage,500,Pacific Trade Inc.,Warehouse A - West\nSKU-1001,Organic Olive Oil 5L,45,30,Food & Beverage,,Global Supply Co.,";
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "product_import_template.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="mt-3 flex items-center gap-2 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template CSV
                </button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Summary badges */}
              <div className="flex items-center gap-3">
                {createCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                    <Plus className="h-3 w-3" /> {createCount} new product{createCount !== 1 ? "s" : ""}
                  </span>
                )}
                {updateCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
                    <ArrowLeftRight className="h-3 w-3" /> {updateCount} to update
                  </span>
                )}
                {skipCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400">
                    <X className="h-3 w-3" /> {skipCount} skipped
                  </span>
                )}
              </div>

              {/* Preview table */}
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto max-h-[45vh]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface z-10">
                      <tr className="border-b border-border">
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider w-20">Action</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">SKU</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Name</th>
                        <th className="py-2.5 px-3 text-right text-[10px] font-medium text-text-muted uppercase tracking-wider">Unit Price</th>
                        <th className="py-2.5 px-3 text-right text-[10px] font-medium text-text-muted uppercase tracking-wider">Wholesale</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Category</th>
                        <th className="py-2.5 px-3 text-right text-[10px] font-medium text-text-muted uppercase tracking-wider">Stock</th>
                        <th className="py-2.5 px-3 text-center text-[10px] font-medium text-text-muted uppercase tracking-wider w-16">Skip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => {
                        const isUpdate = row._action === "update";
                        const isSkip = row._action === "skip";
                        const match = row._match;
                        const priceChanged = match && (
                          (row.unitPrice && Number(row.unitPrice) !== match.unitPrice) ||
                          (row.wholesalePrice && Number(row.wholesalePrice) !== match.wholesalePrice)
                        );

                        return (
                          <tr
                            key={idx}
                            className={cn(
                              "border-b border-border/50 transition-colors",
                              isSkip ? "opacity-40" : "hover:bg-surface-hover/30"
                            )}
                          >
                            <td className="py-2 px-3">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                isSkip ? "bg-gray-500/15 text-gray-400" :
                                isUpdate ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
                              )}>
                                {isSkip ? "Skip" : isUpdate ? "Update" : "New"}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-text-secondary">{row.sku || "—"}</td>
                            <td className="py-2 px-3">
                              <span className="text-text-primary font-medium text-xs">{row.name || "—"}</span>
                              {isUpdate && match && (
                                <p className="text-[10px] text-text-muted">Matched: {match.name}</p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {row.unitPrice ? (
                                <div>
                                  <span className="text-xs font-medium text-text-primary">{formatCurrency(Number(row.unitPrice))}</span>
                                  {isUpdate && match && Number(row.unitPrice) !== match.unitPrice && (
                                    <p className="text-[10px] text-text-muted">was {formatCurrency(match.unitPrice)}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-muted text-xs">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {row.wholesalePrice ? (
                                <div>
                                  <span className="text-xs font-medium text-text-primary">{formatCurrency(Number(row.wholesalePrice))}</span>
                                  {isUpdate && match && Number(row.wholesalePrice) !== match.wholesalePrice && (
                                    <p className="text-[10px] text-text-muted">was {formatCurrency(match.wholesalePrice)}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-muted text-xs">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-text-secondary">{row.category || "—"}</td>
                            <td className="py-2 px-3 text-right text-xs text-text-secondary">{row.stockLevel || "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => toggleRowAction(idx)}
                                className={cn(
                                  "p-1 rounded transition-colors",
                                  isSkip ? "text-red-400 hover:bg-red-500/10" : "text-text-muted hover:text-red-400 hover:bg-red-500/10"
                                )}
                              >
                                {isSkip ? <Plus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-text-primary">Importing products...</p>
              <p className="text-sm text-text-muted mt-1">Processing {parsedRows.filter(r => r._action !== "skip").length} products</p>
            </div>
          )}

          {/* Done Step */}
          {step === "done" && importResults && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-text-primary">Import Complete!</h3>
                <p className="text-sm text-text-muted mt-1">Your inventory has been updated successfully</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-emerald-400">{importResults.created}</p>
                  <p className="text-xs text-text-muted mt-1">Products Created</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-blue-400">{importResults.updated}</p>
                  <p className="text-xs text-text-muted mt-1">Products Updated</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-gray-400">{importResults.skipped}</p>
                  <p className="text-xs text-text-muted mt-1">Skipped</p>
                </div>
              </div>

              {importResults.errors?.length > 0 && (
                <div className="glass-card p-4">
                  <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {importResults.errors.length} Error{importResults.errors.length !== 1 ? "s" : ""}
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResults.errors.map((err: string, i: number) => (
                      <p key={i} className="text-xs text-text-muted">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/50">
          {step === "upload" && (
            <>
              <div />
              <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
                Cancel
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => { setStep("upload"); setParsedRows([]); setFileName(""); setError(""); }}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">
                  {createCount + updateCount} product{createCount + updateCount !== 1 ? "s" : ""} will be processed
                </span>
                <button
                  onClick={handleImport}
                  disabled={createCount + updateCount === 0}
                  className={cn(
                    "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                    createCount + updateCount > 0
                      ? "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25"
                      : "bg-surface text-text-muted cursor-not-allowed"
                  )}
                >
                  <Upload className="h-4 w-4" /> Import {createCount + updateCount} Product{createCount + updateCount !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}
          {step === "done" && (
            <>
              <div />
              <button
                onClick={() => { onImportComplete(); onClose(); }}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                <CheckCircle2 className="h-4 w-4" /> Done
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Create Product Modal ---
function CreateProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    category: "Food & Beverage",
    unitPrice: 0,
    wholesalePrice: 0,
    stockLevel: 0,
    reorderPoint: 0,
    warehouse: "Warehouse A - West",
    unit: "case",
    supplier: "Global Supply Co.",
    leadTimeDays: 7,
    weight: 0,
    imageUrl: "",
    brand: "",
    brandWebsite: "",
    tags: "",
  });

  const productCategories = ["Food & Beverage", "Building Materials", "Packaging", "Industrial", "Chemicals", "Agriculture", "Paper Goods"];
  const warehouses = ["Warehouse A - West", "Warehouse B - Central", "Warehouse C - East"];
  const suppliers = ["Global Supply Co.", "Pacific Trade Inc.", "Midwest Wholesale", "Southern Distributors", "Atlantic Imports"];

  const update = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.sku.trim()) { setError("SKU is required."); return; }
    if (!form.name.trim()) { setError("Product name is required."); return; }
    setError("");
    setSaving(true);
    try {
      const wp = Number(form.wholesalePrice) || 0;
      const body: any = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category,
        unitPrice: Number(form.unitPrice) || 0,
        wholesalePrice: wp,
        tier1Price: Math.round(wp * 0.95),
        tier2Price: Math.round(wp * 0.9),
        tier3Price: Math.round(wp * 0.85),
        vipPrice: Math.round(wp * 0.8),
        stockLevel: Number(form.stockLevel) || 0,
        reorderPoint: Number(form.reorderPoint) || 0,
        warehouseLocation: "Aisle 1-Rack 1",
        warehouse: form.warehouse,
        unit: form.unit.trim() || "case",
        weight: Number(form.weight) || 0,
        supplier: form.supplier,
        leadTimeDays: Number(form.leadTimeDays) || 0,
        status: Number(form.stockLevel) === 0 ? "Out of Stock" : Number(form.stockLevel) <= Number(form.reorderPoint) ? "Low Stock" : "Active",
      };
      if (form.description.trim()) body.description = form.description.trim();
      if (form.imageUrl.trim()) body.imageUrl = form.imageUrl.trim();
      if (form.brand.trim()) body.brand = form.brand.trim();
      if (form.brandWebsite.trim()) body.brandWebsite = form.brandWebsite.trim();
      if (form.tags.trim()) body.tags = form.tags.trim();
      const res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to create product");
      toast.success("Product created successfully");
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Failed to create product");
      setError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors";
  const labelClass = "block text-xs font-medium text-text-secondary mb-1";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Add Product</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>SKU *</label>
              <input type="text" value={form.sku} onChange={e => update("sku", e.target.value)} placeholder="SKU-1001" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Product Name *</label>
              <input type="text" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Organic Olive Oil 5L" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={e => update("category", e.target.value)} className={inputClass}>
                {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <input type="text" value={form.unit} onChange={e => update("unit", e.target.value)} placeholder="case, bag, bottle..." className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Unit Price ($)</label>
              <input type="number" value={form.unitPrice} onChange={e => update("unitPrice", e.target.value)} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Wholesale Price ($)</label>
              <input type="number" value={form.wholesalePrice} onChange={e => update("wholesalePrice", e.target.value)} placeholder="0" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Stock Level</label>
              <input type="number" value={form.stockLevel} onChange={e => update("stockLevel", e.target.value)} placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reorder Point</label>
              <input type="number" value={form.reorderPoint} onChange={e => update("reorderPoint", e.target.value)} placeholder="0" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Warehouse</label>
              <select value={form.warehouse} onChange={e => update("warehouse", e.target.value)} className={inputClass}>
                {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Supplier</label>
              <select value={form.supplier} onChange={e => update("supplier", e.target.value)} className={inputClass}>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Lead Time (Days)</label>
              <input type="number" value={form.leadTimeDays} onChange={e => update("leadTimeDays", e.target.value)} placeholder="7" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Weight (lbs)</label>
              <input type="number" value={form.weight} onChange={e => update("weight", e.target.value)} placeholder="0" className={inputClass} />
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Brand & Details</p>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Product description..." rows={3} className={cn(inputClass, "resize-none")} />
          </div>

          <div>
            <label className={labelClass}>Image URL</label>
            <input type="text" value={form.imageUrl} onChange={e => update("imageUrl", e.target.value)} placeholder="https://images.unsplash.com/..." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Brand</label>
              <input type="text" value={form.brand} onChange={e => update("brand", e.target.value)} placeholder="Brand name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Brand Website</label>
              <input type="text" value={form.brandWebsite} onChange={e => update("brandWebsite", e.target.value)} placeholder="https://www.brand.com" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="organic, premium, bulk" className={inputClass} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary bg-surface border border-border hover:border-primary/50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50">
            {saving ? <><Clock className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save Product</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Brands Tab ---
function BrandsTab({ products, onSelectBrand }: { products: Product[]; onSelectBrand: (brand: string) => void }) {
  const brandData = useMemo(() => {
    const map: Record<string, { brand: string; brandWebsite: string; imageUrl: string | null; productCount: number; totalValue: number; categories: Set<string> }> = {};
    products.forEach(p => {
      const brand = p.brand || "Unbranded";
      if (!map[brand]) {
        map[brand] = {
          brand,
          brandWebsite: p.brandWebsite || "",
          imageUrl: p.imageUrl || null,
          productCount: 0,
          totalValue: 0,
          categories: new Set(),
        };
      }
      map[brand].productCount++;
      map[brand].totalValue += p.stockLevel * p.wholesalePrice;
      map[brand].categories.add(p.category);
      if (!map[brand].imageUrl && p.imageUrl) map[brand].imageUrl = p.imageUrl;
    });
    return Object.values(map).sort((a, b) => b.totalValue - a.totalValue);
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{brandData.length} brands across your catalog</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {brandData.map((b, i) => (
          <motion.div
            key={b.brand}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelectBrand(b.brand)}
            className="glass-card p-5 hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-4">
              {b.imageUrl ? (
                <img src={b.imageUrl} alt={b.brand} className="h-12 w-12 rounded-xl object-cover border border-border" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-border">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary transition-colors">{b.brand}</p>
                <p className="text-[10px] text-text-muted truncate">{Array.from(b.categories).join(", ")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Products</span>
                <span className="font-medium text-text-primary">{b.productCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Inventory Value</span>
                <span className="font-medium text-emerald-400">{formatCurrency(b.totalValue)}</span>
              </div>
            </div>
            {b.brandWebsite && (
              <a
                href={b.brandWebsite}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 mt-3 text-[10px] text-primary/60 hover:text-primary transition-colors"
              >
                <Globe className="h-3 w-3" /> {b.brandWebsite.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- NPD & Innovation Tab ---
function NPDTab() {
  const [activeSection, setActiveSection] = useState<"pipeline" | "ideas" | "recipes">("pipeline");

  const pipelineStages = ["Concept", "Research", "Testing", "Launch Ready", "Launched"];
  const stageColors: Record<string, { bg: string; text: string; border: string }> = {
    Concept: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    Research: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    Testing: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    "Launch Ready": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    Launched: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  };

  const pipelineItems = [
    { id: "npd-1", name: "Organic Hemp Protein Bar", stage: "Testing", targetMarket: "Health-conscious consumers", estimatedCost: 2.40, potentialRevenue: 5.99, owner: "Sarah Mitchell", progress: 72, notes: "Third batch testing complete. Adjusting sweetness level." },
    { id: "npd-2", name: "Zero-Waste Packaging Line", stage: "Research", targetMarket: "Eco-conscious businesses", estimatedCost: 0.85, potentialRevenue: 2.50, owner: "David Lee", progress: 35, notes: "Evaluating compostable materials from 3 suppliers." },
    { id: "npd-3", name: "Cold Brew Coffee Concentrate", stage: "Launch Ready", targetMarket: "Cafes and restaurants", estimatedCost: 8.50, potentialRevenue: 24.99, owner: "Mike Thompson", progress: 95, notes: "Final packaging approved. Launch date set for April 15." },
    { id: "npd-4", name: "Premium Wagyu Beef Jerky", stage: "Concept", targetMarket: "Premium snack market", estimatedCost: 12.00, potentialRevenue: 34.99, owner: "Sarah Mitchell", progress: 10, notes: "Initial concept approved by product committee." },
    { id: "npd-5", name: "Plant-Based Cheese Alternative", stage: "Testing", targetMarket: "Vegan/vegetarian food service", estimatedCost: 3.20, potentialRevenue: 8.99, owner: "Alex Rivera", progress: 58, notes: "Taste panel feedback: 4.2/5 rating. Improving melt properties." },
    { id: "npd-6", name: "Artisan Hot Sauce Collection", stage: "Launched", targetMarket: "Specialty food retailers", estimatedCost: 1.80, potentialRevenue: 7.99, owner: "David Lee", progress: 100, notes: "Successfully launched in 45 accounts. Reorder rate: 68%." },
    { id: "npd-7", name: "Sustainable Bamboo Utensil Set", stage: "Research", targetMarket: "Catering and events", estimatedCost: 0.45, potentialRevenue: 1.99, owner: "Jennifer Clark", progress: 28, notes: "Sourcing bamboo suppliers with FSC certification." },
    { id: "npd-8", name: "Keto-Friendly Bread Mix", stage: "Concept", targetMarket: "Health-focused bakeries", estimatedCost: 4.50, potentialRevenue: 12.99, owner: "Mike Thompson", progress: 15, notes: "R&D exploring almond flour and psyllium husk base." },
  ];

  const innovationIdeas = [
    { id: "idea-1", title: "AI-Powered Inventory Forecasting", description: "Use machine learning to predict demand patterns and automatically adjust reorder points based on seasonal trends and customer behavior.", targetMarket: "Internal operations", estimatedCost: 50000, potentialRevenue: 200000, status: "Under Review", votes: 12 },
    { id: "idea-2", title: "Subscription Box Service", description: "Monthly curated box of trending wholesale products for small business owners. Test new products and build loyalty.", targetMarket: "SMB customers", estimatedCost: 15000, potentialRevenue: 180000, status: "Approved", votes: 18 },
    { id: "idea-3", title: "Private Label Organic Line", description: "Develop our own brand of organic staples (flour, sugar, oils) to capture higher margins in the growing organic wholesale market.", targetMarket: "Health food stores", estimatedCost: 75000, potentialRevenue: 500000, status: "In Progress", votes: 24 },
    { id: "idea-4", title: "Flash-Frozen Meal Prep Kits", description: "Pre-portioned ingredient kits for restaurant kitchens. Reduces prep time by 40% and food waste by 25%.", targetMarket: "Restaurant chains", estimatedCost: 35000, potentialRevenue: 320000, status: "Submitted", votes: 8 },
    { id: "idea-5", title: "Blockchain Supply Chain Tracking", description: "Implement farm-to-table traceability for all produce and meat products. Differentiate with full transparency.", targetMarket: "Premium restaurants", estimatedCost: 120000, potentialRevenue: 90000, status: "Submitted", votes: 5 },
  ];

  const recipes = [
    { id: "recipe-1", name: "Mediterranean Power Bowl", ingredients: ["Organic Quinoa", "EVOO Premium", "Mixed Greens", "Avocados", "Sea Salt"], method: "Toast quinoa, dress greens with EVOO and lemon, top with sliced avocado and cherry tomatoes.", linkedProducts: ["SKU-1015", "SKU-1007", "SKU-1013", "SKU-1014", "SKU-1003"], status: "Finalized", costPerServing: 3.45 },
    { id: "recipe-2", name: "Artisan Pizza Dough", ingredients: ["All-Purpose Flour", "Organic Olive Oil", "Sea Salt", "Sugar Granulated"], method: "Combine flour, salt, sugar, and yeast. Add water and oil. Knead 10 minutes, proof 24 hours cold.", linkedProducts: ["SKU-1004", "SKU-1001", "SKU-1003", "SKU-1005"], status: "Testing", costPerServing: 0.85 },
    { id: "recipe-3", name: "Cajun Shrimp Pasta", ingredients: ["Frozen Shrimp", "Pasta Variety Case", "Butter Unsalted", "San Marzano Tomatoes"], method: "Saute shrimp in butter with cajun spice, add crushed tomatoes and cream, toss with cooked penne.", linkedProducts: ["SKU-1010", "SKU-1008", "SKU-1006", "SKU-1009"], status: "Finalized", costPerServing: 6.20 },
    { id: "recipe-4", name: "Superfood Smoothie Base", ingredients: ["Chia Seeds", "Coconut Oil", "Organic Quinoa"], method: "Blend soaked chia with coconut oil, cooked quinoa, banana, and plant milk. Strain and portion.", linkedProducts: ["SKU-1016", "SKU-1017", "SKU-1015"], status: "In Development", costPerServing: 2.10 },
  ];

  const ideaStatusConfig: Record<string, { bg: string; text: string }> = {
    Submitted: { bg: "bg-gray-500/15", text: "text-gray-400" },
    "Under Review": { bg: "bg-amber-500/15", text: "text-amber-400" },
    Approved: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
    "In Progress": { bg: "bg-blue-500/15", text: "text-blue-400" },
  };

  const recipeStatusConfig: Record<string, { bg: string; text: string }> = {
    "In Development": { bg: "bg-amber-500/15", text: "text-amber-400" },
    Testing: { bg: "bg-blue-500/15", text: "text-blue-400" },
    Finalized: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
        {[
          { key: "pipeline" as const, label: "Product Pipeline", icon: Rocket },
          { key: "ideas" as const, label: "Innovation Ideas", icon: Lightbulb },
          { key: "recipes" as const, label: "Recipe Lab", icon: FlaskConical },
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeSection === section.key ? "bg-primary text-white" : "text-text-muted hover:text-text-secondary"
            )}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Pipeline Section */}
      {activeSection === "pipeline" && (
        <motion.div key="pipeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stage progress bar */}
          <div className="glass-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Development Pipeline</h3>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                {pipelineStages.map(stage => {
                  const count = pipelineItems.filter(p => p.stage === stage).length;
                  return (
                    <div key={stage} className="flex items-center gap-1.5">
                      <div className={cn("h-2 w-2 rounded-full", stageColors[stage].bg, stageColors[stage].text.replace("text-", "bg-"))} />
                      <span>{stage} ({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-surface-hover">
              {pipelineStages.map(stage => {
                const count = pipelineItems.filter(p => p.stage === stage).length;
                const pct = (count / pipelineItems.length) * 100;
                return (
                  <div key={stage} className={cn("h-full transition-all", stageColors[stage].text.replace("text-", "bg-"))} style={{ width: `${pct}%` }} />
                );
              })}
            </div>
          </div>

          {/* Pipeline cards grouped by stage */}
          <div className="grid grid-cols-5 gap-4">
            {pipelineStages.map(stage => (
              <div key={stage}>
                <div className={cn("flex items-center gap-2 mb-3 px-2")}>
                  <div className={cn("h-2 w-2 rounded-full", stageColors[stage].text.replace("text-", "bg-"))} />
                  <span className={cn("text-xs font-semibold uppercase tracking-wider", stageColors[stage].text)}>{stage}</span>
                  <span className="text-[10px] text-text-muted ml-auto">{pipelineItems.filter(p => p.stage === stage).length}</span>
                </div>
                <div className="space-y-3">
                  {pipelineItems.filter(p => p.stage === stage).map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn("glass-card p-4 border", stageColors[stage].border)}
                    >
                      <p className="text-sm font-medium text-text-primary mb-1">{item.name}</p>
                      <p className="text-[10px] text-text-muted mb-3">{item.targetMarket}</p>
                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-text-muted">Progress</span>
                          <span className={cn("text-[10px] font-medium", stageColors[stage].text)}>{item.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", stageColors[stage].text.replace("text-", "bg-"))} style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-text-muted">
                        <span>Cost: {formatCurrency(item.estimatedCost)}</span>
                        <span>Rev: {formatCurrency(item.potentialRevenue)}</span>
                      </div>
                      <p className="text-[10px] text-text-muted/60 mt-2 italic">{item.notes}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                          {item.owner.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-[10px] text-text-muted">{item.owner}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Innovation Ideas */}
      {activeSection === "ideas" && (
        <motion.div key="ideas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{innovationIdeas.length} innovation ideas submitted</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
              <Plus className="h-4 w-4" /> Submit Idea
            </button>
          </div>
          <div className="space-y-3">
            {innovationIdeas.sort((a, b) => b.votes - a.votes).map((idea, i) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 hover:border-border-light transition-colors"
              >
                <div className="flex gap-4">
                  {/* Vote count */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button className="p-1 rounded hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold text-primary">{idea.votes}</span>
                    <span className="text-[9px] text-text-muted uppercase">votes</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-text-primary">{idea.title}</h3>
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0", ideaStatusConfig[idea.status]?.bg, ideaStatusConfig[idea.status]?.text)}>
                        {idea.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3">{idea.description}</p>
                    <div className="flex items-center gap-6 text-xs text-text-muted">
                      <div><span className="text-text-muted/60">Target:</span> <span className="text-text-secondary">{idea.targetMarket}</span></div>
                      <div><span className="text-text-muted/60">Est. Cost:</span> <span className="text-amber-400">{formatCurrency(idea.estimatedCost)}</span></div>
                      <div><span className="text-text-muted/60">Potential Rev:</span> <span className="text-emerald-400">{formatCurrency(idea.potentialRevenue)}</span></div>
                      <div><span className="text-text-muted/60">ROI:</span> <span className="text-primary font-medium">{((idea.potentialRevenue / idea.estimatedCost - 1) * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recipe Lab */}
      {activeSection === "recipes" && (
        <motion.div key="recipes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{recipes.length} recipes in development</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
              <Plus className="h-4 w-4" /> New Recipe
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {recipes.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 hover:border-border-light transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Beaker className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{recipe.name}</h3>
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5", recipeStatusConfig[recipe.status]?.bg, recipeStatusConfig[recipe.status]?.text)}>
                        {recipe.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted">Cost/Serving</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(recipe.costPerServing)}</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="mb-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Ingredients</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.map(ing => (
                      <span key={ing} className="inline-flex items-center rounded-md bg-surface-hover px-2 py-0.5 text-[10px] text-text-secondary border border-border">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Method */}
                <div className="mb-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Method</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{recipe.method}</p>
                </div>

                {/* Linked Products */}
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Linked SKUs</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.linkedProducts.map(sku => (
                      <span key={sku} className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
                        {sku}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Main Page ---
export default function InventoryPage() {
  const { data: apiProducts = [], mutate: mutateProducts, isLoading } = useSWR<Product[]>('/api/products', fetcher);
  const { data: mockCustomers = [] } = useSWR<any[]>('/api/customers', fetcher);
  const { data: mockOrders = [] } = useSWR<any[]>('/api/orders', fetcher);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-56 bg-zinc-800 rounded animate-pulse" />
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

  const [activeTab, setActiveTab] = useState<"catalog" | "stock" | "prices" | "stocktake" | "brands" | "npd">("catalog");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });

  const productReportConfig: BulkReportConfig = useMemo(() => ({
    title: "Product Report",
    entityName: "products",
    buildReport: ({ currentDateRange, compareDateRange, hasCompare }) => {
      const curOrders = currentDateRange.startDate ? mockOrders.filter((o: any) => isInRange(o.createdAt, currentDateRange)) : mockOrders;
      const prevOrders = hasCompare ? mockOrders.filter((o: any) => isInRange(o.createdAt, compareDateRange)) : [];

      const productStats: Record<string, { name: string; sku: string; category: string; unitPrice: number; qty: number; revenue: number }> = {};
      const prevStats: Record<string, { qty: number; revenue: number }> = {};

      products.forEach(p => { productStats[p.id] = { name: p.name, sku: p.sku, category: p.category, unitPrice: p.unitPrice, qty: 0, revenue: 0 }; });
      curOrders.forEach((o: any) => o.items?.forEach((item: any) => {
        if (productStats[item.productId]) { productStats[item.productId].qty += item.quantity; productStats[item.productId].revenue += item.total; }
      }));
      if (hasCompare) {
        products.forEach(p => { prevStats[p.id] = { qty: 0, revenue: 0 }; });
        prevOrders.forEach((o: any) => o.items?.forEach((item: any) => {
          if (prevStats[item.productId]) { prevStats[item.productId].qty += item.quantity; prevStats[item.productId].revenue += item.total; }
        }));
      }

      const pctChange = (c: number, p: number) => { if (!p) return c > 0 ? "+100%" : "—"; const ch = ((c - p) / p) * 100; return `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`; };

      const rows = Object.entries(productStats).map(([id, s]) => {
        const prev = prevStats[id];
        return {
          product: s.name, sku: s.sku, category: s.category,
          unitPrice: `$${s.unitPrice.toFixed(2)}`,
          stockLevel: products.find(p => p.id === id)?.stockLevel || 0,
          qtySold: s.qty, revenue: `$${s.revenue.toFixed(2)}`,
          ...(hasCompare ? {
            prevQty: prev?.qty || 0, prevRevenue: `$${(prev?.revenue || 0).toFixed(2)}`,
            qtyChange: pctChange(s.qty, prev?.qty || 0), revenueChange: pctChange(s.revenue, prev?.revenue || 0),
          } : {}),
        };
      }).sort((a, b) => parseFloat(b.revenue.replace("$", "")) - parseFloat(a.revenue.replace("$", "")));

      const totalRev = Object.values(productStats).reduce((s, p) => s + p.revenue, 0);
      const totalQty = Object.values(productStats).reduce((s, p) => s + p.qty, 0);
      const prevTotalRev = hasCompare ? Object.values(prevStats).reduce((s, p) => s + p.revenue, 0) : 0;
      const prevTotalQty = hasCompare ? Object.values(prevStats).reduce((s, p) => s + p.qty, 0) : 0;

      const columns = [
        { key: "product", label: "Product" }, { key: "sku", label: "SKU" }, { key: "category", label: "Category" },
        { key: "unitPrice", label: "Unit Price" }, { key: "stockLevel", label: "Stock" },
        { key: "qtySold", label: "Qty Sold" }, { key: "revenue", label: "Revenue" },
        ...(hasCompare ? [
          { key: "prevQty", label: "Prev Qty" }, { key: "prevRevenue", label: "Prev Revenue" },
          { key: "qtyChange", label: "Qty Change" }, { key: "revenueChange", label: "Rev Change" },
        ] : []),
      ];

      return {
        rows, columns,
        summary: [
          { label: "Total Products", current: String(products.length) },
          { label: "Total Revenue", current: `$${totalRev.toFixed(0)}`, ...(hasCompare ? { previous: `$${prevTotalRev.toFixed(0)}`, change: pctChange(totalRev, prevTotalRev) } : {}) },
          { label: "Units Sold", current: String(totalQty), ...(hasCompare ? { previous: String(prevTotalQty), change: pctChange(totalQty, prevTotalQty) } : {}) },
        ],
      };
    },
  }), [products, mockOrders]);

  if (apiProducts.length > 0 && !initialized) {
    setProducts(apiProducts);
    setInitialized(true);
  }
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleUpdatePrice = useCallback((productId: string, tier: string, newPrice: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return { ...p, [tier]: newPrice };
    }));
    // Also update the selected product in real-time
    setSelectedProduct(prev => {
      if (!prev || prev.id !== productId) return prev;
      return { ...prev, [tier]: newPrice };
    });
  }, []);

  const handleSelectProduct = useCallback((p: Product) => {
    // Get the latest version from state
    const latest = products.find(prod => prod.id === p.id) || p;
    setSelectedProduct(latest);
  }, [products]);

  const totalProducts = products.length;
  const totalStockValue = products.reduce((s, p) => s + p.stockLevel * p.wholesalePrice, 0);
  const lowStockCount = products.filter(p => p.status === "Low Stock").length;
  const outOfStockCount = products.filter(p => p.status === "Out of Stock").length;

  const tabs = [
    { key: "catalog" as const, label: "Product Catalog" },
    { key: "stock" as const, label: "Stock Levels" },
    { key: "prices" as const, label: "Price Books" },
    { key: "stocktake" as const, label: "Stocktake" },
    { key: "brands" as const, label: "Brands" },
    { key: "npd" as const, label: "NPD & Innovation" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Inventory Management</h1>
          <p className="text-sm text-text-muted mt-1">Track stock levels, manage products, and monitor pricing across warehouses.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter onChange={setDateRange} defaultPreset="All Time" />
          <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
            <FileText className="h-4 w-4" /> Report
          </button>
          <button onClick={() => exportToCSV(products.map(p => ({ sku: p.sku, name: p.name, category: p.category, unitPrice: p.unitPrice, wholesalePrice: p.wholesalePrice, stockLevel: p.stockLevel, warehouse: p.warehouse, status: p.status })), 'inventory', [{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'unitPrice', label: 'Unit Price' }, { key: 'wholesalePrice', label: 'Wholesale Price' }, { key: 'stockLevel', label: 'Stock Level' }, { key: 'warehouse', label: 'Warehouse' }, { key: 'status', label: 'Status' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors"
          >
            <FileUp className="h-4 w-4" /> Import Products
          </button>
          <button
            onClick={() => setShowCreateProductModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-all shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Products" value={formatNumber(totalProducts)} icon={Package} color="text-primary" bg="bg-primary-light" index={0} />
        <StatCard label="Total Stock Value" value={formatCurrency(totalStockValue)} icon={DollarSign} color="text-success" bg="bg-success-light" index={1} />
        <StatCard label="Low Stock Items" value={formatNumber(lowStockCount)} icon={TrendingDown} color="text-warning" bg="bg-warning-light" index={2} />
        <StatCard label="Out of Stock" value={formatNumber(outOfStockCount)} icon={XCircle} color="text-danger" bg="bg-danger-light" index={3} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="inventory-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "catalog" && (
        <motion.div key="catalog" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ProductCatalogTab products={products} onSelectProduct={handleSelectProduct} brandFilter={brandFilter} onClearBrandFilter={() => setBrandFilter(null)} />
        </motion.div>
      )}
      {activeTab === "stock" && (
        <motion.div key="stock" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <StockLevelsTab products={products} onSelectProduct={handleSelectProduct} />
        </motion.div>
      )}
      {activeTab === "prices" && (
        <motion.div key="prices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <PriceBooksTab products={products} onSelectProduct={handleSelectProduct} onUpdatePrice={handleUpdatePrice} />
        </motion.div>
      )}
      {activeTab === "stocktake" && (
        <motion.div key="stocktake" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <StocktakeTab products={products} />
        </motion.div>
      )}
      {activeTab === "brands" && (
        <motion.div key="brands" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <BrandsTab products={products} onSelectBrand={(brand) => { setBrandFilter(brand); setActiveTab("catalog"); }} />
        </motion.div>
      )}
      {activeTab === "npd" && (
        <motion.div key="npd" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <NPDTab />
        </motion.div>
      )}

      {/* Product Detail Slide-out */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailPanel
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onUpdatePrice={handleUpdatePrice}
          />
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportModal
            onClose={() => setShowImportModal(false)}
            existingProducts={products}
            onImportComplete={async () => {
              const fresh = await mutateProducts();
              if (fresh) {
                setProducts(fresh);
              }
            }}
          />
        )}
        {showCreateProductModal && (
          <CreateProductModal
            onClose={() => setShowCreateProductModal(false)}
            onCreated={async () => {
              const fresh = await mutateProducts();
              if (fresh) {
                setProducts(fresh);
              }
              setShowCreateProductModal(false);
            }}
          />
        )}
        {showReportModal && (
          <BulkReportModal config={productReportConfig} onClose={() => setShowReportModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
