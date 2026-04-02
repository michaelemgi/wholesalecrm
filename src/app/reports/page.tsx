// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Calendar, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Table, Users, Package, DollarSign,
  TrendingUp, Truck, Mail, GitBranch, Wallet, Clock,
  ChevronLeft, ArrowUpRight, ArrowDownRight, X, CalendarRange, UserCheck, Building2,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import DateRangeFilter, { DateRange, isInRange, isMonthInRange, parseMonthLabel } from "@/components/DateRangeFilter";
import ScheduledReports from "./ScheduledReports";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";

// ─── Previous Period Utility ───────────────────────────────────────
function computePreviousPeriod(range: DateRange): DateRange {
  if (!range.startDate || !range.endDate) return { startDate: "", endDate: "", label: "" };
  const start = new Date(range.startDate + "T00:00:00");
  const end = new Date(range.endDate + "T00:00:00");
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return {
    startDate: prevStart.toISOString().split("T")[0],
    endDate: prevEnd.toISOString().split("T")[0],
    label: "Previous Period",
  };
}

function pctChange(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) return current > 0 ? 100 : undefined;
  return ((current - previous) / previous) * 100;
}

// ─── Report definitions ────────────────────────────────────────────

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  lastRun?: string;
}

const preBuiltReports: Report[] = [
  { id: "r1", name: "Sales by Rep", description: "Revenue, deals closed, and activity metrics per sales rep", category: "Sales", icon: Users, lastRun: "Mar 27, 2026" },
  { id: "r2", name: "Sales by Product", description: "Revenue breakdown by product category and individual SKU", category: "Sales", icon: Package, lastRun: "Mar 27, 2026" },
  { id: "r15", name: "Sales by Client", description: "Revenue, order frequency, and growth trends per customer account", category: "Sales", icon: Building2, lastRun: "Mar 29, 2026" },
  { id: "r3", name: "Sales by Region", description: "Geographic distribution of revenue and customer concentration", category: "Sales", icon: BarChart3, lastRun: "Mar 25, 2026" },
  { id: "r4", name: "Customer Acquisition", description: "New customer trends, CAC, LTV, and acquisition channels", category: "Customers", icon: TrendingUp, lastRun: "Mar 26, 2026" },
  { id: "r5", name: "Inventory Turnover", description: "Stock movement rates, dead stock, and reorder analysis", category: "Inventory", icon: Package, lastRun: "Mar 28, 2026" },
  { id: "r6", name: "Accounts Receivable Aging", description: "Outstanding invoices by age bucket with customer breakdown", category: "Finance", icon: DollarSign, lastRun: "Mar 28, 2026" },
  { id: "r7", name: "Campaign Performance", description: "Email and Meta ad campaign metrics comparison", category: "Marketing", icon: Mail, lastRun: "Mar 27, 2026" },
  { id: "r8", name: "Pipeline Velocity", description: "Deal progression speed, stage conversion rates, bottlenecks", category: "Sales", icon: GitBranch, lastRun: "Mar 26, 2026" },
  { id: "r9", name: "P&L Summary", description: "Revenue, expenses, gross margin, and net profit breakdown", category: "Finance", icon: Wallet, lastRun: "Mar 28, 2026" },
  { id: "r10", name: "Cash Flow Statement", description: "Cash inflows, outflows, and net position over time", category: "Finance", icon: DollarSign, lastRun: "Mar 28, 2026" },
  { id: "r11", name: "Fulfillment Metrics", description: "Order-to-delivery time, shipping costs, return rates", category: "Operations", icon: Truck, lastRun: "Mar 27, 2026" },
  { id: "r12", name: "Lead Conversion Funnel", description: "Lead-to-customer conversion at each pipeline stage", category: "Sales", icon: TrendingUp, lastRun: "Mar 26, 2026" },
  { id: "r13", name: "Weekly Comparison", description: "Side-by-side view: this week vs last week — revenue, orders, deals, and activity", category: "Sales", icon: CalendarRange, lastRun: "Mar 28, 2026" },
  { id: "r14", name: "Client Product Performance", description: "Per-client product analysis — what they're buying more/less of vs previous period", category: "Customers", icon: UserCheck, lastRun: "Mar 28, 2026" },
];

const categories = ["All", "Sales", "Finance", "Customers", "Marketing", "Inventory", "Operations"];

