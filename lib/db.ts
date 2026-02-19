import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma';

// Prisma v7 requires a database adapter — this is a singleton for Next.js development
const globalForPrisma = globalThis as unknown as {
    prismaPool: Pool | undefined;
    prisma: PrismaClient | undefined;
};

const pool = globalForPrisma.prismaPool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaPool = pool;
    globalForPrisma.prisma = prisma;
}
