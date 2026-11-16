import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
});

client.on("error", (error) => {
  console.error("Client error:", error.code, error.message);
});

try {
  console.log("Connecting to Render PostgreSQL...");

  await client.connect();
  console.log("Connection established.");

  const result = await client.query("SELECT NOW() AS server_time");

  console.log("Query successful:", result.rows);
} catch (error) {
  console.error("Connection failed.");
  console.error("Code:", error.code);
  console.error("Message:", error.message);
  console.error("System call:", error.syscall);
  console.error("Address:", error.address);
  console.error("Port:", error.port);

  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
