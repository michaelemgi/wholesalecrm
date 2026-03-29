"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, CreditCard, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Download, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";

const categoryColors: Record<string, string> = {
  COGS: "#3b82f6", Shipping: "#6366f1", Marketing: "#10b981", Payroll: "#f59e0b", Overhead: "#ef4444", Utilities: "#06b6d4", Software: "#8b5cf6",
};

export default function PayablesPage() {
  const { data: mockExpenses = [] } = useSWR<any[]>('/api/finance/expenses', fetcher);
  const { data: mockFinancials = [] } = useSWR<any[]>('/api/finance/monthly', fetcher);

  const [tab, setTab] = useState<"expenses" | "pnl">("expenses");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "Last 30 Days" });
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ field, label, align = "left" }: { field: string; label: string; align?: "left" | "right" }) => (
    <th
      className={cn("py-2 px-3 text-xs font-medium text-text-muted uppercase cursor-pointer select-none hover:text-text-secondary transition-colors", align === "right" ? "text-right" : "text-left")}
      onClick={() => toggleSort(field)}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end")}>
        {label}
        {sortField === field ? (
          sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );

  const filteredExpenses = dateRange.startDate
    ? mockExpenses.filter((e: any) => isInRange(e.date, dateRange))
    : mockExpenses;

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = typeof aVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredExpenses, sortField, sortDir]);

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = filteredExpenses.filter(e => e.status === "Pending").reduce((s, e) => s + e.amount, 0);

  const categoryBreakdown = Object.entries(
    filteredExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: value as number, color: categoryColors[name] || "#64748b" }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Accounts Payable</h1>
          <p className="text-sm text-text-muted mt-1">Track bills, expenses, and profitability</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCSV(mockExpenses.map(e => ({ description: e.description, category: e.category, vendor: e.vendor, status: e.status, amount: e.amount, date: e.date })), 'payables', [{ key: 'description', label: 'Description' }, { key: 'category', label: 'Category' }, { key: 'vendor', label: 'Vendor' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }, { key: 'date', label: 'Date' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <DateRangeFilter onChange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Expenses (MTD)", value: totalExpenses, icon: Wallet, color: "text-danger", bg: "bg-danger-light" },
          { label: "Pending Payments", value: pendingTotal, icon: CreditCard, color: "text-warning", bg: "bg-warning-light" },
          { label: "Net Profit (MTD)", value: mockFinancials[5]?.profit ?? 0, icon: TrendingDown, color: "text-success", bg: "bg-success-light" },
          { label: "Gross Margin", value: "33.7%", icon: Calendar, color: "text-primary", bg: "bg-primary-light", isString: true },
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
              <div className="text-2xl font-bold font-heading text-text-primary">
                {kpi.isString ? kpi.value : formatCurrency(kpi.value as number)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-2">
        {(["expenses", "pnl"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", tab === t ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
            {t === "expenses" ? "Expenses & Bills" : "P&L Statement"}
          </button>
        ))}
      </div>

      {tab === "expenses" && (
        <div className="grid grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-semibold text-text-primary">Recent Expenses</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Sort by</label>
                <select
                  value={`${sortField}-${sortDir}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split("-");
                    setSortField(f);
                    setSortDir(d as "asc" | "desc");
                  }}
                  className="text-xs rounded-md border border-border bg-surface px-2 py-1 text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="amount-desc">Amount (High-Low)</option>
                  <option value="amount-asc">Amount (Low-High)</option>
                  <option value="description-asc">Description (A-Z)</option>
                  <option value="description-desc">Description (Z-A)</option>
                  <option value="category-asc">Category (A-Z)</option>
                  <option value="vendor-asc">Vendor (A-Z)</option>
                  <option value="status-asc">Status (A-Z)</option>
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <SortHeader field="description" label="Description" />
                  <SortHeader field="category" label="Category" />
                  <SortHeader field="vendor" label="Vendor" />
                  <SortHeader field="status" label="Status" />
                  <SortHeader field="amount" label="Amount" align="right" />
                  <SortHeader field="date" label="Date" align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.map(exp => (
                  <tr key={exp.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="py-2.5 px-3 text-text-primary">{exp.description}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                        <div className="h-2 w-2 rounded-full" style={{ background: categoryColors[exp.category] }} />
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">{exp.vendor}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        exp.status === "Paid" ? "bg-emerald-500/20 text-emerald-400" : exp.status === "Pending" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                      )}>{exp.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-text-primary">{formatCurrency(exp.amount)}</td>
                    <td className="py-2.5 px-3 text-right text-text-muted">{formatDate(exp.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {categoryBreakdown.sort((a, b) => b.value - a.value).map(c => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    <span className="text-text-secondary">{c.name}</span>
                  </div>
                  <span className="font-medium text-text-primary">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {tab === "pnl" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold text-text-primary mb-6">Profit & Loss Statement — Q1 2026</h3>
          <div className="space-y-4 max-w-2xl">
            {[
              { label: "Revenue", value: mockFinancials.slice(3).reduce((s, f) => s + f.revenue, 0), bold: true, positive: true },
              { label: "Cost of Goods Sold", value: -586000, indent: true },
              { label: "Gross Profit", value: mockFinancials.slice(3).reduce((s, f) => s + f.revenue, 0) - 586000, bold: true, positive: true, border: true },
              { label: "Shipping & Logistics", value: -56500, indent: true },
              { label: "Marketing & Advertising", value: -15827, indent: true },
              { label: "Payroll & Benefits", value: -426000, indent: true },
              { label: "Rent & Overhead", value: -121500, indent: true },
              { label: "Utilities", value: -25200, indent: true },
              { label: "Software & Services", value: -11997, indent: true },
              { label: "Total Operating Expenses", value: -657024, bold: true, border: true },
              { label: "Net Profit", value: mockFinancials.slice(3).reduce((s, f) => s + f.profit, 0), bold: true, positive: true, border: true, highlight: true },
            ].map((row, i) => (
              <div key={i} className={cn("flex items-center justify-between py-2", row.border && "border-t border-border pt-3", row.indent && "pl-6")}>
                <span className={cn("text-sm", row.bold ? "font-semibold text-text-primary" : "text-text-secondary")}>{row.label}</span>
                <span className={cn("text-sm font-mono", row.bold ? "font-bold" : "", row.highlight ? "text-success text-lg" : row.positive ? "text-text-primary" : "text-text-secondary")}>
                  {row.value >= 0 ? formatCurrency(row.value) : `(${formatCurrency(Math.abs(row.value))})`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
