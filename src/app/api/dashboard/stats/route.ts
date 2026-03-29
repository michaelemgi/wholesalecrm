import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      totalCustomers,
      totalOrders,
      totalProducts,
      revenueAgg,
      recentOrders,
      pipelineAgg,
      totalLeads,
      unreadNotifications,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.customer.aggregate({ _sum: { totalRevenue: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true },
      }),
      prisma.pipelineDeal.aggregate({ _sum: { value: true } }),
      prisma.lead.count(),
      prisma.notification.count({ where: { read: false } }),
    ]);

    return NextResponse.json({
      totalCustomers,
      totalOrders,
      totalProducts,
      totalRevenue: revenueAgg._sum.totalRevenue ?? 0,
      pipelineValue: pipelineAgg._sum.value ?? 0,
      totalLeads,
      unreadNotifications,
      recentOrders,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
