import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformMetaCampaign(c: any) {
  return {
    ...c,
    audiences: JSON.parse(c.audiences),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.metaCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Meta campaign not found" }, { status: 404 });
    }
    return NextResponse.json(transformMetaCampaign(campaign));
  } catch (error) {
    console.error("Failed to fetch meta campaign:", error);
    return NextResponse.json({ error: "Failed to fetch meta campaign" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.audiences) {
      body.audiences = JSON.stringify(body.audiences);
    }

    const campaign = await prisma.metaCampaign.update({ where: { id }, data: body });
    return NextResponse.json(transformMetaCampaign(campaign));
  } catch (error) {
    console.error("Failed to update meta campaign:", error);
    return NextResponse.json({ error: "Failed to update meta campaign" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.metaCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meta campaign:", error);
    return NextResponse.json({ error: "Failed to delete meta campaign" }, { status: 500 });
  }
}
