import "dotenv/config";
import prisma from "../lib/prisma.js";

const auditNotificationQueue = async () => {
  const now = new Date();

  console.log("\n==========================================");
  console.log("FREEDOM DANCE STUDIO");
  console.log("NOTIFICATION QUEUE AUDIT");
  console.log("==========================================");

  console.log("Audit time:", now.toISOString());

  // ==========================================
  // SUMMARY BY STATUS
  // ==========================================

  const statusSummary = await prisma.notificationDelivery.groupBy({
    by: ["status", "channel"],
    _count: {
      _all: true,
    },
  });

  console.log("\n1. DELIVERY STATUS SUMMARY");

  console.table(
    statusSummary.map((item) => ({
      status: item.status,
      channel: item.channel,
      count: item._count._all,
    })),
  );

  // ==========================================
  // PENDING AND FAILED DELIVERIES
  // ==========================================

  const pendingDeliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: {
        in: ["PENDING", "FAILED"],
      },
    },
    include: {
      weeklyBooking: {
        include: {
          weeklyClass: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });

  console.log("\n2. PENDING AND FAILED DELIVERIES");

  console.table(
    pendingDeliveries.map((delivery) => ({
      id: delivery.id,
      type: delivery.type,
      channel: delivery.channel,
      audience: delivery.payload?.audience || "UNKNOWN",
      status: delivery.status,
      class: delivery.weeklyBooking?.weeklyClass?.title,
      bookingStatus: delivery.weeklyBooking?.status,
      attempts: `${delivery.attemptCount}/${delivery.maxAttempts}`,
      scheduledAt: delivery.scheduledAt.toISOString(),
      due: delivery.scheduledAt <= now && delivery.nextAttemptAt <= now,
      expired: Boolean(delivery.expiresAt && delivery.expiresAt <= now),
      testRecipient:
        delivery.recipient.toLowerCase() === "freedomdancelasvegas@gmail.com",
    })),
  );

  // ==========================================
  // EXPIRED NOTIFICATIONS
  // ==========================================

  const expiredDeliveries = pendingDeliveries.filter(
    (delivery) => delivery.expiresAt && delivery.expiresAt <= now,
  );

  console.log("\n3. EXPIRED NOTIFICATIONS");
  console.log("Total:", expiredDeliveries.length);

  // ==========================================
  // EXHAUSTED RETRIES
  // ==========================================

  const exhaustedDeliveries = pendingDeliveries.filter(
    (delivery) => delivery.attemptCount >= delivery.maxAttempts,
  );

  console.log("\n4. EXHAUSTED RETRIES");
  console.log("Total:", exhaustedDeliveries.length);

  // ==========================================
  // INTERRUPTED DELIVERIES
  // ==========================================

  const interruptedDeliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: "PROCESSING",
      OR: [
        {
          lockedUntil: {
            lte: now,
          },
        },
        {
          lockedUntil: null,
        },
      ],
    },
    select: {
      id: true,
      type: true,
      channel: true,
      attemptCount: true,
      provider: true,
      providerMessageId: true,
      lockedUntil: true,
    },
  });

  console.log("\n5. INTERRUPTED DELIVERIES");
  console.table(interruptedDeliveries);

  // ==========================================
  // SUCCESSFUL DELIVERIES
  // ==========================================

  const successfulDeliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: {
        in: ["SENT", "DELIVERED"],
      },
    },
    select: {
      id: true,
      type: true,
      channel: true,
      status: true,
      provider: true,
      providerMessageId: true,
      sentAt: true,
      deliveredAt: true,
    },
  });

  console.log("\n6. SUCCESSFUL DELIVERIES");
  console.table(successfulDeliveries);

  // ==========================================
  // FINAL SUMMARY
  // ==========================================

  console.log("\n==========================================");
  console.log("FINAL AUDIT SUMMARY");
  console.log("==========================================");

  console.table({
    pendingAndFailed: pendingDeliveries.length,
    expired: expiredDeliveries.length,
    exhausted: exhaustedDeliveries.length,
    interrupted: interruptedDeliveries.length,
    successful: successfulDeliveries.length,
  });

  console.log("\nRead-only audit completed.");
  console.log("No emails sent.");
  console.log("No reservations deleted.");
  console.log("No database records modified.");
};

auditNotificationQueue()
  .catch((error) => {
    console.error("Notification audit failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
