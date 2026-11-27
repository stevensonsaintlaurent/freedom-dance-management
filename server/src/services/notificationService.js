import { localToUtc } from "../utils/rentalDateTime.js";

const STUDIO_NAME = "Freedom Dance Studio";
const STUDIO_ADDRESS = "3110 E Sunset Rd, Suite C, Las Vegas, NV 89120";

const REMINDER_HOURS = [24, 2];

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours % 12 || 12}:${String(mins).padStart(
    2,
    "0",
  )} ${hours >= 12 ? "PM" : "AM"}`;
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

// ==========================================
// CREATE DELIVERY QUEUE RECORD
// ==========================================

const queueDelivery = async (tx, options) => {
  const {
    bookingId,
    userId = null,
    type,
    channel,
    recipient,
    subject,
    payload,
    scheduledAt = new Date(),
    expiresAt = null,
    suffix = "initial",
  } = options;

  if (!recipient) return null;

  const dedupeKey = [bookingId, userId || "guest", type, channel, suffix].join(
    ":",
  );

  return tx.notificationDelivery.upsert({
    where: { dedupeKey },

    update: {},

    create: {
      weeklyBookingId: bookingId,
      userId,
      type,
      channel,
      recipient,
      subject,
      payload,
      dedupeKey,
      scheduledAt,
      nextAttemptAt: scheduledAt,
      expiresAt,
      status: "PENDING",
    },
  });
};

// ==========================================
// BOOKING INFORMATION
// ==========================================

const getBookingDetails = async (tx, bookingId) => {
  const booking = await tx.weeklyClassBooking.findUnique({
    where: { id: bookingId },

    include: {
      weeklyClass: {
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          room: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const weeklyClass = booking.weeklyClass;

  const date = booking.classDate.toISOString().slice(0, 10);

  const startsAt = localToUtc(date, weeklyClass.startTimeMinutes);

  const payload = {
    studioName: STUDIO_NAME,
    studioAddress: STUDIO_ADDRESS,

    bookingId: booking.id,
    bookingReference: booking.bookingReference,

    firstName: booking.guestFirstName,
    lastName: booking.guestLastName,

    classTitle: weeklyClass.title,
    classDate: formatDate(booking.classDate),

    startTime: formatTime(weeklyClass.startTimeMinutes),

    endTime: formatTime(
      weeklyClass.startTimeMinutes + weeklyClass.durationMinutes,
    ),

    instructor: [
      weeklyClass.instructor.firstName,
      weeklyClass.instructor.lastName,
    ].join(" "),

    room: weeklyClass.room?.name || "To be announced",

    priceCents: booking.priceCents,
    status: booking.status,
  };

  return { booking, weeklyClass, startsAt, payload };
};

// ==========================================
// NOTIFY MANAGERS, ADMINS AND INSTRUCTOR
// ==========================================

const notifyStaff = async (tx, booking, weeklyClass, payload) => {
  const staff = await tx.user.findMany({
    where: {
      isActive: true,

      OR: [
        {
          role: {
            in: ["MANAGER", "ADMIN"],
          },
        },
        {
          id: weeklyClass.instructorId,
        },
      ],
    },

    select: {
      id: true,
      email: true,
      phone: true,
      notificationPreference: true,
    },
  });

  const title = "New class booking";

  const message =
    `${booking.guestFirstName} ${booking.guestLastName}` +
    ` reserved ${weeklyClass.title} on ` +
    `${payload.classDate} at ${payload.startTime}.`;

  for (const user of staff) {
    const preferences = user.notificationPreference;

    // Dashboard notification
    if (preferences?.dashboardEnabled !== false) {
      const dedupeKey = `${booking.id}:BOOKING_RECEIVED:${user.id}`;

      await tx.notification.upsert({
        where: { dedupeKey },

        update: {},

        create: {
          userId: user.id,
          weeklyBookingId: booking.id,
          type: "BOOKING_RECEIVED",
          title,
          message,
          data: payload,
          dedupeKey,
        },
      });
    }

    // Staff email
    if (preferences?.emailEnabled !== false) {
      await queueDelivery(tx, {
        bookingId: booking.id,
        userId: user.id,
        type: "BOOKING_RECEIVED",
        channel: "EMAIL",
        recipient: user.email,
        subject: `New booking — ${weeklyClass.title}`,
        payload: {
          ...payload,
          audience: "STAFF",
          message,
        },
      });
    }

    // Staff SMS — explicit consent required
    if (preferences?.smsEnabled && preferences?.smsConsentAt && user.phone) {
      await queueDelivery(tx, {
        bookingId: booking.id,
        userId: user.id,
        type: "BOOKING_RECEIVED",
        channel: "SMS",
        recipient: user.phone,
        payload: {
          ...payload,
          audience: "STAFF",
          message,
        },
      });
    }
  }
};

// ==========================================
// STUDENT BOOKING NOTIFICATIONS
// ==========================================

const notifyStudent = async (tx, booking, payload) => {
  const confirmed = booking.status === "CONFIRMED";

  const type = confirmed ? "BOOKING_CONFIRMED" : "BOOKING_RECEIVED";

  const subject = confirmed
    ? "Your Freedom Dance Studio booking is confirmed!"
    : "Your Freedom Dance Studio booking request was received";

  const studentPayload = {
    ...payload,
    audience: "STUDENT",
  };

  // Email receipt
  await queueDelivery(tx, {
    bookingId: booking.id,
    type,
    channel: "EMAIL",
    recipient: booking.guestEmail,
    subject,
    payload: studentPayload,
  });

  // SMS receipt
  if (booking.smsConsent && booking.smsConsentAt) {
    await queueDelivery(tx, {
      bookingId: booking.id,
      type,
      channel: "SMS",
      recipient: booking.guestPhone,
      payload: studentPayload,
    });
  }
};

// ==========================================
// SCHEDULE STUDENT REMINDERS
// ==========================================

const scheduleReminders = async (tx, booking, startsAt, payload) => {
  const now = new Date();

  for (const hours of REMINDER_HOURS) {
    const scheduledAt = new Date(startsAt.getTime() - hours * 60 * 60 * 1000);

    // Skip reminders whose scheduled time has passed.
    if (scheduledAt <= now) continue;

    const reminderPayload = {
      ...payload,
      audience: "STUDENT",
      reminderHours: hours,
      classStartsAt: startsAt.toISOString(),
    };

    // Email reminder
    await queueDelivery(tx, {
      bookingId: booking.id,
      type: "CLASS_REMINDER",
      channel: "EMAIL",
      recipient: booking.guestEmail,
      subject: `Class reminder — ${payload.classTitle}`,
      payload: reminderPayload,
      scheduledAt,
      expiresAt: startsAt,
      suffix: `${hours}h`,
    });

    // SMS reminder
    if (booking.smsConsent && booking.smsConsentAt) {
      await queueDelivery(tx, {
        bookingId: booking.id,
        type: "CLASS_REMINDER",
        channel: "SMS",
        recipient: booking.guestPhone,
        payload: reminderPayload,
        scheduledAt,
        expiresAt: startsAt,
        suffix: `${hours}h`,
      });
    }
  }
};

// ==========================================
// MAIN BOOKING NOTIFICATION SERVICE
// ==========================================

export const createBookingNotifications = async (tx, bookingId) => {
  const { booking, weeklyClass, startsAt, payload } = await getBookingDetails(
    tx,
    bookingId,
  );

  if (booking.status === "CANCELLED") {
    return;
  }

  await notifyStaff(tx, booking, weeklyClass, payload);

  await notifyStudent(tx, booking, payload);

  await scheduleReminders(tx, booking, startsAt, payload);
};

// ==========================================
// CANCEL QUEUED REMINDERS
// ==========================================

export const cancelBookingReminders = async (tx, bookingId) => {
  return tx.notificationDelivery.updateMany({
    where: {
      weeklyBookingId: bookingId,
      type: "CLASS_REMINDER",
      status: {
        in: ["PENDING", "FAILED"],
      },
    },

    data: {
      status: "CANCELLED",
    },
  });
};
