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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: true,
        orders: { include: { items: true }, orderBy: { createdAt: "desc" }, take: 10 },
        invoices: { orderBy: { createdAt: "desc" }, take: 10 },
        communications: { orderBy: { createdAt: "desc" }, take: 20 },
        pipelineDeals: true,
        standingOrders: { include: { items: true } },
        customerProductPrices: { include: { product: true } },
        billingAgreements: true,
        paymentCards: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(transformCustomer(customer));
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contacts, ...updateData } = body;

    if (updateData.topProducts) {
      updateData.topProducts = JSON.stringify(updateData.topProducts);
    }
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: { contacts: true },
    });

    return NextResponse.json(transformCustomer(customer));
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
