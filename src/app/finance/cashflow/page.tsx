"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import DateRangeFilter, { DateRange, isMonthInRange } from "@/components/DateRangeFilter";

export default function CashFlowPage() {
  const { data: mockFinancials = [], isLoading } = useSWR<any[]>('/api/finance/monthly', fetcher);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-72 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-72 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "Last 30 Days" });

  const filteredFinancials = dateRange.startDate
    ? mockFinancials.filter((f: any) => isMonthInRange(f.month, dateRange))
    : mockFinancials;

  const cashFlowData = filteredFinancials.map((f: any) => ({
    month: f.month,
    inflow: f.revenue,
    outflow: f.expenses,
    net: f.revenue - f.expenses,
  }));

  const forecastData = [
    ...cashFlowData,
    { month: "Apr 2026", inflow: 1560000, outflow: 1020000, net: 540000 },
    { month: "May 2026", inflow: 1620000, outflow: 1050000, net: 570000 },
    { month: "Jun 2026", inflow: 1700000, outflow: 1080000, net: 620000 },
  ];

  const currentNet = cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1].net : 0;
  const totalInflow = cashFlowData.reduce((s: number, d: any) => s + d.inflow, 0);
  const totalOutflow = cashFlowData.reduce((s: number, d: any) => s + d.outflow, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Cash Flow</h1>
          <p className="text-sm text-text-muted mt-1">Monitor cash position, projections, and liquidity</p>
        </div>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Net Cash Flow (MTD)", value: currentNet, icon: Wallet, color: "text-success", bg: "bg-success-light" },
          { label: "Total Inflow (6mo)", value: totalInflow, icon: TrendingUp, color: "text-primary", bg: "bg-primary-light" },
          { label: "Total Outflow (6mo)", value: totalOutflow, icon: TrendingDown, color: "text-danger", bg: "bg-danger-light" },
          { label: "Cash Reserves", value: 2840000, icon: DollarSign, color: "text-success", bg: "bg-success-light" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{kpi.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-text-primary">{formatCurrency(kpi.value)}</div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Cash Flow — Inflow vs Outflow</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={cashFlowData}>
            <defs>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
            <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={2} fill="url(#inflowGrad)" name="Money In" />
            <Area type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} fill="url(#outflowGrad)" name="Money Out" />
            <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Cash Flow Forecast (Next 3 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={forecastData.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
              <Bar dataKey="net" name="Net Cash Flow" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Bank Reconciliation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-hover">
              <div>
                <p className="text-sm font-medium text-text-primary">Bank Balance</p>
                <p className="text-xs text-text-muted">Last synced: Today, 8:00 AM</p>
              </div>
              <span className="text-xl font-bold font-heading text-text-primary">$2,840,000</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-hover">
              <div>
                <p className="text-sm font-medium text-text-primary">Book Balance</p>
                <p className="text-xs text-text-muted">As of today</p>
              </div>
              <span className="text-xl font-bold font-heading text-text-primary">$2,836,450</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-warning/30 bg-warning-light">
              <div>
                <p className="text-sm font-medium text-warning">Difference</p>
                <p className="text-xs text-text-muted">3 unmatched transactions</p>
              </div>
              <span className="text-xl font-bold font-heading text-warning">$3,550</span>
            </div>
            <button className="w-full py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
              Reconcile Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
