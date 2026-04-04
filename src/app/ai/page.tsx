"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, AlertTriangle, Clock, CheckCircle2, TrendingUp, Zap, Brain, BarChart3, LineChart, ArrowRight, ToggleLeft, ToggleRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { AIInsight } from "@/types";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  table?: { headers: string[]; rows: string[][] };
}

const starterPrompts = [
  "Show me my top 5 underperforming products",
  "Which customers are at risk of churning?",
  "Draft a follow-up email to ABC Foods",
  "What's my pipeline forecast for Q2?",
  "Analyze my cold email performance",
];

const mockResponses: Record<string, { text: string; table?: { headers: string[]; rows: string[][] } }> = {
  "Show me my top 5 underperforming products": {
    text: "Here are the 5 products with the highest margin decline over the past 90 days. I recommend renegotiating supplier pricing for these items or considering alternative suppliers.",
    table: {
      headers: ["Product", "SKU", "Current Margin", "90d Change", "Action"],
      rows: [
        ["Solvent Grade A 5gal", "SKU-4010", "18.2%", "-8.4%", "Renegotiate"],
        ["Ice Cream 3gal", "SKU-1019", "21.5%", "-6.2%", "Review supplier"],
        ["Wire 14ga 500ft", "SKU-2008", "25.3%", "-5.8%", "Price increase"],
        ["PVC Pipe 4in 10ft", "SKU-2007", "28.1%", "-4.1%", "Monitor"],
        ["Copy Paper A4 Case", "SKU-3008", "22.7%", "-3.9%", "Bundle deal"],
      ],
    },
  },
  "Which customers are at risk of churning?": {
    text: "I've identified 3 customers showing churn risk signals based on declining order frequency, reduced order values, and engagement metrics.",
    table: {
      headers: ["Customer", "Risk Score", "Last Order", "Avg Frequency", "Signal"],
      rows: [
        ["Valley Produce Partners", "HIGH (92%)", "45 days ago", "7 days", "Order gap 6x avg"],
        ["Blue Ridge Beverages", "MEDIUM (68%)", "9 days ago", "14 days", "Order value -35%"],
        ["Redwood Paper Products", "MEDIUM (55%)", "10 days ago", "21 days", "Declining engagement"],
      ],
    },
  },
  "Draft a follow-up email to ABC Foods": {
    text: "Here's a personalized follow-up email draft based on ABC Foods' recent engagement (3 email opens, 2 pricing page visits):\n\n**Subject:** Quick thought on your bulk pricing, Michael\n\n**Body:**\nHi Michael,\n\nI noticed you've been exploring our wholesale pricing for food distribution — and I wanted to share something that might help.\n\nWe recently helped Pacific Foods Distribution reduce their procurement costs by 15% through our tiered pricing program. Given your company's scale (250+ employees, similar product mix), I think we could offer you comparable savings.\n\nWould you be open to a 15-minute call this week? I can walk you through the numbers specific to your operation.\n\nBest,\nJames",
  },
};

const automations = [
  { name: "Lead Score Auto-Assignment", description: "When lead score > 80, auto-assign to Closer team", trigger: "Lead score change", active: true },
  { name: "Churn Risk Alert", description: "Alert account manager when customer hasn't ordered in 2x their avg frequency", trigger: "Order frequency check", active: true },
  { name: "Reorder Point Notification", description: "Notify operations when stock drops below reorder point", trigger: "Inventory update", active: true },
  { name: "Invoice Follow-up Sequence", description: "Send reminder emails at 7, 14, and 28 days past due", trigger: "Invoice overdue", active: false },
  { name: "Deal Stale Alert", description: "Alert rep when deal has been in same stage > 14 days", trigger: "Pipeline stale check", active: true },
  { name: "Welcome Sequence Trigger", description: "Start onboarding email sequence when new customer is created", trigger: "Customer created", active: false },
];

const leadScoreFactors = [
  { factor: "Email Engagement", weight: 25, description: "Opens, clicks, replies to outreach" },
  { factor: "Website Activity", weight: 20, description: "Page visits, pricing page views, demo requests" },
  { factor: "Company Fit", weight: 20, description: "Industry match, company size, revenue range" },
  { factor: "Social Signals", weight: 15, description: "LinkedIn activity, job postings, funding news" },
  { factor: "Intent Signals", weight: 12, description: "Contract expiry, vendor search, RFP activity" },
  { factor: "Recency", weight: 8, description: "Time since last engagement" },
];

