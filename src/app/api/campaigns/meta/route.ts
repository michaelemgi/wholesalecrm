import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformMetaCampaign(c: any) {
  return {
    ...c,
    audiences: JSON.parse(c.audiences),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const campaigns = await prisma.metaCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns.map(transformMetaCampaign));
  } catch (error) {
    console.error("Failed to fetch meta campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch meta campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const campaign = await prisma.metaCampaign.create({
      data: {
        ...body,
        audiences: JSON.stringify(body.audiences ?? []),
      },
    });
    return NextResponse.json(transformMetaCampaign(campaign), { status: 201 });
  } catch (error) {
    console.error("Failed to create meta campaign:", error);
    return NextResponse.json({ error: "Failed to create meta campaign" }, { status: 500 });
  }
}
