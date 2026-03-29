import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prices = await prisma.customerProductPrice.findMany({
      where: { customerId: id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Failed to fetch customer pricing:", error);
    return NextResponse.json({ error: "Failed to fetch customer pricing" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { prices } = body as { prices: { productId: string; customPrice: number; notes?: string }[] };

    const results = await Promise.all(
      prices.map((p) =>
        prisma.customerProductPrice.upsert({
          where: {
            customerId_productId: { customerId: id, productId: p.productId },
          },
          create: {
            customerId: id,
            productId: p.productId,
            customPrice: p.customPrice,
            notes: p.notes,
          },
          update: {
            customPrice: p.customPrice,
            notes: p.notes,
          },
          include: { product: true },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to upsert customer pricing:", error);
    return NextResponse.json({ error: "Failed to upsert customer pricing" }, { status: 500 });
  }
}
