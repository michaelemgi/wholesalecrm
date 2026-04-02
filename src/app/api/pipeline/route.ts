import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, pipelineDealSchema } from "@/lib/validation";
import { parsePagination, paginatedResponse, parseSearch, logRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    logRequest(request);
    const url = new URL(request.url);
    const hasPagination = url.searchParams.has("page");
    const search = parseSearch(request);
    const stage = url.searchParams.get("stage");
    const assignedRep = url.searchParams.get("assignedRep");

    const where: any = {};
    if (stage) where.stage = stage;
    if (assignedRep) where.assignedRep = assignedRep;
    if (search) {
      where.title = { contains: search };
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [deals, total] = await Promise.all([
        prisma.pipelineDeal.findMany({
          where,
          include: { customer: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.pipelineDeal.count({ where }),
      ]);
      return paginatedResponse(deals, total, pagination);
    }

    const deals = await prisma.pipelineDeal.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("Failed to fetch pipeline deals:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(pipelineDealSchema, body);
    if (!v.success) return v.response;
    const deal = await prisma.pipelineDeal.create({
      data: body,
      include: { customer: true },
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Failed to create pipeline deal:", error);
    return apiError("Failed to create pipeline deal", 500);
  }
}
