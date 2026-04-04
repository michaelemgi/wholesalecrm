"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, TrendingUp, ShoppingCart, BarChart3, Clock, Calendar,
  Percent, Gift, Truck, Package, Users, MapPin, Play, Pause,
  Pencil, Copy, XCircle, Plus, Bell, Send, Eye, ChevronDown,
  CheckCircle2, AlertCircle, Zap, Star, Timer, ArrowUpRight,
  Search, Filter, ArrowUpDown, ChevronUp, X, Megaphone,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type PromoType = "% Discount" | "Bundle Deal" | "Volume Discount" | "Buy X Get Y" | "Free Shipping" | "Fixed Amount Off";
type PromoStatus = "Active" | "Paused" | "Scheduled" | "Expired";
type TabKey = "active" | "scheduled" | "expired" | "create";

interface Promotion {
  id: string;
  name: string;
  type: PromoType;
  description: string;
  startDate: string;
  endDate: string;
  targetSegment: string;
  redemptions: number;
  usageCap: number;
  revenueImpact: number;
  avgOrderUplift: number;
  status: PromoStatus;
  value: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  sentAt: string;
  deliveryRate: number;
  openRate: number;
}

// ─── Fake Data ───────────────────────────────────────────────────────────────

const promotions: Promotion[] = [
  {
    id: "P001", name: "Summer BBQ Bundle", type: "Bundle Deal",
    description: "Kerrygold Butter, Ballymaloe Relish & Clonakilty Sausages at a special bundle price for the summer season.",
    startDate: "2026-03-15", endDate: "2026-06-30", targetSegment: "Restaurants - Dublin",
    redemptions: 47, usageCap: 100, revenueImpact: 3200, avgOrderUplift: 18.50, status: "Active", value: "Save 22%",
  },
  {
    id: "P002", name: "New Customer Welcome 10%", type: "% Discount",
    description: "10% off first order for all new wholesale accounts. Encourages trial across our full range of Irish products.",
    startDate: "2026-01-01", endDate: "2026-12-31", targetSegment: "All New Customers",
    redemptions: 89, usageCap: 200, revenueImpact: 5400, avgOrderUplift: 24.00, status: "Active", value: "10% Off",
  },
  {
    id: "P003", name: "Kerrygold Volume Deal", type: "Volume Discount",
    description: "Buy 10+ cases of Kerrygold Butter get 15% off. Buy 20+ cases get 20% off. Perfect for hotels and large restaurants.",
    startDate: "2026-02-01", endDate: "2026-05-31", targetSegment: "Hotels - Munster",
    redemptions: 31, usageCap: 75, revenueImpact: 2800, avgOrderUplift: 32.00, status: "Active", value: "Up to 20% Off",
  },
  {
    id: "P004", name: "Free Delivery Over EUR 500", type: "Free Shipping",
    description: "Free nationwide delivery on all orders over EUR 500. Drives larger basket sizes across all customer segments.",
    startDate: "2026-03-01", endDate: "2026-04-30", targetSegment: "All Customers",
    redemptions: 62, usageCap: 150, revenueImpact: 4100, avgOrderUplift: 15.75, status: "Active", value: "Free Delivery",
  },
  {
    id: "P005", name: "Dingle Gin Buy 5 Get 1", type: "Buy X Get Y",
    description: "Buy 5 cases of Dingle Original Gin and receive 1 case free. Exclusive to on-trade accounts in Connacht.",
    startDate: "2026-03-10", endDate: "2026-05-10", targetSegment: "Pubs - Connacht",
    redemptions: 18, usageCap: 50, revenueImpact: 1900, avgOrderUplift: 42.00, status: "Active", value: "Buy 5 Get 1 Free",
  },
  {
    id: "P006", name: "Cashel Blue Cheese Week", type: "% Discount",
    description: "15% off all Cashel Blue Farmhouse Cheese products. Celebrating National Cheese Week with our award-winning supplier.",
    startDate: "2026-03-25", endDate: "2026-04-08", targetSegment: "Restaurants - Leinster",
    redemptions: 24, usageCap: 60, revenueImpact: 1200, avgOrderUplift: 12.30, status: "Active", value: "15% Off",
  },
  {
    id: "P007", name: "Barry's Tea Cafe Special", type: "Bundle Deal",
    description: "Barry's Gold Blend Tea 600-pack with branded cups and saucers set. Exclusive to cafes and coffee shops.",
    startDate: "2026-04-01", endDate: "2026-06-01", targetSegment: "Cafes - Nationwide",
    redemptions: 12, usageCap: 40, revenueImpact: 960, avgOrderUplift: 28.00, status: "Active", value: "Save EUR 18",
  },
  {
    id: "P008", name: "Flahavan's Porridge Bulk", type: "Volume Discount",
    description: "Flahavan's Progress Oatlets bulk deal. 15+ cases at 12% off. Ideal for hotel breakfast service.",
    startDate: "2026-03-20", endDate: "2026-05-20", targetSegment: "Hotels - Ulster",
    redemptions: 9, usageCap: 30, revenueImpact: 780, avgOrderUplift: 19.50, status: "Active", value: "12% Off 15+",
  },
];

