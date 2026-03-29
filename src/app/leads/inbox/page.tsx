"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Search, Star, Archive, Trash2, Reply, Forward, MoreHorizontal,
  Circle, CheckCircle2, Clock, Building2, Mail, Phone, Globe, Tag,
  ChevronRight, Flame, Thermometer, Snowflake, Send, Paperclip, User,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

interface EmailThread {
  id: string;
  senderName: string;
  senderEmail: string;
  senderCompany: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
  messages: EmailMessage[];
  leadId: string;
}

interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  body: string;
  time: string;
  isOutgoing: boolean;
}

interface LeadContext {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  score: number;
  status: "Hot" | "Warm" | "Cold";
  stage: string;
  industry: string;
  location: string;
  employees: number;
  tags: string[];
  lastContacted: string;
}

const mockThreads: EmailThread[] = [
  {
    id: "t1", senderName: "Michael Torres", senderEmail: "michael@abcfoods.com", senderCompany: "ABC Foods International",
    subject: "Re: Bulk pricing for Q2 orders", preview: "Thanks for sending over the price list. I've reviewed it with our procurement team and we'd like to discuss...",
    time: "2026-03-28T09:15:00Z", unread: true, starred: true, leadId: "lead-001",
    messages: [
      { id: "m1", from: "You", fromEmail: "sales@wholesaleos.com", to: "Michael Torres", body: "Hi Michael,\n\nFollowing up on our call yesterday. I've put together a custom pricing sheet for ABC Foods based on the volumes we discussed.\n\nPlease find the attached price list for Q2. We can offer an additional 5% discount on orders over $50K.\n\nLooking forward to hearing your thoughts.\n\nBest,\nSarah", time: "2026-03-27T15:30:00Z", isOutgoing: true },
      { id: "m2", from: "Michael Torres", fromEmail: "michael@abcfoods.com", to: "You", body: "Thanks for sending over the price list. I've reviewed it with our procurement team and we'd like to discuss the olive oil and frozen seafood categories in more detail.\n\nCould we schedule a call this Thursday to go over the specifics? Our team is particularly interested in the tier pricing structure for orders above 500 units.\n\nAlso, do you offer any early-payment discounts?\n\nBest,\nMichael", time: "2026-03-28T09:15:00Z", isOutgoing: false },
    ],
  },
  {
    id: "t2", senderName: "Karen Phillips", senderEmail: "karen@buildright.com", senderCompany: "BuildRight Construction",
    subject: "Interested in eco-friendly materials", preview: "I saw your new product line announcement and wanted to learn more about the eco-friendly building materials...",
    time: "2026-03-28T08:45:00Z", unread: true, starred: false, leadId: "lead-002",
    messages: [
      { id: "m3", from: "Karen Phillips", fromEmail: "karen@buildright.com", to: "You", body: "Hi there,\n\nI saw your new product line announcement and wanted to learn more about the eco-friendly building materials you've launched. BuildRight is actively looking for sustainable alternatives.\n\nCould you send me a catalog and pricing details?\n\nThanks,\nKaren Phillips\nProcurement Director", time: "2026-03-28T08:45:00Z", isOutgoing: false },
    ],
  },
  {
    id: "t3", senderName: "Jason Lee", senderEmail: "jason@freshdirectws.com", senderCompany: "FreshDirect Wholesale",
    subject: "Re: Partnership opportunity", preview: "Absolutely, we're very interested in exploring a wholesale partnership. Our current supplier hasn't been...",
    time: "2026-03-27T16:20:00Z", unread: false, starred: true, leadId: "lead-003",
    messages: [
      { id: "m4", from: "You", fromEmail: "sales@wholesaleos.com", to: "Jason Lee", body: "Hi Jason,\n\nI noticed FreshDirect Wholesale has been expanding rapidly. We specialize in bulk organic produce at competitive wholesale prices.\n\nWould you be open to a quick call to explore a potential partnership?\n\nBest,\nSarah", time: "2026-03-27T10:00:00Z", isOutgoing: true },
      { id: "m5", from: "Jason Lee", fromEmail: "jason@freshdirectws.com", to: "You", body: "Absolutely, we're very interested in exploring a wholesale partnership. Our current supplier hasn't been meeting our volume needs and we're actively looking for alternatives.\n\nI'm free Thursday 2-4pm ET. Does that work?\n\nBest,\nJason", time: "2026-03-27T16:20:00Z", isOutgoing: false },
    ],
  },
  {
    id: "t4", senderName: "Amanda Wright", senderEmail: "amanda@sterlingpkg.com", senderCompany: "Sterling Packaging Group",
    subject: "Custom packaging quote request", preview: "We need a quote for 50,000 custom corrugated boxes with our branding. Dimensions would be...",
    time: "2026-03-27T14:00:00Z", unread: false, starred: false, leadId: "lead-004",
    messages: [
      { id: "m6", from: "Amanda Wright", fromEmail: "amanda@sterlingpkg.com", to: "You", body: "Hi,\n\nWe need a quote for 50,000 custom corrugated boxes with our branding. Dimensions would be 12x12x8.\n\nPlease advise on lead times and pricing tiers.\n\nThanks,\nAmanda", time: "2026-03-27T14:00:00Z", isOutgoing: false },
    ],
  },
  {
    id: "t5", senderName: "Yuki Nakamura", senderEmail: "yuki@pacificrimtrade.com", senderCompany: "Pacific Rim Trading",
    subject: "Re: Import logistics question", preview: "Great question about the customs documentation. For the products you mentioned, you'll need...",
    time: "2026-03-27T11:30:00Z", unread: false, starred: false, leadId: "lead-006",
    messages: [
      { id: "m7", from: "You", fromEmail: "sales@wholesaleos.com", to: "Yuki Nakamura", body: "Hi Yuki,\n\nQuick question about import logistics for the Asian specialty products we discussed. What customs documentation would we need on our end?\n\nThanks,\nDavid", time: "2026-03-27T09:00:00Z", isOutgoing: true },
      { id: "m8", from: "Yuki Nakamura", fromEmail: "yuki@pacificrimtrade.com", to: "You", body: "Great question about the customs documentation. For the products you mentioned, you'll need FDA prior notice forms and standard commercial invoices.\n\nI've handled this process many times and can guide you through it. Let's set up a time to go through the details.\n\nBest,\nYuki", time: "2026-03-27T11:30:00Z", isOutgoing: false },
    ],
  },
  {
    id: "t6", senderName: "Nicole Adams", senderEmail: "nicole@coastalbev.com", senderCompany: "Coastal Beverage Distributors",
    subject: "Trial order update", preview: "Just wanted to confirm our trial order #4521 shipped yesterday. We're excited to test the new...",
    time: "2026-03-26T17:00:00Z", unread: false, starred: false, leadId: "lead-008",
    messages: [
      { id: "m9", from: "You", fromEmail: "sales@wholesaleos.com", to: "Nicole Adams", body: "Hi Nicole,\n\nJust wanted to confirm our trial order #4521 shipped yesterday. You should receive it by Friday.\n\nWe're excited to test the new product line with you. Let me know how it goes!\n\nBest,\nAlex", time: "2026-03-26T17:00:00Z", isOutgoing: true },
    ],
  },
  {
    id: "t7", senderName: "Derek Johnson", senderEmail: "derek@apexindustrial.com", senderCompany: "Apex Industrial Solutions",
    subject: "Re: Contract proposal review", preview: "Our legal team has reviewed the contract and we have a few minor changes. Overall we're aligned on...",
    time: "2026-03-26T15:45:00Z", unread: true, starred: true, leadId: "lead-009",
    messages: [
      { id: "m10", from: "Derek Johnson", fromEmail: "derek@apexindustrial.com", to: "You", body: "Our legal team has reviewed the contract and we have a few minor changes. Overall we're aligned on pricing and delivery terms.\n\nCan we schedule a call early next week to finalize? This could be a significant account for both of us.\n\nRegards,\nDerek Johnson\nVP Procurement", time: "2026-03-26T15:45:00Z", isOutgoing: false },
    ],
  },
  {
    id: "t8", senderName: "Diana Martinez", senderEmail: "diana@swchemcorp.com", senderCompany: "Southwest Chemical Corp",
    subject: "Urgently looking for bulk supplier", preview: "We need a reliable bulk supplier ASAP. Our current vendor just notified us they're discontinuing...",
    time: "2026-03-26T10:30:00Z", unread: false, starred: true, leadId: "lead-012",
    messages: [
      { id: "m11", from: "Diana Martinez", fromEmail: "diana@swchemcorp.com", to: "You", body: "Hi,\n\nWe need a reliable bulk supplier ASAP. Our current vendor just notified us they're discontinuing several product lines we depend on.\n\nCan you handle orders in the 10,000+ unit range with 2-week turnaround? If so, please send me your full catalog.\n\nThis is urgent.\n\nDiana Martinez\nSupply Chain Manager", time: "2026-03-26T10:30:00Z", isOutgoing: false },
    ],
  },
];

