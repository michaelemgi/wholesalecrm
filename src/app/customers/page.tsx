"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Building2, DollarSign, CreditCard,
  Search, Filter, ChevronLeft, ChevronRight, X,
  Phone, Mail, MapPin, Calendar, Tag, ShoppingCart,
  MessageSquare, ArrowUpRight, Star, Clock,
  Heart, UserCheck, Plus, Trash2, Zap, ChevronDown, ChevronUp, ArrowUpDown,
  FileText, ToggleLeft, ToggleRight, ShoppingBag,
  Package, Pencil, Check, AlertCircle, Download, BarChart3,
  Upload, FileUp, FileSpreadsheet, CheckCircle2, Loader2, ArrowLeftRight,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, formatDate, timeAgo } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import BulkReportModal, { BulkReportConfig } from "@/components/BulkReportModal";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Customer, Order, Product } from "@/types";
import ClientAnalyticsDashboard from "./ClientAnalyticsDashboard";

// --- Mock Payment Cards ---
interface PaymentCard {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const mockPaymentCards: Record<string, PaymentCard[]> = {
  "cust-001": [
    { id: "card-1", brand: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
    { id: "card-2", brand: "Mastercard", last4: "8891", expiry: "03/28", isDefault: false },
  ],
  "cust-002": [
    { id: "card-3", brand: "Amex", last4: "3782", expiry: "11/27", isDefault: true },
  ],
  "cust-003": [
    { id: "card-4", brand: "Visa", last4: "1234", expiry: "06/28", isDefault: true },
    { id: "card-5", brand: "Mastercard", last4: "5678", expiry: "12/27", isDefault: false },
  ],
  "cust-004": [
    { id: "card-6", brand: "Mastercard", last4: "9012", expiry: "09/27", isDefault: true },
  ],
  "cust-005": [
    { id: "card-7", brand: "Visa", last4: "3456", expiry: "02/28", isDefault: true },
    { id: "card-8", brand: "Amex", last4: "7890", expiry: "05/27", isDefault: false },
  ],
};

const defaultCards: PaymentCard[] = [
  { id: "card-default-1", brand: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
  { id: "card-default-2", brand: "Mastercard", last4: "8891", expiry: "03/28", isDefault: false },
];

function getCustomerCards(customerId: string): PaymentCard[] {
  return mockPaymentCards[customerId] || defaultCards;
}

// --- Mock Billing Agreements ---
interface BillingAgreement {
  paymentTerms: "Net 15" | "Net 30" | "Net 60" | "Net 90" | "Due on Receipt";
  autoChargeEnabled: boolean;
  linkedCardId: string | null;
}

const mockBillingAgreements: Record<string, BillingAgreement> = {
  "cust-001": { paymentTerms: "Net 30", autoChargeEnabled: true, linkedCardId: "card-1" },
  "cust-002": { paymentTerms: "Net 60", autoChargeEnabled: false, linkedCardId: null },
  "cust-003": { paymentTerms: "Net 30", autoChargeEnabled: true, linkedCardId: "card-4" },
  "cust-004": { paymentTerms: "Net 15", autoChargeEnabled: true, linkedCardId: "card-6" },
  "cust-005": { paymentTerms: "Net 90", autoChargeEnabled: false, linkedCardId: null },
};

const defaultBilling: BillingAgreement = { paymentTerms: "Net 30", autoChargeEnabled: false, linkedCardId: null };

function getCustomerBilling(customerId: string): BillingAgreement {
  return mockBillingAgreements[customerId] || defaultBilling;
}

// --- Customer Product Pricing ---
// Each customer can have custom pricing per product. Default = retail (unitPrice).
interface CustomerProductPrice {
  productId: string;
  productName: string;
  sku: string;
  retailPrice: number;       // The base retail price from catalog
  customPrice: number;        // The customer-specific agreed price
  category: string;
  isFavourite: boolean;
}

// Generate initial customer pricing - some customers get discounts, some are at retail
function generateCustomerPricing(customer: Customer, products: Product[]): CustomerProductPrice[] {
  const seedNum = parseInt(customer.id.replace("cust-", ""), 10);
  const tierDiscount = customer.accountTier === "Enterprise" ? 0.75 : customer.accountTier === "Mid-Market" ? 0.85 : 1.0;

  // Get products that match topProducts by name, plus a few more
  const matchedProducts = products.filter(p =>
    customer.topProducts.some(tp => p.name === tp || p.name.includes(tp.split(" ")[0]))
  );

  // Add some extra products based on customer seed
  const extraProducts = products.filter(p =>
    !matchedProducts.find(mp => mp.id === p.id)
  ).slice(seedNum % 5, (seedNum % 5) + 3 + (seedNum % 4));

  const allProducts = [...matchedProducts, ...extraProducts];

  return allProducts.map((p, i) => {
    // Some products have custom negotiated pricing, others are at retail
    const hasCustomPrice = i < matchedProducts.length || Math.random() > 0.5;
    const customPrice = hasCustomPrice
      ? Math.round(p.unitPrice * tierDiscount * (0.95 + (((seedNum + i) % 7) * 0.02)))
      : p.unitPrice; // default to retail

    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      retailPrice: p.unitPrice,
      customPrice,
      category: p.category,
      isFavourite: customer.topProducts.includes(p.name),
    };
  });
}

// --- Card Brand Icon ---
function CardBrandIcon({ brand }: { brand: string }) {
  const colors: Record<string, string> = {
    Visa: "text-blue-400",
    Mastercard: "text-orange-400",
    Amex: "text-indigo-400",
  };
  return (
    <div className={cn("flex h-8 w-12 items-center justify-center rounded-md bg-surface border border-border text-[10px] font-bold uppercase tracking-wider", colors[brand] || "text-text-muted")}>
      {brand === "Visa" ? "VISA" : brand === "Mastercard" ? "MC" : "AMEX"}
    </div>
  );
}

// --- Constants ---
const CUSTOMERS_PER_PAGE = 10;

const tierConfig: Record<Customer["accountTier"], { bg: string; text: string }> = {
  Enterprise: { bg: "bg-blue-500/15", text: "text-blue-400" },
  "Mid-Market": { bg: "bg-purple-500/15", text: "text-purple-400" },
  SMB: { bg: "bg-gray-500/15", text: "text-gray-400" },
};

const orderStatusColors: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400",
  Confirmed: "bg-blue-500/20 text-blue-400",
  Processing: "bg-indigo-500/20 text-indigo-400",
  Picking: "bg-purple-500/20 text-purple-400",
  Packed: "bg-amber-500/20 text-amber-400",
  Shipped: "bg-cyan-500/20 text-cyan-400",
  Delivered: "bg-emerald-500/20 text-emerald-400",
  Returned: "bg-red-500/20 text-red-400",
};

const paymentStatusColors: Record<string, string> = {
  Unpaid: "bg-gray-500/20 text-gray-400",
  Partial: "bg-amber-500/20 text-amber-400",
  Paid: "bg-emerald-500/20 text-emerald-400",
  Overdue: "bg-red-500/20 text-red-400",
};

function getMockComms(customer: Customer) {
  return [
    { id: "c1", type: "email" as const, summary: `Email sent about updated Q2 pricing for ${customer.industry} products`, date: "2026-03-26T14:30:00Z", rep: customer.assignedRep },
    { id: "c2", type: "call" as const, summary: `Call with ${customer.primaryContact.name} - discussed upcoming bulk order plans and delivery schedule`, date: "2026-03-22T10:00:00Z", rep: customer.assignedRep },
    { id: "c3", type: "email" as const, summary: "Sent invoice reminder for outstanding balance with payment link", date: "2026-03-18T09:15:00Z", rep: customer.assignedRep },
    { id: "c4", type: "meeting" as const, summary: "Quarterly business review meeting - reviewed volume targets and pricing tiers", date: "2026-03-12T15:00:00Z", rep: customer.assignedRep },
    { id: "c5", type: "call" as const, summary: `Follow-up call re: new product line availability and potential cross-sell opportunities`, date: "2026-03-05T11:30:00Z", rep: customer.assignedRep },
  ];
}

// --- Stat Card ---
function StatCard({ label, value, icon: Icon, color, bg, index }: {
  label: string; value: string; icon: React.ElementType; color: string; bg: string; index: number;
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
    </motion.div>
  );
}

// --- Payment Score ---
function PaymentScore({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400";
  const bg = score >= 90 ? "bg-emerald-500/10" : score >= 70 ? "bg-amber-500/10" : "bg-red-500/10";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold", color, bg)}>
      {score}
    </span>
  );
}

// --- Customer Detail Panel ---
function CustomerDetailPanel({ customer, orders, products, team, onClose }: {
  customer: Customer; orders: Order[]; products: Product[]; team: { id: string; name: string; role: string }[]; onClose: () => void;
}) {
  const [detailTab, setDetailTab] = useState<"overview" | "orders" | "pricing" | "comms">("overview");
  const [favouriteProducts, setFavouriteProducts] = useState<Set<string>>(() => new Set(customer.topProducts.slice(0, 2)));
  const [showRepDropdown, setShowRepDropdown] = useState(false);
  const [assignedRep, setAssignedRep] = useState(customer.assignedRep);
  const [autoCharge, setAutoCharge] = useState(() => getCustomerBilling(customer.id).autoChargeEnabled);

  // Customer-specific pricing state
  const [customerPricing, setCustomerPricing] = useState<CustomerProductPrice[]>(() =>
    generateCustomerPricing(customer, products)
  );
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductSearch, setAddProductSearch] = useState("");
  const [addProductPrice, setAddProductPrice] = useState("");
  const [selectedNewProduct, setSelectedNewProduct] = useState<Product | null>(null);
  const [pricingSearch, setPricingSearch] = useState("");
  const [pricingSaved, setPricingSaved] = useState(false);

