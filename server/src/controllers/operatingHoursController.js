import prisma from "../lib/prisma.js";

// ======================================================
// CONFIGURATION
// ======================================================

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const TIME_ZONE = "America/Los_Angeles";

const roomSelect = {
  id: true,
  name: true,
  isActive: true,
  operatingHours: true,
};

const apiError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.status = statusCode;
  error.statusCode = statusCode;

  return error;
};

// ======================================================
// FORMAT ROOM SCHEDULE
// ======================================================

const formatRoomSchedule = (room) => {
  const schedule = DAYS.map((dayOfWeek) => {
    const windows = room.operatingHours
      .filter((item) => item.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.opensAtMinutes - b.opensAtMinutes)
      .map((item) => ({
        id: item.id,
        opensAtMinutes: item.opensAtMinutes,
        closesAtMinutes: item.closesAtMinutes,
      }));

    return {
      dayOfWeek,
      isOpen: windows.length > 0,
      windows,
    };
  });

  const totalWeeklyMinutes = schedule.reduce(
    (total, day) =>
      total +
      day.windows.reduce(
        (sum, window) => sum + window.closesAtMinutes - window.opensAtMinutes,
        0,
      ),
    0,
  );

  return {
    id: room.id,
    name: room.name,
    isActive: room.isActive,

    configured: room.operatingHours.length > 0,

    schedule,

    summary: {
      openDays: schedule.filter((day) => day.isOpen).length,

      closedDays: schedule.filter((day) => !day.isOpen).length,

      totalWeeklyMinutes,

      totalWeeklyHours: totalWeeklyMinutes / 60,
    },
  };
};

// ======================================================
// VALIDATE WEEKLY SCHEDULE
// ======================================================

const validateSchedule = (schedule) => {
  if (!Array.isArray(schedule) || schedule.length !== 7) {
    throw apiError("Schedule must contain all seven days of the week.");
  }

  const usedDays = new Set();
  const windows = [];

  for (const day of schedule) {
    if (!day || typeof day !== "object") {
      throw apiError("Invalid schedule day.");
    }

    const { dayOfWeek, isOpen } = day;

    if (!DAYS.includes(dayOfWeek)) {
      throw apiError("Invalid day of the week.");
    }

    if (usedDays.has(dayOfWeek)) {
      throw apiError(`Duplicate schedule for ${dayOfWeek}.`);
    }

    usedDays.add(dayOfWeek);

    if (typeof isOpen !== "boolean") {
      throw apiError(`isOpen must be a boolean for ${dayOfWeek}.`);
    }

    if (!Array.isArray(day.windows)) {
      throw apiError(`Operating windows are required for ${dayOfWeek}.`);
    }

    if (!isOpen) {
      if (day.windows.length > 0) {
        throw apiError(
          `${dayOfWeek} is closed and cannot contain operating windows.`,
        );
      }

      continue;
    }

    if (day.windows.length === 0) {
      throw apiError(`Add operating hours for ${dayOfWeek}.`);
    }

    if (day.windows.length > 24) {
      throw apiError(`Too many operating windows for ${dayOfWeek}.`);
    }

    const dailyWindows = day.windows.map((window) => {
      if (!window || typeof window !== "object") {
        throw apiError("Invalid operating window.");
      }

      const { opensAtMinutes, closesAtMinutes } = window;

      if (
        !Number.isInteger(opensAtMinutes) ||
        !Number.isInteger(closesAtMinutes)
      ) {
        throw apiError(`Operating times must be integers for ${dayOfWeek}.`);
      }

      if (
        opensAtMinutes < 0 ||
        opensAtMinutes >= 1440 ||
        closesAtMinutes <= 0 ||
        closesAtMinutes > 1440 ||
        opensAtMinutes >= closesAtMinutes
      ) {
        throw apiError(`Invalid opening or closing time for ${dayOfWeek}.`);
      }

      return {
        dayOfWeek,
        opensAtMinutes,
        closesAtMinutes,
      };
    });

    dailyWindows.sort((a, b) => a.opensAtMinutes - b.opensAtMinutes);

    // Prevent overlapping operating windows.

    for (let index = 1; index < dailyWindows.length; index++) {
      const previous = dailyWindows[index - 1];
      const current = dailyWindows[index];

      if (current.opensAtMinutes < previous.closesAtMinutes) {
        throw apiError(`Operating windows overlap on ${dayOfWeek}.`);
      }
    }

    windows.push(...dailyWindows);
  }

  // With our current schema, zero operating windows
  // means "not configured", rather than permanently closed.

  if (windows.length === 0) {
    throw apiError(
      "At least one operating window is required. Use room blocks for temporary full-week closures.",
    );
  }

  return windows;
};

