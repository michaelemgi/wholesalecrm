import { z } from "zod";
import { NextResponse } from "next/server";

// ── Shared validation helper ────────────────────────────────────────────────

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    return {
      success: false,
      response: NextResponse.json(
        { error: "Validation failed", fields: errors.fieldErrors },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

// ── API error response helper ───────────────────────────────────────────────

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

// ── Schemas ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string().min(1, "Industry is required"),
  accountTier: z.enum(["Enterprise", "Mid-Market", "SMB"]),
  region: z.string().min(1, "Region is required"),
  address: z.string().min(1, "Address is required"),
  assignedRep: z.string().min(1, "Assigned rep is required"),
  accountSince: z.string().min(1, "Account since date is required"),
  logo: z.string().nullable().optional(),
  totalRevenue: z.number().optional().default(0),
  creditLimit: z.number().optional().default(0),
  outstandingBalance: z.number().optional().default(0),
  paymentScore: z.number().int().min(0).max(100).optional().default(0),
  orderFrequencyDays: z.number().int().optional().default(0),
  topProducts: z.string().optional().default("[]"),
  tags: z.string().optional().default("[]"),
  notes: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  unitPrice: z.number().positive("Unit price must be positive"),
  wholesalePrice: z.number().positive("Wholesale price must be positive"),
  tier1Price: z.number().positive("Tier 1 price must be positive"),
  tier2Price: z.number().positive("Tier 2 price must be positive"),
  tier3Price: z.number().positive("Tier 3 price must be positive"),
  vipPrice: z.number().positive("VIP price must be positive"),
  stockLevel: z.number().int().min(0).optional().default(0),
  reorderPoint: z.number().int().min(0).optional().default(0),
  warehouseLocation: z.string().optional().default("A1-01"),
  warehouse: z.string().optional().default("Main Warehouse"),
  unit: z.string().optional().default("Each"),
  weight: z.number().min(0).optional().default(0),
  supplier: z.string().optional().default(""),
  leadTimeDays: z.number().int().min(0).optional().default(0),
  expiryDate: z.string().nullable().optional(),
  status: z.enum(["Active", "Low Stock", "Out of Stock", "Discontinued"]).optional().default("Active"),
  description: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  brandWebsite: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
});

export const orderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer name is required"),
  status: z.string().optional().default("Draft"),
  subtotal: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  shipping: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  total: z.number().min(0).optional().default(0),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  paymentStatus: z.string().optional().default("Unpaid"),
  shippingMethod: z.string().min(1, "Shipping method is required"),
  trackingNumber: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  assignedRep: z.string().min(1, "Assigned rep is required"),
  notes: z.string().nullable().optional(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    sku: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    total: z.number(),
  })).min(1, "At least one item is required"),
});

export const leadSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  industry: z.string().min(1, "Industry is required"),
  location: z.string().min(1, "Location is required"),
  source: z.string().min(1, "Source is required"),
  website: z.string().nullable().optional(),
  linkedIn: z.string().nullable().optional(),
  employeeCount: z.number().int().optional().default(0),
  estimatedRevenue: z.number().optional().default(0),
  score: z.number().int().min(0).max(100).optional().default(0),
  status: z.string().optional().default("Cold"),
  assignedRep: z.string().nullable().optional(),
  tags: z.string().optional().default("[]"),
});

export const pipelineDealSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  value: z.number().positive("Deal value must be positive"),
  stage: z.string().min(1, "Stage is required"),
  assignedRep: z.string().min(1, "Assigned rep is required"),
  leadSource: z.string().optional(),
  notes: z.string().nullable().optional(),
  winProbability: z.number().int().min(0).max(100).optional().default(0),
  customerId: z.string().nullable().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  category: z.string().min(1, "Category is required"),
  paymentTerms: z.string().optional().default("Net 30"),
  leadTimeDays: z.number().int().min(0).optional().default(7),
  website: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).optional().default(0),
});

export const shipmentSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  orderId: z.string().min(1, "Order is required"),
  customerId: z.string().min(1, "Customer is required"),
  carrier: z.string().min(1, "Carrier is required"),
  status: z.string().optional().default("Picked Up"),
  shippedAt: z.string().nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
});

export const returnSchema = z.object({
  rmaNumber: z.string().min(1, "RMA number is required"),
  orderId: z.string().min(1, "Order is required"),
  customerId: z.string().min(1, "Customer is required"),
  reason: z.string().min(1, "Reason is required"),
  status: z.string().optional().default("Pending"),
  refundAmount: z.number().min(0).optional().default(0),
  notes: z.string().nullable().optional(),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer name is required"),
  orderId: z.string().min(1, "Order is required"),
  amount: z.number().positive("Amount must be positive"),
  paidAmount: z.number().min(0).optional().default(0),
  status: z.string().optional().default("Draft"),
  dueDate: z.string().min(1, "Due date is required"),
  issuedDate: z.string().min(1, "Issued date is required"),
  paidDate: z.string().nullable().optional(),
  paymentTerms: z.string().min(1, "Payment terms are required"),
});

export const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  vendor: z.string().min(1, "Vendor is required"),
  date: z.string().min(1, "Date is required"),
  status: z.string().optional().default("Pending"),
});

export const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.unknown(),
});