  const comms = getMockComms(customer);
  const customerOrders = orders.filter(o => o.customerId === customer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const lifetimeValue = customer.totalRevenue;
  const avgOrderValue = customerOrders.length > 0 ? customerOrders.reduce((s, o) => s + o.total, 0) / customerOrders.length : 0;
  const customerCards = getCustomerCards(customer.id);
  const billing = getCustomerBilling(customer.id);
  const linkedCard = customerCards.find(c => c.id === billing.linkedCardId) || customerCards.find(c => c.isDefault);

  const commIcon = (type: string) => {
    if (type === "email") return <Mail className="h-3.5 w-3.5 text-primary" />;
    if (type === "call") return <Phone className="h-3.5 w-3.5 text-success" />;
    return <MessageSquare className="h-3.5 w-3.5 text-accent" />;
  };

  const toggleFavourite = (product: string) => {
    setFavouriteProducts(prev => {
      const next = new Set(prev);
      if (next.has(product)) next.delete(product);
      else next.add(product);
      return next;
    });
  };

  // Pricing functions
  const startEditPrice = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setEditPriceValue(currentPrice.toString());
  };

  const savePrice = (productId: string) => {
    const newPrice = parseFloat(editPriceValue);
    if (isNaN(newPrice) || newPrice <= 0) return;
    setCustomerPricing(prev =>
      prev.map(p => p.productId === productId ? { ...p, customPrice: Math.round(newPrice * 100) / 100 } : p)
    );
    setEditingPrice(null);
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2000);
  };

  const resetToRetail = (productId: string) => {
    setCustomerPricing(prev =>
      prev.map(p => p.productId === productId ? { ...p, customPrice: p.retailPrice } : p)
    );
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2000);
  };

  const removeProduct = (productId: string) => {
    setCustomerPricing(prev => prev.filter(p => p.productId !== productId));
  };

  // Products available to add (not already in customer's list)
  const availableProducts = useMemo(() => {
    const existingIds = new Set(customerPricing.map(p => p.productId));
    let available = products.filter(p => !existingIds.has(p.id));
    if (addProductSearch) {
      const q = addProductSearch.toLowerCase();
      available = available.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    return available.slice(0, 10);
  }, [customerPricing, addProductSearch]);

  const addProduct = () => {
    if (!selectedNewProduct) return;
    const price = parseFloat(addProductPrice) || selectedNewProduct.unitPrice;
    setCustomerPricing(prev => [
      ...prev,
      {
        productId: selectedNewProduct.id,
        productName: selectedNewProduct.name,
        sku: selectedNewProduct.sku,
        retailPrice: selectedNewProduct.unitPrice,
        customPrice: Math.round(price * 100) / 100,
        category: selectedNewProduct.category,
        isFavourite: false,
      },
    ]);
    setSelectedNewProduct(null);
    setAddProductPrice("");
    setAddProductSearch("");
    setShowAddProduct(false);
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 2000);
  };

  // Filtered pricing
  const filteredPricing = useMemo(() => {
    if (!pricingSearch) return customerPricing;
    const q = pricingSearch.toLowerCase();
    return customerPricing.filter(p =>
      p.productName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [customerPricing, pricingSearch]);

  // Pricing stats
  const pricingStats = useMemo(() => {
    const total = customerPricing.length;
    const customCount = customerPricing.filter(p => p.customPrice !== p.retailPrice).length;
    const atRetail = total - customCount;
    const avgDiscount = total > 0
      ? customerPricing.reduce((s, p) => s + ((p.retailPrice - p.customPrice) / p.retailPrice) * 100, 0) / total
      : 0;
    return { total, customCount, atRetail, avgDiscount };
  }, [customerPricing]);

  const detailTabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "pricing" as const, label: `Products & Pricing (${customerPricing.length})` },
    { key: "orders" as const, label: `Orders (${customerOrders.length})` },
    { key: "comms" as const, label: "Communications" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[620px] max-w-[95vw] bg-surface border-l border-border z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold font-heading text-text-primary">{customer.name}</h2>
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tierConfig[customer.accountTier].bg, tierConfig[customer.accountTier].text)}>
                  {customer.accountTier}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{customer.industry}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.region}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Since {formatDate(customer.accountSince)}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-surface-hover/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary shrink-0">
                {customer.primaryContact.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{customer.primaryContact.name}</p>
                <p className="text-xs text-text-muted">{customer.primaryContact.role}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="p-2 rounded-lg bg-surface hover:bg-surface-raised border border-border transition-colors" title="Email">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                </button>
                <button className="p-2 rounded-lg bg-surface hover:bg-surface-raised border border-border transition-colors" title="Call">
                  <Phone className="h-3.5 w-3.5 text-text-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-border shrink-0 overflow-x-auto">
          {detailTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setDetailTab(tab.key)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium transition-colors relative whitespace-nowrap",
                detailTab === tab.key ? "text-primary" : "text-text-muted hover:text-text-secondary"
              )}
            >
              {tab.label}
              {detailTab === tab.key && (
                <motion.div layoutId="customer-detail-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {detailTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Lifetime Value", value: formatCurrency(lifetimeValue), icon: DollarSign, color: "text-success" },
                    { label: "Order Frequency", value: `Every ${customer.orderFrequencyDays}d`, icon: Clock, color: "text-primary" },
                    { label: "Credit Limit", value: formatCurrency(customer.creditLimit), icon: CreditCard, color: "text-info" },
                    { label: "Avg Order Value", value: formatCurrency(avgOrderValue), icon: ShoppingCart, color: "text-accent" },
                  ].map((m, i) => (
                    <div key={i} className="p-3 rounded-lg bg-surface-hover/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <m.icon className={cn("h-3 w-3", m.color)} />
                        <span className="text-xs text-text-muted">{m.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-text-primary">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Credit */}
                <div className="p-4 rounded-lg bg-surface-hover/50">
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Credit Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Credit Limit</span>
                      <span className="text-text-primary font-medium">{formatCurrency(customer.creditLimit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Outstanding Balance</span>
                      <span className="text-text-primary font-medium">{formatCurrency(customer.outstandingBalance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Available Credit</span>
                      <span className="text-success font-medium">{formatCurrency(customer.creditLimit - customer.outstandingBalance)}</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden mt-2">
                      <div
                        className={cn("h-full rounded-full", customer.outstandingBalance / customer.creditLimit > 0.8 ? "bg-red-500" : customer.outstandingBalance / customer.creditLimit > 0.5 ? "bg-amber-500" : "bg-emerald-500")}
                        style={{ width: `${Math.min((customer.outstandingBalance / customer.creditLimit) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>{((customer.outstandingBalance / customer.creditLimit) * 100).toFixed(0)}% utilized</span>
                      <span>Payment Score: <PaymentScore score={customer.paymentScore} /></span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="p-4 rounded-lg bg-surface-hover/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Payment Methods</h4>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                      <Plus className="h-3 w-3" />
                      Add Card
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {customerCards.map((card) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border"
                      >
                        <CardBrandIcon brand={card.brand} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {card.brand} ending in {card.last4}
                            </span>
                            {card.isDefault && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-text-muted">Expires {card.expiry}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Zap className="h-3 w-3" />
                            Charge
                          </button>
                          <button className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Billing & Agreements */}
                <div className="p-4 rounded-lg bg-surface-hover/50">
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Billing & Agreements</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-sm text-text-secondary">Payment Terms</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary px-2.5 py-0.5 rounded-md bg-surface border border-border">
                        {billing.paymentTerms}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-sm text-text-secondary">Auto-Charge</span>
                      </div>
                      <button
                        onClick={() => setAutoCharge(!autoCharge)}
                        className="flex items-center gap-2 transition-colors"
                      >
                        {autoCharge ? (
                          <ToggleRight className="h-6 w-6 text-primary" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-text-muted" />
                        )}
                        <span className={cn("text-xs font-medium", autoCharge ? "text-primary" : "text-text-muted")}>
                          {autoCharge ? "Enabled" : "Disabled"}
                        </span>
                      </button>
                    </div>
                    {linkedCard && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-text-muted" />
                          <span className="text-sm text-text-secondary">Linked Card</span>
                        </div>
                        <span className="text-sm text-text-primary font-medium">
                          {linkedCard.brand} ...{linkedCard.last4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favourite Products */}
                <div className="p-4 rounded-lg bg-surface-hover/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Favourite Products</h4>
                    <button
                      onClick={() => setDetailTab("pricing")}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Package className="h-3 w-3" />
                      Manage Pricing
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customer.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 group/product">
                        <button
                          onClick={() => toggleFavourite(p)}
                          className="shrink-0 transition-colors"
                          title={favouriteProducts.has(p) ? "Remove from favourites" : "Add to favourites"}
                        >
                          {favouriteProducts.has(p) ? (
                            <Heart className="h-4 w-4 text-red-400 fill-red-400" />
                          ) : (
                            <Heart className="h-4 w-4 text-text-muted group-hover/product:text-red-400/50" />
                          )}
                        </button>
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</div>
                        <span className="text-sm text-text-secondary flex-1">{p}</span>
                        {favouriteProducts.has(p) && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {favouriteProducts.size > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-2.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Quick Re-Order</span>
                      </div>
                      <div className="space-y-1.5">
                        {customer.topProducts.filter(p => favouriteProducts.has(p)).map((p, i) => (
                          <motion.div
                            key={p}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-2 rounded-md bg-surface border border-border"
                          >
                            <span className="text-xs text-text-secondary">{p}</span>
                            <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                              <ShoppingCart className="h-3 w-3" />
                              Order
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-hover text-xs text-text-secondary border border-border">
                        <Tag className="h-3 w-3 text-text-muted" />{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rep with editable dropdown */}
                <div className="p-3 rounded-lg bg-surface-hover/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {assignedRep.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-text-muted">Assigned Rep</p>
                      <p className="text-sm font-medium text-text-primary">{assignedRep}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowRepDropdown(!showRepDropdown)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary bg-surface border border-border hover:border-primary/50 transition-colors"
                      >
                        <UserCheck className="h-3 w-3" />
                        Change Rep
                        <ChevronDown className={cn("h-3 w-3 transition-transform", showRepDropdown && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {showRepDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                          >
                            <div className="py-1 max-h-48 overflow-y-auto">
                              {team
                                .filter(m => m.role !== "Operations" && m.role !== "Admin")
                                .map((member) => (
                                  <button
                                    key={member.id}
                                    onClick={() => { setAssignedRep(member.name); setShowRepDropdown(false); }}
                                    className={cn(
                                      "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-hover transition-colors",
                                      assignedRep === member.name && "bg-primary/10"
                                    )}
                                  >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent shrink-0">
                                      {member.name.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={cn("text-xs font-medium", assignedRep === member.name ? "text-primary" : "text-text-primary")}>{member.name}</p>
                                      <p className="text-[10px] text-text-muted">{member.role}</p>
                                    </div>
                                    {assignedRep === member.name && (
                                      <UserCheck className="h-3 w-3 text-primary ml-auto shrink-0" />
                                    )}
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== PRODUCTS & PRICING TAB ====== */}
            {detailTab === "pricing" && (
              <motion.div key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Pricing Stats Bar */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-surface-hover/50 text-center">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Products</p>
                    <p className="text-lg font-bold text-text-primary">{pricingStats.total}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-hover/50 text-center">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Custom</p>
                    <p className="text-lg font-bold text-primary">{pricingStats.customCount}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-hover/50 text-center">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">At Retail</p>
                    <p className="text-lg font-bold text-amber-400">{pricingStats.atRetail}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-hover/50 text-center">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Avg Discount</p>
                    <p className="text-lg font-bold text-emerald-400">{pricingStats.avgDiscount.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Quick Add Bar — always visible, search + instant add */}
                <div className="glass-card p-3 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Add Product to Price List</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Type product name or SKU to add..."
                      value={addProductSearch}
                      onChange={(e) => { setAddProductSearch(e.target.value); setSelectedNewProduct(null); }}
                      className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Instant results dropdown */}
                  {addProductSearch && !selectedNewProduct && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5 border border-border rounded-lg bg-surface">
                      {availableProducts.map((product) => {
                        const buyCost = product.wholesalePrice;
                        return (
                          <button
                            key={product.id}
                            onClick={() => {
                              // Instant add at retail price — rep edits inline in the table
                              setCustomerPricing(prev => [
                                {
                                  productId: product.id,
                                  productName: product.name,
                                  sku: product.sku,
                                  retailPrice: product.unitPrice,
                                  customPrice: product.unitPrice,
                                  category: product.category,
                                  isFavourite: false,
                                },
                                ...prev,
                              ]);
                              setAddProductSearch("");
                              setPricingSaved(true);
                              setTimeout(() => setPricingSaved(false), 2000);
                              // Auto-start editing the new product's price
                              setTimeout(() => startEditPrice(product.id, product.unitPrice), 100);
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-surface-hover transition-colors text-left"
                          >
                            <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{product.name}</p>
                              <p className="text-[10px] text-text-muted">{product.sku}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-text-muted">Cost: <span className="font-mono text-amber-400">${buyCost}</span></p>
                              <p className="text-[10px] text-text-muted">Retail: <span className="font-mono text-text-primary">${product.unitPrice}</span></p>
                            </div>
                            <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                          </button>
                        );
                      })}
                      {availableProducts.length === 0 && (
                        <p className="text-xs text-text-muted text-center py-3">No matching products found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Saved toast */}
                <AnimatePresence>
                  {pricingSaved && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Price list updated</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filter existing list */}
                {customerPricing.length > 5 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Filter price list..."
                      value={pricingSearch}
                      onChange={(e) => setPricingSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                )}

                {/* Price List — Inline Editable */}
                <div className="glass-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3">Product</th>
                        <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[75px]">Cost</th>
                        <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[130px]">Client Price</th>
                        <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[70px]">Margin</th>
                        <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPricing.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        const buyCost = product?.wholesalePrice || 0;
                        const profit = item.customPrice - buyCost;
                        const marginPct = buyCost > 0 ? ((profit / buyCost) * 100) : 0;
                        const isEditing = editingPrice === item.productId;

                        return (
                          <motion.tr
                            key={item.productId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.01 }}
                            className={cn(
                              "border-b border-border/50 last:border-0 transition-colors group",
                              isEditing ? "bg-primary/5" : "hover:bg-surface-hover/30"
                            )}
                          >
                            {/* Product */}
                            <td className="p-2.5">
                              <p className="text-xs font-medium text-text-primary leading-tight">{item.productName}</p>
                              <p className="text-[10px] text-text-muted">{item.sku}</p>
                            </td>

                            {/* Buy Cost */}
                            <td className="p-2.5 text-right">
                              <span className="text-xs font-mono text-amber-400/80">${buyCost}</span>
                            </td>

                            {/* Client Price — Always Editable Inline */}
                            <td className="p-2.5 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-xs text-text-muted">$</span>
                                  <input
                                    type="number"
                                    value={editPriceValue}
                                    onChange={(e) => setEditPriceValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === "Tab") {
                                        e.preventDefault();
                                        savePrice(item.productId);
                                        // Auto-jump to next product's price
                                        const currentIdx = filteredPricing.findIndex(p => p.productId === item.productId);
                                        const nextItem = filteredPricing[currentIdx + 1];
                                        if (nextItem) {
                                          setTimeout(() => startEditPrice(nextItem.productId, nextItem.customPrice), 50);
                                        }
                                      }
                                      if (e.key === "Escape") setEditingPrice(null);
                                    }}
                                    autoFocus
                                    className="w-20 text-center text-sm font-mono font-bold bg-surface border-2 border-primary rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    onClick={() => {
                                      savePrice(item.productId);
                                      const currentIdx = filteredPricing.findIndex(p => p.productId === item.productId);
                                      const nextItem = filteredPricing[currentIdx + 1];
                                      if (nextItem) {
                                        setTimeout(() => startEditPrice(nextItem.productId, nextItem.customPrice), 50);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                    title="Save & next (Enter/Tab)"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditPrice(item.productId, item.customPrice)}
                                  className="group/price inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-all"
                                >
                                  <span className={cn(
                                    "text-sm font-mono font-bold",
                                    item.customPrice !== item.retailPrice ? "text-primary" : "text-text-primary"
                                  )}>
                                    ${item.customPrice.toFixed(2)}
                                  </span>
                                  <Pencil className="h-3 w-3 text-primary/40 group-hover/price:text-primary transition-colors" />
                                </button>
                              )}
                            </td>

                            {/* Margin */}
                            <td className="p-2.5 text-right">
                              <span className={cn(
                                "text-xs font-bold",
                                marginPct >= 20 ? "text-emerald-400" : marginPct >= 10 ? "text-amber-400" : marginPct > 0 ? "text-red-400" : "text-red-500"
                              )}>
                                {marginPct.toFixed(0)}%
                              </span>
                              <p className={cn(
                                "text-[9px] font-mono",
                                profit >= 0 ? "text-emerald-400/60" : "text-red-400/60"
                              )}>
                                {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                              </p>
                            </td>

                            {/* Remove */}
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => removeProduct(item.productId)}
                                className="p-1 rounded text-text-muted/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredPricing.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-text-muted mx-auto mb-2" />
                      <p className="text-xs text-text-muted">No products yet. Search above to add products to this client&apos;s price list.</p>
                    </div>
                  )}
                </div>

                {/* Keyboard shortcut hint */}
                {customerPricing.length > 0 && (
                  <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted/60">
                    <span>Click any price to edit</span>
                    <span>•</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[9px]">Enter</kbd> / <kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[9px]">Tab</kbd> = save &amp; next</span>
                    <span>•</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-hover border border-border text-[9px]">Esc</kbd> = cancel</span>
                  </div>
                )}
              </motion.div>
            )}

            {detailTab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {customerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-8 w-8 text-text-muted mx-auto mb-3" />
                    <p className="text-sm text-text-muted">No orders found for this customer.</p>
                  </div>
                ) : (
                  customerOrders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{order.orderNumber}</span>
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", orderStatusColors[order.status])}>
                            {order.status}
                          </span>
                          <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", paymentStatusColors[order.paymentStatus])}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-text-primary">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span>{formatDate(order.createdAt)}</span>
                        <span>{order.items.length} items</span>
                        <span>{order.paymentTerms}</span>
                        <span>{order.shippingMethod}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {detailTab === "comms" && (
              <motion.div key="comms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0">
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  {comms.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="relative pb-5 last:pb-0"
                    >
                      <div className="absolute left-[-17px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface border-2 border-border">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="p-3 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          {commIcon(c.type)}
                          <span className="text-xs font-medium text-text-primary capitalize">{c.type}</span>
                          <span className="text-xs text-text-muted ml-auto">{timeAgo(c.date)}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{c.summary}</p>
                        <p className="text-xs text-text-muted mt-1">by {c.rep}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

// --- Main Page ---
export default function CustomersPage() {
  const { data: mockCustomers = [], mutate: mutateCustomers } = useSWR<Customer[]>('/api/customers', fetcher);
  const { data: mockOrders = [] } = useSWR<Order[]>('/api/orders', fetcher);
  const { data: mockTeam = [] } = useSWR<{ id: string; name: string; role: string }[]>('/api/team', fetcher);
  const { data: mockProducts = [] } = useSWR<Product[]>('/api/products', fetcher);

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [industryFilter, setIndustryFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageTab, setPageTab] = useState<"list" | "analytics">("list");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const clientReportConfig: BulkReportConfig = useMemo(() => ({
    title: "Client Report",
    entityName: "clients",
    buildReport: ({ currentDateRange, compareDateRange, hasCompare }) => {
      const curOrders = currentDateRange.startDate ? mockOrders.filter((o: any) => isInRange(o.createdAt, currentDateRange)) : mockOrders;
      const prevOrders = hasCompare ? mockOrders.filter((o: any) => isInRange(o.createdAt, compareDateRange)) : [];

      const pctChange = (c: number, p: number) => { if (!p) return c > 0 ? "+100%" : "—"; const ch = ((c - p) / p) * 100; return `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`; };

      const custStats: Record<string, { name: string; tier: string; industry: string; region: string; orders: number; revenue: number; products: Set<string> }> = {};
      const prevCustStats: Record<string, { orders: number; revenue: number }> = {};
      mockCustomers.forEach((c: any) => { custStats[c.id] = { name: c.name, tier: c.accountTier, industry: c.industry, region: c.region, orders: 0, revenue: 0, products: new Set() }; });
      curOrders.forEach((o: any) => {
        if (custStats[o.customerId]) { custStats[o.customerId].orders += 1; custStats[o.customerId].revenue += o.total; o.items?.forEach((i: any) => custStats[o.customerId].products.add(i.productName)); }
      });
      if (hasCompare) {
        mockCustomers.forEach((c: any) => { prevCustStats[c.id] = { orders: 0, revenue: 0 }; });
        prevOrders.forEach((o: any) => { if (prevCustStats[o.customerId]) { prevCustStats[o.customerId].orders += 1; prevCustStats[o.customerId].revenue += o.total; } });
      }

      const rows = Object.entries(custStats).map(([id, s]) => {
        const prev = prevCustStats[id];
        return {
          client: s.name, tier: s.tier, industry: s.industry, region: s.region,
          orders: s.orders, revenue: `$${s.revenue.toFixed(2)}`, products: s.products.size,
          avgOrder: s.orders > 0 ? `$${(s.revenue / s.orders).toFixed(2)}` : "$0",
          ...(hasCompare ? {
            prevOrders: prev?.orders || 0, prevRevenue: `$${(prev?.revenue || 0).toFixed(2)}`,
            orderChange: pctChange(s.orders, prev?.orders || 0), revenueChange: pctChange(s.revenue, prev?.revenue || 0),
          } : {}),
        };
      }).sort((a, b) => parseFloat(b.revenue.replace("$", "")) - parseFloat(a.revenue.replace("$", "")));

      const totalRev = Object.values(custStats).reduce((s, c) => s + c.revenue, 0);
      const prevTotalRev = hasCompare ? Object.values(prevCustStats).reduce((s, c) => s + c.revenue, 0) : 0;
      const activeClients = Object.values(custStats).filter(c => c.orders > 0).length;

      return {
        rows,
        columns: [
          { key: "client", label: "Client" }, { key: "tier", label: "Tier" }, { key: "industry", label: "Industry" },
          { key: "orders", label: "Orders" }, { key: "revenue", label: "Revenue" },
          { key: "products", label: "Products" }, { key: "avgOrder", label: "Avg Order" },
          ...(hasCompare ? [
            { key: "prevOrders", label: "Prev Orders" }, { key: "prevRevenue", label: "Prev Revenue" },
            { key: "orderChange", label: "Order Change" }, { key: "revenueChange", label: "Rev Change" },
          ] : []),
        ],
        summary: [
          { label: "Total Clients", current: String(mockCustomers.length) },
          { label: "Active Clients", current: String(activeClients) },
          { label: "Total Revenue", current: `$${totalRev.toFixed(0)}`, ...(hasCompare ? { previous: `$${prevTotalRev.toFixed(0)}`, change: pctChange(totalRev, prevTotalRev) } : {}) },
        ],
      };
    },
  }), [mockCustomers, mockOrders]);

  const tiers = ["All", "Enterprise", "Mid-Market", "SMB"];
  const regions = useMemo(() => ["All", ...Array.from(new Set(mockCustomers.map((c: any) => c.region)))], [mockCustomers]);
  const industries = useMemo(() => ["All", ...Array.from(new Set(mockCustomers.map((c: any) => c.industry)))], [mockCustomers]);

  const filtered = useMemo(() => {
    let result = mockCustomers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.primaryContact.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== "All") result = result.filter(c => c.accountTier === tierFilter);
    if (regionFilter !== "All") result = result.filter(c => c.region === regionFilter);
    if (industryFilter !== "All") result = result.filter(c => c.industry === industryFilter);
    if (dateRange.label !== "All Time") result = result.filter(c => isInRange(c.accountSince, dateRange));
    return result;
  }, [search, tierFilter, regionFilter, industryFilter, mockCustomers, dateRange]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "name": aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase(); break;
        case "totalRevenue": aVal = a.totalRevenue; bVal = b.totalRevenue; break;
        case "accountTier": aVal = a.accountTier; bVal = b.accountTier; break;
        case "lastOrderDate": aVal = a.lastOrderDate; bVal = b.lastOrderDate; break;
        case "creditLimit": aVal = a.creditLimit; bVal = b.creditLimit; break;
        case "outstandingBalance": aVal = a.outstandingBalance; bVal = b.outstandingBalance; break;
        case "paymentScore": aVal = a.paymentScore; bVal = b.paymentScore; break;
        default: aVal = a.name?.toLowerCase(); bVal = b.name?.toLowerCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  function SortHeader({ field, label, align }: { field: string; label: string; align?: string }) {
    const active = sortField === field;
    return (
      <th
        onClick={() => { if (active) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("asc"); } }}
        className={cn("py-3 px-4 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors select-none", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left", active ? "text-primary" : "text-text-muted")}
      >
        <span className={cn("inline-flex items-center gap-1", align === "right" ? "justify-end" : "")}>
          {label}
          {active ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
        </span>
      </th>
    );
  }

  const totalPages = Math.ceil(sorted.length / CUSTOMERS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * CUSTOMERS_PER_PAGE, page * CUSTOMERS_PER_PAGE);

  const totalCustomers = mockCustomers.length;
  const enterpriseCount = mockCustomers.filter(c => c.accountTier === "Enterprise").length;
  const totalRevenue = mockCustomers.reduce((s, c) => s + c.totalRevenue, 0);
  const avgPaymentScore = Math.round(mockCustomers.reduce((s, c) => s + c.paymentScore, 0) / mockCustomers.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Customers & Accounts</h1>
          <p className="text-sm text-text-muted mt-1">Manage customer relationships, track revenue, and monitor account health.</p>
        </div>
        <div className="flex items-center gap-2">
          {pageTab === "list" && (
            <>
              <DateRangeFilter onChange={setDateRange} defaultPreset="All Time" />
              <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
                <FileText className="h-4 w-4" /> Report
              </button>
              <button onClick={() => exportToCSV(filtered.map(c => ({ company: c.name, industry: c.industry, tier: c.accountTier, region: c.region, revenue: c.totalRevenue, creditLimit: c.creditLimit, outstanding: c.outstandingBalance, paymentScore: c.paymentScore, rep: c.assignedRep })), 'customers', [{ key: 'company', label: 'Company' }, { key: 'industry', label: 'Industry' }, { key: 'tier', label: 'Tier' }, { key: 'region', label: 'Region' }, { key: 'revenue', label: 'Revenue' }, { key: 'creditLimit', label: 'Credit Limit' }, { key: 'outstanding', label: 'Outstanding' }, { key: 'paymentScore', label: 'Payment Score' }, { key: 'rep', label: 'Rep' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
                <Download className="h-4 w-4" /> Export
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
                <FileUp className="h-4 w-4" /> Import
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
                <Plus className="h-4 w-4" />
                Add Customer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-lg w-fit">
        <button
          onClick={() => setPageTab("list")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            pageTab === "list" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-primary"
          )}
        >
          <Users className="h-4 w-4" /> Accounts List
        </button>
        <button
          onClick={() => setPageTab("analytics")}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            pageTab === "analytics" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-primary"
          )}
        >
          <BarChart3 className="h-4 w-4" /> Client Analytics
        </button>
      </div>

      {pageTab === "analytics" ? (
        <ClientAnalyticsDashboard customers={mockCustomers} orders={mockOrders} products={mockProducts} />
      ) : (
      <>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={formatNumber(totalCustomers)} icon={Users} color="text-primary" bg="bg-primary-light" index={0} />
        <StatCard label="Enterprise Accounts" value={formatNumber(enterpriseCount)} icon={Building2} color="text-accent" bg="bg-[#6366f120]" index={1} />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="text-success" bg="bg-success-light" index={2} />
        <StatCard label="Avg Payment Score" value={String(avgPaymentScore)} icon={Star} color="text-warning" bg="bg-warning-light" index={3} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search customers, contacts, or industries..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(1); }} className="pl-10 pr-8 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-colors">
            {tiers.map(t => <option key={t} value={t}>{t === "All" ? "All Tiers" : t}</option>)}
          </select>
        </div>
        <select value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-colors">
          {regions.map(r => <option key={r} value={r}>{r === "All" ? "All Regions" : r}</option>)}
        </select>
        <select value={industryFilter} onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary/50 transition-colors">
          {industries.map(ind => <option key={ind} value={ind}>{ind === "All" ? "All Industries" : ind}</option>)}
        </select>
        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => { const [f, d] = e.target.value.split("-"); setSortField(f); setSortDir(d as "asc" | "desc"); }}
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-secondary outline-none focus:border-primary"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="totalRevenue-desc">Revenue High–Low</option>
          <option value="totalRevenue-asc">Revenue Low–High</option>
          <option value="paymentScore-desc">Score High–Low</option>
          <option value="paymentScore-asc">Score Low–High</option>
          <option value="lastOrderDate-desc">Last Order Recent</option>
          <option value="lastOrderDate-asc">Last Order Oldest</option>
          <option value="outstandingBalance-desc">Outstanding High–Low</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <SortHeader field="name" label="Company" />
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Primary Contact</th>
                <SortHeader field="accountTier" label="Tier" align="center" />
                <SortHeader field="totalRevenue" label="Total Revenue" align="right" />
                <SortHeader field="lastOrderDate" label="Last Order" align="right" />
                <SortHeader field="creditLimit" label="Credit Limit" align="right" />
                <SortHeader field="outstandingBalance" label="Outstanding" align="right" />
                <SortHeader field="paymentScore" label="Score" align="center" />
                <th className="py-3 px-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Rep</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedCustomer(customer)}
                  className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                        {customer.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{customer.name}</p>
                        <p className="text-xs text-text-muted">{customer.industry}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-text-secondary">{customer.primaryContact.name}</p>
                    <p className="text-xs text-text-muted">{customer.primaryContact.role}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tierConfig[customer.accountTier].bg, tierConfig[customer.accountTier].text)}>
                      {customer.accountTier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-text-primary font-medium">{formatCurrency(customer.totalRevenue)}</td>
                  <td className="py-3 px-4 text-right text-text-muted text-xs">{timeAgo(customer.lastOrderDate)}</td>
                  <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency(customer.creditLimit)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn("font-medium", customer.outstandingBalance > customer.creditLimit * 0.8 ? "text-danger" : "text-text-secondary")}>
                      {formatCurrency(customer.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <PaymentScore score={customer.paymentScore} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent">
                        {customer.assignedRep.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-xs text-text-muted">{customer.assignedRep}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Showing {(page - 1) * CUSTOMERS_PER_PAGE + 1}-{Math.min(page * CUSTOMERS_PER_PAGE, filtered.length)} of {filtered.length} customers
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 rounded-lg text-xs font-medium transition-colors", page === n ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      </>
      )}

      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailPanel
            customer={selectedCustomer}
            orders={mockOrders}
            products={mockProducts}
            team={mockTeam}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateCustomerModal
            team={mockTeam}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { mutateCustomers(); setShowCreateModal(false); }}
          />
        )}
        {showReportModal && (
          <BulkReportModal config={clientReportConfig} onClose={() => setShowReportModal(false)} />
        )}
        {showImportModal && (
          <ImportCustomersModal
            existingCustomers={mockCustomers}
            onClose={() => setShowImportModal(false)}
            onImportComplete={() => { mutateCustomers(); setShowImportModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Create Customer Modal ---
function CreateCustomerModal({ team, onClose, onCreated }: {
  team: { id: string; name: string; role: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    industry: "Food & Beverage",
    accountTier: "SMB",
    region: "Midwest",
    address: "",
    creditLimit: 50000,
    assignedRep: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactTitle: "",
    tags: "",
  });

  const industries = ["Food & Beverage", "Building Materials", "Packaging", "Industrial", "Chemicals", "Agriculture", "Paper Goods", "Hospitality", "Frozen Foods", "Retail"];
  const accountTiers = ["Enterprise", "Mid-Market", "SMB"];
  const regions = ["Northeast", "Southeast", "Midwest", "West", "Southwest", "Northwest", "Mid-Atlantic"];

  const update = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Company name is required."); return; }
    setError("");
    setSaving(true);
    try {
      const tagsArr = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : ["new"];
      const body = {
        id: `cust-${Date.now()}`,
        name: form.name.trim(),
        industry: form.industry,
        accountTier: form.accountTier,
        region: form.region,
        address: form.address.trim(),
        totalRevenue: 0,
        creditLimit: Number(form.creditLimit) || 0,
        outstandingBalance: 0,
        assignedRep: form.assignedRep || (team.length > 0 ? team[0].name : ""),
        paymentScore: 100,
        orderFrequencyDays: 0,
        topProducts: "[]",
        tags: JSON.stringify(tagsArr),
        primaryContact: form.contactName ? JSON.stringify({ name: form.contactName, email: form.contactEmail, phone: form.contactPhone, title: form.contactTitle }) : undefined,
      };
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to create customer");
      onCreated();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-colors";
  const labelClass = "block text-xs font-medium text-text-secondary mb-1";

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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Add Customer</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Company Name *</label>
            <input type="text" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Acme Wholesale Co." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Industry</label>
              <select value={form.industry} onChange={e => update("industry", e.target.value)} className={inputClass}>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Account Tier</label>
              <select value={form.accountTier} onChange={e => update("accountTier", e.target.value)} className={inputClass}>
                {accountTiers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Region</label>
              <select value={form.region} onChange={e => update("region", e.target.value)} className={inputClass}>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Credit Limit</label>
              <input type="number" value={form.creditLimit} onChange={e => update("creditLimit", e.target.value)} placeholder="50000" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input type="text" value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St, City, ST 12345" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Assigned Rep</label>
            <select value={form.assignedRep} onChange={e => update("assignedRep", e.target.value)} className={inputClass}>
              <option value="">Select a rep...</option>
              {team.map(t => <option key={t.id} value={t.name}>{t.name} — {t.role}</option>)}
            </select>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={form.contactName} onChange={e => update("contactName", e.target.value)} placeholder="John Smith" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input type="text" value={form.contactTitle} onChange={e => update("contactTitle", e.target.value)} placeholder="Purchasing Manager" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.contactEmail} onChange={e => update("contactEmail", e.target.value)} placeholder="john@company.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="text" value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)} placeholder="(555) 123-4567" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Tags (comma separated)</label>
            <input type="text" value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="new, priority, wholesale" className={inputClass} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary bg-surface border border-border hover:border-primary/50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50">
            {saving ? <><Clock className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save Customer</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- CSV Parser for Customer Import ---
function parseCustomerCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const headerMap: Record<string, string> = {
    name: "name", companyname: "name", company: "name", businessname: "name", client: "name", clientname: "name", account: "name", accountname: "name",
    industry: "industry", sector: "industry", vertical: "industry", type: "industry", businesstype: "industry",
    tier: "accountTier", accounttier: "accountTier", level: "accountTier", accountlevel: "accountTier",
    region: "region", area: "region", territory: "region", state: "region", location: "region",
    address: "address", streetaddress: "address", fulladdress: "address",
    creditlimit: "creditLimit", credit: "creditLimit",
    rep: "assignedRep", assignedrep: "assignedRep", salesrep: "assignedRep", representative: "assignedRep", accountmanager: "assignedRep",
    contact: "contactName", contactname: "contactName", primarycontact: "contactName", contactperson: "contactName",
    email: "contactEmail", contactemail: "contactEmail",
    phone: "contactPhone", contactphone: "contactPhone", telephone: "contactPhone",
    role: "contactRole", contactrole: "contactRole", title: "contactRole", jobtitle: "contactRole", position: "contactRole",
    tags: "tags", labels: "tags", categories: "tags",
    revenue: "totalRevenue", totalrevenue: "totalRevenue",
    outstanding: "outstandingBalance", outstandingbalance: "outstandingBalance", balance: "outstandingBalance",
  };

  const mappedHeaders = headers.map(h => headerMap[h] || h);

  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    mappedHeaders.forEach((header, i) => {
      if (values[i] !== undefined && values[i] !== "") {
        row[header] = values[i];
      }
    });
    return row;
  });
}

// --- Import Customers Modal ---
type ImportCustomerRow = Record<string, any> & { _match?: any; _action?: "create" | "update" | "skip" };

function ImportCustomersModal({
  existingCustomers,
  onClose,
  onImportComplete,
}: {
  existingCustomers: Customer[];
  onClose: () => void;
  onImportComplete: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedRows, setParsedRows] = useState<ImportCustomerRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    setError("");
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv") && !file.name.endsWith(".txt")) {
      setError("Please upload a CSV file (.csv, .tsv, or .txt)");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) { setError("File is empty"); return; }
      const rows = parseCustomerCSV(text);
      if (rows.length === 0) { setError("No data rows found. Make sure your CSV has headers and data."); return; }
      const enriched = rows.map(row => {
        const enrichedRow: ImportCustomerRow = { ...row };
        let match = null;
        if (row.name) {
          match = existingCustomers.find(c => c.name.toLowerCase() === row.name.toLowerCase());
        }
        enrichedRow._match = match || null;
        enrichedRow._action = match ? "update" : "create";
        return enrichedRow;
      });
      setParsedRows(enriched);
      setStep("preview");
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setStep("importing");
    try {
      const customers = parsedRows
        .filter(r => r._action !== "skip")
        .map(({ _match, _action, ...row }) => row);

      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers }),
      });

      if (!res.ok) throw new Error("Import failed");
      const results = await res.json();
      setImportResults(results);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Import failed");
      setStep("preview");
    }
  };

  const toggleRowAction = (idx: number) => {
    setParsedRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      return { ...r, _action: r._action === "skip" ? (r._match ? "update" : "create") : "skip" };
    }));
  };

  const createCount = parsedRows.filter(r => r._action === "create").length;
  const updateCount = parsedRows.filter(r => r._action === "update").length;
  const skipCount = parsedRows.filter(r => r._action === "skip").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <FileUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary">Import Clients</h2>
              <p className="text-xs text-text-muted">
                {step === "upload" && "Upload a CSV file to bulk import or update clients"}
                {step === "preview" && `${parsedRows.length} rows found in ${fileName}`}
                {step === "importing" && "Processing your import..."}
                {step === "done" && "Import complete!"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-surface-hover/30"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <Upload className={cn("h-12 w-12 mx-auto mb-4", dragOver ? "text-primary" : "text-text-muted")} />
                <p className="text-lg font-medium text-text-primary mb-1">
                  {dragOver ? "Drop your file here" : "Drop CSV file here or click to browse"}
                </p>
                <p className="text-sm text-text-muted">Supports .csv, .tsv files — export from Google Sheets, Excel, etc.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* CSV Format Guide */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  CSV Format Guide
                </h3>
                <p className="text-xs text-text-muted mb-3">
                  Your CSV should have headers in the first row. We auto-detect common column names:
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    ["Company Name *", "name, company, client, account, businessname"],
                    ["Industry", "industry, sector, vertical, type"],
                    ["Tier", "tier, accounttier, level"],
                    ["Region", "region, area, territory, state"],
                    ["Address", "address, streetaddress, fulladdress"],
                    ["Credit Limit", "creditlimit, credit"],
                    ["Sales Rep", "rep, salesrep, accountmanager"],
                    ["Contact Name", "contact, contactname, primarycontact"],
                    ["Contact Email", "email, contactemail"],
                    ["Contact Phone", "phone, contactphone, telephone"],
                    ["Contact Title", "role, title, jobtitle, position"],
                    ["Tags", "tags, labels, categories"],
                  ].map(([label, aliases]) => (
                    <div key={label} className="flex items-start gap-2 py-1">
                      <span className="text-xs font-medium text-text-primary w-28 shrink-0">{label}</span>
                      <span className="text-xs text-text-muted">{aliases}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-surface-hover/50">
                  <p className="text-xs font-medium text-text-muted mb-1">Example CSV:</p>
                  <code className="text-[11px] text-primary font-mono">
                    company,industry,tier,region,contact,email,phone,title,credit limit<br />
                    Acme Corp,Food &amp; Beverage,Enterprise,Northeast,John Smith,john@acme.com,555-0100,VP Purchasing,200000<br />
                    Bob&apos;s Hardware,Building Materials,SMB,Midwest,Bob Jones,bob@bobs.com,555-0200,Owner,50000
                  </code>
                  <p className="text-[10px] text-text-muted mt-2">
                    * Existing clients (matched by company name) will be updated. New ones will be created.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csv = "company,industry,tier,region,address,contact,email,phone,title,credit limit,rep,tags\nAcme Corp,Food & Beverage,Enterprise,Northeast,123 Main St,John Smith,john@acme.com,555-0100,VP Purchasing,200000,Sarah Mitchell,vip\nBob's Hardware,Building Materials,SMB,Midwest,456 Oak Ave,Bob Jones,bob@bobs.com,555-0200,Owner,50000,,new";
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "client_import_template.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="mt-3 flex items-center gap-2 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template CSV
                </button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                {createCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                    <Plus className="h-3 w-3" /> {createCount} new client{createCount !== 1 ? "s" : ""}
                  </span>
                )}
                {updateCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
                    <ArrowLeftRight className="h-3 w-3" /> {updateCount} to update
                  </span>
                )}
                {skipCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400">
                    <X className="h-3 w-3" /> {skipCount} skipped
                  </span>
                )}
              </div>

              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto max-h-[45vh]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface z-10">
                      <tr className="border-b border-border">
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider w-20">Action</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Company</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Industry</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Tier</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Region</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Contact</th>
                        <th className="py-2.5 px-3 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">Email</th>
                        <th className="py-2.5 px-3 text-center text-[10px] font-medium text-text-muted uppercase tracking-wider w-16">Skip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => {
                        const isUpdate = row._action === "update";
                        const isSkip = row._action === "skip";
                        const match = row._match;

                        return (
                          <tr
                            key={idx}
                            className={cn(
                              "border-b border-border/50 transition-colors",
                              isSkip ? "opacity-40" : "hover:bg-surface-hover/30"
                            )}
                          >
                            <td className="py-2 px-3">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                isSkip ? "bg-gray-500/15 text-gray-400" :
                                isUpdate ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
                              )}>
                                {isSkip ? "Skip" : isUpdate ? "Update" : "New"}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-text-primary font-medium text-xs">{row.name || "—"}</span>
                              {isUpdate && match && (
                                <p className="text-[10px] text-text-muted">Matched: {match.name}</p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-text-secondary">{row.industry || "—"}</td>
                            <td className="py-2 px-3 text-xs text-text-secondary">{row.accountTier || "—"}</td>
                            <td className="py-2 px-3 text-xs text-text-secondary">{row.region || "—"}</td>
                            <td className="py-2 px-3 text-xs text-text-secondary">{row.contactName || "—"}</td>
                            <td className="py-2 px-3 text-xs text-text-secondary">{row.contactEmail || "—"}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => toggleRowAction(idx)}
                                className={cn(
                                  "p-1 rounded transition-colors",
                                  isSkip ? "text-red-400 hover:bg-red-500/10" : "text-text-muted hover:text-red-400 hover:bg-red-500/10"
                                )}
                              >
                                {isSkip ? <Plus className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-text-primary">Importing clients...</p>
              <p className="text-sm text-text-muted mt-1">Processing {parsedRows.filter(r => r._action !== "skip").length} clients</p>
            </div>
          )}

          {/* Done Step */}
          {step === "done" && importResults && (
            <div className="space-y-6">
              <div className="flex flex-col items-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-heading font-bold text-text-primary">Import Complete!</h3>
                <p className="text-sm text-text-muted mt-1">Your client list has been updated successfully</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-emerald-400">{importResults.created}</p>
                  <p className="text-xs text-text-muted mt-1">Clients Created</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-blue-400">{importResults.updated}</p>
                  <p className="text-xs text-text-muted mt-1">Clients Updated</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-gray-400">{importResults.skipped}</p>
                  <p className="text-xs text-text-muted mt-1">Skipped</p>
                </div>
              </div>

              {importResults.errors?.length > 0 && (
                <div className="glass-card p-4">
                  <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {importResults.errors.length} Error{importResults.errors.length !== 1 ? "s" : ""}
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResults.errors.map((err: string, i: number) => (
                      <p key={i} className="text-xs text-text-muted">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface/50">
          {step === "upload" && (
            <>
              <div />
              <button onClick={onClose} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
                Cancel
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => { setStep("upload"); setParsedRows([]); setFileName(""); setError(""); }}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">
                  {createCount + updateCount} client{createCount + updateCount !== 1 ? "s" : ""} will be processed
                </span>
                <button
                  onClick={handleImport}
                  disabled={createCount + updateCount === 0}
                  className={cn(
                    "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                    createCount + updateCount > 0
                      ? "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/25"
                      : "bg-surface text-text-muted cursor-not-allowed"
                  )}
                >
                  <Upload className="h-4 w-4" /> Import {createCount + updateCount} Client{createCount + updateCount !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          )}
          {step === "done" && (
            <>
              <div />
              <button
                onClick={() => { onImportComplete(); onClose(); }}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                <CheckCircle2 className="h-4 w-4" /> Done
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
