import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { createToken, getTokenCookieOptions } from "@/lib/auth";
import { validateBody, apiError, loginSchema } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    // Rate limit login attempts: 10 per minute per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    if (!checkRateLimit(`login:${ip}`, 10, 60000)) {
      return rateLimitResponse();
    }

    const body = await req.json();
    const v = validateBody(loginSchema, body);
    if (!v.success) return v.response;
    const { email, password } = v.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "MANAGER" | "SALES_REP",
      avatar: user.avatar,
    };

    const token = await createToken(authUser);

    const response = NextResponse.json({ user: authUser }, { status: 200 });
    response.cookies.set(getTokenCookieOptions(token));

    return response;
  } catch {
    return apiError("Internal server error", 500);
  }
}
