import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierName = searchParams.get("supplierName");

    const where: any = {};
    if (status) where.status = status;
    if (supplierName) where.supplierName = supplierName;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...poData } = body;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        ...poData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
