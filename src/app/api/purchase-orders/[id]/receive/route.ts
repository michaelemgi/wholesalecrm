import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, notes } = body as {
      items: { productId: string; receivedQty: number }[];
      notes?: string;
    };

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // Update PO status and received date
    await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "Received",
        receivedDate: new Date().toISOString().split("T")[0],
        notes: notes ?? po.notes,
      },
    });

    // Update each PO item's received qty and product stock level
    for (const item of items) {
      // Find the matching PO item
      const poItem = po.items.find((i) => i.productId === item.productId);
      if (poItem) {
        await prisma.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { quantity: item.receivedQty },
        });
      }

      // Update product stock level
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockLevel: { increment: item.receivedQty },
        },
      });
    }

    // Return updated PO
    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json(updatedPO);
  } catch (error) {
    console.error("Failed to receive purchase order:", error);
    return NextResponse.json({ error: "Failed to receive purchase order" }, { status: 500 });
  }
}
