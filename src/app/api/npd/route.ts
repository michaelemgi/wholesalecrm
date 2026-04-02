import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBody, apiError } from "@/lib/validation";

const npdProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  targetMarket: z.string().nullable().optional(),
  stage: z.string().optional().default("Concept"),
  progress: z.number().int().min(0).max(100).optional().default(0),
  estimatedCost: z.number().min(0).optional().default(0),
  estimatedRevenue: z.number().min(0).optional().default(0),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    const where: any = {};
    if (stage) where.stage = stage;

    const products = await prisma.npdProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch NPD products:", error);
    return NextResponse.json({ error: "Failed to fetch NPD products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(npdProductSchema, body);
    if (!v.success) return v.response;
    const product = await prisma.npdProduct.create({
      data: body,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create NPD product:", error);
    return apiError("Failed to create NPD product", 500);
  }
}
