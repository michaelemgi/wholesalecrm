import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const member = await prisma.teamMember.create({ data: body });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to create team member:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
