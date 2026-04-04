"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, MapPin, Clock, CheckCircle2, AlertCircle, Phone,
  User, ChevronDown, ChevronRight, Package, RotateCcw,
  Camera, PenTool, Eye, GripVertical, Route, Zap,
  Star, Circle, ArrowRight, X, Plus, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Euro formatter (Irish locale) ──────────────────────────────────────────
function eur(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "routes" | "drivers" | "pod" | "returns" | "planner";

type StopStatus = "Delivered" | "In Progress" | "Pending";

interface Stop {
  stop: number;
  customer: string;
  address: string;
  timeWindow: string;
  status: StopStatus;
}

interface DriverRoute {
  driver: string;
  initials: string;
  vehicle: string;
  reg: string;
  route: string;
  totalStops: number;
  completed: number;
  eta: string;
  status: "On Route" | "Available" | "Off Duty";
  stops: Stop[];
}

interface Driver {
  name: string;
  initials: string;
  phone: string;
  vehicle: string;
  status: "On Route" | "Available" | "Off Duty";
  deliveriesToday: number;
  distanceKm: number;
  avgMinPerStop: number;
  weeklyRating: number;
}

interface PODRecord {
  orderId: string;
  customer: string;
  driver: string;
  time: string;
  signed: boolean;
  photo: boolean;
  notes: string;
}

interface DepositRow {
  customer: string;
  itemType: "Kegs" | "Crates" | "Pallets";
  qtyOut: number;
  qtyReturned: number;
  outstanding: number;
  value: number;
}

interface PlannerStop {
  id: number;
  customer: string;
  address: string;
  eta: string;
}

// ── Fake Data ──────────────────────────────────────────────────────────────
const tabs: { key: Tab; label: string }[] = [
  { key: "routes", label: "Today's Routes" },
  { key: "drivers", label: "Drivers" },
  { key: "pod", label: "Proof of Delivery" },
  { key: "returns", label: "Returns & Deposits" },
  { key: "planner", label: "Route Planner" },
];

const driverRoutes: DriverRoute[] = [
  {
    driver: "Padraig Murphy",
    initials: "PM",
    vehicle: "Van 03",
    reg: "221-D-12345",
    route: "Dublin South",
    totalStops: 12,
    completed: 7,
    eta: "11:24",
    status: "On Route",
    stops: [
      { stop: 1, customer: "O'Brien's Off-Licence", address: "14 Main St, Ranelagh, D6", timeWindow: "07:30 - 08:00", status: "Delivered" },
      { stop: 2, customer: "The Chophouse", address: "2 Shelbourne Rd, Ballsbridge, D4", timeWindow: "08:00 - 08:30", status: "Delivered" },
      { stop: 3, customer: "Spar Donnybrook", address: "47 Donnybrook Rd, D4", timeWindow: "08:30 - 09:00", status: "Delivered" },
      { stop: 4, customer: "McSorley's Bar", address: "28 Ranelagh Rd, D6", timeWindow: "09:00 - 09:30", status: "Delivered" },
      { stop: 5, customer: "Nolan's SuperValu", address: "Dundrum Town Centre, D14", timeWindow: "09:30 - 10:00", status: "Delivered" },
      { stop: 6, customer: "The Dropping Well", address: "Milltown Rd, Milltown, D6", timeWindow: "10:00 - 10:30", status: "Delivered" },
      { stop: 7, customer: "Tesco Nutgrove", address: "Nutgrove Ave, Rathfarnham, D14", timeWindow: "10:30 - 11:00", status: "Delivered" },
      { stop: 8, customer: "Fallon's Pub", address: "129 The Coombe, D8", timeWindow: "11:00 - 11:30", status: "In Progress" },
      { stop: 9, customer: "Fresh - The Good Food Market", address: "Smithfield Square, D7", timeWindow: "11:30 - 12:00", status: "Pending" },
      { stop: 10, customer: "The Bernard Shaw", address: "11-12 Richmond St S, D2", timeWindow: "12:00 - 12:30", status: "Pending" },
      { stop: 11, customer: "Centra Rathmines", address: "213 Rathmines Rd Lwr, D6", timeWindow: "12:30 - 13:00", status: "Pending" },
      { stop: 12, customer: "McGrattan's", address: "5 Chatham St, D2", timeWindow: "13:00 - 13:30", status: "Pending" },
    ],
  },
  {
    driver: "Ciara Doyle",
    initials: "CD",
    vehicle: "Van 01",
    reg: "231-D-67890",
    route: "Dublin North",
    totalStops: 10,
    completed: 10,
    eta: "Complete",
    status: "On Route",
    stops: [
      { stop: 1, customer: "Gibney's Malahide", address: "6 New St, Malahide", timeWindow: "07:00 - 07:30", status: "Delivered" },
      { stop: 2, customer: "SuperValu Swords", address: "Pavilions SC, Swords", timeWindow: "07:30 - 08:00", status: "Delivered" },
      { stop: 3, customer: "The Cock Tavern", address: "Swords Rd, Whitehall, D9", timeWindow: "08:00 - 08:30", status: "Delivered" },
      { stop: 4, customer: "Aldi Coolock", address: "Malahide Rd, Coolock, D5", timeWindow: "08:30 - 09:00", status: "Delivered" },
      { stop: 5, customer: "Beaumont House", address: "Beaumont Rd, D9", timeWindow: "09:00 - 09:30", status: "Delivered" },
      { stop: 6, customer: "McHugh's Drumcondra", address: "71 Drumcondra Rd, D9", timeWindow: "09:30 - 10:00", status: "Delivered" },
      { stop: 7, customer: "Lidl Glasnevin", address: "Prospect Rd, Glasnevin, D9", timeWindow: "10:00 - 10:30", status: "Delivered" },
      { stop: 8, customer: "The Big Tree", address: "Dorset St Lwr, D1", timeWindow: "10:30 - 11:00", status: "Delivered" },
      { stop: 9, customer: "Brickyard Gastropub", address: "Main St, Dundrum, D14", timeWindow: "11:00 - 11:30", status: "Delivered" },
      { stop: 10, customer: "Spar Phibsborough", address: "377 North Circular Rd, D7", timeWindow: "11:30 - 12:00", status: "Delivered" },
    ],
  },
  {
    driver: "Sean Flanagan",
    initials: "SF",
    vehicle: "Van 05",
    reg: "241-G-11234",
    route: "Galway City",
    totalStops: 8,
    completed: 3,
    eta: "10:45",
    status: "On Route",
    stops: [
      { stop: 1, customer: "The Quays Bar", address: "11 Quay St, Galway", timeWindow: "07:30 - 08:00", status: "Delivered" },
      { stop: 2, customer: "Tigh Neachtain", address: "17 Cross St, Galway", timeWindow: "08:00 - 08:30", status: "Delivered" },
      { stop: 3, customer: "McCambridge's", address: "38/39 Shop St, Galway", timeWindow: "08:30 - 09:15", status: "Delivered" },
      { stop: 4, customer: "Kai Restaurant", address: "20 Sea Rd, Galway", timeWindow: "09:15 - 09:45", status: "In Progress" },
      { stop: 5, customer: "Ard Bia at Nimmo's", address: "Spanish Arch, Galway", timeWindow: "10:00 - 10:30", status: "Pending" },
      { stop: 6, customer: "Centra Salthill", address: "Upper Salthill, Galway", timeWindow: "10:30 - 11:00", status: "Pending" },
      { stop: 7, customer: "O'Connell's Bar", address: "8 Eyre Sq, Galway", timeWindow: "11:00 - 11:30", status: "Pending" },
      { stop: 8, customer: "Supervalu Knocknacarra", address: "Knocknacarra Rd, Galway", timeWindow: "11:30 - 12:00", status: "Pending" },
    ],
  },
  {
    driver: "Aoife Brennan",
    initials: "AB",
    vehicle: "Van 07",
    reg: "232-C-45678",
    route: "Cork South",
    totalStops: 11,
    completed: 5,
    eta: "11:05",
    status: "On Route",
    stops: [
      { stop: 1, customer: "The English Market", address: "Princes St, Cork", timeWindow: "07:00 - 07:30", status: "Delivered" },
      { stop: 2, customer: "Franciscan Well Brewery", address: "14B North Mall, Cork", timeWindow: "07:30 - 08:00", status: "Delivered" },
      { stop: 3, customer: "Nash 19", address: "19 Princes St, Cork", timeWindow: "08:00 - 08:30", status: "Delivered" },
      { stop: 4, customer: "Centra Douglas", address: "Douglas Village SC, Cork", timeWindow: "08:30 - 09:00", status: "Delivered" },
      { stop: 5, customer: "Hayfield Manor", address: "Perrott Ave, College Rd, Cork", timeWindow: "09:00 - 09:30", status: "Delivered" },
      { stop: 6, customer: "Rising Sons Brewery", address: "Cornmarket St, Cork", timeWindow: "09:30 - 10:15", status: "In Progress" },
      { stop: 7, customer: "Tesco Mahon Point", address: "Mahon Point SC, Cork", timeWindow: "10:15 - 10:45", status: "Pending" },
      { stop: 8, customer: "Dunnes Ballincollig", address: "Ballincollig SC, Cork", timeWindow: "10:45 - 11:15", status: "Pending" },
      { stop: 9, customer: "Goldbergs Pub", address: "9 Washington St, Cork", timeWindow: "11:15 - 11:45", status: "Pending" },
      { stop: 10, customer: "Market Lane", address: "5 Oliver Plunkett St, Cork", timeWindow: "11:45 - 12:15", status: "Pending" },
      { stop: 11, customer: "SuperValu Togher", address: "Togher Rd, Cork", timeWindow: "12:15 - 12:45", status: "Pending" },
    ],
  },
];

const driversData: Driver[] = [
  { name: "Padraig Murphy", initials: "PM", phone: "087 123 4567", vehicle: "Van 03 — 221-D-12345", status: "On Route", deliveriesToday: 7, distanceKm: 34, avgMinPerStop: 12, weeklyRating: 4.8 },
  { name: "Ciara Doyle", initials: "CD", phone: "086 234 5678", vehicle: "Van 01 — 231-D-67890", status: "On Route", deliveriesToday: 10, distanceKm: 47, avgMinPerStop: 10, weeklyRating: 4.9 },
  { name: "Sean Flanagan", initials: "SF", phone: "085 345 6789", vehicle: "Van 05 — 241-G-11234", status: "On Route", deliveriesToday: 3, distanceKm: 18, avgMinPerStop: 14, weeklyRating: 4.5 },
  { name: "Aoife Brennan", initials: "AB", phone: "083 456 7890", vehicle: "Van 07 — 232-C-45678", status: "On Route", deliveriesToday: 5, distanceKm: 28, avgMinPerStop: 11, weeklyRating: 4.7 },
  { name: "Declan O'Sullivan", initials: "DO", phone: "089 567 8901", vehicle: "Van 02 — 222-D-99887", status: "Available", deliveriesToday: 0, distanceKm: 0, avgMinPerStop: 0, weeklyRating: 4.6 },
  { name: "Niamh Kelly", initials: "NK", phone: "087 678 9012", vehicle: "Van 04 — 241-D-55432", status: "Off Duty", deliveriesToday: 0, distanceKm: 0, avgMinPerStop: 0, weeklyRating: 4.4 },
];

const podRecords: PODRecord[] = [
  { orderId: "ORD-4521", customer: "O'Brien's Off-Licence", driver: "Padraig Murphy", time: "07:48", signed: true, photo: true, notes: "Left with manager. 2 kegs placed in cellar." },
  { orderId: "ORD-4522", customer: "The Chophouse", driver: "Padraig Murphy", time: "08:15", signed: true, photo: true, notes: "Signed by head chef. Crates stacked in cold room." },
  { orderId: "ORD-4523", customer: "Spar Donnybrook", driver: "Padraig Murphy", time: "08:42", signed: true, photo: false, notes: "Rear entrance delivery. Staff busy, no photo taken." },
  { orderId: "ORD-4524", customer: "Gibney's Malahide", driver: "Ciara Doyle", time: "07:22", signed: true, photo: true, notes: "Full delivery confirmed. No damages." },
  { orderId: "ORD-4525", customer: "SuperValu Swords", driver: "Ciara Doyle", time: "07:51", signed: true, photo: true, notes: "Delivered to goods-in bay. 1 crate short — backorder noted." },
  { orderId: "ORD-4526", customer: "The Quays Bar", driver: "Sean Flanagan", time: "07:44", signed: true, photo: true, notes: "Kegs rolled to cellar hatch. All good." },
  { orderId: "ORD-4527", customer: "The English Market", driver: "Aoife Brennan", time: "07:18", signed: true, photo: true, notes: "Multiple vendors. Split delivery across 3 stalls." },
  { orderId: "ORD-4528", customer: "Nash 19", driver: "Aoife Brennan", time: "08:22", signed: false, photo: true, notes: "Owner not present. Photo taken, awaiting signature." },
];

const depositRows: DepositRow[] = [
  { customer: "O'Brien's Off-Licence", itemType: "Kegs", qtyOut: 8, qtyReturned: 5, outstanding: 3, value: 180 },
  { customer: "The Chophouse", itemType: "Crates", qtyOut: 24, qtyReturned: 18, outstanding: 6, value: 90 },
  { customer: "Gibney's Malahide", itemType: "Kegs", qtyOut: 12, qtyReturned: 8, outstanding: 4, value: 240 },
  { customer: "SuperValu Swords", itemType: "Pallets", qtyOut: 6, qtyReturned: 4, outstanding: 2, value: 160 },
  { customer: "The Quays Bar", itemType: "Kegs", qtyOut: 15, qtyReturned: 10, outstanding: 5, value: 300 },
  { customer: "McCambridge's", itemType: "Crates", qtyOut: 40, qtyReturned: 28, outstanding: 12, value: 180 },
  { customer: "The English Market", itemType: "Crates", qtyOut: 56, qtyReturned: 42, outstanding: 14, value: 210 },
  { customer: "Nash 19", itemType: "Pallets", qtyOut: 4, qtyReturned: 2, outstanding: 2, value: 160 },
  { customer: "Franciscan Well Brewery", itemType: "Kegs", qtyOut: 20, qtyReturned: 14, outstanding: 6, value: 360 },
  { customer: "Fallon's Pub", itemType: "Kegs", qtyOut: 6, qtyReturned: 2, outstanding: 4, value: 240 },
];

const plannerStops: PlannerStop[] = [
  { id: 1, customer: "The Shelbourne Hotel", address: "27 St Stephen's Green, D2", eta: "07:30" },
  { id: 2, customer: "Bewley's Grafton St", address: "78-79 Grafton St, D2", eta: "07:55" },
  { id: 3, customer: "The Woollen Mills", address: "42 Ormond Quay Lwr, D1", eta: "08:20" },
  { id: 4, customer: "Brother Hubbard", address: "153 Capel St, D1", eta: "08:45" },
  { id: 5, customer: "Hogan's Bar", address: "35 South Great George's St, D2", eta: "09:10" },
  { id: 6, customer: "Dunnes Henry St", address: "Henry St, D1", eta: "09:35" },
  { id: 7, customer: "The Hairy Lemon", address: "41-42 Lower Stephen St, D2", eta: "10:00" },
  { id: 8, customer: "Fallon & Byrne", address: "11-17 Exchequer St, D2", eta: "10:25" },
  { id: 9, customer: "Tesco Baggot St", address: "1 Baggot St Lwr, D2", eta: "10:50" },
  { id: 10, customer: "Mulligan's Poolbeg St", address: "8 Poolbeg St, D2", eta: "11:15" },
  { id: 11, customer: "The Long Hall", address: "51 South Great George's St, D2", eta: "11:40" },
  { id: 12, customer: "Kehoe's", address: "9 South Anne St, D2", eta: "12:05" },
];

// ── Status Helpers ─────────────────────────────────────────────────────────
const stopStatusStyle: Record<StopStatus, string> = {
  Delivered: "bg-emerald-500/15 text-emerald-400",
  "In Progress": "bg-blue-500/15 text-blue-400",
  Pending: "bg-white/5 text-white/40",
};

const driverStatusStyle: Record<string, string> = {
  "On Route": "bg-emerald-500/15 text-emerald-400",
  Available: "bg-blue-500/15 text-blue-400",
  "Off Duty": "bg-white/5 text-white/40",
};

// ── Signature SVG ──────────────────────────────────────────────────────────
function SignaturePlaceholder() {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-12">
      <path
        d="M10 45 C20 20, 30 50, 50 30 S70 10, 90 35 S110 55, 130 25 S150 10, 170 40 S185 50, 195 30"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        className="opacity-60"
      />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("routes");
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const toggleRoute = useCallback((idx: number) => {
    setExpandedRoute((prev) => (prev === idx ? null : idx));
  }, []);

  // ── Header Stats ───────────────────────────────────────────────────────
  const headerStats = [
    { label: "Active Deliveries", value: "23", icon: Truck, color: "text-blue-400" },
    { label: "Completed Today", value: "41", icon: CheckCircle2, color: "text-emerald-400" },
    { label: "On-Time Rate", value: "94.2%", icon: Clock, color: "text-amber-400" },
    { label: "Returns Pending", value: "7", icon: RotateCcw, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white p-6 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-500/15">
            <Truck className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Driver Pro</h1>
            <p className="text-sm text-white/50">Delivery management &amp; route tracking</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {headerStats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg bg-white/5">
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap",
              activeTab === t.key
                ? "bg-blue-500/15 text-blue-400 border-b-2 border-blue-400"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "routes" && (
            <RoutesTab
              routes={driverRoutes}
              expandedRoute={expandedRoute}
              toggleRoute={toggleRoute}
            />
          )}
          {activeTab === "drivers" && <DriversTab drivers={driversData} />}
          {activeTab === "pod" && <PODTab records={podRecords} />}
          {activeTab === "returns" && (
            <ReturnsTab
              rows={depositRows}
              showModal={showReturnModal}
              setShowModal={setShowReturnModal}
            />
          )}
          {activeTab === "planner" && <PlannerTab stops={plannerStops} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 1 — TODAY'S ROUTES
// ════════════════════════════════════════════════════════════════════════════
function RoutesTab({
  routes,
  expandedRoute,
  toggleRoute,
}: {
  routes: DriverRoute[];
  expandedRoute: number | null;
  toggleRoute: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {routes.map((r, idx) => {
        const pct = Math.round((r.completed / r.totalStops) * 100);
        const isExpanded = expandedRoute === idx;
        return (
          <motion.div
            key={r.driver}
            layout
            className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden"
          >
            {/* Card Header */}
            <div
              className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => toggleRoute(idx)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    {r.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.driver}</p>
                      <span className="flex items-center gap-1">
                        <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Live</span>
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      {r.vehicle} — {r.reg}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">
                    ETA: <span className="text-white/80 font-medium">{r.eta}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/30" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-sm text-white/70">
                  {r.route} — {r.totalStops} stops
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      pct === 100 ? "bg-emerald-500" : "bg-blue-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-medium text-white/60 min-w-[60px] text-right">
                  {r.completed}/{r.totalStops} done
                </span>
              </div>
            </div>

            {/* Expanded Stop List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-white/40 uppercase">
                            <th className="py-2 px-4 text-left font-medium">#</th>
                            <th className="py-2 px-4 text-left font-medium">Customer</th>
                            <th className="py-2 px-4 text-left font-medium hidden md:table-cell">Address</th>
                            <th className="py-2 px-4 text-left font-medium">Window</th>
                            <th className="py-2 px-4 text-left font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.stops.map((s) => (
                            <tr
                              key={s.stop}
                              className="border-t border-white/5 hover:bg-white/[0.02]"
                            >
                              <td className="py-2 px-4 text-white/40 font-mono text-xs">
                                {String(s.stop).padStart(2, "0")}
                              </td>
                              <td className="py-2 px-4 font-medium">{s.customer}</td>
                              <td className="py-2 px-4 text-white/50 hidden md:table-cell">
                                {s.address}
                              </td>
                              <td className="py-2 px-4 text-white/50 text-xs">{s.timeWindow}</td>
                              <td className="py-2 px-4">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                                    stopStatusStyle[s.status]
                                  )}
                                >
                                  {s.status === "Delivered" && <CheckCircle2 className="h-3 w-3" />}
                                  {s.status === "In Progress" && <ArrowRight className="h-3 w-3" />}
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2 — DRIVERS
// ════════════════════════════════════════════════════════════════════════════
function DriversTab({ drivers }: { drivers: Driver[] }) {
  return (
    <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-white/40 uppercase border-b border-white/10">
              <th className="py-3 px-4 text-left font-medium">Driver</th>
              <th className="py-3 px-4 text-left font-medium">Phone</th>
              <th className="py-3 px-4 text-left font-medium">Vehicle</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-right font-medium">Deliveries</th>
              <th className="py-3 px-4 text-right font-medium hidden lg:table-cell">Distance</th>
              <th className="py-3 px-4 text-right font-medium hidden lg:table-cell">Avg/Stop</th>
              <th className="py-3 px-4 text-right font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <motion.tr
                key={d.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                      {d.initials}
                    </div>
                    <span className="font-medium">{d.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {d.phone}
                  </div>
                </td>
                <td className="py-3 px-4 text-white/60">{d.vehicle}</td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                      driverStatusStyle[d.status]
                    )}
                  >
                    <Circle
                      className={cn(
                        "h-1.5 w-1.5",
                        d.status === "On Route" && "fill-emerald-400 text-emerald-400",
                        d.status === "Available" && "fill-blue-400 text-blue-400",
                        d.status === "Off Duty" && "fill-white/30 text-white/30"
                      )}
                    />
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {d.deliveriesToday > 0 ? d.deliveriesToday : "—"}
                </td>
                <td className="py-3 px-4 text-right text-white/60 hidden lg:table-cell">
                  {d.distanceKm > 0 ? `${d.distanceKm} km` : "—"}
                </td>
                <td className="py-3 px-4 text-right text-white/60 hidden lg:table-cell">
                  {d.avgMinPerStop > 0 ? `${d.avgMinPerStop} min` : "—"}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{d.weeklyRating}</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 3 — PROOF OF DELIVERY
// ════════════════════════════════════════════════════════════════════════════
function PODTab({ records }: { records: PODRecord[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((r) => (
        <motion.div
          key={r.orderId}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{r.orderId}</p>
              <p className="text-xs text-white/50">{r.customer}</p>
            </div>
            <span className="text-xs text-white/40">{r.time}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/50">
            <User className="h-3 w-3" />
            {r.driver}
          </div>

          {/* POD Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                r.signed ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              )}
            >
              <PenTool className="h-3 w-3" />
              {r.signed ? "Signed" : "Unsigned"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                r.photo ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/40"
              )}
            >
              <Camera className="h-3 w-3" />
              {r.photo ? "Photo" : "No Photo"}
            </span>
          </div>

          {/* Photo Thumbnail Placeholder */}
          {r.photo && (
            <div className="w-full h-24 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
              <Camera className="h-6 w-6 text-white/20" />
              <span className="ml-2 text-xs text-white/20">Delivery Photo</span>
            </div>
          )}

          {/* Signature */}
          {r.signed && (
            <div className="bg-white/[0.03] rounded-lg p-2 border border-white/5">
              <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Digital Signature</p>
              <SignaturePlaceholder />
            </div>
          )}

          {/* Notes */}
          <p className="text-xs text-white/50 leading-relaxed">{r.notes}</p>

          {/* View Button */}
          <button className="w-full py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            View Full POD
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 4 — RETURNS & DEPOSITS
// ════════════════════════════════════════════════════════════════════════════
function ReturnsTab({
  rows,
  showModal,
  setShowModal,
}: {
  rows: DepositRow[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}) {
  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const kegsOut = rows.filter((r) => r.itemType === "Kegs").reduce((s, r) => s + r.outstanding, 0);
  const cratesOut = rows.filter((r) => r.itemType === "Crates").reduce((s, r) => s + r.outstanding, 0);
  const palletsOut = rows.filter((r) => r.itemType === "Pallets").reduce((s, r) => s + r.outstanding, 0);

  const summaryCards = [
    { label: "Total Outstanding Deposits", value: eur(totalValue), icon: Package, color: "text-blue-400" },
    { label: "Kegs Out", value: String(kegsOut), icon: Package, color: "text-amber-400" },
    { label: "Crates Out", value: String(cratesOut), icon: Package, color: "text-emerald-400" },
    { label: "Pallets Out", value: String(palletsOut), icon: Package, color: "text-purple-400" },
  ];

  const itemTypeStyle: Record<string, string> = {
    Kegs: "bg-amber-500/15 text-amber-400",
    Crates: "bg-emerald-500/15 text-emerald-400",
    Pallets: "bg-purple-500/15 text-purple-400",
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-white/5">
              <c.icon className={cn("h-5 w-5", c.color)} />
            </div>
            <div>
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-xs text-white/50">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table + Button */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-sm">Deposit Tracking</h3>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Return
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-white/40 uppercase border-b border-white/10">
                <th className="py-2.5 px-4 text-left font-medium">Customer</th>
                <th className="py-2.5 px-4 text-left font-medium">Type</th>
                <th className="py-2.5 px-4 text-right font-medium">Out</th>
                <th className="py-2.5 px-4 text-right font-medium">Returned</th>
                <th className="py-2.5 px-4 text-right font-medium">Outstanding</th>
                <th className="py-2.5 px-4 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.customer}-${r.itemType}`}
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 px-4 font-medium">{r.customer}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        itemTypeStyle[r.itemType]
                      )}
                    >
                      {r.itemType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{r.qtyOut}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-400">{r.qtyReturned}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-400 font-semibold">
                    {r.outstanding}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{eur(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Return Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12121e] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Log Return</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-white/50" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Customer</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                    <option>Select customer...</option>
                    {rows.map((r) => (
                      <option key={`${r.customer}-${r.itemType}`}>{r.customer}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Item Type</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                    <option>Kegs</option>
                    <option>Crates</option>
                    <option>Pallets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Quantity Returned</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Driver</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                    {driversData.map((d) => (
                      <option key={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any damage, condition notes..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Log Return
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 5 — ROUTE PLANNER
// ════════════════════════════════════════════════════════════════════════════
function PlannerTab({ stops }: { stops: PlannerStop[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Map Placeholder */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6 flex flex-col">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-400" />
          Route Map
        </h3>
        <div className="flex-1 min-h-[320px] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-white/[0.02]">
          <div className="p-3 rounded-full bg-blue-500/10">
            <Route className="h-8 w-8 text-blue-400/50" />
          </div>
          <p className="text-sm text-white/30 font-medium">Route Map</p>
          <p className="text-xs text-white/20">Integration Ready</p>
        </div>

        {/* Route Summary */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">42.6 km</p>
            <p className="text-xs text-white/50">Total Distance</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">4h 35m</p>
            <p className="text-xs text-white/50">Estimated Time</p>
          </div>
        </div>
      </div>

      {/* Stop List */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            Stop Sequence
          </h3>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <Zap className="h-3.5 w-3.5" />
            Optimise Route
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[480px]">
          {stops.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
            >
              <GripVertical className="h-4 w-4 text-white/15 group-hover:text-white/30 transition-colors cursor-grab flex-shrink-0" />
              <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                {s.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.customer}</p>
                <p className="text-xs text-white/40 truncate">{s.address}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Clock className="h-3 w-3 text-white/30" />
                <span className="text-xs text-white/50 font-mono">{s.eta}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
