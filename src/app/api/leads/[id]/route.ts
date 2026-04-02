import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, leadSchema } from "@/lib/validation";

function transformLead(l: any) {
  return {
    ...l,
    tags: JSON.parse(l.tags),
    enrichedData: l.enrichedData ? JSON.parse(l.enrichedData) : undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(transformLead(lead));
  } catch (error) {
    console.error("Failed to fetch lead:", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const v = validateBody(leadSchema.partial(), body);
    if (!v.success) return v.response;

    if (body.tags) body.tags = JSON.stringify(body.tags);
    if (body.enrichedData) body.enrichedData = JSON.stringify(body.enrichedData);

    const lead = await prisma.lead.update({ where: { id }, data: body });
    return NextResponse.json(transformLead(lead));
  } catch (error) {
    console.error("Failed to update lead:", error);
    return apiError("Failed to update lead", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