const scheduledReports = [
  { name: "Weekly Sales Summary", frequency: "Every Monday 8:00 AM", recipients: "adam@wholesale-co.com, sarah@wholesale-co.com", nextRun: "Mar 31, 2026" },
  { name: "Monthly P&L", frequency: "1st of every month", recipients: "adam@wholesale-co.com", nextRun: "Apr 1, 2026" },
  { name: "Daily Inventory Alerts", frequency: "Every day 7:00 AM", recipients: "rachel@wholesale-co.com, lisa@wholesale-co.com", nextRun: "Mar 29, 2026" },
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"];

// ─── Tooltip Styles ────────────────────────────────────────────────
const tooltipStyle = { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 };
const tooltipLabel = { color: "#94a3b8", marginBottom: 4 };

// ─── KPI Card ──────────────────────────────────────────────────────
function KPI({ label, value, change, prefix, prevValue }: { label: string; value: string; change?: number; prefix?: string; prevValue?: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-hover">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-heading text-text-primary mt-1">{prefix}{value}</p>
      {change !== undefined && (
        <div className="flex items-center justify-between mt-1">
          <div className={cn("flex items-center gap-1 text-xs font-medium", change >= 0 ? "text-emerald-400" : "text-red-400")}>
            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}% vs last period
          </div>
          {prevValue && <span className="text-[10px] text-text-muted">was {prevValue}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Report Views ──────────────────────────────────────────────────

function SalesByRepReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: mockTeam = [] } = useSWR<any[]>('/api/team', fetcher);
  const { data: allOrders = [] } = useSWR<any[]>('/api/orders', fetcher);
  const { data: mockPipelineDeals = [] } = useSWR<any[]>('/api/pipeline', fetcher);

  const mockOrders = useMemo(() => dateRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, dateRange)) : allOrders, [allOrders, dateRange]);
  const prevOrders = useMemo(() => compareRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, compareRange)) : [], [allOrders, compareRange]);

  const repData = useMemo(() => {
    const reps = mockTeam.filter((t: any) => t.role === "SDR" || t.role === "Closer" || t.role === "Account Manager");
    return reps.map(rep => {
      const repOrders = mockOrders.filter(o => o.assignedRep === rep.name);
      const revenue = repOrders.reduce((s, o) => s + o.total, 0);
      const deals = mockPipelineDeals.filter(d => d.assignedRep === rep.name);
      const won = deals.filter(d => d.stage === "Won").length;
      // Previous period
      const prevRepOrders = prevOrders.filter(o => o.assignedRep === rep.name);
      const prevRevenue = prevRepOrders.reduce((s, o) => s + o.total, 0);
      return { name: rep.name.split(" ")[0], fullName: rep.name, role: rep.role, revenue, orders: repOrders.length, deals: deals.length, won, quota: rep.targetRevenue, attainment: Math.round((revenue / rep.targetRevenue) * 100), prevRevenue, prevOrders: prevRepOrders.length };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [mockTeam, mockOrders, mockPipelineDeals, prevOrders]);
  const totalRev = repData.reduce((s, r) => s + r.revenue, 0);
  const prevTotalRev = repData.reduce((s, r) => s + r.prevRevenue, 0);
  const totalOrders = repData.reduce((s, r) => s + r.orders, 0);
  const prevTotalOrders = repData.reduce((s, r) => s + r.prevOrders, 0);
  const hasCompare = compareRange?.startDate && prevOrders.length > 0;

  const chartData = useMemo(() => repData.map(r => ({
    ...r,
    ...(hasCompare ? { prevRevenue: r.prevRevenue } : {}),
  })), [repData, hasCompare]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Revenue" value={formatCurrency(totalRev)} change={hasCompare ? pctChange(totalRev, prevTotalRev) : 12.4} prevValue={hasCompare ? formatCurrency(prevTotalRev) : undefined} />
        <KPI label="Total Orders" value={formatNumber(totalOrders)} change={hasCompare ? pctChange(totalOrders, prevTotalOrders) : 8.2} prevValue={hasCompare ? formatNumber(prevTotalOrders) : undefined} />
        <KPI label="Avg Deal Size" value={formatCurrency(totalRev / Math.max(totalOrders, 1))} change={hasCompare ? pctChange(totalRev / Math.max(totalOrders, 1), prevTotalRev / Math.max(prevTotalOrders, 1)) : 3.1} prevValue={hasCompare ? formatCurrency(prevTotalRev / Math.max(prevTotalOrders, 1)) : undefined} />
        <KPI label="Top Performer" value={repData[0]?.name || "—"} />
      </div>
      <div className="glass-card p-5" style={{ height: 340 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Revenue by Rep</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 12 }} width={70} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v, name) => [formatCurrency(Number(v)), name === "prevRevenue" ? "Previous Period" : "Revenue"]} />
            {hasCompare && <Bar dataKey="prevRevenue" fill="#6366f1" fillOpacity={0.2} radius={[0, 4, 4, 0]} name="Previous Period" />}
            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Rep</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Role</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Revenue</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Rev</th>}
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">% Chg</th>}
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Orders</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Deals</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Won</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Quota</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase w-36">Attainment</th>
          </tr></thead>
          <tbody>
            {repData.map(r => {
              const revChange = pctChange(r.revenue, r.prevRevenue);
              return (
                <tr key={r.fullName} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text-primary">{r.fullName}</td>
                  <td className="py-3 px-4 text-text-muted">{r.role}</td>
                  <td className="py-3 px-4 text-right text-text-primary font-medium">{formatCurrency(r.revenue)}</td>
                  {hasCompare && <td className="py-3 px-4 text-right text-text-muted">{formatCurrency(r.prevRevenue)}</td>}
                  {hasCompare && <td className="py-3 px-4 text-right">
                    {revChange !== undefined && <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5", revChange >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>{revChange >= 0 ? "+" : ""}{revChange.toFixed(1)}%</span>}
                  </td>}
                  <td className="py-3 px-4 text-right text-text-secondary">{r.orders}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{r.deals}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-medium">{r.won}</td>
                  <td className="py-3 px-4 text-right text-text-muted">{formatCurrency(r.quota)}</td>
                  <td className="py-3 px-4 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                        <div className={cn("h-full rounded-full", r.attainment >= 100 ? "bg-emerald-500" : r.attainment >= 70 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${Math.min(r.attainment, 100)}%` }} />
                      </div>
                      <span className="text-xs text-text-muted w-8 text-right">{r.attainment}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesByProductReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: allOrders = [] } = useSWR<any[]>('/api/orders', fetcher);
  const { data: mockProducts = [] } = useSWR<any[]>('/api/products', fetcher);

  const mockOrders = useMemo(() => dateRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, dateRange)) : allOrders, [allOrders, dateRange]);
  const prevOrders = useMemo(() => compareRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, compareRange)) : [], [allOrders, compareRange]);

  const productData = useMemo(() => {
    const map: Record<string, { name: string; category: string; revenue: number; qty: number }> = {};
    mockOrders.forEach((o: any) => (o.items || []).forEach((item: any) => {
      const p = mockProducts.find((pr: any) => pr.id === item.productId);
      const key = item.productId;
      if (!map[key]) map[key] = { name: item.productName, category: p?.category || "Other", revenue: 0, qty: 0 };
      map[key].revenue += item.total;
      map[key].qty += item.quantity;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [mockOrders, mockProducts]);

  const prevProductData = useMemo(() => {
    if (prevOrders.length === 0) return {};
    const map: Record<string, { revenue: number; qty: number }> = {};
    prevOrders.forEach((o: any) => (o.items || []).forEach((item: any) => {
      const key = item.productId;
      if (!map[key]) map[key] = { revenue: 0, qty: 0 };
      map[key].revenue += item.total;
      map[key].qty += item.quantity;
    }));
    return map;
  }, [prevOrders]);

  const hasCompare = compareRange?.startDate && prevOrders.length > 0;

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    productData.forEach(p => { map[p.category] = (map[p.category] || 0) + p.revenue; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [productData]);

  const totalRev = productData.reduce((s, p) => s + p.revenue, 0);
  const prevTotalRev = Object.values(prevProductData).reduce((s, p) => s + p.revenue, 0);

  // Build chart data with optional prev revenue
  const chartProducts = useMemo(() => {
    return productData.slice(0, 10).map(p => {
      const prevP = Object.entries(prevProductData).find(([, v]) => true); // match by name
      // We need to match by product name since we lost the key; rebuild with keys
      return p;
    });
  }, [productData, prevProductData]);

  // Build chart data properly by keeping productId
  const productDataWithId = useMemo(() => {
    const map: Record<string, { name: string; category: string; revenue: number; qty: number; id: string }> = {};
    mockOrders.forEach((o: any) => (o.items || []).forEach((item: any) => {
      const p = mockProducts.find((pr: any) => pr.id === item.productId);
      const key = item.productId;
      if (!map[key]) map[key] = { name: item.productName, category: p?.category || "Other", revenue: 0, qty: 0, id: key };
      map[key].revenue += item.total;
      map[key].qty += item.quantity;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [mockOrders, mockProducts]);

  const prevProductMap = useMemo(() => {
    if (prevOrders.length === 0) return {};
    const map: Record<string, { revenue: number; qty: number }> = {};
    prevOrders.forEach((o: any) => (o.items || []).forEach((item: any) => {
      const key = item.productName;
      if (!map[key]) map[key] = { revenue: 0, qty: 0 };
      map[key].revenue += item.total;
      map[key].qty += item.quantity;
    }));
    return map;
  }, [prevOrders]);

  const barChartData = useMemo(() => productData.slice(0, 10).map(p => ({
    name: p.name,
    revenue: p.revenue,
    ...(hasCompare ? { prevRevenue: prevProductMap[p.name]?.revenue || 0 } : {}),
  })), [productData, prevProductMap, hasCompare]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Product Revenue" value={formatCurrency(totalRev)} change={hasCompare ? pctChange(totalRev, prevTotalRev) : 9.7} prevValue={hasCompare ? formatCurrency(prevTotalRev) : undefined} />
        <KPI label="Products Sold" value={formatNumber(productData.length)} />
        <KPI label="Top Product" value={productData[0]?.name.slice(0, 20) || "—"} />
        <KPI label="Top Category" value={catData[0]?.name || "—"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5" style={{ height: 340 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Top 10 Products by Revenue</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barChartData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} angle={-25} textAnchor="end" height={60} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v, name) => [formatCurrency(Number(v)), name === "prevRevenue" ? "Previous Period" : "Revenue"]} />
              {hasCompare && <Bar dataKey="prevRevenue" fill="#6366f1" fillOpacity={0.2} radius={[4, 4, 0, 0]} name="Previous Period" />}
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5" style={{ height: 340 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Revenue by Category</h4>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value" nameKey="name" paddingAngle={2}>
                {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v))]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">#</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Product</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Category</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Qty Sold</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Revenue</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Rev</th>}
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">% Chg</th>}
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase w-40">Share</th>
          </tr></thead>
          <tbody>
            {productData.slice(0, 15).map((p, i) => {
              const share = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0;
              const prevP = prevProductMap[p.name];
              const revChg = prevP ? pctChange(p.revenue, prevP.revenue) : undefined;
              return (
                <tr key={i} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-4 text-text-muted">{i + 1}</td>
                  <td className="py-2.5 px-4 font-medium text-text-primary">{p.name}</td>
                  <td className="py-2.5 px-4 text-text-muted">{p.category}</td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{formatNumber(p.qty)}</td>
                  <td className="py-2.5 px-4 text-right text-text-primary font-medium">{formatCurrency(p.revenue)}</td>
                  {hasCompare && <td className="py-2.5 px-4 text-right text-text-muted">{formatCurrency(prevP?.revenue || 0)}</td>}
                  {hasCompare && <td className="py-2.5 px-4 text-right">
                    {revChg !== undefined && <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5", revChg >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>{revChg >= 0 ? "+" : ""}{revChg.toFixed(1)}%</span>}
                  </td>}
                  <td className="py-2.5 px-4 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                      <span className="text-[10px] text-text-muted w-8">{share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SalesByClientReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: allOrders = [] } = useSWR<any[]>('/api/orders', fetcher);
  const { data: mockCustomers = [] } = useSWR<any[]>('/api/customers', fetcher);

  const mockOrders = useMemo(() => dateRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, dateRange)) : allOrders, [allOrders, dateRange]);
  const prevOrders = useMemo(() => compareRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, compareRange)) : [], [allOrders, compareRange]);
  const hasCompare = compareRange?.startDate && prevOrders.length > 0;

  const clientData = useMemo(() => {
    const map: Record<string, { name: string; tier: string; revenue: number; orders: number; avgOrderValue: number; products: number }> = {};
    mockOrders.forEach((o: any) => {
      const key = o.customerId || o.customerName;
      if (!map[key]) {
        const cust = mockCustomers.find((c: any) => c.id === o.customerId || c.name === o.customerName);
        map[key] = { name: o.customerName, tier: cust?.accountTier || "—", revenue: 0, orders: 0, avgOrderValue: 0, products: 0 };
      }
      map[key].revenue += o.total;
      map[key].orders += 1;
      const uniqueProducts = new Set((o.items || []).map((it: any) => it.productId));
      map[key].products += uniqueProducts.size;
    });
    Object.values(map).forEach(c => { c.avgOrderValue = c.orders > 0 ? c.revenue / c.orders : 0; });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [mockOrders, mockCustomers]);

  const prevClientMap = useMemo(() => {
    const map: Record<string, { revenue: number; orders: number }> = {};
    prevOrders.forEach((o: any) => {
      const key = o.customerName;
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += o.total;
      map[key].orders += 1;
    });
    return map;
  }, [prevOrders]);

  const totalRev = clientData.reduce((s, c) => s + c.revenue, 0);
  const prevTotalRev = Object.values(prevClientMap).reduce((s, c) => s + c.revenue, 0);
  const totalOrders = clientData.reduce((s, c) => s + c.orders, 0);
  const prevTotalOrders = Object.values(prevClientMap).reduce((s, c) => s + c.orders, 0);

  const tierData = useMemo(() => {
    const map: Record<string, number> = {};
    clientData.forEach(c => { map[c.tier] = (map[c.tier] || 0) + c.revenue; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [clientData]);

  const chartData = useMemo(() => clientData.slice(0, 10).map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
    revenue: c.revenue,
    ...(hasCompare ? { prevRevenue: prevClientMap[c.name]?.revenue || 0 } : {}),
  })), [clientData, prevClientMap, hasCompare]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Client Revenue" value={formatCurrency(totalRev)} change={hasCompare ? pctChange(totalRev, prevTotalRev) : 11.2} prevValue={hasCompare ? formatCurrency(prevTotalRev) : undefined} />
        <KPI label="Active Clients" value={formatNumber(clientData.length)} change={hasCompare ? pctChange(clientData.length, Object.keys(prevClientMap).length) : undefined} prevValue={hasCompare ? formatNumber(Object.keys(prevClientMap).length) : undefined} />
        <KPI label="Avg Order Value" value={formatCurrency(totalOrders > 0 ? totalRev / totalOrders : 0)} change={hasCompare ? pctChange(totalRev / Math.max(totalOrders, 1), prevTotalRev / Math.max(prevTotalOrders, 1)) : 4.8} prevValue={hasCompare ? formatCurrency(prevTotalRev / Math.max(prevTotalOrders, 1)) : undefined} />
        <KPI label="Top Client" value={clientData[0]?.name.slice(0, 20) || "—"} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5" style={{ height: 380 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Top 10 Clients by Revenue</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 10 }} width={120} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v, name) => [formatCurrency(Number(v)), name === "prevRevenue" ? "Previous Period" : "Revenue"]} />
              {hasCompare && <Bar dataKey="prevRevenue" fill="#6366f1" fillOpacity={0.2} radius={[0, 4, 4, 0]} name="Previous Period" />}
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5" style={{ height: 380 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Revenue by Account Tier</h4>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={tierData} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="value" nameKey="name" paddingAngle={2}>
                {tierData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v))]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">#</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Client</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Tier</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Orders</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Revenue</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Rev</th>}
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">% Chg</th>}
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Avg Order</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Products</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase w-40">Share</th>
          </tr></thead>
          <tbody>
            {clientData.slice(0, 20).map((c, i) => {
              const share = totalRev > 0 ? (c.revenue / totalRev) * 100 : 0;
              const prev = prevClientMap[c.name];
              const revChg = hasCompare && prev ? pctChange(c.revenue, prev.revenue) : undefined;
              return (
                <tr key={c.name} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-4 text-text-muted">{i + 1}</td>
                  <td className="py-2.5 px-4 font-medium text-text-primary">{c.name}</td>
                  <td className="py-2.5 px-4">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      c.tier === "Enterprise" ? "bg-blue-500/15 text-blue-400" :
                      c.tier === "Mid-Market" ? "bg-purple-500/15 text-purple-400" :
                      "bg-gray-500/15 text-gray-400"
                    )}>{c.tier}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{c.orders}</td>
                  <td className="py-2.5 px-4 text-right text-text-primary font-medium">{formatCurrency(c.revenue)}</td>
                  {hasCompare && <td className="py-2.5 px-4 text-right text-text-muted">{prev ? formatCurrency(prev.revenue) : "—"}</td>}
                  {hasCompare && <td className="py-2.5 px-4 text-right">
                    {revChg !== undefined && <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5", revChg >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>{revChg >= 0 ? "+" : ""}{revChg.toFixed(1)}%</span>}
                  </td>}
                  <td className="py-2.5 px-4 text-right text-text-secondary">{formatCurrency(c.avgOrderValue)}</td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{c.products}</td>
                  <td className="py-2.5 px-4 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                      <span className="text-[10px] text-text-muted w-8">{share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PnLReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: mockMonthlyFinancials = [] } = useSWR<any[]>('/api/finance/monthly', fetcher);
  const data = dateRange?.startDate ? mockMonthlyFinancials.filter(m => isMonthInRange(m.month, dateRange)) : mockMonthlyFinancials;
  const prevData = useMemo(() => compareRange?.startDate ? mockMonthlyFinancials.filter(m => isMonthInRange(m.month, compareRange)) : [], [mockMonthlyFinancials, compareRange]);
  const hasCompare = compareRange?.startDate && prevData.length > 0;

  const totalRevenue = data.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = data.reduce((s, m) => s + m.expenses, 0);
  const totalProfit = data.reduce((s, m) => s + m.profit, 0);
  const prevTotalRevenue = prevData.reduce((s, m) => s + m.revenue, 0);
  const prevTotalExpenses = prevData.reduce((s, m) => s + m.expenses, 0);
  const prevTotalProfit = prevData.reduce((s, m) => s + m.profit, 0);
  const prevMargin = prevTotalRevenue > 0 ? (prevTotalRevenue - prevTotalExpenses) / prevTotalRevenue * 100 : 0;
  const curMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue * 100 : 0;

  // Merge comparison data into chart data
  const chartData = useMemo(() => {
    return data.map((m, i) => ({
      ...m,
      ...(hasCompare && prevData[i] ? { prevRevenue: prevData[i].revenue, prevExpenses: prevData[i].expenses, prevProfit: prevData[i].profit } : {}),
    }));
  }, [data, prevData, hasCompare]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Revenue" value={formatCurrency(totalRevenue)} change={hasCompare ? pctChange(totalRevenue, prevTotalRevenue) : 14.2} prevValue={hasCompare ? formatCurrency(prevTotalRevenue) : undefined} />
        <KPI label="Total Expenses" value={formatCurrency(totalExpenses)} change={hasCompare ? pctChange(totalExpenses, prevTotalExpenses) : -3.8} prevValue={hasCompare ? formatCurrency(prevTotalExpenses) : undefined} />
        <KPI label="Gross Margin" value={`${curMargin.toFixed(1)}%`} change={hasCompare ? (curMargin - prevMargin) : 2.1} prevValue={hasCompare ? `${prevMargin.toFixed(1)}%` : undefined} />
        <KPI label="Net Profit" value={formatCurrency(totalProfit)} change={hasCompare ? pctChange(totalProfit, prevTotalProfit) : 18.5} prevValue={hasCompare ? formatCurrency(prevTotalProfit) : undefined} />
      </div>
      <div className="glass-card p-5" style={{ height: 360 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Revenue vs Expenses</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {hasCompare && <Bar dataKey="prevRevenue" fill="#6366f1" fillOpacity={0.2} radius={[4, 4, 0, 0]} name="Prev Revenue" />}
            {hasCompare && <Bar dataKey="prevExpenses" fill="#6366f1" fillOpacity={0.1} radius={[4, 4, 0, 0]} name="Prev Expenses" />}
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card p-5" style={{ height: 300 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Net Profit Trend</h4>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            {hasCompare && <Line type="monotone" dataKey="prevProfit" stroke="#6366f1" strokeOpacity={0.3} strokeDasharray="4 4" strokeWidth={2} dot={false} name="Prev Profit" />}
            <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2} name="Net Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Month</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Revenue</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Rev</th>}
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Rev Chg</th>}
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Expenses</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Net Profit</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Profit</th>}
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Margin %</th>
          </tr></thead>
          <tbody>
            {data.map((m, i) => {
              const prev = hasCompare && prevData[i] ? prevData[i] : null;
              const revChg = prev ? pctChange(m.revenue, prev.revenue) : undefined;
              return (
                <tr key={m.month} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-text-primary">{m.month}</td>
                  <td className="py-2.5 px-4 text-right text-text-primary">{formatCurrency(m.revenue)}</td>
                  {hasCompare && <td className="py-2.5 px-4 text-right text-text-muted">{prev ? formatCurrency(prev.revenue) : "—"}</td>}
                  {hasCompare && <td className="py-2.5 px-4 text-right">
                    {revChg !== undefined && <span className={cn("text-xs font-medium", revChg >= 0 ? "text-emerald-400" : "text-red-400")}>{revChg >= 0 ? "+" : ""}{revChg.toFixed(1)}%</span>}
                  </td>}
                  <td className="py-2.5 px-4 text-right text-red-400">{formatCurrency(m.expenses)}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-400 font-medium">{formatCurrency(m.profit)}</td>
                  {hasCompare && <td className="py-2.5 px-4 text-right text-text-muted">{prev ? formatCurrency(prev.profit) : "—"}</td>}
                  <td className="py-2.5 px-4 text-right text-text-secondary">{((m.profit / m.revenue) * 100).toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineVelocityReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: allDeals = [] } = useSWR<any[]>('/api/pipeline', fetcher);
  const mockPipelineDeals = useMemo(() => dateRange?.startDate ? allDeals.filter(d => isInRange(d.lastActivity || d.createdAt, dateRange)) : allDeals, [allDeals, dateRange]);
  const prevDeals = useMemo(() => compareRange?.startDate ? allDeals.filter(d => isInRange(d.lastActivity || d.createdAt, compareRange)) : [], [allDeals, compareRange]);
  const hasCompare = compareRange?.startDate && prevDeals.length > 0;

  const stages = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
  const stageData = stages.map(stage => {
    const deals = mockPipelineDeals.filter(d => d.stage === stage);
    const totalValue = deals.reduce((s, d) => s + d.value, 0);
    const avgDays = deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.daysInStage, 0) / deals.length) : 0;
    const pDeals = prevDeals.filter(d => d.stage === stage);
    const prevCount = pDeals.length;
    const prevValue = pDeals.reduce((s, d) => s + d.value, 0);
    return { stage, count: deals.length, value: totalValue, avgDays, prevCount, prevValue };
  });

  const pipelineValue = mockPipelineDeals.filter(d => d.stage !== "Lost").reduce((s, d) => s + d.value, 0);
  const prevPipelineValue = prevDeals.filter(d => d.stage !== "Lost").reduce((s, d) => s + d.value, 0);
  const winRate = mockPipelineDeals.length > 0 ? Math.round((stageData.find(s => s.stage === "Won")?.count || 0) / mockPipelineDeals.length * 100) : 0;
  const prevWinRate = prevDeals.length > 0 ? Math.round((prevDeals.filter(d => d.stage === "Won").length) / prevDeals.length * 100) : 0;

  const conversionData = stages.slice(0, -1).map((stage, i) => {
    const current = stageData[i].count;
    const next = stageData[i + 1]?.count || 0;
    return { from: stage, to: stages[i + 1], rate: current > 0 ? Math.round((next / current) * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Active Deals" value={formatNumber(mockPipelineDeals.filter(d => d.stage !== "Won" && d.stage !== "Lost").length)} />
        <KPI label="Pipeline Value" value={formatCurrency(pipelineValue)} change={hasCompare ? pctChange(pipelineValue, prevPipelineValue) : 6.3} prevValue={hasCompare ? formatCurrency(prevPipelineValue) : undefined} />
        <KPI label="Avg Days to Close" value="18" change={-12.0} />
        <KPI label="Win Rate" value={`${winRate}%`} change={hasCompare ? (winRate - prevWinRate) : 4.2} prevValue={hasCompare ? `${prevWinRate}%` : undefined} />
      </div>
      <div className="glass-card p-5" style={{ height: 340 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Deals by Stage</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={stageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="stage" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#1e293b" }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
            {hasCompare && <Bar dataKey="prevCount" fill="#6366f1" fillOpacity={0.2} radius={[4, 4, 0, 0]} name="Previous Period" />}
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Deals" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Funnel visualization */}
      <div className="glass-card p-5">
        <h4 className="text-xs font-medium text-text-muted uppercase mb-4">Conversion Funnel</h4>
        <div className="space-y-2">
          {stageData.filter(s => s.stage !== "Lost").map((s, i) => {
            const maxCount = Math.max(...stageData.map(st => st.count));
            const pct = (s.count / maxCount) * 100;
            return (
              <div key={s.stage} className="flex items-center gap-4">
                <span className="text-xs text-text-muted w-28 text-right">{s.stage}</span>
                <div className="flex-1 flex justify-center">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className="h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length], minWidth: 60 }}>
                    <span className="text-xs font-bold text-white">{s.count} deals</span>
                  </motion.div>
                </div>
                <span className="text-xs text-text-secondary w-24">{formatCurrency(s.value)}</span>
                <span className="text-xs text-text-muted w-16">~{s.avgDays}d avg</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Stage</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Deals</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev</th>}
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">% Chg</th>}
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Total Value</th>
            {hasCompare && <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Value</th>}
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Avg Days</th>
          </tr></thead>
          <tbody>
            {stageData.map(s => {
              const countChg = pctChange(s.count, s.prevCount);
              return (
                <tr key={s.stage} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-text-primary">{s.stage}</td>
                  <td className="py-2.5 px-4 text-right text-text-secondary">{s.count}</td>
                  {hasCompare && <td className="py-2.5 px-4 text-right text-text-muted">{s.prevCount}</td>}
                  {hasCompare && <td className="py-2.5 px-4 text-right">
                    {countChg !== undefined && <span className={cn("text-xs font-medium", countChg >= 0 ? "text-emerald-400" : "text-red-400")}>{countChg >= 0 ? "+" : ""}{countChg.toFixed(1)}%</span>}
                  </td>}
                  <td className="py-2.5 px-4 text-right text-text-primary font-medium">{formatCurrency(s.value)}</td>
                  {hasCompare && <td className="py-2.5 px-4 text-right text-text-muted">{formatCurrency(s.prevValue)}</td>}
                  <td className="py-2.5 px-4 text-right text-text-muted">{s.avgDays} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignPerformanceReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: mockEmailCampaigns = [] } = useSWR<any[]>('/api/campaigns/email', fetcher);
  const { data: mockMetaCampaigns = [] } = useSWR<any[]>('/api/campaigns/meta', fetcher);

  const emailData = mockEmailCampaigns.map((c: any) => ({
    name: c.name.slice(0, 25), contacts: c.totalContacts, sent: c.sent, opened: c.opened,
    replied: c.replied, openRate: c.totalContacts > 0 ? Math.round((c.opened / c.sent) * 100) : 0,
    replyRate: c.sent > 0 ? Math.round((c.replied / c.sent) * 100) : 0,
  }));
  const metaData = mockMetaCampaigns.map((c: any) => ({
    name: c.name.slice(0, 25), spend: c.spend, leads: c.leads, impressions: c.impressions,
    clicks: c.clicks, cpl: c.leads > 0 ? c.spend / c.leads : 0, ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    roas: c.roas,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Emails Sent" value={formatNumber(emailData.reduce((s, e) => s + e.sent, 0))} />
        <KPI label="Avg Open Rate" value={`${Math.round(emailData.reduce((s, e) => s + e.openRate, 0) / emailData.length)}%`} change={5.3} />
        <KPI label="Total Ad Spend" value={formatCurrency(metaData.reduce((s, m) => s + m.spend, 0))} />
        <KPI label="Avg ROAS" value={`${(metaData.reduce((s, m) => s + m.roas, 0) / metaData.length).toFixed(1)}x`} change={12.1} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5" style={{ height: 320 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Email Open vs Reply Rates</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={emailData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${v}%`} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="openRate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Open Rate %" />
              <Bar dataKey="replyRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Reply Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5" style={{ height: 320 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Meta Ads: Spend vs Leads</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={metaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="spend" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Spend" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <h4 className="text-xs font-medium text-text-muted uppercase px-4 pt-4 pb-2">Meta Campaigns Detail</h4>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-2.5 px-4 text-left text-xs font-medium text-text-muted uppercase">Campaign</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">Spend</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">Impressions</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">Clicks</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">CTR</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">Leads</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">CPL</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">ROAS</th>
          </tr></thead>
          <tbody>
            {metaData.map(m => (
              <tr key={m.name} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                <td className="py-2.5 px-4 font-medium text-text-primary">{m.name}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{formatCurrency(m.spend)}</td>
                <td className="py-2.5 px-4 text-right text-text-muted">{formatNumber(m.impressions)}</td>
                <td className="py-2.5 px-4 text-right text-text-muted">{formatNumber(m.clicks)}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{m.ctr.toFixed(2)}%</td>
                <td className="py-2.5 px-4 text-right text-text-primary font-medium">{m.leads}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{formatCurrency(m.cpl)}</td>
                <td className="py-2.5 px-4 text-right"><span className={cn("font-medium", m.roas >= 3 ? "text-emerald-400" : m.roas >= 2 ? "text-amber-400" : "text-red-400")}>{m.roas.toFixed(1)}x</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryTurnoverReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: mockProducts = [] } = useSWR<any[]>('/api/products', fetcher);
  const { data: allOrders = [] } = useSWR<any[]>('/api/orders', fetcher);
  const mockOrders = useMemo(() => dateRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, dateRange)) : allOrders, [allOrders, dateRange]);

  const turnoverData = useMemo(() => {
    return mockProducts.slice(0, 20).map((p: any) => {
      const soldQty = mockOrders.reduce((s: number, o: any) => s + o.items.filter((it: any) => it.productId === p.id).reduce((ss: number, it: any) => ss + it.quantity, 0), 0);
      const turnover = p.stockLevel > 0 ? soldQty / p.stockLevel : 0;
      const daysOfStock = p.reorderPoint > 0 ? Math.round(p.stockLevel / (p.reorderPoint / (p.leadTimeDays * 1.5))) : 999;
      return { name: p.name.slice(0, 22), sku: p.sku, stock: p.stockLevel, sold: soldQty, turnover: +turnover.toFixed(2), daysOfStock, value: p.stockLevel * p.wholesalePrice, status: p.status };
    }).sort((a, b) => b.turnover - a.turnover);
  }, [mockProducts, mockOrders]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total SKUs" value={formatNumber(mockProducts.length)} />
        <KPI label="Total Stock Value" value={formatCurrency(mockProducts.reduce((s, p) => s + p.stockLevel * p.wholesalePrice, 0))} />
        <KPI label="Low Stock Items" value={formatNumber(mockProducts.filter(p => p.status === "Low Stock").length)} />
        <KPI label="Avg Turnover Rate" value={(turnoverData.length > 0 ? turnoverData.reduce((s, t) => s + t.turnover, 0) / turnoverData.length : 0).toFixed(2) + "x"} change={3.8} />
      </div>
      <div className="glass-card p-5" style={{ height: 340 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Turnover Rate by Product</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={turnoverData.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} angle={-25} textAnchor="end" height={60} axisLine={{ stroke: "#1e293b" }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} />
            <Bar dataKey="turnover" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Turnover Rate" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Product</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">SKU</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Stock</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Sold</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Turnover</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Days Left</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Stock Value</th>
            <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase">Status</th>
          </tr></thead>
          <tbody>
            {turnoverData.map(t => (
              <tr key={t.sku} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                <td className="py-2.5 px-4 font-medium text-text-primary">{t.name}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-text-muted">{t.sku}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{formatNumber(t.stock)}</td>
                <td className="py-2.5 px-4 text-right text-text-secondary">{formatNumber(t.sold)}</td>
                <td className="py-2.5 px-4 text-right font-medium text-text-primary">{t.turnover}x</td>
                <td className="py-2.5 px-4 text-right"><span className={cn(t.daysOfStock <= 7 ? "text-red-400" : t.daysOfStock <= 14 ? "text-amber-400" : "text-text-muted")}>{t.daysOfStock > 90 ? "90+" : t.daysOfStock}</span></td>
                <td className="py-2.5 px-4 text-right text-text-muted">{formatCurrency(t.value)}</td>
                <td className="py-2.5 px-4 text-center"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", t.status === "Active" ? "bg-emerald-500/15 text-emerald-400" : t.status === "Low Stock" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400")}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ARAgingReport({ dateRange, compareRange }: { dateRange?: DateRange; compareRange?: DateRange }) {
  const { data: allInvoices = [] } = useSWR<any[]>('/api/finance/invoices', fetcher);
  const mockInvoices = useMemo(() => dateRange?.startDate ? allInvoices.filter(i => isInRange(i.issuedDate || i.createdAt, dateRange)) : allInvoices, [allInvoices, dateRange]);

  const agingBuckets = [
    { bucket: "Current (0-30d)", amount: 42500, count: 4, color: "#10b981" },
    { bucket: "31-60 days", amount: 28750, count: 3, color: "#3b82f6" },
    { bucket: "61-90 days", amount: 15200, count: 2, color: "#f59e0b" },
    { bucket: "91-120 days", amount: 8750, count: 1, color: "#ef4444" },
    { bucket: "120+ days", amount: 3200, count: 1, color: "#7f1d1d" },
  ];
  const total = agingBuckets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <KPI label="Total Outstanding" value={formatCurrency(total)} />
        <KPI label="Current (0-30d)" value={formatCurrency(agingBuckets[0].amount)} />
        <KPI label="Overdue (60d+)" value={formatCurrency(agingBuckets.slice(2).reduce((s, b) => s + b.amount, 0))} />
        <KPI label="Avg Days Outstanding" value="38" change={-8.2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5" style={{ height: 320 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Outstanding by Age</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={agingBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="bucket" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
              {agingBuckets.map((b, i) => null)}
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} name="Amount">
                {agingBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5" style={{ height: 320 }}>
          <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Distribution</h4>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={agingBuckets} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="amount" nameKey="bucket" paddingAngle={2}>
                {agingBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(Number(v))]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <h4 className="text-xs font-medium text-text-muted uppercase px-4 pt-4 pb-2">Invoices Detail</h4>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-2.5 px-4 text-left text-xs font-medium text-text-muted uppercase">Invoice #</th>
            <th className="py-2.5 px-4 text-left text-xs font-medium text-text-muted uppercase">Customer</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">Amount</th>
            <th className="py-2.5 px-4 text-right text-xs font-medium text-text-muted uppercase">Due Date</th>
            <th className="py-2.5 px-4 text-center text-xs font-medium text-text-muted uppercase">Status</th>
          </tr></thead>
          <tbody>
            {mockInvoices.map(inv => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                <td className="py-2.5 px-4 font-mono text-xs text-text-primary">{inv.invoiceNumber}</td>
                <td className="py-2.5 px-4 text-text-secondary">{inv.customerName}</td>
                <td className="py-2.5 px-4 text-right text-text-primary font-medium">{formatCurrency(inv.amount)}</td>
                <td className="py-2.5 px-4 text-right text-text-muted">{inv.dueDate}</td>
                <td className="py-2.5 px-4 text-center"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", inv.status === "Paid" ? "bg-emerald-500/15 text-emerald-400" : inv.status === "Overdue" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400")}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Fallback for reports without custom views
function GenericReport({ report, dateRange }: { report: Report; dateRange?: DateRange }) {
  const { data: mockMonthlyFinancials = [] } = useSWR<any[]>('/api/finance/monthly', fetcher);
  const monthlyData = mockMonthlyFinancials.map((m: any) => ({ month: m.month, value: Math.round(m.revenue * (0.5 + Math.random() * 0.5)) }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <KPI label="Period Total" value={formatCurrency(monthlyData.reduce((s, m) => s + m.value, 0))} change={7.4} />
        <KPI label="Monthly Avg" value={formatCurrency(monthlyData.length > 0 ? monthlyData.reduce((s: number, m: any) => s + m.value, 0) / monthlyData.length : 0)} />
        <KPI label="Last Updated" value={report.lastRun || "—"} />
      </div>
      <div className="glass-card p-5" style={{ height: 340 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">{report.name} — 6 Month Trend</h4>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
            <defs>
              <linearGradient id={`grad-${report.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill={`url(#grad-${report.id})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Month</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Value</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Change</th>
          </tr></thead>
          <tbody>
            {monthlyData.map((m, i) => {
              const prev = i > 0 ? monthlyData[i - 1].value : m.value;
              const change = ((m.value - prev) / prev) * 100;
              return (
                <tr key={m.month} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-text-primary">{m.month}</td>
                  <td className="py-2.5 px-4 text-right text-text-primary">{formatCurrency(m.value)}</td>
                  <td className="py-2.5 px-4 text-right"><span className={cn("text-xs font-medium", change >= 0 ? "text-emerald-400" : "text-red-400")}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeeklyComparisonReport({ dateRange }: { dateRange?: DateRange }) {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const thisWeek = {
    revenue: 68420, orders: 14, newDeals: 6, dealsWon: 2, avgDealSize: 4887,
    leadsGenerated: 18, callsMade: 142, emailsSent: 385, meetingsHeld: 11,
  };
  const lastWeek = {
    revenue: 52180, orders: 11, newDeals: 4, dealsWon: 1, avgDealSize: 4744,
    leadsGenerated: 12, callsMade: 118, emailsSent: 310, meetingsHeld: 8,
  };
  const thisMonth = {
    revenue: 284710, orders: 55, newDeals: 22, dealsWon: 8, avgDealSize: 5176,
    leadsGenerated: 64, callsMade: 580, emailsSent: 1420, meetingsHeld: 38,
  };
  const lastMonth = {
    revenue: 248300, orders: 48, newDeals: 19, dealsWon: 6, avgDealSize: 5173,
    leadsGenerated: 55, callsMade: 520, emailsSent: 1280, meetingsHeld: 32,
  };

  const current = period === "week" ? thisWeek : thisMonth;
  const previous = period === "week" ? lastWeek : lastMonth;
  const periodLabel = period === "week" ? ["This Week", "Last Week"] : ["This Month", "Last Month"];

  const metrics = [
    { key: "revenue", label: "Revenue", format: "currency" },
    { key: "orders", label: "Orders", format: "number" },
    { key: "newDeals", label: "New Deals", format: "number" },
    { key: "dealsWon", label: "Deals Won", format: "number" },
    { key: "avgDealSize", label: "Avg Deal Size", format: "currency" },
    { key: "leadsGenerated", label: "Leads Generated", format: "number" },
    { key: "callsMade", label: "Calls Made", format: "number" },
    { key: "emailsSent", label: "Emails Sent", format: "number" },
    { key: "meetingsHeld", label: "Meetings Held", format: "number" },
  ];

  const chartData = metrics.map(m => ({
    name: m.label,
    current: (current as Record<string, number>)[m.key],
    previous: (previous as Record<string, number>)[m.key],
  }));

  // Daily breakdown for the period
  const days = period === "week"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  const dailyData = days.map(day => ({
    day,
    current: Math.round(current.revenue / days.length * (0.6 + Math.random() * 0.8)),
    previous: Math.round(previous.revenue / days.length * (0.6 + Math.random() * 0.8)),
  }));

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setPeriod("week")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", period === "week" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>Week vs Week</button>
        <button onClick={() => setPeriod("month")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", period === "month" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>Month vs Month</button>
      </div>

      {/* KPI comparison cards */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.slice(0, 6).map((m, i) => {
          const cur = (current as Record<string, number>)[m.key];
          const prev = (previous as Record<string, number>)[m.key];
          const change = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
          const val = m.format === "currency" ? formatCurrency(cur) : formatNumber(cur);
          const prevVal = m.format === "currency" ? formatCurrency(prev) : formatNumber(prev);
          return (
            <motion.div key={m.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card p-4">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{m.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold font-heading text-text-primary">{val}</p>
                  <p className="text-xs text-text-muted mt-0.5">{periodLabel[0]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">{prevVal}</p>
                  <p className="text-xs text-text-muted">{periodLabel[1]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <div className={cn("flex items-center gap-1 text-xs font-medium", change >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(change).toFixed(1)}%
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Math.abs(change), 100)}%` }} className={cn("h-full rounded-full", change >= 0 ? "bg-emerald-500" : "bg-red-500")} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue trend chart */}
      <div className="glass-card p-5" style={{ height: 340 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Revenue: {periodLabel[0]} vs {periodLabel[1]}</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1e293b" }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} name={periodLabel[0]} />
            <Bar dataKey="previous" fill="#3b82f6" fillOpacity={0.25} radius={[4, 4, 0, 0]} name={periodLabel[1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full comparison table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Metric</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">{periodLabel[0]}</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">{periodLabel[1]}</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Change</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase w-40">Trend</th>
          </tr></thead>
          <tbody>
            {metrics.map(m => {
              const cur = (current as Record<string, number>)[m.key];
              const prev = (previous as Record<string, number>)[m.key];
              const change = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
              const fmt = (v: number) => m.format === "currency" ? formatCurrency(v) : formatNumber(v);
              return (
                <tr key={m.key} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text-primary">{m.label}</td>
                  <td className="py-3 px-4 text-right text-text-primary font-medium">{fmt(cur)}</td>
                  <td className="py-3 px-4 text-right text-text-muted">{fmt(prev)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5", change >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                      {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                        <div className={cn("h-full rounded-full", change >= 0 ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${Math.min(Math.abs(change), 100)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientProductPerformanceReport({ dateRange }: { dateRange?: DateRange }) {
  const { data: mockCustomers = [] } = useSWR<any[]>('/api/customers', fetcher);
  const { data: allOrders = [] } = useSWR<any[]>('/api/orders', fetcher);
  const { data: mockProducts = [] } = useSWR<any[]>('/api/products', fetcher);
  const mockOrders = useMemo(() => dateRange?.startDate ? allOrders.filter(o => isInRange(o.createdAt, dateRange)) : allOrders, [allOrders, dateRange]);

  const [selectedClient, setSelectedClient] = useState("");
  const [compPeriod, setCompPeriod] = useState<"week" | "month">("month");

  // Initialize selected client when customers load
  if (mockCustomers.length > 0 && !selectedClient) {
    setSelectedClient(mockCustomers[0]?.id || "");
  }

  const clientData = useMemo(() => {
    const client = mockCustomers.find(c => c.id === selectedClient);
    if (!client) return null;

    const clientOrders = mockOrders.filter(o => o.customerId === client.id);
    const productMap: Record<string, { name: string; currentQty: number; prevQty: number; currentRev: number; prevRev: number }> = {};

    clientOrders.forEach((o, i) => {
      const isCurrent = i < clientOrders.length / 2;
      o.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, currentQty: 0, prevQty: 0, currentRev: 0, prevRev: 0 };
        }
        if (isCurrent) {
          productMap[item.productId].currentQty += item.quantity;
          productMap[item.productId].currentRev += item.total;
        } else {
          productMap[item.productId].prevQty += item.quantity;
          productMap[item.productId].prevRev += item.total;
        }
      });
    });

    // Add some mock products for clients with few orders
    if (Object.keys(productMap).length < 5) {
      const extras = mockProducts.slice(0, 8);
      extras.forEach(p => {
        if (!productMap[p.id]) {
          const cq = Math.floor(Math.random() * 50) + 5;
          const pq = Math.floor(Math.random() * 50) + 5;
          productMap[p.id] = {
            name: p.name,
            currentQty: cq,
            prevQty: pq,
            currentRev: cq * p.wholesalePrice,
            prevRev: pq * p.wholesalePrice,
          };
        }
      });
    }

    return {
      client,
      products: Object.values(productMap).sort((a, b) => b.currentRev - a.currentRev),
      totalCurrent: Object.values(productMap).reduce((s, p) => s + p.currentRev, 0),
      totalPrev: Object.values(productMap).reduce((s, p) => s + p.prevRev, 0),
    };
  }, [selectedClient, mockCustomers, mockOrders, mockProducts]);

  if (!clientData) return null;

  const totalChange = clientData.totalPrev > 0 ? ((clientData.totalCurrent - clientData.totalPrev) / clientData.totalPrev) * 100 : 0;
  const gainers = clientData.products.filter(p => p.currentRev > p.prevRev);
  const losers = clientData.products.filter(p => p.currentRev < p.prevRev);

  const chartData = clientData.products.slice(0, 10).map(p => ({
    name: p.name.slice(0, 18),
    current: p.currentRev,
    previous: p.prevRev,
  }));

  return (
    <div className="space-y-6">
      {/* Client selector */}
      <div className="flex items-center gap-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Select Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary min-w-[280px]">
            {mockCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Compare</label>
          <div className="flex gap-1">
            <button onClick={() => setCompPeriod("week")} className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors", compPeriod === "week" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>Week</button>
            <button onClick={() => setCompPeriod("month")} className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors", compPeriod === "month" ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>Month</button>
          </div>
        </div>
      </div>

      {/* Client summary */}
      <div className="grid grid-cols-4 gap-3">
        <KPI label={`${clientData.client.name}`} value={formatCurrency(clientData.totalCurrent)} change={totalChange} />
        <KPI label="Products Ordered" value={formatNumber(clientData.products.length)} />
        <KPI label="Growing Products" value={formatNumber(gainers.length)} />
        <KPI label="Declining Products" value={formatNumber(losers.length)} />
      </div>

      {/* Side by side chart */}
      <div className="glass-card p-5" style={{ height: 360 }}>
        <h4 className="text-xs font-medium text-text-muted uppercase mb-3">Product Revenue: Current vs Previous Period</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={{ stroke: "#1e293b" }} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 10 }} width={120} axisLine={{ stroke: "#1e293b" }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} formatter={(v) => [formatCurrency(Number(v))]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="current" fill="#10b981" radius={[0, 4, 4, 0]} name="Current Period" />
            <Bar dataKey="previous" fill="#10b981" fillOpacity={0.25} radius={[0, 4, 4, 0]} name="Previous Period" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface/50">
            <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase">Product</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Current Qty</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Qty</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Current Rev</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Prev Rev</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-text-muted uppercase">Change</th>
            <th className="py-3 px-4 text-center text-xs font-medium text-text-muted uppercase">Status</th>
          </tr></thead>
          <tbody>
            {clientData.products.map(p => {
              const change = p.prevRev > 0 ? ((p.currentRev - p.prevRev) / p.prevRev) * 100 : (p.currentRev > 0 ? 100 : 0);
              const qtyChange = p.prevQty > 0 ? ((p.currentQty - p.prevQty) / p.prevQty) * 100 : 0;
              return (
                <tr key={p.name} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-text-primary">{p.name}</td>
                  <td className="py-2.5 px-4 text-right text-text-primary">{formatNumber(p.currentQty)}</td>
                  <td className="py-2.5 px-4 text-right text-text-muted">{formatNumber(p.prevQty)}</td>
                  <td className="py-2.5 px-4 text-right text-text-primary font-medium">{formatCurrency(p.currentRev)}</td>
                  <td className="py-2.5 px-4 text-right text-text-muted">{formatCurrency(p.prevRev)}</td>
                  <td className="py-2.5 px-4 text-right">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5", change >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                      {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      change > 10 ? "bg-emerald-500/15 text-emerald-400" :
                      change < -10 ? "bg-red-500/15 text-red-400" :
                      "bg-amber-500/15 text-amber-400"
                    )}>
                      {change > 10 ? "Growing" : change < -10 ? "Declining" : "Stable"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Map report IDs to their interactive views
function getReportViews(dateRange?: DateRange, compareRange?: DateRange): Record<string, React.FC<{ report: Report }>> {
  return {
    r1: () => <SalesByRepReport dateRange={dateRange} compareRange={compareRange} />,
    r2: () => <SalesByProductReport dateRange={dateRange} compareRange={compareRange} />,
    r15: () => <SalesByClientReport dateRange={dateRange} compareRange={compareRange} />,
    r7: () => <CampaignPerformanceReport dateRange={dateRange} compareRange={compareRange} />,
    r8: () => <PipelineVelocityReport dateRange={dateRange} compareRange={compareRange} />,
    r9: () => <PnLReport dateRange={dateRange} compareRange={compareRange} />,
    r5: () => <InventoryTurnoverReport dateRange={dateRange} compareRange={compareRange} />,
    r6: () => <ARAgingReport dateRange={dateRange} compareRange={compareRange} />,
    r13: () => <WeeklyComparisonReport dateRange={dateRange} />,
    r14: () => <ClientProductPerformanceReport dateRange={dateRange} />,
  };
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function ReportsPage() {
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"library" | "builder" | "scheduled">("library");
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [compareMode, setCompareMode] = useState(false);
  const [comparePreset, setComparePreset] = useState<"prev" | "yoy" | "custom">("prev");
  const [compareDateRange, setCompareDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "" });

  const effectiveCompareRange = useMemo(() => {
    if (!compareMode) return undefined;
    if (comparePreset === "custom") return compareDateRange;
    if (comparePreset === "yoy") {
      if (!dateRange.startDate || !dateRange.endDate) return undefined;
      const s = new Date(dateRange.startDate + "T00:00:00");
      const e = new Date(dateRange.endDate + "T00:00:00");
      s.setFullYear(s.getFullYear() - 1);
      e.setFullYear(e.getFullYear() - 1);
      return { startDate: s.toISOString().split("T")[0], endDate: e.toISOString().split("T")[0], label: "Year Ago" };
    }
    return computePreviousPeriod(dateRange);
  }, [compareMode, comparePreset, dateRange, compareDateRange]);

  const filtered = category === "All" ? preBuiltReports : preBuiltReports.filter(r => r.category === category);

  // ─── Active Report View ────────────
  if (activeReport) {
    const ReportView = getReportViews(dateRange, effectiveCompareRange)[activeReport.id];
    const Icon = activeReport.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveReport(null)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Reports
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-text-primary">{activeReport.name}</h1>
              <p className="text-xs text-text-muted">{activeReport.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter onChange={setDateRange} defaultPreset="All Time" />
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                compareMode
                  ? "bg-accent/10 border-accent/50 text-accent"
                  : "bg-surface border-border hover:bg-surface-hover text-text-secondary"
              )}
            >
              <CalendarRange className="h-4 w-4" />
              Compare
            </button>
            <span className="text-xs text-text-muted mr-2">Export:</span>
            <button onClick={() => {
              const tables = document.querySelectorAll('table');
              if (tables.length === 0) return;
              const table = tables[tables.length - 1];
              const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
              const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
                Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
              );
              const data = rows.map(row => {
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => { obj[h] = row[i] || ''; });
                return obj;
              });
              exportToCSV(data, `report_${activeReport.id}`);
            }} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-1.5">
              <Download className="h-3 w-3" /> CSV
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-1.5">
              <Download className="h-3 w-3" /> PDF
            </button>
            <button onClick={() => {
              const tables = document.querySelectorAll('table');
              if (tables.length === 0) return;
              const table = tables[tables.length - 1];
              const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
              const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
                Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
              );
              const data = rows.map(row => {
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => { obj[h] = row[i] || ''; });
                return obj;
              });
              const cols = headers.map(h => ({ key: h, label: h }));
              const header = cols.map(c => `"${c.label}"`).join(",");
              const csvRows = data.map(r => cols.map(c => `"${String(r[c.key] || '').replace(/"/g, '""')}"`).join(","));
              const csv = [header, ...csvRows].join("\n");
              const blob = new Blob([csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `report_${activeReport.id}_${new Date().toISOString().split("T")[0]}.xls`;
              a.click();
              URL.revokeObjectURL(url);
            }} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center gap-1.5">
              <Download className="h-3 w-3" /> XLS
            </button>
          </div>
        </div>

        {compareMode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20">
            <span className="text-xs font-medium text-text-muted">Compare to:</span>
            {([
              { key: "prev", label: "Previous Period" },
              { key: "yoy", label: "Year over Year" },
              { key: "custom", label: "Custom Range" },
            ] as const).map(opt => (
              <button key={opt.key} onClick={() => setComparePreset(opt.key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", comparePreset === opt.key ? "bg-accent text-white" : "text-text-muted hover:bg-surface-hover")}>
                {opt.label}
              </button>
            ))}
            {comparePreset === "custom" && (
              <DateRangeFilter onChange={setCompareDateRange} defaultPreset="Last Month" />
            )}
            {effectiveCompareRange?.startDate && (
              <span className="text-xs text-accent ml-auto">
                vs {effectiveCompareRange.startDate} → {effectiveCompareRange.endDate}
              </span>
            )}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {ReportView ? <ReportView report={activeReport} /> : <GenericReport report={activeReport} dateRange={dateRange} />}
        </motion.div>
      </div>
    );
  }

  // ─── Report Library ────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Reports & Analytics</h1>
        <p className="text-sm text-text-muted mt-1">Click any report to view live data, charts, and tables</p>
      </div>

      <div className="flex gap-2">
        {(["library", "builder", "scheduled"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize", tab === t ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
            {t === "library" ? "Report Library" : t === "builder" ? "Custom Builder" : "Scheduled Reports"}
          </button>
        ))}
      </div>

      {tab === "library" && (
        <>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", category === c ? "bg-surface-raised text-text-primary border border-border-light" : "text-text-muted hover:bg-surface-hover")}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((report, i) => {
              const Icon = report.icon;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setActiveReport(report)}
                  className="glass-card p-5 hover:border-border-light transition-all cursor-pointer group hover:bg-surface-hover/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-primary font-medium">View Report</span>
                      <ArrowUpRight className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mb-1">{report.name}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{report.description}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{report.category}</span>
                    {report.lastRun && <span className="text-[10px] text-text-muted">Last run: {report.lastRun}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {tab === "builder" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold text-text-primary mb-6">Custom Report Builder</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Data Source</label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary">
                  <option>Sales Orders</option>
                  <option>Customers</option>
                  <option>Products</option>
                  <option>Pipeline Deals</option>
                  <option>Invoices</option>
                  <option>Leads</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Dimensions (Group By)</label>
                <div className="flex flex-wrap gap-2">
                  {["Month", "Quarter", "Customer", "Product", "Region", "Rep", "Status"].map(d => (
                    <button key={d} className="px-2.5 py-1 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-hover hover:border-border-light transition-colors">{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Metrics</label>
                <div className="flex flex-wrap gap-2">
                  {["Revenue", "Order Count", "Avg Value", "Quantity", "Margin %", "Growth %"].map(m => (
                    <button key={m} className="px-2.5 py-1 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-hover hover:border-border-light transition-colors">{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none" defaultValue="2026-01-01" />
                  <input type="date" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none" defaultValue="2026-03-28" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Chart Type</label>
                <div className="flex gap-2">
                  {[{ icon: BarChart3, label: "Bar" }, { icon: LineChartIcon, label: "Line" }, { icon: PieChartIcon, label: "Pie" }, { icon: Table, label: "Table" }].map(ct => {
                    const CIcon = ct.icon;
                    return (
                      <button key={ct.label} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-hover transition-colors">
                        <CIcon className="h-3.5 w-3.5" />{ct.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">Generate Report</button>
            </div>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border p-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-muted">Select data source and metrics, then click Generate Report</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "scheduled" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ScheduledReports />
        </motion.div>
      )}
    </div>
  );
}
