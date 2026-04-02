"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingCart, Target, TrendingUp, Package,
  CreditCard, ArrowUpRight, ArrowDownRight, Wallet, RotateCcw,
  Bot, AlertTriangle, CheckCircle2, Clock, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";
import { cn, formatCurrency, formatNumber, formatPercent, timeAgo } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import DateRangeFilter, { DateRange, isInRange, isMonthInRange } from "@/components/DateRangeFilter";

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const duration = 1200;
    const start = ref.current;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{prefix}{formatNumber(display)}{suffix}</span>;
}


const leadSources = [
  { name: "AI Scraper", value: 35, color: "#3b82f6" },
  { name: "Cold Email", value: 25, color: "#6366f1" },
  { name: "Meta Ads", value: 20, color: "#10b981" },
  { name: "Referral", value: 12, color: "#f59e0b" },
  { name: "Website", value: 5, color: "#06b6d4" },
  { name: "Trade Show", value: 3, color: "#ef4444" },
];

const pipelineStages = [
  { stage: "New Lead", count: 2, value: 103000 },
  { stage: "Contacted", count: 3, value: 219000 },
  { stage: "Qualified", count: 2, value: 355000 },
  { stage: "Proposal", count: 3, value: 1075000 },
  { stage: "Negotiation", count: 2, value: 645000 },
];

const topProducts = [
  { name: "Portland Cement 50lb", revenue: 245000 },
  { name: "Organic Olive Oil 5L", revenue: 198000 },
  { name: "Premium Steak Cuts", revenue: 178000 },
  { name: "All-Purpose Flour 50lb", revenue: 156000 },
  { name: "Plywood 4x8 3/4in", revenue: 142000 },
  { name: "Frozen Shrimp 10lb", revenue: 128000 },
  { name: "Steel Pipe 4in", revenue: 115000 },
  { name: "Corrugated Box 12x12", revenue: 98000 },
  { name: "Butter Unsalted 36ct", revenue: 89000 },
  { name: "Brown Rice 25kg", revenue: 82000 },
];

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

