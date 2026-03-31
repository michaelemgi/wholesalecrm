// @ts-nocheck
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, DollarSign, AlertTriangle, Search, LayoutGrid, List,
  Filter, ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, TrendingDown,
  X, ExternalLink, Tag, Download, Plus, Star, Globe, ShoppingBag,
  Building2, Layers, FlaskConical, Rocket, Beaker, Lightbulb,
  ChevronRight, Eye, ShoppingCart, Clock, MapPin, Truck,
  GripVertical, Calendar, Target, Users, FileText, BarChart3,
  BookOpen, Utensils, CheckCircle2, Circle, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Product } from "@/types";

// ─── Constants ─────────────────────────────────────────────────────
const categories = ["All", "Food & Beverage", "Building Materials", "Packaging", "Industrial", "Chemicals", "Agriculture", "Paper Goods"];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  "Low Stock": { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  "Out of Stock": { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  Discontinued: { bg: "bg-gray-500/15", text: "text-gray-400", dot: "bg-gray-400" },
};

const categoryIcons: Record<string, React.ElementType> = {
  "Food & Beverage": Utensils,
  "Building Materials": Building2,
  "Packaging": Package,
  "Industrial": Target,
  "Chemicals": Beaker,
  "Agriculture": Globe,
  "Paper Goods": FileText,
};

const categoryColors: Record<string, string> = {
  "Food & Beverage": "from-orange-500/20 to-amber-500/10 border-orange-500/30",
  "Building Materials": "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
  "Packaging": "from-purple-500/20 to-pink-500/10 border-purple-500/30",
  "Industrial": "from-slate-500/20 to-gray-500/10 border-slate-500/30",
  "Chemicals": "from-green-500/20 to-emerald-500/10 border-green-500/30",
  "Agriculture": "from-lime-500/20 to-green-500/10 border-lime-500/30",
  "Paper Goods": "from-yellow-500/20 to-orange-500/10 border-yellow-500/30",
};

// ─── NPD Pipeline Mock Data ───────────────────────────────────────
const npdStages = ["Concept", "Research", "Prototype", "Testing", "Launch Ready", "Launched"] as const;
const npdStageColors: Record<string, string> = {
  Concept: "border-purple-500/40 bg-purple-500/5",
  Research: "border-blue-500/40 bg-blue-500/5",
  Prototype: "border-amber-500/40 bg-amber-500/5",
  Testing: "border-cyan-500/40 bg-cyan-500/5",
  "Launch Ready": "border-emerald-500/40 bg-emerald-500/5",
  Launched: "border-green-500/40 bg-green-500/5",
};
const npdStageDot: Record<string, string> = {
  Concept: "bg-purple-400",
  Research: "bg-blue-400",
  Prototype: "bg-amber-400",
  Testing: "bg-cyan-400",
  "Launch Ready": "bg-emerald-400",
  Launched: "bg-green-400",
};

const pipelineItems = [
  { id: "npd-1", name: "Organic Honey Granola Bars", stage: "Testing", targetLaunch: "Apr 15, 2026", estimatedCost: 28000, potentialRevenue: 120000, owner: "Sarah Mitchell", progress: 75, notes: "Consumer taste tests in progress. 87% approval rate so far." },
  { id: "npd-2", name: "Eco-Friendly Bubble Wrap Alternative", stage: "Prototype", targetLaunch: "May 20, 2026", estimatedCost: 45000, potentialRevenue: 200000, owner: "David Lee", progress: 50, notes: "Cornstarch-based prototype v3 performing well in drop tests." },
  { id: "npd-3", name: "Industrial Degreaser Pro Max", stage: "Launch Ready", targetLaunch: "Apr 1, 2026", estimatedCost: 15000, potentialRevenue: 85000, owner: "Rachel Green", progress: 95, notes: "FDA approval received. Packaging finalized. Ready for distribution." },
  { id: "npd-4", name: "Premium Kraft Paper Gift Bags", stage: "Research", targetLaunch: "Jun 10, 2026", estimatedCost: 12000, potentialRevenue: 55000, owner: "Adam Groogan", progress: 30, notes: "Evaluating sustainable ink options and supplier bids." },
  { id: "npd-5", name: "Cold-Pressed Avocado Oil 5L", stage: "Concept", targetLaunch: "Jul 1, 2026", estimatedCost: 35000, potentialRevenue: 160000, owner: "Sarah Mitchell", progress: 10, notes: "Initial market research shows strong demand in food service sector." },
  { id: "npd-6", name: "Reinforced Concrete Adhesive X200", stage: "Testing", targetLaunch: "Apr 20, 2026", estimatedCost: 22000, potentialRevenue: 95000, owner: "David Lee", progress: 70, notes: "Lab testing with 3 construction companies. Results due next week." },
  { id: "npd-7", name: "Biodegradable Pallet Wrap", stage: "Launched", targetLaunch: "Mar 1, 2026", estimatedCost: 18000, potentialRevenue: 75000, owner: "Rachel Green", progress: 100, notes: "Successfully launched. First month sales exceeded projections by 22%." },
  { id: "npd-8", name: "Nitrogen-Rich Soil Booster", stage: "Concept", targetLaunch: "Aug 15, 2026", estimatedCost: 40000, potentialRevenue: 180000, owner: "Adam Groogan", progress: 5, notes: "Partnership discussions with AgriTech Labs underway." },
  { id: "npd-9", name: "Smart Temperature Labels", stage: "Prototype", targetLaunch: "Jun 1, 2026", estimatedCost: 55000, potentialRevenue: 250000, owner: "Sarah Mitchell", progress: 45, notes: "Color-changing ink formula finalized. Testing adhesive backing." },
  { id: "npd-10", name: "Plant-Based Cleaning Pods", stage: "Research", targetLaunch: "Jul 15, 2026", estimatedCost: 20000, potentialRevenue: 110000, owner: "David Lee", progress: 25, notes: "Benchmarking against top 5 competitors. Formulation R&D started." },
];

const innovationIdeas = [
  { id: "idea-1", title: "AI-Powered Inventory Labels", description: "QR labels that auto-update stock counts when scanned during receiving. Integrates with WholesaleOS.", targetMarket: "Warehouse & Distribution", estimatedROI: "340%", votes: 14, status: "Under Review" },
  { id: "idea-2", title: "Compostable Food Containers", description: "100% plant-based containers for food service. Zero plastic. Competitive pricing with traditional options.", targetMarket: "Food Service & Restaurants", estimatedROI: "220%", votes: 21, status: "Approved" },
  { id: "idea-3", title: "Bulk Spice Subscription Kits", description: "Monthly curated spice kits for restaurants. Pre-portioned for commercial kitchens with recipe cards.", targetMarket: "Restaurants & Catering", estimatedROI: "180%", votes: 8, status: "New" },
  { id: "idea-4", title: "Solar-Powered Pest Deterrent", description: "Ultrasonic pest control for agricultural storage facilities. Chemical-free, maintenance-free.", targetMarket: "Agriculture & Storage", estimatedROI: "290%", votes: 11, status: "Under Review" },
  { id: "idea-5", title: "Recycled Paper Insulation Rolls", description: "Made from 95% post-consumer waste. R-value competitive with fiberglass at 30% lower cost.", targetMarket: "Construction & Building", estimatedROI: "260%", votes: 17, status: "Approved" },
  { id: "idea-6", title: "Water-Soluble Packaging Film", description: "Dissolvable film for single-use chemical portions. Eliminates measuring errors and spills.", targetMarket: "Chemicals & Cleaning", estimatedROI: "310%", votes: 9, status: "New" },
];

const recipeLabItems = [
  { id: "recipe-1", name: "Artisan Sourdough Bread Mix", ingredients: ["Organic Wheat Flour", "Sea Salt", "Dried Sourdough Starter", "Malted Barley"], method: "Combine dry ingredients. Add water (65% hydration). Bulk ferment 4hrs. Shape, proof overnight, bake at 450°F.", linkedProducts: ["prod-flour-01", "prod-salt-02"], costPerServing: 0.45, devStatus: "Ready", servings: 24 },
  { id: "recipe-2", name: "Commercial BBQ Sauce Concentrate", ingredients: ["Tomato Paste", "Apple Cider Vinegar", "Brown Sugar", "Smoked Paprika", "Worcestershire"], method: "Combine in industrial mixer. Heat to 185°F for pasteurization. Cool and bottle. Dilute 1:3 for serving.", linkedProducts: ["prod-tomato-05", "prod-vinegar-03"], costPerServing: 0.32, devStatus: "Testing", servings: 200 },
  { id: "recipe-3", name: "Eco Cleaning Solution All-Purpose", ingredients: ["Citric Acid", "Sodium Bicarbonate", "Essential Oil Blend", "Surfactant Base"], method: "Mix dry components. Add surfactant slowly. Incorporate essential oils last. pH target: 5.5-6.0.", linkedProducts: ["prod-citric-01", "prod-bicarb-02"], costPerServing: 0.18, devStatus: "Approved", servings: 500 },
  { id: "recipe-4", name: "Premium Trail Mix Blend", ingredients: ["Roasted Almonds", "Dark Chocolate Chips", "Dried Cranberries", "Pumpkin Seeds", "Coconut Flakes"], method: "Combine in proportioned layers. Tumble mix for 90 seconds. Package in nitrogen-flushed bags.", linkedProducts: ["prod-almond-01", "prod-choc-03"], costPerServing: 0.85, devStatus: "Ready", servings: 100 },
  { id: "recipe-5", name: "Industrial Concrete Sealer Mix", ingredients: ["Silicate Solution", "Lithium Hardener", "Anti-Dusting Agent", "UV Stabilizer"], method: "Blend silicate with hardener at 3:1 ratio. Add anti-dusting agent at 2%. UV stabilizer at 0.5%. Mix for 15 min.", linkedProducts: ["prod-silicate-01"], costPerServing: 2.10, devStatus: "Testing", servings: 50 },
];

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, index, subtext }: {
  label: string; value: string; icon: React.ElementType; color: string; bg: string; index: number; subtext?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-5 hover:border-border-light transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <div className="text-2xl font-bold font-heading text-text-primary">{value}</div>
      {subtext && <p className="text-xs text-text-muted mt-1">{subtext}</p>}
    </motion.div>
  );
}

