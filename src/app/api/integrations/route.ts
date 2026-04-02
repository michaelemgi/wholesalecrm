import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/validation";

// All 18 integrations the platform supports
const SUPPORTED_INTEGRATIONS = [
  { name: "meta_ads", displayName: "Meta Ads", icon: "📱", description: "Facebook & Instagram advertising", category: "advertising", fields: ["appId", "appSecret", "accessToken"] },
  { name: "instantly", displayName: "Instantly", icon: "📧", description: "Cold email automation", category: "email", fields: ["apiKey", "workspaceId"] },
  { name: "google_ads", displayName: "Google Ads", icon: "🔍", description: "Search & display advertising", category: "advertising", fields: ["clientId", "clientSecret", "developerToken", "customerId"] },
  { name: "quickbooks", displayName: "QuickBooks", icon: "📊", description: "Accounting & bookkeeping", category: "accounting", fields: ["clientId", "clientSecret", "realmId"] },
  { name: "xero", displayName: "Xero", icon: "💰", description: "Cloud accounting", category: "accounting", fields: ["clientId", "clientSecret", "tenantId"] },
  { name: "shopify", displayName: "Shopify", icon: "🛒", description: "E-commerce platform", category: "ecommerce", fields: ["shopDomain", "apiKey", "apiSecret", "accessToken"] },
  { name: "woocommerce", displayName: "WooCommerce", icon: "🏪", description: "WordPress e-commerce", category: "ecommerce", fields: ["siteUrl", "consumerKey", "consumerSecret"] },
  { name: "mailgun", displayName: "Mailgun", icon: "✉️", description: "Email delivery service", category: "email", fields: ["apiKey", "domain"] },
  { name: "sendgrid", displayName: "SendGrid", icon: "📬", description: "Email API", category: "email", fields: ["apiKey"] },
  { name: "twilio", displayName: "Twilio", icon: "💬", description: "SMS & voice", category: "communication", fields: ["accountSid", "authToken", "phoneNumber"] },
  { name: "slack", displayName: "Slack", icon: "💡", description: "Team communication", category: "communication", fields: ["botToken", "webhookUrl", "channel"] },
  { name: "zapier", displayName: "Zapier", icon: "⚡", description: "Workflow automation", category: "automation", fields: ["webhookUrl"] },
  { name: "stripe", displayName: "Stripe", icon: "💳", description: "Payment processing", category: "payments", fields: ["publishableKey", "secretKey", "webhookSecret"] },
  { name: "paypal", displayName: "PayPal", icon: "🅿️", description: "Online payments", category: "payments", fields: ["clientId", "clientSecret", "environment"] },
  { name: "shipstation", displayName: "ShipStation", icon: "📦", description: "Shipping management", category: "fulfillment", fields: ["apiKey", "apiSecret"] },
  { name: "google_sheets", displayName: "Google Sheets", icon: "📗", description: "Spreadsheet sync", category: "productivity", fields: ["serviceAccountKey", "spreadsheetId"] },
  { name: "whatsapp", displayName: "WhatsApp Business", icon: "📱", description: "Business messaging", category: "communication", fields: ["phoneNumberId", "accessToken", "businessId"] },
  { name: "sage", displayName: "Sage", icon: "📗", description: "Accounting, ERP & business management via webhook", category: "accounting", fields: ["apiKey", "webhookUrl", "companyId"] },
];

// GET — list all integrations with their connection status
export async function GET() {
  try {
    const connected = await prisma.integration.findMany();
    const connectedMap = new Map(connected.map(c => [c.name, c]));

    const result = SUPPORTED_INTEGRATIONS.map(int => {
      const db = connectedMap.get(int.name);
      return {
        ...int,
        status: db?.status || "disconnected",
        connectedAt: db?.connectedAt || null,
        connectedBy: db?.connectedBy || null,
        lastSyncAt: db?.lastSyncAt || null,
        errorMessage: db?.errorMessage || null,
        config: db?.config ? (() => { const c = JSON.parse(db.config); return { _masked: c._masked || {} }; })() : {},
        id: db?.id || null,
      };
    });

    return NextResponse.json(result);
  } catch {
    return apiError("Failed to load integrations", 500);
  }
}

