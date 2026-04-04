import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:./") || raw.startsWith("file:dev.db")) {
    const rel = raw.replace("file:", "");
    return `file:${path.resolve(process.cwd(), "prisma", rel)}`;
  }
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    return `file:${path.resolve(process.cwd(), "prisma", raw.replace("file:", ""))}`;
  }
  return raw;
}

function createPrismaClient() {
  const dbUrl = resolveDbUrl();
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
