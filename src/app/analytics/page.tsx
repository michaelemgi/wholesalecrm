"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Users, AlertTriangle, UserX, TrendingUp, TrendingDown,
  Calendar, Phone, Mail, MapPin, ShoppingCart, BarChart3, Brain,
  Package, Star, Clock, Target, Award, ChevronRight, ArrowUpRight,
  ArrowDownRight, Send, Eye, Zap, Gift, Layers, Search, Filter,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";

// ── Formatters ──────────────────────────────────────────────────────────────
const eur = (v: number) => `€${v.toLocaleString("en-IE")}`;

// ── Tab definitions ─────────────────────────────────────────────────────────
const tabs = [
  { id: "health", label: "Customer Health", icon: Activity },
  { id: "predictions", label: "Predictive Orders", icon: Brain },
  { id: "upsell", label: "Upsell Engine", icon: Zap },
  { id: "products", label: "Product Insights", icon: Package },
  { id: "reps", label: "Sales Rep Performance", icon: Award },
] as const;
type TabId = (typeof tabs)[number]["id"];

// ── Customer Health Data ────────────────────────────────────────────────────
const healthSummary = [
  { label: "Healthy Accounts", value: 34, pct: 72, color: "text-emerald-400", bg: "bg-emerald-500/15", icon: Users },
  { label: "At Risk", value: 9, pct: 19, color: "text-amber-400", bg: "bg-amber-500/15", icon: AlertTriangle },
  { label: "Churning", value: 3, pct: 6, color: "text-red-400", bg: "bg-red-500/15", icon: TrendingDown },
  { label: "Lost (30+ days)", value: 1, pct: 2, color: "text-gray-400", bg: "bg-gray-500/15", icon: UserX },
];

const customers = [
  { name: "The Shelbourne Hotel", segment: "Hotel", region: "Dublin", health: 92, freq: "Weekly", lastOrder: "2026-04-02", aov: 3420, aovTrend: "up", risk: "Low", action: "Schedule Visit" },
  { name: "Café Nero Dublin", segment: "Café", region: "Dublin", health: 85, freq: "Weekly", lastOrder: "2026-04-01", aov: 890, aovTrend: "up", risk: "Low", action: "Send Offer" },
  { name: "Dunne & Crescenzi", segment: "Restaurant", region: "Dublin", health: 78, freq: "Bi-weekly", lastOrder: "2026-03-28", aov: 2150, aovTrend: "down", risk: "Medium", action: "Reach Out" },
  { name: "Galway Bay Hotel", segment: "Hotel", region: "Galway", health: 88, freq: "Weekly", lastOrder: "2026-04-03", aov: 4100, aovTrend: "up", risk: "Low", action: "Schedule Visit" },
  { name: "The Meatball Bar", segment: "Restaurant", region: "Cork", health: 65, freq: "Bi-weekly", lastOrder: "2026-03-22", aov: 1340, aovTrend: "down", risk: "Medium", action: "Reach Out" },
  { name: "SuperValu Limerick", segment: "Retailer", region: "Limerick", health: 45, freq: "Declining ↓", lastOrder: "2026-03-10", aov: 5600, aovTrend: "down", risk: "High", action: "Reach Out" },
  { name: "Bewley's Café", segment: "Café", region: "Dublin", health: 91, freq: "Weekly", lastOrder: "2026-04-03", aov: 1120, aovTrend: "up", risk: "Low", action: "Send Offer" },
  { name: "Hayfield Manor", segment: "Hotel", region: "Cork", health: 73, freq: "Bi-weekly", lastOrder: "2026-03-25", aov: 3800, aovTrend: "down", risk: "Medium", action: "Send Offer" },
  { name: "Milano Restaurants", segment: "Restaurant", region: "Dublin", health: 82, freq: "Weekly", lastOrder: "2026-04-02", aov: 2780, aovTrend: "up", risk: "Low", action: "Schedule Visit" },
  { name: "Centra Galway", segment: "Retailer", region: "Galway", health: 38, freq: "Declining ↓", lastOrder: "2026-03-01", aov: 2100, aovTrend: "down", risk: "High", action: "Reach Out" },
  { name: "Brother Hubbard", segment: "Café", region: "Dublin", health: 55, freq: "Monthly", lastOrder: "2026-03-15", aov: 680, aovTrend: "down", risk: "Medium", action: "Send Offer" },
  { name: "O'Brien's Off-Licence", segment: "Retailer", region: "Cork", health: 22, freq: "Inactive", lastOrder: "2026-02-10", aov: 1850, aovTrend: "down", risk: "Churned", action: "Reach Out" },
];

