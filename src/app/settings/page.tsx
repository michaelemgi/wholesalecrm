"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Building2, Users, Puzzle, Mail, Bell, Key, CreditCard, Database, Palette, CheckCircle2, Plus, ExternalLink, Shield, ChevronRight, Eye, EyeOff, Pencil, Trash2, Copy, X, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

const integrations = [
  { name: "Meta Ads", status: "connected", icon: "📱", description: "Facebook & Instagram advertising" },
  { name: "Instantly", status: "connected", icon: "📧", description: "Cold email automation" },
  { name: "Google Ads", status: "available", icon: "🔍", description: "Search & display advertising" },
  { name: "QuickBooks", status: "available", icon: "📊", description: "Accounting & bookkeeping" },
  { name: "Xero", status: "available", icon: "💰", description: "Cloud accounting" },
  { name: "Shopify", status: "available", icon: "🛒", description: "E-commerce platform" },
  { name: "WooCommerce", status: "available", icon: "🏪", description: "WordPress e-commerce" },
  { name: "Mailgun", status: "available", icon: "✉️", description: "Email delivery service" },
  { name: "SendGrid", status: "available", icon: "📬", description: "Email API" },
  { name: "Twilio", status: "available", icon: "💬", description: "SMS & voice" },
  { name: "Slack", status: "available", icon: "💡", description: "Team communication" },
  { name: "Zapier", status: "available", icon: "⚡", description: "Workflow automation" },
  { name: "Stripe", status: "available", icon: "💳", description: "Payment processing" },
  { name: "PayPal", status: "available", icon: "🅿️", description: "Online payments" },
  { name: "ShipStation", status: "available", icon: "📦", description: "Shipping management" },
  { name: "Google Sheets", status: "available", icon: "📗", description: "Spreadsheet sync" },
  { name: "WhatsApp Business", status: "available", icon: "📱", description: "Business messaging" },
  { name: "Sage", status: "connected", icon: "📗", description: "Accounting, ERP & business management via webhook" },
];

const tabs = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "email", label: "Email Settings", icon: Mail },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API & Webhooks", icon: Key },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "data", label: "Data Management", icon: Database },
  { id: "whitelabel", label: "White Label", icon: Palette },
];

const teamUsers = [
  { name: "Adam Groogan", email: "adam@wholesale-co.com", role: "Admin", department: "Executive", status: "Active", initials: "AG" },
  { name: "Sarah Mitchell", email: "sarah@wholesale-co.com", role: "Sales Manager", department: "Sales", status: "Active", initials: "SM" },
  { name: "Mike Thompson", email: "mike@wholesale-co.com", role: "Sales Rep", department: "Sales", status: "Active", initials: "MT" },
  { name: "David Lee", email: "david@wholesale-co.com", role: "Sales Manager", department: "Sales", status: "Active", initials: "DL" },
  { name: "Alex Rivera", email: "alex@wholesale-co.com", role: "Sales Rep", department: "Sales", status: "Active", initials: "AR" },
  { name: "Rachel Green", email: "rachel@wholesale-co.com", role: "Operations", department: "Operations", status: "Active", initials: "RG" },
  { name: "Lisa Wang", email: "lisa@wholesale-co.com", role: "Operations", department: "Operations", status: "Active", initials: "LW" },
  { name: "Tom Bradley", email: "tom@wholesale-co.com", role: "Read Only", department: "Finance", status: "Active", initials: "TB" },
  { name: "Nina Patel", email: "nina@wholesale-co.com", role: "Sales Rep", department: "Sales", status: "Invited", initials: "NP" },
];

// ─── Roles & Permissions Data ────────────────────────────────────────────

type PermLevel = "full" | "view" | "none";

interface PermissionModule {
  id: string;
  label: string;
  description: string;
  subPermissions: { id: string; label: string }[];
}

