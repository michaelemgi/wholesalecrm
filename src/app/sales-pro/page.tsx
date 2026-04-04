"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, DollarSign, MapPin, AlertTriangle, Phone, Mail,
  Calendar, ShoppingCart, Clock, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Eye, MessageSquare, Navigation,
  Plus, Route, CheckCircle2, Star, Lightbulb, ArrowRight,
  FileText, User, Building2, Truck, CreditCard, Tag,
  Search, Filter, BarChart3, Target, ExternalLink,
  Briefcase, Coffee, Hotel, Store, UtensilsCrossed,
  CircleDot, Sparkles, X, Send, CalendarDays,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "accounts" | "activity" | "route" | "onboarding" | "insights";
type HealthScore = "green" | "amber" | "red";
type OrderFrequency = "Weekly" | "Bi-weekly" | "Monthly" | "Declining";
type BusinessType = "Restaurant" | "Hotel" | "Café" | "Pub" | "Retailer";
type ActivityType = "Visit" | "Call" | "Order" | "Note" | "Email";

interface CustomerAccount {
  id: string;
  name: string;
  type: BusinessType;
  location: string;
  address: string;
  healthScore: HealthScore;
  lastOrder: string;
  orderFrequency: OrderFrequency;
  avgMonthlyValue: number;
  lastVisit: string;
  contactName: string;
  contactPhone: string;
  topProducts: { name: string; monthlyQty: number; monthlyValue: number }[];
  upsellOpportunities: string[];
  orderTrend: number[];
  lastVisitNotes: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  customer: string;
  description: string;
  timestamp: string;
  tags?: string[];
}

interface RouteStop {
  id: string;
  order: number;
  customer: string;
  address: string;
  timeWindow: string;
  purpose: string;
  estimatedDuration: string;
}

interface RecentOnboard {
  id: string;
  name: string;
  type: BusinessType;
  date: string;
  estimatedValue: number;
}

interface Insight {
  id: string;
  message: string;
  type: "warning" | "opportunity" | "alert" | "info";
  action: string;
  actionLabel: string;
}

// ─── Fake Data ────────────────────────────────────────────────────────────────

