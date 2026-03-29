import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      items: [] as any[],
    };

    for (const row of products) {
      try {
        // Try to find existing product by SKU first, then by name
        let existing = null;
        if (row.sku) {
          existing = await prisma.product.findFirst({ where: { sku: row.sku } });
        }
        if (!existing && row.name) {
          existing = await prisma.product.findFirst({ where: { name: row.name } });
        }

        if (existing) {
          // Update existing product — only update fields that were provided
          const updateData: any = {};
          if (row.name && row.name !== existing.name) updateData.name = row.name;
          if (row.category) updateData.category = row.category;
          if (row.unitPrice !== undefined && row.unitPrice !== null) updateData.unitPrice = Number(row.unitPrice);
          if (row.wholesalePrice !== undefined && row.wholesalePrice !== null) updateData.wholesalePrice = Number(row.wholesalePrice);
          if (row.tier1Price !== undefined && row.tier1Price !== null) updateData.tier1Price = Number(row.tier1Price);
          if (row.tier2Price !== undefined && row.tier2Price !== null) updateData.tier2Price = Number(row.tier2Price);
          if (row.tier3Price !== undefined && row.tier3Price !== null) updateData.tier3Price = Number(row.tier3Price);
          if (row.vipPrice !== undefined && row.vipPrice !== null) updateData.vipPrice = Number(row.vipPrice);
          if (row.stockLevel !== undefined && row.stockLevel !== null) updateData.stockLevel = Number(row.stockLevel);
          if (row.reorderPoint !== undefined && row.reorderPoint !== null) updateData.reorderPoint = Number(row.reorderPoint);
          if (row.supplier) updateData.supplier = row.supplier;
          if (row.warehouse) updateData.warehouse = row.warehouse;
          if (row.warehouseLocation) updateData.warehouseLocation = row.warehouseLocation;
          if (row.unit) updateData.unit = row.unit;
          if (row.weight !== undefined && row.weight !== null) updateData.weight = Number(row.weight);
          if (row.leadTimeDays !== undefined && row.leadTimeDays !== null) updateData.leadTimeDays = Number(row.leadTimeDays);
          if (row.status) updateData.status = row.status;

          if (Object.keys(updateData).length > 0) {
            const updated = await prisma.product.update({
              where: { id: existing.id },
              data: updateData,
            });
            results.updated++;
            results.items.push({ action: "updated", product: updated });
          } else {
            results.skipped++;
            results.items.push({ action: "skipped", product: existing, reason: "No changes detected" });
          }
        } else {
          // Create new product
          if (!row.name || !row.sku) {
            results.errors.push(`Row missing required fields (name, sku): ${JSON.stringify(row).substring(0, 100)}`);
            results.skipped++;
            continue;
          }

          const newProduct = await prisma.product.create({
            data: {
              id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              sku: row.sku,
              name: row.name,
              category: row.category || "Uncategorized",
              unitPrice: Number(row.unitPrice) || 0,
              wholesalePrice: Number(row.wholesalePrice) || 0,
              tier1Price: Number(row.tier1Price) || 0,
              tier2Price: Number(row.tier2Price) || 0,
              tier3Price: Number(row.tier3Price) || 0,
              vipPrice: Number(row.vipPrice) || 0,
              stockLevel: Number(row.stockLevel) || 0,
              reorderPoint: Number(row.reorderPoint) || 50,
              warehouseLocation: row.warehouseLocation || "A-01-01",
              warehouse: row.warehouse || "Warehouse A - West",
              unit: row.unit || "each",
              weight: Number(row.weight) || 1,
              supplier: row.supplier || "Unknown",
              leadTimeDays: Number(row.leadTimeDays) || 7,
              status: row.status || "Active",
            },
          });
          results.created++;
          results.items.push({ action: "created", product: newProduct });
        }
      } catch (err: any) {
        results.errors.push(`Error processing "${row.name || row.sku}": ${err.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to import products:", error);
    return NextResponse.json({ error: "Failed to import products" }, { status: 500 });
  }
}
