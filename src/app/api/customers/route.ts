import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateBody, apiError, customerSchema } from "@/lib/validation";
import { parsePagination, paginatedResponse, parseSearch, logRequest } from "@/lib/api-utils";

function transformCustomer(c: any) {
  const contacts = c.contacts?.map((ct: any) => ({
    id: ct.id,
    name: ct.name,
    email: ct.email,
    phone: ct.phone,
    role: ct.role,
    isPrimary: ct.isPrimary,
  })) ?? [];
  return {
    ...c,
    topProducts: JSON.parse(c.topProducts),
    tags: JSON.parse(c.tags),
    contacts,
    primaryContact: contacts.find((ct: any) => ct.isPrimary) || contacts[0] || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    logRequest(request);
    const url = new URL(request.url);
    const hasPagination = url.searchParams.has("page");
    const search = parseSearch(request);

    const where: any = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (hasPagination) {
      const pagination = parsePagination(request);
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          include: { contacts: true },
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.customer.count({ where }),
      ]);
      return paginatedResponse(customers.map(transformCustomer), total, pagination);
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { contacts: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers.map(transformCustomer));
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const v = validateBody(customerSchema, body);
    if (!v.success) return v.response;
    const { contacts, ...customerData } = body;

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        topProducts: JSON.stringify(customerData.topProducts ?? []),
        tags: JSON.stringify(customerData.tags ?? []),
        contacts: contacts
          ? { create: contacts }
          : undefined,
      },
      include: { contacts: true },
    });

    return NextResponse.json(transformCustomer(customer), { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return apiError("Failed to create customer", 500);
  }
}