const scheduledPromotions: Promotion[] = [
  {
    id: "S001", name: "Easter Lamb Special", type: "Bundle Deal",
    description: "Premium Irish lamb cuts bundle with Ballymaloe Mint Sauce. Targeted at restaurants preparing Easter menus.",
    startDate: "2026-04-10", endDate: "2026-04-25", targetSegment: "Restaurants - Nationwide",
    redemptions: 0, usageCap: 80, revenueImpact: 0, avgOrderUplift: 0, status: "Scheduled", value: "Save 18%",
  },
  {
    id: "S002", name: "Craft Beer Summer Launch", type: "% Discount",
    description: "20% off first order of new Galway Hooker summer range. Early bird pricing for on-trade accounts.",
    startDate: "2026-05-01", endDate: "2026-07-31", targetSegment: "Pubs - All Regions",
    redemptions: 0, usageCap: 120, revenueImpact: 0, avgOrderUplift: 0, status: "Scheduled", value: "20% Off",
  },
  {
    id: "S003", name: "Glenisk Yoghurt Free Delivery", type: "Free Shipping",
    description: "Free chilled delivery on all Glenisk dairy orders over EUR 200. Supporting organic Irish dairy.",
    startDate: "2026-04-15", endDate: "2026-05-15", targetSegment: "Cafes - Dublin",
    redemptions: 0, usageCap: 60, revenueImpact: 0, avgOrderUplift: 0, status: "Scheduled", value: "Free Delivery",
  },
];

const expiredPromotions: Promotion[] = [
  {
    id: "E001", name: "January Clearance 25%", type: "% Discount",
    description: "25% off seasonal stock clearance across all categories.",
    startDate: "2026-01-02", endDate: "2026-01-31", targetSegment: "All Customers",
    redemptions: 134, usageCap: 200, revenueImpact: 8200, avgOrderUplift: 16.80, status: "Expired", value: "25% Off",
  },
  {
    id: "E002", name: "Valentine's Chocolate Bundle", type: "Bundle Deal",
    description: "Lily O'Brien's and Butlers Chocolate gift bundle for hotel service.",
    startDate: "2026-02-01", endDate: "2026-02-16", targetSegment: "Hotels - Dublin",
    redemptions: 45, usageCap: 50, revenueImpact: 3600, avgOrderUplift: 22.40, status: "Expired", value: "Save EUR 12",
  },
  {
    id: "E003", name: "Paddy's Day Drinks Deal", type: "Buy X Get Y",
    description: "Buy 10 cases Jameson get 2 free. St. Patrick's Day pub promotion.",
    startDate: "2026-03-01", endDate: "2026-03-20", targetSegment: "Pubs - Nationwide",
    redemptions: 67, usageCap: 80, revenueImpact: 6800, avgOrderUplift: 38.50, status: "Expired", value: "Buy 10 Get 2",
  },
  {
    id: "E004", name: "Bewley's Coffee Intro", type: "% Discount",
    description: "15% introductory offer on Bewley's new single-origin range.",
    startDate: "2026-01-15", endDate: "2026-02-28", targetSegment: "Cafes - Leinster",
    redemptions: 52, usageCap: 100, revenueImpact: 2400, avgOrderUplift: 11.20, status: "Expired", value: "15% Off",
  },
  {
    id: "E005", name: "Clonakilty Pudding BOGOF", type: "Buy X Get Y",
    description: "Buy one case of Clonakilty Black Pudding, get one half price.",
    startDate: "2026-02-10", endDate: "2026-03-10", targetSegment: "Restaurants - Cork",
    redemptions: 38, usageCap: 50, revenueImpact: 1800, avgOrderUplift: 14.60, status: "Expired", value: "BOGOF",
  },
];

