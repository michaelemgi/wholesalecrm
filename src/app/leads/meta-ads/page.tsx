"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Users, Target, TrendingUp, Eye, MousePointer, ArrowRight,
  Play, Pause, CheckCircle2, Zap, BarChart3, Megaphone, ChevronRight,
  Globe, Activity, Search, MoreHorizontal, ExternalLink, Link2,
  UserPlus, GitBranch, Mail, Settings,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import DateRangeFilter, { DateRange } from "@/components/DateRangeFilter";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { MetaCampaign } from "@/types";

function StatusBadge({ status }: { status: MetaCampaign["status"] }) {
  const config = {
    Active: { icon: Play, bg: "bg-success/15", text: "text-success", border: "border-success/25", dot: "bg-success" },
    Paused: { icon: Pause, bg: "bg-warning/15", text: "text-warning", border: "border-warning/25", dot: "bg-warning" },
    Completed: { icon: CheckCircle2, bg: "bg-surface", text: "text-text-muted", border: "border-border", dot: "bg-text-muted" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", config.bg, config.text, config.border)}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-secondary">{formatCurrency(value)} / {formatCurrency(max)}</span>
        <span className="text-text-muted font-medium">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

const flowSteps = [
  { icon: Megaphone, label: "Meta Ad", desc: "Campaign runs on Facebook & Instagram", color: "text-primary", bg: "bg-primary-light" },
  { icon: UserPlus, label: "Lead Form", desc: "Prospect fills out instant form", color: "text-accent", bg: "bg-[#6366f120]" },
  { icon: GitBranch, label: "CRM Pipeline", desc: "Lead enters pipeline automatically", color: "text-success", bg: "bg-success-light" },
  { icon: Users, label: "Auto-assignment", desc: "Assigned to rep by territory/round-robin", color: "text-warning", bg: "bg-warning-light" },
  { icon: Mail, label: "Sequence Trigger", desc: "Nurture sequence starts immediately", color: "text-danger", bg: "bg-danger-light" },
];

export default function MetaAdsPage() {
  const { data: mockMetaCampaigns = [] } = useSWR<MetaCampaign[]>('/api/campaigns/meta', fetcher);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });

  const campaigns = mockMetaCampaigns;
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const leadsWithCPL = campaigns.filter((c) => c.leads > 0);
  const avgCPL = leadsWithCPL.length > 0 ? leadsWithCPL.reduce((sum, c) => sum + c.cpl, 0) / leadsWithCPL.length : 0;
  const roasCampaigns = campaigns.filter((c) => c.roas > 0);
  const avgROAS = roasCampaigns.length > 0 ? roasCampaigns.reduce((sum, c) => sum + c.roas, 0) / roasCampaigns.length : 0;

  const kpis = [
    { label: "Total Spend", value: formatCurrency(totalSpend), icon: DollarSign, color: "text-primary", bg: "bg-primary-light", sub: "across all campaigns" },
    { label: "Total Leads", value: formatNumber(totalLeads), icon: Users, color: "text-success", bg: "bg-success-light", sub: "generated this period" },
    { label: "Avg CPL", value: `$${avgCPL.toFixed(2)}`, icon: Target, color: "text-warning", bg: "bg-warning-light", sub: "cost per lead" },
    { label: "Avg ROAS", value: `${avgROAS.toFixed(1)}x`, icon: TrendingUp, color: "text-accent", bg: "bg-[#6366f120]", sub: "return on ad spend" },
  ];

  const filteredCampaigns = campaigns.filter(
    (c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-light">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            Meta Ads Dashboard
          </h1>
          <p className="text-text-secondary mt-1">Manage Facebook & Instagram ad campaigns and track lead generation performance</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
            <Settings className="w-4 h-4" />
            Ad Settings
          </button>
        </div>
      </motion.div>

      {/* Connected Account Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Meta Business Suite</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/25">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">WholesaleOS Ad Account &bull; Last synced 5 min ago</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-surface-hover transition-colors border border-border">
              <ExternalLink className="w-3 h-3" />
              Open in Meta
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
              <p className="text-xs text-text-muted mt-0.5">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
      </motion.div>

      {/* Campaign Cards/Table */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="glass-card p-5 hover:bg-surface-hover/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{campaign.objective}</span>
                    <span className="text-border">&bull;</span>
                    <span className="text-xs text-text-muted">{campaign.audiences.join(", ")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={campaign.status} />
                <button className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Spend Progress */}
            <div className="mb-4">
              <ProgressBar
                value={campaign.spend}
                max={campaign.budget}
                color={campaign.spend / campaign.budget > 0.9 ? "bg-danger" : campaign.spend / campaign.budget > 0.7 ? "bg-warning" : "bg-primary"}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Impressions</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{formatNumber(campaign.impressions)}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Clicks</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{formatNumber(campaign.clicks)}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">CTR</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{campaign.ctr}%</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">CPC</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">${campaign.cpc.toFixed(2)}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">CPL</p>
                <p className={cn("text-sm font-semibold mt-0.5", campaign.cpl > 0 ? "text-text-primary" : "text-text-muted")}>
                  {campaign.cpl > 0 ? `$${campaign.cpl.toFixed(2)}` : "N/A"}
                </p>
              </div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Leads</p>
                <p className={cn("text-sm font-semibold mt-0.5", campaign.leads > 0 ? "text-success" : "text-text-muted")}>
                  {campaign.leads > 0 ? formatNumber(campaign.leads) : "N/A"}
                </p>
              </div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">ROAS</p>
                <p className={cn("text-sm font-bold mt-0.5", campaign.roas > 5 ? "text-success" : campaign.roas > 0 ? "text-text-primary" : "text-text-muted")}>
                  {campaign.roas > 0 ? `${campaign.roas}x` : "N/A"}
                </p>
              </div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Spend</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{formatCurrency(campaign.spend)}</p>
              </div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Budget</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">{formatCurrency(campaign.budget)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Flow Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold font-heading text-text-primary">Lead Flow Pipeline</h2>
          <span className="text-xs text-text-muted ml-2">Automated end-to-end lead capture and nurture</span>
        </div>

        <div className="flex items-stretch justify-between gap-0 overflow-x-auto pb-2">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                className="glass-card p-4 min-w-[160px] text-center hover:bg-surface-hover transition-all group cursor-default"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3", step.bg)}>
                  <step.icon className={cn("w-6 h-6", step.color)} />
                </div>
                <h4 className="text-sm font-semibold text-text-primary">{step.label}</h4>
                <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{step.desc}</p>
              </motion.div>
              {i < flowSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-center px-2 shrink-0"
                >
                  <div className="w-6 h-px bg-border" />
                  <ChevronRight className="w-4 h-4 text-text-muted -mx-1" />
                  <div className="w-6 h-px bg-border" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
