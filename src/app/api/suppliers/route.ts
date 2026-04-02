import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, supplierSchema } from "@/lib/validation";
import { parsePagination, paginatedResponse, parseSearch, logRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    logRequest(request);
    const url = new URL(request.url);
    const hasPagination = url.searchParams.has("page");
    const search = parseSearch(request);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.supplier.count({ where }),
      ]);
      return paginatedResponse(suppliers, total, pagination);
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(supplierSchema, body);
    if (!v.success) return v.response;
    const supplier = await prisma.supplier.create({ data: body });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return apiError("Failed to create supplier", 500);
  }
}