const activityFeed = [
  { user: "Sarah Mitchell", action: "closed deal with Harbor Industries", value: "$42,000", time: "2026-03-27T16:00:00Z" },
  { user: "Mike Thompson", action: "sent proposal to Apex Industrial", value: "$520,000", time: "2026-03-27T14:30:00Z" },
  { user: "Alex Rivera", action: "added 45 new leads from AI Scraper", value: "", time: "2026-03-27T11:00:00Z" },
  { user: "David Lee", action: "updated pricing for Golden State Distributors", value: "", time: "2026-03-27T10:15:00Z" },
  { user: "Jennifer Clark", action: "scheduled demo with Tri-State Paper", value: "", time: "2026-03-27T09:30:00Z" },
  { user: "Rachel Green", action: "processed 12 orders for fulfillment", value: "", time: "2026-03-27T08:45:00Z" },
  { user: "Carlos Mendez", action: "renewed contract with Pinnacle Hospitality", value: "$34,500", time: "2026-03-26T17:00:00Z" },
  { user: "Brian Foster", action: "qualified lead: Southwest Chemical Corp", value: "$145,000", time: "2026-03-26T15:30:00Z" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-xl">
      <p className="text-xs font-medium text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: mockFinancials = [], isLoading } = useSWR<any[]>('/api/finance/monthly', fetcher);
  const { data: mockOrders = [] } = useSWR<any[]>('/api/orders', fetcher);
  const { data: mockLeads = [] } = useSWR<any[]>('/api/leads', fetcher);
  const { data: mockDeals = [] } = useSWR<any[]>('/api/pipeline', fetcher);
  const { data: mockInsights = [] } = useSWR<any[]>('/api/ai/insights', fetcher);
  const { data: mockTeam = [] } = useSWR<any[]>('/api/team', fetcher);

  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "Last 30 Days" });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-72 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-80 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const filteredOrders = dateRange.startDate
    ? mockOrders.filter((o: any) => isInRange(o.createdAt, dateRange))
    : mockOrders;

  const filteredFinancials = dateRange.startDate
    ? mockFinancials.filter((f: any) => isMonthInRange(f.month, dateRange))
    : mockFinancials;

  const kpis = [
    { label: "Total Revenue (MTD)", value: 1485000, prefix: "$", icon: DollarSign, color: "text-success", bg: "bg-success-light", change: 12.3, up: true },
    { label: "Outstanding Orders", value: 47, icon: ShoppingCart, color: "text-primary", bg: "bg-primary-light", change: 5.2, up: true },
    { label: "Active Leads", value: mockLeads.filter((l: any) => l.status !== "Cold").length, icon: Target, color: "text-accent", bg: "bg-[#6366f120]", change: 22.0, up: true },
    { label: "Conversion Rate", value: 24.8, suffix: "%", icon: TrendingUp, color: "text-success", bg: "bg-success-light", change: 3.1, up: true },
    { label: "Avg Order Value", value: 8420, prefix: "$", icon: Package, color: "text-warning", bg: "bg-warning-light", change: -2.4, up: false },
    { label: "Accounts Receivable", value: 342600, prefix: "$", icon: CreditCard, color: "text-danger", bg: "bg-danger-light", change: 8.7, up: true },
    { label: "Cash Flow", value: 500000, prefix: "$", icon: Wallet, color: "text-success", bg: "bg-success-light", change: 15.2, up: true },
    { label: "Inventory Turnover", value: 8.4, suffix: "x", icon: RotateCcw, color: "text-info", bg: "bg-[#06b6d420]", change: 1.2, up: true },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Welcome back, James. Here&apos;s your business overview.</p>
        </div>
        <DateRangeFilter onChange={setDateRange} />
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
              className="glass-card p-5 hover:border-border-light transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{kpi.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-text-primary">
                {kpi.suffix === "%" || kpi.suffix === "x" ? (
                  <span>{kpi.value}{kpi.suffix}</span>
                ) : (
                  <AnimatedCounter value={kpi.value} prefix={kpi.prefix || ""} suffix={kpi.suffix || ""} />
                )}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {kpi.up ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-danger" />
                )}
                <span className={cn("text-xs font-medium", kpi.up ? "text-success" : "text-danger")}>
                  {kpi.change > 0 ? "+" : ""}{kpi.change}%
                </span>
                <span className="text-xs text-text-muted">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredFinancials}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pipeline Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Sales Pipeline</h3>
          <div className="space-y-3 mt-2">
            {pipelineStages.map((s, i) => {
              const maxVal = Math.max(...pipelineStages.map(p => p.value));
              const width = (s.value / maxVal) * 100;
              const colors = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#10b981"];
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-24 shrink-0">{s.stage}</span>
                  <div className="flex-1 h-8 bg-surface-hover rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      className="h-full rounded-lg flex items-center px-3"
                      style={{ background: `${colors[i]}30`, borderLeft: `3px solid ${colors[i]}` }}
                    >
                      <span className="text-xs font-medium text-text-primary">{formatCurrency(s.value)}</span>
                    </motion.div>
                  </div>
                  <span className="text-xs font-medium text-text-muted w-8 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-muted">Total Pipeline Value</span>
            <span className="text-lg font-bold font-heading text-text-primary">
              {formatCurrency(pipelineStages.reduce((s, p) => s + p.value, 0))}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Top 10 Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={115} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Lead Sources */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Lead Source Breakdown</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={260}>
              <PieChart>
                <Pie data={leadSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {leadSources.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {leadSources.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-sm text-text-secondary flex-1">{s.name}</span>
                  <span className="text-sm font-medium text-text-primary">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-semibold text-text-primary">Recent Orders</h3>
            <button className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Order</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Customer</th>
                  <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 12).map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-text-primary">{order.orderNumber}</td>
                    <td className="py-2.5 px-3 text-text-secondary">{order.customerName}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusColors[order.status])}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-primary font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-2.5 px-3 text-right text-text-muted">{timeAgo(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right column: Activity + AI */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
            <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Team Activity</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activityFeed.map((a, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {a.user.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-text-secondary">
                      <span className="font-medium text-text-primary">{a.user}</span>{" "}{a.action}
                      {a.value && <span className="font-medium text-success"> {a.value}</span>}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{timeAgo(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-accent" />
              <h3 className="font-heading text-sm font-semibold text-text-primary">AI Insights</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mockInsights.slice(0, 5).map((insight) => {
                const impactIcon = insight.impact === "high"
                  ? <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                  : insight.impact === "medium"
                  ? <Clock className="h-3.5 w-3.5 text-warning" />
                  : <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
                return (
                  <div key={insight.id} className="p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{impactIcon}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary">{insight.title}</p>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
