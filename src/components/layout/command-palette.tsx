"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  GitBranch,
  ShoppingCart,
  Boxes,
  Users,
  DollarSign,
  Megaphone,
  Bot,
  UserCheck,
  FileText,
  Settings,
  Search,
  Mail,
  MessageSquare,
  Package,
  Truck,
  CreditCard,
  Wallet,
  BarChart3,
  TrendingUp,
} from "lucide-react";

interface CommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

const commands: CommandItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
  { label: "AI Scraper", href: "/leads/scraper", icon: Search, group: "Lead Generation" },
  { label: "Email Sequences", href: "/leads/sequences", icon: Mail, group: "Lead Generation" },
  { label: "Unified Inbox", href: "/leads/inbox", icon: MessageSquare, group: "Lead Generation" },
  { label: "Email Campaigns", href: "/leads/campaigns", icon: Megaphone, group: "Lead Generation" },
  { label: "Meta Ads", href: "/leads/meta-ads", icon: TrendingUp, group: "Lead Generation" },
  { label: "Sales Pipeline", href: "/pipeline", icon: GitBranch, group: "Sales" },
  { label: "Sales Orders", href: "/orders/sales-orders", icon: ShoppingCart, group: "Orders" },
  { label: "Purchase Orders", href: "/orders/purchase-orders", icon: Package, group: "Orders" },
  { label: "Fulfillment", href: "/orders/fulfillment", icon: Truck, group: "Orders" },
  { label: "Inventory", href: "/inventory", icon: Boxes, group: "Operations" },
  { label: "Customers", href: "/customers", icon: Users, group: "Accounts" },
  { label: "Receivables", href: "/finance/receivables", icon: CreditCard, group: "Finance" },
  { label: "Payables", href: "/finance/payables", icon: Wallet, group: "Finance" },
  { label: "Cash Flow", href: "/finance/cashflow", icon: BarChart3, group: "Finance" },
  { label: "Marketing", href: "/marketing", icon: Megaphone, group: "Marketing" },
  { label: "AI Command Center", href: "/ai", icon: Bot, group: "AI" },
  { label: "Team & Performance", href: "/team", icon: UserCheck, group: "Team" },
  { label: "Reports", href: "/reports", icon: FileText, group: "Analytics" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.group.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
      setQuery("");
    },
    [router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].href);
      }
    };
    document.addEventListener("keydown", handleNav);
    return () => document.removeEventListener("keydown", handleNav);
  }, [open, filtered, selectedIndex, handleSelect]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, pages, data..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-text-muted">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-4 py-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  {group}
                </p>
              </div>
              {filtered
                .filter((c) => c.group === group)
                .map((cmd) => {
                  const globalIndex = filtered.indexOf(cmd);
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.href}
                      onClick={() => handleSelect(cmd.href)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        globalIndex === selectedIndex
                          ? "bg-primary-light text-primary"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{cmd.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
