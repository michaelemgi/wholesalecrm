import { EmailCampaign, MetaCampaign } from "@/types";

export const mockEmailCampaigns: EmailCampaign[] = [
  {
    id: "ec-001", name: "Q1 Food Distributors Outreach", status: "Active", type: "Cold Outreach", totalContacts: 450, sent: 380, opened: 152, replied: 34, bounced: 12, positiveReplies: 18, startDate: "2026-02-15",
    steps: [
      { id: "s1", type: "email", subject: "Bulk pricing that beats your current supplier", body: "Hi {{first_name}},\n\nI noticed {{company}} has been expanding..." },
      { id: "s2", type: "wait", waitDays: 3 },
      { id: "s3", type: "email", subject: "Quick question about your supply chain", body: "Hi {{first_name}},\n\nFollowing up on my last note..." },
      { id: "s4", type: "wait", waitDays: 4 },
      { id: "s5", type: "email", subject: "Last one from me — special intro offer", body: "Hi {{first_name}},\n\nI know you're busy so I'll keep this brief..." },
    ],
  },
  {
    id: "ec-002", name: "Building Materials — New Product Launch", status: "Active", type: "Cold Outreach", totalContacts: 280, sent: 210, opened: 98, replied: 22, bounced: 8, positiveReplies: 12, startDate: "2026-03-01",
    steps: [
      { id: "s1", type: "email", subject: "New eco-friendly building materials — 20% lighter", body: "Hi {{first_name}},\n\nWe just launched a new line..." },
      { id: "s2", type: "wait", waitDays: 2 },
      { id: "s3", type: "email", subject: "Case study: How {{competitor}} saved 15% on materials", body: "Hi {{first_name}},\n\nI wanted to share..." },
      { id: "s4", type: "wait", waitDays: 3 },
      { id: "s5", type: "email", subject: "Free sample for {{company}}", body: "Hi {{first_name}},\n\nSince I haven't heard back..." },
    ],
  },
  {
    id: "ec-003", name: "Re-engagement — Inactive Accounts", status: "Active", type: "Re-engagement", totalContacts: 120, sent: 120, opened: 45, replied: 8, bounced: 3, positiveReplies: 5, startDate: "2026-03-10",
    steps: [
      { id: "s1", type: "email", subject: "We miss you, {{first_name}} — here's what's new", body: "Hi {{first_name}},\n\nIt's been a while..." },
      { id: "s2", type: "wait", waitDays: 5 },
      { id: "s3", type: "email", subject: "Exclusive 10% comeback discount for {{company}}", body: "Hi {{first_name}},\n\nWe'd love to earn your business back..." },
    ],
  },
  {
    id: "ec-004", name: "Restaurant Suppliers — Holiday Season Prep", status: "Paused", type: "Cold Outreach", totalContacts: 350, sent: 180, opened: 72, replied: 15, bounced: 6, positiveReplies: 8, startDate: "2026-02-20",
    steps: [
      { id: "s1", type: "email", subject: "Get ahead of holiday orders — bulk pricing inside", body: "Hi {{first_name}},\n\nThe holiday rush is coming..." },
      { id: "s2", type: "wait", waitDays: 3 },
      { id: "s3", type: "email", subject: "Your competitors are already stocking up", body: "Hi {{first_name}},\n\nJust a heads up..." },
    ],
  },
  {
    id: "ec-005", name: "Industrial Supply — Q1 Newsletter", status: "Completed", type: "Newsletter", totalContacts: 800, sent: 795, opened: 318, replied: 42, bounced: 5, positiveReplies: 28, startDate: "2026-01-15", endDate: "2026-01-30",
    steps: [
      { id: "s1", type: "email", subject: "Q1 Product Updates & Industry Insights", body: "Dear {{first_name}},\n\nHere's what's new..." },
    ],
  },
];

export const mockMetaCampaigns: MetaCampaign[] = [
  { id: "mc-001", name: "Food Wholesale — Lead Gen", status: "Active", objective: "Lead Generation", spend: 4520, budget: 8000, impressions: 185000, clicks: 3240, ctr: 1.75, cpc: 1.40, cpl: 12.80, leads: 353, roas: 8.2, startDate: "2026-03-01", audiences: ["Restaurant Owners", "Food Service Managers", "Catering Companies"] },
  { id: "mc-002", name: "Building Materials — Contractor Leads", status: "Active", objective: "Lead Generation", spend: 3180, budget: 6000, impressions: 142000, clicks: 2480, ctr: 1.75, cpc: 1.28, cpl: 15.90, leads: 200, roas: 6.5, startDate: "2026-03-05", audiences: ["General Contractors", "Construction Companies", "Home Builders"] },
  { id: "mc-003", name: "Brand Awareness — WholesaleOS Platform", status: "Active", objective: "Brand Awareness", spend: 1850, budget: 3000, impressions: 420000, clicks: 5880, ctr: 1.40, cpc: 0.31, cpl: 0, leads: 0, roas: 0, startDate: "2026-03-10", audiences: ["Business Owners", "Supply Chain Professionals", "Procurement Managers"] },
  { id: "mc-004", name: "Retargeting — Website Visitors", status: "Paused", objective: "Conversions", spend: 980, budget: 2000, impressions: 65000, clicks: 1820, ctr: 2.80, cpc: 0.54, cpl: 8.20, leads: 120, roas: 12.4, startDate: "2026-02-15", audiences: ["Website Visitors 30d", "Cart Abandoners"] },
];