const churnTrendData = [
  { month: "Nov", atRisk: 4, churning: 1, lost: 0 },
  { month: "Dec", atRisk: 5, churning: 1, lost: 0 },
  { month: "Jan", atRisk: 7, churning: 2, lost: 0 },
  { month: "Feb", atRisk: 8, churning: 2, lost: 1 },
  { month: "Mar", atRisk: 9, churning: 3, lost: 1 },
  { month: "Apr", atRisk: 9, churning: 3, lost: 1 },
];

// ── Predicted Orders Data ───────────────────────────────────────────────────
const predictedOrders = [
  { name: "The Shelbourne Hotel", predicted: "2026-04-07", daysUntil: 3, usual: 3420, confidence: "High", status: "Due This Week" },
  { name: "Bewley's Café", predicted: "2026-04-04", daysUntil: 0, usual: 1120, confidence: "High", status: "Due Today" },
  { name: "Milano Restaurants", predicted: "2026-04-05", daysUntil: 1, usual: 2780, confidence: "High", status: "Due This Week" },
  { name: "Café Nero Dublin", predicted: "2026-04-06", daysUntil: 2, usual: 890, confidence: "High", status: "Due This Week" },
  { name: "Galway Bay Hotel", predicted: "2026-04-08", daysUntil: 4, usual: 4100, confidence: "High", status: "Due This Week" },
  { name: "Dunne & Crescenzi", predicted: "2026-04-10", daysUntil: 6, usual: 2150, confidence: "Medium", status: "On Track" },
  { name: "The Meatball Bar", predicted: "2026-04-03", daysUntil: -1, usual: 1340, confidence: "Medium", status: "Overdue" },
  { name: "Hayfield Manor", predicted: "2026-04-09", daysUntil: 5, usual: 3800, confidence: "Medium", status: "On Track" },
  { name: "SuperValu Limerick", predicted: "2026-04-01", daysUntil: -3, usual: 5600, confidence: "Low", status: "Overdue" },
  { name: "Brother Hubbard", predicted: "2026-04-12", daysUntil: 8, usual: 680, confidence: "Medium", status: "On Track" },
  { name: "Centra Galway", predicted: "2026-03-28", daysUntil: -7, usual: 2100, confidence: "Low", status: "Overdue" },
  { name: "Fallon & Byrne", predicted: "2026-04-06", daysUntil: 2, usual: 1950, confidence: "High", status: "Due This Week" },
  { name: "Avoca Handweavers", predicted: "2026-04-11", daysUntil: 7, usual: 2400, confidence: "Medium", status: "On Track" },
  { name: "Klaw Shellfish", predicted: "2026-04-04", daysUntil: 0, usual: 1680, confidence: "High", status: "Due Today" },
  { name: "The Marker Hotel", predicted: "2026-04-07", daysUntil: 3, usual: 5200, confidence: "High", status: "Due This Week" },
];

const predictedVsActual = [
  { week: "W1 Mar", predicted: 28, actual: 26 },
  { week: "W2 Mar", predicted: 31, actual: 29 },
  { week: "W3 Mar", predicted: 27, actual: 30 },
  { week: "W4 Mar", predicted: 33, actual: 31 },
  { week: "W1 Apr", predicted: 30, actual: 22 },
];

