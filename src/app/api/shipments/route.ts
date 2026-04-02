import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, shipmentSchema } from "@/lib/validation";
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
      where.trackingNumber = { contains: search };
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [shipments, total] = await Promise.all([
        prisma.shipment.findMany({
          where,
          include: { order: true, customer: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.shipment.count({ where }),
      ]);
      return paginatedResponse(shipments, total, pagination);
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: { order: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error("Failed to fetch shipments:", error);
    return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(shipmentSchema, body);
    if (!v.success) return v.response;
    const shipment = await prisma.shipment.create({
      data: body,
      include: { order: true, customer: true },
    });
    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error("Failed to create shipment:", error);
    return apiError("Failed to create shipment", 500);
  }
}
