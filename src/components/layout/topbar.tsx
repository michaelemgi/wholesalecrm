"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Command,
} from "lucide-react";
import { mockNotifications } from "@/lib/mock-data/notifications";

export function Topbar() {
  const [darkMode, setDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("light");
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-xl px-6">
      {/* Search */}
      <button
        onClick={() => {
          const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
          document.dispatchEvent(event);
        }}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-muted hover:border-border-light hover:text-text-secondary transition-colors w-80"
      >
        <Search className="h-4 w-4" />
        <span>Search anything...</span>
        <kbd className="ml-auto flex items-center gap-0.5 rounded bg-surface-hover px-1.5 py-0.5 text-xs text-text-muted">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 rounded-xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="font-heading text-sm font-semibold">Notifications</h3>
                <span className="text-xs text-text-muted">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.slice(0, 8).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border/50 last:border-0",
                      !n.read && "bg-primary-light/30"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                        !n.read ? "bg-primary" : "bg-transparent"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{n.title}</p>
                      <p className="text-xs text-text-muted mt-0.5 truncate">{n.description}</p>
                      <p className="text-xs text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <button className="text-xs text-primary hover:text-primary-hover font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative ml-2">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              AG
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary">Adam Groogan</p>
              <p className="text-xs text-text-muted">Admin</p>
            </div>
            <ChevronDown className="h-3 w-3 text-text-muted" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-surface shadow-2xl">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">Adam Groogan</p>
                <p className="text-xs text-text-muted">adam@wholesale-co.com</p>
                <p className="mt-1 text-xs text-primary">Enterprise Plan</p>
              </div>
              <div className="py-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-surface-hover">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
