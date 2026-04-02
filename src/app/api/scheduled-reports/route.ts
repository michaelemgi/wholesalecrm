import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBody, apiError } from "@/lib/validation";

const scheduledReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  reportName: z.string().min(1, "Report name is required"),
  frequency: z.string().min(1, "Frequency is required"),
  dayOfWeek: z.string().nullable().optional(),
  dayOfMonth: z.number().int().nullable().optional(),
  timeOfDay: z.string().optional().default("08:00"),
  recipients: z.string().optional().default("[]"),
  format: z.string().optional().default("PDF"),
  dateRange: z.string().optional().default("Last 30 Days"),
  status: z.string().optional().default("Active"),
  lastSentAt: z.string().nullable().optional(),
  nextRunAt: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const reports = await prisma.scheduledReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch scheduled reports:", error);
    return NextResponse.json({ error: "Failed to fetch scheduled reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(scheduledReportSchema, body);
    if (!v.success) return v.response;
    const report = await prisma.scheduledReport.create({
      data: body,
    });
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to create scheduled report:", error);
    return apiError("Failed to create scheduled report", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    const body = await request.json();
    const v = validateBody(scheduledReportSchema.partial(), body);
    if (!v.success) return v.response;
    const report = await prisma.scheduledReport.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to update scheduled report:", error);
    return apiError("Failed to update scheduled report", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    await prisma.scheduledReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scheduled report:", error);
    return NextResponse.json({ error: "Failed to delete scheduled report" }, { status: 500 });
  }
}
