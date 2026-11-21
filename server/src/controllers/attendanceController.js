import prisma from "../lib/prisma.js";

const ALLOWED_ROLES = ["INSTRUCTOR", "MANAGER", "ADMIN"];

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "NO_SHOW"];

const bookingInclude = {
  weeklyClass: {
    select: {
      id: true,
      title: true,
      dayOfWeek: true,
      startTimeMinutes: true,
      durationMinutes: true,
      instructorId: true,
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
};

function parseDate(value) {
  if (typeof value !== "string") return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
}

function getAuthenticatedUser(req, res) {
  const user = req.user;

  if (!user?.id || !ALLOWED_ROLES.includes(user.role)) {
    res.status(403).json({
      success: false,
      message: "You are not authorized to manage attendance.",
    });

    return null;
  }

  return user;
}

// ============================================
// GET ATTENDANCE
// GET /api/attendance
// Optional: ?classDate=2026-11-24
// Optional: ?weeklyClassId=CLASS_ID
// ============================================

export const getAttendance = async (req, res, next) => {
  try {
    const user = getAuthenticatedUser(req, res);
    if (!user) return;

    const { classDate, weeklyClassId } = req.query;

    const where = {
      status: {
        not: "CANCELLED",
      },
    };

    if (user.role === "INSTRUCTOR") {
      where.weeklyClass = {
        instructorId: user.id,
      };
    }

    if (classDate !== undefined) {
      const parsed = parseDate(classDate);

      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: "Invalid class date. Use YYYY-MM-DD.",
        });
      }

      where.classDate = parsed;
    }

    if (weeklyClassId !== undefined) {
      if (typeof weeklyClassId !== "string" || !weeklyClassId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid weekly class ID.",
        });
      }

      where.weeklyClassId = weeklyClassId;
    }

    const bookings = await prisma.weeklyClassBooking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ classDate: "desc" }, { createdAt: "asc" }],
      take: 200,
    });

    const summary = {
      total: bookings.length,
      present: bookings.filter((b) => b.attendanceStatus === "PRESENT").length,
      absent: bookings.filter((b) => b.attendanceStatus === "ABSENT").length,
      noShow: bookings.filter((b) => b.attendanceStatus === "NO_SHOW").length,
      unmarked: bookings.filter((b) => b.attendanceStatus === null).length,
    };

    return res.status(200).json({
      success: true,
      count: bookings.length,
      summary,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MARK ATTENDANCE
// PATCH /api/attendance/:bookingId
//
// Body:
// { "attendanceStatus": "PRESENT" }
//
// Send null to clear attendance.
// ============================================

export const markAttendance = async (req, res, next) => {
  try {
    const user = getAuthenticatedUser(req, res);
    if (!user) return;

    const { bookingId } = req.params;
    const { attendanceStatus } = req.body || {};

    if (
      attendanceStatus !== null &&
      !ATTENDANCE_STATUSES.includes(attendanceStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance must be PRESENT, ABSENT, NO_SHOW, or null.",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required.",
      });
    }

    const where = {
      id: bookingId,
      status: {
        not: "CANCELLED",
      },
    };

    if (user.role === "INSTRUCTOR") {
      where.weeklyClass = {
        instructorId: user.id,
      };
    }

    // updateMany ensures the ownership and cancellation
    // checks are enforced by the database update itself.
    const result = await prisma.weeklyClassBooking.updateMany({
      where,
      data: {
        attendanceStatus,
        attendanceMarkedAt: attendanceStatus === null ? null : new Date(),
        attendanceMarkedById: attendanceStatus === null ? null : user.id,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found, cancelled, or not assigned to you.",
      });
    }

    const booking = await prisma.weeklyClassBooking.findUnique({
      where: {
        id: bookingId,
      },
      include: bookingInclude,
    });

    return res.status(200).json({
      success: true,
      message:
        attendanceStatus === null
          ? "Attendance cleared successfully."
          : "Attendance updated successfully.",
      booking,
    });
  } catch (error) {
    next(error);
  }
};
