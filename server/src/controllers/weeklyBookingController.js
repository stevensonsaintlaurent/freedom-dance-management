import { randomBytes } from "node:crypto";
import prisma from "../lib/prisma.js";

// Change the import above if your Prisma client
// is stored in a different folder.

const TIME_ZONE = "America/Los_Angeles";

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

const createReference = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const code = randomBytes(5).toString("hex").toUpperCase();

  return `FDS-${date}-${code}`;
};

const getTodayInVegas = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const parseClassDate = (value) => {
  if (typeof value !== "string") return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return null;

  if (date.toISOString().slice(0, 10) !== value) return null;

  return date;
};

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const bookingInclude = {
  weeklyClass: {
    select: {
      id: true,
      title: true,
      dayOfWeek: true,
      startTimeMinutes: true,
      durationMinutes: true,
      level: true,
      instructor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  },
};

// ============================================
// POST /api/weekly-bookings
// Public booking — no login required
// ============================================

export const createWeeklyBooking = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      selectedClasses,
      marketingConsent = false,
      notes,
    } = req.body ?? {};

    const guestFirstName = cleanString(firstName);
    const guestLastName = cleanString(lastName);
    const guestEmail = cleanString(email).toLowerCase();
    const guestPhone = cleanString(phone);

    if (!guestFirstName || !guestLastName || !guestEmail || !guestPhone) {
      return res.status(400).json({
        message: "First name, last name, email, and phone are required.",
      });
    }

    if (
      guestFirstName.length > 100 ||
      guestLastName.length > 100 ||
      guestEmail.length > 254 ||
      guestPhone.length > 30
    ) {
      return res.status(400).json({
        message: "One or more contact fields are too long.",
      });
    }

    if (!isValidEmail(guestEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (
      !Array.isArray(selectedClasses) ||
      selectedClasses.length === 0 ||
      selectedClasses.length > 10
    ) {
      return res.status(400).json({
        message: "Please select between 1 and 10 classes.",
      });
    }

    if (typeof marketingConsent !== "boolean") {
      return res.status(400).json({
        message: "Invalid marketing consent value.",
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        message: "Notes must be text.",
      });
    }

    if (notes && notes.length > 1000) {
      return res.status(400).json({
        message: "Notes must be 1000 characters or fewer.",
      });
    }

    const today = getTodayInVegas();
    const selections = [];
    const uniqueSelections = new Set();

    for (const item of selectedClasses) {
      const weeklyClassId = cleanString(item?.weeklyClassId);
      const classDate = cleanString(item?.classDate);
      const parsedDate = parseClassDate(classDate);

      if (!weeklyClassId || !parsedDate) {
        return res.status(400).json({
          message: "Each class requires a valid class ID and date.",
        });
      }

      if (classDate < today) {
        return res.status(400).json({
          message: "You cannot book a class in the past.",
        });
      }

      const key = `${weeklyClassId}:${classDate}`;

      if (uniqueSelections.has(key)) {
        return res.status(400).json({
          message: "The same class and date cannot be selected twice.",
        });
      }

      uniqueSelections.add(key);

      selections.push({
        weeklyClassId,
        classDate,
        parsedDate,
      });
    }

    const reference = createReference();

    const bookings = await prisma.$transaction(
      async (tx) => {
        const createdBookings = [];

        for (const selection of selections) {
          const weeklyClass = await tx.weeklyClass.findUnique({
            where: {
              id: selection.weeklyClassId,
            },
          });

          if (!weeklyClass || !weeklyClass.isActive) {
            throw new Error("CLASS_NOT_AVAILABLE");
          }

          const day = DAY_NAMES[selection.parsedDate.getUTCDay()];

          if (weeklyClass.dayOfWeek !== day) {
            throw new Error("INVALID_CLASS_DAY");
          }

          // Prevent overselling when concurrent bookings arrive.
          // The transaction uses Serializable isolation.
          const bookedCount = await tx.weeklyClassBooking.count({
            where: {
              weeklyClassId: weeklyClass.id,
              classDate: selection.parsedDate,
              status: {
                in: ACTIVE_STATUSES,
              },
            },
          });

          if (bookedCount >= weeklyClass.capacity) {
            throw new Error("CLASS_FULL");
          }

          const existingBooking = await tx.weeklyClassBooking.findFirst({
            where: {
              weeklyClassId: weeklyClass.id,
              classDate: selection.parsedDate,
              guestEmail,
              status: {
                in: ACTIVE_STATUSES,
              },
            },
          });

          if (existingBooking) {
            throw new Error("ALREADY_BOOKED");
          }

          const booking = await tx.weeklyClassBooking.create({
            data: {
              bookingReference: reference,
              guestFirstName,
              guestLastName,
              guestEmail,
              guestPhone,
              weeklyClassId: weeklyClass.id,
              classDate: selection.parsedDate,
              priceCents: weeklyClass.priceCents,
              marketingConsent,
              notes: cleanString(notes) || null,
              status: "PENDING",
            },
            include: bookingInclude,
          });

          createdBookings.push(booking);
        }

        return createdBookings;
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return res.status(201).json({
      success: true,
      message: "Your booking request has been received.",
      bookingReference: reference,
      status: "PENDING",
      paymentMethod: "PAY_AT_STUDIO",
      classCount: bookings.length,
      totalCents: bookings.reduce(
        (total, booking) => total + booking.priceCents,
        0,
      ),
      bookings,
    });
  } catch (error) {
    console.error("Create weekly booking error:", error);

    const errors = {
      CLASS_NOT_AVAILABLE: [404, "This class is no longer available."],
      INVALID_CLASS_DAY: [
        400,
        "The selected date does not match the class day.",
      ],
      CLASS_FULL: [409, "One of the selected classes is fully booked."],
      ALREADY_BOOKED: [
        409,
        "You already have an active booking for this class.",
      ],
    };

    if (errors[error.message]) {
      const [status, message] = errors[error.message];
      return res.status(status).json({ message });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        message: "Booking availability changed. Please try again.",
      });
    }

    return res.status(500).json({
      message: "Unable to complete your booking. Please try again.",
    });
  }
};

