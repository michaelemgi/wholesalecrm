import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { customers } = await request.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: "No customers provided" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const cust of customers) {
      try {
        if (!cust.name) {
          skipped++;
          errors.push(`Row skipped: missing company name`);
          continue;
        }

        // Try to find existing customer by name
        const existing = await prisma.customer.findFirst({
          where: { name: { equals: cust.name } },
        });

        if (existing) {
          // Update existing customer
          const updateData: any = {};
          if (cust.industry) updateData.industry = cust.industry;
          if (cust.accountTier) updateData.accountTier = cust.accountTier;
          if (cust.region) updateData.region = cust.region;
          if (cust.address) updateData.address = cust.address;
          if (cust.creditLimit) updateData.creditLimit = Number(cust.creditLimit);
          if (cust.assignedRep) updateData.assignedRep = cust.assignedRep;
          if (cust.tags) updateData.tags = JSON.stringify(cust.tags.split ? cust.tags.split(",").map((t: string) => t.trim()) : cust.tags);

          await prisma.customer.update({
            where: { id: existing.id },
            data: updateData,
          });

          // Add contact if provided and doesn't exist
          if (cust.contactName) {
            const existingContacts = await prisma.contact.findMany({
              where: { customerId: existing.id },
            });
            const contactExists = existingContacts.some(
              (c: any) => c.name.toLowerCase() === cust.contactName.toLowerCase()
            );
            if (!contactExists) {
              await prisma.contact.create({
                data: {
                  customerId: existing.id,
                  name: cust.contactName,
                  email: cust.contactEmail || "",
                  phone: cust.contactPhone || "",
                  role: cust.contactRole || "Contact",
                  isPrimary: existingContacts.length === 0,
                },
              });
            }
          }

          updated++;
        } else {
          // Create new customer
          const id = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const tags = cust.tags
            ? JSON.stringify(cust.tags.split ? cust.tags.split(",").map((t: string) => t.trim()) : cust.tags)
            : JSON.stringify(["imported"]);

          await prisma.customer.create({
            data: {
              id,
              name: cust.name,
              industry: cust.industry || "Other",
              accountTier: cust.accountTier || "SMB",
              region: cust.region || "Midwest",
              address: cust.address || "",
              totalRevenue: Number(cust.totalRevenue) || 0,
              creditLimit: Number(cust.creditLimit) || 50000,
              outstandingBalance: Number(cust.outstandingBalance) || 0,
              assignedRep: cust.assignedRep || "",
              paymentScore: Number(cust.paymentScore) || 100,
              orderFrequencyDays: Number(cust.orderFrequencyDays) || 0,
              accountSince: cust.accountSince || new Date().toISOString().split("T")[0],
              topProducts: JSON.stringify([]),
              tags,
              contacts: cust.contactName
                ? {
                    create: {
                      name: cust.contactName,
                      email: cust.contactEmail || "",
                      phone: cust.contactPhone || "",
                      role: cust.contactRole || "Primary Contact",
                      isPrimary: true,
                    },
                  }
                : undefined,
            },
          });

          created++;
        }
      } catch (err: any) {
        skipped++;
        errors.push(`Error with "${cust.name || "unknown"}": ${err.message}`);
      }
    }

    return NextResponse.json({ created, updated, skipped, errors });
  } catch (error: any) {
    console.error("Customer import failed:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
