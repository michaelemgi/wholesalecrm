import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBody, apiError } from "@/lib/validation";

const priceChangeSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  oldPrice: z.number().min(0, "Old price must be non-negative"),
  newPrice: z.number().min(0, "New price must be non-negative"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  status: z.string().optional().default("Pending"),
  notifiedAt: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");

    const where: any = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const notices = await prisma.priceChangeNotice.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notices);
  } catch (error) {
    console.error("Failed to fetch price change notices:", error);
    return NextResponse.json({ error: "Failed to fetch price change notices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(priceChangeSchema, body);
    if (!v.success) return v.response;
    const notice = await prisma.priceChangeNotice.create({
      data: body,
      include: { product: true },
    });
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error("Failed to create price change notice:", error);
    return apiError("Failed to create price change notice", 500);
  }
}
