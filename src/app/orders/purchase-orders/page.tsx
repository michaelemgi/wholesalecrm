"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, DollarSign, Clock, Truck,
  Calendar, Building2, Package, X, Check,
  AlertTriangle, Bell, ChevronRight, Minus, Plus,
  CheckCircle2, XCircle, ClipboardCheck, ArrowRight,
  TrendingDown, TrendingUp, RotateCcw,
  Upload, FileSpreadsheet, Loader2, Search, Pencil, Trash2,
  MessageSquare, ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Product } from "@/types";

// --- Types ---
interface POLineItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: "Draft" | "Submitted" | "Confirmed" | "In Transit" | "Received" | "Paid";
  amount: number;
  expectedDelivery: string;
  items: number;
  createdAt: string;
  lineItems: POLineItem[];
}

// --- Generate realistic line items from product catalog ---
function generateLineItems(poId: string, count: number, totalAmount: number, mockProducts: Product[] = []): POLineItem[] {
  if (mockProducts.length === 0) return [];
  const seedNum = parseInt(poId.replace("po-", ""), 10);
  const items: POLineItem[] = [];
  const usedProducts = new Set<number>();
  let runningTotal = 0;

  for (let i = 0; i < count; i++) {
    let prodIndex = (seedNum * 7 + i * 13) % mockProducts.length;
    while (usedProducts.has(prodIndex)) {
      prodIndex = (prodIndex + 1) % mockProducts.length;
    }
    usedProducts.add(prodIndex);

    const product = mockProducts[prodIndex];
    const isLast = i === count - 1;
    const qty = 20 + ((seedNum * 3 + i * 11) % 180);
    const unitCost = product.wholesalePrice * (0.6 + ((seedNum + i) % 4) * 0.05);
    const roundedCost = Math.round(unitCost * 100) / 100;

    if (isLast) {
      // Adjust last item to roughly match PO total
      const remaining = totalAmount - runningTotal;
      const adjQty = Math.max(10, Math.round(remaining / roundedCost));
      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        orderedQty: adjQty,
        unitCost: roundedCost,
        totalCost: Math.round(adjQty * roundedCost),
      });
    } else {
      const total = Math.round(qty * roundedCost);
      runningTotal += total;
      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        orderedQty: qty,
        unitCost: roundedCost,
        totalCost: total,
      });
    }
  }
  return items;
}

// --- Mock POs ---
const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-001", poNumber: "PO-4501", supplier: "Global Grains Inc.",
    status: "Confirmed", amount: 48500, expectedDelivery: "2026-04-02",
    items: 12, createdAt: "2026-03-20",
    lineItems: generateLineItems("po-001", 12, 48500),
  },
  {
    id: "po-002", poNumber: "PO-4502", supplier: "Pacific Seafood Co.",
    status: "In Transit", amount: 67200, expectedDelivery: "2026-03-30",
    items: 8, createdAt: "2026-03-18",
    lineItems: generateLineItems("po-002", 8, 67200),
  },
  {
    id: "po-003", poNumber: "PO-4503", supplier: "BuildMaster Supply",
    status: "Submitted", amount: 124000, expectedDelivery: "2026-04-08",
    items: 24, createdAt: "2026-03-25",
    lineItems: generateLineItems("po-003", 24, 124000),
  },
  {
    id: "po-004", poNumber: "PO-4504", supplier: "Fresh Valley Farms",
    status: "Draft", amount: 31800, expectedDelivery: "2026-04-05",
    items: 15, createdAt: "2026-03-27",
    lineItems: generateLineItems("po-004", 15, 31800),
  },
  {
    id: "po-005", poNumber: "PO-4505", supplier: "SteelWorks International",
    status: "Received", amount: 89400, expectedDelivery: "2026-03-26",
    items: 6, createdAt: "2026-03-10",
    lineItems: generateLineItems("po-005", 6, 89400),
  },
  {
    id: "po-006", poNumber: "PO-4506", supplier: "Chemical Solutions Ltd.",
    status: "Paid", amount: 42100, expectedDelivery: "2026-03-22",
    items: 10, createdAt: "2026-03-05",
    lineItems: generateLineItems("po-006", 10, 42100),
  },
  {
    id: "po-007", poNumber: "PO-4507", supplier: "EcoPack Industries",
    status: "In Transit", amount: 28700, expectedDelivery: "2026-04-01",
    items: 18, createdAt: "2026-03-22",
    lineItems: generateLineItems("po-007", 18, 28700),
  },
  {
    id: "po-008", poNumber: "PO-4508", supplier: "Omega Dairy Products",
    status: "Confirmed", amount: 55300, expectedDelivery: "2026-04-04",
    items: 9, createdAt: "2026-03-24",
    lineItems: generateLineItems("po-008", 9, 55300),
  },
];

const PO_STAGES = [
  "Draft", "Submitted", "Confirmed", "In Transit", "Received", "Paid",
] as const;

const stageColors: Record<string, string> = {
  Draft: "bg-gray-500",
  Submitted: "bg-blue-500",
  Confirmed: "bg-indigo-500",
  "In Transit": "bg-amber-500",
  Received: "bg-emerald-500",
  Paid: "bg-cyan-500",
};

const stageBgColors: Record<string, string> = {
  Draft: "bg-gray-500/10",
  Submitted: "bg-blue-500/10",
  Confirmed: "bg-indigo-500/10",
  "In Transit": "bg-amber-500/10",
  Received: "bg-emerald-500/10",
  Paid: "bg-cyan-500/10",
};

const stageTextColors: Record<string, string> = {
  Draft: "text-gray-400",
  Submitted: "text-blue-400",
  Confirmed: "text-indigo-400",
  "In Transit": "text-amber-400",
  Received: "text-emerald-400",
  Paid: "text-cyan-400",
};

// --- Receiving state for each line item ---
interface ReceivingLine {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  unitCost: number;
  receivedQty: number;
  adjustedCost: number;
  totalLineCost: number;
  status: "match" | "short" | "over" | "rejected";
  notes: string;
}

// --- Simulated invoice parse results ---
interface ParsedInvoiceLine {
  rawName: string;
  matchedProduct: Product | null;
  sku: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  matched: boolean;
}

