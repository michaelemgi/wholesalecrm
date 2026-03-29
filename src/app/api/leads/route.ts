import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

function transformLead(l: any) {
  return {
    ...l,
    tags: JSON.parse(l.tags),
    enrichedData: l.enrichedData ? JSON.parse(l.enrichedData) : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const assignedRep = searchParams.get("assignedRep");
    const search = searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedRep) where.assignedRep = assignedRep;
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads.map(transformLead));
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = await prisma.lead.create({
      data: {
        ...body,
        tags: JSON.stringify(body.tags ?? []),
        enrichedData: body.enrichedData ? JSON.stringify(body.enrichedData) : undefined,
      },
    });
    return NextResponse.json(transformLead(lead), { status: 201 });
  } catch (error) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
