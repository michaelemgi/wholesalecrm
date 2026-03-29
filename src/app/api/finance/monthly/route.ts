import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const financials = await prisma.monthlyFinancial.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(financials);
  } catch (error) {
    console.error("Failed to fetch monthly financials:", error);
    return NextResponse.json({ error: "Failed to fetch monthly financials" }, { status: 500 });
  }
}