// ============================================
// GET /api/weekly-bookings
// Manager / Admin
// ============================================

export const getWeeklyBookings = async (req, res) => {
  try {
    // Assumes your authentication middleware sets req.user.
    // Adapt these fields if your middleware uses another shape.
    const userId = req.user?.id || req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!["MANAGER", "ADMIN", "INSTRUCTOR"].includes(role)) {
      return res.status(403).json({
        message: "You do not have permission to view bookings.",
      });
    }

    const { status, classDate, weeklyClassId } = req.query;

    const where = {};

    if (role === "INSTRUCTOR") {
      where.weeklyClass = {
        instructorId: userId,
      };
    }

    if (status) {
      if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) {
        return res.status(400).json({
          message: "Invalid booking status.",
        });
      }

      where.status = status;
    }

    if (classDate) {
      const parsedDate = parseClassDate(classDate);

      if (!parsedDate) {
        return res.status(400).json({
          message: "Invalid class date.",
        });
      }

      where.classDate = parsedDate;
    }

    if (weeklyClassId) {
      where.weeklyClassId = weeklyClassId;
    }

    const bookings = await prisma.weeklyClassBooking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ classDate: "asc" }, { createdAt: "desc" }],
      take: 100,
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get weekly bookings error:", error);

    return res.status(500).json({
      message: "Unable to load bookings.",
    });
  }
};

// ============================================
// PATCH /api/weekly-bookings/:id/status
// Manager / Admin
// ============================================

export const updateWeeklyBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!["CONFIRMED", "CANCELLED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be CONFIRMED or CANCELLED.",
      });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.weeklyClassBooking.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      if (existing.status === "CANCELLED" && status === "CONFIRMED") {
        throw new Error("CANNOT_REACTIVATE");
      }

      return tx.weeklyClassBooking.update({
        where: { id },
        data: { status },
        include: bookingInclude,
      });
    });

    return res.status(200).json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully.`,
      booking,
    });
  } catch (error) {
    if (error.message === "BOOKING_NOT_FOUND") {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (error.message === "CANNOT_REACTIVATE") {
      return res.status(409).json({
        message:
          "Cancelled bookings cannot be reactivated. Create a new booking.",
      });
    }

    console.error("Update booking status error:", error);

    return res.status(500).json({
      message: "Unable to update booking.",
    });
  }
};