const customers: CustomerAccount[] = [
  {
    id: "sa-001", name: "The Shelbourne Hotel", type: "Hotel", location: "Dublin",
    address: "27 St Stephen's Green, Dublin 2",
    healthScore: "green", lastOrder: "2026-04-02", orderFrequency: "Weekly",
    avgMonthlyValue: 12400, lastVisit: "2026-03-28",
    contactName: "Fiona Brennan", contactPhone: "+353 1 663 4500",
    topProducts: [
      { name: "Atlantic Salmon Fillets", monthlyQty: 60, monthlyValue: 1800 },
      { name: "Kerrygold Butter (10kg)", monthlyQty: 40, monthlyValue: 920 },
      { name: "Organic Mixed Greens", monthlyQty: 80, monthlyValue: 640 },
      { name: "Irish Angus Sirloin", monthlyQty: 30, monthlyValue: 2100 },
      { name: "Ballymaloe Relish (catering)", monthlyQty: 24, monthlyValue: 312 },
    ],
    upsellOpportunities: ["Premium Olive Oils", "Artisan Bread Range", "Organic Dairy Line"],
    orderTrend: [11200, 11800, 12100, 12400, 12000, 12400],
    lastVisitNotes: "Met with head chef Darren. Interested in expanding organic range for summer menu. Discussed new seafood supplier options.",
  },
  {
    id: "sa-002", name: "Fade St Social", type: "Restaurant", location: "Dublin",
    address: "4-6 Fade Street, Dublin 2",
    healthScore: "green", lastOrder: "2026-04-01", orderFrequency: "Weekly",
    avgMonthlyValue: 8900, lastVisit: "2026-03-25",
    contactName: "Dylan McGrath", contactPhone: "+353 1 604 0066",
    topProducts: [
      { name: "Duck Confit Legs", monthlyQty: 45, monthlyValue: 1350 },
      { name: "San Marzano Tomatoes", monthlyQty: 60, monthlyValue: 480 },
      { name: "Sourdough Flour (25kg)", monthlyQty: 12, monthlyValue: 360 },
      { name: "Irish Wagyu Ribeye", monthlyQty: 20, monthlyValue: 1800 },
      { name: "Truffle Oil (500ml)", monthlyQty: 8, monthlyValue: 320 },
    ],
    upsellOpportunities: ["Fresh Seafood Range", "Premium Wine Selection", "Dessert Ingredients"],
    orderTrend: [7600, 8200, 8400, 9100, 8800, 8900],
    lastVisitNotes: "Dylan wants to trial our new wagyu range. Placed sample order. Follow up next week for feedback.",
  },
  {
    id: "sa-003", name: "Café Nero — Grafton St", type: "Café", location: "Dublin",
    address: "82 Grafton Street, Dublin 2",
    healthScore: "amber", lastOrder: "2026-03-29", orderFrequency: "Bi-weekly",
    avgMonthlyValue: 3200, lastVisit: "2026-03-20",
    contactName: "Sarah O'Sullivan", contactPhone: "+353 1 677 8899",
    topProducts: [
      { name: "Arabica Coffee Beans (5kg)", monthlyQty: 30, monthlyValue: 1200 },
      { name: "Oat Milk (1L x 12)", monthlyQty: 20, monthlyValue: 360 },
      { name: "Croissant (frozen, 50pk)", monthlyQty: 8, monthlyValue: 280 },
      { name: "Chocolate Brownies (20pk)", monthlyQty: 10, monthlyValue: 200 },
      { name: "Vanilla Syrup (750ml)", monthlyQty: 12, monthlyValue: 144 },
    ],
    upsellOpportunities: ["Pastry Range", "Specialty Tea Selection", "Sandwich Fillings"],
    orderTrend: [3400, 3200, 3100, 2900, 3000, 3200],
    lastVisitNotes: "Sarah mentioned competitor pricing on coffee — they got a quote 8% lower. Need to review our pricing or offer volume discount.",
  },
  {
    id: "sa-004", name: "The Westbury Hotel", type: "Hotel", location: "Dublin",
    address: "Balfe Street, Dublin 2",
    healthScore: "red", lastOrder: "2026-03-18", orderFrequency: "Declining",
    avgMonthlyValue: 9800, lastVisit: "2026-03-15",
    contactName: "Patrick Guilbaud", contactPhone: "+353 1 679 1122",
    topProducts: [
      { name: "Premium Irish Beef Selection", monthlyQty: 35, monthlyValue: 2450 },
      { name: "French Cheese Platter Range", monthlyQty: 20, monthlyValue: 1400 },
      { name: "Organic Vegetable Box", monthlyQty: 40, monthlyValue: 800 },
      { name: "Smoked Salmon (sliced)", monthlyQty: 25, monthlyValue: 1250 },
      { name: "Artisan Bread Selection", monthlyQty: 30, monthlyValue: 600 },
    ],
    upsellOpportunities: ["Wine & Spirits", "Premium Dessert Ingredients"],
    orderTrend: [11200, 10800, 10200, 9800, 8400, 7500],
    lastVisitNotes: "Meeting with procurement was tense. They're reviewing all suppliers. Need to schedule follow-up with GM to discuss loyalty pricing.",
  },
  {
    id: "sa-005", name: "Galway Bay Hotel", type: "Hotel", location: "Galway",
    address: "The Promenade, Salthill, Galway",
    healthScore: "green", lastOrder: "2026-04-03", orderFrequency: "Weekly",
    avgMonthlyValue: 7600, lastVisit: "2026-04-01",
    contactName: "Mairead Flaherty", contactPhone: "+353 91 520 520",
    topProducts: [
      { name: "Galway Bay Oysters (dozen)", monthlyQty: 100, monthlyValue: 2000 },
      { name: "Atlantic Cod Fillets", monthlyQty: 50, monthlyValue: 1000 },
      { name: "Connemara Lamb Rack", monthlyQty: 25, monthlyValue: 1250 },
      { name: "Irish Cream Liqueur (catering)", monthlyQty: 15, monthlyValue: 450 },
      { name: "Local Honey (500g)", monthlyQty: 20, monthlyValue: 200 },
    ],
    upsellOpportunities: ["Craft Beer Range", "Premium Spirits Selection"],
    orderTrend: [6800, 7000, 7200, 7400, 7500, 7600],
    lastVisitNotes: "Mairead is delighted with the oyster supply. Discussed summer wedding season — they'll need increased volumes from June.",
  },
  {
    id: "sa-006", name: "Brasserie on the Corner", type: "Restaurant", location: "Cork",
    address: "74 South Mall, Cork",
    healthScore: "amber", lastOrder: "2026-03-27", orderFrequency: "Bi-weekly",
    avgMonthlyValue: 5400, lastVisit: "2026-03-22",
    contactName: "Colm O'Regan", contactPhone: "+353 21 427 0088",
    topProducts: [
      { name: "Wagyu Burger Patties (20pk)", monthlyQty: 15, monthlyValue: 750 },
      { name: "Brioche Buns (50pk)", monthlyQty: 10, monthlyValue: 200 },
      { name: "House Fries (10kg)", monthlyQty: 20, monthlyValue: 300 },
      { name: "Caesar Dressing (5L)", monthlyQty: 6, monthlyValue: 120 },
      { name: "Parmesan Wheel (2kg)", monthlyQty: 4, monthlyValue: 280 },
    ],
    upsellOpportunities: ["Seafood Starters Range", "Premium Dairy Line", "Organic Produce"],
    orderTrend: [5800, 5600, 5500, 5200, 5300, 5400],
    lastVisitNotes: "Manager Colm mentioned competitor pricing on dairy. Need to review our rates for cheese and butter. He's comparing us to Musgrave.",
  },
  {
    id: "sa-007", name: "The Dean Hotel", type: "Hotel", location: "Cork",
    address: "Horgan's Quay, Cork",
    healthScore: "green", lastOrder: "2026-04-02", orderFrequency: "Weekly",
    avgMonthlyValue: 6800, lastVisit: "2026-03-30",
    contactName: "Niamh Walsh", contactPhone: "+353 21 422 6600",
    topProducts: [
      { name: "Free Range Eggs (tray 30)", monthlyQty: 40, monthlyValue: 480 },
      { name: "Smoked Back Bacon (5kg)", monthlyQty: 20, monthlyValue: 600 },
      { name: "Fresh Orange Juice (2L x 6)", monthlyQty: 30, monthlyValue: 360 },
      { name: "Granola Mix (5kg)", monthlyQty: 10, monthlyValue: 200 },
      { name: "Sourdough Loaves (dozen)", monthlyQty: 24, monthlyValue: 288 },
    ],
    upsellOpportunities: ["Vegan Breakfast Range", "Gluten-Free Products"],
    orderTrend: [6200, 6400, 6500, 6600, 6700, 6800],
    lastVisitNotes: "Niamh wants to add vegan options to breakfast menu. Sent her our plant-based catalogue. Follow up Thursday.",
  },
  {
    id: "sa-008", name: "Dunnes Stores — Patrick St", type: "Retailer", location: "Cork",
    address: "Patrick Street, Cork",
    healthScore: "green", lastOrder: "2026-04-03", orderFrequency: "Weekly",
    avgMonthlyValue: 22000, lastVisit: "2026-04-01",
    contactName: "Brian Maguire", contactPhone: "+353 21 427 1100",
    topProducts: [
      { name: "Irish Cheddar Block (5kg)", monthlyQty: 80, monthlyValue: 2400 },
      { name: "Semi-Skimmed Milk (2L x 6)", monthlyQty: 200, monthlyValue: 1800 },
      { name: "Kerrygold Butter (227g x 40)", monthlyQty: 60, monthlyValue: 1440 },
      { name: "Rashers Value Pack (500g)", monthlyQty: 100, monthlyValue: 1200 },
      { name: "Brown Bread Loaves (800g)", monthlyQty: 120, monthlyValue: 960 },
    ],
    upsellOpportunities: ["Premium Deli Range", "Craft Beer & Cider", "Ready Meals"],
    orderTrend: [20000, 20500, 21000, 21500, 21800, 22000],
    lastVisitNotes: "Store performing well. Brian interested in stocking our new premium deli line. Need to send samples by Friday.",
  },
  {
    id: "sa-009", name: "Aniar Restaurant", type: "Restaurant", location: "Galway",
    address: "53 Lower Dominick Street, Galway",
    healthScore: "green", lastOrder: "2026-04-01", orderFrequency: "Weekly",
    avgMonthlyValue: 4200, lastVisit: "2026-03-26",
    contactName: "JP McMahon", contactPhone: "+353 91 535 947",
    topProducts: [
      { name: "Wild Atlantic Seaweed", monthlyQty: 15, monthlyValue: 450 },
      { name: "Connemara Mountain Lamb", monthlyQty: 12, monthlyValue: 840 },
      { name: "Foraged Mushroom Mix", monthlyQty: 10, monthlyValue: 350 },
      { name: "Raw Honey (local)", monthlyQty: 8, monthlyValue: 160 },
      { name: "Heritage Beetroot (kg)", monthlyQty: 20, monthlyValue: 140 },
    ],
    upsellOpportunities: ["Rare Breed Pork", "Wild Game Selection", "Artisan Vinegars"],
    orderTrend: [3800, 3900, 4000, 4100, 4200, 4200],
    lastVisitNotes: "JP is menu planning for summer tasting menu. Wants unusual ingredients — seaweed varieties and wild herbs. Great upsell potential.",
  },
  {
    id: "sa-010", name: "SuperValu — Eyre Square", type: "Retailer", location: "Galway",
    address: "Eyre Square Centre, Galway",
    healthScore: "amber", lastOrder: "2026-03-25", orderFrequency: "Monthly",
    avgMonthlyValue: 15600, lastVisit: "2026-03-18",
    contactName: "Declan Murphy", contactPhone: "+353 91 563 800",
    topProducts: [
      { name: "Mixed Fruit & Veg Box", monthlyQty: 100, monthlyValue: 3000 },
      { name: "UHT Milk Pallets", monthlyQty: 50, monthlyValue: 2500 },
      { name: "Sliced Pan White (800g)", monthlyQty: 150, monthlyValue: 1350 },
      { name: "Chicken Fillets (1kg x 20)", monthlyQty: 40, monthlyValue: 1600 },
      { name: "Crisps Multipack (x24)", monthlyQty: 60, monthlyValue: 900 },
    ],
    upsellOpportunities: ["Organic Range", "Protein Snack Range", "Chilled Juice Line"],
    orderTrend: [16200, 15800, 15900, 15600, 15200, 15600],
    lastVisitNotes: "Declan is slow to respond. Store foot traffic seems down. Need to offer promotional pricing or seasonal deals to reignite orders.",
  },
  {
    id: "sa-011", name: "Kai Restaurant", type: "Restaurant", location: "Galway",
    address: "22 Sea Road, Galway",
    healthScore: "green", lastOrder: "2026-04-02", orderFrequency: "Weekly",
    avgMonthlyValue: 3800, lastVisit: "2026-03-29",
    contactName: "Jess Murphy", contactPhone: "+353 91 526 003",
    topProducts: [
      { name: "Organic Sourdough Flour (25kg)", monthlyQty: 8, monthlyValue: 240 },
      { name: "Free Range Chicken (whole)", monthlyQty: 20, monthlyValue: 400 },
      { name: "Seasonal Vegetable Box", monthlyQty: 16, monthlyValue: 480 },
      { name: "Homemade Stock Bones (kg)", monthlyQty: 15, monthlyValue: 150 },
      { name: "Cultured Butter (local)", monthlyQty: 10, monthlyValue: 180 },
    ],
    upsellOpportunities: ["Specialty Flours", "Fermentation Supplies", "Wild Fish"],
    orderTrend: [3400, 3500, 3600, 3700, 3800, 3800],
    lastVisitNotes: "Jess is doing a fermentation workshop — wants bulk kimchi and sauerkraut supplies. Great cross-sell opportunity.",
  },
  {
    id: "sa-012", name: "The Marker Hotel", type: "Hotel", location: "Dublin",
    address: "Grand Canal Square, Dublin 2",
    healthScore: "red", lastOrder: "2026-03-14", orderFrequency: "Declining",
    avgMonthlyValue: 11200, lastVisit: "2026-03-10",
    contactName: "Gareth Mullins", contactPhone: "+353 1 687 5100",
    topProducts: [
      { name: "Premium Steak Selection", monthlyQty: 40, monthlyValue: 3200 },
      { name: "Lobster Tails (frozen)", monthlyQty: 20, monthlyValue: 1600 },
      { name: "Champagne (cases)", monthlyQty: 6, monthlyValue: 1800 },
      { name: "Belgian Chocolate (5kg)", monthlyQty: 8, monthlyValue: 480 },
      { name: "Truffles (fresh, 100g)", monthlyQty: 4, monthlyValue: 600 },
    ],
    upsellOpportunities: ["Banqueting Bulk Packs"],
    orderTrend: [13500, 12800, 12000, 11200, 9800, 8200],
    lastVisitNotes: "Gareth says they're consolidating suppliers. We might be at risk of losing this account. Urgent meeting needed with their CFO.",
  },
  {
    id: "sa-013", name: "O'Brien's Pub", type: "Pub", location: "Dublin",
    address: "45 Leeson Street Lower, Dublin 2",
    healthScore: "amber", lastOrder: "2026-03-30", orderFrequency: "Bi-weekly",
    avgMonthlyValue: 2800, lastVisit: "2026-03-24",
    contactName: "Tommy O'Brien", contactPhone: "+353 1 660 4523",
    topProducts: [
      { name: "Tayto Crisps (mixed box)", monthlyQty: 20, monthlyValue: 300 },
      { name: "Peanuts (salted, 1kg x 10)", monthlyQty: 8, monthlyValue: 160 },
      { name: "Toasties Cheese (sliced, 5kg)", monthlyQty: 6, monthlyValue: 120 },
      { name: "Soup of the Day Mix (5L x 4)", monthlyQty: 10, monthlyValue: 200 },
      { name: "Craft Beer Kegs (30L)", monthlyQty: 12, monthlyValue: 1080 },
    ],
    upsellOpportunities: ["Bar Snack Range", "Soft Drinks", "Ready-Made Sandwiches"],
    orderTrend: [3000, 2900, 2800, 2700, 2800, 2800],
    lastVisitNotes: "Tommy wants to add a food menu — big opportunity. Offered to help plan a simple pub grub range with our products.",
  },
  {
    id: "sa-014", name: "Ard Bia at Nimmos", type: "Restaurant", location: "Galway",
    address: "Spanish Arch, Galway",
    healthScore: "green", lastOrder: "2026-04-03", orderFrequency: "Weekly",
    avgMonthlyValue: 4600, lastVisit: "2026-03-31",
    contactName: "Aoibhinn Ni Mhurchu", contactPhone: "+353 91 561 114",
    topProducts: [
      { name: "Organic Smoked Mackerel", monthlyQty: 30, monthlyValue: 600 },
      { name: "Cashel Blue Cheese (wheel)", monthlyQty: 6, monthlyValue: 420 },
      { name: "Spelt Flour (10kg)", monthlyQty: 5, monthlyValue: 100 },
      { name: "Free Range Duck Eggs (doz)", monthlyQty: 12, monthlyValue: 192 },
      { name: "Wild Garlic (seasonal)", monthlyQty: 8, monthlyValue: 120 },
    ],
    upsellOpportunities: ["Craft Vinegars", "Specialty Salts", "Kombucha (kegs)"],
    orderTrend: [4100, 4200, 4300, 4400, 4500, 4600],
    lastVisitNotes: "Aoibhinn wants to expand their weekend brunch offering. Sent pricing on egg and dairy range. Very positive meeting.",
  },
  {
    id: "sa-015", name: "The English Market Deli", type: "Retailer", location: "Cork",
    address: "The English Market, Cork",
    healthScore: "red", lastOrder: "2026-03-20", orderFrequency: "Declining",
    avgMonthlyValue: 6200, lastVisit: "2026-03-12",
    contactName: "Sinead McCarthy", contactPhone: "+353 21 427 8901",
    topProducts: [
      { name: "Artisan Salami Selection", monthlyQty: 20, monthlyValue: 800 },
      { name: "Irish Farmhouse Cheese (mixed)", monthlyQty: 15, monthlyValue: 750 },
      { name: "Olives & Antipasti (2kg)", monthlyQty: 12, monthlyValue: 360 },
      { name: "Sourdough Loaves (fresh)", monthlyQty: 30, monthlyValue: 360 },
      { name: "Smoked Trout Fillets", monthlyQty: 10, monthlyValue: 400 },
    ],
    upsellOpportunities: ["Gluten-Free Range", "Vegan Deli Options"],
    orderTrend: [7200, 6800, 6500, 6200, 5800, 5200],
    lastVisitNotes: "Sinead is frustrated with delivery times. Need to escalate to logistics. Risk of losing account if not resolved this week.",
  },
];

