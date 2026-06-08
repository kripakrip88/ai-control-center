/**
 * Prisma client factory functions
 */

import { PrismaClient } from '@prisma/client'

let prismaInstance: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    })
  }
  return prismaInstance
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
}

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}