// ── Upsell Engine Data ──────────────────────────────────────────────────────
const upsellOpportunities = [
  {
    customer: "The Shelbourne Hotel",
    insight: "Buys premium meats but not seafood — similar hotels order €2,400/month in seafood",
    products: ["Fresh Atlantic Salmon", "Dublin Bay Prawns", "Smoked Mackerel"],
    potential: 2400,
    similarity: 94,
  },
  {
    customer: "Café Nero Dublin",
    insight: "Orders coffee but not bakery supplies — similar cafés order €800/month in bakery",
    products: ["Artisan Sourdough Loaves", "French Croissants (frozen)", "Danish Pastry Mix"],
    potential: 800,
    similarity: 89,
  },
  {
    customer: "Dunne & Crescenzi",
    insight: "Orders Italian cheeses but no Italian cured meats — restaurants with similar profiles order €1,600/month",
    products: ["Parma Ham (24-month)", "Bresaola", "Nduja Spread"],
    potential: 1600,
    similarity: 91,
  },
  {
    customer: "Galway Bay Hotel",
    insight: "Large beverage orders but no premium spirits — similar hotels add €3,200/month in spirits",
    products: ["Redbreast 12yr Whiskey", "Dingle Gin", "Powerscourt Vodka"],
    potential: 3200,
    similarity: 87,
  },
  {
    customer: "Milano Restaurants",
    insight: "Orders pizza ingredients but no dessert supplies — peer restaurants spend €950/month on desserts",
    products: ["Gelato Base Mix", "Tiramisu Kit", "Cannoli Shells"],
    potential: 950,
    similarity: 85,
  },
  {
    customer: "Bewley's Café",
    insight: "Strong tea/coffee sales but no artisan cold drinks — similar cafés order €600/month",
    products: ["Kombucha (bulk)", "Cold Brew Concentrate", "Fresh-Pressed Juices"],
    potential: 600,
    similarity: 82,
  },
  {
    customer: "Hayfield Manor",
    insight: "Orders fine dining proteins but no premium olive oils — comparable hotels spend €1,100/month",
    products: ["Extra Virgin Olive Oil (Tuscan)", "Truffle Oil", "Balsamic Glaze"],
    potential: 1100,
    similarity: 88,
  },
  {
    customer: "SuperValu Limerick",
    insight: "Stocks local dairy but no local craft beverages — similar retailers add €1,800/month",
    products: ["Kinnegar Craft Beer", "Stonewell Cider", "Velvet Cloud Sheep Yoghurt Drinks"],
    potential: 1800,
    similarity: 79,
  },
];

// ── Product Insights Data ───────────────────────────────────────────────────
const topProducts = [
  { name: "Kerrygold Butter 10kg", revenue: 48200 },
  { name: "Atlantic Salmon Fillets", revenue: 42800 },
  { name: "Angus Beef Striploin", revenue: 39500 },
  { name: "Organic Free-Range Eggs", revenue: 35100 },
  { name: "Premium Basmati Rice 25kg", revenue: 31800 },
  { name: "Flahavan's Oats 25kg", revenue: 28400 },
  { name: "Cashel Blue Cheese", revenue: 25600 },
  { name: "Fresh Sourdough Loaves", revenue: 22100 },
  { name: "Dingle Gin 700ml", revenue: 19800 },
  { name: "Barry's Tea Bulk 600s", revenue: 18200 },
];

const slowMovers = [
  { name: "Pickled Beetroot 2.5kg", revenue: 340, flag: true },
  { name: "Anchovy Paste 500g", revenue: 420, flag: true },
  { name: "Tapioca Starch 10kg", revenue: 510, flag: false },
  { name: "Pomegranate Molasses 1L", revenue: 580, flag: true },
  { name: "Saffron Threads 10g", revenue: 620, flag: false },
  { name: "Dried Wakame 500g", revenue: 680, flag: true },
  { name: "Edible Gold Leaf 10pk", revenue: 710, flag: false },
  { name: "Black Garlic Bulbs 1kg", revenue: 750, flag: false },
  { name: "Rose Water 500ml", revenue: 800, flag: true },
  { name: "Szechuan Peppercorn 250g", revenue: 830, flag: false },
];