const mockLeadContexts: Record<string, LeadContext> = {
  "lead-001": { name: "Michael Torres", company: "ABC Foods International", email: "michael@abcfoods.com", phone: "(415) 555-3001", website: "abcfoods.com", score: 87, status: "Hot", stage: "Proposal Sent", industry: "Food Distribution", location: "San Francisco, CA", employees: 250, tags: ["High Value", "Food"], lastContacted: "2026-03-27T15:30:00Z" },
  "lead-002": { name: "Karen Phillips", company: "BuildRight Construction", email: "karen@buildright.com", phone: "(312) 555-3002", website: "buildright.com", score: 74, status: "Warm", stage: "New Lead", industry: "Construction", location: "Chicago, IL", employees: 180, tags: ["Construction"], lastContacted: "2026-03-24T11:00:00Z" },
  "lead-003": { name: "Jason Lee", company: "FreshDirect Wholesale", email: "jason@freshdirectws.com", phone: "(212) 555-3003", website: "freshdirectws.com", score: 92, status: "Hot", stage: "Qualified", industry: "Produce", location: "New York, NY", employees: 95, tags: ["Organic", "Urgent"], lastContacted: "2026-03-27T16:20:00Z" },
  "lead-004": { name: "Amanda Wright", company: "Sterling Packaging Group", email: "amanda@sterlingpkg.com", phone: "(214) 555-3004", website: "sterlingpkg.com", score: 65, status: "Warm", stage: "Contacted", industry: "Packaging", location: "Dallas, TX", employees: 320, tags: ["Packaging", "Enterprise"], lastContacted: "2026-03-27T14:00:00Z" },
  "lead-006": { name: "Yuki Nakamura", company: "Pacific Rim Trading", email: "yuki@pacificrimtrade.com", phone: "(206) 555-3006", website: "pacificrimtrade.com", score: 81, status: "Hot", stage: "Qualified", industry: "Import/Export", location: "Seattle, WA", employees: 150, tags: ["International", "High Value"], lastContacted: "2026-03-27T11:30:00Z" },
  "lead-008": { name: "Nicole Adams", company: "Coastal Beverage Distributors", email: "nicole@coastalbev.com", phone: "(305) 555-3008", website: "coastalbev.com", score: 78, status: "Warm", stage: "Proposal Sent", industry: "Beverages", location: "Miami, FL", employees: 200, tags: ["Beverages", "Growing"], lastContacted: "2026-03-26T17:00:00Z" },
  "lead-009": { name: "Derek Johnson", company: "Apex Industrial Solutions", email: "derek@apexindustrial.com", phone: "(713) 555-3009", website: "apexindustrial.com", score: 88, status: "Hot", stage: "Negotiation", industry: "Industrial Supply", location: "Houston, TX", employees: 420, tags: ["Enterprise", "Industrial", "High Priority"], lastContacted: "2026-03-26T15:45:00Z" },
  "lead-012": { name: "Diana Martinez", company: "Southwest Chemical Corp", email: "diana@swchemcorp.com", phone: "(602) 555-3012", website: "swchemcorp.com", score: 83, status: "Hot", stage: "Contacted", industry: "Chemicals", location: "Phoenix, AZ", employees: 175, tags: ["Chemicals", "Warm Intro"], lastContacted: "2026-03-26T10:30:00Z" },
};

