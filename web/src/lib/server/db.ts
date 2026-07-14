import { PrismaClient } from "@prisma/client";

// Accept the same connection-string env aliases as the FastAPI settings, and
// normalize SQLAlchemy-style postgresql+psycopg:// URLs copied from api/.env.
const candidate =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING;
if (candidate) {
  process.env.DATABASE_URL = candidate.replace(/^postgres(ql)?\+psycopg:\/\//, "postgresql://");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