function simulateInvoiceParse(fileName: string, mockProducts: Product[] = []): { supplier: string; invoiceNumber: string; invoiceDate: string; lines: ParsedInvoiceLine[] } {
  // Simulate parsing an invoice file — generate realistic line items
  const seed = fileName.length;
  const suppliers = ["Pacific Foods Ltd.", "Metro Supply Co.", "GreenLeaf Distributors", "Atlas Wholesale", "Premier Trade Inc."];
  const supplier = suppliers[seed % suppliers.length];
  const invoiceNumber = `INV-${7000 + (seed * 17) % 999}`;
  const invoiceDate = "2026-03-28";

  const numItems = 4 + (seed % 6);
  const lines: ParsedInvoiceLine[] = [];
  const usedIndices = new Set<number>();

  if (mockProducts.length === 0) return { supplier, invoiceNumber, invoiceDate, lines };

  for (let i = 0; i < numItems; i++) {
    let prodIdx = (seed * 7 + i * 11) % mockProducts.length;
    while (usedIndices.has(prodIdx)) prodIdx = (prodIdx + 1) % mockProducts.length;
    usedIndices.add(prodIdx);

    const product = mockProducts[prodIdx];
    const qty = 10 + ((seed * 3 + i * 13) % 190);
    const unitCost = Math.round(product.wholesalePrice * (0.55 + ((seed + i) % 5) * 0.06) * 100) / 100;
    // ~90% chance of matching a product, 10% unmatched for realism
    const matched = i < numItems - 1 || seed % 10 !== 0;

    lines.push({
      rawName: matched ? product.name : `Custom Product ${i + 1} (${["Bulk Pack", "Special Order", "Promo Item"][i % 3]})`,
      matchedProduct: matched ? product : null,
      sku: matched ? product.sku : `CUSTOM-${1000 + i}`,
      qty,
      unitCost,
      totalCost: Math.round(qty * unitCost),
      matched,
    });
  }

  return { supplier, invoiceNumber, invoiceDate, lines };
}

