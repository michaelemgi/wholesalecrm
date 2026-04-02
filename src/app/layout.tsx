import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { AuthLayout } from "@/components/layout/auth-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "WholesaleOS — Enterprise CRM & AI Lead Generation",
  description: "Enterprise-grade wholesale CRM with AI-powered lead generation, sales pipeline, inventory management, and financial hub.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <AuthLayout>{children}</AuthLayout>
        </AuthProvider>
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
