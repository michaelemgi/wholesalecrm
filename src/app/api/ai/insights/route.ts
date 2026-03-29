import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const impact = searchParams.get("impact");

    const where: any = {};
    if (type) where.type = type;
    if (impact) where.impact = impact;

    const insights = await prisma.aIInsight.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(insights);
  } catch (error) {
    console.error("Failed to fetch AI insights:", error);
    return NextResponse.json({ error: "Failed to fetch AI insights" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const insight = await prisma.aIInsight.create({ data: body });
    return NextResponse.json(insight, { status: 201 });
  } catch (error) {
    console.error("Failed to create AI insight:", error);
    return NextResponse.json({ error: "Failed to create AI insight" }, { status: 500 });
  }
}
