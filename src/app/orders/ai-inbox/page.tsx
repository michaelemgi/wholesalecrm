// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, MessageCircle, Phone, MessageSquare,
  CheckCircle2, AlertCircle, XCircle, Clock,
  ChevronRight, X, Sparkles, TrendingUp,
  Brain, Eye, Send, Edit3, RotateCcw,
  User, Calendar, Package, Hash,
  ArrowRight, Zap, Activity,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = "email" | "whatsapp" | "sms" | "voicemail";
type MatchConfidence = "exact" | "fuzzy" | "unknown";
type OrderStatus = "pending" | "confirmed" | "rejected";

interface ParsedLineItem {
  product: string;
  matchedProduct: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  confidence: MatchConfidence;
  alternatives?: string[];
}

interface CustomerProfile {
  name: string;
  accountNumber: string;
  lastOrderDate: string;
  usualDeliveryDay: string;
  usualItems: string[];
  totalOrders: number;
  avgOrderValue: number;
}

interface InboxMessage {
  id: string;
  channel: Channel;
  customer: CustomerProfile;
  customerMatchConfidence: number;
  originalMessage: string;
  parsedItems: ParsedLineItem[];
  status: OrderStatus;
  timestamp: string;
  deliveryDate?: string;
  aiNotes?: string;
  parsingConfidence: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_MESSAGES: InboxMessage[] = [
  {
    id: "msg-001",
    channel: "whatsapp",
    customer: {
      name: "Paddy's Deli & Cafe",
      accountNumber: "ACC-1042",
      lastOrderDate: "2026-03-31",
      usualDeliveryDay: "Wednesday",
      usualItems: ["Kerrygold Butter 227g", "Brennans Bread White", "Barry's Tea 80s"],
      totalOrders: 87,
      avgOrderValue: 342,
    },
    customerMatchConfidence: 98,
    originalMessage: "hey need 5 cases of the kerrygold and 2 pallets flour for wed delivery cheers",
    parsedItems: [
      { product: "kerrygold", matchedProduct: "Kerrygold Butter 227g (Case/24)", qty: 5, unit: "case", unitPrice: 48.50, total: 242.50, confidence: "exact" },
      { product: "flour", matchedProduct: "Odlums Cream Flour 2kg (Pallet/120)", qty: 2, unit: "pallet", unitPrice: 285.00, total: 570.00, confidence: "fuzzy", alternatives: ["Odlums Self-Raising Flour 2kg", "Odlums Wholemeal Flour 2kg"] },
    ],
    status: "pending",
    timestamp: "2026-04-04T08:14:00Z",
    deliveryDate: "2026-04-08",
    aiNotes: "Customer usually orders Kerrygold on Wednesdays. Flour type not specified - matched to their most-ordered flour (Cream Flour). Delivery day aligns with usual schedule.",
    parsingConfidence: 91,
  },
  {
    id: "msg-002",
    channel: "email",
    customer: {
      name: "O'Sullivan's Food Hall",
      accountNumber: "ACC-2187",
      lastOrderDate: "2026-04-01",
      usualDeliveryDay: "Tuesday",
      usualItems: ["Ballymaloe Relish 310g", "Flahavan's Porridge 1.5kg", "Avonmore Milk 2L"],
      totalOrders: 134,
      avgOrderValue: 587,
    },
    customerMatchConfidence: 100,
    originalMessage: "Hi there,\n\nHope you're well. Could we please place the following order for delivery Tuesday 8th April?\n\n- 10 x Ballymaloe Original Relish 310g\n- 8 x Flahavan's Progress Oats 1.5kg\n- 24 x Avonmore Fresh Milk 2L\n- 6 x Barry's Tea Gold Blend 80 bags\n\nSame account as usual. Thanks a million,\nSiobhan",
    parsedItems: [
      { product: "Ballymaloe Original Relish 310g", matchedProduct: "Ballymaloe Original Relish 310g", qty: 10, unit: "unit", unitPrice: 3.85, total: 38.50, confidence: "exact" },
      { product: "Flahavan's Progress Oats 1.5kg", matchedProduct: "Flahavan's Progress Oats 1.5kg", qty: 8, unit: "unit", unitPrice: 4.20, total: 33.60, confidence: "exact" },
      { product: "Avonmore Fresh Milk 2L", matchedProduct: "Avonmore Fresh Milk 2L", qty: 24, unit: "unit", unitPrice: 2.15, total: 51.60, confidence: "exact" },
      { product: "Barry's Tea Gold Blend 80 bags", matchedProduct: "Barry's Tea Gold Blend 80s", qty: 6, unit: "unit", unitPrice: 4.75, total: 28.50, confidence: "exact" },
    ],
    status: "confirmed",
    timestamp: "2026-04-04T07:22:00Z",
    deliveryDate: "2026-04-08",
    aiNotes: "Clean formal order from regular customer. All products exact match. Auto-confirmed: 100% parsing confidence, known customer, standard order pattern.",
    parsingConfidence: 99,
  },
  {
    id: "msg-003",
    channel: "sms",
    customer: {
      name: "The Hungry Monk",
      accountNumber: "ACC-0891",
      lastOrderDate: "2026-03-28",
      usualDeliveryDay: "Thursday",
      usualItems: ["Galtee Rashers 400g", "Clonakilty Black Pudding", "Brennans Bread White"],
      totalOrders: 52,
      avgOrderValue: 198,
    },
    customerMatchConfidence: 94,
    originalMessage: "Need galtee rashers x20 n clonakilty pudding x10 for thurs ta",
    parsedItems: [
      { product: "galtee rashers", matchedProduct: "Galtee Traditional Rashers 400g", qty: 20, unit: "unit", unitPrice: 4.30, total: 86.00, confidence: "exact" },
      { product: "clonakilty pudding", matchedProduct: "Clonakilty Black Pudding 280g", qty: 10, unit: "unit", unitPrice: 3.95, total: 39.50, confidence: "fuzzy", alternatives: ["Clonakilty White Pudding 280g", "Clonakilty Veggie Pudding 200g"] },
    ],
    status: "pending",
    timestamp: "2026-04-04T09:45:00Z",
    deliveryDate: "2026-04-09",
    aiNotes: "Customer usually orders black pudding (not white). 'pudding' matched to black pudding based on order history. Delivery Thursday aligns with usual schedule.",
    parsingConfidence: 88,
  },
  {
    id: "msg-004",
    channel: "voicemail",
    customer: {
      name: "Galway Bay Seafood Bar",
      accountNumber: "ACC-3301",
      lastOrderDate: "2026-04-02",
      usualDeliveryDay: "Monday",
      usualItems: ["Kerrygold Butter 227g", "Tayto Cheese & Onion", "Ballymaloe Relish 310g"],
      totalOrders: 41,
      avgOrderValue: 276,
    },
    customerMatchConfidence: 87,
    originalMessage: "[Transcribed from voicemail] Ah yeah hi this is Declan from Galway Bay... em we need about... let me think... twelve boxes of the Tayto cheese and onion... the big multi packs yeah... and then... em... maybe eight of the Kerrygold... the salted one... for Monday if ye can manage it. Sound, thanks.",
    parsedItems: [
      { product: "Tayto cheese and onion big multi packs", matchedProduct: "Tayto Cheese & Onion Multipack (Box/48)", qty: 12, unit: "box", unitPrice: 22.80, total: 273.60, confidence: "fuzzy", alternatives: ["Tayto Cheese & Onion 37g (Box/32)", "Tayto Variety Multipack (Box/40)"] },
      { product: "Kerrygold salted", matchedProduct: "Kerrygold Salted Butter 227g (Case/24)", qty: 8, unit: "case", unitPrice: 48.50, total: 388.00, confidence: "exact" },
    ],
    status: "pending",
    timestamp: "2026-04-04T08:55:00Z",
    deliveryDate: "2026-04-07",
    aiNotes: "Voicemail transcription. 'Big multi packs' likely refers to 48-count box based on previous orders. Customer specified 'salted' Kerrygold - exact match. Confidence slightly lower due to voicemail ambiguity on pack size.",
    parsingConfidence: 82,
  },
  {
    id: "msg-005",
    channel: "whatsapp",
    customer: {
      name: "Molly's Morning Kitchen",
      accountNumber: "ACC-1567",
      lastOrderDate: "2026-04-03",
      usualDeliveryDay: "Wednesday",
      usualItems: ["Flahavan's Progress Oats 1.5kg", "Avonmore Milk 2L", "Brennans Bread Wholemeal"],
      totalOrders: 63,
      avgOrderValue: 155,
    },
    customerMatchConfidence: 96,
    originalMessage: "Hiya! Can u add to our usual order: extra 6 flahavans porridge and 12 avonmore milks. Also want to try 4 of those new granola bars if ye have them? Wed delivery pls x",
    parsedItems: [
      { product: "flahavans porridge", matchedProduct: "Flahavan's Progress Oats 1.5kg", qty: 6, unit: "unit", unitPrice: 4.20, total: 25.20, confidence: "exact" },
      { product: "avonmore milks", matchedProduct: "Avonmore Fresh Milk 2L", qty: 12, unit: "unit", unitPrice: 2.15, total: 25.80, confidence: "exact" },
      { product: "new granola bars", matchedProduct: "Unknown Product", qty: 4, unit: "unit", unitPrice: 0.00, total: 0.00, confidence: "unknown" },
    ],
    status: "pending",
    timestamp: "2026-04-04T10:02:00Z",
    deliveryDate: "2026-04-08",
    aiNotes: "Regular items matched perfectly. 'New granola bars' has no match in catalogue - flagged for manual review. Customer mentions 'usual order' - standing order SO-1567 should be included. Wednesday delivery confirmed.",
    parsingConfidence: 76,
  },
  {
    id: "msg-006",
    channel: "email",
    customer: {
      name: "Dublin Docklands Deli",
      accountNumber: "ACC-0445",
      lastOrderDate: "2026-03-29",
      usualDeliveryDay: "Friday",
      usualItems: ["Brennans Bread White", "Galtee Rashers 400g", "Kerrygold Butter 227g"],
      totalOrders: 28,
      avgOrderValue: 423,
    },
    customerMatchConfidence: 100,
    originalMessage: "ORDER REQUEST - Dublin Docklands Deli (ACC-0445)\n\nPlease process the following for Friday 10th April:\n\nBrennan's White Bread Sliced 800g x 30\nBrennan's Wholemeal Bread 800g x 15\nGaltee Traditional Rashers 400g x 25\nGaltee Sausages 454g x 20\nKerrygold Unsalted Butter 227g x 10 cases\nAvonmore Cream 250ml x 40\n\nDelivery to usual address. PO #DD-2026-0089\n\nRegards,\nMark Fitzgerald\nPurchasing Manager",
    parsedItems: [
      { product: "Brennan's White Bread Sliced 800g", matchedProduct: "Brennans White Bread Sliced 800g", qty: 30, unit: "unit", unitPrice: 2.45, total: 73.50, confidence: "exact" },
      { product: "Brennan's Wholemeal Bread 800g", matchedProduct: "Brennans Wholemeal Bread 800g", qty: 15, unit: "unit", unitPrice: 2.65, total: 39.75, confidence: "exact" },
      { product: "Galtee Traditional Rashers 400g", matchedProduct: "Galtee Traditional Rashers 400g", qty: 25, unit: "unit", unitPrice: 4.30, total: 107.50, confidence: "exact" },
      { product: "Galtee Sausages 454g", matchedProduct: "Galtee Premium Sausages 454g", qty: 20, unit: "unit", unitPrice: 3.80, total: 76.00, confidence: "exact" },
      { product: "Kerrygold Unsalted Butter 227g", matchedProduct: "Kerrygold Unsalted Butter 227g (Case/24)", qty: 10, unit: "case", unitPrice: 48.50, total: 485.00, confidence: "exact" },
      { product: "Avonmore Cream 250ml", matchedProduct: "Avonmore Fresh Cream 250ml", qty: 40, unit: "unit", unitPrice: 1.85, total: 74.00, confidence: "exact" },
    ],
    status: "confirmed",
    timestamp: "2026-04-04T06:50:00Z",
    deliveryDate: "2026-04-10",
    aiNotes: "Formal structured order with PO number. All products exact match. Auto-confirmed: high confidence, known customer, PO reference included. Total: EUR 855.75.",
    parsingConfidence: 99,
  },
  {
    id: "msg-007",
    channel: "sms",
    customer: {
      name: "Clancy's Corner Shop",
      accountNumber: "ACC-0762",
      lastOrderDate: "2026-03-25",
      usualDeliveryDay: "Tuesday",
      usualItems: ["Tayto Cheese & Onion", "Barry's Tea 80s", "Brennans Bread White"],
      totalOrders: 19,
      avgOrderValue: 127,
    },
    customerMatchConfidence: 91,
    originalMessage: "tayto c&o x8 barrys x6 brennans x10",
    parsedItems: [
      { product: "tayto c&o", matchedProduct: "Tayto Cheese & Onion 37g (Box/32)", qty: 8, unit: "box", unitPrice: 16.50, total: 132.00, confidence: "fuzzy", alternatives: ["Tayto Cheese & Onion Multipack (Box/48)"] },
      { product: "barrys", matchedProduct: "Barry's Tea Gold Blend 80s", qty: 6, unit: "unit", unitPrice: 4.75, total: 28.50, confidence: "exact" },
      { product: "brennans", matchedProduct: "Brennans White Bread Sliced 800g", qty: 10, unit: "unit", unitPrice: 2.45, total: 24.50, confidence: "fuzzy", alternatives: ["Brennans Wholemeal Bread 800g"] },
    ],
    status: "pending",
    timestamp: "2026-04-04T11:18:00Z",
    aiNotes: "Very abbreviated SMS. 'c&o' matched to Cheese & Onion. 'brennans' defaulted to White based on order history (customer orders white 90% of the time). No delivery date specified - defaulting to usual Tuesday.",
    parsingConfidence: 84,
  },
  {
    id: "msg-008",
    channel: "whatsapp",
    customer: {
      name: "Nua Health Foods",
      accountNumber: "ACC-2890",
      lastOrderDate: "2026-04-02",
      usualDeliveryDay: "Thursday",
      usualItems: ["Flahavan's Progress Oats 1.5kg", "Avonmore Milk 2L", "Ballymaloe Relish 310g"],
      totalOrders: 35,
      avgOrderValue: 310,
    },
    customerMatchConfidence: 95,
    originalMessage: "Hi there! Big order incoming lol\n\n15x flahavans oats\n20x avonmore milk (the 2 litre)\n8x ballymaloe relish\n6x kerrygold salted\n10x barrys tea gold\n4x clonakilty black pud\n\nThursday delivery as always! Thanks a mil!",
    parsedItems: [
      { product: "flahavans oats", matchedProduct: "Flahavan's Progress Oats 1.5kg", qty: 15, unit: "unit", unitPrice: 4.20, total: 63.00, confidence: "exact" },
      { product: "avonmore milk (the 2 litre)", matchedProduct: "Avonmore Fresh Milk 2L", qty: 20, unit: "unit", unitPrice: 2.15, total: 43.00, confidence: "exact" },
      { product: "ballymaloe relish", matchedProduct: "Ballymaloe Original Relish 310g", qty: 8, unit: "unit", unitPrice: 3.85, total: 30.80, confidence: "exact" },
      { product: "kerrygold salted", matchedProduct: "Kerrygold Salted Butter 227g (Case/24)", qty: 6, unit: "case", unitPrice: 48.50, total: 291.00, confidence: "exact" },
      { product: "barrys tea gold", matchedProduct: "Barry's Tea Gold Blend 80s", qty: 10, unit: "unit", unitPrice: 4.75, total: 47.50, confidence: "exact" },
      { product: "clonakilty black pud", matchedProduct: "Clonakilty Black Pudding 280g", qty: 4, unit: "unit", unitPrice: 3.95, total: 15.80, confidence: "exact" },
    ],
    status: "confirmed",
    timestamp: "2026-04-04T09:30:00Z",
    deliveryDate: "2026-04-09",
    aiNotes: "Informal WhatsApp but all items clearly specified. Customer explicitly noted '2 litre' and 'black pud' - no ambiguity. Regular Thursday delivery. Auto-confirmed at 97% confidence.",
    parsingConfidence: 97,
  },
  {
    id: "msg-009",
    channel: "voicemail",
    customer: {
      name: "The Blarney Stone Pub",
      accountNumber: "ACC-1123",
      lastOrderDate: "2026-03-30",
      usualDeliveryDay: "Wednesday",
      usualItems: ["Tayto Cheese & Onion", "Tayto Salt & Vinegar", "Brennans Bread White"],
      totalOrders: 44,
      avgOrderValue: 189,
    },
    customerMatchConfidence: 82,
    originalMessage: "[Transcribed from voicemail] Howya... it's Sean from the Blarney Stone... listen we're running low on everything... can ye send the usual order but double the Tayto... both flavours... and throw in some of them... em... what are they called... the Ballymaloe things... the relish yeah... maybe six of them. Right so... Wednesday as usual. Cheers bye.",
    parsedItems: [
      { product: "Tayto (usual - doubled)", matchedProduct: "Tayto Cheese & Onion 37g (Box/32)", qty: 8, unit: "box", unitPrice: 16.50, total: 132.00, confidence: "fuzzy", alternatives: ["Tayto Cheese & Onion Multipack (Box/48)"] },
      { product: "Tayto (usual - doubled)", matchedProduct: "Tayto Salt & Vinegar 37g (Box/32)", qty: 8, unit: "box", unitPrice: 16.50, total: 132.00, confidence: "fuzzy" },
      { product: "Ballymaloe relish", matchedProduct: "Ballymaloe Original Relish 310g", qty: 6, unit: "unit", unitPrice: 3.85, total: 23.10, confidence: "exact" },
    ],
    status: "pending",
    timestamp: "2026-04-04T07:40:00Z",
    deliveryDate: "2026-04-08",
    aiNotes: "Voicemail transcription. 'The usual but double the Tayto' - referenced standing order SO-1123 (4 boxes each flavour) and doubled to 8. 'Both flavours' = Cheese & Onion + Salt & Vinegar from history. Lower confidence due to voicemail ambiguity on 'usual order' reference.",
    parsingConfidence: 74,
  },
  {
    id: "msg-010",
    channel: "email",
    customer: {
      name: "Kerry's Kitchen Supplies",
      accountNumber: "ACC-4010",
      lastOrderDate: "2026-04-03",
      usualDeliveryDay: "Monday",
      usualItems: ["Kerrygold Butter 227g", "Avonmore Milk 2L", "Galtee Rashers 400g"],
      totalOrders: 71,
      avgOrderValue: 645,
    },
    customerMatchConfidence: 100,
    originalMessage: "Good morning,\n\nRepeat of last week's order please, but swap the Galtee rashers for Denny's this time. Also add 5 cases of Avonmore cream.\n\nMonday delivery.\n\nCheers,\nAoife",
    parsedItems: [
      { product: "Kerrygold Butter 227g (repeat)", matchedProduct: "Kerrygold Salted Butter 227g (Case/24)", qty: 12, unit: "case", unitPrice: 48.50, total: 582.00, confidence: "exact" },
      { product: "Avonmore Milk 2L (repeat)", matchedProduct: "Avonmore Fresh Milk 2L", qty: 30, unit: "unit", unitPrice: 2.15, total: 64.50, confidence: "exact" },
      { product: "Denny's rashers (swap from Galtee)", matchedProduct: "Denny Gold Medal Rashers 400g", qty: 20, unit: "unit", unitPrice: 4.50, total: 90.00, confidence: "fuzzy", alternatives: ["Denny Traditional Rashers 350g", "Denny Hickory Rashers 300g"] },
      { product: "Avonmore cream", matchedProduct: "Avonmore Fresh Cream 250ml (Case/12)", qty: 5, unit: "case", unitPrice: 18.90, total: 94.50, confidence: "exact" },
    ],
    status: "pending",
    timestamp: "2026-04-04T06:15:00Z",
    deliveryDate: "2026-04-07",
    aiNotes: "Customer requested repeat of last order (ORD-4010-287) with modification: Galtee rashers swapped for Denny's. Qty carried over from last order. 'Denny's' without specifying type - matched to Gold Medal (their most common rasher brand). New item: cream in cases.",
    parsingConfidence: 85,
  },
];

const ACCURACY_TREND = [94.2, 95.1, 95.8, 96.0, 96.3, 96.5, 96.8];
const TREND_DAYS = ["Mar 29", "Mar 30", "Mar 31", "Apr 1", "Apr 2", "Apr 3", "Apr 4"];

const CORRECTIONS_LOG = [
  { original: "flahavans porridge", corrected: "Flahavan's Progress Oats 1.5kg", count: 3 },
  { original: "kerrygold", corrected: "Kerrygold Salted Butter 227g", count: 7 },
  { original: "brennans", corrected: "Brennans White Bread Sliced 800g", count: 5 },
];

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

const channelConfig: Record<Channel, { icon: typeof Mail; label: string; color: string; bg: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-400", bg: "bg-blue-500/20" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  sms: { icon: MessageSquare, label: "SMS", color: "text-amber-400", bg: "bg-amber-500/20" },
  voicemail: { icon: Phone, label: "Voicemail", color: "text-purple-400", bg: "bg-purple-500/20" },
};

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending Review", color: "text-amber-400", bg: "bg-amber-500/20", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },
};

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 95 ? "text-emerald-400 bg-emerald-500/20" : value >= 85 ? "text-blue-400 bg-blue-500/20" : value >= 70 ? "text-amber-400 bg-amber-500/20" : "text-red-400 bg-red-500/20";
  return (
    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", color)}>
      {value}% match
    </span>
  );
}

