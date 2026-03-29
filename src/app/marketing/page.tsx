"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, DollarSign, Users, TrendingUp, Mail, MessageSquare, Target, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from "recharts";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import DateRangeFilter, { DateRange } from "@/components/DateRangeFilter";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const channelROI = [
  { channel: "Meta Ads", spend: 10530, revenue: 68000, roi: 5.5, color: "#3b82f6" },
  { channel: "Cold Email", spend: 297, revenue: 185000, roi: 622, color: "#10b981" },
  { channel: "Trade Shows", spend: 5000, revenue: 55000, roi: 10, color: "#f59e0b" },
  { channel: "Referral", spend: 0, revenue: 320000, roi: 999, color: "#6366f1" },
  { channel: "Website/SEO", spend: 1200, revenue: 68000, roi: 55.7, color: "#06b6d4" },
];

const monthlyCAC = [
  { month: "Oct", cac: 85, ltv: 12400 },
  { month: "Nov", cac: 72, ltv: 13200 },
  { month: "Dec", cac: 95, ltv: 11800 },
  { month: "Jan", cac: 68, ltv: 14500 },
  { month: "Feb", cac: 62, ltv: 15200 },
  { month: "Mar", cac: 58, ltv: 16800 },
];

const campaignCalendar = [
  { name: "Q1 Food Distributors Outreach", type: "Email", start: "Feb 15", end: "Apr 15", status: "Active" },
  { name: "Building Materials Launch", type: "Email", start: "Mar 1", end: "Apr 30", status: "Active" },
  { name: "Food Wholesale Lead Gen", type: "Meta", start: "Mar 1", end: "Mar 31", status: "Active" },
  { name: "Contractor Leads", type: "Meta", start: "Mar 5", end: "Apr 5", status: "Active" },
  { name: "Re-engagement Campaign", type: "Email", start: "Mar 10", end: "Apr 10", status: "Active" },
  { name: "Q2 SMS Blast", type: "SMS", start: "Apr 1", end: "Apr 7", status: "Scheduled" },
];

export default function MarketingPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const { data: mockEmailCampaigns = [] } = useSWR<any[]>('/api/campaigns/email', fetcher);
  const { data: mockMetaCampaigns = [] } = useSWR<any[]>('/api/campaigns/meta', fetcher);
  const totalSpend = channelROI.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = channelROI.reduce((s, c) => s + c.revenue, 0);
  const avgCAC = monthlyCAC[monthlyCAC.length - 1].cac;
  const avgLTV = monthlyCAC[monthlyCAC.length - 1].ltv;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Marketing & Campaigns</h1>
          <p className="text-sm text-text-muted mt-1">Campaign performance, attribution, and ROI tracking</p>
        </div>
        <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Marketing Spend", value: totalSpend, icon: DollarSign, color: "text-danger", bg: "bg-danger-light" },
          { label: "Revenue Attributed", value: totalRevenue, icon: TrendingUp, color: "text-success", bg: "bg-success-light" },
          { label: "Customer Acq. Cost", value: avgCAC, icon: Target, color: "text-warning", bg: "bg-warning-light", prefix: "$" },
          { label: "LTV:CAC Ratio", value: `${(avgLTV / avgCAC).toFixed(0)}:1`, icon: Users, color: "text-primary", bg: "bg-primary-light", isString: true },
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
                {kpi.isString ? kpi.value : kpi.prefix ? `${kpi.prefix}${kpi.value}` : formatCurrency(kpi.value as number)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Channel Attribution — Revenue by Source</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelROI} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="channel" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} barSize={20}>
                {channelROI.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">CAC vs LTV Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyCAC}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="cac" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <YAxis yAxisId="ltv" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
              <Line yAxisId="cac" type="monotone" dataKey="cac" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="CAC" />
              <Line yAxisId="ltv" type="monotone" dataKey="ltv" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="LTV" />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Campaign Calendar</h3>
        <div className="space-y-2">
          {campaignCalendar.map((c, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                c.type === "Email" ? "bg-primary-light text-primary" : c.type === "Meta" ? "bg-success-light text-success" : "bg-warning-light text-warning"
              )}>
                {c.type === "Email" ? <Mail className="h-4 w-4" /> : c.type === "Meta" ? <Megaphone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{c.name}</p>
                <p className="text-xs text-text-muted">{c.type} Campaign</p>
              </div>
              <div className="text-xs text-text-muted">{c.start} — {c.end}</div>
              <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                c.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
              )}>{c.status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
