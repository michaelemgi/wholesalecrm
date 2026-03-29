import { Order } from "@/types";
import { mockCustomers } from "./customers";

const statuses: Order["status"][] = ["Draft", "Confirmed", "Processing", "Picking", "Packed", "Shipped", "Delivered", "Returned"];
const paymentStatuses: Order["paymentStatus"][] = ["Unpaid", "Partial", "Paid", "Overdue"];
const reps = ["Sarah Mitchell", "Mike Thompson", "David Lee", "Alex Rivera"];
const terms = ["Net 15", "Net 30", "Net 45", "Net 60"];
const methods = ["FedEx Ground", "UPS Standard", "LTL Freight", "Local Delivery", "Customer Pickup"];

const productItems = [
  { productId: "prod-001", productName: "Organic Olive Oil 5L", sku: "SKU-1001", unitPrice: 28 },
  { productId: "prod-004", productName: "All-Purpose Flour 50lb", sku: "SKU-1004", unitPrice: 14 },
  { productId: "prod-021", productName: "Portland Cement 50lb", sku: "SKU-2001", unitPrice: 7 },
  { productId: "prod-031", productName: "Corrugated Box 12x12", sku: "SKU-3001", unitPrice: 1 },
  { productId: "prod-010", productName: "Frozen Shrimp 10lb", sku: "SKU-1010", unitPrice: 62 },
  { productId: "prod-023", productName: "Plywood 4x8 3/4in", sku: "SKU-2003", unitPrice: 32 },
  { productId: "prod-006", productName: "Butter Unsalted 36ct", sku: "SKU-1006", unitPrice: 72 },
  { productId: "prod-012", productName: "Premium Steak Cuts Case", sku: "SKU-1012", unitPrice: 185 },
  { productId: "prod-041", productName: "Steel Pipe 4in 20ft", sku: "SKU-4001", unitPrice: 58 },
  { productId: "prod-048", productName: "Industrial Cleaner 5gal", sku: "SKU-4008", unitPrice: 28 },
];

function generateOrder(i: number): Order {
  const cust = mockCustomers[i % mockCustomers.length];
  const numItems = 2 + Math.floor(Math.random() * 4);
  const items = Array.from({ length: numItems }, () => {
    const item = productItems[Math.floor(Math.random() * productItems.length)];
    const qty = 5 + Math.floor(Math.random() * 50);
    return { ...item, quantity: qty, total: item.unitPrice * qty };
  });
  const subtotal = items.reduce((s, item) => s + item.total, 0);
  const tax = Math.round(subtotal * 0.08);
  const shipping = Math.round(200 + Math.random() * 800);
  const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + tax + shipping - discount;
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const payStatus = status === "Delivered" ? "Paid" : status === "Returned" ? "Paid" : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
  const dayOffset = Math.floor(Math.random() * 60);
  const date = new Date(2026, 2, 28 - dayOffset);

  return {
    id: `ord-${(i + 1).toString().padStart(3, "0")}`,
    orderNumber: `ORD-${2800 + i}`,
    customerId: cust.id,
    customerName: cust.name,
    status,
    items,
    subtotal, tax, shipping, discount, total,
    paymentTerms: terms[i % terms.length],
    paymentStatus: payStatus,
    shippingMethod: methods[i % methods.length],
    trackingNumber: status === "Shipped" || status === "Delivered" ? `TRK${100000 + i}` : undefined,
    createdAt: date.toISOString(),
    updatedAt: new Date(date.getTime() + 86400000 * Math.floor(Math.random() * 5)).toISOString(),
    deliveryDate: status === "Delivered" ? new Date(date.getTime() + 86400000 * (3 + Math.floor(Math.random() * 7))).toISOString() : undefined,
    assignedRep: reps[i % reps.length],
    notes: i % 5 === 0 ? "Rush order — priority handling required" : undefined,
  };
}

export const mockOrders: Order[] = Array.from({ length: 55 }, (_, i) => generateOrder(i));
