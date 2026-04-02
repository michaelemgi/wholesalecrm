import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, productSchema } from "@/lib/validation";
import { parsePagination, paginatedResponse, parseSearch, logRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    logRequest(request);
    const url = new URL(request.url);
    const hasPagination = url.searchParams.has("page");
    const search = parseSearch(request);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.product.count({ where }),
      ]);
      return paginatedResponse(products, total, pagination);
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(productSchema, body);
    if (!v.success) return v.response;
    const product = await prisma.product.create({ data: v.data });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return apiError("Failed to create product", 500);
  }
}
