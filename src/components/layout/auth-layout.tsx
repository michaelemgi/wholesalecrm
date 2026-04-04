"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useEffect } from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";
  const isPortalCustomerView = pathname === "/portal";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) {
      router.push("/login");
    }
    if (user && isLoginPage) {
      router.push("/dashboard");
    }
  }, [user, loading, isLoginPage, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading WholesaleOS...</p>
        </div>
      </div>
    );
  }

  // Login page — no sidebar/topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not logged in, redirecting
  if (!user) {
    return null;
  }

  // Portal customer view — standalone layout, no sidebar/topbar
  if (isPortalCustomerView) {
    return <>{children}</>;
  }

  // Authenticated layout
  return (
    <>
      <Sidebar />
      <div className="pl-[260px] transition-all duration-300">
        <Topbar />
        <main className="min-h-[calc(100vh-4rem)] p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </>
  );
}