function MatchIcon({ confidence }: { confidence: MatchConfidence }) {
  if (confidence === "exact") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (confidence === "fuzzy") return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400" />;
}

function MiniSparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={h - ((v - min) / range) * h} r="2.5" fill={i === data.length - 1 ? "#3b82f6" : "#3b82f680"} />
      ))}
    </svg>
  );
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AIInboxPage() {
  const [activeChannel, setActiveChannel] = useState<Channel | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, OrderStatus>>(
    () => Object.fromEntries(MOCK_MESSAGES.map((m) => [m.id, m.status]))
  );

  const filtered = useMemo(() => {
    let msgs = MOCK_MESSAGES;
    if (activeChannel !== "all") msgs = msgs.filter((m) => m.channel === activeChannel);
    return msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activeChannel]);

  const selectedMsg = MOCK_MESSAGES.find((m) => m.id === selectedId) || null;

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_MESSAGES.length };
    MOCK_MESSAGES.forEach((m) => { counts[m.channel] = (counts[m.channel] || 0) + 1; });
    return counts;
  }, []);

  const pendingCount = Object.values(statuses).filter((s) => s === "pending").length;
  const confirmedCount = Object.values(statuses).filter((s) => s === "confirmed").length;

  function handleConfirm(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "confirmed" }));
  }
  function handleReject(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: "rejected" }));
  }

  const channels: { key: Channel | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "email", label: "Email" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "sms", label: "SMS" },
    { key: "voicemail", label: "Voicemail" },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-blue-400" />
            AI Inbox
          </h1>
          <p className="text-sm text-white/50 mt-1">Intelligent order parsing from every channel</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5" />
            Live Processing
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: pendingCount.toString(), icon: Clock, accent: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Auto-Confirmed", value: confirmedCount.toString(), sub: "today", icon: CheckCircle2, accent: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Accuracy Rate", value: "96.8%", icon: TrendingUp, accent: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Channels Active", value: "4/4", icon: Zap, accent: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("bg-[#0a0a14] rounded-xl border border-white/10 p-4 flex items-center gap-4")}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg, "border", stat.border)}>
              <stat.icon className={cn("w-5 h-5", stat.accent)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}{stat.sub ? ` (${stat.sub})` : ""}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Channel Tabs */}
      <div className="flex gap-1 bg-[#0a0a14] rounded-xl border border-white/10 p-1 w-fit">
        {channels.map((ch) => {
          const isActive = activeChannel === ch.key;
          const count = channelCounts[ch.key] || 0;
          const cfg = ch.key !== "all" ? channelConfig[ch.key as Channel] : null;
          return (
            <button
              key={ch.key}
              onClick={() => setActiveChannel(ch.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
              )}
            >
              {cfg && <cfg.icon className="w-3.5 h-3.5" />}
              {ch.label}
              <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full", isActive ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-white/40")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Message List */}
        <div className={cn("flex-1 space-y-3 transition-all", selectedMsg ? "max-w-[60%]" : "max-w-full")}>
          <AnimatePresence mode="popLayout">
            {filtered.map((msg, i) => {
              const ch = channelConfig[msg.channel];
              const st = statusConfig[statuses[msg.id] || msg.status];
              const StIcon = st.icon;
              const isSelected = selectedId === msg.id;
              const orderTotal = msg.parsedItems.reduce((sum, item) => sum + item.total, 0);

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedId(isSelected ? null : msg.id)}
                  className={cn(
                    "bg-[#0a0a14] rounded-xl border cursor-pointer transition-all group",
                    isSelected ? "border-blue-500/50 ring-1 ring-blue-500/20" : "border-white/10 hover:border-white/20"
                  )}
                >
                  {/* Message Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ch.bg)}>
                          <ch.icon className={cn("w-4.5 h-4.5", ch.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{msg.customer.name}</span>
                            <ConfidenceBadge value={msg.customerMatchConfidence} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[11px] px-1.5 py-0.5 rounded", ch.bg, ch.color)}>{ch.label}</span>
                            <span className="text-[11px] text-white/30">{timeAgo(msg.timestamp)}</span>
                            {msg.deliveryDate && (
                              <span className="text-[11px] text-white/30 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Del: {new Date(msg.deliveryDate).toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full", st.bg, st.color)}>
                          <StIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                        <ChevronRight className={cn("w-4 h-4 text-white/20 transition-transform", isSelected && "rotate-90")} />
                      </div>
                    </div>

                    {/* Original Message */}
                    <div className="bg-white/[0.03] rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-white/40 mb-1 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Original message
                      </p>
                      <p className="text-sm text-white/70 line-clamp-2 font-mono">{msg.originalMessage}</p>
                    </div>

                    {/* Parsed Items Table */}
                    <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                      <div className="grid grid-cols-[auto_1fr_60px_70px_80px_80px] gap-0 text-[11px] font-medium text-white/40 bg-white/[0.02] px-3 py-1.5">
                        <span className="w-5"></span>
                        <span>Product</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Unit</span>
                        <span className="text-right">Price</span>
                        <span className="text-right">Total</span>
                      </div>
                      {msg.parsedItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-[auto_1fr_60px_70px_80px_80px] gap-0 items-center text-xs px-3 py-2 border-t border-white/[0.04]">
                          <span className="w-5"><MatchIcon confidence={item.confidence} /></span>
                          <div>
                            <span className="text-white/90">{item.matchedProduct}</span>
                            {item.confidence === "unknown" && (
                              <span className="ml-1.5 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">No match</span>
                            )}
                            {item.confidence === "fuzzy" && item.alternatives && (
                              <span className="ml-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Fuzzy</span>
                            )}
                          </div>
                          <span className="text-right text-white/70 font-medium">{item.qty}</span>
                          <span className="text-right text-white/50">{item.unit}</span>
                          <span className="text-right text-white/50">{item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "---"}</span>
                          <span className="text-right text-white/90 font-medium">{item.total > 0 ? formatCurrency(item.total) : "---"}</span>
                        </div>
                      ))}
                      <div className="grid grid-cols-[auto_1fr_60px_70px_80px_80px] gap-0 items-center text-xs px-3 py-2 border-t border-white/[0.08] bg-white/[0.02]">
                        <span className="w-5"></span>
                        <span className="text-white/50 font-medium">Order Total</span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span className="text-right text-white font-bold">{formatCurrency(orderTotal)}</span>
                      </div>
                    </div>

                    {/* AI Note */}
                    {msg.aiNotes && (
                      <div className="flex items-start gap-2 mt-3 text-xs text-white/40">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{msg.aiNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {statuses[msg.id] === "pending" && (
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConfirm(msg.id); }}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                      >
                        <Send className="w-3 h-3" /> Confirm Order
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 text-white/60 border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(msg.id); }}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500/10 text-red-400/70 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                      <div className="flex-1" />
                      <span className="text-[11px] text-white/30 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> {msg.parsingConfidence}% parsing confidence
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Sidebar Detail Panel */}
        <AnimatePresence>
          {selectedMsg && (
            <motion.div
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "40%" }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="bg-[#0a0a14] rounded-xl border border-white/10 sticky top-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    AI Parse Details
                  </h3>
                  <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Full Original Message */}
                <div className="p-4 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">Full Original Message</p>
                  <div className="bg-white/[0.03] rounded-lg p-3">
                    <p className="text-sm text-white/70 font-mono whitespace-pre-wrap leading-relaxed">{selectedMsg.originalMessage}</p>
                  </div>
                </div>

                {/* Customer Profile */}
                <div className="p-4 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Customer Profile</p>
                  <div className="bg-white/[0.03] rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{selectedMsg.customer.name}</p>
                        <p className="text-[11px] text-white/40">{selectedMsg.customer.accountNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-white/[0.03] rounded p-2">
                        <p className="text-[10px] text-white/30 uppercase">Last Order</p>
                        <p className="text-xs text-white/70">{new Date(selectedMsg.customer.lastOrderDate).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded p-2">
                        <p className="text-[10px] text-white/30 uppercase">Usual Day</p>
                        <p className="text-xs text-white/70">{selectedMsg.customer.usualDeliveryDay}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded p-2">
                        <p className="text-[10px] text-white/30 uppercase">Total Orders</p>
                        <p className="text-xs text-white/70">{selectedMsg.customer.totalOrders}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded p-2">
                        <p className="text-[10px] text-white/30 uppercase">Avg Value</p>
                        <p className="text-xs text-white/70">{formatCurrency(selectedMsg.customer.avgOrderValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Confidence Breakdown */}
                <div className="p-4 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">AI Confidence Breakdown</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Customer Match", value: selectedMsg.customerMatchConfidence },
                      { label: "Product Parsing", value: selectedMsg.parsingConfidence },
                      { label: "Quantity Detection", value: Math.min(99, selectedMsg.parsingConfidence + 4) },
                      { label: "Delivery Intent", value: selectedMsg.deliveryDate ? 95 : 60 },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/60">{metric.label}</span>
                          <span className={cn("text-xs font-medium", metric.value >= 90 ? "text-emerald-400" : metric.value >= 75 ? "text-blue-400" : "text-amber-400")}>
                            {metric.value}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.value}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={cn("h-full rounded-full", metric.value >= 90 ? "bg-emerald-500" : metric.value >= 75 ? "bg-blue-500" : "bg-amber-500")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Matching Details */}
                <div className="p-4 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Product Matching</p>
                  <div className="space-y-2">
                    {selectedMsg.parsedItems.map((item, idx) => (
                      <div key={idx} className="bg-white/[0.03] rounded-lg p-2.5">
                        <div className="flex items-start gap-2">
                          <MatchIcon confidence={item.confidence} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-white/40 font-mono truncate">"{item.product}"</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <ArrowRight className="w-3 h-3 text-white/20" />
                              <p className="text-xs text-white/80 truncate">{item.matchedProduct}</p>
                            </div>
                            {item.alternatives && item.alternatives.length > 0 && (
                              <div className="mt-1.5 pl-4">
                                <p className="text-[10px] text-white/30 mb-0.5">Alternatives:</p>
                                {item.alternatives.map((alt, ai) => (
                                  <p key={ai} className="text-[11px] text-white/40">{alt}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Pattern */}
                <div className="p-4 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Order Patterns</p>
                  <div className="bg-white/[0.03] rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <RotateCcw className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">
                        Customer usually orders on <span className="text-white/90 font-medium">{selectedMsg.customer.usualDeliveryDay}s</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-white/60">
                        <span>Usual items: </span>
                        {selectedMsg.customer.usualItems.map((item, i) => (
                          <span key={i}>
                            <span className="text-white/80">{item}</span>
                            {i < selectedMsg.customer.usualItems.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Hash className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">
                        <span className="text-white/90 font-medium">{selectedMsg.customer.totalOrders}</span> orders placed, avg value <span className="text-white/90 font-medium">{formatCurrency(selectedMsg.customer.avgOrderValue)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Notes */}
                {selectedMsg.aiNotes && (
                  <div className="p-4 border-b border-white/[0.06]">
                    <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">AI Reasoning</p>
                    <div className="bg-blue-500/[0.06] border border-blue-500/10 rounded-lg p-3">
                      <p className="text-xs text-white/60 leading-relaxed">{selectedMsg.aiNotes}</p>
                    </div>
                  </div>
                )}

                {/* Action */}
                {statuses[selectedMsg.id] === "pending" && (
                  <div className="p-4 space-y-2">
                    <button
                      onClick={() => handleConfirm(selectedMsg.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                    >
                      <Send className="w-4 h-4" /> Confirm Order
                    </button>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 text-white/60 border border-white/10 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleReject(selectedMsg.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 text-red-400/70 border border-red-500/20 rounded-lg text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar - AI Learning */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0a0a14] rounded-xl border border-white/10 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">AI Learning</h3>
          <span className="text-[11px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">Auto-improving</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Accuracy Trend */}
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Accuracy Trend (7 days)</p>
            <div className="flex items-end gap-4">
              <MiniSparkline data={ACCURACY_TREND} />
              <div className="text-right">
                <p className="text-lg font-bold text-white">{ACCURACY_TREND[ACCURACY_TREND.length - 1]}%</p>
                <p className="text-[11px] text-emerald-400 flex items-center gap-0.5 justify-end">
                  <TrendingUp className="w-3 h-3" /> +2.6% this week
                </p>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              {TREND_DAYS.map((d, i) => (
                <span key={i} className="text-[9px] text-white/20">{d.split(" ")[1]}</span>
              ))}
            </div>
          </div>

          {/* Patterns Learned */}
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Patterns Learned Today</p>
            <div className="space-y-2">
              {[
                '"kerrygold" without type defaults to Salted for 78% of customers',
                '"brennans" alone means White Bread (vs Wholemeal) 89% of the time',
                'Voicemail "the usual" maps to last standing order with 92% accuracy',
              ].map((pattern, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/50 leading-relaxed">{pattern}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Corrections */}
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">Top Corrections (human feedback)</p>
            <div className="space-y-2">
              {CORRECTIONS_LOG.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="text-white/30 font-mono">"{c.original}"</span>
                  <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                  <span className="text-white/60 truncate">{c.corrected}</span>
                  <span className="text-white/20 shrink-0 ml-auto">{c.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