// POST — connect an integration (store API keys/config)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, credentials } = body;

    if (!name || !credentials || typeof credentials !== "object") {
      return apiError("name and credentials object are required", 400);
    }

    const supported = SUPPORTED_INTEGRATIONS.find(i => i.name === name);
    if (!supported) {
      return apiError(`Unknown integration: ${name}`, 400);
    }

    // Validate required fields
    const missing = supported.fields.filter(f => !credentials[f]?.toString().trim());
    if (missing.length > 0) {
      return apiError(`Missing required fields: ${missing.join(", ")}`, 400);
    }

    // Mask sensitive values for storage (keep last 4 chars visible)
    const maskedCreds: Record<string, string> = {};
    for (const [key, val] of Object.entries(credentials)) {
      const v = String(val);
      maskedCreds[key] = v.length > 8 ? "•".repeat(v.length - 4) + v.slice(-4) : v;
    }

    const integration = await prisma.integration.upsert({
      where: { name },
      update: {
        status: "connected",
        apiKey: maskedCreds[supported.fields[0]] || null,
        config: JSON.stringify({ ...credentials, _masked: maskedCreds }),
        connectedAt: new Date(),
        connectedBy: body.connectedBy || "admin",
        lastSyncAt: new Date(),
        errorMessage: null,
      },
      create: {
        name,
        displayName: supported.displayName,
        status: "connected",
        apiKey: maskedCreds[supported.fields[0]] || null,
        config: JSON.stringify({ ...credentials, _masked: maskedCreds }),
        connectedAt: new Date(),
        connectedBy: body.connectedBy || "admin",
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `${supported.displayName} connected successfully`,
      integration: {
        name: integration.name,
        displayName: integration.displayName,
        status: integration.status,
        connectedAt: integration.connectedAt,
      },
    });
  } catch (error: any) {
    console.error("Integration connect failed:", error);
    return apiError("Failed to connect integration: " + error.message, 500);
  }
}

// PUT — update integration config
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, credentials } = body;

    if (!name) return apiError("name is required", 400);

    const existing = await prisma.integration.findUnique({ where: { name } });
    if (!existing) return apiError("Integration not found", 404);

    const supported = SUPPORTED_INTEGRATIONS.find(i => i.name === name);
    if (!supported) return apiError(`Unknown integration: ${name}`, 400);

    // Merge with existing config
    const existingConfig = JSON.parse(existing.config || "{}");
    const merged = { ...existingConfig, ...credentials };

    // Re-mask
    const maskedCreds: Record<string, string> = {};
    for (const field of supported.fields) {
      const v = String(merged[field] || "");
      maskedCreds[field] = v.length > 8 ? "•".repeat(v.length - 4) + v.slice(-4) : v;
    }
    merged._masked = maskedCreds;

    const updated = await prisma.integration.update({
      where: { name },
      data: {
        config: JSON.stringify(merged),
        apiKey: maskedCreds[supported.fields[0]] || existing.apiKey,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `${supported.displayName} updated`,
      integration: {
        name: updated.name,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    return apiError("Failed to update integration: " + error.message, 500);
  }
}

// DELETE — disconnect an integration
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) return apiError("name query param is required", 400);

    const existing = await prisma.integration.findUnique({ where: { name } });
    if (!existing) return apiError("Integration not found", 404);

    await prisma.integration.update({
      where: { name },
      data: {
        status: "disconnected",
        apiKey: null,
        config: "{}",
        connectedAt: null,
        connectedBy: null,
        lastSyncAt: null,
        errorMessage: null,
      },
    });

    return NextResponse.json({ message: `${existing.displayName} disconnected` });
  } catch (error: any) {
    return apiError("Failed to disconnect integration: " + error.message, 500);
  }
}