// ======================================================
// TRANSACTION ERROR HANDLING
// ======================================================

const handleError = (error, next) => {
  if (error.code === "P2034") {
    return next(
      apiError(
        "The schedule was modified concurrently. Refresh and try again.",
        409,
      ),
    );
  }

  return next(error);
};

// ======================================================
// GET ALL ROOM OPERATING HOURS
// ======================================================

export const getOperatingHours = async (req, res, next) => {
  try {
    const rooms = await prisma.studioRoom.findMany({
      select: roomSelect,
      orderBy: {
        name: "asc",
      },
    });

    const formattedRooms = rooms.map(formatRoomSchedule);

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      timeZone: TIME_ZONE,
      count: rooms.length,

      summary: {
        totalRooms: rooms.length,

        activeRooms: rooms.filter((room) => room.isActive).length,

        configuredRooms: formattedRooms.filter((room) => room.configured)
          .length,

        totalWeeklyRoomHours: formattedRooms
          .filter((room) => room.isActive)
          .reduce((total, room) => total + room.summary.totalWeeklyHours, 0),
      },

      rooms: formattedRooms,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET SINGLE ROOM OPERATING HOURS
// ======================================================

export const getRoomOperatingHours = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.studioRoom.findUnique({
      where: {
        id: roomId,
      },
      select: roomSelect,
    });

    if (!room) {
      throw apiError("Studio room not found.", 404);
    }

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      timeZone: TIME_ZONE,
      room: formatRoomSchedule(room),
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// UPDATE ONE ROOM
// ======================================================

export const updateRoomOperatingHours = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const windows = validateSchedule(req.body?.schedule);

    const room = await prisma.$transaction(
      async (tx) => {
        const existingRoom = await tx.studioRoom.findUnique({
          where: {
            id: roomId,
          },
          select: {
            id: true,
          },
        });

        if (!existingRoom) {
          throw apiError("Studio room not found.", 404);
        }

        await tx.roomOperatingHours.deleteMany({
          where: {
            roomId,
          },
        });

        await tx.roomOperatingHours.createMany({
          data: windows.map((window) => ({
            roomId,
            ...window,
          })),
        });

        return tx.studioRoom.findUnique({
          where: {
            id: roomId,
          },
          select: roomSelect,
        });
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Operating hours updated successfully.",
      timeZone: TIME_ZONE,
      room: formatRoomSchedule(room),
    });
  } catch (error) {
    handleError(error, next);
  }
};

// ======================================================
// UPDATE MULTIPLE ROOMS
// ======================================================

export const updateBulkOperatingHours = async (req, res, next) => {
  try {
    const { roomIds, schedule } = req.body || {};

    if (
      !Array.isArray(roomIds) ||
      roomIds.length === 0 ||
      roomIds.length > 2 ||
      roomIds.some((id) => typeof id !== "string" || id.trim().length === 0)
    ) {
      throw apiError("Select one or two studio rooms.");
    }

    const selectedRoomIds = [...new Set(roomIds.map((id) => id.trim()))];

    const windows = validateSchedule(schedule);

    const rooms = await prisma.$transaction(
      async (tx) => {
        const existingRooms = await tx.studioRoom.findMany({
          where: {
            id: {
              in: selectedRoomIds,
            },
          },
          select: {
            id: true,
          },
        });

        if (existingRooms.length !== selectedRoomIds.length) {
          throw apiError("One or more studio rooms were not found.", 404);
        }

        await tx.roomOperatingHours.deleteMany({
          where: {
            roomId: {
              in: selectedRoomIds,
            },
          },
        });

        await tx.roomOperatingHours.createMany({
          data: selectedRoomIds.flatMap((roomId) =>
            windows.map((window) => ({
              roomId,
              ...window,
            })),
          ),
        });

        return tx.studioRoom.findMany({
          where: {
            id: {
              in: selectedRoomIds,
            },
          },
          select: roomSelect,
          orderBy: {
            name: "asc",
          },
        });
      },
      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Studio operating hours updated successfully.",
      timeZone: TIME_ZONE,
      count: rooms.length,
      rooms: rooms.map(formatRoomSchedule),
    });
  } catch (error) {
    handleError(error, next);
  }
};
