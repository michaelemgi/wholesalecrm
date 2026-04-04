"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Target,
  Search,
  Mail,
  MessageSquare,
  Megaphone,
  GitBranch,
  ShoppingCart,
  Package,
  Truck,
  Boxes,
  Users,
  DollarSign,
  CreditCard,
  Wallet,
  BarChart3,
  Bot,
  UserCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Building2,
  ShoppingBag,
  Inbox,
  Brain,
  Tag,
  Store,
  MapPin,
  ClipboardCheck,
  RotateCcw,
  Route,
  PieChart,
  Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: UserRole;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    children: [
      { label: "Sales Orders", href: "/orders/sales-orders", icon: ShoppingCart },
      { label: "AI Inbox", href: "/orders/ai-inbox", icon: Inbox },
      { label: "Purchase Orders", href: "/orders/purchase-orders", icon: Package },
      { label: "Fulfillment", href: "/orders/fulfillment", icon: Truck },
    ],
  },
  {
    label: "Customer Portal",
    href: "/portal",
    icon: Store,
    children: [
      { label: "Admin", href: "/portal/admin", icon: Settings },
      { label: "Customer View", href: "/portal", icon: ShoppingBag },
    ],
  },
  { label: "Products & Stock", href: "/inventory", icon: Boxes },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Suppliers", href: "/suppliers", icon: Building2 },
  {
    label: "Delivery",
    href: "/delivery",
    icon: Truck,
    children: [
      { label: "Routes & Drivers", href: "/delivery", icon: Route },
      { label: "Proof of Delivery", href: "/delivery?tab=pod", icon: ClipboardCheck },
      { label: "Returns & Deposits", href: "/delivery?tab=returns", icon: RotateCcw },
    ],
  },
  { label: "Promotions", href: "/promotions", icon: Tag },
  {
    label: "Sales",
    href: "/sales-pro",
    icon: TrendingUp,
    children: [
      { label: "Sales Pro", href: "/sales-pro", icon: UserCheck },
      { label: "Sales Pipeline", href: "/pipeline", icon: GitBranch },
    ],
  },
  {
    label: "Lead Generation",
    href: "/leads",
    icon: Target,
    children: [
      { label: "AI Scraper", href: "/leads/scraper", icon: Search },
      { label: "Email Sequences", href: "/leads/sequences", icon: Mail },
      { label: "Unified Inbox", href: "/leads/inbox", icon: MessageSquare },
      { label: "Campaigns & Ads", href: "/leads/campaigns", icon: Megaphone },
      { label: "Marketing", href: "/marketing", icon: TrendingUp },
    ],
  },
  {
    label: "Financial Hub",
    href: "/finance",
    icon: DollarSign,
    minRole: "MANAGER",
    children: [
      { label: "Receivables", href: "/finance/receivables", icon: CreditCard },
      { label: "Payables", href: "/finance/payables", icon: Wallet },
      { label: "Cash Flow", href: "/finance/cashflow", icon: BarChart3 },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: PieChart, minRole: "MANAGER" },
  { label: "AI Command Center", href: "/ai", icon: Bot },
  { label: "Team & Performance", href: "/team", icon: UserCheck, minRole: "MANAGER" },
  { label: "Reports", href: "/reports", icon: FileText, minRole: "MANAGER" },
  { label: "Settings", href: "/settings", icon: Settings, minRole: "ADMIN" },
];

const ROLE_LEVEL: Record<UserRole, number> = { ADMIN: 3, MANAGER: 2, SALES_REP: 1 };

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();

  const filteredNav = useMemo(() => {
    const userLevel = ROLE_LEVEL[user?.role || "SALES_REP"];
    return navigation.filter((item) => {
      if (!item.minRole) return true;
      return userLevel >= ROLE_LEVEL[item.minRole];
    });
  }, [user?.role]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-text-primary">
              {process.env.NEXT_PUBLIC_APP_NAME || "WholesaleOS"}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const expanded = expandedItems.includes(item.label);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-light text-primary"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expanded && "rotate-90"
                            )}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && expanded && item.children && (
                      <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                                  childActive
                                    ? "bg-primary-light text-primary"
                                    : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
                                )}
                              >
                                <ChildIcon className="h-4 w-4 shrink-0" />
                                <span>{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
