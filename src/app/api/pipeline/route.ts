import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const assignedRep = searchParams.get("assignedRep");

    const where: any = {};
    if (stage) where.stage = stage;
    if (assignedRep) where.assignedRep = assignedRep;

    const deals = await prisma.pipelineDeal.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("Failed to fetch pipeline deals:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const deal = await prisma.pipelineDeal.create({
      data: body,
      include: { customer: true },
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Failed to create pipeline deal:", error);
    return NextResponse.json({ error: "Failed to create pipeline deal" }, { status: 500 });
  }
}
