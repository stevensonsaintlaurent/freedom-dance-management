import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}
const databaseUrl = new URL(connectionString);

console.log("DATABASE CONNECTION:", {
  host: databaseUrl.hostname,
  database: databaseUrl.pathname.slice(1),
  username: databaseUrl.username,
});

const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

export default prisma;
