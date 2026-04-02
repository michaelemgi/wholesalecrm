// Branding config — reads from env vars, falls back to defaults
// Set APP_NAME and APP_TAGLINE in .env to customize

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "WholesaleOS";
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "Enterprise Wholesale Management";
