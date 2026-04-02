import { NextRequest, NextResponse } from "next/server";

// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(req: NextRequest): PaginationParams {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  return NextResponse.json({
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
      hasMore: params.page * params.limit < total,
    },
  });
}

// ── Search helper ───────────────────────────────────────────────────────────

export function parseSearch(req: NextRequest): string | null {
  const url = new URL(req.url);
  return url.searchParams.get("search") || url.searchParams.get("q") || null;
}

// ── Sort helper ─────────────────────────────────────────────────────────────

export function parseSort(req: NextRequest, allowedFields: string[]): { field: string; dir: "asc" | "desc" } | null {
  const url = new URL(req.url);
  const sortBy = url.searchParams.get("sortBy");
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  if (sortBy && allowedFields.includes(sortBy)) {
    return { field: sortBy, dir: sortDir };
  }
  return null;
}

// ── Rate limiter (simple in-memory) ─────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 }
  );
}

// ── Request logging ─────────────────────────────────────────────────────────

export function logRequest(req: NextRequest, statusCode?: number) {
  const method = req.method;
  const url = new URL(req.url).pathname;
  const timestamp = new Date().toISOString();
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  if (process.env.NODE_ENV !== "production") {
    console.log(`[${timestamp}] ${method} ${url} ${statusCode || ""} (${ip})`);
  }
}
