import "dotenv/config";
import { randomUUID } from "node:crypto";

import prisma from "../lib/prisma.js";

import { sendEmail } from "./emailService.js";

import { localToUtc } from "../utils/rentalDateTime.js";

import { buildEmailTemplate } from "./notificationTemplateService.js";

// ==========================================
// CONFIGURATION
// ==========================================

const BATCH_SIZE = 20;
const LOCK_DURATION_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;

// ==========================================
// ENABLED CHANNELS
// ==========================================

const getEnabledChannels = () => {
  const channels = [];

  if (process.env.EMAIL_ENABLED === "true") {
    channels.push("EMAIL");
  }

  // SMS remains disabled until Twilio is ready
  // and opt-out processing is implemented.

  return channels;
};

// ==========================================
// UPDATE OWNED DELIVERY
// ==========================================

const updateDelivery = async (delivery, data) => {
  return prisma.notificationDelivery.updateMany({
    where: {
      id: delivery.id,
      status: "PROCESSING",
      lockToken: delivery.lockToken,
    },

    data: {
      ...data,
      lockedUntil: null,
      lockToken: null,
    },
  });
};

// ==========================================
// CANCEL DELIVERY
// ==========================================

const cancelDelivery = async (delivery, reason) => {
  await updateDelivery(delivery, {
    status: "CANCELLED",
    lastError: reason,
  });

  return {
    status: "CANCELLED",
    reason,
  };
};

// ==========================================
// VALIDATE BEFORE SENDING
// ==========================================

const validateDelivery = async (delivery) => {
  const now = new Date();

  if (delivery.expiresAt && delivery.expiresAt <= now) {
    return "Notification has expired.";
  }

  const booking = delivery.weeklyBooking;
  const user = delivery.user;

  if (delivery.payload?.audience === "STAFF") {
    if (!user || !user.isActive) {
      return "Staff account is no longer active.";
    }

    if (
      !["ADMIN", "MANAGER"].includes(user.role) &&
      user.id !== booking?.weeklyClass?.instructorId
    ) {
      return "Staff member is no longer assigned to this class.";
    }

    if (user.notificationPreference?.emailEnabled === false) {
      return "Staff email notifications are disabled.";
    }

    if (user.email !== delivery.recipient) {
      return "Staff email address has changed.";
    }
  }

  if (delivery.weeklyBookingId && !booking) {
    return "Booking no longer exists.";
  }

  if (!booking) {
    return "Missing booking information.";
  }

  if (
    delivery.payload?.audience === "STUDENT" &&
    booking.guestEmail !== delivery.recipient
  ) {
    return "Student email address has changed.";
  }

  const activeBookingTypes = [
    "BOOKING_RECEIVED",
    "BOOKING_CONFIRMED",
    "CLASS_REMINDER",
    "CLASS_RESTORED",
    "CLASS_RESCHEDULED",
  ];

  if (activeBookingTypes.includes(delivery.type)) {
    if (booking.status === "CANCELLED") {
      return "Booking has been cancelled.";
    }

    if (!booking.weeklyClass.isActive) {
      return "Class is no longer active.";
    }

    const startsAt = localToUtc(
      booking.classDate.toISOString().slice(0, 10),
      booking.weeklyClass.startTimeMinutes,
    );

    if (startsAt <= now) {
      return "Class has already started.";
    }

    const [studioCancellation, classCancellation] = await Promise.all([
      prisma.studioCancellation.findUnique({
        where: {
          classDate: booking.classDate,
        },
      }),

      prisma.classCancellation.findUnique({
        where: {
          weeklyClassId_classDate: {
            weeklyClassId: booking.weeklyClassId,
            classDate: booking.classDate,
          },
        },
      }),
    ]);

    if (studioCancellation?.isActive || classCancellation?.isActive) {
      return "Class session has been cancelled.";
    }
  }

  if (
    delivery.type === "BOOKING_RECEIVED" &&
    delivery.payload?.audience === "STUDENT" &&
    booking.status === "CONFIRMED"
  ) {
    return "Booking receipt superseded by confirmation.";
  }

  if (delivery.type === "BOOKING_CONFIRMED" && booking.status !== "CONFIRMED") {
    return "Booking is not confirmed.";
  }

  if (delivery.type === "BOOKING_CANCELLED" && booking.status !== "CANCELLED") {
    return "Booking is not cancelled.";
  }

  if (delivery.type === "CLASS_REMINDER") {
    const currentStartsAt = localToUtc(
      booking.classDate.toISOString().slice(0, 10),
      booking.weeklyClass.startTimeMinutes,
    );

    if (
      delivery.payload?.classStartsAt &&
      delivery.payload.classStartsAt !== currentStartsAt.toISOString()
    ) {
      return "Class schedule has changed.";
    }
  }

  return null;
};

// ==========================================
// PROCESS ONE NOTIFICATION
// ==========================================

