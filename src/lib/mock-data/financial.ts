import { MonthlyFinancial, Invoice, Expense } from "@/types";

export const mockFinancials: MonthlyFinancial[] = [
  { month: "Oct 2025", revenue: 1245000, expenses: 892000, profit: 353000, ordersCount: 342, newCustomers: 8 },
  { month: "Nov 2025", revenue: 1380000, expenses: 945000, profit: 435000, ordersCount: 378, newCustomers: 12 },
  { month: "Dec 2025", revenue: 1520000, expenses: 1020000, profit: 500000, ordersCount: 410, newCustomers: 6 },
  { month: "Jan 2026", revenue: 1180000, expenses: 865000, profit: 315000, ordersCount: 298, newCustomers: 10 },
  { month: "Feb 2026", revenue: 1340000, expenses: 920000, profit: 420000, ordersCount: 356, newCustomers: 14 },
  { month: "Mar 2026", revenue: 1485000, expenses: 985000, profit: 500000, ordersCount: 392, newCustomers: 11 },
];

export const mockInvoices: Invoice[] = [
  { id: "inv-001", invoiceNumber: "INV-1901", customerId: "cust-001", customerName: "Pacific Foods Distribution", orderId: "ord-001", status: "Paid", amount: 14250, paidAmount: 14250, dueDate: "2026-03-15", issuedDate: "2026-02-28", paidDate: "2026-03-12", paymentTerms: "Net 15" },
  { id: "inv-002", invoiceNumber: "INV-1902", customerId: "cust-002", customerName: "Metro Building Supply", orderId: "ord-002", status: "Paid", amount: 28750, paidAmount: 28750, dueDate: "2026-03-20", issuedDate: "2026-02-20", paidDate: "2026-03-18", paymentTerms: "Net 30" },
  { id: "inv-003", invoiceNumber: "INV-1910", customerId: "cust-003", customerName: "Valley Produce Partners", orderId: "ord-003", status: "Overdue", amount: 8900, paidAmount: 0, dueDate: "2026-03-10", issuedDate: "2026-02-25", paymentTerms: "Net 15" },
  { id: "inv-004", invoiceNumber: "INV-1915", customerId: "cust-004", customerName: "Harbor Industries LLC", orderId: "ord-004", status: "Sent", amount: 42000, paidAmount: 0, dueDate: "2026-04-15", issuedDate: "2026-03-15", paymentTerms: "Net 30" },
  { id: "inv-005", invoiceNumber: "INV-1920", customerId: "cust-008", customerName: "Titan Construction Materials", orderId: "ord-005", status: "Viewed", amount: 67500, paidAmount: 0, dueDate: "2026-04-10", issuedDate: "2026-03-10", paymentTerms: "Net 30" },
  { id: "inv-006", invoiceNumber: "INV-1924", customerId: "cust-002", customerName: "Metro Building Supply", orderId: "ord-006", status: "Paid", amount: 8750, paidAmount: 8750, dueDate: "2026-03-25", issuedDate: "2026-03-10", paidDate: "2026-03-28", paymentTerms: "Net 15" },
  { id: "inv-007", invoiceNumber: "INV-1928", customerId: "cust-012", customerName: "Midwest Grain Traders", orderId: "ord-007", status: "Partial", amount: 126000, paidAmount: 80000, dueDate: "2026-04-20", issuedDate: "2026-03-20", paymentTerms: "Net 30" },
  { id: "inv-008", invoiceNumber: "INV-1930", customerId: "cust-010", customerName: "Pinnacle Hospitality Group", orderId: "ord-008", status: "Sent", amount: 34500, paidAmount: 0, dueDate: "2026-04-25", issuedDate: "2026-03-25", paymentTerms: "Net 30" },
  { id: "inv-009", invoiceNumber: "INV-1891", customerId: "cust-003", customerName: "Valley Produce Partners", orderId: "ord-009", status: "Overdue", amount: 12400, paidAmount: 0, dueDate: "2026-03-01", issuedDate: "2026-02-14", paymentTerms: "Net 15" },
  { id: "inv-010", invoiceNumber: "INV-1935", customerId: "cust-018", customerName: "Golden State Distributors", orderId: "ord-010", status: "Draft", amount: 95000, paidAmount: 0, dueDate: "2026-05-01", issuedDate: "2026-03-28", paymentTerms: "Net 30" },
];

export const mockExpenses: Expense[] = [
  { id: "exp-001", category: "COGS", description: "Supplier payment — Global Supply Co.", amount: 245000, vendor: "Global Supply Co.", date: "2026-03-25", status: "Paid" },
  { id: "exp-002", category: "COGS", description: "Supplier payment — Pacific Trade Inc.", amount: 185000, vendor: "Pacific Trade Inc.", date: "2026-03-22", status: "Paid" },
  { id: "exp-003", category: "Shipping", description: "FedEx monthly freight charges", amount: 28500, vendor: "FedEx", date: "2026-03-20", status: "Paid" },
  { id: "exp-004", category: "Shipping", description: "UPS ground shipping", amount: 15200, vendor: "UPS", date: "2026-03-18", status: "Paid" },
  { id: "exp-005", category: "Marketing", description: "Meta Ads — March campaigns", amount: 10530, vendor: "Meta Platforms", date: "2026-03-28", status: "Pending" },
  { id: "exp-006", category: "Marketing", description: "Instantly cold email platform", amount: 297, vendor: "Instantly.ai", date: "2026-03-01", status: "Paid" },
  { id: "exp-007", category: "Payroll", description: "March payroll — 11 employees", amount: 142000, vendor: "ADP Payroll", date: "2026-03-28", status: "Pending" },
  { id: "exp-008", category: "Overhead", description: "Warehouse A rent — March", amount: 18500, vendor: "West Coast Properties", date: "2026-03-01", status: "Paid" },
  { id: "exp-009", category: "Overhead", description: "Warehouse B rent — March", amount: 22000, vendor: "Central Storage Inc.", date: "2026-03-01", status: "Paid" },
  { id: "exp-010", category: "Utilities", description: "Electric & gas — all warehouses", amount: 8400, vendor: "Pacific Gas & Electric", date: "2026-03-15", status: "Paid" },
  { id: "exp-011", category: "Software", description: "WholesaleOS Enterprise subscription", amount: 2499, vendor: "WholesaleOS", date: "2026-03-01", status: "Paid" },
  { id: "exp-012", category: "Software", description: "Salesforce CRM", amount: 1500, vendor: "Salesforce", date: "2026-03-01", status: "Paid" },
  { id: "exp-013", category: "COGS", description: "Midwest Wholesale inventory restock", amount: 156000, vendor: "Midwest Wholesale", date: "2026-03-15", status: "Paid" },
  { id: "exp-014", category: "Shipping", description: "LTL freight — bulk orders", amount: 12800, vendor: "XPO Logistics", date: "2026-03-12", status: "Paid" },
  { id: "exp-015", category: "Marketing", description: "Trade show registration — Q2", amount: 5000, vendor: "FoodExpo Inc.", date: "2026-03-20", status: "Approved" },
];
