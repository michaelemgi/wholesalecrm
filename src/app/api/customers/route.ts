import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
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
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