const activities: Activity[] = [
  { id: "act-01", type: "Visit", customer: "The Shelbourne Hotel", description: "Visited The Shelbourne Hotel — discussed Q3 menu changes, they're interested in expanding their organic range for summer", timestamp: "2026-04-04T09:30:00", tags: ["Sales", "Opportunity"] },
  { id: "act-02", type: "Call", customer: "Café Nero — Grafton St", description: "Called Café Nero re: competitor pricing on coffee beans — Sarah wants a volume discount proposal by Monday", timestamp: "2026-04-04T08:15:00", tags: ["Support"] },
  { id: "act-03", type: "Order", customer: "Galway Bay Hotel", description: "Placed order #4521 for Galway Bay Hotel — €1,240 including extra oysters for weekend event", timestamp: "2026-04-03T16:45:00", tags: ["Sales"] },
  { id: "act-04", type: "Note", customer: "Brasserie on the Corner", description: "Manager at Brasserie mentioned competitor pricing on dairy — Musgrave offering 8% lower on cheese. Need to review our rates urgently", timestamp: "2026-04-03T14:20:00", tags: ["Complaint"] },
  { id: "act-05", type: "Visit", customer: "Dunnes Stores — Patrick St", description: "Visited Brian at Dunnes Patrick St — discussed premium deli range. Sending samples Friday. Very keen to stock artisan cheeses", timestamp: "2026-04-03T11:00:00", tags: ["Sales", "Opportunity"] },
  { id: "act-06", type: "Email", customer: "The Marker Hotel", description: "Sent revised pricing proposal to Gareth at The Marker. Included loyalty discount of 5% on annual commitment. Awaiting response", timestamp: "2026-04-03T09:00:00", tags: ["Sales"] },
  { id: "act-07", type: "Call", customer: "The English Market Deli", description: "Called Sinead about delivery delays — escalated to logistics team. Promised resolution within 48 hours", timestamp: "2026-04-02T17:30:00", tags: ["Support", "Complaint"] },
  { id: "act-08", type: "Visit", customer: "Fade St Social", description: "Dropped off wagyu samples to Dylan. He'll trial them on this weekend's tasting menu and give feedback Monday", timestamp: "2026-04-02T14:00:00", tags: ["Sales"] },
  { id: "act-09", type: "Order", customer: "Ard Bia at Nimmos", description: "Placed order #4518 for Ard Bia — €890 including new wild garlic and duck eggs for brunch menu expansion", timestamp: "2026-04-02T11:30:00", tags: ["Sales"] },
  { id: "act-10", type: "Note", customer: "O'Brien's Pub", description: "Tommy is serious about adding a food menu. Prepared a starter pub grub package proposal — soups, toasties, and platters", timestamp: "2026-04-02T09:45:00", tags: ["Opportunity"] },
  { id: "act-11", type: "Visit", customer: "The Dean Hotel", description: "Met Niamh at The Dean — reviewed vegan breakfast options. She's trialling our plant-based sausages and oat milk range", timestamp: "2026-04-01T15:00:00", tags: ["Sales"] },
  { id: "act-12", type: "Call", customer: "SuperValu — Eyre Square", description: "Called Declan re: declining orders. Offered 10% promotional discount on next 3 orders. He'll discuss with store manager", timestamp: "2026-04-01T10:30:00", tags: ["Support"] },
  { id: "act-13", type: "Order", customer: "The Shelbourne Hotel", description: "Placed order #4515 for Shelbourne — €2,860 including new organic mixed greens and premium salmon", timestamp: "2026-04-01T09:00:00", tags: ["Sales"] },
  { id: "act-14", type: "Email", customer: "The Westbury Hotel", description: "Sent meeting request to Patrick for next Tuesday. Need to discuss account review and retention strategy", timestamp: "2026-03-31T16:00:00", tags: ["Sales"] },
  { id: "act-15", type: "Visit", customer: "Kai Restaurant", description: "Visited Jess at Kai — she wants fermentation supplies in bulk. Discussed kimchi kits and sauerkraut starters", timestamp: "2026-03-31T13:00:00", tags: ["Sales", "Opportunity"] },
  { id: "act-16", type: "Note", customer: "Galway Bay Hotel", description: "Mairead confirmed summer wedding season volumes — need to lock in increased oyster and lamb supply from June", timestamp: "2026-03-31T11:00:00", tags: ["Sales"] },
  { id: "act-17", type: "Call", customer: "Aniar Restaurant", description: "Called JP about summer tasting menu ingredients. He needs rare seaweed varieties — checking with our foragers", timestamp: "2026-03-30T14:30:00", tags: ["Sales"] },
  { id: "act-18", type: "Order", customer: "The Dean Hotel", description: "Placed order #4510 for The Dean — €1,580 breakfast supplies including new granola and fresh juice range", timestamp: "2026-03-30T10:00:00", tags: ["Sales"] },
  { id: "act-19", type: "Visit", customer: "Aniar Restaurant", description: "Visited Aniar — JP showed me his new kitchen setup. They're expanding covers from 30 to 45. Great growth opportunity", timestamp: "2026-03-29T15:00:00", tags: ["Sales", "Opportunity"] },
  { id: "act-20", type: "Email", customer: "Café Nero — Grafton St", description: "Sent updated pastry catalogue to Sarah. Highlighted our new almond croissant and pain au chocolat range", timestamp: "2026-03-29T09:00:00", tags: ["Sales"] },
];

