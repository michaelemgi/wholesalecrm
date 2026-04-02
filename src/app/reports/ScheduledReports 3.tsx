// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Plus, X, Mail, Pencil, Trash2, Play, Pause, Send,
  Calendar, FileText, Download, Check, AlertCircle, Eye,
  ChevronDown, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type Frequency = "daily" | "weekly" | "monthly" | "quarterly";
type Format = "pdf" | "csv" | "both";
type DateRangePreset = "last7" | "last30" | "lastQuarter" | "mtd" | "ytd" | "custom";

interface ScheduledReport {
  id: string;
  reportName: string;
  reportId: string;
  frequency: Frequency;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM
  recipients: string[];
  format: Format;
  dateRange: DateRangePreset;
  status: "active" | "paused";
  lastSent: string | null;
  nextRun: string;
  createdAt: string;
}

interface ReportOption {
  id: string;
  name: string;
  category: string;
}

// --- Available Reports ---
const reportOptions: ReportOption[] = [
  { id: "r1", name: "Sales by Rep", category: "Sales" },
  { id: "r2", name: "Sales by Product", category: "Sales" },
  { id: "r15", name: "Sales by Client", category: "Sales" },
  { id: "r3", name: "Sales by Region", category: "Sales" },
  { id: "r4", name: "Customer Acquisition", category: "Customers" },
  { id: "r5", name: "Inventory Turnover", category: "Inventory" },
  { id: "r6", name: "Accounts Receivable Aging", category: "Finance" },
  { id: "r7", name: "Campaign Performance", category: "Marketing" },
  { id: "r8", name: "Pipeline Velocity", category: "Sales" },
  { id: "r9", name: "P&L Summary", category: "Finance" },
  { id: "r10", name: "Cash Flow Statement", category: "Finance" },
  { id: "r11", name: "Fulfillment Metrics", category: "Operations" },
  { id: "r12", name: "Lead Conversion Funnel", category: "Sales" },
  { id: "r13", name: "Weekly Comparison", category: "Sales" },
  { id: "r14", name: "Client Product Performance", category: "Customers" },
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const frequencyLabels: Record<Frequency, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" };
const formatLabels: Record<Format, string> = { pdf: "PDF", csv: "CSV", both: "PDF & CSV" };
const dateRangeLabels: Record<DateRangePreset, string> = {
  last7: "Last 7 days", last30: "Last 30 days", lastQuarter: "Last quarter",
  mtd: "Month to date", ytd: "Year to date", custom: "Custom range",
};

// --- Helper: describe schedule ---
function describeSchedule(sr: ScheduledReport): string {
  let freq = "";
  if (sr.frequency === "daily") freq = "every day";
  else if (sr.frequency === "weekly") freq = `every ${dayNames[sr.dayOfWeek || 1]}`;
  else if (sr.frequency === "monthly") freq = `on the ${ordinal(sr.dayOfMonth || 1)} of every month`;
  else freq = `on the ${ordinal(sr.dayOfMonth || 1)} of every quarter`;

  const timeStr = formatTime(sr.time);
  return `This report will be sent ${freq} at ${timeStr} to ${sr.recipients.length} recipient${sr.recipients.length !== 1 ? "s" : ""}.`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatScheduleShort(sr: ScheduledReport): string {
  if (sr.frequency === "daily") return `Daily at ${formatTime(sr.time)}`;
  if (sr.frequency === "weekly") return `Every ${dayNames[sr.dayOfWeek || 1]} at ${formatTime(sr.time)}`;
  if (sr.frequency === "monthly") return `${ordinal(sr.dayOfMonth || 1)} of month at ${formatTime(sr.time)}`;
  return `Quarterly on ${ordinal(sr.dayOfMonth || 1)} at ${formatTime(sr.time)}`;
}

// --- Initial Mock Data ---
function getInitialSchedules(): ScheduledReport[] {
  return [
    {
      id: "sched-1",
      reportName: "Sales by Rep",
      reportId: "r1",
      frequency: "weekly",
      dayOfWeek: 1,
      time: "08:00",
      recipients: ["adam@wholesale-co.com", "sarah@wholesale-co.com"],
      format: "pdf",
      dateRange: "last7",
      status: "active",
      lastSent: "Mar 25, 2026",
      nextRun: "Mar 31, 2026",
      createdAt: "2026-01-15",
    },
    {
      id: "sched-2",
      reportName: "P&L Summary",
      reportId: "r9",
      frequency: "monthly",
      dayOfMonth: 1,
      time: "07:00",
      recipients: ["adam@wholesale-co.com"],
      format: "both",
      dateRange: "last30",
      status: "active",
      lastSent: "Mar 1, 2026",
      nextRun: "Apr 1, 2026",
      createdAt: "2025-11-20",
    },
    {
      id: "sched-3",
      reportName: "Inventory Turnover",
      reportId: "r5",
      frequency: "daily",
      time: "07:00",
      recipients: ["rachel@wholesale-co.com", "lisa@wholesale-co.com"],
      format: "csv",
      dateRange: "last7",
      status: "active",
      lastSent: "Mar 28, 2026",
      nextRun: "Mar 29, 2026",
      createdAt: "2026-02-01",
    },
    {
      id: "sched-4",
      reportName: "Accounts Receivable Aging",
      reportId: "r6",
      frequency: "weekly",
      dayOfWeek: 5,
      time: "16:00",
      recipients: ["adam@wholesale-co.com", "finance@wholesale-co.com"],
      format: "pdf",
      dateRange: "mtd",
      status: "active",
      lastSent: "Mar 22, 2026",
      nextRun: "Mar 29, 2026",
      createdAt: "2026-01-05",
    },
    {
      id: "sched-5",
      reportName: "Campaign Performance",
      reportId: "r7",
      frequency: "monthly",
      dayOfMonth: 15,
      time: "09:00",
      recipients: ["marketing@wholesale-co.com"],
      format: "pdf",
      dateRange: "last30",
      status: "paused",
      lastSent: "Mar 15, 2026",
      nextRun: "—",
      createdAt: "2026-02-15",
    },
    {
      id: "sched-6",
      reportName: "Cash Flow Statement",
      reportId: "r10",
      frequency: "quarterly",
      dayOfMonth: 5,
      time: "08:00",
      recipients: ["adam@wholesale-co.com", "cfo@wholesale-co.com"],
      format: "both",
      dateRange: "lastQuarter",
      status: "active",
      lastSent: "Jan 5, 2026",
      nextRun: "Apr 5, 2026",
      createdAt: "2025-10-01",
    },
  ];
}

// --- Recipient Input (chips) ---
function RecipientInput({ recipients, onChange }: { recipients: string[]; onChange: (r: string[]) => void }) {
  const [input, setInput] = useState("");

  const addRecipient = () => {
    const email = input.trim().toLowerCase();
    if (email && email.includes("@") && !recipients.includes(email)) {
      onChange([...recipients, email]);
      setInput("");
    }
  };

  const removeRecipient = (email: string) => {
    onChange(recipients.filter(r => r !== email));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {recipients.map(email => (
          <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Mail className="h-3 w-3" />
            {email}
            <button onClick={() => removeRecipient(email)} className="ml-0.5 hover:text-red-400 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }}
          placeholder="Add email address..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 transition-colors"
        />
        <button
          onClick={addRecipient}
          className="px-3 py-2 rounded-lg bg-surface-hover border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// --- Schedule Modal (Create/Edit) ---
function ScheduleModal({
  schedule,
  onClose,
  onSave,
}: {
  schedule: ScheduledReport | null;
  onClose: () => void;
  onSave: (sr: ScheduledReport) => void;
}) {
  const isEdit = schedule !== null;

  const [reportId, setReportId] = useState(schedule?.reportId || reportOptions[0].id);
  const [frequency, setFrequency] = useState<Frequency>(schedule?.frequency || "weekly");
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.dayOfMonth ?? 1);
  const [time, setTime] = useState(schedule?.time || "08:00");
  const [recipients, setRecipients] = useState<string[]>(schedule?.recipients || []);
  const [format, setFormat] = useState<Format>(schedule?.format || "pdf");
  const [dateRange, setDateRange] = useState<DateRangePreset>(schedule?.dateRange || "last7");

  const selectedReport = reportOptions.find(r => r.id === reportId);

  const previewDescription = useMemo(() => {
    const mock: ScheduledReport = {
      id: "", reportName: selectedReport?.name || "", reportId,
      frequency, dayOfWeek, dayOfMonth, time,
      recipients, format, dateRange,
      status: "active", lastSent: null, nextRun: "", createdAt: "",
    };
    return describeSchedule(mock);
  }, [reportId, frequency, dayOfWeek, dayOfMonth, time, recipients, selectedReport]);

  const handleSave = () => {
    const reportName = selectedReport?.name || "Unknown Report";
    // Compute next run (simplified)
    const now = new Date();
    let nextDate = new Date(now);
    if (frequency === "daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (frequency === "weekly") {
      const diff = ((dayOfWeek - now.getDay()) + 7) % 7 || 7;
      nextDate.setDate(nextDate.getDate() + diff);
    } else if (frequency === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + (now.getDate() >= dayOfMonth ? 1 : 0));
      nextDate.setDate(dayOfMonth);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 3);
      nextDate.setDate(dayOfMonth);
    }
    const nextRun = nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    onSave({
      id: schedule?.id || `sched-${Date.now()}`,
      reportName,
      reportId,
      frequency,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
      dayOfMonth: (frequency === "monthly" || frequency === "quarterly") ? dayOfMonth : undefined,
      time,
      recipients,
      format,
      dateRange,
      status: schedule?.status || "active",
      lastSent: schedule?.lastSent || null,
      nextRun,
      createdAt: schedule?.createdAt || new Date().toISOString().split("T")[0],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-raised border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-heading font-bold text-text-primary">
            {isEdit ? "Edit Schedule" : "Create Schedule"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Report Selector */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Report</label>
            <select
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
            >
              {reportOptions.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
              ))}
            </select>
          </div>

          {/* Frequency + Day/Date + Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
              >
                {(["daily", "weekly", "monthly", "quarterly"] as Frequency[]).map(f => (
                  <option key={f} value={f}>{frequencyLabels[f]}</option>
                ))}
              </select>
            </div>

            {frequency === "weekly" && (
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
                >
                  {dayNames.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {(frequency === "monthly" || frequency === "quarterly") && (
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Day of Month</label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{ordinal(d)}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Recipients</label>
            <RecipientInput recipients={recipients} onChange={setRecipients} />
          </div>

          {/* Format + Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Format</label>
              <div className="flex gap-2">
                {(["pdf", "csv", "both"] as Format[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-colors border",
                      format === f
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border text-text-muted hover:text-text-primary hover:bg-surface-hover"
                    )}
                  >
                    {formatLabels[f]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 block">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 transition-colors"
              >
                {(Object.entries(dateRangeLabels) as [DateRangePreset, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Schedule Preview</span>
            </div>
            <p className="text-sm text-text-secondary">{previewDescription}</p>
            <p className="text-xs text-text-muted mt-1">
              Format: {formatLabels[format]} &middot; Data: {dateRangeLabels[dateRange]}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-surface/50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={recipients.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            {isEdit ? "Update Schedule" : "Create Schedule"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Delete Confirmation Modal ---
function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-raised border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-text-primary">Delete Schedule</h3>
            <p className="text-xs text-text-muted">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-6">
          Are you sure you want to delete the schedule for <span className="font-semibold text-text-primary">{name}</span>?
        </p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Component ---
export default function ScheduledReports() {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(getInitialSchedules);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<ScheduledReport | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledReport | null>(null);
  const [sendingNow, setSendingNow] = useState<string | null>(null);
  const [sentNow, setSentNow] = useState<string | null>(null);

  const activeCount = schedules.filter(s => s.status === "active").length;
  const pausedCount = schedules.filter(s => s.status === "paused").length;

  const handleSave = (sr: ScheduledReport) => {
    setSchedules(prev => {
      const exists = prev.find(s => s.id === sr.id);
      if (exists) return prev.map(s => s.id === sr.id ? sr : s);
      return [...prev, sr];
    });
    setCreateModal(false);
    setEditModal(null);
  };

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    setDeleteTarget(null);
  };

  const handleToggle = (id: string) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, status: s.status === "active" ? "paused" : "active", nextRun: s.status === "active" ? "—" : s.nextRun };
    }));
  };

  const handleSendNow = (id: string) => {
    setSendingNow(id);
    setTimeout(() => {
      setSendingNow(null);
      setSentNow(id);
      setSchedules(prev => prev.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          lastSent: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
      }));
      setTimeout(() => setSentNow(null), 2500);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {activeCount} Active
            </span>
            {pausedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                <Pause className="h-3 w-3" />
                {pausedCount} Paused
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-all shadow-lg shadow-primary/25"
        >
          <Plus className="h-4 w-4" /> Create Schedule
        </button>
      </div>

      {/* Schedule Cards */}
      <div className="space-y-3">
        {schedules.map((sr, i) => {
          const isSending = sendingNow === sr.id;
          const justSent = sentNow === sr.id;

          return (
            <motion.div
              key={sr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "glass-card p-5 transition-all",
                sr.status === "paused" && "opacity-60"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  sr.status === "active" ? "bg-primary-light" : "bg-surface-hover"
                )}>
                  <Clock className={cn("h-5 w-5", sr.status === "active" ? "text-primary" : "text-text-muted")} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-text-primary">{sr.reportName}</p>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      sr.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    )}>
                      {sr.status === "active" ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{formatScheduleShort(sr)}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {sr.recipients.length} recipient{sr.recipients.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {formatLabels[sr.format]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateRangeLabels[sr.dateRange]}
                    </span>
                  </div>
                  {/* Recipients preview */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sr.recipients.map(email => (
                      <span key={email} className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-hover text-[10px] text-text-muted font-mono">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="text-right shrink-0 space-y-1.5">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Last Sent</p>
                    <p className="text-xs font-medium text-text-secondary">{sr.lastSent || "Never"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Next Run</p>
                    <p className="text-xs font-medium text-text-primary">{sr.nextRun}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Send Now */}
                  <button
                    onClick={() => handleSendNow(sr.id)}
                    disabled={isSending || justSent}
                    className={cn(
                      "p-2 rounded-lg transition-all text-xs",
                      justSent
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                    )}
                    title="Send Now"
                  >
                    {justSent ? <Check className="h-4 w-4" /> : isSending ? <span className="h-4 w-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin block" /> : <Send className="h-4 w-4" />}
                  </button>
                  {/* Preview */}
                  <button
                    className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                    title="Preview Report"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => setEditModal(sr)}
                    className="p-2 rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                    title="Edit Schedule"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(sr.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      sr.status === "active"
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-amber-400 hover:bg-amber-500/10"
                    )}
                    title={sr.status === "active" ? "Pause" : "Resume"}
                  >
                    {sr.status === "active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(sr)}
                    className="p-2 rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {schedules.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No scheduled reports yet.</p>
            <p className="text-xs text-text-muted mt-1">Create one to automatically send reports to your team.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {createModal && (
          <ScheduleModal
            schedule={null}
            onClose={() => setCreateModal(false)}
            onSave={handleSave}
          />
        )}
        {editModal && (
          <ScheduleModal
            schedule={editModal}
            onClose={() => setEditModal(null)}
            onSave={handleSave}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            name={deleteTarget.reportName}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => handleDelete(deleteTarget.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