export default function AIPage() {
  const { data: mockInsights = [] } = useSWR<AIInsight[]>("/api/ai/insights", fetcher);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [tab, setTab] = useState<"chat" | "insights" | "scoring" | "automations">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || input;
    if (!query.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role === "ai" ? "assistant" : m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.content,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Sorry, I couldn't process that request. ${err.message}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">AI Command Center</h1>
          <p className="text-sm text-text-muted">Your intelligent business assistant</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["chat", "insights", "scoring", "automations"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize", tab === t ? "bg-primary text-white" : "text-text-muted hover:bg-surface-hover")}>
            {t === "chat" ? "AI Chat" : t === "insights" ? "Insights Feed" : t === "scoring" ? "Lead Scoring" : "Smart Automations"}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-heading text-lg font-semibold text-text-primary">Ask anything about your business</h3>
                  <p className="text-sm text-text-muted mt-1">I can analyze data, generate reports, draft emails, and provide recommendations.</p>
                </div>
                <div className="flex flex-wrap gap-2 max-w-lg justify-center">
                  {starterPrompts.map(prompt => (
                    <button key={prompt} onClick={() => handleSend(prompt)} className="px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                  {msg.role === "ai" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={cn("max-w-[70%] rounded-xl p-4", msg.role === "user" ? "bg-primary text-white" : "bg-surface-hover")}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    {msg.table && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              {msg.table.headers.map(h => (
                                <th key={h} className="py-2 px-2 text-left font-medium text-text-muted">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.table.rows.map((row, i) => (
                              <tr key={i} className="border-b border-border/50">
                                {row.map((cell, j) => (
                                  <td key={j} className="py-1.5 px-2 text-text-secondary">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-surface-hover rounded-xl p-4">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-text-muted animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="h-2 w-2 rounded-full bg-text-muted animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border p-4">
            <div className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask about revenue, leads, inventory, pipeline..." className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary placeholder:text-text-muted" />
              <button onClick={() => handleSend()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "insights" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
          {mockInsights.map((insight, i) => {
            const impactIcon = insight.impact === "high" ? <AlertTriangle className="h-4 w-4 text-danger" /> : insight.impact === "medium" ? <Clock className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />;
            const typeIcons: Record<string, React.ReactNode> = {
              revenue: <TrendingUp className="h-4 w-4 text-success" />,
              churn: <AlertTriangle className="h-4 w-4 text-danger" />,
              inventory: <BarChart3 className="h-4 w-4 text-primary" />,
              email: <LineChart className="h-4 w-4 text-accent" />,
              lead: <Zap className="h-4 w-4 text-warning" />,
              optimization: <Brain className="h-4 w-4 text-info" />,
              alert: <AlertTriangle className="h-4 w-4 text-danger" />,
            };
            return (
              <motion.div key={insight.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 hover:border-border-light transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {typeIcons[insight.type]}
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", insight.impact === "high" ? "bg-danger-light text-danger" : insight.impact === "medium" ? "bg-warning-light text-warning" : "bg-success-light text-success")}>
                      {insight.impact}
                    </span>
                  </div>
                  {impactIcon}
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">{insight.title}</h4>
                <p className="text-xs text-text-muted leading-relaxed">{insight.description}</p>
                {insight.actionLabel && (
                  <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
                    {insight.actionLabel} <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {tab === "scoring" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">AI Lead Scoring Model</h3>
          <p className="text-sm text-text-muted mb-6">Our AI evaluates leads using 6 weighted factors to generate a score from 0-100.</p>
          <div className="space-y-4 max-w-2xl">
            {leadScoreFactors.map((f, i) => (
              <motion.div key={f.factor} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4">
                <div className="w-36 shrink-0">
                  <p className="text-sm font-medium text-text-primary">{f.factor}</p>
                  <p className="text-xs text-text-muted">{f.description}</p>
                </div>
                <div className="flex-1 h-6 bg-surface-hover rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${f.weight * 4}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
                </div>
                <span className="text-sm font-bold text-text-primary w-10 text-right">{f.weight}%</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[{ label: "Hot (80-100)", color: "bg-danger", desc: "Ready for sales call", count: 4 }, { label: "Warm (50-79)", color: "bg-warning", desc: "Nurture with content", count: 5 }, { label: "Cold (0-49)", color: "bg-gray-500", desc: "Monitor for signals", count: 3 }].map(tier => (
              <div key={tier.label} className="p-4 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-3 w-3 rounded-full", tier.color)} />
                  <span className="text-sm font-semibold text-text-primary">{tier.label}</span>
                </div>
                <p className="text-xs text-text-muted mb-1">{tier.desc}</p>
                <p className="text-lg font-bold font-heading text-text-primary">{tier.count} leads</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === "automations" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {automations.map((auto, i) => (
            <motion.div key={auto.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 flex items-center gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", auto.active ? "bg-success-light" : "bg-surface-hover")}>
                <Zap className={cn("h-5 w-5", auto.active ? "text-success" : "text-text-muted")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{auto.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{auto.description}</p>
                <p className="text-xs text-text-muted mt-1">Trigger: <span className="text-text-secondary">{auto.trigger}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-medium", auto.active ? "text-success" : "text-text-muted")}>{auto.active ? "Active" : "Disabled"}</span>
                <button className="text-text-muted hover:text-text-primary">
                  {auto.active ? <ToggleRight className="h-6 w-6 text-success" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
