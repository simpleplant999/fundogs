import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function mongodbUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Add your MongoDB Atlas connection string in Vercel → Environment Variables.",
    );
  }
  const timeoutParams = "serverSelectionTimeoutMS=5000&connectTimeoutMS=5000";
  if (/serverSelectionTimeoutMS=/i.test(raw)) return raw;
  return raw.includes("?") ? `${raw}&${timeoutParams}` : `${raw}?${timeoutParams}`;
}

if (process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = mongodbUrl();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