const permissionModules: PermissionModule[] = [
  {
    id: "dashboard", label: "Dashboard", description: "Main dashboard and KPI overview",
    subPermissions: [
      { id: "view", label: "View Dashboard" },
      { id: "export", label: "Export Data" },
    ],
  },
  {
    id: "leads", label: "Lead Generation", description: "AI scraper, sequences, inbox, campaigns, Meta Ads",
    subPermissions: [
      { id: "view", label: "View Leads" },
      { id: "create", label: "Create & Import Leads" },
      { id: "edit", label: "Edit Leads" },
      { id: "delete", label: "Delete Leads" },
      { id: "scraper", label: "Use AI Scraper" },
      { id: "sequences", label: "Manage Sequences" },
      { id: "inbox", label: "Access Inbox" },
      { id: "campaigns", label: "Manage Campaigns" },
      { id: "meta_ads", label: "Meta Ads Dashboard" },
    ],
  },
  {
    id: "pipeline", label: "Sales Pipeline", description: "Kanban board, deal management",
    subPermissions: [
      { id: "view", label: "View Pipeline" },
      { id: "create", label: "Create Deals" },
      { id: "edit", label: "Edit & Move Deals" },
      { id: "delete", label: "Delete Deals" },
      { id: "assign", label: "Reassign Deals" },
    ],
  },
  {
    id: "orders", label: "Orders & Fulfillment", description: "Sales orders, purchase orders, shipping",
    subPermissions: [
      { id: "view", label: "View Orders" },
      { id: "create", label: "Create Orders" },
      { id: "edit", label: "Edit Orders" },
      { id: "delete", label: "Cancel / Delete Orders" },
      { id: "fulfill", label: "Process Fulfillment" },
      { id: "purchase_orders", label: "Manage Purchase Orders" },
    ],
  },
  {
    id: "inventory", label: "Inventory", description: "Product catalog, stock levels, price books",
    subPermissions: [
      { id: "view", label: "View Inventory" },
      { id: "create", label: "Add Products" },
      { id: "edit", label: "Edit Products & Pricing" },
      { id: "delete", label: "Delete Products" },
      { id: "adjust_stock", label: "Adjust Stock Levels" },
      { id: "price_books", label: "Manage Price Books" },
    ],
  },
  {
    id: "customers", label: "Customers", description: "Customer accounts, contacts, credit",
    subPermissions: [
      { id: "view", label: "View Customers" },
      { id: "create", label: "Create Accounts" },
      { id: "edit", label: "Edit Accounts" },
      { id: "delete", label: "Delete Accounts" },
      { id: "credit", label: "Manage Credit Limits" },
      { id: "view_financials", label: "View Customer Financials" },
    ],
  },
  {
    id: "finance", label: "Financial Hub", description: "Receivables, payables, cash flow, P&L",
    subPermissions: [
      { id: "view", label: "View Financials" },
      { id: "receivables", label: "Manage Receivables" },
      { id: "payables", label: "Manage Payables" },
      { id: "cashflow", label: "View Cash Flow" },
      { id: "pnl", label: "View P&L Statement" },
      { id: "export", label: "Export Financial Reports" },
    ],
  },
  {
    id: "marketing", label: "Marketing", description: "Campaign builder, calendar, analytics",
    subPermissions: [
      { id: "view", label: "View Marketing" },
      { id: "create", label: "Create Campaigns" },
      { id: "edit", label: "Edit Campaigns" },
      { id: "delete", label: "Delete Campaigns" },
      { id: "budget", label: "Manage Budgets" },
    ],
  },
  {
    id: "ai", label: "AI Command Center", description: "AI chat, insights, automations",
    subPermissions: [
      { id: "view", label: "View AI Insights" },
      { id: "chat", label: "Use AI Chat" },
      { id: "automations", label: "Manage Automations" },
    ],
  },
  {
    id: "team", label: "Team & Performance", description: "Team roster, leaderboard, commissions",
    subPermissions: [
      { id: "view_own", label: "View Own Performance" },
      { id: "view_team", label: "View Team Performance" },
      { id: "leaderboard", label: "View Leaderboard" },
      { id: "commissions", label: "View Commission Data" },
      { id: "edit_targets", label: "Edit Targets & Quotas" },
    ],
  },
  {
    id: "reports", label: "Reports & Analytics", description: "Report builder, dashboards, exports",
    subPermissions: [
      { id: "view", label: "View Reports" },
      { id: "create", label: "Build Custom Reports" },
      { id: "export", label: "Export Reports" },
      { id: "scheduled", label: "Schedule Reports" },
    ],
  },
  {
    id: "settings", label: "Settings", description: "Company, users, integrations, billing",
    subPermissions: [
      { id: "view", label: "View Settings" },
      { id: "company", label: "Edit Company Profile" },
      { id: "users", label: "Manage Users" },
      { id: "roles", label: "Manage Roles" },
      { id: "integrations", label: "Manage Integrations" },
      { id: "billing", label: "View & Manage Billing" },
      { id: "api", label: "API Key Access" },
      { id: "whitelabel", label: "White Label Settings" },
    ],
  },
];

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem: boolean;
  userCount: number;
  permissions: Record<string, Record<string, boolean>>;
}

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full access to everything. Cannot be restricted.",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    isSystem: true,
    userCount: 1,
    permissions: Object.fromEntries(
      permissionModules.map(m => [m.id, Object.fromEntries(m.subPermissions.map(sp => [sp.id, true]))])
    ),
  },
  {
    id: "sales_manager",
    name: "Sales Manager",
    description: "Full sales access, team oversight, limited settings.",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    isSystem: false,
    userCount: 2,
    permissions: {
      dashboard: { view: true, export: true },
      leads: { view: true, create: true, edit: true, delete: false, scraper: true, sequences: true, inbox: true, campaigns: true, meta_ads: true },
      pipeline: { view: true, create: true, edit: true, delete: false, assign: true },
      orders: { view: true, create: true, edit: true, delete: false, fulfill: true, purchase_orders: false },
      inventory: { view: true, create: false, edit: false, delete: false, adjust_stock: false, price_books: true },
      customers: { view: true, create: true, edit: true, delete: false, credit: true, view_financials: true },
      finance: { view: true, receivables: true, payables: false, cashflow: true, pnl: false, export: false },
      marketing: { view: true, create: true, edit: true, delete: false, budget: false },
      ai: { view: true, chat: true, automations: false },
      team: { view_own: true, view_team: true, leaderboard: true, commissions: true, edit_targets: true },
      reports: { view: true, create: true, export: true, scheduled: false },
      settings: { view: true, company: false, users: false, roles: false, integrations: false, billing: false, api: false, whitelabel: false },
    },
  },
  {
    id: "sales_rep",
    name: "Sales Rep",
    description: "Own pipeline, leads, and orders. No team or finance access.",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    isSystem: false,
    userCount: 3,
    permissions: {
      dashboard: { view: true, export: false },
      leads: { view: true, create: true, edit: true, delete: false, scraper: true, sequences: true, inbox: true, campaigns: false, meta_ads: false },
      pipeline: { view: true, create: true, edit: true, delete: false, assign: false },
      orders: { view: true, create: true, edit: true, delete: false, fulfill: false, purchase_orders: false },
      inventory: { view: true, create: false, edit: false, delete: false, adjust_stock: false, price_books: false },
      customers: { view: true, create: true, edit: true, delete: false, credit: false, view_financials: false },
      finance: { view: false, receivables: false, payables: false, cashflow: false, pnl: false, export: false },
      marketing: { view: false, create: false, edit: false, delete: false, budget: false },
      ai: { view: true, chat: true, automations: false },
      team: { view_own: true, view_team: false, leaderboard: true, commissions: false, edit_targets: false },
      reports: { view: true, create: false, export: false, scheduled: false },
      settings: { view: false, company: false, users: false, roles: false, integrations: false, billing: false, api: false, whitelabel: false },
    },
  },
  {
    id: "operations",
    name: "Operations",
    description: "Orders, inventory, fulfillment. No sales or finance.",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    isSystem: false,
    userCount: 2,
    permissions: {
      dashboard: { view: true, export: false },
      leads: { view: false, create: false, edit: false, delete: false, scraper: false, sequences: false, inbox: false, campaigns: false, meta_ads: false },
      pipeline: { view: false, create: false, edit: false, delete: false, assign: false },
      orders: { view: true, create: true, edit: true, delete: false, fulfill: true, purchase_orders: true },
      inventory: { view: true, create: true, edit: true, delete: false, adjust_stock: true, price_books: false },
      customers: { view: true, create: false, edit: false, delete: false, credit: false, view_financials: false },
      finance: { view: false, receivables: false, payables: false, cashflow: false, pnl: false, export: false },
      marketing: { view: false, create: false, edit: false, delete: false, budget: false },
      ai: { view: true, chat: true, automations: false },
      team: { view_own: true, view_team: false, leaderboard: false, commissions: false, edit_targets: false },
      reports: { view: true, create: false, export: false, scheduled: false },
      settings: { view: false, company: false, users: false, roles: false, integrations: false, billing: false, api: false, whitelabel: false },
    },
  },
  {
    id: "read_only",
    name: "Read Only",
    description: "View-only access. Cannot create, edit, or delete anything.",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    isSystem: false,
    userCount: 1,
    permissions: {
      dashboard: { view: true, export: false },
      leads: { view: true, create: false, edit: false, delete: false, scraper: false, sequences: false, inbox: false, campaigns: false, meta_ads: false },
      pipeline: { view: true, create: false, edit: false, delete: false, assign: false },
      orders: { view: true, create: false, edit: false, delete: false, fulfill: false, purchase_orders: false },
      inventory: { view: true, create: false, edit: false, delete: false, adjust_stock: false, price_books: false },
      customers: { view: true, create: false, edit: false, delete: false, credit: false, view_financials: false },
      finance: { view: true, receivables: false, payables: false, cashflow: false, pnl: false, export: false },
      marketing: { view: true, create: false, edit: false, delete: false, budget: false },
      ai: { view: true, chat: false, automations: false },
      team: { view_own: true, view_team: false, leaderboard: true, commissions: false, edit_targets: false },
      reports: { view: true, create: false, export: false, scheduled: false },
      settings: { view: false, company: false, users: false, roles: false, integrations: false, billing: false, api: false, whitelabel: false },
    },
  },
];

