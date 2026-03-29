import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import "./globals.css";

export const metadata: Metadata = {
  title: "WholesaleOS — Enterprise CRM & AI Lead Generation",
  description: "Enterprise-grade wholesale CRM with AI-powered lead generation, sales pipeline, inventory management, and financial hub.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <Sidebar />
        <div className="pl-[260px] transition-all duration-300">
          <Topbar />
          <main className="min-h-[calc(100vh-4rem)] p-6">
            {children}
          </main>
        </div>
        <CommandPalette />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
