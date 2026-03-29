"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, Bot, Play, Download, UserPlus, Send,
  Building2, MapPin, Users, DollarSign, Flame, Thermometer, Snowflake,
  CheckSquare, Square, ChevronDown, Loader2, Sparkles, Globe, X,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Lead } from "@/types";

const industries = ["All Industries", "Food Distribution", "Construction", "Produce", "Packaging", "Catering", "Import/Export", "Agriculture", "Beverages", "Industrial Supply", "Organic Foods", "Paper & Packaging", "Chemicals"];

function ScoreBadge({ status, score }: { status: Lead["status"]; score: number }) {
  const config = {
    Hot: { icon: Flame, bg: "bg-danger-light", text: "text-danger", border: "border-danger/30" },
    Warm: { icon: Thermometer, bg: "bg-warning-light", text: "text-warning", border: "border-warning/30" },
    Cold: { icon: Snowflake, bg: "bg-primary-light", text: "text-primary", border: "border-primary/30" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", config.bg, config.text, config.border)}>
      <Icon className="w-3 h-3" />
      {score} {status}
    </span>
  );
}

export default function LeadScraperPage() {
  const { data: mockLeads = [] } = useSWR<Lead[]>('/api/leads', fetcher);

  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [minRevenue, setMinRevenue] = useState("");
  const [maxRevenue, setMaxRevenue] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Lead[]>([]);
  const [hasScraped, setHasScraped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | Lead["status"]>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const startScraping = useCallback(() => {
    setIsScraping(true);
    setProgress(0);
    setResults([]);
    setSelectedIds(new Set());
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScraping(false);
          setHasScraped(true);
          setResults(mockLeads);
          return 100;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 200);
  }, [mockLeads]);

  const filteredResults = results.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map((l) => l.id)));
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-light">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            AI Lead Scraper
          </h1>
          <p className="text-text-secondary mt-1">Discover and enrich high-quality B2B leads with AI-powered prospecting</p>
        </div>
        {hasScraped && (
          <div className="text-sm text-text-secondary">
            <span className="text-text-primary font-semibold">{results.length}</span> leads found
          </div>
        )}
      </motion.div>

      {/* Scraper Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Industry</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer"
              >
                <option value="">Select Industry</option>
                {industries.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="e.g., San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Company Size (Employees)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="number" placeholder="Min" value={minSize} onChange={(e) => setMinSize(e.target.value)} className="w-full bg-surface border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <span className="flex items-center text-text-muted text-sm">to</span>
              <div className="relative flex-1">
                <input type="number" placeholder="Max" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Estimated Revenue</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="number" placeholder="Min Revenue" value={minRevenue} onChange={(e) => setMinRevenue(e.target.value)} className="w-full bg-surface border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
              <span className="flex items-center text-text-muted text-sm">to</span>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="number" placeholder="Max Revenue" value={maxRevenue} onChange={(e) => setMaxRevenue(e.target.value)} className="w-full bg-surface border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={startScraping}
              disabled={isScraping}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all",
                isScraping
                  ? "bg-primary/50 text-white/70 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
              )}
            >
              {isScraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Scraping
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {isScraping && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                  Scanning databases and enriching lead profiles...
                </span>
                <span className="text-primary font-medium">{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <div className="flex gap-6 text-xs text-text-muted">
                <span>{Math.round(Math.min(progress, 100) * 0.12)} sources scanned</span>
                <span>{Math.round(Math.min(progress, 100) * 0.15)} profiles matched</span>
                <span>{Math.round(Math.min(progress, 100) * 0.08)} emails verified</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Section */}
      {hasScraped && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search leads by company, contact, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {(["All", "Hot", "Warm", "Cold"] as const).map((s) => (
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all border",
                  showFilters ? "bg-primary/10 text-primary border-primary/30" : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">
                      <button onClick={toggleAll} className="text-text-muted hover:text-text-primary transition-colors">
                        {selectedIds.size === filteredResults.length && filteredResults.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Industry</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Employees</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Est. Revenue</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResults.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => toggleSelect(lead.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedIds.has(lead.id) ? "bg-primary/5" : "hover:bg-surface-hover"
                      )}
                    >
                      <td className="px-4 py-3">
                        {selectedIds.has(lead.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-text-muted" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {lead.companyName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{lead.companyName}</p>
                            {lead.website && (
                              <p className="text-xs text-text-muted flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {lead.website}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">{lead.contactName}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">{lead.email}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary hidden xl:table-cell">{lead.phone}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs px-2 py-1 rounded-md bg-surface text-text-secondary">{lead.industry}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary hidden lg:table-cell">{lead.location}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right hidden xl:table-cell">{formatNumber(lead.employeeCount)}</td>
                      <td className="px-4 py-3 text-sm text-text-primary text-right font-medium hidden md:table-cell">{formatCurrency(lead.estimatedRevenue)}</td>
                      <td className="px-4 py-3 text-center">
                        <ScoreBadge status={lead.status} score={lead.score} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredResults.length === 0 && (
              <div className="text-center py-12 text-text-muted text-sm">No leads match your search criteria.</div>
            )}
          </div>

          {/* Bulk Action Bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
              >
                <div className="flex items-center gap-4 bg-surface border border-border rounded-xl px-6 py-3 shadow-2xl shadow-black/40">
                  <span className="text-sm text-text-secondary">
                    <span className="text-primary font-semibold">{selectedIds.size}</span> leads selected
                  </span>
                  <div className="w-px h-6 bg-border" />
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
                    <Send className="w-3.5 h-3.5" />
                    Add to Sequence
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-text-primary text-sm font-medium hover:bg-border transition-colors border border-border">
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign to Rep
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-text-primary text-sm font-medium hover:bg-border transition-colors border border-border">
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty state before scraping */}
      {!hasScraped && !isScraping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-2">Ready to find your next customers</h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Configure your search criteria above and click Start Scraping. Our AI will scan multiple databases,
            verify contact info, and score each lead for you.
          </p>
        </motion.div>
      )}
    </div>
  );
}
