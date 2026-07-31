/**
 * ROZGAAR MITRA (rozgaarmitra.com) - HIGH PERFORMANCE DATABASE CLIENT
 * Singleton Prisma Client with Connection Pooling readiness for Supabase & PgBouncer.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
