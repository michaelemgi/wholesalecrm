import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validateBody, apiError, settingSchema } from "@/lib/validation";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const v = validateBody(settingSchema, body);
    if (!v.success) return v.response;
    const { key, value } = v.data;

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });

    return NextResponse.json(setting);
  } catch {
    return apiError("Failed to save setting", 500);
  }
}
