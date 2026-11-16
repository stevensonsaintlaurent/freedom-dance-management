import prisma from "./lib/prisma.js";

async function testDatabase() {
  try {
    await prisma.$connect();

    const users = await prisma.user.count();
    const sessions = await prisma.session.count();

    console.log("Prisma connected successfully!");
    console.log("Total users:", users);
    console.log("Total sessions:", sessions);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
