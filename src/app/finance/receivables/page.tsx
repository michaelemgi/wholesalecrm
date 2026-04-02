"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Clock, AlertTriangle, CheckCircle2, Eye, FileText, ChevronRight, X, Printer, Download, Send, CreditCard, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { Invoice } from "@/types";
import DateRangeFilter, { DateRange, isInRange } from "@/components/DateRangeFilter";

const statusColors: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400",
  Sent: "bg-blue-500/20 text-blue-400",
  Viewed: "bg-indigo-500/20 text-indigo-400",
  Paid: "bg-emerald-500/20 text-emerald-400",
  Partial: "bg-amber-500/20 text-amber-400",
  Overdue: "bg-red-500/20 text-red-400",
  Void: "bg-gray-500/20 text-gray-500",
};

const agingData = [
  { range: "0-30 days", amount: 142500, color: "#10b981" },
  { range: "31-60 days", amount: 67800, color: "#f59e0b" },
  { range: "61-90 days", amount: 21300, color: "#ef4444" },
  { range: "90+ days", amount: 12400, color: "#dc2626" },
];

// --- Mock line items per invoice ---
const mockLineItemsMap: Record<string, { product: string; qty: number; unitPrice: number }[]> = {
  "inv-001": [
    { product: "Organic Olive Oil 5L", qty: 120, unitPrice: 42 },
    { product: "Brown Rice 25kg", qty: 80, unitPrice: 38 },
    { product: "Sea Salt 10kg", qty: 150, unitPrice: 15 },
    { product: "Chia Seeds 10lb", qty: 45, unitPrice: 42 },
  ],
  "inv-002": [
    { product: "Portland Cement 50lb", qty: 500, unitPrice: 12 },
    { product: "Plywood 4x8 3/4in", qty: 200, unitPrice: 48 },
    { product: "Rebar #4 20ft", qty: 300, unitPrice: 18 },
    { product: "Drywall 4x8 1/2in", qty: 150, unitPrice: 14 },
    { product: "Concrete Mix 80lb", qty: 400, unitPrice: 8 },
  ],
  "inv-003": [
    { product: "Mixed Greens Case", qty: 50, unitPrice: 32 },
    { product: "Avocados 48ct", qty: 60, unitPrice: 48 },
    { product: "Frozen Shrimp 10lb", qty: 30, unitPrice: 85 },
  ],
  "inv-004": [
    { product: "Wire 14ga 500ft", qty: 120, unitPrice: 65 },
    { product: "Insulation R-13 Roll", qty: 200, unitPrice: 42 },
    { product: "Lumber 2x4 8ft", qty: 800, unitPrice: 6 },
    { product: "Roofing Shingles Bundle", qty: 300, unitPrice: 35 },
    { product: "PVC Pipe 4in 10ft", qty: 150, unitPrice: 15 },
  ],
  "inv-005": [
    { product: "Premium Steak Cuts Case", qty: 80, unitPrice: 245 },
    { product: "Salmon Fillet Case", qty: 100, unitPrice: 125 },
    { product: "Frozen Shrimp 10lb", qty: 120, unitPrice: 85 },
    { product: "Butter Unsalted 36ct", qty: 60, unitPrice: 96 },
  ],
  "inv-006": [
    { product: "Corrugated Box 12x12", qty: 2000, unitPrice: 2 },
    { product: "Stretch Wrap 18in", qty: 80, unitPrice: 28 },
    { product: "Kraft Paper Rolls", qty: 40, unitPrice: 35 },
  ],
  "inv-007": [
    { product: "All-Purpose Flour 50lb", qty: 1200, unitPrice: 22 },
    { product: "Sugar Granulated 50lb", qty: 800, unitPrice: 28 },
    { product: "Brown Rice 25kg", qty: 600, unitPrice: 38 },
    { product: "Organic Quinoa 25lb", qty: 200, unitPrice: 56 },
    { product: "Coconut Oil 5gal", qty: 150, unitPrice: 68 },
  ],
  "inv-008": [
    { product: "EVOO Premium 5L", qty: 150, unitPrice: 58 },
    { product: "Pasta Variety Case", qty: 120, unitPrice: 36 },
    { product: "San Marzano Tomatoes 6ct", qty: 200, unitPrice: 28 },
  ],
  "inv-009": [
    { product: "Avocados 48ct", qty: 100, unitPrice: 48 },
    { product: "Mixed Greens Case", qty: 80, unitPrice: 32 },
    { product: "Ice Cream 3gal", qty: 60, unitPrice: 38 },
  ],
  "inv-010": [
    { product: "Premium Steak Cuts Case", qty: 100, unitPrice: 245 },
    { product: "Salmon Fillet Case", qty: 120, unitPrice: 125 },
    { product: "Frozen Pizza Cases", qty: 200, unitPrice: 52 },
    { product: "Sparkling Water 24pk", qty: 500, unitPrice: 18 },
    { product: "Frozen Shrimp 10lb", qty: 80, unitPrice: 85 },
  ],
};

