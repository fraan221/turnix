import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  console.warn("ADVERTENCIA: Creando nueva instancia de PrismaClient.");
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

globalForPrisma.prisma = prisma;
