import prisma from "../lib/prisma.js";

const STAFF_ROLES = ["MANAGER", "ADMIN"];

const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// ==========================================
// HELPERS
// ==========================================

const parseClassDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

const canManageCancellations = (user) => {
  return user?.id && STAFF_ROLES.includes(user.role);
};

const staffSelect = {
  id: true,
  firstName: true,
  lastName: true,
};

const studioInclude = {
  cancelledBy: {
    select: staffSelect,
  },
  restoredBy: {
    select: staffSelect,
  },
};

const classInclude = {
  ...studioInclude,

  weeklyClass: {
    select: {
      id: true,
      title: true,
      dayOfWeek: true,
      startTimeMinutes: true,
      durationMinutes: true,

      instructor: {
        select: staffSelect,
      },
    },
  },
};

// ==========================================
// GET ALL CANCELLATIONS
// ==========================================

export const getCancellations = async (req, res, next) => {
  try {
    if (!canManageCancellations(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission.",
      });
    }

    const { active, classDate } = req.query;

    const where = {};

    if (active !== undefined) {
      if (!["true", "false"].includes(active)) {
        return res.status(400).json({
          success: false,
          message: "Invalid active filter.",
        });
      }

      where.isActive = active === "true";
    }

    if (classDate) {
      const date = parseClassDate(classDate);

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Invalid class date.",
        });
      }

      where.classDate = date;
    }

    const [studioCancellations, classCancellations] = await Promise.all([
      prisma.studioCancellation.findMany({
        where,
        include: studioInclude,
        orderBy: {
          classDate: "desc",
        },
      }),

      prisma.classCancellation.findMany({
        where,
        include: classInclude,
        orderBy: {
          classDate: "desc",
        },
      }),
    ]);

    const cancellations = [
      ...studioCancellations.map((item) => ({
        ...item,
        type: "STUDIO",
      })),

      ...classCancellations.map((item) => ({
        ...item,
        type: "CLASS",
      })),
    ].sort((a, b) => new Date(b.classDate) - new Date(a.classDate));

    return res.status(200).json({
      success: true,
      count: cancellations.length,
      cancellations,

      summary: {
        total: cancellations.length,
        active: cancellations.filter((item) => item.isActive).length,
        restored: cancellations.filter((item) => !item.isActive).length,
        studio: studioCancellations.length,
        individual: classCancellations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREATE A CANCELLATION
// ==========================================

export const createCancellation = async (req, res, next) => {
  try {
    if (!canManageCancellations(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission.",
      });
    }

    const { type, weeklyClassId, classDate, reason, publicMessage } = req.body;

    if (!["STUDIO", "CLASS"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cancellation type.",
      });
    }

    const date = parseClassDate(classDate);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "A valid cancellation date is required.",
      });
    }

    if (typeof reason !== "string" || !reason.trim() || reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "A reason of up to 500 characters is required.",
      });
    }

    if (
      publicMessage != null &&
      (typeof publicMessage !== "string" || publicMessage.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid public message.",
      });
    }

    const cancellationData = {
      reason: reason.trim(),
      publicMessage: publicMessage?.trim() || null,
      isActive: true,
      cancelledById: req.user.id,
      cancelledAt: new Date(),
      restoredById: null,
      restoredAt: null,
    };

    // ======================================
    // CANCEL ALL CLASSES ON A DATE
    // ======================================

    if (type === "STUDIO") {
      const existing = await prisma.studioCancellation.findUnique({
        where: {
          classDate: date,
        },
      });

      if (existing?.isActive) {
        return res.status(409).json({
          success: false,
          message: "All classes are already cancelled on this date.",
        });
      }

      const cancellation = await prisma.studioCancellation.upsert({
        where: {
          classDate: date,
        },

        create: {
          classDate: date,
          ...cancellationData,
        },

        update: cancellationData,

        include: studioInclude,
      });

      const affectedBookings = await prisma.weeklyClassBooking.count({
        where: {
          classDate: date,
          status: {
            not: "CANCELLED",
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "Studio-wide cancellation created.",
        cancellation: {
          ...cancellation,
          type: "STUDIO",
        },
        affectedBookings,
      });
    }

    // ======================================
    // CANCEL ONE SPECIFIC CLASS
    // ======================================

    if (typeof weeklyClassId !== "string" || !weeklyClassId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select a weekly class.",
      });
    }

    const weeklyClass = await prisma.weeklyClass.findUnique({
      where: {
        id: weeklyClassId,
      },
    });

    if (!weeklyClass || !weeklyClass.isActive) {
      return res.status(404).json({
        success: false,
        message: "Active weekly class not found.",
      });
    }

    const selectedDay = DAYS[date.getUTCDay()];

    if (weeklyClass.dayOfWeek !== selectedDay) {
      return res.status(400).json({
        success: false,
        message: `This class is scheduled on ${weeklyClass.dayOfWeek.toLowerCase()}.`,
      });
    }

    const uniqueKey = {
      weeklyClassId,
      classDate: date,
    };

    const existing = await prisma.classCancellation.findUnique({
      where: {
        weeklyClassId_classDate: uniqueKey,
      },
    });

    if (existing?.isActive) {
      return res.status(409).json({
        success: false,
        message: "This class is already cancelled on this date.",
      });
    }

    const cancellation = await prisma.classCancellation.upsert({
      where: {
        weeklyClassId_classDate: uniqueKey,
      },

      create: {
        weeklyClassId,
        classDate: date,
        ...cancellationData,
      },

      update: cancellationData,

      include: classInclude,
    });

    const affectedBookings = await prisma.weeklyClassBooking.count({
      where: {
        weeklyClassId,
        classDate: date,
        status: {
          not: "CANCELLED",
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Class cancellation created.",
      cancellation: {
        ...cancellation,
        type: "CLASS",
      },
      affectedBookings,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RESTORE A CANCELLED CLASS
// ==========================================

export const restoreCancellation = async (req, res, next) => {
  try {
    if (!canManageCancellations(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission.",
      });
    }

    const { id } = req.params;
    const { type } = req.body;

    if (!["STUDIO", "CLASS"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cancellation type.",
      });
    }

    const model =
      type === "STUDIO" ? prisma.studioCancellation : prisma.classCancellation;

    const include = type === "STUDIO" ? studioInclude : classInclude;

    const result = await model.updateMany({
      where: {
        id,
        isActive: true,
      },

      data: {
        isActive: false,
        restoredById: req.user.id,
        restoredAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Active cancellation not found.",
      });
    }

    const cancellation = await model.findUnique({
      where: { id },
      include,
    });

    return res.status(200).json({
      success: true,
      message: "Cancellation removed successfully.",
      cancellation: {
        ...cancellation,
        type,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET PUBLIC CANCELLATIONS
// ==========================================

export const getPublicCancellations = async (req, res, next) => {
  try {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const date = parseClassDate(today);

    const where = {
      isActive: true,
      classDate: {
        gte: date,
      },
    };

    const [studioCancellations, classCancellations] = await Promise.all([
      prisma.studioCancellation.findMany({
        where,

        select: {
          id: true,
          classDate: true,
          publicMessage: true,
        },

        orderBy: {
          classDate: "asc",
        },
      }),

      prisma.classCancellation.findMany({
        where,

        select: {
          id: true,
          weeklyClassId: true,
          classDate: true,
          publicMessage: true,

          weeklyClass: {
            select: {
              id: true,
              title: true,
              dayOfWeek: true,
              startTimeMinutes: true,
            },
          },
        },

        orderBy: {
          classDate: "asc",
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      studioCancellations,
      classCancellations,
    });
  } catch (error) {
    next(error);
  }
};