const customerAddresses: Record<string, string> = {
  "cust-001": "450 Pacific Ave, San Francisco, CA 94133",
  "cust-002": "1200 Metro Blvd, Oakland, CA 94612",
  "cust-003": "890 Valley Rd, Salinas, CA 93901",
  "cust-004": "75 Harbor Way, Long Beach, CA 90802",
  "cust-008": "3200 Titan Dr, Phoenix, AZ 85034",
  "cust-010": "555 Pinnacle Ave, Las Vegas, NV 89109",
  "cust-012": "1800 Grain Exchange Blvd, Chicago, IL 60604",
  "cust-018": "420 Golden Gate Pkwy, Sacramento, CA 95814",
};

// --- Invoice Detail Panel ---
function InvoiceDetailPanel({ invoice, onClose, onMarkPaid }: {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
}) {
  const [sendConfirm, setSendConfirm] = useState(false);

  const lineItems = mockLineItemsMap[invoice.id] || [
    { product: "Miscellaneous Goods", qty: 10, unitPrice: invoice.amount / 10 },
  ];
  const subtotal = lineItems.reduce((s, item) => s + item.qty * item.unitPrice, 0);
  const taxRate = 0.085;
  const tax = subtotal * taxRate;
  const shipping = subtotal > 20000 ? 450 : subtotal > 10000 ? 275 : 125;
  const total = subtotal + tax + shipping;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    window.print();
  };

  const handleSend = () => {
    setSendConfirm(true);
    setTimeout(() => setSendConfirm(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end print:static print:inset-auto print:z-auto"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-[720px] max-w-full bg-background border-l border-border overflow-y-auto print:w-full print:border-none print:static"
      >
        {/* Action bar - hidden on print */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-text-primary">Invoice {invoice.invoiceNumber}</h2>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusColors[invoice.status])}>
                {invoice.status}
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              <Printer className="h-4 w-4" /> Print Invoice
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-primary text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-primary text-sm font-medium transition-colors"
            >
              <Send className="h-4 w-4" /> {sendConfirm ? "Sent!" : "Send to Customer"}
            </button>
            {invoice.status !== "Paid" && invoice.status !== "Void" && (
              <button
                onClick={() => onMarkPaid(invoice.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors ml-auto"
              >
                <CreditCard className="h-4 w-4" /> Mark as Paid
              </button>
            )}
          </div>
        </div>

        {/* Printable Invoice Content */}
        <div className="p-8 invoice-printable">
          {/* Company Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-border print:border-gray-300">
            <div>
              <h1 className="text-2xl font-bold font-heading text-text-primary print:text-black">WholesaleOS Inc.</h1>
              <p className="text-sm text-text-muted print:text-gray-600 mt-1">100 Market St Suite 400</p>
              <p className="text-sm text-text-muted print:text-gray-600">San Francisco, CA 94105</p>
              <p className="text-sm text-text-muted print:text-gray-600 mt-1">info@wholesaleos.com | (415) 555-0100</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold font-heading text-primary print:text-blue-600">INVOICE</h2>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-text-primary print:text-black font-medium">{invoice.invoiceNumber}</p>
                <div className="inline-flex">
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium print:border print:border-current", statusColors[invoice.status])}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details & Bill To */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
              <p className="text-sm font-semibold text-text-primary print:text-black">{invoice.customerName}</p>
              <p className="text-sm text-text-secondary print:text-gray-600 mt-1">{customerAddresses[invoice.customerId] || "Address on file"}</p>
            </div>
            <div className="text-right space-y-2">
              <div>
                <span className="text-xs text-text-muted print:text-gray-500 uppercase tracking-wider">Issue Date</span>
                <p className="text-sm font-medium text-text-primary print:text-black">{formatDate(invoice.issuedDate)}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted print:text-gray-500 uppercase tracking-wider">Due Date</span>
                <p className="text-sm font-medium text-text-primary print:text-black">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted print:text-gray-500 uppercase tracking-wider">Payment Terms</span>
                <p className="text-sm font-medium text-text-primary print:text-black">{invoice.paymentTerms}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border print:border-gray-400">
                  <th className="py-3 text-left text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider">#</th>
                  <th className="py-3 text-left text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="py-3 text-right text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="py-3 text-right text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="py-3 text-right text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 print:border-gray-200"
                  >
                    <td className="py-3 text-text-muted print:text-gray-500">{i + 1}</td>
                    <td className="py-3 text-text-primary print:text-black font-medium">{item.product}</td>
                    <td className="py-3 text-right text-text-secondary print:text-gray-700">{item.qty.toLocaleString()}</td>
                    <td className="py-3 text-right text-text-secondary print:text-gray-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right text-text-primary print:text-black font-medium">{formatCurrency(item.qty * item.unitPrice)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted print:text-gray-500">Subtotal</span>
                <span className="text-text-primary print:text-black font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted print:text-gray-500">Tax (8.5%)</span>
                <span className="text-text-primary print:text-black font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted print:text-gray-500">Shipping</span>
                <span className="text-text-primary print:text-black font-medium">{formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t-2 border-border print:border-gray-400">
                <span className="font-bold text-text-primary print:text-black text-base">Total</span>
                <span className="font-bold text-text-primary print:text-black text-base">{formatCurrency(total)}</span>
              </div>
              {invoice.paidAmount > 0 && invoice.status !== "Paid" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400 print:text-green-600">Paid</span>
                    <span className="text-emerald-400 print:text-green-600 font-medium">-{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border print:border-gray-300">
                    <span className="font-semibold text-text-primary print:text-black">Balance Due</span>
                    <span className="font-semibold text-danger print:text-red-600">{formatCurrency(total - invoice.paidAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border print:border-gray-300">
            <div>
              <h4 className="text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider mb-2">Payment Terms</h4>
              <p className="text-sm text-text-secondary print:text-gray-700">{invoice.paymentTerms}. Payment is due by {formatDate(invoice.dueDate)}.</p>
              <p className="text-sm text-text-secondary print:text-gray-700 mt-1">Please include invoice number {invoice.invoiceNumber} with your payment.</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-text-muted print:text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm text-text-secondary print:text-gray-700">Thank you for your business. For any questions regarding this invoice, please contact our accounts receivable team at ar@wholesaleos.com.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-border/50 print:border-gray-200 text-center">
            <p className="text-xs text-text-muted print:text-gray-400">WholesaleOS Inc. | EIN: 94-3201847 | Terms subject to Master Service Agreement</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ReceivablesPage() {
  const { data: apiInvoices = [], isLoading } = useSWR<Invoice[]>('/api/finance/invoices', fetcher);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-72 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesInitialized, setInvoicesInitialized] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "", endDate: "", label: "Last 30 Days" });
  const [sortField, setSortField] = useState<"invoiceNumber" | "customerName" | "amount" | "dueDate" | "status">("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (apiInvoices.length > 0 && !invoicesInitialized) {
    setInvoices(apiInvoices);
    setInvoicesInitialized(true);
  }
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalOutstanding = invoices.filter(i => i.status !== "Paid" && i.status !== "Void").reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdueTotal = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const paidThisMonth = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0);

  const dateFiltered = dateRange.startDate
    ? invoices.filter(i => isInRange(i.issuedDate, dateRange))
    : invoices;
  const filtered = filter === "all" ? dateFiltered : dateFiltered.filter(i => i.status === filter);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else {
        const aVal = a[sortField] ?? "";
        const bVal = b[sortField] ?? "";
        cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "amount" ? "desc" : "asc");
    }
  };

  function SortHeader({ field, label, align = "left" }: { field: typeof sortField; label: string; align?: "left" | "right" }) {
    const active = sortField === field;
    return (
      <th
        onClick={() => toggleSort(field)}
        className={cn(
          "py-2.5 px-3 text-xs font-medium text-text-muted uppercase cursor-pointer select-none hover:text-text-secondary transition-colors",
          align === "right" ? "text-right" : "text-left"
        )}
      >
        <span className={cn("inline-flex items-center gap-1", align === "right" && "justify-end")}>
          {label}
          {active ? (
            sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </span>
      </th>
    );
  }

  const handleMarkPaid = (id: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv;
      return { ...inv, status: "Paid" as const, paidAmount: inv.amount, paidDate: new Date().toISOString().split("T")[0] };
    }));
    setSelectedInvoice(prev => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, status: "Paid" as const, paidAmount: prev.amount, paidDate: new Date().toISOString().split("T")[0] };
    });
  };

  return (
    <div className="space-y-6">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-printable, .invoice-printable * { visibility: visible !important; }
          .invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 40px !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:text-black { color: black !important; }
          .print\\:text-gray-300 { color: #d1d5db !important; }
          .print\\:text-gray-400 { color: #9ca3af !important; }
          .print\\:text-gray-500 { color: #6b7280 !important; }
          .print\\:text-gray-600 { color: #4b5563 !important; }
          .print\\:text-gray-700 { color: #374151 !important; }
          .print\\:text-blue-600 { color: #2563eb !important; }
          .print\\:text-green-600 { color: #16a34a !important; }
          .print\\:text-red-600 { color: #dc2626 !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:border-gray-400 { border-color: #9ca3af !important; }
        }
      `}</style>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Accounts Receivable</h1>
          <p className="text-sm text-text-muted mt-1">Track invoices, payments, and aging receivables</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCSV(filtered.map(inv => ({ invoiceNumber: inv.invoiceNumber, customer: inv.customerName, status: inv.status, amount: inv.amount, paid: inv.paidAmount, dueDate: inv.dueDate })), 'receivables', [{ key: 'invoiceNumber', label: 'Invoice #' }, { key: 'customer', label: 'Customer' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }, { key: 'paid', label: 'Paid' }, { key: 'dueDate', label: 'Due Date' }])} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/50 text-sm transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
          <DateRangeFilter onChange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding", value: totalOutstanding, icon: DollarSign, color: "text-primary", bg: "bg-primary-light" },
          { label: "Overdue Amount", value: overdueTotal, icon: AlertTriangle, color: "text-danger", bg: "bg-danger-light" },
          { label: "Paid This Month", value: paidThisMonth, icon: CheckCircle2, color: "text-success", bg: "bg-success-light" },
          { label: "Avg Days to Pay", value: 18, icon: Clock, color: "text-warning", bg: "bg-warning-light", isSuffix: true },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{kpi.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", kpi.bg)}>
                  <Icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold font-heading text-text-primary">
                {kpi.isSuffix ? `${kpi.value} days` : formatCurrency(kpi.value)}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-sm font-semibold text-text-primary">Invoices</h3>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {["all", "Sent", "Viewed", "Overdue", "Paid"].map(s => (
                  <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors", filter === s ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
              <select
                value={`${sortField}-${sortDir}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split("-") as [typeof sortField, "asc" | "desc"];
                  setSortField(f);
                  setSortDir(d);
                }}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary outline-none focus:border-primary"
              >
                <option value="dueDate-desc">Due Date Newest</option>
                <option value="dueDate-asc">Due Date Oldest</option>
                <option value="amount-desc">Amount High–Low</option>
                <option value="amount-asc">Amount Low–High</option>
                <option value="customerName-asc">Customer A–Z</option>
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <SortHeader field="invoiceNumber" label="Invoice" />
                <SortHeader field="customerName" label="Customer" />
                <SortHeader field="status" label="Status" />
                <SortHeader field="amount" label="Amount" align="right" />
                <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase">Paid</th>
                <SortHeader field="dueDate" label="Due Date" align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-medium text-text-primary">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-text-muted" />
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">{inv.customerName}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", statusColors[inv.status])}>{inv.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-primary font-medium">{formatCurrency(inv.amount)}</td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">{formatCurrency(inv.paidAmount)}</td>
                  <td className="py-2.5 px-3 text-right text-text-muted">{formatDate(inv.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Aging Report</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#f1f5f9" }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={36}>
                {agingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {agingData.map(a => (
              <div key={a.range} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                  <span className="text-text-secondary">{a.range}</span>
                </div>
                <span className="font-medium text-text-primary">{formatCurrency(a.amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Invoice Detail Slide-out */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailPanel
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onMarkPaid={handleMarkPaid}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
