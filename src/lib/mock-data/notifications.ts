import { Notification } from "@/types";

export const mockNotifications: Notification[] = [
  { id: "n1", title: "New order from Pacific Foods Co.", description: "Order #ORD-2847 worth $14,250 placed", type: "order", read: false, createdAt: "2026-03-28T09:15:00Z" },
  { id: "n2", title: "Lead score increased", description: "ABC Foods lead score jumped to 87 (+22)", type: "lead", read: false, createdAt: "2026-03-28T08:45:00Z" },
  { id: "n3", title: "Payment received", description: "Metro Building Supply paid Invoice #INV-1924 — $8,750", type: "payment", read: false, createdAt: "2026-03-28T08:20:00Z" },
  { id: "n4", title: "Low stock alert", description: "SKU-4421 (Kraft Paper Rolls) below reorder point", type: "alert", read: false, createdAt: "2026-03-28T07:30:00Z" },
  { id: "n5", title: "Deal won!", description: "Sarah closed $42,000 deal with Harbor Industries", type: "team", read: true, createdAt: "2026-03-27T16:00:00Z" },
  { id: "n6", title: "AI Insight", description: "3 accounts at risk of churn detected", type: "ai", read: true, createdAt: "2026-03-27T14:30:00Z" },
  { id: "n7", title: "Sequence reply", description: "Positive reply from contact@greenvalley.com", type: "lead", read: true, createdAt: "2026-03-27T11:00:00Z" },
  { id: "n8", title: "Invoice overdue", description: "Invoice #INV-1891 for Valley Produce is 15 days overdue", type: "alert", read: true, createdAt: "2026-03-27T09:00:00Z" },
  { id: "n9", title: "Campaign completed", description: "Q1 Re-engagement sequence finished — 12.4% reply rate", type: "lead", read: true, createdAt: "2026-03-26T17:00:00Z" },
  { id: "n10", title: "New team member", description: "Alex Rivera joined as SDR", type: "team", read: true, createdAt: "2026-03-26T10:00:00Z" },
];