const categoryTrends = [
  { month: "Nov", Dairy: 82000, Meat: 74000, Seafood: 45000, Beverages: 38000, Bakery: 29000 },
  { month: "Dec", Dairy: 89000, Meat: 81000, Seafood: 48000, Beverages: 52000, Bakery: 35000 },
  { month: "Jan", Dairy: 78000, Meat: 68000, Seafood: 42000, Beverages: 34000, Bakery: 26000 },
  { month: "Feb", Dairy: 83000, Meat: 72000, Seafood: 50000, Beverages: 36000, Bakery: 28000 },
  { month: "Mar", Dairy: 88000, Meat: 78000, Seafood: 55000, Beverages: 41000, Bakery: 32000 },
  { month: "Apr", Dairy: 91000, Meat: 82000, Seafood: 61000, Beverages: 44000, Bakery: 34000 },
];

const productAffinities = [
  { productA: "Atlantic Salmon", productB: "Fresh Dill Bunches", lift: 4.2 },
  { productA: "Angus Beef Striploin", productB: "Peppercorn Sauce 1L", lift: 3.8 },
  { productA: "Sourdough Loaves", productB: "Kerrygold Butter", lift: 3.5 },
  { productA: "Barry's Tea Bulk", productB: "Organic Milk 10L", lift: 3.1 },
  { productA: "Parma Ham", productB: "Buffalo Mozzarella", lift: 2.9 },
  { productA: "Dingle Gin", productB: "Fever-Tree Tonic (24pk)", lift: 2.7 },
];

const seasonalTrends = [
  { product: "Ice Cream Tubs (bulk)", change: "+340%", direction: "up" as const },
  { product: "BBQ Marinades", change: "+280%", direction: "up" as const },
  { product: "Fresh Berries", change: "+195%", direction: "up" as const },
  { product: "Hot Chocolate Mix", change: "-62%", direction: "down" as const },
  { product: "Mulled Wine Spice Kits", change: "-88%", direction: "down" as const },
];

// ── Sales Rep Data ──────────────────────────────────────────────────────────
const salesReps = [
  {
    name: "Ciaran Murphy", accounts: 12, revenue: 142000, orders: 89, newCustomers: 3,
    responseTime: "1.2h", satisfaction: 4.8, target: 92,
    weekly: [18000, 21000, 19500, 24000, 22000, 20500, 23000],
  },
  {
    name: "Siobhan O'Brien", accounts: 10, revenue: 128000, orders: 76, newCustomers: 5,
    responseTime: "0.8h", satisfaction: 4.9, target: 105,
    weekly: [15000, 17000, 19000, 18500, 21000, 19000, 22000],
  },
  {
    name: "Declan Walsh", accounts: 11, revenue: 118000, orders: 82, newCustomers: 2,
    responseTime: "2.1h", satisfaction: 4.5, target: 78,
    weekly: [16000, 14000, 17000, 15500, 18000, 16000, 17500],
  },
  {
    name: "Aisling Doyle", accounts: 8, revenue: 96000, orders: 64, newCustomers: 4,
    responseTime: "1.5h", satisfaction: 4.7, target: 88,
    weekly: [12000, 13500, 14000, 15000, 13000, 14500, 16000],
  },
  {
    name: "Padraig Kelly", accounts: 6, revenue: 72000, orders: 48, newCustomers: 1,
    responseTime: "3.4h", satisfaction: 4.2, target: 65,
    weekly: [9000, 10000, 11000, 9500, 10500, 11500, 10000],
  },
];

// ── Shared Components ───────────────────────────────────────────────────────
const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#12122a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13px",
  },
  itemStyle: { color: "#94a3b8" },
};

function HealthBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/15" : score >= 50 ? "text-amber-400 bg-amber-500/15" : "text-red-400 bg-red-500/15";
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", color)}>{score}</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    Low: "text-emerald-400 bg-emerald-500/15",
    Medium: "text-amber-400 bg-amber-500/15",
    High: "text-red-400 bg-red-500/15",
    Churned: "text-gray-400 bg-gray-500/15",
  };
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[risk] ?? "text-gray-400")}>{risk}</span>;
}

function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    High: "text-emerald-400 bg-emerald-500/15",
    Medium: "text-amber-400 bg-amber-500/15",
    Low: "text-red-400 bg-red-500/15",
  };
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", map[level])}>{level}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "On Track": "text-emerald-400 bg-emerald-500/15",
    "Due This Week": "text-blue-400 bg-blue-500/15",
    "Due Today": "text-amber-400 bg-amber-500/15",
    Overdue: "text-red-400 bg-red-500/15",
  };
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", map[status])}>{status}</span>;
}

function MiniSparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("health");

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
            <p className="text-white/50 mt-1">Advanced analytics, churn risk, and growth intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0a0a14] border border-white/10 rounded-lg px-4 py-2 text-sm">
              <Calendar className="w-4 h-4 text-white/40" />
              <span className="text-white/70">1 Mar 2026 — 4 Apr 2026</span>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-[#0a0a14] border border-white/10 rounded-xl p-1.5 mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  active ? "text-white" : "text-white/50 hover:text-white/70"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-lg"
                    transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "health" && <CustomerHealthTab />}
            {activeTab === "predictions" && <PredictiveOrdersTab />}
            {activeTab === "upsell" && <UpsellEngineTab />}
            {activeTab === "products" && <ProductInsightsTab />}
            {activeTab === "reps" && <SalesRepTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 1 — Customer Health
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function CustomerHealthTab() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthSummary.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a14] border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", s.bg)}>
                  <Icon className={cn("w-5 h-5", s.color)} />
                </div>
                <span className="text-white/40 text-sm">{s.pct}%</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-white/50 text-sm mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Customer Table */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Customer Health Scores</h3>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Search className="w-4 h-4" />
            <span>12 customers</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-left">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium text-center">Health</th>
                <th className="px-4 py-3 font-medium">Order Freq.</th>
                <th className="px-4 py-3 font-medium">Last Order</th>
                <th className="px-4 py-3 font-medium text-right">Avg. Order</th>
                <th className="px-4 py-3 font-medium text-center">Risk</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.name} className={cn("border-b border-white/5 hover:bg-white/[0.02] transition-colors", i % 2 === 0 ? "bg-white/[0.01]" : "")}>
                  <td className="px-6 py-3.5 font-medium">{c.name}</td>
                  <td className="px-4 py-3.5 text-white/60">{c.segment}</td>
                  <td className="px-4 py-3.5 text-white/60 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white/30" />
                    {c.region}
                  </td>
                  <td className="px-4 py-3.5 text-center"><HealthBadge score={c.health} /></td>
                  <td className="px-4 py-3.5 text-white/60">{c.freq}</td>
                  <td className="px-4 py-3.5 text-white/60">{new Date(c.lastOrder).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      {eur(c.aov)}
                      {c.aovTrend === "up" ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center"><RiskBadge risk={c.risk} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-600/30 transition-colors">
                      {c.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Churn Risk Chart */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Churn Risk Trend — Last 6 Months</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={churnTrendData}>
              <defs>
                <linearGradient id="areaRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaChurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="atRisk" stroke="#f59e0b" fill="url(#areaRisk)" name="At Risk" />
              <Area type="monotone" dataKey="churning" stroke="#ef4444" fill="url(#areaChurn)" name="Churning" />
              <Area type="monotone" dataKey="lost" stroke="#6b7280" fill="url(#areaLost)" name="Lost" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 2 — Predictive Orders
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PredictiveOrdersTab() {
  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Due Today", value: 2, color: "text-amber-400", bg: "bg-amber-500/15" },
          { label: "Due This Week", value: 5, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: "On Track", value: 4, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "Overdue", value: 3, color: "text-red-400", bg: "bg-red-500/15" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0a14] border border-white/10 rounded-xl p-5">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", s.bg)}>
              <ShoppingCart className={cn("w-5 h-5", s.color)} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-white/50 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Predicted Orders Table */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-lg">Predicted Next Orders</h3>
          <p className="text-white/40 text-sm mt-0.5">Based on historical ordering patterns and frequency analysis</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-left">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Predicted Date</th>
                <th className="px-4 py-3 font-medium text-center">Days Until</th>
                <th className="px-4 py-3 font-medium text-right">Usual Value</th>
                <th className="px-4 py-3 font-medium text-center">Confidence</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {predictedOrders.map((o, i) => (
                <tr key={o.name} className={cn("border-b border-white/5 hover:bg-white/[0.02] transition-colors", i % 2 === 0 ? "bg-white/[0.01]" : "")}>
                  <td className="px-6 py-3.5 font-medium">{o.name}</td>
                  <td className="px-4 py-3.5 text-white/60">{new Date(o.predicted).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn("font-mono text-sm", o.daysUntil < 0 ? "text-red-400" : o.daysUntil === 0 ? "text-amber-400" : "text-white/70")}>
                      {o.daysUntil < 0 ? `${Math.abs(o.daysUntil)}d overdue` : o.daysUntil === 0 ? "Today" : `${o.daysUntil}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-white/70">{eur(o.usual)}</td>
                  <td className="px-4 py-3.5 text-center"><ConfidenceBadge level={o.confidence} /></td>
                  <td className="px-4 py-3.5 text-center"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/30 transition-colors" title="Send Reminder">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-600/30 transition-colors" title="Call">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predicted vs Actual Chart */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Orders: Predicted vs Actual This Month</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={predictedVsActual} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="predicted" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Predicted" />
              <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 3 — Upsell Engine
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function UpsellEngineTab() {
  const totalPotential = upsellOpportunities.reduce((s, o) => s + o.potential, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/15 mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold">{upsellOpportunities.length}</p>
          <p className="text-white/50 text-sm mt-1">Upsell Opportunities</p>
        </div>
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/15 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold">{eur(totalPotential)}</p>
          <p className="text-white/50 text-sm mt-1">Potential Monthly Revenue</p>
        </div>
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/15 mb-3">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold">88%</p>
          <p className="text-white/50 text-sm mt-1">Avg. Similarity Score</p>
        </div>
      </div>

      {/* Opportunity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {upsellOpportunities.map((opp, i) => (
          <motion.div
            key={opp.customer}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0a0a14] border border-white/10 rounded-xl p-6 hover:border-blue-500/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-base">{opp.customer}</h4>
                <p className="text-white/50 text-sm mt-1">{opp.insight}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/40 bg-white/5 rounded-full px-2.5 py-1 shrink-0 ml-4">
                <Layers className="w-3 h-3" />
                {opp.similarity}% match
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Recommended Products</p>
              <div className="flex flex-wrap gap-2">
                {opp.products.map((p) => (
                  <span key={p} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md px-2.5 py-1">{p}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div>
                <span className="text-xs text-white/40">Potential Revenue</span>
                <p className="text-emerald-400 font-semibold text-lg">{eur(opp.potential)}<span className="text-white/40 text-xs font-normal">/month</span></p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors">
                <Send className="w-3.5 h-3.5" />
                Send Recommendation
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 4 — Product Insights
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const categoryColors: Record<string, string> = {
  Dairy: "#3b82f6",
  Meat: "#ef4444",
  Seafood: "#06b6d4",
  Beverages: "#f59e0b",
  Bakery: "#a855f7",
};

function ProductInsightsTab() {
  return (
    <div className="space-y-6">
      {/* Top + Bottom Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Revenue */}
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Top 10 Products by Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={11} width={160} tick={{ fill: "rgba(255,255,255,0.6)" }} />
                <Tooltip {...chartTooltipStyle} formatter={(v) => [eur(Number(v)), "Revenue"]} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Slow Movers */}
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Bottom 10 — Slow Movers</h3>
          <div className="space-y-3">
            {slowMovers.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/70">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/40">{eur(p.revenue)}</span>
                  {p.flag && (
                    <span className="text-xs bg-red-500/15 text-red-400 rounded-full px-2.5 py-0.5">Consider discontinuing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Trends */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Category Revenue Trends — 6 Months</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [eur(Number(v)), ""]} />
              {Object.entries(categoryColors).map(([key, color]) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3 justify-center">
          {Object.entries(categoryColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-white/50">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              {key}
            </div>
          ))}
        </div>
      </div>

      {/* Product Affinity + Seasonal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Affinity Pairs */}
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Product Affinity Pairs</h3>
          <p className="text-white/40 text-sm mb-4">Customers who buy X also buy Y</p>
          <div className="space-y-3">
            {productAffinities.map((a) => (
              <div key={a.productA + a.productB} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/80">{a.productA}</span>
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                  <span className="text-white/80">{a.productB}</span>
                </div>
                <span className="text-xs bg-blue-500/15 text-blue-400 rounded-full px-2.5 py-1">{a.lift}x lift</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Seasonal Demand Shifts</h3>
          <p className="text-white/40 text-sm mb-4">Compared to previous month</p>
          <div className="space-y-3">
            {seasonalTrends.map((s) => (
              <div key={s.product} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  {s.direction === "up" ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                  <span className="text-sm text-white/80">{s.product}</span>
                </div>
                <span className={cn("text-sm font-semibold", s.direction === "up" ? "text-emerald-400" : "text-red-400")}>
                  {s.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 5 — Sales Rep Performance
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SalesRepTab() {
  const totalRevenue = salesReps.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = salesReps.reduce((s, r) => s + r.orders, 0);
  const totalNew = salesReps.reduce((s, r) => s + r.newCustomers, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue (Team)", value: eur(totalRevenue), icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/15" },
          { label: "Orders Processed", value: totalOrders.toString(), icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { label: "New Customers", value: totalNew.toString(), icon: Users, color: "text-purple-400", bg: "bg-purple-500/15" },
          { label: "Active Reps", value: salesReps.length.toString(), icon: Award, color: "text-amber-400", bg: "bg-amber-500/15" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#0a0a14] border border-white/10 rounded-xl p-5">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", s.bg)}>
                <Icon className={cn("w-5 h-5", s.color)} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-white/50 text-sm mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Rep Table */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-lg">Sales Representative Scorecard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-left">
                <th className="px-6 py-3 font-medium">Rep</th>
                <th className="px-4 py-3 font-medium text-center">Accounts</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
                <th className="px-4 py-3 font-medium text-center">Orders</th>
                <th className="px-4 py-3 font-medium text-center">New Clients</th>
                <th className="px-4 py-3 font-medium text-center">Avg Response</th>
                <th className="px-4 py-3 font-medium text-center">CSAT</th>
                <th className="px-4 py-3 font-medium">vs Target</th>
                <th className="px-4 py-3 font-medium text-center">7-Day Trend</th>
              </tr>
            </thead>
            <tbody>
              {salesReps.map((rep, i) => {
                const targetColor = rep.target >= 100 ? "text-emerald-400" : rep.target >= 80 ? "text-amber-400" : "text-red-400";
                const barColor = rep.target >= 100 ? "bg-emerald-500" : rep.target >= 80 ? "bg-amber-500" : "bg-red-500";
                const sparkColor = rep.target >= 100 ? "#10b981" : rep.target >= 80 ? "#f59e0b" : "#ef4444";
                return (
                  <tr key={rep.name} className={cn("border-b border-white/5 hover:bg-white/[0.02] transition-colors", i % 2 === 0 ? "bg-white/[0.01]" : "")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                          {rep.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium">{rep.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-white/70">{rep.accounts}</td>
                    <td className="px-4 py-4 text-right text-white/70">{eur(rep.revenue)}</td>
                    <td className="px-4 py-4 text-center text-white/70">{rep.orders}</td>
                    <td className="px-4 py-4 text-center text-white/70">{rep.newCustomers}</td>
                    <td className="px-4 py-4 text-center text-white/70">{rep.responseTime}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-white/70">{rep.satisfaction}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(rep.target, 100)}%` }} />
                        </div>
                        <span className={cn("text-xs font-semibold", targetColor)}>{rep.target}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <MiniSparkline data={rep.weekly} color={sparkColor} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rep Revenue Chart */}
      <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Revenue by Rep — Weekly Breakdown</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={["W1", "W2", "W3", "W4", "W5", "W6", "W7"].map((w, wi) => ({
                week: w,
                ...Object.fromEntries(salesReps.map((r) => [r.name.split(" ")[0], r.weekly[wi]])),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [eur(Number(v)), ""]} />
              {salesReps.map((r, i) => {
                const colors = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444"];
                return <Bar key={r.name} dataKey={r.name.split(" ")[0]} fill={colors[i]} radius={[2, 2, 0, 0]} />;
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3 justify-center">
          {salesReps.map((r, i) => {
            const colors = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ef4444"];
            return (
              <div key={r.name} className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                {r.name.split(" ")[0]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
