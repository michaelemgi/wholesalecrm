import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, returnSchema } from "@/lib/validation";
import { parsePagination, paginatedResponse, parseSearch, logRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    logRequest(request);
    const url = new URL(request.url);
    const hasPagination = url.searchParams.has("page");
    const search = parseSearch(request);
    const status = url.searchParams.get("status");
    const customerId = url.searchParams.get("customerId");
    const orderId = url.searchParams.get("orderId");

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (orderId) where.orderId = orderId;
    if (search) {
      where.reason = { contains: search };
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [returns, total] = await Promise.all([
        prisma.return.findMany({
          where,
          include: { order: true, customer: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.return.count({ where }),
      ]);
      return paginatedResponse(returns, total, pagination);
    }

    const returns = await prisma.return.findMany({
      where,
      include: { order: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(returns);
  } catch (error) {
    console.error("Failed to fetch returns:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(returnSchema, body);
    if (!v.success) return v.response;
    const returnRecord = await prisma.return.create({
      data: body,
      include: { order: true, customer: true },
    });
    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error("Failed to create return:", error);
    return apiError("Failed to create return", 500);
  }
}
