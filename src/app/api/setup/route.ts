import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// One-time setup endpoint: creates the initial admin user
// Only works when no users exist in the database
export async function POST() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Users exist in the database." },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash("admin123", 12);

    const admin = await prisma.user.create({
      data: {
        email: "admin@wholesaleos.com",
        passwordHash,
        name: "Admin",
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Setup complete! Initial admin user created.",
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      note: "IMPORTANT: Change the default password immediately after first login via Settings > Change Password.",
    });
  } catch (error: any) {
    console.error("Setup failed:", error);
    return NextResponse.json({ error: "Setup failed: " + error.message }, { status: 500 });
  }
}
