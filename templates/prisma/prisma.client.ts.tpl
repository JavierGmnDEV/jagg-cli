import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '{{generatedImport}}';
import { databaseUrl } from '{{databaseConfigImport}}';

// En globalThis para que el hot reload de desarrollo no abra una conexión nueva en cada recarga
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export class PrismaDatabase {
  private constructor() {}

  static getInstance(): PrismaClient {
    globalForPrisma.prisma ??= new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
    return globalForPrisma.prisma;
  }

  static async disconnect(): Promise<void> {
    await globalForPrisma.prisma?.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}