const routeStops: RouteStop[] = [
  { id: "rs-01", order: 1, customer: "Café Nero — Grafton St", address: "82 Grafton Street, Dublin 2", timeWindow: "09:00 – 09:45", purpose: "Discuss volume discount proposal for coffee beans", estimatedDuration: "45 min" },
  { id: "rs-02", order: 2, customer: "The Shelbourne Hotel", address: "27 St Stephen's Green, Dublin 2", timeWindow: "10:00 – 11:00", purpose: "Review summer organic range with head chef", estimatedDuration: "60 min" },
  { id: "rs-03", order: 3, customer: "Fade St Social", address: "4-6 Fade Street, Dublin 2", timeWindow: "11:30 – 12:15", purpose: "Collect wagyu trial feedback from Dylan", estimatedDuration: "45 min" },
  { id: "rs-04", order: 4, customer: "The Marker Hotel", address: "Grand Canal Square, Dublin 2", timeWindow: "13:30 – 14:30", purpose: "Urgent retention meeting with procurement", estimatedDuration: "60 min" },
  { id: "rs-05", order: 5, customer: "O'Brien's Pub", address: "45 Leeson Street Lower, Dublin 2", timeWindow: "15:00 – 15:30", purpose: "Present pub grub food menu proposal", estimatedDuration: "30 min" },
];