export const processNotificationDelivery = async (id) => {
  const now = new Date();
  const channels = getEnabledChannels();

  if (!channels.length) {
    return { status: "SKIPPED" };
  }

  const candidate = await prisma.notificationDelivery.findUnique({
    where: { id },
  });

  if (!candidate || candidate.attemptCount >= candidate.maxAttempts) {
    return { status: "SKIPPED" };
  }

  const lockToken = randomUUID();

  // Claim the record atomically.
  const claimed = await prisma.notificationDelivery.updateMany({
    where: {
      id,
      channel: { in: channels },

      status: {
        in: ["PENDING", "FAILED"],
      },

      attemptCount: candidate.attemptCount,

      scheduledAt: { lte: now },
      nextAttemptAt: { lte: now },
    },

    data: {
      status: "PROCESSING",
      lockToken,

      lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS),

      attemptCount: {
        increment: 1,
      },
    },
  });

  if (claimed.count === 0) {
    return { status: "SKIPPED" };
  }

  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id },

    include: {
      user: {
        include: {
          notificationPreference: true,
        },
      },

      weeklyBooking: {
        include: {
          weeklyClass: true,
        },
      },
    },
  });

  if (!delivery || delivery.lockToken !== lockToken) {
    return { status: "SKIPPED" };
  }

  let providerAccepted = false;

  try {
    const invalidReason = await validateDelivery(delivery);

    if (invalidReason) {
      return await cancelDelivery(delivery, invalidReason);
    }

    // Use the current booking status instead of
    // relying entirely on the original payload.

    const payload = {
      ...delivery.payload,

      status: delivery.weeklyBooking?.status || delivery.payload?.status,
    };

    if (delivery.channel !== "EMAIL") {
      throw new Error("Unsupported delivery channel.");
    }

    const template = buildEmailTemplate({
      type: delivery.type,
      payload,
      subject: delivery.subject,
    });

    // Recheck ownership immediately before sending.

    const ownership = await prisma.notificationDelivery.findFirst({
      where: {
        id,
        status: "PROCESSING",
        lockToken,
        lockedUntil: {
          gt: new Date(),
        },
      },
    });

    if (!ownership) {
      return { status: "SKIPPED" };
    }

    const result = await sendEmail({
      to: delivery.recipient,
      ...template,
      idempotencyKey: `fds-notification-${delivery.id}`,
    });

    if (result.skipped) {
      await updateDelivery(delivery, {
        status: "PENDING",
        attemptCount: {
          lt: prisma.notificationDelivery.fields.maxAttempts,
        },
      });

      return { status: "SKIPPED" };
    }

    if (!result.success) {
      throw new Error("Email provider rejected delivery.");
    }

    providerAccepted = true;

    const saved = await updateDelivery(delivery, {
      status: "SENT",

      provider: result.provider,
      providerMessageId: result.messageId,

      sentAt: new Date(),
      lastError: null,
    });

    if (saved.count !== 1) {
      throw new Error(
        "Provider accepted email but delivery status could not be saved.",
      );
    }

    return { status: "SENT" };
  } catch (error) {
    // Do not automatically retry an email that
    // the provider has already accepted.

    if (providerAccepted) {
      console.error("Delivery requires reconciliation:", delivery.id);

      return {
        status: "REVIEW_REQUIRED",
      };
    }

    const delay = RETRY_DELAY_MS * Math.pow(2, delivery.attemptCount - 1);

    await updateDelivery(delivery, {
      status: "FAILED",

      lastError: String(error.message || "Unknown delivery error").slice(
        0,
        1000,
      ),

      nextAttemptAt: new Date(Date.now() + delay),
    });

    return {
      status: "FAILED",
    };
  }
};

// ==========================================
// PROCESS PENDING NOTIFICATIONS
// ==========================================

export const processPendingNotifications = async ({
  recipient,
  limit = BATCH_SIZE,
} = {}) => {
  const channels = getEnabledChannels();

  const summary = {
    processed: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
    skipped: 0,
    reviewRequired: 0,
  };

  if (!channels.length) {
    return summary;
  }

  const now = new Date();

  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      channel: {
        in: channels,
      },

      status: {
        in: ["PENDING", "FAILED"],
      },

      scheduledAt: {
        lte: now,
      },

      nextAttemptAt: {
        lte: now,
      },

      ...(recipient ? { recipient } : {}),
    },

    orderBy: {
      scheduledAt: "asc",
    },

    take: Math.min(Math.max(Number(limit) || BATCH_SIZE, 1), 100),
  });

  for (const delivery of deliveries) {
    if (delivery.attemptCount >= delivery.maxAttempts) {
      summary.skipped++;
      continue;
    }

    const result = await processNotificationDelivery(delivery.id);

    summary.processed++;

    switch (result.status) {
      case "SENT":
        summary.sent++;
        break;

      case "FAILED":
        summary.failed++;
        break;

      case "CANCELLED":
        summary.cancelled++;
        break;

      case "REVIEW_REQUIRED":
        summary.reviewRequired++;
        break;

      default:
        summary.skipped++;
    }
  }

  return summary;
};
// ==========================================
// IDENTIFY INTERRUPTED DELIVERIES
// ==========================================

export const inspectInterruptedDeliveries = async () => {
  const now = new Date();

  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      status: "PROCESSING",
      OR: [{ lockedUntil: { lte: now } }, { lockedUntil: null }],
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

    orderBy: {
      updatedAt: "asc",
    },

    take: 100,
  });

  return deliveries;
};