function StatusBadge({ status }: { status: "Hot" | "Warm" | "Cold" }) {
  const config = {
    Hot: { icon: Flame, bg: "bg-danger-light", text: "text-danger" },
    Warm: { icon: Thermometer, bg: "bg-warning-light", text: "text-warning" },
    Cold: { icon: Snowflake, bg: "bg-primary-light", text: "text-primary" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", config.bg, config.text)}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function InboxPage() {
  const [selectedThreadId, setSelectedThreadId] = useState(mockThreads[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedThread = mockThreads.find((t) => t.id === selectedThreadId)!;
  const leadContext = mockLeadContexts[selectedThread.leadId];

  const filteredThreads = mockThreads.filter(
    (t) =>
      !searchQuery ||
      t.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel: Thread List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 xl:w-96 border-r border-border flex flex-col bg-surface/50 shrink-0"
      >
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-heading text-text-primary flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary" />
              Inbox
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-primary text-white font-medium">
              {mockThreads.filter((t) => t.unread).length} new
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread, i) => (
            <motion.button
              key={thread.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedThreadId(thread.id)}
              className={cn(
                "w-full text-left px-4 py-3.5 border-b border-border transition-all",
                selectedThreadId === thread.id
                  ? "bg-primary/10 border-l-2 border-l-primary"
                  : "hover:bg-surface-hover border-l-2 border-l-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                  {thread.senderName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm truncate", thread.unread ? "font-semibold text-text-primary" : "text-text-secondary")}>
                      {thread.senderName}
                    </span>
                    <span className="text-[10px] text-text-muted shrink-0">{timeAgo(thread.time)}</span>
                  </div>
                  <p className={cn("text-xs truncate mt-0.5", thread.unread ? "text-text-primary font-medium" : "text-text-secondary")}>
                    {thread.subject}
                  </p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">{thread.preview}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 ml-12">
                {thread.unread && <div className="w-2 h-2 rounded-full bg-primary" />}
                {thread.starred && <Star className="w-3 h-3 text-warning fill-warning" />}
                <span className="text-[10px] text-text-muted">{thread.senderCompany}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Center Panel: Thread View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col min-w-0"
      >
        {/* Thread Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">{selectedThread.subject}</h3>
            <p className="text-xs text-text-muted mt-0.5">{selectedThread.messages.length} messages with {selectedThread.senderName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
              <Archive className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
              <Star className={cn("w-4 h-4", selectedThread.starred && "text-warning fill-warning")} />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-danger transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selectedThread.messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("max-w-2xl", msg.isOutgoing ? "ml-auto" : "mr-auto")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  msg.isOutgoing ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                )}>
                  {msg.from === "You" ? "Y" : msg.from.split(" ").map((n) => n[0]).join("")}
                </div>
                <span className="text-xs font-medium text-text-primary">{msg.from}</span>
                <span className="text-[10px] text-text-muted">{timeAgo(msg.time)}</span>
              </div>
              <div className={cn(
                "rounded-xl p-4 text-sm leading-relaxed",
                msg.isOutgoing
                  ? "bg-primary/10 border border-primary/20 text-text-primary"
                  : "bg-surface border border-border text-text-primary"
              )}>
                <pre className="whitespace-pre-wrap font-body">{msg.body}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reply Box */}
        <div className="p-4 border-t border-border">
          <div className="bg-surface border border-border rounded-xl p-3">
            <textarea
              placeholder="Type your reply..."
              rows={3}
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors">
                <Send className="w-3.5 h-3.5" />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Panel: Lead Context */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-72 xl:w-80 border-l border-border overflow-y-auto bg-surface/30 shrink-0 hidden lg:block"
      >
        {leadContext && (
          <div className="p-5 space-y-5">
            {/* Lead Profile */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-primary text-lg font-bold mx-auto">
                {leadContext.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <h4 className="text-sm font-semibold text-text-primary mt-3">{leadContext.name}</h4>
              <p className="text-xs text-text-secondary">{leadContext.company}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <StatusBadge status={leadContext.status} />
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-text-secondary font-medium">{leadContext.score}/100</span>
              </div>
            </div>

            {/* Stage */}
            <div className="glass-card p-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Pipeline Stage</p>
              <p className="text-sm font-semibold text-primary">{leadContext.stage}</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact Info</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs">
                  <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-text-secondary truncate">{leadContext.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-text-secondary">{leadContext.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <Globe className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-text-secondary">{leadContext.website}</span>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Company</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Industry</span>
                  <span className="text-text-primary">{leadContext.industry}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Location</span>
                  <span className="text-text-primary">{leadContext.location}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Employees</span>
                  <span className="text-text-primary">{leadContext.employees}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Last Contacted</span>
                  <span className="text-text-primary">{timeAgo(leadContext.lastContacted)}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Tags</h5>
              <div className="flex flex-wrap gap-1.5">
                {leadContext.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-surface border border-border text-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors">
                <User className="w-3.5 h-3.5" />
                View Full Profile
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary text-xs font-medium hover:bg-surface-hover transition-colors">
                <Tag className="w-3.5 h-3.5" />
                Add to Sequence
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
