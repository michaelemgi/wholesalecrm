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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: { steps: { orderBy: { createdAt: "asc" } } },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Email campaign not found" }, { status: 404 });
    }
    return NextResponse.json(transformCampaign(campaign));
  } catch (error) {
    console.error("Failed to fetch email campaign:", error);
    return NextResponse.json({ error: "Failed to fetch email campaign" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { steps, ...updateData } = body;

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: updateData,
      include: { steps: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json(transformCampaign(campaign));
  } catch (error) {
    console.error("Failed to update email campaign:", error);
    return NextResponse.json({ error: "Failed to update email campaign" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.emailSequenceStep.deleteMany({ where: { emailCampaignId: id } });
    await prisma.emailCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete email campaign:", error);
    return NextResponse.json({ error: "Failed to delete email campaign" }, { status: 500 });
  }
}