// ─── Stock Indicator ───────────────────────────────────────────────
function StockIndicator({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.Active;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {status === "Active" ? "In Stock" : status}
    </span>
  );
}

// ─── Product Detail Drawer ─────────────────────────────────────────
function ProductDetailDrawer({ product, onClose }: { product: Product; onClose: () => void }) {
  const priceTiers = [
    { label: "Unit Price", value: product.unitPrice, color: "text-text-muted" },
    { label: "Wholesale", value: product.wholesalePrice, color: "text-primary" },
    { label: "Tier 1", value: product.tier1Price, color: "text-emerald-400" },
    { label: "Tier 2", value: product.tier2Price, color: "text-blue-400" },
    { label: "Tier 3", value: product.tier3Price, color: "text-purple-400" },
    { label: "VIP", value: product.vipPrice, color: "text-amber-400" },
  ];

  const tags = product.tags ? product.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
  const capacity = product.reorderPoint * 4;
  const stockPct = Math.min((product.stockLevel / capacity) * 100, 100);
  const stockColor = stockPct > 50 ? "bg-emerald-500" : stockPct > 25 ? "bg-amber-500" : "bg-red-500";

  // Mock order history
  const orderHistory = [
    { date: "Mar 25, 2026", customer: "Metro Foods Corp", qty: 250, total: product.wholesalePrice * 250 },
    { date: "Mar 18, 2026", customer: "BuildRight Supplies", qty: 100, total: product.tier1Price * 100 },
    { date: "Mar 10, 2026", customer: "Pacific Trading Co", qty: 500, total: product.tier2Price * 500 },
    { date: "Feb 28, 2026", customer: "Greenfield Organics", qty: 150, total: product.wholesalePrice * 150 },
    { date: "Feb 20, 2026", customer: "Atlas Industries", qty: 75, total: product.tier1Price * 75 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-[720px] max-w-full bg-background border-l border-border overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-20 w-20 rounded-xl object-cover border border-border" />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{product.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                </div>
              )}
              <div>
                <h2 className="font-heading text-xl font-bold text-text-primary">{product.name}</h2>
                {product.brand && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-primary font-medium">{product.brand}</span>
                    {product.brandWebsite && (
                      <a href={product.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", statusConfig[product.status]?.bg, statusConfig[product.status]?.text)}>{product.status}</span>
                  <span className="text-xs text-text-muted">SKU: {product.sku}</span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-hover text-xs text-text-secondary">{product.category}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Pricing Tiers */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Pricing Tiers</h3>
            <div className="grid grid-cols-3 gap-3">
              {priceTiers.map((tier) => (
                <div key={tier.label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <p className="text-xs text-text-muted mb-1">{tier.label}</p>
                  <p className={cn("text-lg font-bold font-heading", tier.color)}>{formatCurrency(tier.value)}</p>
                  {tier.label !== "Unit Price" && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {((1 - tier.value / product.unitPrice) * -100).toFixed(0)}% vs unit
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Stock Information</h3>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Current Stock</p>
                    <p className="text-sm font-semibold text-text-primary">{formatNumber(product.stockLevel)} {product.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Reorder Point</p>
                    <p className="text-sm font-semibold text-text-primary">{formatNumber(product.reorderPoint)} {product.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Warehouse</p>
                    <p className="text-sm font-semibold text-text-primary">{product.warehouse}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Lead Time</p>
                    <p className="text-sm font-semibold text-text-primary">{product.leadTimeDays} days</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1.5">
                  <span>Stock Level</span>
                  <span>{stockPct.toFixed(0)}% of capacity</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-hover overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stockPct}%` }} transition={{ duration: 0.8 }} className={cn("h-full rounded-full", stockColor)} />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Supplier</h3>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{product.supplier}</p>
                <p className="text-xs text-text-muted">Location: {product.warehouseLocation}</p>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Orders</h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Customer</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3">Qty</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((order, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-secondary">{order.date}</td>
                      <td className="px-4 py-3 text-sm text-text-primary font-medium">{order.customer}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right">{formatNumber(order.qty)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-400 font-semibold text-right">{formatCurrency(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function ProductsPage() {
  const { data: products = [], mutate } = useSWR<Product[]>("/api/products", fetcher);

  // State
  const [activeTab, setActiveTab] = useState<"catalog" | "brands" | "categories" | "pricelist" | "npd">("catalog");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "newest" | "stock">("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceListFilter, setPriceListFilter] = useState("All");
  const [priceListBrandFilter, setPriceListBrandFilter] = useState("All");

  // Tabs
  const tabs = [
    { key: "catalog", label: "Product Catalog", icon: LayoutGrid },
    { key: "brands", label: "Brands Directory", icon: Building2 },
    { key: "categories", label: "Categories", icon: Layers },
    { key: "pricelist", label: "Price Lists", icon: DollarSign },
    { key: "npd", label: "NPD & Innovation", icon: FlaskConical },
  ];

  // Derived data
  const allBrands = useMemo(() => {
    const brandMap = new Map<string, { name: string; website?: string; products: Product[]; categories: Set<string> }>();
    products.forEach((p) => {
      const brand = p.brand || "Unbranded";
      if (!brandMap.has(brand)) {
        brandMap.set(brand, { name: brand, website: p.brandWebsite, products: [], categories: new Set() });
      }
      const b = brandMap.get(brand)!;
      b.products.push(p);
      b.categories.add(p.category);
      if (p.brandWebsite && !b.website) b.website = p.brandWebsite;
    });
    return Array.from(brandMap.values()).sort((a, b) => b.products.length - a.products.length);
  }, [products]);

  const brandNames = useMemo(() => ["All", ...allBrands.filter(b => b.name !== "Unbranded").map(b => b.name)], [allBrands]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.brand && p.brand.toLowerCase().includes(s)) || (p.tags && p.tags.toLowerCase().includes(s)));
    }
    if (categoryFilter !== "All") filtered = filtered.filter((p) => p.category === categoryFilter);
    if (statusFilter !== "All") filtered = filtered.filter((p) => p.status === statusFilter);
    if (brandFilter !== "All") filtered = filtered.filter((p) => p.brand === brandFilter);
    filtered = filtered.filter((p) => p.wholesalePrice >= priceRange[0] && p.wholesalePrice <= priceRange[1]);

    switch (sortBy) {
      case "name": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": filtered.sort((a, b) => a.wholesalePrice - b.wholesalePrice); break;
      case "price-desc": filtered.sort((a, b) => b.wholesalePrice - a.wholesalePrice); break;
      case "newest": filtered.sort((a, b) => new Date(b.expiryDate || 0).getTime() - new Date(a.expiryDate || 0).getTime()); break;
      case "stock": filtered.sort((a, b) => a.stockLevel - b.stockLevel); break;
    }
    return filtered;
  }, [products, search, categoryFilter, statusFilter, brandFilter, priceRange, sortBy]);

  // KPI calculations
  const totalProducts = products.length;
  const activeBrands = allBrands.filter(b => b.name !== "Unbranded").length;
  const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.wholesalePrice, 0) / products.length : 0;
  const lowStockCount = products.filter((p) => p.status === "Low Stock" || p.status === "Out of Stock").length;

  // Category stats
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { count: number; totalValue: number }>();
    categories.filter(c => c !== "All").forEach(cat => stats.set(cat, { count: 0, totalValue: 0 }));
    products.forEach((p) => {
      const s = stats.get(p.category);
      if (s) {
        s.count++;
        s.totalValue += p.wholesalePrice * p.stockLevel;
      }
    });
    return stats;
  }, [products]);

  const totalCatalogValue = useMemo(() => {
    let total = 0;
    categoryStats.forEach(v => total += v.totalValue);
    return total;
  }, [categoryStats]);

  // Price list filtered products
  const priceListProducts = useMemo(() => {
    let filtered = [...products];
    if (priceListFilter !== "All") filtered = filtered.filter(p => p.category === priceListFilter);
    if (priceListBrandFilter !== "All") filtered = filtered.filter(p => p.brand === priceListBrandFilter);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, priceListFilter, priceListBrandFilter]);

  const handleExportPriceList = useCallback(() => {
    exportToCSV(priceListProducts.map(p => ({
      SKU: p.sku,
      Name: p.name,
      Brand: p.brand || "—",
      Category: p.category,
      UnitPrice: p.unitPrice,
      Wholesale: p.wholesalePrice,
      Tier1: p.tier1Price,
      Tier2: p.tier2Price,
      Tier3: p.tier3Price,
      VIP: p.vipPrice,
      Status: p.status,
    })), "price-list", [
      { key: "SKU", label: "SKU" },
      { key: "Name", label: "Product Name" },
      { key: "Brand", label: "Brand" },
      { key: "Category", label: "Category" },
      { key: "UnitPrice", label: "Unit Price" },
      { key: "Wholesale", label: "Wholesale" },
      { key: "Tier1", label: "Tier 1" },
      { key: "Tier2", label: "Tier 2" },
      { key: "Tier3", label: "Tier 3" },
      { key: "VIP", label: "VIP" },
      { key: "Status", label: "Status" },
    ]);
  }, [priceListProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-muted mt-1">Complete product catalog, brands, pricing, and innovation pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPriceList} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-light transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Products" value={formatNumber(totalProducts)} icon={Package} color="text-primary" bg="bg-primary/10" index={0} />
        <StatCard label="Active Brands" value={formatNumber(activeBrands)} icon={Building2} color="text-blue-400" bg="bg-blue-500/10" index={1} />
        <StatCard label="Avg Wholesale Price" value={formatCurrency(avgPrice)} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/10" index={2} />
        <StatCard label="Low Stock Alerts" value={formatNumber(lowStockCount)} icon={AlertTriangle} color="text-amber-400" bg="bg-amber-500/10" index={3} subtext={lowStockCount > 0 ? "Requires attention" : "All stocked"} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                activeTab === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ TAB 1: PRODUCT CATALOG ═══════════════ */}
      {activeTab === "catalog" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, brand, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors", showFilters ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-text-secondary hover:border-border-light")}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={cn("p-2.5 transition-colors", viewMode === "grid" ? "bg-primary text-white" : "bg-background text-text-muted hover:text-text-primary")}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={cn("p-2.5 transition-colors", viewMode === "list" ? "bg-primary text-white" : "bg-background text-text-muted hover:text-text-primary")}>
                  <List className="h-4 w-4" />
                </button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-secondary outline-none focus:border-primary">
                <option value="name">Sort: Name</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="stock">Stock: Low → High</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-4 mt-4 border-t border-border grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Category</label>
                      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary">
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Brand</label>
                      <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary">
                        {brandNames.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Status</label>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary">
                        <option value="All">All</option>
                        <option value="Active">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5 block">Price Range</label>
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder="Min" value={priceRange[0] || ""} onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary" />
                        <span className="text-text-muted">-</span>
                        <input type="number" placeholder="Max" value={priceRange[1] === 99999 ? "" : priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 99999])} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary" />
                      </div>
                    </div>
                  </div>
                  {(categoryFilter !== "All" || statusFilter !== "All" || brandFilter !== "All" || priceRange[0] > 0 || priceRange[1] < 99999) && (
                    <div className="pt-3 flex items-center gap-2">
                      <span className="text-xs text-text-muted">Active filters:</span>
                      {categoryFilter !== "All" && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">{categoryFilter}<button onClick={() => setCategoryFilter("All")}><X className="h-3 w-3" /></button></span>}
                      {brandFilter !== "All" && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium flex items-center gap-1">{brandFilter}<button onClick={() => setBrandFilter("All")}><X className="h-3 w-3" /></button></span>}
                      {statusFilter !== "All" && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium flex items-center gap-1">{statusFilter}<button onClick={() => setStatusFilter("All")}><X className="h-3 w-3" /></button></span>}
                      <button onClick={() => { setCategoryFilter("All"); setStatusFilter("All"); setBrandFilter("All"); setPriceRange([0, 99999]); }} className="text-xs text-red-400 hover:text-red-300 ml-2">Clear all</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found</p>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product, i) => {
                const tags = product.tags ? product.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-border-light transition-all group"
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-surface-hover overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary/40">{product.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-xs font-medium text-text-secondary border border-border/50">{product.category}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <StockIndicator status={product.status} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-text-primary text-sm line-clamp-1 mb-1">{product.name}</h3>
                      {product.brand && (
                        <div className="flex items-center gap-1.5 mb-3">
                          {product.brandWebsite ? (
                            <a href={product.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {product.brand}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-primary">{product.brand}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-bold font-heading text-emerald-400">{formatCurrency(product.wholesalePrice)}</span>
                        <span className="text-xs text-text-muted line-through">{formatCurrency(product.unitPrice)}</span>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-hover text-[10px] text-text-muted">{tag}</span>
                          ))}
                          {tags.length > 3 && <span className="text-[10px] text-text-muted">+{tags.length - 3}</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedProduct(product)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                        <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-hover text-text-secondary text-xs font-medium hover:bg-surface-hover/80 transition-colors">
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Product</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Brand</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Category</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Wholesale</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Stock</th>
                    <th className="text-center text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Status</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                              <span className="text-xs font-bold text-primary">{product.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-text-primary">{product.name}</p>
                            <p className="text-xs text-text-muted">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.brand ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-primary">{product.brand}</span>
                            {product.brandWebsite && (
                              <a href={product.brandWebsite} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary"><ExternalLink className="h-3 w-3" /></a>
                            )}
                          </div>
                        ) : <span className="text-sm text-text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-surface-hover text-xs text-text-secondary">{product.category}</span></td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-emerald-400">{formatCurrency(product.wholesalePrice)}</span>
                        <span className="text-xs text-text-muted line-through ml-1">{formatCurrency(product.unitPrice)}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text-secondary">{formatNumber(product.stockLevel)}</td>
                      <td className="px-4 py-3 text-center"><StockIndicator status={product.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedProduct(product)} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"><Eye className="h-4 w-4" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"><ShoppingCart className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="py-16 text-center">
                  <Package className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted">No products found matching your filters</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════ TAB 2: BRANDS DIRECTORY ═══════════════ */}
      {activeTab === "brands" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search brands..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBrands
              .filter((b) => b.name !== "Unbranded" && b.name.toLowerCase().includes(brandSearch.toLowerCase()))
              .map((brand, i) => {
                const isExpanded = selectedBrand === brand.name;
                const catalogValue = brand.products.reduce((s, p) => s + p.wholesalePrice * p.stockLevel, 0);
                return (
                  <motion.div
                    key={brand.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className={cn("bg-card border rounded-2xl overflow-hidden transition-all cursor-pointer", isExpanded ? "border-primary col-span-full" : "border-border hover:border-border-light")}
                    onClick={() => setSelectedBrand(isExpanded ? null : brand.name)}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-primary">{brand.name.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-semibold text-text-primary truncate">{brand.name}</h3>
                            {brand.website && (
                              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary transition-colors shrink-0" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-text-muted" />
                              <span className="text-xs text-text-secondary">{brand.products.length} products</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                              <span className="text-xs text-text-secondary">{formatCurrency(catalogValue)}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Array.from(brand.categories).map((cat) => (
                              <span key={cat} className="px-2 py-0.5 rounded-md bg-surface-hover text-[10px] text-text-muted">{cat}</span>
                            ))}
                          </div>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform shrink-0", isExpanded && "rotate-180")} />
                      </div>
                    </div>

                    {/* Expanded products */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="border-t border-border px-5 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {brand.products.map((p) => (
                                <div key={p.id} className="bg-background border border-border rounded-xl p-3 flex items-center gap-3 hover:border-border-light transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}>
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold text-primary">{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span></div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                                    <p className="text-xs text-emerald-400 font-semibold">{formatCurrency(p.wholesalePrice)}</p>
                                  </div>
                                  <StockIndicator status={p.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════ TAB 3: CATEGORIES ═══════════════ */}
      {activeTab === "categories" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.filter(c => c !== "All").map((cat, i) => {
              const stats = categoryStats.get(cat) || { count: 0, totalValue: 0 };
              const CatIcon = categoryIcons[cat] || Package;
              const isSelected = selectedCategory === cat;
              const revenueShare = totalCatalogValue > 0 ? (stats.totalValue / totalCatalogValue * 100) : 0;

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={cn(
                    "bg-card border rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02]",
                    isSelected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-border-light"
                  )}
                >
                  <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 border", categoryColors[cat] || "from-gray-500/20 to-gray-500/10 border-gray-500/30")}>
                    <CatIcon className="h-6 w-6 text-text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1">{cat}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-text-secondary">{stats.count} products</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted">Catalog Value</span>
                    <span className="text-sm font-semibold text-emerald-400">{formatCurrency(stats.totalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Revenue Share</span>
                    <span className="text-sm font-medium text-text-secondary">{revenueShare.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-hover mt-3 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${revenueShare}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} className="h-full rounded-full bg-primary" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Category Products */}
          <AnimatePresence>
            {selectedCategory && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-semibold text-text-primary">{selectedCategory}</h3>
                      <span className="text-sm text-text-muted">({products.filter(p => p.category === selectedCategory).length} products)</span>
                    </div>
                    <button onClick={() => setSelectedCategory(null)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {products.filter(p => p.category === selectedCategory).map((p) => (
                        <div key={p.id} className="bg-background border border-border rounded-xl p-3 hover:border-border-light transition-colors cursor-pointer" onClick={() => setSelectedProduct(p)}>
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold text-primary">{p.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-400 font-semibold">{formatCurrency(p.wholesalePrice)}</span>
                                {p.brand && <span className="text-xs text-text-muted">by {p.brand}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══════════════ TAB 4: PRICE LISTS ═══════════════ */}
      {activeTab === "pricelist" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3">
                <select value={priceListFilter} onChange={(e) => setPriceListFilter(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-secondary outline-none focus:border-primary">
                  {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
                </select>
                <select value={priceListBrandFilter} onChange={(e) => setPriceListBrandFilter(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-text-secondary outline-none focus:border-primary">
                  {brandNames.map(b => <option key={b} value={b}>{b === "All" ? "All Brands" : b}</option>)}
                </select>
                <span className="text-sm text-text-muted">{priceListProducts.length} products</span>
              </div>
              <button onClick={handleExportPriceList} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                <Download className="h-4 w-4" />
                Export Price List
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Product</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Category</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Unit Price</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Wholesale</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Tier 1</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Tier 2</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Tier 3</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">VIP</th>
                    <th className="text-right text-xs font-medium text-text-muted px-4 py-3 uppercase tracking-wider">Best Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {priceListProducts.map((p) => {
                    const prices = [
                      { label: "Wholesale", val: p.wholesalePrice },
                      { label: "Tier 1", val: p.tier1Price },
                      { label: "Tier 2", val: p.tier2Price },
                      { label: "Tier 3", val: p.tier3Price },
                      { label: "VIP", val: p.vipPrice },
                    ];
                    const bestMargin = prices.reduce((best, cur) => {
                      const margin = ((cur.val - p.unitPrice) / p.unitPrice) * 100;
                      const bestM = ((best.val - p.unitPrice) / p.unitPrice) * 100;
                      return margin > bestM ? cur : best;
                    });
                    const marginPct = ((bestMargin.val - p.unitPrice) / p.unitPrice * 100);

                    return (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{p.name}</p>
                            <p className="text-xs text-text-muted">{p.brand || p.sku}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-surface-hover text-xs text-text-secondary">{p.category}</span></td>
                        <td className="px-4 py-3 text-right text-sm text-text-muted">{formatCurrency(p.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text-primary font-medium">{formatCurrency(p.wholesalePrice)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text-secondary">{formatCurrency(p.tier1Price)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text-secondary">{formatCurrency(p.tier2Price)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text-secondary">{formatCurrency(p.tier3Price)}</td>
                        <td className="px-4 py-3 text-right text-sm text-amber-400 font-medium">{formatCurrency(p.vipPrice)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={cn("text-sm font-semibold", marginPct > 30 ? "text-emerald-400" : marginPct > 15 ? "text-amber-400" : "text-red-400")}>
                              {marginPct.toFixed(0)}%
                            </span>
                            <span className="text-xs text-text-muted">{bestMargin.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {priceListProducts.length === 0 && (
              <div className="py-16 text-center">
                <DollarSign className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No products match your filter criteria</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══════════════ TAB 5: NPD & INNOVATION ═══════════════ */}
      {activeTab === "npd" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Pipeline Kanban */}
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Product Development Pipeline
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {npdStages.map((stage) => {
                const items = pipelineItems.filter(item => item.stage === stage);
                return (
                  <div key={stage} className="min-w-[280px] flex-shrink-0">
                    <div className={cn("rounded-2xl border p-3", npdStageColors[stage])}>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className={cn("h-2.5 w-2.5 rounded-full", npdStageDot[stage])} />
                        <h4 className="text-sm font-semibold text-text-primary">{stage}</h4>
                        <span className="ml-auto text-xs text-text-muted bg-background/50 px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="bg-card border border-border rounded-xl p-3 hover:border-border-light transition-colors">
                            <h5 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{item.name}</h5>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" />{item.targetLaunch}</span>
                                <span className="text-text-muted">{item.owner.split(" ")[0]}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-muted">Cost: {formatCurrency(item.estimatedCost)}</span>
                                <span className="text-emerald-400 font-medium">Rev: {formatCurrency(item.potentialRevenue)}</span>
                              </div>
                              {/* Progress bar */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-text-muted">Progress</span>
                                  <span className="text-text-secondary">{item.progress}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                                </div>
                              </div>
                              <p className="text-xs text-text-muted line-clamp-2 mt-1">{item.notes}</p>
                            </div>
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs text-text-muted">No items</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Innovation Ideas */}
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Innovation Ideas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {innovationIdeas.map((idea, i) => {
                const statusColors: Record<string, string> = {
                  New: "bg-blue-500/15 text-blue-400",
                  "Under Review": "bg-amber-500/15 text-amber-400",
                  Approved: "bg-emerald-500/15 text-emerald-400",
                };
                return (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-border-light transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold text-text-primary flex-1 line-clamp-2">{idea.title}</h4>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium ml-2 shrink-0", statusColors[idea.status] || statusColors.New)}>{idea.status}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3 line-clamp-3">{idea.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted flex items-center gap-1"><Target className="h-3 w-3" />Target</span>
                        <span className="text-text-secondary">{idea.targetMarket}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted flex items-center gap-1"><TrendingUp className="h-3 w-3" />Est. ROI</span>
                        <span className="text-emerald-400 font-semibold">{idea.estimatedROI}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted flex items-center gap-1"><Star className="h-3 w-3" />Votes</span>
                        <span className="text-text-secondary">{idea.votes}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recipe Lab */}
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Beaker className="h-5 w-5 text-cyan-400" />
              Recipe Lab
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recipeLabItems.map((recipe, i) => {
                const devStatusColors: Record<string, string> = {
                  Ready: "bg-emerald-500/15 text-emerald-400",
                  Testing: "bg-amber-500/15 text-amber-400",
                  Approved: "bg-blue-500/15 text-blue-400",
                };
                return (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-border-light transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{recipe.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-text-muted">{recipe.servings} servings</span>
                          <span className="text-xs text-emerald-400 font-semibold">{formatCurrency(recipe.costPerServing)}/serving</span>
                        </div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", devStatusColors[recipe.devStatus] || devStatusColors.Testing)}>{recipe.devStatus}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Ingredients</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.map((ing) => (
                            <span key={ing} className="px-2 py-0.5 rounded-md bg-surface-hover text-xs text-text-secondary">{ing}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Method</p>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{recipe.method}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Product Detail Drawer */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
