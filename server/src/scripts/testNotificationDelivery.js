import "dotenv/config";

import prisma from "../lib/prisma.js";

import { processNotificationDelivery } from "../services/notificationDeliveryService.js";

// ==========================================
// CONTROLLED EMAIL DELIVERY TEST
// ==========================================

const main = async () => {
  const recipient = process.argv[2]?.trim();
  const deliveryId = process.argv[3]?.trim();

  if (!recipient) {
    throw new Error("Please provide your email address.");
  }

  // Preview matching notifications.
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      recipient,
      channel: "EMAIL",

      status: {
        in: ["PENDING", "FAILED"],
      },

      scheduledAt: {
        lte: new Date(),
      },

      nextAttemptAt: {
        lte: new Date(),
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 20,

    select: {
      id: true,
      type: true,
      subject: true,
      status: true,
      recipient: true,
      scheduledAt: true,
      attemptCount: true,
      maxAttempts: true,
    },
  });

  if (!deliveries.length) {
    console.log("No eligible email notifications found for this address.");

    return;
  }

  // Without an ID, only display the queue.
  // No email will be sent.

  if (!deliveryId) {
    console.log("\nAVAILABLE NOTIFICATIONS\n");

    console.table(deliveries);

    console.log("\nPreview only. No emails were sent.");

    console.log(
      "Run the command again with a notification ID to send one email.",
    );

    return;
  }

  const selected = deliveries.find((delivery) => delivery.id === deliveryId);

  if (!selected) {
    throw new Error(
      "The selected notification is not eligible for this recipient.",
    );
  }

  if (selected.attemptCount >= selected.maxAttempts) {
    throw new Error("This notification has reached its retry limit.");
  }

  // Enable email only for this test process.

  process.env.EMAIL_ENABLED = "true";
  process.env.SMS_ENABLED = "false";

  console.log("\nPROCESSING TEST NOTIFICATION\n");

  console.log({
    id: selected.id,
    recipient: selected.recipient,
    type: selected.type,
    subject: selected.subject,
  });

  const result = await processNotificationDelivery(selected.id);

  console.log("\nDELIVERY RESULT:");

  console.log(result);

  const updated = await prisma.notificationDelivery.findUnique({
    where: {
      id: selected.id,
    },

    select: {
      id: true,
      status: true,
      provider: true,
      providerMessageId: true,
      attemptCount: true,
      sentAt: true,
      lastError: true,
    },
  });

  console.log("\nUPDATED DATABASE RECORD:");

  console.log(updated);
};

main()
  .catch((error) => {
    console.error("Notification test failed:", error.message);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
