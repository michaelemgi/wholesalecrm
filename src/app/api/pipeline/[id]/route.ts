import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await prisma.pipelineDeal.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!deal) {
      return NextResponse.json({ error: "Pipeline deal not found" }, { status: 404 });
    }
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Failed to fetch pipeline deal:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline deal" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const deal = await prisma.pipelineDeal.update({
      where: { id },
      data: body,
      include: { customer: true },
    });
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Failed to update pipeline deal:", error);
    return NextResponse.json({ error: "Failed to update pipeline deal" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.pipelineDeal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete pipeline deal:", error);
    return NextResponse.json({ error: "Failed to delete pipeline deal" }, { status: 500 });
  }
}
