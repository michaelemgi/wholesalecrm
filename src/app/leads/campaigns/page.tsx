"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail, Search, Play, Pause, CheckCircle2, FileEdit, Filter,
  Send, Eye, MessageSquare, AlertTriangle, Plus, MoreHorizontal,
  TrendingUp, Users, ArrowUpRight, ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { EmailCampaign } from "@/types";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";

function StatusBadge({ status }: { status: EmailCampaign["status"] }) {
  const config = {
    Active: { icon: Play, bg: "bg-success/15", text: "text-success", border: "border-success/25" },
    Paused: { icon: Pause, bg: "bg-warning/15", text: "text-warning", border: "border-warning/25" },
    Completed: { icon: CheckCircle2, bg: "bg-surface", text: "text-text-muted", border: "border-border" },
    Draft: { icon: FileEdit, bg: "bg-primary/15", text: "text-primary", border: "border-primary/25" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", config.bg, config.text, config.border)}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function CampaignsPage() {
  const { data: mockEmailCampaigns = [], isLoading } = useSWR<EmailCampaign[]>('/api/campaigns/email', fetcher);

  type SortField = "name" | "status" | "sent" | "opened" | "replied" | "openRate" | "replyRate" | "bounceRate" | "positiveReplyRate" | "totalContacts";
  type SortDir = "asc" | "desc";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | EmailCampaign["status"]>("All");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [sortField, setSortField] = useState<SortField>("sent");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const campaigns = mockEmailCampaigns;
  const activeCampaigns = campaigns.filter((c) => c.status === "Active");
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
  const totalReplied = campaigns.reduce((sum, c) => sum + c.replied, 0);
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const avgReplyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0";

  const topStats = [
    { label: "Total Active", value: activeCampaigns.length, icon: Play, color: "text-success", bg: "bg-success-light" },
    { label: "Total Sent", value: formatNumber(totalSent), icon: Send, color: "text-primary", bg: "bg-primary-light" },
    { label: "Avg Open Rate", value: `${avgOpenRate}%`, icon: Eye, color: "text-accent", bg: "bg-[#6366f120]" },
    { label: "Avg Reply Rate", value: `${avgReplyRate}%`, icon: MessageSquare, color: "text-warning", bg: "bg-warning-light" },
  ];

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "All" || c.status === filterStatus;
    const matchesDate = !dateRange.startDate || isInRange(c.startDate, dateRange);
    return matchesSearch && matchesFilter && matchesDate;
  });

  const sortedCampaigns = useMemo(() => {
    const rate = (n: number, d: number) => (d > 0 ? n / d : 0);
    return [...filteredCampaigns].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortField) {
        case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "sent": aVal = a.sent; bVal = b.sent; break;
        case "opened": aVal = a.opened; bVal = b.opened; break;
        case "replied": aVal = a.replied; bVal = b.replied; break;
        case "openRate": aVal = rate(a.opened, a.sent); bVal = rate(b.opened, b.sent); break;
        case "replyRate": aVal = rate(a.replied, a.sent); bVal = rate(b.replied, b.sent); break;
        case "bounceRate": aVal = rate(a.bounced, a.sent); bVal = rate(b.bounced, b.sent); break;
        case "positiveReplyRate": aVal = rate(a.positiveReplies, a.sent); bVal = rate(b.positiveReplies, b.sent); break;
        case "totalContacts": aVal = a.totalContacts; bVal = b.totalContacts; break;
        default: aVal = 0; bVal = 0;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredCampaigns, sortField, sortDir]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-52 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-72 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded-lg animate-pulse" />
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

  function SortHeader({ field, label, align = "left", className = "" }: { field: SortField; label: string; align?: "left" | "right"; className?: string }) {
    const active = sortField === field;
    return (
      <th
        className={cn("px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer select-none hover:text-text-primary transition-colors", align === "right" ? "text-right" : "text-left", className)}
        onClick={() => {
          if (active) setSortDir(sortDir === "asc" ? "desc" : "asc");
          else { setSortField(field); setSortDir("desc"); }
        }}
      >
        <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end")}>
          {label}
          {active ? (sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </span>
      </th>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-light">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            Campaign Manager
          </h1>
          <p className="text-text-secondary mt-1">Monitor and manage all your email outreach campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 flex items-center gap-4"
          >
            <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          {(["All", "Active", "Paused", "Completed", "Draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3.5 py-2 rounded-lg text-xs font-medium transition-all border",
                filterStatus === s
                  ? "bg-primary text-white border-primary"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              )}
            >
              {s}
            </button>
          ))}
          <select
            value={`${sortField}-${sortDir}`}
            onChange={(e) => {
              const [f, d] = e.target.value.split("-") as [SortField, SortDir];
              setSortField(f);
              setSortDir(d);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
          >
            <option value="sent-desc">Most Sent</option>
            <option value="name-asc">Name A–Z</option>
            <option value="openRate-desc">Open Rate High</option>
            <option value="replyRate-desc">Reply Rate High</option>
          </select>
        </div>
      </motion.div>

      {/* Campaign Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <SortHeader field="name" label="Campaign" />
                <SortHeader field="status" label="Status" />
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Type</th>
                <SortHeader field="totalContacts" label="Contacts" align="right" className="hidden lg:table-cell" />
                <SortHeader field="sent" label="Sent" align="right" />
                <SortHeader field="openRate" label="Opened" align="right" />
                <SortHeader field="replyRate" label="Replied" align="right" className="hidden md:table-cell" />
                <SortHeader field="bounceRate" label="Bounce Rate" align="right" className="hidden lg:table-cell" />
                <SortHeader field="positiveReplyRate" label="Positive Reply Rate" align="right" className="hidden xl:table-cell" />
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedCampaigns.map((campaign, i) => {
                const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : "0";
                const replyRate = campaign.sent > 0 ? ((campaign.replied / campaign.sent) * 100).toFixed(1) : "0";
                const bounceRate = campaign.sent > 0 ? ((campaign.bounced / campaign.sent) * 100).toFixed(1) : "0";
                const positiveReplyRate = campaign.sent > 0 ? ((campaign.positiveReplies / campaign.sent) * 100).toFixed(1) : "0";

                return (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="hover:bg-surface-hover transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{campaign.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">Started {formatDate(campaign.startDate)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded-md bg-surface text-text-secondary">{campaign.type}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-text-primary hidden lg:table-cell">{formatNumber(campaign.totalContacts)}</td>
                    <td className="px-5 py-4 text-right text-sm text-text-primary">{formatNumber(campaign.sent)}</td>
                    <td className="px-5 py-4 text-right hidden sm:table-cell">
                      <div className="text-right">
                        <span className="text-sm text-text-primary">{formatNumber(campaign.opened)}</span>
                        <span className="text-xs text-text-muted ml-1.5">({openRate}%)</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <div className="text-right">
                        <span className="text-sm text-text-primary">{formatNumber(campaign.replied)}</span>
                        <span className="text-xs text-text-muted ml-1.5">({replyRate}%)</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <span className={cn(
                        "text-sm font-medium",
                        parseFloat(bounceRate) > 5 ? "text-danger" : parseFloat(bounceRate) > 3 ? "text-warning" : "text-text-primary"
                      )}>
                        {bounceRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right hidden xl:table-cell">
                      <span className={cn(
                        "text-sm font-semibold",
                        parseFloat(positiveReplyRate) > 5 ? "text-success" : parseFloat(positiveReplyRate) > 3 ? "text-text-primary" : "text-text-secondary"
                      )}>
                        {positiveReplyRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedCampaigns.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">No campaigns match your search.</div>
        )}
      </motion.div>
    </div>
  );
}
