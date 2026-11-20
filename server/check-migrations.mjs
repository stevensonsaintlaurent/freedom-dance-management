import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

try {
  const migrations = await prisma.$queryRaw`
    SELECT migration_name, started_at, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `;

  console.table(migrations);
} catch (error) {
  console.error("Error checking migrations:", error);
} finally {
  await prisma.$disconnect();
}