const recentOnboards: RecentOnboard[] = [
  { id: "ro-01", name: "The Woollen Mills", type: "Restaurant", date: "2026-03-28", estimatedValue: 4200 },
  { id: "ro-02", name: "Brew House — Smithfield", type: "Café", date: "2026-03-22", estimatedValue: 2100 },
  { id: "ro-03", name: "Clancy's Bar", type: "Pub", date: "2026-03-15", estimatedValue: 1800 },
  { id: "ro-04", name: "Tesco Express — Baggot St", type: "Retailer", date: "2026-03-10", estimatedValue: 8400 },
  { id: "ro-05", name: "The Ivy — Dawson St", type: "Restaurant", date: "2026-03-05", estimatedValue: 6800 },
];

const insights: Insight[] = [
  { id: "ins-01", message: "3 of your accounts haven't ordered in 14+ days — The Westbury Hotel, The Marker Hotel, and The English Market Deli are overdue", type: "warning", action: "reach-out", actionLabel: "Reach Out" },
  { id: "ins-02", message: "The Westbury Hotel's order value dropped 23% vs last month — from €9,800 avg to €7,500. They may be shifting to a competitor", type: "alert", action: "view-account", actionLabel: "View Account" },
  { id: "ins-03", message: "Café Nero ordered 40% more coffee this month — opportunity to cross-sell pastries and breakfast items alongside", type: "opportunity", action: "place-order", actionLabel: "Place Order" },
  { id: "ins-04", message: "Similar restaurants to Fade St Social spend €800/month on seafood — they currently spend €0. Major upsell gap", type: "opportunity", action: "view-account", actionLabel: "View Account" },
  { id: "ins-05", message: "Order deadline: 4 accounts usually order on Tuesday — The Dean, Kai, Galway Bay, and Ard Bia — none have ordered yet today", type: "alert", action: "reach-out", actionLabel: "Reach Out" },
  { id: "ins-06", message: "O'Brien's Pub wants to launch a food menu — if they start serving pub grub, estimated monthly value could increase from €2,800 to €5,500+", type: "opportunity", action: "view-account", actionLabel: "View Account" },
  { id: "ins-07", message: "The English Market Deli flagged delivery issues twice this month. Churn risk is high — logistics follow-up is critical this week", type: "warning", action: "reach-out", actionLabel: "Reach Out" },
  { id: "ins-08", message: "Aniar Restaurant is expanding covers by 50%. Lock in increased supply agreement now before they diversify suppliers", type: "opportunity", action: "view-account", actionLabel: "View Account" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): number {
  const now = new Date("2026-04-04");
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function formatEur(value: number): string {
  return `€${value.toLocaleString("en-IE")}`;
}

function healthBadge(score: HealthScore) {
  const styles = {
    green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labels = { green: "Healthy", amber: "At Risk", red: "Critical" };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", styles[score])}>
      {labels[score]}
    </span>
  );
}

function freqBadge(freq: OrderFrequency) {
  const styles: Record<OrderFrequency, string> = {
    Weekly: "bg-blue-500/20 text-blue-400",
    "Bi-weekly": "bg-cyan-500/20 text-cyan-400",
    Monthly: "bg-purple-500/20 text-purple-400",
    Declining: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", styles[freq])}>
      {freq}
    </span>
  );
}

function activityIcon(type: ActivityType) {
  const map = {
    Visit: <MapPin className="w-4 h-4" />,
    Call: <Phone className="w-4 h-4" />,
    Order: <ShoppingCart className="w-4 h-4" />,
    Note: <FileText className="w-4 h-4" />,
    Email: <Mail className="w-4 h-4" />,
  };
  return map[type];
}

function activityColor(type: ActivityType) {
  const map = {
    Visit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Call: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Order: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Note: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Email: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };
  return map[type];
}

function insightIcon(type: Insight["type"]) {
  const map = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    opportunity: <Lightbulb className="w-5 h-5 text-emerald-400" />,
    alert: <TrendingDown className="w-5 h-5 text-red-400" />,
    info: <Sparkles className="w-5 h-5 text-blue-400" />,
  };
  return map[type];
}

function insightBorder(type: Insight["type"]) {
  const map = {
    warning: "border-amber-500/30",
    opportunity: "border-emerald-500/30",
    alert: "border-red-500/30",
    info: "border-blue-500/30",
  };
  return map[type];
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  const trending = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={trending ? "#10b981" : "#ef4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "accounts", label: "My Accounts", icon: <Users className="w-4 h-4" /> },
  { key: "activity", label: "Activity Log", icon: <Clock className="w-4 h-4" /> },
  { key: "route", label: "Route Planner", icon: <Navigation className="w-4 h-4" /> },
  { key: "onboarding", label: "Customer Onboarding", icon: <Plus className="w-4 h-4" /> },
  { key: "insights", label: "Insights", icon: <Sparkles className="w-4 h-4" /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesProPage() {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<ActivityType>("Visit");
  const [logCustomer, setLogCustomer] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [logFollowUp, setLogFollowUp] = useState("");
  const [logTags, setLogTags] = useState<string[]>([]);

  // Onboarding form
  const [obName, setObName] = useState("");
  const [obContact, setObContact] = useState("");
  const [obEmail, setObEmail] = useState("");
  const [obPhone, setObPhone] = useState("");
  const [obType, setObType] = useState<BusinessType>("Restaurant");
  const [obAddress, setObAddress] = useState("");
  const [obEstValue, setObEstValue] = useState("");
  const [obDelivery, setObDelivery] = useState<string[]>([]);
  const [obTerms, setObTerms] = useState("Net 14");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#0a0a14]">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                Sales Pro
              </h1>
              <p className="text-sm text-white/50 mt-1">Field sales management for your accounts</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300">
                CM
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Ciaran Murphy</p>
                <p className="text-xs text-white/40">Dublin & Galway Region</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "My Accounts", value: "34", icon: <Users className="w-5 h-5" />, color: "text-blue-400" },
              { label: "Revenue This Month", value: formatEur(187400), icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-400" },
              { label: "Visits This Week", value: "12", icon: <MapPin className="w-5 h-5" />, color: "text-purple-400" },
              { label: "At-Risk Accounts", value: "4", icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-400" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a14] border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</span>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#0a0a14]/80 sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab Content ────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: MY ACCOUNTS                                        */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "accounts" && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search */}
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a14] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <span className="text-sm text-white/40">{filteredCustomers.length} accounts</span>
              </div>

              {/* Table */}
              <div className="bg-[#0a0a14] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Customer</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Location</th>
                        <th className="text-left px-4 py-3">Health</th>
                        <th className="text-left px-4 py-3">Last Order</th>
                        <th className="text-left px-4 py-3">Frequency</th>
                        <th className="text-right px-4 py-3">Avg Monthly</th>
                        <th className="text-left px-4 py-3">Last Visit</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((c) => {
                        const isExpanded = expandedRow === c.id;
                        const days = daysAgo(c.lastOrder);
                        return (
                          <motion.tbody key={c.id} layout>
                            <tr
                              className={cn(
                                "border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors",
                                isExpanded && "bg-white/[0.03]"
                              )}
                              onClick={() => setExpandedRow(isExpanded ? null : c.id)}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                                  )}
                                  <span className="font-medium text-white">{c.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-white/60">{c.type}</td>
                              <td className="px-4 py-3 text-white/60">{c.location}</td>
                              <td className="px-4 py-3">{healthBadge(c.healthScore)}</td>
                              <td className="px-4 py-3">
                                <div className="text-white/70">{new Date(c.lastOrder).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</div>
                                <div className="text-xs text-white/40">{days === 0 ? "Today" : `${days}d ago`}</div>
                              </td>
                              <td className="px-4 py-3">{freqBadge(c.orderFrequency)}</td>
                              <td className="px-4 py-3 text-right font-medium text-white/80">{formatEur(c.avgMonthlyValue)}</td>
                              <td className="px-4 py-3 text-white/50 text-xs">
                                {new Date(c.lastVisit).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                  {[
                                    { icon: <ShoppingCart className="w-3.5 h-3.5" />, label: "Place Order" },
                                    { icon: <Eye className="w-3.5 h-3.5" />, label: "View History" },
                                    { icon: <MapPin className="w-3.5 h-3.5" />, label: "Log Visit" },
                                    { icon: <Phone className="w-3.5 h-3.5" />, label: "Call" },
                                  ].map((action) => (
                                    <button
                                      key={action.label}
                                      title={action.label}
                                      className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-blue-400 transition-colors"
                                    >
                                      {action.icon}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Detail */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="px-0">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[#0d0d1a] border-y border-white/5"
                                  >
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                                      {/* Top Products */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
                                          <Star className="w-3.5 h-3.5" /> Top 5 Products
                                        </h4>
                                        <div className="space-y-2">
                                          {c.topProducts.map((p) => (
                                            <div key={p.name} className="flex items-center justify-between text-sm">
                                              <span className="text-white/70 truncate mr-2">{p.name}</span>
                                              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                                                <span className="text-white/40">{p.monthlyQty}/mo</span>
                                                <span className="text-emerald-400 font-medium">{formatEur(p.monthlyValue)}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Upsell + Trend */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
                                          <Target className="w-3.5 h-3.5" /> Upsell Opportunities
                                        </h4>
                                        <div className="space-y-1.5 mb-5">
                                          {c.upsellOpportunities.map((opp) => (
                                            <div key={opp} className="flex items-center gap-2 text-sm">
                                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                              <span className="text-amber-300/80">{opp}</span>
                                            </div>
                                          ))}
                                        </div>

                                        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-2">
                                          <BarChart3 className="w-3.5 h-3.5" /> 6-Month Trend
                                        </h4>
                                        <MiniSparkline data={c.orderTrend} />
                                        <div className="flex items-center justify-between text-xs text-white/30 mt-1">
                                          <span>Nov</span>
                                          <span>Apr</span>
                                        </div>
                                      </div>

                                      {/* Last Visit Notes */}
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
                                          <MessageSquare className="w-3.5 h-3.5" /> Last Visit Notes
                                        </h4>
                                        <p className="text-sm text-white/60 leading-relaxed bg-white/[0.03] rounded-lg p-3 border border-white/5">
                                          {c.lastVisitNotes}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
                                          <User className="w-3 h-3" />
                                          <span>{c.contactName}</span>
                                          <span>|</span>
                                          <Phone className="w-3 h-3" />
                                          <span>{c.contactPhone}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </motion.tbody>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: ACTIVITY LOG                                       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Activity Log</h2>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Log Activity
                </button>
              </div>

              <div className="space-y-1">
                {activities.map((act, i) => {
                  const dt = new Date(act.timestamp);
                  const time = dt.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
                  const date = dt.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
                  return (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-4 py-4 px-4 bg-[#0a0a14] border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                    >
                      {/* Icon */}
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border", activityColor(act.type))}>
                        {activityIcon(act.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", activityColor(act.type))}>
                            {act.type}
                          </span>
                          <span className="text-sm font-medium text-blue-400">{act.customer}</span>
                          {act.tags?.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/40 border border-white/10">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">{act.description}</p>
                      </div>

                      {/* Time */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-white/50">{date}</div>
                        <div className="text-xs text-white/30">{time}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Log Activity Modal */}
              <AnimatePresence>
                {showLogModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowLogModal(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#0d0d1a] border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold">Log Activity</h3>
                        <button onClick={() => setShowLogModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/40">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Type */}
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Type</label>
                          <div className="flex gap-2">
                            {(["Visit", "Call", "Note", "Email"] as ActivityType[]).map((t) => (
                              <button
                                key={t}
                                onClick={() => setLogType(t)}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                  logType === t
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/20"
                                )}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Customer */}
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Customer</label>
                          <select
                            value={logCustomer}
                            onChange={(e) => setLogCustomer(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#0a0a14] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                          >
                            <option value="">Select customer...</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Description</label>
                          <textarea
                            value={logDescription}
                            onChange={(e) => setLogDescription(e.target.value)}
                            rows={3}
                            placeholder="What happened?"
                            className="w-full px-3 py-2.5 bg-[#0a0a14] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 resize-none"
                          />
                        </div>

                        {/* Follow-up */}
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Follow-up Date (optional)</label>
                          <input
                            type="date"
                            value={logFollowUp}
                            onChange={(e) => setLogFollowUp(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#0a0a14] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                          />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Tags</label>
                          <div className="flex gap-2 flex-wrap">
                            {["Sales", "Support", "Complaint", "Opportunity"].map((tag) => (
                              <button
                                key={tag}
                                onClick={() =>
                                  setLogTags((prev) =>
                                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                  )
                                }
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                                  logTags.includes(tag)
                                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                                )}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => setShowLogModal(false)}
                          className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
                        >
                          Cancel
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                          <Send className="w-4 h-4" />
                          Log Activity
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 3: ROUTE PLANNER                                      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "route" && (
            <motion.div
              key="route"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold">Today&apos;s Route</h2>
                  <p className="text-sm text-white/40">Friday, 4 April 2026 — Dublin Region</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 text-white/70 rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Stop
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    <Route className="w-4 h-4" />
                    Optimise Route
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stops */}
                <div className="lg:col-span-2 space-y-3">
                  {routeStops.map((stop, i) => (
                    <motion.div
                      key={stop.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 p-4 bg-[#0a0a14] border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                        {stop.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white">{stop.customer}</h3>
                          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{stop.estimatedDuration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{stop.address}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {stop.timeWindow}
                          </span>
                          <span className="text-white/50">{stop.purpose}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Summary bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a14] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white/50">Total Time:</span>
                        <span className="font-medium">4h 20m</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-blue-400" />
                        <span className="text-white/50">Total Distance:</span>
                        <span className="font-medium">87km</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CircleDot className="w-4 h-4 text-emerald-400" />
                      <span className="text-white/50">{routeStops.length} stops</span>
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-blue-400/50" />
                  </div>
                  <p className="text-sm text-white/30 mb-1">Map View</p>
                  <p className="text-xs text-white/20 text-center">Route visualisation will appear here when connected to mapping service</p>
                  <div className="mt-4 w-full space-y-2">
                    {routeStops.map((stop) => (
                      <div key={stop.id} className="flex items-center gap-2 text-xs text-white/30">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold flex-shrink-0">
                          {stop.order}
                        </div>
                        <span className="truncate">{stop.customer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 4: CUSTOMER ONBOARDING                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "onboarding" && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                  <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-1">Onboard New Customer</h2>
                    <p className="text-sm text-white/40 mb-6">Quickly register a new account from the field</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Business Name */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Business Name</label>
                        <input
                          type="text"
                          value={obName}
                          onChange={(e) => setObName(e.target.value)}
                          placeholder="e.g. The Brazen Head"
                          className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>

                      {/* Contact Name */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Contact Name</label>
                        <input
                          type="text"
                          value={obContact}
                          onChange={(e) => setObContact(e.target.value)}
                          placeholder="e.g. Sean Gallagher"
                          className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Email</label>
                        <input
                          type="email"
                          value={obEmail}
                          onChange={(e) => setObEmail(e.target.value)}
                          placeholder="sean@brazenhead.ie"
                          className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Phone</label>
                        <input
                          type="tel"
                          value={obPhone}
                          onChange={(e) => setObPhone(e.target.value)}
                          placeholder="+353 1 xxx xxxx"
                          className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>

                      {/* Business Type */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Business Type</label>
                        <select
                          value={obType}
                          onChange={(e) => setObType(e.target.value as BusinessType)}
                          className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                        >
                          {(["Restaurant", "Hotel", "Café", "Pub", "Retailer"] as BusinessType[]).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Monthly Value */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Est. Monthly Order Value</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
                          <input
                            type="text"
                            value={obEstValue}
                            onChange={(e) => setObEstValue(e.target.value)}
                            placeholder="3,500"
                            className="w-full pl-7 pr-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                      </div>

                      {/* Address (full width) */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Address</label>
                        <input
                          type="text"
                          value={obAddress}
                          onChange={(e) => setObAddress(e.target.value)}
                          placeholder="20 Lower Bridge Street, Dublin 8"
                          className="w-full px-3 py-2.5 bg-[#050510] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>

                      {/* Delivery Preference */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Delivery Days</label>
                        <div className="flex gap-2">
                          {["Mon", "Wed", "Fri"].map((day) => (
                            <button
                              key={day}
                              onClick={() =>
                                setObDelivery((prev) =>
                                  prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                                )
                              }
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex-1",
                                obDelivery.includes(day)
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Payment Terms */}
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Payment Terms</label>
                        <div className="flex gap-2">
                          {["Net 7", "Net 14", "Net 30"].map((term) => (
                            <button
                              key={term}
                              onClick={() => setObTerms(term)}
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex-1",
                                obTerms === term
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                              )}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                        Create Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recently Onboarded */}
                <div>
                  <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-400" />
                      Recently Onboarded
                    </h3>
                    <div className="space-y-3">
                      {recentOnboards.map((ro) => (
                        <div key={ro.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-white">{ro.name}</p>
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <span>{ro.type}</span>
                              <span>|</span>
                              <span>{new Date(ro.date).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}</span>
                            </div>
                          </div>
                          <span className="text-sm text-emerald-400 font-medium">{formatEur(ro.estimatedValue)}/mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 5: INSIGHTS                                           */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Sales Insights</h2>
                  <p className="text-sm text-white/40">Personalised recommendations based on your account activity</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, i) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "bg-[#0a0a14] border rounded-xl p-5 hover:bg-white/[0.02] transition-colors",
                      insightBorder(insight.type)
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{insightIcon(insight.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm text-white/80 leading-relaxed mb-4">{insight.message}</p>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs font-medium text-white/70 hover:text-white transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                          {insight.actionLabel}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
