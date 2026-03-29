"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Clock, Users, Send, Eye, MessageSquare, ChevronRight,
  Plus, Copy, Code, Sparkles, Play, Pause, Settings, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { EmailCampaign } from "@/types";
const mergeTags = [
  { tag: "{{first_name}}", desc: "Contact first name" },
  { tag: "{{company}}", desc: "Company name" },
  { tag: "{{pain_point}}", desc: "Identified pain point" },
  { tag: "{{industry}}", desc: "Industry vertical" },
  { tag: "{{city}}", desc: "Company city" },
  { tag: "{{rep_name}}", desc: "Your name" },
  { tag: "{{rep_title}}", desc: "Your title" },
  { tag: "{{calendar_link}}", desc: "Booking link" },
];

function StepCard({ step, index, isLast, allSteps }: { step: any; index: number; isLast: boolean; allSteps: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isEmail = step.type === "email";
  const isWait = step.type === "wait";

  if (isWait) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center gap-3 py-2 pl-6"
      >
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-border" />
          <div className="w-10 h-10 rounded-full bg-surface border-2 border-border flex items-center justify-center">
            <Clock className="w-4 h-4 text-text-muted" />
          </div>
          {!isLast && <div className="w-px h-4 bg-border" />}
        </div>
        <div className="text-sm text-text-secondary">
          Wait <span className="text-text-primary font-semibold">{step.waitDays} days</span> before next step
        </div>
      </motion.div>
    );
  }

  const emailNumber = allSteps.filter((s, i) => s.type === "email" && i <= allSteps.indexOf(step)).length;
  const emailLabels: Record<number, string> = { 1: "Initial Outreach", 2: "Follow-up", 3: "Break-up" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="pl-6"
    >
      {index > 0 && <div className="w-px h-4 bg-border ml-[19px]" />}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
            emailNumber === 1 ? "bg-primary/20 border-primary text-primary" :
            emailNumber === 2 ? "bg-accent/20 border-accent text-accent" :
            "bg-warning/20 border-warning text-warning"
          )}>
            <Mail className="w-4 h-4" />
          </div>
          {!isLast && <div className="w-px flex-1 bg-border min-h-[16px]" />}
        </div>
        <div
          className={cn(
            "flex-1 glass-card p-4 cursor-pointer transition-all mb-1",
            isExpanded ? "ring-1 ring-primary/30" : "hover:bg-surface-hover"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded",
                emailNumber === 1 ? "bg-primary/20 text-primary" :
                emailNumber === 2 ? "bg-accent/20 text-accent" :
                "bg-warning/20 text-warning"
              )}>
                Email {emailNumber}
              </span>
              <span className="text-sm font-medium text-text-primary">{emailLabels[emailNumber] || `Step ${emailNumber}`}</span>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-text-muted transition-transform", isExpanded && "rotate-90")} />
          </div>
          <p className="text-sm text-text-secondary mt-2 flex items-center gap-2">
            <span className="text-text-muted text-xs">Subject:</span>
            {step.subject}
          </p>
          {isExpanded && step.body && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-border"
            >
              <pre className="text-xs text-text-secondary whitespace-pre-wrap font-body leading-relaxed">{step.body}</pre>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SequencesPage() {
  const { data: mockEmailCampaigns = [] } = useSWR<EmailCampaign[]>('/api/campaigns/email', fetcher);

  const sequence = mockEmailCampaigns[0] || { name: "", totalContacts: 0, sent: 0, opened: 0, replied: 0, steps: [] };

  const stats = [
    { label: "Contacts in Sequence", value: sequence.totalContacts, icon: Users, color: "text-primary", bg: "bg-primary-light" },
    { label: "Emails Sent", value: sequence.sent, icon: Send, color: "text-accent", bg: "bg-[#6366f120]" },
    { label: "Open Rate", value: sequence.sent > 0 ? `${((sequence.opened / sequence.sent) * 100).toFixed(1)}%` : "0%", icon: Eye, color: "text-success", bg: "bg-success-light" },
    { label: "Reply Rate", value: sequence.sent > 0 ? `${((sequence.replied / sequence.sent) * 100).toFixed(1)}%` : "0%", icon: MessageSquare, color: "text-warning", bg: "bg-warning-light" },
  ];

  const [activeTab, setActiveTab] = useState<"builder" | "analytics">("builder");

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20">
              <Mail className="w-6 h-6 text-accent" />
            </div>
            Email Sequence Builder
          </h1>
          <p className="text-text-secondary mt-1">Design multi-step email sequences with smart timing and personalization</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/25">
            <Play className="w-4 h-4" />
            Activate Sequence
          </button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className="text-lg font-bold text-text-primary">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sequence Name Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <h2 className="text-lg font-semibold text-text-primary font-heading">{sequence.name}</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success font-medium border border-success/20">Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>{sequence.steps.filter(s => s.type === "email").length} emails</span>
            <span className="text-border">|</span>
            <span>{sequence.steps.filter(s => s.type === "wait").reduce((sum, s) => sum + (s.waitDays || 0), 0)} days total</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content: Builder + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sequence Builder */}
        <div className="lg:col-span-3 space-y-0">
          {sequence.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              isLast={i === sequence.steps.length - 1}
              allSteps={sequence.steps}
            />
          ))}

          {/* Add Step Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pl-6 pt-2"
          >
            <div className="w-px h-4 bg-border ml-[19px]" />
            <button className="flex items-center gap-3 ml-0">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer">
                <Plus className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm text-text-muted hover:text-text-secondary cursor-pointer">Add new step</span>
            </button>
          </motion.div>
        </div>

        {/* Merge Tags Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 h-fit sticky top-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Merge Tags</h3>
          </div>
          <p className="text-xs text-text-muted mb-4">Click to copy a tag and paste it into your email templates for dynamic personalization.</p>
          <div className="space-y-2">
            {mergeTags.map((item, i) => (
              <motion.button
                key={item.tag}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.03 }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-all group text-left"
                onClick={() => navigator.clipboard.writeText(item.tag)}
              >
                <div>
                  <code className="text-xs font-mono text-primary">{item.tag}</code>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                </div>
                <Copy className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              <Sparkles className="w-4 h-4" />
              AI Write Email
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
