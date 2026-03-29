import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformCampaign(c: any) {
  return {
    ...c,
    steps: c.steps?.map((s: any) => ({
      ...s,
      variants: s.variants ? JSON.parse(s.variants) : undefined,
    })) ?? [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const campaigns = await prisma.emailCampaign.findMany({
      where,
      include: { steps: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns.map(transformCampaign));
  } catch (error) {
    console.error("Failed to fetch email campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch email campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { steps, ...campaignData } = body;

    const campaign = await prisma.emailCampaign.create({
      data: {
        ...campaignData,
        steps: steps
          ? {
              create: steps.map((s: any) => ({
                ...s,
                variants: s.variants ? JSON.stringify(s.variants) : undefined,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(transformCampaign(campaign), { status: 201 });
  } catch (error) {
    console.error("Failed to create email campaign:", error);
    return NextResponse.json({ error: "Failed to create email campaign" }, { status: 500 });
  }
}