const notifications: Notification[] = [
  {
    id: "N001", type: "New Product Alert", message: "Dingle Distillery launches new Vodka range - now available for pre-order",
    sentAt: "2026-04-03 14:30", deliveryRate: 97.2, openRate: 42.8,
  },
  {
    id: "N002", type: "Price Drop", message: "Kerrygold Butter prices reduced by 8% - limited time wholesale pricing",
    sentAt: "2026-04-02 10:15", deliveryRate: 98.1, openRate: 56.3,
  },
  {
    id: "N003", type: "Limited Time Offer", message: "Flash sale: 20% off all Ballymaloe products this weekend only",
    sentAt: "2026-04-01 09:00", deliveryRate: 96.8, openRate: 61.2,
  },
  {
    id: "N004", type: "Seasonal Special", message: "Easter menu essentials - curated bundles for your seasonal menu planning",
    sentAt: "2026-03-30 11:45", deliveryRate: 97.5, openRate: 38.9,
  },
  {
    id: "N005", type: "New Product Alert", message: "Glenisk launches organic kefir range - be first to stock Ireland's newest dairy trend",
    sentAt: "2026-03-28 15:20", deliveryRate: 95.9, openRate: 44.1,
  },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatEuro(value: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatEuroDecimal(value: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function daysUntil(dateStr: string): number {
  const now = new Date("2026-04-04");
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function daysRemaining(endDate: string): number {
  return daysUntil(endDate);
}

function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateStr));
}

const typeBadgeColors: Record<PromoType, string> = {
  "% Discount": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Bundle Deal": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Volume Discount": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Buy X Get Y": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Free Shipping": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Fixed Amount Off": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const typeIcons: Record<PromoType, React.ReactNode> = {
  "% Discount": <Percent className="w-3 h-3" />,
  "Bundle Deal": <Package className="w-3 h-3" />,
  "Volume Discount": <BarChart3 className="w-3 h-3" />,
  "Buy X Get Y": <Gift className="w-3 h-3" />,
  "Free Shipping": <Truck className="w-3 h-3" />,
  "Fixed Amount Off": <Tag className="w-3 h-3" />,
};

const notifTypeColors: Record<string, string> = {
  "New Product Alert": "bg-blue-500/20 text-blue-400",
  "Price Drop": "bg-emerald-500/20 text-emerald-400",
  "Limited Time Offer": "bg-amber-500/20 text-amber-400",
  "Seasonal Special": "bg-purple-500/20 text-purple-400",
};

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, trend, trendUp }: {
  icon: React.ElementType; label: string; value: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a14] border border-white/10 rounded-xl p-5 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white/50 truncate">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {trend && (
          <p className={cn("text-xs flex items-center gap-1 mt-0.5", trendUp ? "text-emerald-400" : "text-red-400")}>
            <ArrowUpRight className={cn("w-3 h-3", !trendUp && "rotate-90")} />
            {trend}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PromotionCard({ promo, index }: { promo: Promotion; index: number }) {
  const [active, setActive] = useState(promo.status === "Active");
  const usagePercent = Math.round((promo.redemptions / promo.usageCap) * 100);
  const remaining = daysRemaining(promo.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#0a0a14] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-base truncate">{promo.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", typeBadgeColors[promo.type])}>
              {typeIcons[promo.type]}
              {promo.type}
            </span>
            <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{promo.value}</span>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => setActive(!active)}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors shrink-0",
            active ? "bg-blue-500" : "bg-white/10"
          )}
        >
          <motion.div
            animate={{ x: active ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white"
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-white/50 leading-relaxed mb-3 line-clamp-2">{promo.description}</p>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1.5 text-white/40">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDateShort(promo.startDate)} - {formatDateShort(promo.endDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40">
          <Users className="w-3.5 h-3.5" />
          <span>{promo.targetSegment}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40">
          <Timer className="w-3.5 h-3.5" />
          <span>{remaining} days remaining</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40">
          <Tag className="w-3.5 h-3.5" />
          <span>{active ? "Active" : "Paused"}</span>
        </div>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/5 rounded-lg p-2.5 text-center">
          <p className="text-xs text-white/40 mb-0.5">Redemptions</p>
          <p className="text-sm font-semibold text-white">{promo.redemptions}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 text-center">
          <p className="text-xs text-white/40 mb-0.5">Revenue</p>
          <p className="text-sm font-semibold text-emerald-400">+{formatEuro(promo.revenueImpact)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 text-center">
          <p className="text-xs text-white/40 mb-0.5">Avg Uplift</p>
          <p className="text-sm font-semibold text-blue-400">+{formatEuroDecimal(promo.avgOrderUplift)}</p>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white/40">Usage</span>
          <span className="text-white/60">{promo.redemptions}/{promo.usageCap} uses</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1, delay: index * 0.05 }}
            className={cn(
              "h-full rounded-full",
              usagePercent > 80 ? "bg-amber-500" : usagePercent > 50 ? "bg-blue-500" : "bg-emerald-500"
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-2 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-2 transition-colors">
          <Copy className="w-3.5 h-3.5" /> Duplicate
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg py-2 transition-colors">
          <XCircle className="w-3.5 h-3.5" /> End
        </button>
      </div>
    </motion.div>
  );
}

function ScheduledCard({ promo, index }: { promo: Promotion; index: number }) {
  const countdown = daysUntil(promo.startDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-[#0a0a14] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-base truncate">{promo.name}</h3>
          <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1.5", typeBadgeColors[promo.type])}>
            {typeIcons[promo.type]}
            {promo.type}
          </span>
        </div>
        <div className="text-center shrink-0 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
          <p className="text-2xl font-bold text-blue-400">{countdown}</p>
          <p className="text-[10px] text-blue-400/60 uppercase tracking-wider">days</p>
        </div>
      </div>

      <p className="text-sm text-white/50 leading-relaxed mb-3">{promo.description}</p>

      <div className="space-y-2 text-xs text-white/40 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Starts {formatDateShort(promo.startDate)} - Ends {formatDateShort(promo.endDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>{promo.targetSegment}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />
          <span>{promo.value} - Usage cap: {promo.usageCap}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg py-2 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg py-2 transition-colors">
          <Play className="w-3.5 h-3.5" /> Launch Now
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg py-2 transition-colors">
          <XCircle className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </motion.div>
  );
}

function ExpiredTable({ sortKey, sortDir, onSort }: {
  sortKey: string; sortDir: "asc" | "desc"; onSort: (key: string) => void;
}) {
  const sorted = useMemo(() => {
    const s = [...expiredPromotions];
    s.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "type": return dir * a.type.localeCompare(b.type);
        case "redemptions": return dir * (a.redemptions - b.redemptions);
        case "revenue": return dir * (a.revenueImpact - b.revenueImpact);
        case "uplift": return dir * (a.avgOrderUplift - b.avgOrderUplift);
        case "endDate": return dir * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        default: return 0;
      }
    });
    return s;
  }, [sortKey, sortDir]);

  const SortHeader = ({ label, key: k }: { label: string; key: string }) => (
    <th
      className="text-left text-xs text-white/40 font-medium py-3 px-4 cursor-pointer hover:text-white/60 transition-colors select-none"
      onClick={() => onSort(k)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );

  return (
    <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <SortHeader label="Promotion" key="name" />
              <SortHeader label="Type" key="type" />
              <th className="text-left text-xs text-white/40 font-medium py-3 px-4">Period</th>
              <th className="text-left text-xs text-white/40 font-medium py-3 px-4">Segment</th>
              <SortHeader label="Redemptions" key="redemptions" />
              <SortHeader label="Revenue Impact" key="revenue" />
              <SortHeader label="Avg Uplift" key="uplift" />
              <th className="text-left text-xs text-white/40 font-medium py-3 px-4">Usage</th>
              <th className="text-right text-xs text-white/40 font-medium py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((promo, i) => {
              const usagePercent = Math.round((promo.redemptions / promo.usageCap) * 100);
              return (
                <motion.tr
                  key={promo.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm text-white font-medium">{promo.name}</p>
                    <p className="text-xs text-white/40">{promo.value}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", typeBadgeColors[promo.type])}>
                      {typeIcons[promo.type]}
                      {promo.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-white/50">
                    {formatDateShort(promo.startDate)} - {formatDateShort(promo.endDate)}
                  </td>
                  <td className="py-3 px-4 text-xs text-white/50">{promo.targetSegment}</td>
                  <td className="py-3 px-4 text-sm text-white font-medium">{promo.redemptions}</td>
                  <td className="py-3 px-4 text-sm text-emerald-400 font-medium">+{formatEuro(promo.revenueImpact)}</td>
                  <td className="py-3 px-4 text-sm text-blue-400 font-medium">+{formatEuroDecimal(promo.avgOrderUplift)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-white/20 rounded-full" style={{ width: `${usagePercent}%` }} />
                      </div>
                      <span className="text-xs text-white/40">{usagePercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <Copy className="w-4 h-4 inline" /> Reuse
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreatePromotionForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Percentage Off" as string,
    value: "",
    applyTo: "All Products",
    targetCustomers: "All",
    minOrderValue: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    pushNotify: true,
    volumeTiers: [
      { qty: 5, discount: 10 },
      { qty: 10, discount: 15 },
    ],
    bundleProducts: [
      { name: "Kerrygold Butter 227g x24", price: "" },
      { name: "Ballymaloe Relish 310g x12", price: "" },
    ],
    bundlePrice: "",
  });

  const promoTypes = ["Percentage Off", "Fixed Amount Off", "Bundle Deal", "Volume Discount", "Buy X Get Y", "Free Delivery"];
  const applyOptions = ["All Products", "Specific Categories", "Specific Products"];
  const categoryOptions = ["Dairy", "Meats", "Beverages", "Bakery", "Condiments", "Spirits", "Confectionery", "Tea & Coffee"];
  const segmentOptions = ["All", "Restaurants", "Hotels", "Cafes", "Pubs", "Retailers", "Catering Companies"];
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-5 gap-6"
    >
      {/* Form */}
      <div className="lg:col-span-3 space-y-5">
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-lg">Promotion Details</h3>

          {/* Name */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Promotion Name</label>
            <input
              type="text" placeholder="e.g. Summer BBQ Bundle"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Promotion Type</label>
              <div className="relative">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                >
                  {promoTypes.map((t) => <option key={t} value={t} className="bg-[#0a0a14]">{t}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">
                {formData.type === "Percentage Off" ? "Discount (%)" :
                 formData.type === "Fixed Amount Off" ? "Amount (EUR)" :
                 formData.type === "Free Delivery" ? "Min Order (EUR)" : "Value"}
              </label>
              <input
                type="text" placeholder={formData.type === "Percentage Off" ? "e.g. 15" : "e.g. 25.00"}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Apply To */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Apply To</label>
            <div className="flex items-center gap-2">
              {applyOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFormData({ ...formData, applyTo: opt })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-colors border",
                    formData.applyTo === opt
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-white/5 text-white/40 border-white/10 hover:text-white/60"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Category Multi-Select */}
          {formData.applyTo === "Specific Categories" && (
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Select Categories</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategories(
                      selectedCategories.includes(cat)
                        ? selectedCategories.filter((c) => c !== cat)
                        : [...selectedCategories, cat]
                    )}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs transition-colors border",
                      selectedCategories.includes(cat)
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-white/5 text-white/40 border-white/10 hover:text-white/60"
                    )}
                  >
                    {selectedCategories.includes(cat) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target Customers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Target Customers</label>
              <div className="relative">
                <select
                  value={formData.targetCustomers}
                  onChange={(e) => setFormData({ ...formData, targetCustomers: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                >
                  {segmentOptions.map((s) => <option key={s} value={s} className="bg-[#0a0a14]">{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Min Order Value (optional)</label>
              <input
                type="text" placeholder="e.g. 200"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Volume Tiers */}
          {formData.type === "Volume Discount" && (
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Volume Thresholds</label>
              <div className="space-y-2">
                {formData.volumeTiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex-1">
                      <span className="text-xs text-white/40">Buy</span>
                      <input
                        type="number" value={tier.qty}
                        onChange={(e) => {
                          const tiers = [...formData.volumeTiers];
                          tiers[i].qty = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, volumeTiers: tiers });
                        }}
                        className="w-16 bg-transparent text-white text-sm focus:outline-none text-center"
                      />
                      <span className="text-xs text-white/40">+ cases =</span>
                      <input
                        type="number" value={tier.discount}
                        onChange={(e) => {
                          const tiers = [...formData.volumeTiers];
                          tiers[i].discount = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, volumeTiers: tiers });
                        }}
                        className="w-16 bg-transparent text-white text-sm focus:outline-none text-center"
                      />
                      <span className="text-xs text-white/40">% off</span>
                    </div>
                    <button
                      onClick={() => {
                        const tiers = formData.volumeTiers.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, volumeTiers: tiers });
                      }}
                      className="text-red-400/50 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, volumeTiers: [...formData.volumeTiers, { qty: 0, discount: 0 }] })}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Tier
                </button>
              </div>
            </div>
          )}

          {/* Bundle Builder */}
          {formData.type === "Bundle Deal" && (
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Bundle Builder</label>
              <div className="space-y-2">
                {formData.bundleProducts.map((prod, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="text" value={prod.name}
                      onChange={(e) => {
                        const prods = [...formData.bundleProducts];
                        prods[i].name = e.target.value;
                        setFormData({ ...formData, bundleProducts: prods });
                      }}
                      placeholder="Product name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={() => {
                        const prods = formData.bundleProducts.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, bundleProducts: prods });
                      }}
                      className="text-red-400/50 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, bundleProducts: [...formData.bundleProducts, { name: "", price: "" }] })}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Product
                </button>
                <div className="pt-2 border-t border-white/10">
                  <label className="block text-xs text-white/40 mb-1">Bundle Price (EUR)</label>
                  <input
                    type="text" placeholder="e.g. 89.99"
                    value={formData.bundlePrice}
                    onChange={(e) => setFormData({ ...formData, bundlePrice: e.target.value })}
                    className="w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dates & Limit */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Start Date</label>
              <input
                type="date" value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">End Date</label>
              <input
                type="date" value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Usage Limit (optional)</label>
              <input
                type="number" placeholder="e.g. 100"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Push Notification Toggle */}
          <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-white font-medium">Push Notification</p>
                <p className="text-xs text-white/40">Notify customers about this promotion</p>
              </div>
            </div>
            <button
              onClick={() => setFormData({ ...formData, pushNotify: !formData.pushNotify })}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                formData.pushNotify ? "bg-blue-500" : "bg-white/10"
              )}
            >
              <motion.div
                animate={{ x: formData.pushNotify ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4" /> Create Promotion
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm rounded-lg transition-colors border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6 sticky top-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" /> Preview
          </h3>
          <div className="border border-dashed border-white/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
                {formData.type || "Promotion Type"}
              </span>
            </div>
            <h4 className="text-white font-semibold text-lg">
              {formData.name || "Promotion Name"}
            </h4>
            {formData.value && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {formData.type === "Percentage Off" ? `${formData.value}% Off` :
                   formData.type === "Fixed Amount Off" ? `EUR ${formData.value} Off` :
                   formData.type === "Free Delivery" ? "Free Delivery" :
                   formData.value}
                </p>
              </div>
            )}
            <div className="space-y-1.5 text-xs text-white/40">
              {formData.targetCustomers !== "All" && (
                <p className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {formData.targetCustomers}
                </p>
              )}
              {formData.minOrderValue && (
                <p className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Min order: EUR {formData.minOrderValue}
                </p>
              )}
              {formData.startDate && formData.endDate && (
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formData.startDate} to {formData.endDate}
                </p>
              )}
              {formData.usageLimit && (
                <p className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Limited to {formData.usageLimit} uses
                </p>
              )}
            </div>
            {formData.pushNotify && (
              <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 rounded-lg px-3 py-2">
                <Bell className="w-3.5 h-3.5" /> Customers will be notified
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-400" /> Recent Notifications
          </h3>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", notifTypeColors[notif.type])}>
                    {notif.type}
                  </span>
                  <span className="text-[10px] text-white/30">{notif.sentAt}</span>
                </div>
                <p className="text-xs text-white/60 mb-2 line-clamp-1">{notif.message}</p>
                <div className="flex items-center gap-4 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <Send className="w-3 h-3" /> {notif.deliveryRate}% delivered
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {notif.openRate}% opened
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [expiredSortKey, setExpiredSortKey] = useState("endDate");
  const [expiredSortDir, setExpiredSortDir] = useState<"asc" | "desc">("desc");

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "active", label: "Active", icon: Play, count: 8 },
    { key: "scheduled", label: "Scheduled", icon: Clock, count: 3 },
    { key: "expired", label: "Expired", icon: XCircle, count: 5 },
    { key: "create", label: "Create New", icon: Plus },
  ];

  function handleExpiredSort(key: string) {
    if (expiredSortKey === key) {
      setExpiredSortDir(expiredSortDir === "asc" ? "desc" : "asc");
    } else {
      setExpiredSortKey(key);
      setExpiredSortDir("desc");
    }
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-400" />
              </div>
              Promotions Engine
            </h1>
            <p className="text-sm text-white/40 mt-1 ml-[52px]">Manage promotions, bundles, volume deals and customer notifications</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Active Promotions" value="8" trend="2 new this week" trendUp />
        <StatCard icon={ShoppingCart} label="Redemptions This Month" value="342" trend="+18% vs last month" trendUp />
        <StatCard icon={TrendingUp} label="Revenue Uplift" value="+EUR 18,400" trend="+EUR 3,200 vs last month" trendUp />
        <StatCard icon={BarChart3} label="Avg Order Value Impact" value="+12.3%" trend="Highest in 3 months" trendUp />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-[#0a0a14] border border-white/10 rounded-xl p-1.5 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  activeTab === tab.key ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-white/40"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "active" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {promotions.map((promo, i) => (
              <PromotionCard key={promo.id} promo={promo} index={i} />
            ))}
          </motion.div>
        )}

        {activeTab === "scheduled" && (
          <motion.div
            key="scheduled"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {scheduledPromotions.map((promo, i) => (
                <ScheduledCard key={promo.id} promo={promo} index={i} />
              ))}
            </div>

            {/* Push Notifications Section */}
            <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-400" /> Push Notifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">1,247</p>
                  <p className="text-xs text-white/40 mt-1">Total Sent This Month</p>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">97.1%</p>
                  <p className="text-xs text-white/40 mt-1">Avg Delivery Rate</p>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">48.7%</p>
                  <p className="text-xs text-white/40 mt-1">Avg Open Rate</p>
                </div>
              </div>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", notifTypeColors[notif.type])}>
                          {notif.type}
                        </span>
                        <span className="text-[10px] text-white/30">{notif.sentAt}</span>
                      </div>
                      <p className="text-sm text-white/60 truncate">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-white/40">
                      <div className="text-center">
                        <p className="text-sm font-medium text-white">{notif.deliveryRate}%</p>
                        <p className="text-[10px] text-white/30">Delivered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-400">{notif.openRate}%</p>
                        <p className="text-[10px] text-white/30">Opened</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "expired" && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            <ExpiredTable sortKey={expiredSortKey} sortDir={expiredSortDir} onSort={handleExpiredSort} />
          </motion.div>
        )}

        {activeTab === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            <CreatePromotionForm onClose={() => setActiveTab("active")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
