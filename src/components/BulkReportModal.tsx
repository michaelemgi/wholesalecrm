// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, FileText, GitCompareArrows, Calendar,
  ArrowUpRight, ArrowDownRight, BarChart3, ChevronDown,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";

// ─── Utilities ────────────────────────────────────────────────────
function computePreviousPeriod(range: DateRange): DateRange {
  if (!range.startDate || !range.endDate) return { startDate: "", endDate: "", label: "" };
  const start = new Date(range.startDate + "T00:00:00");
  const end = new Date(range.endDate + "T00:00:00");
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { startDate: prevStart.toISOString().split("T")[0], endDate: prevEnd.toISOString().split("T")[0], label: "Previous Period" };
}

function computeSamePeriodLastYear(range: DateRange): DateRange {
  if (!range.startDate || !range.endDate) return { startDate: "", endDate: "", label: "" };
  const start = new Date(range.startDate + "T00:00:00");
  const end = new Date(range.endDate + "T00:00:00");
  const prevStart = new Date(start); prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevEnd = new Date(end); prevEnd.setFullYear(prevEnd.getFullYear() - 1);
  return { startDate: prevStart.toISOString().split("T")[0], endDate: prevEnd.toISOString().split("T")[0], label: "Same Period Last Year" };
}

function pctChange(current: number, previous: number): string {
  if (!previous || previous === 0) return current > 0 ? "+100%" : "—";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type CompareMode = "previous" | "lastYear" | "custom";

// ─── Report Config Types ──────────────────────────────────────────
export interface BulkReportConfig {
  title: string; // e.g. "Product Report", "Client Report"
  entityName: string; // e.g. "products", "clients"
  /** Build report rows from current + previous period data */
  buildReport: (params: {
    currentDateRange: DateRange;
    compareDateRange: DateRange;
    hasCompare: boolean;
  }) => {
    rows: Record<string, any>[];
    columns: { key: string; label: string }[];
    summary?: { label: string; current: string; previous?: string; change?: string }[];
  };
}

// ─── Modal Component ──────────────────────────────────────────────
export default function BulkReportModal({
  config,
  onClose,
}: {
  config: BulkReportConfig;
  onClose: () => void;
}) {
  const [reportType, setReportType] = useState<"standard" | "comparison">("standard");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [compareMode, setCompareMode] = useState<CompareMode>("previous");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [generated, setGenerated] = useState(false);

  const isComparison = reportType === "comparison";

  const compareRange = useMemo(() => {
    if (!isComparison || !dateRange.startDate) return { startDate: "", endDate: "", label: "" };
    if (compareMode === "lastYear") return computeSamePeriodLastYear(dateRange);
    if (compareMode === "custom" && customStart && customEnd) return { startDate: customStart, endDate: customEnd, label: "Custom" };
    return computePreviousPeriod(dateRange);
  }, [isComparison, dateRange, compareMode, customStart, customEnd]);

  const hasCompare = isComparison && compareRange.startDate !== "";

  const reportData = useMemo(() => {
    if (!generated) return null;
    return config.buildReport({
      currentDateRange: dateRange,
      compareDateRange: compareRange,
      hasCompare,
    });
  }, [generated, dateRange, compareRange, hasCompare, config]);

  const handleGenerate = () => setGenerated(true);

  const handleExport = () => {
    if (!reportData) return;
    const filename = `${config.entityName}-${isComparison ? "comparison-" : ""}report-${new Date().toISOString().split("T")[0]}`;
    exportToCSV(reportData.rows, filename, reportData.columns);
  };

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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{config.title}</h2>
              <p className="text-xs text-text-muted">Generate and export {config.entityName} reports</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Report Type */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">Report Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setReportType("standard"); setGenerated(false); }}
                className={cn("flex items-start gap-3 p-4 rounded-xl border transition-colors text-left",
                  reportType === "standard" ? "border-primary/50 bg-primary/5" : "border-border hover:border-border-light"
                )}
              >
                <BarChart3 className={cn("h-5 w-5 shrink-0 mt-0.5", reportType === "standard" ? "text-primary" : "text-text-muted")} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Standard Report</p>
                  <p className="text-[10px] text-text-muted mt-0.5">All {config.entityName} with current metrics</p>
                </div>
              </button>
              <button
                onClick={() => { setReportType("comparison"); setGenerated(false); }}
                className={cn("flex items-start gap-3 p-4 rounded-xl border transition-colors text-left",
                  reportType === "comparison" ? "border-purple-500/50 bg-purple-500/5" : "border-border hover:border-border-light"
                )}
              >
                <GitCompareArrows className={cn("h-5 w-5 shrink-0 mt-0.5", reportType === "comparison" ? "text-purple-400" : "text-text-muted")} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Comparison Report</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Compare {config.entityName} across two periods</p>
                </div>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
              {isComparison ? "Current Period" : "Date Range"}
            </label>
            <DateRangeFilter onChange={(r) => { setDateRange(r); setGenerated(false); }} defaultPreset="All Time" />
          </div>

          {/* Comparison Options */}
          {isComparison && dateRange.startDate && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block">Compare Against</label>
              <div className="space-y-2">
                {([
                  ["previous", "Previous Period", `${fmtDate(computePreviousPeriod(dateRange).startDate)} — ${fmtDate(computePreviousPeriod(dateRange).endDate)}`],
                  ["lastYear", "Same Period Last Year", `${fmtDate(computeSamePeriodLastYear(dateRange).startDate)} — ${fmtDate(computeSamePeriodLastYear(dateRange).endDate)}`],
                  ["custom", "Custom Period", "Choose dates below"],
                ] as const).map(([mode, label, desc]) => (
                  <button
                    key={mode}
                    onClick={() => { setCompareMode(mode); setGenerated(false); }}
                    className={cn("w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left text-sm transition-colors",
                      compareMode === mode ? "border-purple-500/50 bg-purple-500/5" : "border-border hover:border-border-light"
                    )}
                  >
                    <div>
                      <p className={cn("font-medium", compareMode === mode ? "text-purple-400" : "text-text-primary")}>{label}</p>
                      <p className="text-[10px] text-text-muted">{desc}</p>
                    </div>
                    <div className={cn("h-4 w-4 rounded-full border-2", compareMode === mode ? "border-purple-400 bg-purple-400" : "border-border")} />
                  </button>
                ))}
              </div>
              {compareMode === "custom" && (
                <div className="grid grid-cols-2 gap-3 pl-4">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase">From</label>
                    <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setGenerated(false); }}
                      className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase">To</label>
                    <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setGenerated(false); }}
                      className="w-full mt-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={isComparison && !dateRange.startDate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
          )}

          {/* Report Preview */}
          {generated && reportData && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              {reportData.summary && reportData.summary.length > 0 && (
                <div className={cn("grid gap-3", reportData.summary.length <= 3 ? "grid-cols-3" : "grid-cols-4")}>
                  {reportData.summary.map(s => (
                    <div key={s.label} className="p-3 rounded-lg bg-surface-hover">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</p>
                      <p className="text-lg font-bold text-text-primary mt-1">{s.current}</p>
                      {s.change && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-[10px] font-medium", s.change.startsWith("+") ? "text-emerald-400" : s.change.startsWith("-") ? "text-red-400" : "text-text-muted")}>
                            {s.change}
                          </span>
                          {s.previous && <span className="text-[10px] text-text-muted">was {s.previous}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-surface/50 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-medium text-text-primary">{reportData.rows.length} {config.entityName}</p>
                  {isComparison && hasCompare && (
                    <span className="text-[10px] text-purple-400 font-medium">
                      {fmtDate(dateRange.startDate)} — {fmtDate(dateRange.endDate)} vs {fmtDate(compareRange.startDate)} — {fmtDate(compareRange.endDate)}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-surface border-b border-border">
                        {reportData.columns.map(col => (
                          <th key={col.key} className="py-2 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {reportData.columns.map(col => {
                            const val = row[col.key];
                            const isChange = col.key.toLowerCase().includes("change");
                            return (
                              <td key={col.key} className={cn("py-2 px-3 whitespace-nowrap",
                                isChange && typeof val === "string" ? (val.startsWith("+") ? "text-emerald-400 font-medium" : val.startsWith("-") ? "text-red-400 font-medium" : "text-text-muted") : "text-text-secondary"
                              )}>
                                {val ?? "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {reportData.rows.length > 20 && (
                  <div className="px-4 py-2 bg-surface/50 border-t border-border text-center">
                    <p className="text-[10px] text-text-muted">Showing 20 of {reportData.rows.length} rows — export for full data</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generated && reportData && (
          <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
            <button
              onClick={() => setGenerated(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary bg-surface border border-border hover:border-primary/50 transition-colors"
            >
              Modify Report
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
