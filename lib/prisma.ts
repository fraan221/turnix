import { PrismaClient } from "@prisma/client";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;

const url = new URL(connectionString);
url.searchParams.delete("sslmode");
url.searchParams.delete("ssl");

url.searchParams.set("statement_timeout", "30000");

const isLocal =
  url.hostname === "localhost" ||
  url.hostname === "127.0.0.1" ||
  url.hostname === "0.0.0.0";

const pool = new Pool({
  connectionString: url.toString(),
  ssl: isLocal ? false : { rejectUnauthorized: false },
  // Configuración defensiva para serverless (Vercel)
  // Ref: supabase-postgres-best-practices (conn-limits, conn-idle-timeout)
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

globalForPrisma.prisma = prisma;
