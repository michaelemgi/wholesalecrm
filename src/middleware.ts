import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "wholesaleos-secret-key-change-in-production"
);

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/setup"];

const ROLE_ROUTE_ACCESS: Record<string, string[]> = {
  "/settings": ["ADMIN"],
  "/finance": ["ADMIN", "MANAGER"],
  "/reports": ["ADMIN", "MANAGER"],
  "/team": ["ADMIN", "MANAGER"],
};

const API_ROLE_ACCESS: Record<string, string[]> = {
  "/api/users": ["ADMIN"],
  "/api/settings": ["ADMIN", "MANAGER"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, static assets, and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // For API routes: add CORS headers + verify auth
  if (pathname.startsWith("/api/")) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    // Verify auth token for all non-public API routes
    const token = req.cookies.get("wholesaleos-token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      // Check role-based API access (skip change-password — any authenticated user can use it)
      for (const [route, allowedRoles] of Object.entries(API_ROLE_ACCESS)) {
        if (pathname === "/api/users/change-password") break;
        if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403, headers: corsHeaders }
          );
        }
      }

      const response = NextResponse.next();
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: corsHeaders }
      );
    }
  }

  const token = req.cookies.get("wholesaleos-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Check role-based route access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTE_ACCESS)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid token — clear it and redirect to login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("wholesaleos-token", "", { maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
