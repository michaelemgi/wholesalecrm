"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Phone, Mail, Calendar, DollarSign, Target, Award, TrendingUp, Loader2, Download, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from "recharts";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import DateRangeFilter, { DateRange } from "@/components/DateRangeFilter";
import type { TeamMember } from "@/types";

const roleColors: Record<string, string> = {
  SDR: "bg-blue-500/20 text-blue-400",
  Closer: "bg-emerald-500/20 text-emerald-400",
  "Account Manager": "bg-purple-500/20 text-purple-400",
  Operations: "bg-amber-500/20 text-amber-400",
  Admin: "bg-gray-500/20 text-gray-400",
};

export default function TeamPage() {
  const { data: mockTeam = [], isLoading } = useSWR<TeamMember[]>("/api/team", fetcher);
  const [tab, setTab] = useState<"roster" | "leaderboard" | "activity">("roster");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [sortField, setSortField] = useState<keyof TeamMember>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const SortHeader = ({ field, label, align = "left" }: { field: keyof TeamMember; label: string; align?: "left" | "right" }) => (
    <th
      className={cn("py-2.5 px-3 text-xs font-medium text-text-muted uppercase cursor-pointer select-none hover:text-text-secondary transition-colors", align === "right" ? "text-right" : "text-left")}
      onClick={() => { if (sortField === field) { setSortDir(d => d === "asc" ? "desc" : "asc"); } else { setSortField(field); setSortDir(field === "name" || field === "role" ? "asc" : "desc"); } }}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end")}>
        {label}
        {sortField === field ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );

  const sortedTeam = useMemo(() => {
    return [...mockTeam].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof aVal === "string" && typeof bVal === "string") return aVal.localeCompare(bVal) * dir;
      if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
      return 0;
    });
  }, [mockTeam, sortField, sortDir]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const salesTeam = mockTeam.filter(m => m.role !== "Operations" && m.role !== "Admin");
  const leaderboard = [...salesTeam].sort((a, b) => b.revenueGenerated - a.revenueGenerated);

  const activityData = mockTeam.filter(m => m.role !== "Admin").map(m => ({
    name: m.name.split(" ")[0],
    calls: m.callsMade,
    emails: m.emailsSent,
    meetings: m.meetingsHeld,
  }));

  const member = selectedMember ? mockTeam.find(m => m.id === selectedMember) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Team & Performance</h1>
          <p className="text-sm text-text-muted mt-1">Track team activity, performance, and commissions</p>
        </div>
        <DateRangeFilter onChange={setDateRange} defaultPreset="This Month" />
        <button onClick={() => exportToCSV(mockTeam.map(m => ({ name: m.name, role: m.role, department: m.role, revenueMTD: m.revenueGenerated, target: m.targetRevenue, dealsClosed: m.dealsClosedMTD, conversionRate: m.targetRevenue > 0 ? Math.round((m.revenueGenerated / m.targetRevenue) * 100) + '%' : 'N/A' })), 'team', [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'department', label: 'Department' }, { key: 'revenueMTD', label: 'Revenue MTD' }, { key: 'target', label: 'Target' }, { key: 'dealsClosed', label: 'Deals Closed' }, { key: 'conversionRate', label: 'Conversion Rate' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Team Size", value: mockTeam.length.toString(), icon: Users, color: "text-primary", bg: "bg-primary-light" },
          { label: "Total Revenue (MTD)", value: formatCurrency(salesTeam.reduce((s, m) => s + m.revenueGenerated, 0)), icon: DollarSign, color: "text-success", bg: "bg-success-light" },
          { label: "Deals Closed (MTD)", value: salesTeam.reduce((s, m) => s + m.dealsClosedMTD, 0).toString(), icon: Target, color: "text-accent", bg: "bg-[#6366f120]" },
          { label: "Avg Activity Score", value: Math.round(mockTeam.reduce((s, m) => s + m.activityScore, 0) / mockTeam.length).toString(), icon: TrendingUp, color: "text-warning", bg: "bg-warning-light" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{kpi.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}><Icon className={cn("h-4 w-4", kpi.color)} /></div>
              </div>
              <div className="text-2xl font-bold font-heading text-text-primary">{kpi.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {(["roster", "leaderboard", "activity"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize", tab === t ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
            {t === "roster" ? "Team Roster" : t === "leaderboard" ? "Leaderboard" : "Activity Tracking"}
          </button>
        ))}
        {tab === "roster" && (
          <select
            value={`${sortField}-${sortDir}`}
            onChange={e => { const [f, d] = e.target.value.split("-"); setSortField(f as keyof TeamMember); setSortDir(d as "asc" | "desc"); }}
            className="ml-auto rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="revenueGenerated-desc">Revenue High-Low</option>
            <option value="dealsClosedMTD-desc">Deals High-Low</option>
            <option value="activityScore-desc">Activity High-Low</option>
          </select>
        )}
      </div>

      {tab === "roster" && (
        <div className="grid grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("glass-card p-5", member ? "col-span-2" : "col-span-3")}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <SortHeader field="name" label="Name" />
                  <SortHeader field="role" label="Role" />
                  <SortHeader field="activeDeals" label="Active Deals" align="right" />
                  <SortHeader field="revenueGenerated" label="Revenue" align="right" />
                  <SortHeader field="activityScore" label="Activity" align="right" />
                  <SortHeader field="commissionEarned" label="Commission" align="right" />
                </tr>
              </thead>
              <tbody>
                {sortedTeam.map(m => (
                  <tr key={m.id} onClick={() => setSelectedMember(m.id)} className={cn("border-b border-border/50 cursor-pointer transition-colors", selectedMember === m.id ? "bg-primary-light/30" : "hover:bg-surface-hover/50")}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {m.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium text-text-primary">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", roleColors[m.role])}>{m.role}</span></td>
                    <td className="py-2.5 px-3 text-right text-text-primary">{m.activeDeals}</td>
                    <td className="py-2.5 px-3 text-right text-text-primary font-medium">{formatCurrency(m.revenueGenerated)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", m.activityScore >= 90 ? "bg-success" : m.activityScore >= 70 ? "bg-warning" : "bg-danger")} style={{ width: `${m.activityScore}%` }} />
                        </div>
                        <span className="text-xs text-text-muted">{m.activityScore}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-success font-medium">{m.commissionEarned > 0 ? formatCurrency(m.commissionEarned) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {member && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
              <div className="text-center mb-4">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary mb-2">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary">{member.name}</h3>
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium mt-1", roleColors[member.role])}>{member.role}</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Revenue (MTD)", value: formatCurrency(member.revenueGenerated), icon: DollarSign },
                  { label: "Deals Closed", value: member.dealsClosedMTD.toString(), icon: Target },
                  { label: "Calls Made", value: member.callsMade.toString(), icon: Phone },
                  { label: "Emails Sent", value: member.emailsSent.toString(), icon: Mail },
                  { label: "Meetings", value: member.meetingsHeld.toString(), icon: Calendar },
                  { label: "Commission Earned", value: formatCurrency(member.commissionEarned), icon: Award },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center justify-between p-2 rounded-lg bg-surface-hover/50">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-xs text-text-secondary">{stat.label}</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
              {member.targetRevenue > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-surface-hover">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-muted">Target Progress</span>
                    <span className="text-xs font-medium text-text-primary">{Math.round((member.revenueGenerated / member.targetRevenue) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (member.revenueGenerated / member.targetRevenue) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-text-muted">{formatCurrency(member.revenueGenerated)}</span>
                    <span className="text-[10px] text-text-muted">{formatCurrency(member.targetRevenue)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-warning" />
            <h3 className="font-heading text-lg font-semibold text-text-primary">Sales Leaderboard — March 2026</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.map((m, i) => {
              const maxRev = leaderboard[0].revenueGenerated;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 p-3 rounded-lg bg-surface-hover/50">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold", i === 0 ? "bg-warning text-background" : i === 1 ? "bg-gray-400 text-background" : i === 2 ? "bg-amber-700 text-white" : "bg-surface-hover text-text-muted")}>
                    {i + 1}
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {m.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.role} — {m.dealsClosedMTD} {m.dealsClosedMTD === 1 ? "deal" : "deals"} closed</p>
                  </div>
                  <div className="w-48">
                    <div className="h-3 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(m.revenueGenerated / maxRev) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-text-primary w-24 text-right">{formatCurrency(m.revenueGenerated)}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {tab === "activity" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Activity by Team Member (MTD)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={activityData} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
              <Bar dataKey="calls" name="Calls" fill="#3b82f6" barSize={10} radius={[0, 4, 4, 0]} />
              <Bar dataKey="emails" name="Emails" fill="#6366f1" barSize={10} radius={[0, 4, 4, 0]} />
              <Bar dataKey="meetings" name="Meetings" fill="#10b981" barSize={10} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
