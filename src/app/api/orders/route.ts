import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, orderSchema } from "@/lib/validation";
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
      where.orderNumber = { contains: search };
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.order.count({ where }),
      ]);
      return paginatedResponse(orders, total, pagination);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(orderSchema, body);
    if (!v.success) return v.response;
    const { items, ...orderData } = v.data;

    const order = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return apiError("Failed to create order", 500);
  }
}
