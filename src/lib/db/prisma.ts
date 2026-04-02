import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function resolveDbPath() {
  // Try multiple locations for the SQLite DB file
  const candidates = [
    path.resolve(process.cwd(), "prisma", "dev.db"),
    path.resolve(process.cwd(), "..", "prisma", "dev.db"),  // standalone mode: .next/standalone/../prisma/dev.db
    path.resolve("/tmp", "dev.db"),  // Render writable path
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // Default: use /tmp on production (Render), cwd/prisma locally
  if (process.env.NODE_ENV === "production") {
    return path.resolve("/tmp", "dev.db");
  }
  return candidates[0];
}

function createPrismaClient() {
  const dbPath = resolveDbPath();
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
