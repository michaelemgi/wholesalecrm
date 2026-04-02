import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, invoiceSchema } from "@/lib/validation";
import { parsePagination, paginatedResponse, parseSearch, logRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    logRequest(request);
    const url = new URL(request.url);
    const hasPagination = url.searchParams.has("page");
    const search = parseSearch(request);
    const status = url.searchParams.get("status");
    const customerId = url.searchParams.get("customerId");

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.invoiceNumber = { contains: search };
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.invoice.count({ where }),
      ]);
      return paginatedResponse(invoices, total, pagination);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(invoiceSchema, body);
    if (!v.success) return v.response;
    const invoice = await prisma.invoice.create({ data: body });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return apiError("Failed to create invoice", 500);
  }
}