export default function PurchaseOrdersPage() {
  const { data: mockProducts = [] } = useSWR<Product[]>('/api/products', fetcher);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "All Time" });
  const [posInitialized, setPosInitialized] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivingLines, setReceivingLines] = useState<ReceivingLine[]>([]);
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Sort state
  type SortField = "createdAt" | "poNumber" | "supplier" | "amount" | "status" | "expectedDelivery" | "items";
  type SortDir = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  // Rebuild line items once products data is available
  if (mockProducts.length > 0 && !posInitialized) {
    setPurchaseOrders(initialPurchaseOrders.map(po => ({
      ...po,
      lineItems: generateLineItems(po.id, po.items, po.amount, mockProducts),
    })));
    setPosInitialized(true);
  }

  // Upload invoice state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedInvoice, setParsedInvoice] = useState<ReturnType<typeof simulateInvoiceParse> | null>(null);
  const [editingInvoiceLines, setEditingInvoiceLines] = useState<ParsedInvoiceLine[]>([]);
  const [invoiceSupplier, setInvoiceSupplier] = useState("");
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [productSearchIdx, setProductSearchIdx] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Handle file upload
  const handleUploadFile = (fileName: string) => {
    setUploadedFileName(fileName);
    setUploadProcessing(true);
    setUploadProgress(0);
    setInvoiceCreated(false);

    // Simulate processing
    const steps = [10, 25, 45, 65, 80, 95, 100];
    steps.forEach((pct, i) => {
      setTimeout(() => {
        setUploadProgress(pct);
        if (pct === 100) {
          setTimeout(() => {
            const parsed = simulateInvoiceParse(fileName, mockProducts);
            setParsedInvoice(parsed);
            setEditingInvoiceLines([...parsed.lines]);
            setInvoiceSupplier(parsed.supplier);
            setUploadProcessing(false);
          }, 300);
        }
      }, 400 + i * 350);
    });
  };

  // Update an invoice line
  const updateInvoiceLine = (index: number, field: "qty" | "unitCost", value: number) => {
    setEditingInvoiceLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index] };
      if (field === "qty") line.qty = Math.max(1, value);
      if (field === "unitCost") line.unitCost = Math.max(0.01, Math.round(value * 100) / 100);
      line.totalCost = Math.round(line.qty * line.unitCost);
      updated[index] = line;
      return updated;
    });
  };

  // Remove invoice line
  const removeInvoiceLine = (index: number) => {
    setEditingInvoiceLines(prev => prev.filter((_, i) => i !== index));
  };

  // Match unmatched product
  const matchProduct = (index: number, product: Product) => {
    setEditingInvoiceLines(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        matchedProduct: product,
        sku: product.sku,
        rawName: product.name,
        matched: true,
      };
      return updated;
    });
    setProductSearchIdx(null);
    setProductSearchQuery("");
  };

  // Create PO from uploaded invoice
  const createPOFromInvoice = () => {
    if (!parsedInvoice || editingInvoiceLines.length === 0) return;

    const newId = `po-${(purchaseOrders.length + 1).toString().padStart(3, "0")}`;
    const totalAmount = editingInvoiceLines.reduce((s, l) => s + l.totalCost, 0);
    const expectedDate = new Date("2026-04-05");
    expectedDate.setDate(expectedDate.getDate() + Math.floor(Math.random() * 10));

    const newPO: PurchaseOrder = {
      id: newId,
      poNumber: `PO-${4509 + purchaseOrders.length}`,
      supplier: invoiceSupplier,
      status: "Draft",
      amount: totalAmount,
      expectedDelivery: expectedDate.toISOString().split("T")[0],
      items: editingInvoiceLines.length,
      createdAt: "2026-03-29",
      lineItems: editingInvoiceLines.map(line => ({
        productId: line.matchedProduct?.id || `custom-${line.sku}`,
        productName: line.rawName,
        sku: line.sku,
        orderedQty: line.qty,
        unitCost: line.unitCost,
        totalCost: line.totalCost,
      })),
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    setInvoiceCreated(true);
  };

  // Reset upload
  const resetUpload = () => {
    setShowUpload(false);
    setParsedInvoice(null);
    setEditingInvoiceLines([]);
    setUploadProcessing(false);
    setUploadProgress(0);
    setInvoiceCreated(false);
    setUploadedFileName("");
    setProductSearchIdx(null);
    setProductSearchQuery("");
  };

  // POs arriving soon (In Transit with delivery within 3 days)
  const arrivingPOs = useMemo(() => {
    const today = new Date("2026-03-28");
    return purchaseOrders.filter((po) => {
      if (po.status !== "In Transit" && po.status !== "Confirmed") return false;
      if (dismissedAlerts.has(po.id)) return false;
      const delivery = new Date(po.expectedDelivery);
      const daysUntil = Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 5;
    });
  }, [purchaseOrders, dismissedAlerts]);

  // Open receiving panel for a PO
  const openReceiving = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setReceiptConfirmed(false);

    // Initialize receiving lines from the PO's line items
    const lines: ReceivingLine[] = po.lineItems.map((item) => {
      // Simulate some variance for "In Transit" / "Confirmed" POs
      let receivedQty = item.orderedQty;
      if (po.status === "In Transit" || po.status === "Confirmed") {
        const rand = Math.random();
        if (rand < 0.15) {
          receivedQty = Math.max(1, item.orderedQty - Math.ceil(item.orderedQty * (0.02 + Math.random() * 0.08)));
        } else if (rand < 0.20) {
          receivedQty = item.orderedQty + Math.ceil(item.orderedQty * 0.02);
        }
      }

      // Unit cost is FIXED from the invoice — never changes based on qty
      const totalLineCost = item.unitCost * item.orderedQty;
      const status = receivedQty === item.orderedQty ? "match" :
        receivedQty < item.orderedQty ? "short" :
        receivedQty > item.orderedQty ? "over" : "rejected";

      // Auto-generate AI note based on variance
      const variance = receivedQty - item.orderedQty;
      let autoNote = "";
      if (variance < 0) {
        autoNote = `⚠️ Short ${Math.abs(variance)} units — contact ${po.supplier} to resolve. Missing ${Math.abs(variance)} of ${item.orderedQty} ordered.`;
      } else if (variance > 0) {
        autoNote = `✅ Received ${variance} extra units — no action needed. Bonus stock added to inventory.`;
      }

      return {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        orderedQty: item.orderedQty,
        unitCost: item.unitCost,
        receivedQty,
        adjustedCost: item.unitCost, // stays same as invoice price — never adjusted
        totalLineCost,
        status,
        notes: autoNote,
      };
    });
    setReceivingLines(lines);
    setReceiptNotes("");
  };

  // General PO notes
  const [receiptNotes, setReceiptNotes] = useState("");

  // Update received qty for a line — unit cost stays FIXED (invoice price never changes based on qty)
  const updateReceivedQty = (index: number, newQty: number) => {
    setReceivingLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index] };
      line.receivedQty = Math.max(0, newQty);
      // adjustedCost stays same as unitCost — qty variance is a delivery issue, not a pricing issue
      line.adjustedCost = line.unitCost;
      line.status = line.receivedQty === 0 ? "rejected" :
        line.receivedQty === line.orderedQty ? "match" :
        line.receivedQty < line.orderedQty ? "short" : "over";
      // Auto-generate AI note based on variance
      const variance = line.receivedQty - line.orderedQty;
      if (variance < 0) {
        line.notes = `⚠️ Short ${Math.abs(variance)} units — contact supplier to resolve. Missing ${Math.abs(variance)} of ${line.orderedQty} ordered.`;
      } else if (variance > 0) {
        line.notes = `✅ Received ${variance} extra units — no action needed. Bonus stock added to inventory.`;
      } else {
        line.notes = "";
      }
      updated[index] = line;
      return updated;
    });
  };

  // Update line notes
  const updateLineNotes = (index: number, notes: string) => {
    setReceivingLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes };
      return updated;
    });
  };

  // Confirm goods receipt
  const confirmReceipt = () => {
    if (!selectedPO) return;

    // Update PO status to Received
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.id === selectedPO.id
          ? { ...po, status: "Received" as const }
          : po
      )
    );

    // Remove from alerts
    setDismissedAlerts((prev) => new Set([...prev, selectedPO.id]));
    setReceiptConfirmed(true);
  };

  // Date-filtered POs
  const filteredPOs = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return purchaseOrders;
    return purchaseOrders.filter((po) => isInRange(po.createdAt, dateRange));
  }, [purchaseOrders, dateRange]);

  // Sorted POs
  const sortedPOs = useMemo(() => {
    const statusOrder = PO_STAGES.reduce((acc, s, i) => ({ ...acc, [s]: i }), {} as Record<string, number>);
    return [...filteredPOs].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "poNumber":
          cmp = a.poNumber.localeCompare(b.poNumber);
          break;
        case "supplier":
          cmp = a.supplier.localeCompare(b.supplier);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "status":
          cmp = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
          break;
        case "expectedDelivery":
          cmp = a.expectedDelivery.localeCompare(b.expectedDelivery);
          break;
        case "items":
          cmp = a.items - b.items;
          break;
        case "createdAt":
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredPOs, sortField, sortDir]);

  // Stats
  const totalPOs = filteredPOs.length;
  const outstandingAmount = filteredPOs
    .filter((po) => !["Received", "Paid"].includes(po.status))
    .reduce((sum, po) => sum + po.amount, 0);
  const avgLeadTime = 12;
  const inTransitCount = filteredPOs.filter((po) => po.status === "In Transit").length;

  const posByStage: Record<string, PurchaseOrder[]> = {};
  PO_STAGES.forEach((s) => (posByStage[s] = []));
  sortedPOs.forEach((po) => {
    if (posByStage[po.status]) posByStage[po.status].push(po);
  });

  // Receiving summary stats
  const receivingSummary = useMemo(() => {
    if (!receivingLines.length) return null;
    const totalOrdered = receivingLines.reduce((s, l) => s + l.orderedQty, 0);
    const totalReceived = receivingLines.reduce((s, l) => s + l.receivedQty, 0);
    const matches = receivingLines.filter((l) => l.status === "match").length;
    const shorts = receivingLines.filter((l) => l.status === "short").length;
    const overs = receivingLines.filter((l) => l.status === "over").length;
    const rejected = receivingLines.filter((l) => l.status === "rejected").length;
    const originalTotal = receivingLines.reduce((s, l) => s + l.totalLineCost, 0);
    const adjustedTotal = receivingLines.reduce((s, l) => s + l.unitCost * l.receivedQty, 0);
    return { totalOrdered, totalReceived, matches, shorts, overs, rejected, originalTotal, adjustedTotal };
  }, [receivingLines]);

  const kpis = [
    { label: "Total POs", value: totalPOs.toString(), icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Outstanding Amount", value: formatCurrency(outstandingAmount), icon: DollarSign, color: "text-warning", bg: "bg-warning/10" },
    { label: "In Transit", value: inTransitCount.toString(), icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Avg Lead Time", value: `${avgLeadTime} days`, icon: Clock, color: "text-accent", bg: "bg-[#6366f120]" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Purchase Orders
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track supplier orders from draft to payment. Click any order to receive goods.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter onChange={setDateRange} defaultPreset="Last 30 Days" />
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-hover/60 rounded-lg px-3 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-text-muted" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent text-sm font-medium text-text-primary outline-none cursor-pointer appearance-none pr-1"
            >
              <option value="createdAt">Created Date</option>
              <option value="poNumber">PO Number</option>
              <option value="supplier">Supplier</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
              <option value="expectedDelivery">Expected Delivery</option>
              <option value="items">Items</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="p-0.5 hover:bg-surface-hover rounded transition-colors"
              title={sortDir === "asc" ? "Ascending" : "Descending"}
            >
              {sortDir === "asc" ? (
                <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
              )}
            </button>
          </div>
          <button
            onClick={() => { setShowUpload(true); setInvoiceCreated(false); setParsedInvoice(null); setUploadProcessing(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Upload className="h-4 w-4" />
            Upload Invoice
          </button>
        </div>
      </div>

      {/* Arrival Alerts */}
      <AnimatePresence>
        {arrivingPOs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {arrivingPOs.map((po) => {
              const today = new Date("2026-03-28");
              const delivery = new Date(po.expectedDelivery);
              const daysUntil = Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntil <= 0;
              const isToday = daysUntil === 0;
              const isTomorrow = daysUntil === 1;

              return (
                <motion.div
                  key={po.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]",
                    isOverdue
                      ? "bg-red-500/10 border-red-500/30"
                      : isToday || isTomorrow
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                  )}
                  onClick={() => openReceiving(po)}
                >
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                    isOverdue ? "bg-red-500/20" : "bg-amber-500/20"
                  )}>
                    {isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-amber-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">{po.poNumber}</span>
                      <span className="text-sm text-text-primary font-medium">{po.supplier}</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {po.items} items · {formatCurrency(po.amount)}
                      {isOverdue
                        ? " — Overdue! Expected " + formatDate(po.expectedDelivery)
                        : isToday
                        ? " — Arriving today"
                        : isTomorrow
                        ? " — Arriving tomorrow"
                        : ` — Arriving in ${daysUntil} days`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      stageColors[po.status].replace("bg-", "bg-") + "/20",
                      stageTextColors[po.status]
                    )}>
                      {po.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReceiving(po);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ClipboardCheck className="h-3 w-3" />
                      Receive
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedAlerts((prev) => new Set([...prev, po.id]));
                      }}
                      className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-text-primary">
                {kpi.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Sort Controls Row */}
      <div className="flex items-center gap-4 px-1 text-xs text-text-muted">
        <span className="font-medium text-text-muted/60 uppercase tracking-wider mr-1">Sort by:</span>
        <SortHeader field="poNumber" label="PO Number" />
        <SortHeader field="supplier" label="Supplier" />
        <SortHeader field="amount" label="Amount" />
        <SortHeader field="items" label="Items" />
        <SortHeader field="expectedDelivery" label="Expected Delivery" />
        <SortHeader field="createdAt" label="Created" />
      </div>

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex gap-4 overflow-x-auto pb-4"
      >
        {PO_STAGES.map((stage) => {
          const stagePOs = posByStage[stage];
          const stageTotal = stagePOs.reduce((sum, po) => sum + po.amount, 0);

          return (
            <div key={stage} className="flex flex-col min-w-[260px] w-[260px] shrink-0">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={cn("h-2.5 w-2.5 rounded-full", stageColors[stage])} />
                <h3 className="text-sm font-semibold text-text-primary">{stage}</h3>
                <span className="ml-auto text-xs font-medium text-text-muted bg-surface-hover rounded-full px-2 py-0.5">
                  {stagePOs.length}
                </span>
              </div>
              {stageTotal > 0 && (
                <div className="text-xs text-text-muted mb-3 px-1">
                  {formatCurrency(stageTotal)}
                </div>
              )}

              {/* Cards */}
              <div className={cn("flex-1 space-y-2.5 p-2 rounded-xl min-h-[160px]", stageBgColors[stage])}>
                {stagePOs.map((po, i) => (
                  <motion.div
                    key={po.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="glass-card p-3.5 hover:border-primary/40 transition-all cursor-pointer group"
                    onClick={() => openReceiving(po)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">{po.poNumber}</span>
                      <span className="text-xs text-text-muted">{po.items} items</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building2 className="h-3 w-3 text-text-muted shrink-0" />
                      <p className="text-sm font-medium text-text-primary truncate">{po.supplier}</p>
                    </div>
                    <p className="text-lg font-bold font-heading text-text-primary mb-2">
                      {formatCurrency(po.amount)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {stage === "Received" || stage === "Paid" ? "Delivered" : "Expected"}{" "}
                          {formatDate(po.expectedDelivery)}
                        </span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
                {stagePOs.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-text-muted border border-dashed border-border rounded-lg">
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ====== UPLOAD INVOICE PANEL ====== */}
      <AnimatePresence>
        {showUpload && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={resetUpload}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[820px] max-w-[95vw] bg-bg-primary border-l border-border z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                <div>
                  <h2 className="text-xl font-bold font-heading text-text-primary flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Supplier Invoice
                  </h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    Upload a CSV, XLS, or PDF invoice to auto-create a purchase order
                  </p>
                </div>
                <button onClick={resetUpload} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Step 1: Upload Zone */}
                {!parsedInvoice && !uploadProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer",
                        uploadDragging
                          ? "border-primary bg-primary/5 scale-[1.02]"
                          : "border-border hover:border-primary/50 hover:bg-surface-hover/30"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
                      onDragLeave={() => setUploadDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setUploadDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleUploadFile(file.name);
                      }}
                      onClick={() => handleUploadFile("supplier-invoice-march-2026.csv")}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                          <FileSpreadsheet className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            Drop your invoice file here, or <span className="text-primary">click to browse</span>
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            Supports CSV, XLS, XLSX, PDF — Max 10MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Format guidance */}
                    <div className="glass-card p-4">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Expected Format</h4>
                      <div className="bg-surface-hover/50 rounded-lg p-3 font-mono text-[11px] text-text-muted space-y-1">
                        <p className="text-text-secondary font-semibold">Product Name, SKU, Qty, Unit Cost, Total</p>
                        <p>All-Purpose Flour 50lb, SKU-1004, 100, 8.40, 840.00</p>
                        <p>Organic Olive Oil 5L, SKU-1001, 50, 16.80, 840.00</p>
                        <p>Brown Rice 25kg, SKU-1002, 75, 14.40, 1080.00</p>
                      </div>
                      <p className="text-[10px] text-text-muted mt-2">
                        Products will be auto-matched to your catalog by SKU or name. Unmatched items can be manually linked.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Processing */}
                {uploadProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 space-y-4"
                  >
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-text-primary">Processing Invoice...</p>
                      <p className="text-xs text-text-muted mt-1">{uploadedFileName}</p>
                    </div>
                    <div className="w-64 h-2 bg-surface-hover rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="space-y-1 text-xs text-text-muted">
                      {uploadProgress >= 10 && <p className="text-emerald-400">✓ File uploaded</p>}
                      {uploadProgress >= 45 && <p className="text-emerald-400">✓ Parsing line items</p>}
                      {uploadProgress >= 80 && <p className="text-emerald-400">✓ Matching products to catalog</p>}
                      {uploadProgress >= 95 && <p className="text-amber-400">○ Validating pricing...</p>}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Review Parsed Invoice */}
                {parsedInvoice && !invoiceCreated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* File info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-emerald-400">Invoice parsed successfully</p>
                        <p className="text-[10px] text-text-muted">{uploadedFileName} — {editingInvoiceLines.length} items found, {editingInvoiceLines.filter(l => l.matched).length} matched to catalog</p>
                      </div>
                    </div>

                    {/* Editable supplier + invoice info */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-card p-3">
                        <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium block mb-1">Supplier</label>
                        <input
                          type="text"
                          value={invoiceSupplier}
                          onChange={(e) => setInvoiceSupplier(e.target.value)}
                          className="w-full text-sm font-medium text-text-primary bg-transparent border-b border-border focus:border-primary focus:outline-none pb-0.5 transition-colors"
                        />
                      </div>
                      <div className="glass-card p-3">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Invoice #</p>
                        <p className="text-sm font-semibold text-primary mt-0.5">{parsedInvoice.invoiceNumber}</p>
                      </div>
                      <div className="glass-card p-3">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Invoice Total</p>
                        <p className="text-sm font-semibold text-text-primary mt-0.5">
                          {formatCurrency(editingInvoiceLines.reduce((s, l) => s + l.totalCost, 0))}
                        </p>
                      </div>
                    </div>

                    {/* Line items table */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Line Items</h3>
                        <span className="text-xs text-text-muted ml-auto">Edit quantities and pricing before creating PO</span>
                      </div>

                      <div className="glass-card overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3">Product</th>
                              <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[70px]">SKU</th>
                              <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Qty</th>
                              <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[100px]">Unit Cost</th>
                              <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Total</th>
                              <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[80px]">Status</th>
                              <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[40px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {editingInvoiceLines.map((line, idx) => {
                              const catalogPrice = line.matchedProduct?.wholesalePrice;
                              const priceDiff = catalogPrice ? ((line.unitCost - catalogPrice) / catalogPrice * 100) : 0;

                              return (
                                <motion.tr
                                  key={idx}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.02 }}
                                  className={cn(
                                    "border-b border-border/50 last:border-0 transition-colors",
                                    !line.matched ? "bg-amber-500/5" : ""
                                  )}
                                >
                                  {/* Product */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      {line.matched ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                      )}
                                      <div>
                                        <p className="text-xs font-medium text-text-primary">{line.rawName}</p>
                                        {!line.matched && (
                                          <button
                                            onClick={() => { setProductSearchIdx(idx); setProductSearchQuery(""); }}
                                            className="text-[10px] text-primary hover:underline mt-0.5"
                                          >
                                            Match to catalog →
                                          </button>
                                        )}
                                        {line.matched && catalogPrice && Math.abs(priceDiff) > 5 && (
                                          <p className="text-[10px] text-text-muted">
                                            Catalog wholesale: {formatCurrency(catalogPrice)}
                                            <span className={cn("ml-1 font-semibold", priceDiff > 0 ? "text-red-400" : "text-emerald-400")}>
                                              ({priceDiff > 0 ? "+" : ""}{priceDiff.toFixed(0)}%)
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Product search dropdown */}
                                    <AnimatePresence>
                                      {productSearchIdx === idx && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -4 }}
                                          className="mt-2 p-2 rounded-lg bg-surface border border-primary/30 shadow-lg"
                                        >
                                          <div className="relative mb-2">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
                                            <input
                                              type="text"
                                              placeholder="Search catalog..."
                                              value={productSearchQuery}
                                              onChange={(e) => setProductSearchQuery(e.target.value)}
                                              autoFocus
                                              className="w-full pl-6 pr-2 py-1.5 bg-surface-hover border border-border rounded text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                                            />
                                          </div>
                                          <div className="max-h-28 overflow-y-auto space-y-0.5">
                                            {mockProducts
                                              .filter(p => {
                                                if (!productSearchQuery) return true;
                                                const q = productSearchQuery.toLowerCase();
                                                return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                                              })
                                              .slice(0, 6)
                                              .map(p => (
                                                <button
                                                  key={p.id}
                                                  onClick={() => matchProduct(idx, p)}
                                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-hover text-left transition-colors"
                                                >
                                                  <Package className="h-3 w-3 text-primary shrink-0" />
                                                  <span className="text-xs text-text-primary truncate flex-1">{p.name}</span>
                                                  <span className="text-[10px] text-text-muted">{p.sku}</span>
                                                </button>
                                              ))}
                                          </div>
                                          <button
                                            onClick={() => setProductSearchIdx(null)}
                                            className="w-full mt-1 text-[10px] text-text-muted hover:text-text-primary text-center py-1"
                                          >
                                            Cancel
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </td>

                                  {/* SKU */}
                                  <td className="p-3">
                                    <span className="text-[10px] font-mono text-text-muted">{line.sku}</span>
                                  </td>

                                  {/* Qty — Editable */}
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => updateInvoiceLine(idx, "qty", line.qty - 1)}
                                        className="p-0.5 rounded bg-surface-hover hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <input
                                        type="number"
                                        value={line.qty}
                                        onChange={(e) => updateInvoiceLine(idx, "qty", parseInt(e.target.value) || 1)}
                                        className="w-14 text-center text-xs font-mono font-bold bg-surface-hover border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button
                                        onClick={() => updateInvoiceLine(idx, "qty", line.qty + 1)}
                                        className="p-0.5 rounded bg-surface-hover hover:bg-emerald-500/20 text-text-muted hover:text-emerald-400 transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Unit Cost — Editable */}
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-0.5">
                                      <span className="text-xs text-text-muted">$</span>
                                      <input
                                        type="number"
                                        value={line.unitCost}
                                        onChange={(e) => updateInvoiceLine(idx, "unitCost", parseFloat(e.target.value) || 0)}
                                        className="w-16 text-right text-xs font-mono font-bold bg-surface-hover border border-border rounded px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Total */}
                                  <td className="p-3 text-right">
                                    <span className="text-xs font-mono font-semibold text-text-primary">
                                      {formatCurrency(line.totalCost)}
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="p-3 text-center">
                                    <span className={cn(
                                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                      line.matched ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                                    )}>
                                      {line.matched ? "Matched" : "Manual"}
                                    </span>
                                  </td>

                                  {/* Remove */}
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => removeInvoiceLine(idx)}
                                      className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Totals row */}
                        <div className="border-t border-border p-3 flex items-center justify-between bg-surface-hover/30">
                          <span className="text-xs font-semibold text-text-primary">
                            {editingInvoiceLines.length} items · {editingInvoiceLines.reduce((s, l) => s + l.qty, 0)} total units
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-text-muted">Invoice Total:</span>
                            <span className="text-lg font-bold font-heading text-text-primary">
                              {formatCurrency(editingInvoiceLines.reduce((s, l) => s + l.totalCost, 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unmatched warning */}
                    {editingInvoiceLines.some(l => !l.matched) && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-400">
                            {editingInvoiceLines.filter(l => !l.matched).length} item{editingInvoiceLines.filter(l => !l.matched).length > 1 ? "s" : ""} not matched to catalog
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Click "Match to catalog" to link them, or they&apos;ll be added as custom products.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 4: PO Created Success */}
                {invoiceCreated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="glass-card p-6 border-emerald-500/30 bg-emerald-500/5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 mx-auto mb-3">
                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400 mb-1">Purchase Order Created!</h3>
                      <p className="text-sm text-text-muted">
                        Invoice from <span className="font-semibold text-text-primary">{invoiceSupplier}</span> has been converted to a purchase order.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-card p-3 text-center">
                        <p className="text-[10px] uppercase text-text-muted font-medium">PO Number</p>
                        <p className="text-sm font-bold text-primary mt-0.5">{purchaseOrders[0]?.poNumber}</p>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <p className="text-[10px] uppercase text-text-muted font-medium">Items</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">{editingInvoiceLines.length}</p>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <p className="text-[10px] uppercase text-text-muted font-medium">Total</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">
                          {formatCurrency(editingInvoiceLines.reduce((s, l) => s + l.totalCost, 0))}
                        </p>
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Products Added to Inventory</h4>
                      <div className="space-y-2">
                        {editingInvoiceLines.slice(0, 6).map((line, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-surface-hover/30">
                            <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs text-text-primary flex-1 truncate">{line.rawName}</span>
                            <span className="text-xs font-mono text-text-muted">{line.qty} × ${line.unitCost.toFixed(2)}</span>
                            <span className="text-xs font-mono font-semibold text-emerald-400">{formatCurrency(line.totalCost)}</span>
                          </div>
                        ))}
                        {editingInvoiceLines.length > 6 && (
                          <p className="text-[10px] text-text-muted text-center">+{editingInvoiceLines.length - 6} more items</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Panel Footer */}
              <div className="shrink-0 border-t border-border p-4">
                {invoiceCreated ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={resetUpload}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        resetUpload();
                        // Open the newly created PO
                        if (purchaseOrders[0]) openReceiving(purchaseOrders[0]);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      View Purchase Order
                    </button>
                  </div>
                ) : parsedInvoice ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={resetUpload}
                      className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        resetUpload();
                        setShowUpload(true);
                      }}
                      className="px-4 py-2.5 text-sm font-medium text-text-secondary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                    >
                      Upload Different File
                    </button>
                    <button
                      onClick={createPOFromInvoice}
                      disabled={editingInvoiceLines.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Create Purchase Order ({editingInvoiceLines.length} items · {formatCurrency(editingInvoiceLines.reduce((s, l) => s + l.totalCost, 0))})
                    </button>
                  </div>
                ) : !uploadProcessing ? (
                  <button
                    onClick={resetUpload}
                    className="w-full px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====== GOODS RECEIPT SLIDE-OUT PANEL ====== */}
      <AnimatePresence>
        {selectedPO && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedPO(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[820px] max-w-[95vw] bg-bg-primary border-l border-border z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-heading text-text-primary">
                      {selectedPO.poNumber}
                    </h2>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      stageBgColors[selectedPO.status],
                      stageTextColors[selectedPO.status]
                    )}>
                      {selectedPO.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">
                    {selectedPO.supplier} · {selectedPO.items} items · {formatCurrency(selectedPO.amount)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPO(null)}
                  className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-text-muted" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* PO Info Bar */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="glass-card p-3">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Supplier</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{selectedPO.supplier}</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Order Date</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{formatDate(selectedPO.createdAt)}</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Expected Delivery</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{formatDate(selectedPO.expectedDelivery)}</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">PO Total</p>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">{formatCurrency(selectedPO.amount)}</p>
                  </div>
                </div>

                {/* Receipt Summary Cards */}
                {receivingSummary && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="glass-card p-3 border-emerald-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Full Match</p>
                      </div>
                      <p className="text-xl font-bold text-emerald-400">{receivingSummary.matches}</p>
                    </div>
                    <div className="glass-card p-3 border-amber-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Short</p>
                      </div>
                      <p className="text-xl font-bold text-amber-400">{receivingSummary.shorts}</p>
                    </div>
                    <div className="glass-card p-3 border-blue-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Over</p>
                      </div>
                      <p className="text-xl font-bold text-blue-400">{receivingSummary.overs}</p>
                    </div>
                    <div className="glass-card p-3 border-red-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                        <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Rejected</p>
                      </div>
                      <p className="text-xl font-bold text-red-400">{receivingSummary.rejected}</p>
                    </div>
                  </div>
                )}

                {/* Totals bar */}
                {receivingSummary && (
                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted">Total Ordered</p>
                      <p className="text-lg font-bold text-text-primary">{receivingSummary.totalOrdered} units</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted">Total Received</p>
                      <p className={cn(
                        "text-lg font-bold",
                        receivingSummary.totalReceived === receivingSummary.totalOrdered
                          ? "text-emerald-400"
                          : receivingSummary.totalReceived < receivingSummary.totalOrdered
                          ? "text-amber-400"
                          : "text-blue-400"
                      )}>
                        {receivingSummary.totalReceived} units
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted">Variance</p>
                      <p className={cn(
                        "text-lg font-bold",
                        receivingSummary.totalReceived - receivingSummary.totalOrdered === 0
                          ? "text-emerald-400"
                          : "text-amber-400"
                      )}>
                        {receivingSummary.totalReceived - receivingSummary.totalOrdered > 0 ? "+" : ""}
                        {receivingSummary.totalReceived - receivingSummary.totalOrdered} units
                      </p>
                    </div>
                  </div>
                )}

                {/* Section Title */}
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    Line Items — Goods Receipt
                  </h3>
                  {!receiptConfirmed && selectedPO.status !== "Received" && selectedPO.status !== "Paid" && (
                    <button
                      onClick={() => {
                        // Reset all to ordered qty
                        setReceivingLines((prev) =>
                          prev.map((line) => ({
                            ...line,
                            receivedQty: line.orderedQty,
                            adjustedCost: line.unitCost,
                            status: "match" as const,
                          }))
                        );
                      }}
                      className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-text-primary transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset All to Ordered
                    </button>
                  )}
                </div>

                {/* Line Items Table */}
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3">Product</th>
                          <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[80px]">Ordered</th>
                          <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[140px]">Received</th>
                          <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[90px]">Unit Cost</th>
                          <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[120px]">AI Notes</th>
                          <th className="text-right text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[100px]">Line Total</th>
                          <th className="text-center text-[10px] uppercase tracking-wider font-semibold text-text-muted p-3 w-[80px]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivingLines.map((line, idx) => {
                          const variance = line.receivedQty - line.orderedQty;
                          const variancePct = line.orderedQty > 0 ? ((variance / line.orderedQty) * 100).toFixed(1) : "0";
                          const isEditable = !receiptConfirmed && selectedPO.status !== "Received" && selectedPO.status !== "Paid";

                          return (
                            <motion.tr
                              key={line.productId + idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.02 }}
                              className={cn(
                                "border-b border-border/50 last:border-0 transition-colors",
                                line.status === "short" ? "bg-amber-500/5" :
                                line.status === "over" ? "bg-blue-500/5" :
                                line.status === "rejected" ? "bg-red-500/5" : ""
                              )}
                            >
                              {/* Product + Notes */}
                              <td className="p-3">
                                <p className="text-sm font-medium text-text-primary">{line.productName}</p>
                                <p className="text-[10px] text-text-muted">{line.sku}</p>
                                {/* CRM vs Invoice price indicator */}
                                {(() => {
                                  const product = mockProducts.find((p) => p.id === line.productId);
                                  if (!product || Math.abs(product.wholesalePrice - line.unitCost) <= 0.01) return null;
                                  return (
                                    <div className="flex items-center gap-1 mt-1">
                                      <DollarSign className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                                      <p className="text-[10px] text-blue-400">
                                        CRM price ${product.wholesalePrice.toFixed(2)} → ${line.unitCost.toFixed(2)}
                                      </p>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Ordered Qty */}
                              <td className="p-3 text-center">
                                <span className="text-sm font-mono text-text-primary">{line.orderedQty}</span>
                              </td>

                              {/* Received Qty — Editable */}
                              <td className="p-3">
                                {isEditable ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => updateReceivedQty(idx, line.receivedQty - 1)}
                                      className="p-1 rounded-md bg-surface-hover hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={line.receivedQty}
                                      onChange={(e) => updateReceivedQty(idx, parseInt(e.target.value) || 0)}
                                      className="w-16 text-center text-sm font-mono font-bold bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      onClick={() => updateReceivedQty(idx, line.receivedQty + 1)}
                                      className="p-1 rounded-md bg-surface-hover hover:bg-emerald-500/20 text-text-muted hover:text-emerald-400 transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <span className="text-sm font-mono font-bold text-text-primary">{line.receivedQty}</span>
                                    {variance !== 0 && (
                                      <span className={cn(
                                        "ml-1.5 text-[10px] font-semibold",
                                        variance > 0 ? "text-blue-400" : "text-amber-400"
                                      )}>
                                        ({variance > 0 ? "+" : ""}{variance})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Original Unit Cost */}
                              <td className="p-3 text-right">
                                <span className="text-sm font-mono text-text-muted">${line.unitCost.toFixed(2)}</span>
                              </td>

                              {/* AI Notes — color coded */}
                              <td className="p-3">
                                {line.notes ? (
                                  <div className={cn(
                                    "text-[10px] font-medium px-2 py-1.5 rounded-lg leading-tight",
                                    line.status === "short" || line.status === "rejected"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : line.status === "over"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "text-text-muted"
                                  )}>
                                    {line.notes}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-text-muted/40 italic">No issues</span>
                                )}
                              </td>

                              {/* Line Total */}
                              <td className="p-3 text-right">
                                <span className="text-sm font-mono font-semibold text-text-primary">
                                  ${(line.unitCost * line.receivedQty).toFixed(0)}
                                </span>
                                {line.receivedQty !== line.orderedQty && (
                                  <p className={cn(
                                    "text-[9px] font-mono mt-0.5",
                                    line.receivedQty < line.orderedQty ? "text-amber-400" : "text-blue-400"
                                  )}>
                                    was ${line.totalLineCost.toFixed(0)}
                                  </p>
                                )}
                              </td>

                              {/* Status */}
                              <td className="p-3 text-center">
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                                  line.status === "match" ? "bg-emerald-500/15 text-emerald-400" :
                                  line.status === "short" ? "bg-amber-500/15 text-amber-400" :
                                  line.status === "over" ? "bg-blue-500/15 text-blue-400" :
                                  "bg-red-500/15 text-red-400"
                                )}>
                                  {line.status}
                                </span>
                                {variance !== 0 && (
                                  <p className="text-[9px] text-text-muted mt-0.5">
                                    {variancePct}%
                                  </p>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* General Receipt Notes */}
                {!receiptConfirmed && selectedPO.status !== "Received" && selectedPO.status !== "Paid" && (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Receipt Notes</h4>
                    </div>
                    <textarea
                      value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)}
                      placeholder="Add general notes about this delivery (e.g. delivery condition, driver info, issues to follow up)..."
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-hover/50 border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 resize-none transition-colors"
                    />
                  </div>
                )}

                {/* Show notes on confirmed receipt */}
                {(receiptConfirmed || selectedPO.status === "Received" || selectedPO.status === "Paid") && receiptNotes && (
                  <div className="glass-card p-4 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Receipt Notes</h4>
                    </div>
                    <p className="text-xs text-text-secondary">{receiptNotes}</p>
                  </div>
                )}

                {/* Line item notes summary on confirmed */}
                {(receiptConfirmed || selectedPO.status === "Received" || selectedPO.status === "Paid") && receivingLines.some(l => l.notes) && (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Item Notes</h4>
                    </div>
                    <div className="space-y-1.5">
                      {receivingLines.filter(l => l.notes).map((line, i) => (
                        <div key={i} className={cn(
                          "flex items-start gap-2 text-xs p-2 rounded-lg border",
                          line.status === "short" || line.status === "rejected"
                            ? "bg-red-500/5 border-red-500/20"
                            : line.status === "over"
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-surface-hover/30 border-border/50"
                        )}>
                          <span className="font-medium text-text-primary shrink-0">{line.productName}:</span>
                          <span className={cn(
                            line.status === "short" || line.status === "rejected" ? "text-red-400" :
                            line.status === "over" ? "text-emerald-400" : "text-text-secondary"
                          )}>{line.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inventory Impact Preview */}
                {receivingSummary && receivingSummary.shorts > 0 && !receiptConfirmed && (
                  <div className="glass-card p-4 border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-amber-400">Variance Warning</h4>
                    </div>
                    <p className="text-xs text-text-muted mb-2">
                      {receivingSummary.shorts} item{receivingSummary.shorts > 1 ? "s" : ""} received short of ordered quantity.
                      Unit prices remain fixed from the invoice. Contact the supplier to resolve missing items — see AI notes on each line for details.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-muted">
                        Short by: <span className="font-bold text-amber-400">{receivingSummary.totalOrdered - receivingSummary.totalReceived} units</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Invoice Price ≠ CRM Price Banner */}
                {receivingLines.length > 0 && !receiptConfirmed && (() => {
                  const mismatches = receivingLines.filter((l) => {
                    const product = mockProducts.find((p) => p.id === l.productId);
                    return product && Math.abs(product.wholesalePrice - l.unitCost) > 0.01;
                  });
                  if (mismatches.length === 0) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4 border-blue-500/20 bg-blue-500/5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-bold text-blue-400">Price Mismatch Detected</h4>
                        <span className="ml-auto text-[10px] font-semibold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full">
                          {mismatches.length} item{mismatches.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mb-3">
                        Invoice prices differ from CRM wholesale prices. On confirmation, CRM prices will be <span className="font-semibold text-blue-400">auto-updated</span> to match the latest supplier invoice.
                      </p>
                      <div className="space-y-1.5">
                        {mismatches.slice(0, 5).map((line, idx) => {
                          const product = mockProducts.find((p) => p.id === line.productId);
                          const oldPrice = product?.wholesalePrice || 0;
                          const diff = line.unitCost - oldPrice;
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-surface-hover/30 rounded-lg px-2 py-1.5">
                              <span className="text-text-primary flex-1 truncate">{line.productName}</span>
                              <span className="text-text-muted font-mono">CRM: ${oldPrice.toFixed(2)}</span>
                              <ArrowRight className="h-3 w-3 text-blue-400" />
                              <span className="font-mono font-bold text-blue-400">Invoice: ${line.unitCost.toFixed(2)}</span>
                              <span className={cn(
                                "text-[10px] font-semibold",
                                diff > 0 ? "text-red-400" : "text-emerald-400"
                              )}>
                                {diff > 0 ? "+" : ""}{((diff / oldPrice) * 100).toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                        {mismatches.length > 5 && (
                          <p className="text-[10px] text-text-muted text-center">+{mismatches.length - 5} more</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Receipt Confirmed Success */}
                {receiptConfirmed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-5 border-emerald-500/30 bg-emerald-500/5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-400">Goods Receipt Confirmed</h4>
                        <p className="text-xs text-text-muted">
                          {selectedPO.poNumber} has been marked as received. Inventory has been updated.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-surface-hover/50 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-text-muted font-medium">Items Received</p>
                        <p className="text-lg font-bold text-text-primary">{receivingSummary?.totalReceived} units</p>
                      </div>
                      <div className="bg-surface-hover/50 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-text-muted font-medium">Stock Updated</p>
                        <p className="text-lg font-bold text-emerald-400">{receivingLines.length} products</p>
                      </div>
                      <div className="bg-surface-hover/50 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-text-muted font-medium">CRM Price Updates</p>
                        <p className="text-lg font-bold text-amber-400">
                          {receivingLines.filter((l) => {
                            const product = mockProducts.find((p) => p.id === l.productId);
                            return product && Math.abs(product.wholesalePrice - l.unitCost) > 0.01;
                          }).length} items
                        </p>
                      </div>
                    </div>

                    {/* Show inventory impact per product */}
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] uppercase text-text-muted font-semibold tracking-wider">Inventory Changes</p>
                      {receivingLines.filter((l) => l.receivedQty > 0).slice(0, 6).map((line, idx) => {
                        const product = mockProducts.find((p) => p.id === line.productId);
                        const previousStock = product?.stockLevel || 0;
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-surface-hover/30 rounded-lg p-2">
                            <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{line.productName}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-text-muted font-mono">{previousStock}</span>
                              <ArrowRight className="h-3 w-3 text-emerald-400" />
                              <span className="font-mono font-bold text-emerald-400">{previousStock + line.receivedQty}</span>
                              <span className="text-emerald-400 text-[10px]">(+{line.receivedQty})</span>
                            </div>
                          </div>
                        );
                      })}
                      {receivingLines.filter((l) => l.receivedQty > 0).length > 6 && (
                        <p className="text-[10px] text-text-muted text-center">
                          +{receivingLines.filter((l) => l.receivedQty > 0).length - 6} more items updated
                        </p>
                      )}
                    </div>

                    {/* Invoice Price vs CRM Price — Auto Updates */}
                    {(() => {
                      const priceUpdates = receivingLines.filter((l) => {
                        const product = mockProducts.find((p) => p.id === l.productId);
                        return product && Math.abs(product.wholesalePrice - l.unitCost) > 0.01;
                      });
                      if (priceUpdates.length === 0) return null;
                      return (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                            <p className="text-[10px] uppercase text-amber-400 font-semibold tracking-wider">Wholesale Price Auto-Updated</p>
                          </div>
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-2">
                            <p className="text-[10px] text-text-muted mb-2">
                              Invoice prices differ from CRM — wholesale prices have been auto-updated to match supplier invoices.
                            </p>
                            {priceUpdates.map((line, idx) => {
                              const product = mockProducts.find((p) => p.id === line.productId);
                              const oldPrice = product?.wholesalePrice || 0;
                              const diff = line.unitCost - oldPrice;
                              const diffPct = oldPrice > 0 ? ((diff / oldPrice) * 100).toFixed(1) : "0";
                              return (
                                <div key={idx} className="flex items-center gap-3 bg-surface-hover/30 rounded-lg p-2">
                                  <DollarSign className="h-3 w-3 text-amber-400 shrink-0" />
                                  <span className="text-xs font-medium text-text-primary flex-1 truncate">{line.productName}</span>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-text-muted font-mono line-through">${oldPrice.toFixed(2)}</span>
                                    <ArrowRight className="h-3 w-3 text-amber-400" />
                                    <span className="font-mono font-bold text-amber-400">${line.unitCost.toFixed(2)}</span>
                                    <span className={cn(
                                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                      diff > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                                    )}>
                                      {diff > 0 ? "+" : ""}{diffPct}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </div>

              {/* Panel Footer — Action Buttons */}
              <div className="shrink-0 border-t border-border p-4">
                {selectedPO.status === "Received" || selectedPO.status === "Paid" || receiptConfirmed ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {receiptConfirmed ? "Receipt confirmed — stock updated" : "This order has been received"}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedPO(null)}
                      className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedPO(null)}
                      className="px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary bg-surface-hover hover:bg-surface-hover/80 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmReceipt}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="h-4 w-4" />
                      Confirm Goods Receipt & Update Inventory
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
