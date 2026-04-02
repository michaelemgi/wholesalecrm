"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  LayoutGrid, List, CalendarRange, GripVertical,
  Globe, Mail, Megaphone, Users, Monitor, Building2,
  Calendar, DollarSign, Clock, ChevronDown, ChevronUp, Search,
  ArrowUpDown, Plus, X, Loader2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { PipelineDeal } from "@/types";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";

const STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

const stageColors: Record<string, string> = {
  "New Lead": "bg-blue-500",
  Contacted: "bg-indigo-500",
  Qualified: "bg-purple-500",
  "Proposal Sent": "bg-amber-500",
  Negotiation: "bg-cyan-500",
  Won: "bg-emerald-500",
  Lost: "bg-red-500",
};

const stageBgColors: Record<string, string> = {
  "New Lead": "bg-blue-500/10",
  Contacted: "bg-indigo-500/10",
  Qualified: "bg-purple-500/10",
  "Proposal Sent": "bg-amber-500/10",
  Negotiation: "bg-cyan-500/10",
  Won: "bg-emerald-500/10",
  Lost: "bg-red-500/10",
};

const sourceIcons: Record<string, typeof Globe> = {
  "AI Scraper": Globe,
  "Cold Email": Mail,
  "Meta Ads": Megaphone,
  Referral: Users,
  Website: Monitor,
  "Trade Show": Building2,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Sortable deal card
function SortableDealCard({
  deal,
  isDragging,
}: {
  deal: PipelineDeal;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard deal={deal} listeners={listeners} isDragging={isDragging} />
    </div>
  );
}

function DealCard({
  deal,
  listeners,
  isDragging,
}: {
  deal: PipelineDeal;
  listeners?: Record<string, Function>;
  isDragging?: boolean;
}) {
  const SourceIcon = sourceIcons[deal.leadSource] || Globe;

  return (
    <div
      className={cn(
        "glass-card p-3.5 cursor-grab active:cursor-grabbing group transition-all",
        isDragging && "shadow-2xl shadow-primary/20 ring-1 ring-primary/40",
        !isDragging && "hover:border-border-light"
      )}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate">
            {deal.companyName}
          </p>
          <p className="text-xs text-text-muted truncate">{deal.contactName}</p>
        </div>
        <GripVertical className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
      </div>

      <p className="text-lg font-bold font-heading text-text-primary mb-2">
        {formatCurrency(deal.value)}
      </p>

      <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{deal.daysInStage}d in stage</span>
        </div>
        <div className="flex items-center gap-1">
          <SourceIcon className="h-3 w-3" />
          <span className="truncate">{deal.leadSource}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary"
          title={deal.assignedRep}
        >
          {getInitials(deal.assignedRep)}
        </div>
        {deal.nextActionDate && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(deal.nextActionDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const STAGE_PROBABILITY: Record<string, number> = {
  "New Lead": 10,
  Contacted: 25,
  Qualified: 50,
  "Proposal Sent": 65,
  Negotiation: 80,
  Won: 100,
  Lost: 0,
};

const SOURCES = [
  "AI Scraper",
  "Cold Email",
  "Meta Ads",
  "Referral",
  "Website",
  "Trade Show",
];

function CreateDealModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<string>("New Lead");
  const [probability, setProbability] = useState(10);
  const [expectedClose, setExpectedClose] = useState("");
  const [assignedRep, setAssignedRep] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("AI Scraper");
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCustomers(data); })
      .catch(() => {});
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTeamMembers(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setProbability(STAGE_PROBABILITY[stage] ?? 10);
  }, [stage]);

  function handleCustomerChange(id: string) {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCompanyName(cust.name || cust.companyName || "");
      const primary = cust.primaryContact || cust.contacts?.[0];
      setContactName(primary?.name || "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        customerId: customerId || undefined,
        value: parseFloat(value) || 0,
        stage,
        winProbability: probability,
        nextActionDate: expectedClose || new Date().toISOString().split("T")[0],
        assignedRep: assignedRep || "Unassigned",
        leadSource: source,
        notes: notes.trim() || undefined,
        daysInStage: 0,
      };
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Deal created successfully");
        onCreated();
        onClose();
      } else {
        toast.error("Failed to create deal");
      }
    } catch {
      toast.error("Failed to create deal");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary";
  const labelClass = "block text-xs font-medium text-text-secondary mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card p-6 m-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-heading text-text-primary">
            Add New Deal
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer */}
          <div>
            <label className={labelClass}>Customer</label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Deal / Company Name */}
          <div>
            <label className={labelClass}>Deal Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company or deal name"
              className={inputClass}
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className={labelClass}>Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Primary contact"
              className={inputClass}
            />
          </div>

          {/* Value + Stage row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Deal Value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className={cn(inputClass, "pl-7")}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className={inputClass}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Probability + Expected Close row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Probability %</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Expected Close</label>
              <input
                type="date"
                value={expectedClose}
                onChange={(e) => setExpectedClose(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Assigned Rep + Source row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Assigned Rep</label>
              <select
                value={assignedRep}
                onChange={(e) => setAssignedRep(e.target.value)}
                className={inputClass}
              >
                <option value="">Select rep...</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={inputClass}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !companyName.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KanbanColumn({
  stage,
  deals,
}: {
  stage: string;
  deals: PipelineDeal[];
}) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn("h-2.5 w-2.5 rounded-full", stageColors[stage])} />
        <h3 className="text-sm font-semibold text-text-primary">{stage}</h3>
        <span className="ml-auto text-xs font-medium text-text-muted bg-surface-hover rounded-full px-2 py-0.5">
          {deals.length}
        </span>
      </div>
      <div className="text-xs text-text-muted mb-3 px-1">
        {formatCurrency(totalValue)}
      </div>

      <SortableContext
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            "flex-1 space-y-2.5 p-2 rounded-xl min-h-[200px]",
            stageBgColors[stage]
          )}
        >
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center h-24 text-xs text-text-muted border border-dashed border-border rounded-lg">
              Drop deals here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

type ViewMode = "kanban" | "list" | "timeline";

export default function PipelinePage() {
  const { data: initialDeals = [], mutate, isLoading } = useSWR<PipelineDeal[]>("/api/pipeline", fetcher);

  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync SWR data to local state (for drag-and-drop)
  if (initialDeals.length > 0 && !initialized) {
    setDeals(initialDeals);
    setInitialized(true);
  }
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (dateRange.startDate && dateRange.endDate) {
      result = result.filter((d) => isInRange(d.createdAt, dateRange));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.companyName.toLowerCase().includes(q) ||
          d.contactName.toLowerCase().includes(q) ||
          d.assignedRep.toLowerCase().includes(q)
      );
    }
    return result;
  }, [deals, searchQuery, dateRange]);

  const sortedDeals = useMemo(() => {
    const arr = [...filteredDeals];
    arr.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "companyName": aVal = a.companyName?.toLowerCase(); bVal = b.companyName?.toLowerCase(); break;
        case "value": aVal = a.value; bVal = b.value; break;
        case "stage": aVal = a.stage; bVal = b.stage; break;
        case "winProbability": aVal = a.winProbability; bVal = b.winProbability; break;
        case "nextActionDate": aVal = a.nextActionDate; bVal = b.nextActionDate; break;
        default: aVal = a.value; bVal = b.value;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredDeals, sortField, sortDir]);

  function SortHeader({ label, field }: { label: string; field: string }) {
    const active = sortField === field;
    return (
      <th
        className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider"
      >
        <div
          className="flex items-center gap-1 cursor-pointer hover:text-text-secondary"
          onClick={() => {
            if (active) {
              setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            } else {
              setSortField(field);
              setSortDir(field === "companyName" || field === "stage" || field === "nextActionDate" ? "asc" : "desc");
            }
          }}
        >
          {label}
          {active ? (
            sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </div>
      </th>
    );
  }

  const dealsByStage = useMemo(() => {
    const map: Record<string, PipelineDeal[]> = {};
    STAGES.forEach((s) => (map[s] = []));
    filteredDeals.forEach((d) => {
      if (map[d.stage]) map[d.stage].push(d);
    });
    return map;
  }, [filteredDeals]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const totalPipelineValue = useMemo(
    () =>
      deals
        .filter((d) => d.stage !== "Won" && d.stage !== "Lost")
        .reduce((s, d) => s + d.value, 0),
    [deals]
  );

  const weightedPipelineValue = useMemo(
    () =>
      deals
        .filter((d) => d.stage !== "Won" && d.stage !== "Lost")
        .reduce((s, d) => s + d.value * (d.winProbability / 100), 0),
    [deals]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItem = deals.find((d) => d.id === active.id);
    const overItem = deals.find((d) => d.id === over.id);
    if (!activeItem) return;

    if (overItem && activeItem.stage !== overItem.stage) {
      setDeals((prev) =>
        prev.map((d) =>
          d.id === active.id
            ? { ...d, stage: overItem.stage, daysInStage: 0 }
            : d
        )
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeItem = deals.find((d) => d.id === active.id);
    const overItem = deals.find((d) => d.id === over.id);
    if (!activeItem || !overItem) return;

    if (activeItem.stage === overItem.stage && active.id !== over.id) {
      const stageDeals = deals.filter((d) => d.stage === activeItem.stage);
      const oldIndex = stageDeals.findIndex((d) => d.id === active.id);
      const newIndex = stageDeals.findIndex((d) => d.id === over.id);
      const reordered = arrayMove(stageDeals, oldIndex, newIndex);

      setDeals((prev) => {
        const otherDeals = prev.filter((d) => d.stage !== activeItem.stage);
        return [...otherDeals, ...reordered];
      });
    }
  }

  const viewButtons = [
    { key: "kanban" as ViewMode, label: "Kanban", icon: LayoutGrid },
    { key: "list" as ViewMode, label: "List", icon: List },
    { key: "timeline" as ViewMode, label: "Timeline", icon: CalendarRange },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-96 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Sales Pipeline
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track and manage deals through every stage
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Deal */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </button>

          {/* Date Range Filter */}
          <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Sort Dropdown (List view only) */}
          {viewMode === "list" && (
            <select
              value={`${sortField}-${sortDir}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split("-");
                setSortField(f);
                setSortDir(d as "asc" | "desc");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
            >
              <option value="value-desc">Value High–Low</option>
              <option value="value-asc">Value Low–High</option>
              <option value="companyName-asc">Company A–Z</option>
              <option value="stage-asc">Stage</option>
              <option value="winProbability-desc">Probability High–Low</option>
              <option value="nextActionDate-asc">Closing Soon</option>
            </select>
          )}

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-surface overflow-hidden">
            {viewButtons.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                    viewMode === v.key
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 overflow-x-auto pb-4"
          >
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={dealsByStage[stage]}
              />
            ))}
          </motion.div>

          <DragOverlay>
            {activeDeal ? (
              <div className="w-[280px]">
                <DealCard deal={activeDeal} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <SortHeader label="Company" field="companyName" />
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Contact</th>
                  <SortHeader label="Value" field="value" />
                  <SortHeader label="Stage" field="stage" />
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Days in Stage</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Rep</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Source</th>
                  <SortHeader label="Win %" field="winProbability" />
                  <SortHeader label="Next Action" field="nextActionDate" />
                </tr>
              </thead>
              <tbody>
                {sortedDeals.map((deal, i) => (
                  <motion.tr
                    key={deal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {deal.companyName}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {deal.contactName}
                    </td>
                    <td className="py-3 px-4 font-bold text-text-primary">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          stageBgColors[deal.stage],
                          "text-text-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            stageColors[deal.stage]
                          )}
                        />
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted">
                      {deal.daysInStage}d
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                          {getInitials(deal.assignedRep)}
                        </div>
                        <span className="text-text-secondary text-xs">
                          {deal.assignedRep}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {deal.leadSource}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-hover rounded-full overflow-hidden max-w-[60px]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              deal.winProbability >= 70
                                ? "bg-emerald-500"
                                : deal.winProbability >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                            )}
                            style={{ width: `${deal.winProbability}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted">
                          {deal.winProbability}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {deal.nextActionDate
                        ? formatDate(deal.nextActionDate)
                        : "-"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="space-y-4">
            {filteredDeals
              .filter((d) => d.stage !== "Won" && d.stage !== "Lost")
              .sort(
                (a, b) =>
                  new Date(a.nextActionDate).getTime() -
                  new Date(b.nextActionDate).getTime()
              )
              .map((deal, i) => (
                <div key={deal.id} className="flex items-center gap-4">
                  <div className="w-28 text-xs text-text-muted text-right shrink-0">
                    {deal.nextActionDate
                      ? formatDate(deal.nextActionDate)
                      : "No date"}
                  </div>
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full ring-4 ring-background",
                        stageColors[deal.stage]
                      )}
                    />
                    {i <
                      filteredDeals.filter(
                        (d) => d.stage !== "Won" && d.stage !== "Lost"
                      ).length -
                        1 && (
                      <div className="w-0.5 h-12 bg-border absolute top-3" />
                    )}
                  </div>
                  <div className="flex-1 glass-card p-3 hover:border-border-light transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {deal.companyName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {deal.contactName} &middot; {deal.stage}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-text-primary">
                        {formatCurrency(deal.value)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Pipeline Totals Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="shrink-0">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 whitespace-nowrap">
                Total Pipeline Value
              </p>
              <p className="text-xl font-bold font-heading text-text-primary">
                {formatCurrency(totalPipelineValue)}
              </p>
            </div>
            <div className="h-10 w-px bg-border shrink-0" />
            <div className="shrink-0">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 whitespace-nowrap">
                Weighted Pipeline Value
              </p>
              <p className="text-xl font-bold font-heading text-success">
                {formatCurrency(Math.round(weightedPipelineValue))}
              </p>
            </div>
            <div className="h-10 w-px bg-border shrink-0" />
            <div className="shrink-0">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 whitespace-nowrap">
                Active Deals
              </p>
              <p className="text-xl font-bold font-heading text-text-primary">
                {
                  deals.filter(
                    (d) => d.stage !== "Won" && d.stage !== "Lost"
                  ).length
                }
              </p>
            </div>
            <div className="h-10 w-px bg-border shrink-0" />
            <div className="shrink-0">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 whitespace-nowrap">
                Won This Month
              </p>
              <p className="text-xl font-bold font-heading text-success">
                {formatCurrency(
                  deals
                    .filter((d) => d.stage === "Won")
                    .reduce((s, d) => s + d.value, 0)
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {STAGES.filter((s) => s !== "Won" && s !== "Lost").map((stage) => {
              const stageDeals = dealsByStage[stage];
              const pct =
                totalPipelineValue > 0
                  ? (stageDeals.reduce((s, d) => s + d.value, 0) /
                      totalPipelineValue) *
                    100
                  : 0;
              return (
                <div key={stage} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      stageColors[stage]
                    )}
                    style={{ width: `${Math.max(pct * 0.8, 8)}px` }}
                  />
                  <span className="text-[9px] text-text-muted">
                    {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Create Deal Modal */}
      {showCreateModal && (
        <CreateDealModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            mutate();
            setInitialized(false);
          }}
        />
      )}
    </div>
  );
}
