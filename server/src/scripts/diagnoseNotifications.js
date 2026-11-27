import "dotenv/config";
import prisma from "../lib/prisma.js";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Provide your test email address.");
  const now = new Date();
  const bookings = await prisma.weeklyClassBooking.findMany({
    where: { guestEmail: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      bookingReference: true,
      status: true,
      classDate: true,
      createdAt: true,
      weeklyClass: { select: { title: true } },
      _count: { select: { notifications: true, notificationDeliveries: true } },
    },
  });
  console.log("Current UTC time:", now.toISOString());
  console.log("Matching bookings:");
  console.table(
    bookings.map(({ weeklyClass, _count, ...b }) => ({
      ...b,
      class: weeklyClass.title,
      dashboard: _count.notifications,
      deliveries: _count.notificationDeliveries,
    })),
  );
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      OR: [
        { recipient: { equals: email, mode: "insensitive" } },
        { weeklyBookingId: { in: bookings.map((b) => b.id) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      weeklyBookingId: true,
      recipient: true,
      channel: true,
      type: true,
      status: true,
      scheduledAt: true,
      nextAttemptAt: true,
      attemptCount: true,
      maxAttempts: true,
      expiresAt: true,
    },
  });
  console.log("Related delivery records (other recipients hidden):");
  console.table(
    deliveries.map(({ recipient, ...d }) => ({
      ...d,
      recipient: recipient.toLowerCase() === email ? "TEST EMAIL" : "OTHER",
      due: d.scheduledAt <= now && d.nextAttemptAt <= now,
    })),
  );
  console.log("Database totals:", {
    bookings: await prisma.weeklyClassBooking.count(),
    notifications: await prisma.notification.count(),
    deliveries: await prisma.notificationDelivery.count(),
  });
  console.log("Read-only diagnostic completed. No emails sent.");
}
main()
  .catch((e) => {
    console.error("Diagnostic failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
