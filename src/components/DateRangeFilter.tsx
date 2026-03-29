"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const presets = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "This Month", days: -1 },
  { label: "Last Month", days: -2 },
  { label: "Last 90 Days", days: 90 },
  { label: "This Quarter", days: -3 },
  { label: "Year to Date", days: -4 },
  { label: "Last 12 Months", days: 365 },
  { label: "All Time", days: -99 },
];

function computeRange(preset: { label: string; days: number }): DateRange {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  if (preset.days === -99) {
    return { startDate: "2000-01-01", endDate: end, label: preset.label };
  }

  if (preset.days === 0) {
    return { startDate: end, endDate: end, label: preset.label };
  }

  if (preset.days > 0) {
    const start = new Date(now);
    start.setDate(start.getDate() - preset.days);
    return { startDate: start.toISOString().split("T")[0], endDate: end, label: preset.label };
  }

  if (preset.days === -1) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start.toISOString().split("T")[0], endDate: end, label: preset.label };
  }

  if (preset.days === -2) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: endOfLastMonth.toISOString().split("T")[0],
      label: preset.label,
    };
  }

  if (preset.days === -3) {
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    return { startDate: start.toISOString().split("T")[0], endDate: end, label: preset.label };
  }

  if (preset.days === -4) {
    const start = new Date(now.getFullYear(), 0, 1);
    return { startDate: start.toISOString().split("T")[0], endDate: end, label: preset.label };
  }

  return { startDate: end, endDate: end, label: preset.label };
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const defaultRange = computeRange(presets[3]); // Last 30 Days

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void;
  defaultPreset?: string;
}

export default function DateRangeFilter({ onChange, defaultPreset }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DateRange>(() => {
    if (defaultPreset) {
      const p = presets.find((pr) => pr.label === defaultPreset);
      if (p) return computeRange(p);
    }
    return defaultRange;
  });
  const [customStart, setCustomStart] = useState(selected.startDate);
  const [customEnd, setCustomEnd] = useState(selected.endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const handlePreset = useCallback(
    (preset: (typeof presets)[number]) => {
      const range = computeRange(preset);
      setSelected(range);
      setCustomStart(range.startDate);
      setCustomEnd(range.endDate);
      onChange(range);
      setOpen(false);
    },
    [onChange]
  );

  const handleCustomApply = useCallback(() => {
    if (customStart && customEnd) {
      const range: DateRange = {
        startDate: customStart,
        endDate: customEnd,
        label: `${formatDisplayDate(customStart)} – ${formatDisplayDate(customEnd)}`,
      };
      setSelected(range);
      onChange(range);
      setOpen(false);
    }
  }, [customStart, customEnd, onChange]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button — shows date range */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
          open
            ? "bg-primary/10 border-primary/50 text-primary"
            : "bg-surface border-border hover:bg-surface-hover hover:border-border-light text-text-primary"
        )}
      >
        <Calendar className="h-4 w-4 text-text-muted" />
        {selected.label === "Custom" || selected.label.includes("–") ? (
          <span className="flex items-center gap-1.5">
            <span className="text-text-primary">{formatDisplayDate(selected.startDate)}</span>
            <ArrowRight className="h-3 w-3 text-text-muted" />
            <span className="text-text-primary">{formatDisplayDate(selected.endDate)}</span>
          </span>
        ) : (
          <span>{selected.label}</span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden" style={{ width: 420 }}>
          <div className="flex">
            {/* Presets Panel */}
            <div className="w-[160px] border-r border-border bg-surface-hover/30 p-2 space-y-0.5">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 py-1.5">Quick Select</p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors",
                    selected.label === preset.label
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Panel */}
            <div className="flex-1 p-4 space-y-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Custom Date Range</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1.5 block">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Preview of selected range */}
              {customStart && customEnd && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">
                    {formatDisplayDate(customStart)} → {formatDisplayDate(customEnd)}
                  </span>
                </div>
              )}

              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className={cn(
                  "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
                  customStart && customEnd
                    ? "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20"
                    : "bg-surface-hover text-text-muted cursor-not-allowed"
                )}
              >
                Apply Date Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Utility: check if a date string falls within a DateRange */
export function isInRange(dateStr: string, range: DateRange): boolean {
  if (!dateStr) return false;
  const d = dateStr.split("T")[0];
  return d >= range.startDate && d <= range.endDate;
}

/** Utility: parse "Oct 2025" style month strings into a Date for range comparison */
export function parseMonthLabel(monthStr: string): Date | null {
  const parts = monthStr.split(" ");
  if (parts.length !== 2) return null;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const monthIdx = months[parts[0]];
  if (monthIdx === undefined) return null;
  const year = parseInt(parts[1], 10);
  if (isNaN(year)) return null;
  return new Date(year, monthIdx, 1);
}

/** Utility: check if a month label falls within a DateRange */
export function isMonthInRange(monthStr: string, range: DateRange): boolean {
  const date = parseMonthLabel(monthStr);
  if (!date) return false;
  const monthStart = date.toISOString().split("T")[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const monthEnd = lastDay.toISOString().split("T")[0];
  return monthEnd >= range.startDate && monthStart <= range.endDate;
}
