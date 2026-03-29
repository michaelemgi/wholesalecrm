export interface Customer {
  id: string;
  name: string;
  industry: string;
  logo?: string;
  primaryContact: Contact;
  contacts: Contact[];
  accountTier: "Enterprise" | "Mid-Market" | "SMB";
  region: string;
  address: string;
  totalRevenue: number;
  lastOrderDate: string;
  creditLimit: number;
  outstandingBalance: number;
  assignedRep: string;
  accountSince: string;
  paymentScore: number;
  orderFrequencyDays: number;
  topProducts: string[];
  tags: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  wholesalePrice: number;
  tier1Price: number;
  tier2Price: number;
  tier3Price: number;
  vipPrice: number;
  stockLevel: number;
  reorderPoint: number;
  warehouseLocation: string;
  warehouse: string;
  unit: string;
  weight: number;
  supplier: string;
  leadTimeDays: number;
  expiryDate?: string;
  imageUrl?: string;
  status: "Active" | "Low Stock" | "Out of Stock" | "Discontinued";
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: "Draft" | "Confirmed" | "Processing" | "Picking" | "Packed" | "Shipped" | "Delivered" | "Returned";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentTerms: string;
  paymentStatus: "Unpaid" | "Partial" | "Paid" | "Overdue";
  shippingMethod: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  assignedRep: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  linkedIn?: string;
  website?: string;
  industry: string;
  location: string;
  employeeCount: number;
  estimatedRevenue: number;
  score: number;
  status: "Hot" | "Warm" | "Cold";
  source: "AI Scraper" | "Cold Email" | "Meta Ads" | "Referral" | "Website" | "Trade Show";
  assignedRep?: string;
  tags: string[];
  enrichedData?: {
    techStack: string[];
    recentNews: string[];
    fundingStage?: string;
  };
  createdAt: string;
  lastContactedAt?: string;
}

export interface PipelineDeal {
  id: string;
  companyName: string;
  contactName: string;
  value: number;
  stage: "New Lead" | "Contacted" | "Qualified" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
  assignedRep: string;
  assignedRepAvatar?: string;
  leadSource: string;
  daysInStage: number;
  nextActionDate: string;
  winProbability: number;
  createdAt: string;
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "SDR" | "Closer" | "Account Manager" | "Operations" | "Admin";
  avatar?: string;
  activeDeals: number;
  revenueGenerated: number;
  activityScore: number;
  dealsClosedMTD: number;
  callsMade: number;
  emailsSent: number;
  meetingsHeld: number;
  targetRevenue: number;
  commissionRate: number;
  commissionEarned: number;
  joinDate: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  status: "Active" | "Paused" | "Completed" | "Draft";
  type: "Cold Outreach" | "Follow-up" | "Newsletter" | "Re-engagement";
  totalContacts: number;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
  positiveReplies: number;
  steps: EmailSequenceStep[];
  startDate: string;
  endDate?: string;
}

export interface EmailSequenceStep {
  id: string;
  type: "email" | "wait" | "condition";
  subject?: string;
  body?: string;
  waitDays?: number;
  variants?: { subject: string; body: string }[];
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: "Active" | "Paused" | "Completed";
  objective: string;
  spend: number;
  budget: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpl: number;
  leads: number;
  roas: number;
  creativeUrl?: string;
  startDate: string;
  endDate?: string;
  audiences: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  orderId: string;
  status: "Draft" | "Sent" | "Viewed" | "Paid" | "Partial" | "Overdue" | "Void";
  amount: number;
  paidAmount: number;
  dueDate: string;
  issuedDate: string;
  paidDate?: string;
  paymentTerms: string;
}

export interface Expense {
  id: string;
  category: "COGS" | "Shipping" | "Marketing" | "Payroll" | "Overhead" | "Utilities" | "Software";
  description: string;
  amount: number;
  vendor: string;
  date: string;
  status: "Pending" | "Approved" | "Paid";
}

export interface AIInsight {
  id: string;
  type: "revenue" | "churn" | "inventory" | "email" | "lead" | "optimization" | "alert";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionLabel?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: "order" | "lead" | "payment" | "alert" | "team" | "ai";
  read: boolean;
  createdAt: string;
}

export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  ordersCount: number;
  newCustomers: number;
}
