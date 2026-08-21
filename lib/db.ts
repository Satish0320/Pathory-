import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7+ is Rust-free and requires an explicit driver adapter — see the
// header comment in prisma/schema.prisma. This is a constructor-level change,
// not a schema one.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse a single client across hot reloads in dev — a fresh PrismaClient per
// reload exhausts Postgres connections quickly against a pooled dev database.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