// ─── Toggle Switch component ────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-primary" : "bg-border"
      )}
    >
      <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm", checked ? "translate-x-[18px]" : "translate-x-[3px]")} />
    </button>
  );
}

// ─── Roles Panel component ──────────────────────────────────────────────

function RolesPanel() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const activeRole = roles.find(r => r.id === selectedRole);

  const togglePermission = (roleId: string, moduleId: string, permId: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId || r.isSystem) return r;
      return {
        ...r,
        permissions: {
          ...r.permissions,
          [moduleId]: {
            ...r.permissions[moduleId],
            [permId]: !r.permissions[moduleId]?.[permId],
          },
        },
      };
    }));
  };

  const toggleModuleAll = (roleId: string, moduleId: string, value: boolean) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId || r.isSystem) return r;
      const mod = permissionModules.find(m => m.id === moduleId);
      if (!mod) return r;
      return {
        ...r,
        permissions: {
          ...r.permissions,
          [moduleId]: Object.fromEntries(mod.subPermissions.map(sp => [sp.id, value])),
        },
      };
    }));
  };

  const getModuleStatus = (role: Role, moduleId: string) => {
    const mod = permissionModules.find(m => m.id === moduleId);
    if (!mod) return "none";
    const perms = role.permissions[moduleId] || {};
    const total = mod.subPermissions.length;
    const enabled = mod.subPermissions.filter(sp => perms[sp.id]).length;
    if (enabled === total) return "full";
    if (enabled > 0) return "partial";
    return "none";
  };

  if (selectedRole && activeRole) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedRole(null)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to Roles
          </button>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", activeRole.color.split(" ")[0])}>
                {activeRole.isSystem ? <Lock className={cn("h-5 w-5", activeRole.color.split(" ")[1])} /> : <Shield className={cn("h-5 w-5", activeRole.color.split(" ")[1])} />}
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-text-primary">{activeRole.name}</h3>
                <p className="text-sm text-text-muted">{activeRole.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">{activeRole.userCount} user{activeRole.userCount !== 1 ? "s" : ""}</span>
              {activeRole.isSystem && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <Lock className="h-3 w-3" /> System Role
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Permission Modules */}
        <div className="space-y-2">
          {permissionModules.map((mod, mi) => {
            const status = getModuleStatus(activeRole, mod.id);
            const isExpanded = expandedModules[mod.id] ?? false;
            const perms = activeRole.permissions[mod.id] || {};
            const enabledCount = mod.subPermissions.filter(sp => perms[sp.id]).length;

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.02 }}
                className="glass-card overflow-hidden"
              >
                {/* Module header row */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-surface-hover/50 transition-colors"
                  onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className={cn("h-4 w-4 text-text-muted transition-transform", isExpanded && "rotate-90")} />
                    <div>
                      <span className="text-sm font-medium text-text-primary">{mod.label}</span>
                      <span className="ml-2 text-xs text-text-muted">{mod.description}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      status === "full" ? "bg-emerald-500/20 text-emerald-400" :
                      status === "partial" ? "bg-amber-500/20 text-amber-400" :
                      "bg-gray-500/20 text-gray-500"
                    )}>
                      {status === "full" ? "Full Access" : status === "partial" ? `${enabledCount}/${mod.subPermissions.length} Enabled` : "No Access"}
                    </span>
                    {!activeRole.isSystem && (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleModuleAll(activeRole.id, mod.id, true)}
                          className={cn("px-2 py-1 rounded text-[10px] font-medium transition-colors", status === "full" ? "bg-emerald-500/20 text-emerald-400" : "text-text-muted hover:bg-surface-hover")}
                        >
                          All
                        </button>
                        <button
                          onClick={() => toggleModuleAll(activeRole.id, mod.id, false)}
                          className={cn("px-2 py-1 rounded text-[10px] font-medium transition-colors", status === "none" ? "bg-red-500/20 text-red-400" : "text-text-muted hover:bg-surface-hover")}
                        >
                          None
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded permission toggles */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-5 py-3 space-y-0">
                        {mod.subPermissions.map(sp => (
                          <div key={sp.id} className="flex items-center justify-between py-2 group">
                            <div className="flex items-center gap-3">
                              <div className={cn("h-1.5 w-1.5 rounded-full", perms[sp.id] ? "bg-emerald-400" : "bg-gray-600")} />
                              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{sp.label}</span>
                            </div>
                            <Toggle
                              checked={!!perms[sp.id]}
                              onChange={() => togglePermission(activeRole.id, mod.id, sp.id)}
                              disabled={activeRole.isSystem}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {!activeRole.isSystem && (
          <div className="flex items-center justify-between pt-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-danger/50 text-sm text-danger hover:bg-danger-light transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete Role
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
              Save Changes
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // ─── Roles List View ────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-text-primary">Roles & Permissions</h3>
          <p className="text-sm text-text-muted mt-0.5">Control what each role can see and do across the platform</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Create Role
        </button>
      </div>

      <div className="space-y-3">
        {roles.map((role, i) => {
          const totalPerms = permissionModules.reduce((sum, m) => sum + m.subPermissions.length, 0);
          const enabledPerms = permissionModules.reduce((sum, m) => {
            const perms = role.permissions[m.id] || {};
            return sum + m.subPermissions.filter(sp => perms[sp.id]).length;
          }, 0);
          const pct = Math.round((enabledPerms / totalPerms) * 100);

          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedRole(role.id)}
              className="glass-card p-5 cursor-pointer hover:border-border-light transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", role.color.split(" ")[0])}>
                    {role.isSystem ? <Lock className={cn("h-5 w-5", role.color.split(" ")[1])} /> : <Shield className={cn("h-5 w-5", role.color.split(" ")[1])} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-primary">{role.name}</h4>
                      {role.isSystem && (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/15 text-amber-400">SYSTEM</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* User count */}
                  <div className="text-center">
                    <p className="text-sm font-bold font-heading text-text-primary">{role.userCount}</p>
                    <p className="text-[10px] text-text-muted uppercase">Users</p>
                  </div>
                  {/* Permission bar */}
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-text-muted">{enabledPerms}/{totalPerms} permissions</span>
                      <span className="text-[10px] font-medium text-text-secondary">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-blue-500" : pct > 20 ? "bg-amber-500" : "bg-gray-500")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
              </div>

              {/* Module access pills */}
              <div className="flex flex-wrap gap-1.5 mt-3 pl-14">
                {permissionModules.filter(m => {
                  const perms = role.permissions[m.id] || {};
                  return m.subPermissions.some(sp => perms[sp.id]);
                }).map(m => {
                  const status = (() => {
                    const perms = role.permissions[m.id] || {};
                    const total = m.subPermissions.length;
                    const enabled = m.subPermissions.filter(sp => perms[sp.id]).length;
                    if (enabled === total) return "full";
                    return "partial";
                  })();
                  return (
                    <span key={m.id} className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium",
                      status === "full" ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-hover text-text-muted"
                    )}>
                      {status === "full" ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                      {m.label}
                    </span>
                  );
                })}
                {permissionModules.filter(m => {
                  const perms = role.permissions[m.id] || {};
                  return !m.subPermissions.some(sp => perms[sp.id]);
                }).map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-400/60">
                    <X className="h-2.5 w-2.5" />
                    {m.label}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");

  // ─── Email Settings State ──────────────────────────────────────────
  const [smtpHost, setSmtpHost] = useState("smtp.wholesale-co.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("notifications@wholesale-co.com");
  const [smtpPassword, setSmtpPassword] = useState("••••••••••••");
  const [smtpEncryption, setSmtpEncryption] = useState("tls");
  const [emailFromName, setEmailFromName] = useState("WholesaleOS");
  const [emailFromAddress, setEmailFromAddress] = useState("notifications@wholesale-co.com");
  const [emailReplyTo, setEmailReplyTo] = useState("support@wholesale-co.com");
  const [testEmailAddress, setTestEmailAddress] = useState("");

  // ─── Notifications State ───────────────────────────────────────────
  const [notifChannels, setNotifChannels] = useState({ email: true, inApp: true, sms: false, slack: true });
  const [notifEvents, setNotifEvents] = useState<Record<string, Record<string, boolean>>>({
    new_order: { email: true, inApp: true, sms: false, slack: true },
    order_shipped: { email: true, inApp: true, sms: false, slack: false },
    order_delivered: { email: false, inApp: true, sms: false, slack: false },
    payment_received: { email: true, inApp: true, sms: false, slack: true },
    payment_overdue: { email: true, inApp: true, sms: true, slack: true },
    low_stock: { email: true, inApp: true, sms: false, slack: true },
    out_of_stock: { email: true, inApp: true, sms: true, slack: true },
    reorder_point: { email: true, inApp: true, sms: false, slack: false },
    stocktake_due: { email: false, inApp: true, sms: false, slack: false },
    new_lead: { email: true, inApp: true, sms: false, slack: true },
    lead_score_changed: { email: false, inApp: true, sms: false, slack: false },
    lead_assigned: { email: true, inApp: true, sms: false, slack: true },
    followup_due: { email: true, inApp: true, sms: true, slack: false },
    invoice_due: { email: true, inApp: true, sms: false, slack: false },
    invoice_overdue: { email: true, inApp: true, sms: true, slack: true },
    expense_approved: { email: false, inApp: true, sms: false, slack: false },
    monthly_report: { email: true, inApp: true, sms: false, slack: false },
    system_update: { email: true, inApp: true, sms: false, slack: false },
    security_alert: { email: true, inApp: true, sms: true, slack: true },
    api_rate_limit: { email: false, inApp: true, sms: false, slack: true },
    backup_complete: { email: false, inApp: true, sms: false, slack: false },
  });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  // ─── Data Management State ─────────────────────────────────────────
  const [exportFormats, setExportFormats] = useState<Record<string, string>>({
    full_db: "csv", customer: "csv", financial: "xlsx", order_history: "csv",
  });
  const [retentionPeriods, setRetentionPeriods] = useState({
    order_history: "forever", lead_data: "2yr", activity_logs: "90d", email_logs: "6mo",
  });

  // ─── White Label State ─────────────────────────────────────────────
  const [wlCompanyName, setWlCompanyName] = useState("WholesaleOS");
  const [wlTagline, setWlTagline] = useState("Modern wholesale management platform");
  const [wlPrimaryColor, setWlPrimaryColor] = useState("#6366f1");
  const [wlSecondaryColor, setWlSecondaryColor] = useState("#8b5cf6");
  const [wlAccentColor, setWlAccentColor] = useState("#22d3ee");
  const [wlCustomDomain, setWlCustomDomain] = useState("app.wholesale-co.com");
  const [wlSslStatus] = useState<"active" | "pending">("active");
  const [wlDnsExpanded, setWlDnsExpanded] = useState(false);
  const [wlWelcomeTitle, setWlWelcomeTitle] = useState("Welcome back");
  const [wlWelcomeSubtitle, setWlWelcomeSubtitle] = useState("Sign in to your wholesale management dashboard");
  const [wlShowPoweredBy, setWlShowPoweredBy] = useState(true);

  // ─── Notification event definitions ────────────────────────────────
  const notifEventCategories = [
    { category: "Orders", events: [
      { id: "new_order", label: "New Order" },
      { id: "order_shipped", label: "Order Shipped" },
      { id: "order_delivered", label: "Order Delivered" },
      { id: "payment_received", label: "Payment Received" },
      { id: "payment_overdue", label: "Payment Overdue" },
    ]},
    { category: "Inventory", events: [
      { id: "low_stock", label: "Low Stock Alert" },
      { id: "out_of_stock", label: "Out of Stock" },
      { id: "reorder_point", label: "Reorder Point Hit" },
      { id: "stocktake_due", label: "Stocktake Due" },
    ]},
    { category: "Leads", events: [
      { id: "new_lead", label: "New Lead Captured" },
      { id: "lead_score_changed", label: "Lead Score Changed" },
      { id: "lead_assigned", label: "Lead Assigned" },
      { id: "followup_due", label: "Follow-up Due" },
    ]},
    { category: "Finance", events: [
      { id: "invoice_due", label: "Invoice Due" },
      { id: "invoice_overdue", label: "Invoice Overdue" },
      { id: "expense_approved", label: "Expense Approved" },
      { id: "monthly_report", label: "Monthly Report Ready" },
    ]},
    { category: "System", events: [
      { id: "system_update", label: "System Update" },
      { id: "security_alert", label: "Security Alert" },
      { id: "api_rate_limit", label: "API Rate Limit" },
      { id: "backup_complete", label: "Backup Complete" },
    ]},
  ];

  const toggleNotifEvent = (eventId: string, channel: string) => {
    setNotifEvents(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], [channel]: !prev[eventId]?.[channel] },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Settings & Integrations</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account, team, integrations, and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors", activeTab === tab.id ? "bg-primary-light text-primary font-medium" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary")}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "company" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6">
              <h3 className="font-heading text-lg font-semibold text-text-primary">Company Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Company Name</label>
                  <input defaultValue="WholesaleOS Inc." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Industry</label>
                  <input defaultValue="Wholesale Distribution" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Address</label>
                  <input defaultValue="100 Market St, Suite 400" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">City, State, Zip</label>
                  <input defaultValue="San Francisco, CA 94105" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Tax ID / EIN</label>
                  <input defaultValue="XX-XXXXXXX" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Phone</label>
                  <input defaultValue="(415) 555-0100" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">W</div>
                  <button className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-hover transition-colors">Upload Logo</button>
                </div>
              </div>
              <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">Save Changes</button>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-semibold text-text-primary">User Management</h3>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">
                  <Plus className="h-4 w-4" /> Add User
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase">User</th>
                    <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase">Email</th>
                    <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase">Role</th>
                    <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase">Department</th>
                    <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                    <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamUsers.map(u => (
                    <tr key={u.email} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{u.initials}</div>
                          <span className="font-medium text-text-primary">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                          u.role === "Admin" ? "bg-red-500/20 text-red-400" :
                          u.role === "Sales Manager" ? "bg-purple-500/20 text-purple-400" :
                          u.role === "Sales Rep" ? "bg-blue-500/20 text-blue-400" :
                          u.role === "Operations" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-gray-500/20 text-gray-400"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">{u.department}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                          u.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        )}>{u.status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {u.role !== "Admin" && (
                            <button className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-text-muted">{teamUsers.length} users &middot; {teamUsers.filter(u => u.status === "Active").length} active</p>
                <button onClick={() => {}} className="text-xs text-primary hover:text-primary-hover font-medium transition-colors flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Manage Roles & Permissions
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "roles" && <RolesPanel />}

          {activeTab === "integrations" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h3 className="font-heading text-lg font-semibold text-text-primary">Integration Marketplace</h3>
              <div className="grid grid-cols-3 gap-4">
                {integrations.map((int, i) => (
                  <motion.div key={int.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4 hover:border-border-light transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{int.icon}</span>
                      {int.status === "connected" ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-surface-hover text-text-muted">Available</span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-text-primary">{int.name}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{int.description}</p>
                    <button className={cn("mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-colors", int.status === "connected" ? "border border-border text-text-secondary hover:bg-surface-hover" : "bg-primary hover:bg-primary-hover text-white")}>
                      {int.status === "connected" ? "Configure" : "Connect"}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-text-primary">Enterprise Plan</h3>
                    <p className="text-sm text-text-muted mt-1">Unlimited users, all features, priority support</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold font-heading text-text-primary">$2,499<span className="text-sm font-normal text-text-muted">/mo</span></p>
                    <p className="text-xs text-success mt-1">Annual billing — Save 20%</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {["Unlimited Users", "All Modules", "AI Features", "API Access", "Custom Branding", "Priority Support", "Dedicated CSM", "99.9% SLA"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />{f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-heading text-sm font-semibold text-text-primary mb-4">Billing History</h3>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    <th className="py-2 px-3 text-left text-xs font-medium text-text-muted uppercase">Date</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-text-muted uppercase">Description</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-text-muted uppercase">Amount</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-text-muted uppercase">Status</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { date: "Mar 1, 2026", desc: "Enterprise Plan — Monthly", amount: "$2,499.00", status: "Paid" },
                      { date: "Feb 1, 2026", desc: "Enterprise Plan — Monthly", amount: "$2,499.00", status: "Paid" },
                      { date: "Jan 1, 2026", desc: "Enterprise Plan — Monthly", amount: "$2,499.00", status: "Paid" },
                    ].map((inv, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-3 text-text-muted">{inv.date}</td>
                        <td className="py-2 px-3 text-text-primary">{inv.desc}</td>
                        <td className="py-2 px-3 text-right font-medium text-text-primary">{inv.amount}</td>
                        <td className="py-2 px-3 text-right"><span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400">{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "api" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6 space-y-6">
                <h3 className="font-heading text-lg font-semibold text-text-primary">API & Webhooks</h3>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">API Key</label>
                  <div className="flex gap-2">
                    <input value="wos_live_sk_a8f2k3m5n7p9q1r3t5v7x9z1••••••••" readOnly className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-mono outline-none" />
                    <button className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-hover transition-colors">Copy</button>
                    <button className="px-4 py-2 rounded-lg border border-danger/50 text-sm text-danger hover:bg-danger-light transition-colors">Regenerate</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Webhook URL</label>
                  <input defaultValue="https://api.wholesale-co.com/webhooks/v1" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-mono outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Rate Limits</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[{ label: "Requests/min", value: "1,000" }, { label: "Requests/day", value: "100,000" }, { label: "Bulk operations", value: "500/batch" }].map(r => (
                      <div key={r.label} className="p-3 rounded-lg bg-surface-hover">
                        <p className="text-xs text-text-muted">{r.label}</p>
                        <p className="text-lg font-bold font-heading text-text-primary mt-1">{r.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sage Webhook Integration */}
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-lg">📗</div>
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-text-primary">Sage Webhook</h3>
                      <p className="text-xs text-text-muted">Sync orders, invoices, and inventory with Sage accounting</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Sage Webhook URL</label>
                    <input defaultValue="https://webhooks.sage.com/v2/wos-integration/inbound" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-mono outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Sage API Key</label>
                    <input value="sage_wh_sk_9x8w7v6u5t4s3r2q••••••" readOnly className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-mono outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Webhook Events</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { event: "order.created", label: "New Order Created", active: true },
                      { event: "order.updated", label: "Order Status Changed", active: true },
                      { event: "invoice.created", label: "Invoice Generated", active: true },
                      { event: "invoice.paid", label: "Payment Received", active: true },
                      { event: "inventory.updated", label: "Stock Level Changed", active: true },
                      { event: "inventory.low_stock", label: "Low Stock Alert", active: true },
                      { event: "customer.created", label: "New Customer Added", active: false },
                      { event: "product.price_changed", label: "Price Updated", active: true },
                    ].map(wh => (
                      <div key={wh.event} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-hover/50 hover:bg-surface-hover transition-colors">
                        <div>
                          <p className="text-xs font-medium text-text-primary">{wh.label}</p>
                          <p className="text-[10px] font-mono text-text-muted">{wh.event}</p>
                        </div>
                        <button className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", wh.active ? "bg-primary" : "bg-border")}>
                          <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm", wh.active ? "translate-x-[18px]" : "translate-x-[3px]")} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Recent Webhook Deliveries</label>
                  <div className="space-y-1">
                    {[
                      { event: "invoice.paid", status: "200 OK", time: "2 min ago", id: "wh_del_8f2a" },
                      { event: "order.created", status: "200 OK", time: "15 min ago", id: "wh_del_7e1b" },
                      { event: "inventory.updated", status: "200 OK", time: "32 min ago", id: "wh_del_6d0c" },
                      { event: "product.price_changed", status: "200 OK", time: "1 hr ago", id: "wh_del_5c9d" },
                      { event: "order.updated", status: "408 Timeout", time: "2 hr ago", id: "wh_del_4b8e" },
                    ].map(del => (
                      <div key={del.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-hover/50 transition-colors text-xs">
                        <div className="flex items-center gap-3">
                          <span className={cn("h-1.5 w-1.5 rounded-full", del.status.startsWith("200") ? "bg-emerald-400" : "bg-amber-400")} />
                          <span className="font-mono text-text-muted">{del.event}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn("font-mono", del.status.startsWith("200") ? "text-emerald-400" : "text-amber-400")}>{del.status}</span>
                          <span className="text-text-muted w-16 text-right">{del.time}</span>
                          <span className="font-mono text-text-muted/50">{del.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">Save Configuration</button>
                  <button className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-hover transition-colors">Test Webhook</button>
                  <button className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-hover transition-colors">View Full Logs</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Email Settings Tab ──────────────────────────────────────── */}
          {activeTab === "email" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* SMTP Configuration */}
              <div className="glass-card p-6 space-y-5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">SMTP Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">SMTP Host</label>
                    <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Port</label>
                    <input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Username</label>
                    <input value={smtpUsername} onChange={e => setSmtpUsername(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Password</label>
                    <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Encryption</label>
                    <select value={smtpEncryption} onChange={e => setSmtpEncryption(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary">
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">From Name</label>
                    <input value={emailFromName} onChange={e => setEmailFromName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">From Email</label>
                    <input value={emailFromAddress} onChange={e => setEmailFromAddress(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Reply-To Email</label>
                    <input value={emailReplyTo} onChange={e => setEmailReplyTo(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              {/* Email Templates */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Email Templates</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: "Order Confirmation", icon: "📦", lastEdited: "Mar 15, 2026" },
                    { name: "Invoice Sent", icon: "🧾", lastEdited: "Mar 10, 2026" },
                    { name: "Shipping Notification", icon: "🚚", lastEdited: "Feb 28, 2026" },
                    { name: "Welcome Email", icon: "👋", lastEdited: "Feb 20, 2026" },
                    { name: "Payment Reminder", icon: "💳", lastEdited: "Mar 22, 2026" },
                  ].map((template, i) => (
                    <motion.div
                      key={template.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-surface-hover/50 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{template.name}</p>
                          <p className="text-xs text-text-muted">Last edited: {template.lastEdited}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-hover transition-colors flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Preview
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-xs text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Test Email */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Send Test Email</h3>
                <div className="flex gap-3">
                  <input
                    value={testEmailAddress}
                    onChange={e => setTestEmailAddress(e.target.value)}
                    placeholder="Enter email address..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary placeholder:text-text-muted/50"
                  />
                  <button className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> Send Test
                  </button>
                </div>
              </div>

              <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">Save Configuration</button>
            </motion.div>
          )}

          {/* ─── Notifications Tab ────────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Notification Channels */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-lg font-semibold text-text-primary">Notification Channels</h3>
                <div className="grid grid-cols-4 gap-4">
                  {([
                    { key: "email", label: "Email", icon: "📧" },
                    { key: "inApp", label: "In-App", icon: "🔔" },
                    { key: "sms", label: "SMS", icon: "💬" },
                    { key: "slack", label: "Slack", icon: "💡" },
                  ] as const).map(ch => (
                    <div key={ch.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-hover/50">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{ch.icon}</span>
                        <span className="text-sm font-medium text-text-primary">{ch.label}</span>
                      </div>
                      <Toggle
                        checked={notifChannels[ch.key]}
                        onChange={() => setNotifChannels(prev => ({ ...prev, [ch.key]: !prev[ch.key] }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Notifications */}
              <div className="glass-card p-6 space-y-5">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Event Notifications</h3>
                {notifEventCategories.map((cat, ci) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.05 }}
                  >
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{cat.category}</p>
                    <div className="rounded-xl border border-border overflow-hidden">
                      {/* Header row */}
                      <div className="grid grid-cols-[1fr_60px_60px_60px_60px] gap-2 px-4 py-2 bg-surface-hover/50 border-b border-border">
                        <span className="text-[10px] font-medium text-text-muted uppercase">Event</span>
                        <span className="text-[10px] font-medium text-text-muted uppercase text-center">Email</span>
                        <span className="text-[10px] font-medium text-text-muted uppercase text-center">In-App</span>
                        <span className="text-[10px] font-medium text-text-muted uppercase text-center">SMS</span>
                        <span className="text-[10px] font-medium text-text-muted uppercase text-center">Slack</span>
                      </div>
                      {cat.events.map((evt, ei) => (
                        <div
                          key={evt.id}
                          className={cn(
                            "grid grid-cols-[1fr_60px_60px_60px_60px] gap-2 px-4 py-2.5 items-center hover:bg-surface-hover/30 transition-colors",
                            ei < cat.events.length - 1 && "border-b border-border/50"
                          )}
                        >
                          <span className="text-sm text-text-primary">{evt.label}</span>
                          {(["email", "inApp", "sms", "slack"] as const).map(ch => (
                            <div key={ch} className="flex justify-center">
                              <Toggle
                                checked={!!notifEvents[evt.id]?.[ch]}
                                onChange={() => toggleNotifEvent(evt.id, ch)}
                              />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quiet Hours */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-text-primary">Quiet Hours</h3>
                    <p className="text-xs text-text-muted mt-0.5">Suppress non-critical notifications during set hours</p>
                  </div>
                  <Toggle checked={quietHoursEnabled} onChange={() => setQuietHoursEnabled(prev => !prev)} />
                </div>
                {quietHoursEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Start Time</label>
                      <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">End Time</label>
                      <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                    </div>
                  </motion.div>
                )}
              </div>

              <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">Save Preferences</button>
            </motion.div>
          )}

          {/* ─── Data Management Tab ──────────────────────────────────────── */}
          {activeTab === "data" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Data Export */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-lg font-semibold text-text-primary">Data Export</h3>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { key: "full_db", label: "Full Database Export", desc: "Export all tables and records", icon: "💾" },
                    { key: "customer", label: "Customer Data Export", desc: "Customer accounts, contacts, history", icon: "👥" },
                    { key: "financial", label: "Financial Report Export", desc: "Invoices, payments, P&L data", icon: "📊" },
                    { key: "order_history", label: "Order History Export", desc: "All orders with line items", icon: "📦" },
                  ] as const).map((exp, i) => (
                    <motion.div
                      key={exp.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 rounded-xl bg-surface-hover/50 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{exp.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{exp.label}</p>
                          <p className="text-xs text-text-muted">{exp.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={exportFormats[exp.key]}
                          onChange={e => setExportFormats(prev => ({ ...prev, [exp.key]: e.target.value }))}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
                        >
                          <option value="csv">CSV</option>
                          <option value="json">JSON</option>
                          <option value="xlsx">XLSX</option>
                        </select>
                        <button className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Export
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Data Retention */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Data Retention</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Order History</label>
                    <select value={retentionPeriods.order_history} onChange={e => setRetentionPeriods(prev => ({ ...prev, order_history: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary">
                      <option value="1yr">1 Year</option>
                      <option value="2yr">2 Years</option>
                      <option value="5yr">5 Years</option>
                      <option value="forever">Forever</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Lead Data</label>
                    <select value={retentionPeriods.lead_data} onChange={e => setRetentionPeriods(prev => ({ ...prev, lead_data: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary">
                      <option value="6mo">6 Months</option>
                      <option value="1yr">1 Year</option>
                      <option value="2yr">2 Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Activity Logs</label>
                    <select value={retentionPeriods.activity_logs} onChange={e => setRetentionPeriods(prev => ({ ...prev, activity_logs: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary">
                      <option value="30d">30 Days</option>
                      <option value="90d">90 Days</option>
                      <option value="1yr">1 Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Email Logs</label>
                    <select value={retentionPeriods.email_logs} onChange={e => setRetentionPeriods(prev => ({ ...prev, email_logs: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary">
                      <option value="90d">90 Days</option>
                      <option value="6mo">6 Months</option>
                      <option value="1yr">1 Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Backup */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-text-primary">Backups</h3>
                    <p className="text-xs text-text-muted mt-0.5">Last backup: <span className="text-text-secondary font-medium">Mar 29, 2026 at 03:00 AM</span> &middot; 4.2 GB</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <Database className="h-4 w-4" /> Backup Now
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border-2 border-red-500/30 p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-red-400">Danger Zone</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Purge Inactive Leads</p>
                      <p className="text-xs text-text-muted">Permanently delete all leads with no activity in the last 12 months</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-red-500/40 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Purge</button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Clear Activity Logs</p>
                      <p className="text-xs text-text-muted">Remove all activity and audit log entries. This cannot be undone.</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-red-500/40 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Clear</button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Reset Demo Data</p>
                      <p className="text-xs text-text-muted">Reset all data back to the demo dataset. All real data will be lost.</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg border border-red-500/40 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Reset</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── White Label Tab ───────────────────────────────────────────── */}
          {activeTab === "whitelabel" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Brand Identity */}
              <div className="glass-card p-6 space-y-5">
                <h3 className="font-heading text-lg font-semibold text-text-primary">Brand Identity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Company Name</label>
                    <input value={wlCompanyName} onChange={e => setWlCompanyName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Tagline</label>
                    <input value={wlTagline} onChange={e => setWlTagline(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { label: "Primary Color", value: wlPrimaryColor, setter: setWlPrimaryColor },
                    { label: "Secondary Color", value: wlSecondaryColor, setter: setWlSecondaryColor },
                    { label: "Accent Color", value: wlAccentColor, setter: setWlAccentColor },
                  ] as { label: string; value: string; setter: (v: string) => void }[]).map(color => (
                    <div key={color.label}>
                      <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">{color.label}</label>
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg border border-border shrink-0" style={{ backgroundColor: color.value }} />
                        <input value={color.value} onChange={e => color.setter(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-mono outline-none focus:border-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo Management */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Logo Management</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Main Logo", preview: "W", desc: "Recommended: 200x50px, SVG or PNG" },
                    { label: "Favicon", preview: "W", desc: "Recommended: 32x32px, ICO or PNG" },
                    { label: "Login Background", preview: null, desc: "Recommended: 1920x1080px, JPG or PNG" },
                  ].map((logo, i) => (
                    <motion.div
                      key={logo.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="space-y-3"
                    >
                      <p className="text-xs font-medium text-text-muted uppercase">{logo.label}</p>
                      <div className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
                        {logo.preview ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">{logo.preview}</div>
                        ) : (
                          <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-surface-hover">
                            <Palette className="h-5 w-5 text-text-muted" />
                          </div>
                        )}
                        <p className="text-[10px] text-text-muted mt-2">Click to upload</p>
                      </div>
                      <p className="text-[10px] text-text-muted text-center">{logo.desc}</p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-1.5 rounded-lg bg-primary/10 text-xs text-primary hover:bg-primary/20 transition-colors">Upload</button>
                        <button className="flex-1 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:bg-surface-hover transition-colors">Remove</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Custom Domain */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Custom Domain</h3>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Domain</label>
                    <input value={wlCustomDomain} onChange={e => setWlCustomDomain(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-mono outline-none focus:border-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-text-muted uppercase">SSL Status:</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      wlSslStatus === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {wlSslStatus === "active" ? <CheckCircle2 className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                      {wlSslStatus === "active" ? "Active" : "Pending"}
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => setWlDnsExpanded(prev => !prev)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", wlDnsExpanded && "rotate-90")} />
                    DNS Configuration Instructions
                  </button>
                  <AnimatePresence>
                    {wlDnsExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 rounded-xl bg-surface-hover/50 space-y-2">
                          <p className="text-xs text-text-muted">Add the following DNS records to your domain registrar:</p>
                          <div className="font-mono text-xs space-y-1.5">
                            <div className="flex gap-4 p-2 rounded-lg bg-background">
                              <span className="text-text-muted w-12">CNAME</span>
                              <span className="text-text-secondary">app</span>
                              <span className="text-text-muted">&rarr;</span>
                              <span className="text-text-primary">proxy.wholesaleos.com</span>
                            </div>
                            <div className="flex gap-4 p-2 rounded-lg bg-background">
                              <span className="text-text-muted w-12">TXT</span>
                              <span className="text-text-secondary">_verify</span>
                              <span className="text-text-muted">&rarr;</span>
                              <span className="text-text-primary">wos-verify=a8f2k3m5n7p9</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Login Page Customization */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-text-primary">Login Page Customization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Welcome Title</label>
                    <input value={wlWelcomeTitle} onChange={e => setWlWelcomeTitle(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted uppercase mb-1.5 block">Welcome Subtitle</label>
                    <input value={wlWelcomeSubtitle} onChange={e => setWlWelcomeSubtitle(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover/50">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Show &ldquo;Powered by WholesaleOS&rdquo;</p>
                    <p className="text-xs text-text-muted">Display attribution badge on the login page</p>
                  </div>
                  <Toggle checked={wlShowPoweredBy} onChange={() => setWlShowPoweredBy(prev => !prev)} />
                </div>
              </div>

              <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors">Save Branding</button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
