import prisma from "../lib/prisma.js";

import {
  parseDate,
  addDays,
  getDayOfWeek,
  localToUtc,
  overlaps,
} from "../utils/rentalDateTime.js";

// ======================================================
// CONFIGURATION
// ======================================================

const TIME_ZONE = "America/Los_Angeles";

const BLOCKING_RENTAL_STATUSES = ["PENDING", "APPROVED", "CONFIRMED"];

const INSTRUCTOR_ROLES = ["INSTRUCTOR", "MANAGER", "ADMIN"];

const instructorSelect = {
  id: true,
  firstName: true,
  lastName: true,
};

const roomSelect = {
  id: true,
  name: true,
  capacity: true,
  areaSquareFeet: true,
  isActive: true,
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// ======================================================
// ERROR HELPER
// ======================================================

const apiError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.status = statusCode;

  return error;
};

// ======================================================
// DATE AND TIME UTILITIES
// ======================================================

const getLocalDate = (date) => {
  const parts = Object.fromEntries(
    dateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatDateTime = (date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

const validateClassDates = (startsAt, endsAt) => {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw apiError("Invalid class date or time.");
  }

  if (endsAt <= startsAt) {
    throw apiError("End time must be after start time.");
  }

  if (startsAt <= new Date()) {
    throw apiError("Please choose a future class date.");
  }

  // Individual classes are limited to 24 hours.
  const duration = endsAt.getTime() - startsAt.getTime();

  if (duration > 24 * 60 * 60 * 1000) {
    throw apiError("A dance class cannot exceed 24 hours.");
  }
};

// ======================================================
// TRANSACTION HELPER
// ======================================================

const runTransaction = async (callback) => {
  try {
    return await prisma.$transaction(callback, {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 20000,
    });
  } catch (error) {
    if (error.code === "P2034") {
      throw apiError(
        "The studio schedule changed during this operation. " +
          "Please refresh and try again.",
        409,
      );
    }

    throw error;
  }
};

// ======================================================
// VALIDATE INSTRUCTOR
// ======================================================

const validateInstructor = async (tx, instructorId) => {
  const instructor = await tx.user.findFirst({
    where: {
      id: instructorId,

      role: {
        in: INSTRUCTOR_ROLES,
      },

      isActive: true,
    },

    select: {
      id: true,
    },
  });

  if (!instructor) {
    throw apiError("Instructor not found or not active.");
  }

  return instructor;
};

// ======================================================
// VALIDATE STUDIO ROOM
// ======================================================

const validateRoom = async (tx, roomId) => {
  if (!roomId) {
    return null;
  }

  const room = await tx.studioRoom.findUnique({
    where: {
      id: roomId,
    },

    include: {
      operatingHours: true,
    },
  });

  if (!room) {
    throw apiError("Studio room not found.", 404);
  }

  if (!room.isActive) {
    throw apiError("The selected studio room is inactive.", 409);
  }

  return room;
};

// ======================================================
// VALIDATE ROOM CAPACITY
// ======================================================

const validateCapacity = (room, capacity) => {
  if (room && room.capacity !== null && capacity > room.capacity) {
    throw apiError(
      `Class capacity exceeds the configured capacity ` +
        `of ${room.name} (${room.capacity}).`,
    );
  }
};

// ======================================================
// CHECK INDIVIDUAL DANCE CLASS CONFLICTS
// ======================================================

const checkDanceClassConflicts = async (tx, data, excludeClassId = null) => {
  const candidates = await tx.danceClass.findMany({
    where: {
      isActive: true,

      startsAt: {
        lt: data.endsAt,
      },

      endsAt: {
        gt: data.startsAt,
      },

      ...(excludeClassId
        ? {
            id: {
              not: excludeClassId,
            },
          }
        : {}),
    },

    select: {
      id: true,
      title: true,
      instructorId: true,
      roomId: true,
      startsAt: true,
      endsAt: true,
    },
  });

  // Instructor conflicts apply regardless of room.

  const instructorConflict = candidates.find(
    (item) => item.instructorId === data.instructorId,
  );

  if (instructorConflict) {
    throw apiError(
      `Instructor already has a class scheduled ` +
        `at this time: ${instructorConflict.title}.`,
      409,
    );
  }

  // Unassigned classes conservatively block all rooms.

  const roomConflict = candidates.find(
    (item) => !data.roomId || !item.roomId || item.roomId === data.roomId,
  );

  if (roomConflict) {
    throw apiError(
      `Studio room conflicts with "${roomConflict.title}" ` +
        `on ${formatDateTime(roomConflict.startsAt)}.`,
      409,
    );
  }
};

// ======================================================
// CHECK RECURRING WEEKLY CLASS CONFLICTS
// ======================================================

const checkWeeklyClassConflicts = async (tx, data) => {
  // Include the previous date to account for
  // legacy classes that may extend past midnight.

  const firstDate = addDays(getLocalDate(data.startsAt), -1);

  const lastDate = getLocalDate(data.endsAt);

  const dates = [];

  let currentDate = firstDate;

  while (currentDate <= lastDate) {
    dates.push(currentDate);

    currentDate = addDays(currentDate, 1);
  }

  const days = [...new Set(dates.map((date) => getDayOfWeek(date)))];

  const [weeklyClasses, studioCancellations, classCancellations] =
    await Promise.all([
      tx.weeklyClass.findMany({
        where: {
          isActive: true,

          dayOfWeek: {
            in: days,
          },

          ...(data.roomId
            ? {
                OR: [
                  {
                    instructorId: data.instructorId,
                  },
                  {
                    roomId: data.roomId,
                  },
                  {
                    roomId: null,
                  },
                ],
              }
            : {}),
        },

        select: {
          id: true,
          title: true,
          dayOfWeek: true,
          startTimeMinutes: true,
          durationMinutes: true,
          instructorId: true,
          roomId: true,
        },
      }),

      tx.studioCancellation.findMany({
        where: {
          isActive: true,

          classDate: {
            gte: new Date(`${firstDate}T00:00:00.000Z`),
            lte: new Date(`${lastDate}T00:00:00.000Z`),
          },
        },

        select: {
          classDate: true,
        },
      }),

      tx.classCancellation.findMany({
        where: {
          isActive: true,

          classDate: {
            gte: new Date(`${firstDate}T00:00:00.000Z`),
            lte: new Date(`${lastDate}T00:00:00.000Z`),
          },
        },

        select: {
          weeklyClassId: true,
          classDate: true,
        },
      }),
    ]);

  const cancelledStudioDates = new Set(
    studioCancellations.map((item) =>
      item.classDate.toISOString().slice(0, 10),
    ),
  );

  const cancelledClassDates = new Set(
    classCancellations.map(
      (item) =>
        `${item.weeklyClassId}:` + item.classDate.toISOString().slice(0, 10),
    ),
  );

  for (const date of dates) {
    // Skip cancelled recurring class occurrences.

    if (cancelledStudioDates.has(date)) {
      continue;
    }

    const dayOfWeek = getDayOfWeek(date);

    const dailyClasses = weeklyClasses.filter(
      (item) => item.dayOfWeek === dayOfWeek,
    );

    for (const weeklyClass of dailyClasses) {
      if (cancelledClassDates.has(`${weeklyClass.id}:${date}`)) {
        continue;
      }

      if (
        !Number.isInteger(weeklyClass.startTimeMinutes) ||
        weeklyClass.startTimeMinutes < 0 ||
        weeklyClass.startTimeMinutes > 1439 ||
        !Number.isInteger(weeklyClass.durationMinutes) ||
        weeklyClass.durationMinutes < 1 ||
        weeklyClass.durationMinutes > 1440
      ) {
        throw apiError(
          `Invalid existing schedule for "${weeklyClass.title}". ` +
            "Management review is required.",
          409,
        );
      }

      const occurrenceStart = localToUtc(date, weeklyClass.startTimeMinutes);

      const occurrenceEnd = new Date(
        occurrenceStart.getTime() + weeklyClass.durationMinutes * 60 * 1000,
      );

      const hasConflict = overlaps(
        data.startsAt,
        data.endsAt,
        occurrenceStart,
        occurrenceEnd,
      );

      if (!hasConflict) {
        continue;
      }

      if (weeklyClass.instructorId === data.instructorId) {
        throw apiError(
          `Instructor already teaches the weekly class ` +
            `"${weeklyClass.title}" on ${date}.`,
          409,
        );
      }

      if (
        !data.roomId ||
        !weeklyClass.roomId ||
        weeklyClass.roomId === data.roomId
      ) {
        throw apiError(
          `Studio room conflicts with the weekly class ` +
            `"${weeklyClass.title}" on ${date}.`,
          409,
        );
      }
    }
  }
};

// ======================================================
// CHECK STUDIO RENTAL CONFLICTS
// ======================================================

const checkRentalConflicts = async (tx, data) => {
  const rental = await tx.studioRental.findFirst({
    where: {
      status: {
        in: BLOCKING_RENTAL_STATUSES,
      },

      startsAt: {
        lt: data.endsAt,
      },

      endsAt: {
        gt: data.startsAt,
      },

      ...(data.roomId
        ? {
            OR: [
              {
                rooms: {
                  some: {
                    roomId: data.roomId,
                  },
                },
              },
              {
                rooms: {
                  none: {},
                },
              },
            ],
          }
        : {}),
    },

    select: {
      id: true,
      reference: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  });

  if (rental) {
    throw apiError(
      `The selected studio room has an existing rental ` +
        `on ${formatDateTime(rental.startsAt)}. ` +
        `Reference: ${rental.reference}.`,
      409,
    );
  }
};

// ======================================================
// CHECK ROOM BLOCKS AND HOLIDAY CLOSURES
// ======================================================

const checkRoomBlockConflicts = async (tx, data) => {
  const roomBlock = await tx.roomBlock.findFirst({
    where: {
      isActive: true,

      startsAt: {
        lt: data.endsAt,
      },

      endsAt: {
        gt: data.startsAt,
      },

      ...(data.roomId
        ? {
            roomId: data.roomId,
          }
        : {}),
    },

    select: {
      id: true,
      reason: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (roomBlock) {
    throw apiError(
      `The studio room is unavailable. ` + `Reason: ${roomBlock.reason}.`,
      409,
    );
  }
};

// ======================================================
// OPERATING HOURS WARNINGS
// ======================================================

const getOperatingHoursWarnings = (room, startsAt, endsAt) => {
  if (!room) {
    return ["No room assigned. This class blocks both studio rooms."];
  }

  if (!room.operatingHours.length) {
    return ["Operating hours are not configured for this room."];
  }

  const firstDate = getLocalDate(startsAt);
  const lastDate = getLocalDate(endsAt);

  const windows = [];

  let date = firstDate;

  while (date <= lastDate) {
    const dayOfWeek = getDayOfWeek(date);

    const dailyHours = room.operatingHours.filter(
      (item) => item.dayOfWeek === dayOfWeek,
    );

    for (const item of dailyHours) {
      if (
        item.opensAtMinutes < 0 ||
        item.closesAtMinutes > 1440 ||
        item.opensAtMinutes >= item.closesAtMinutes
      ) {
        continue;
      }

      try {
        windows.push({
          startsAt: localToUtc(date, item.opensAtMinutes),

          endsAt: localToUtc(date, item.closesAtMinutes),
        });
      } catch (error) {
        return [
          "Operating hours require manual review " +
            "because of a date or daylight-saving transition.",
        ];
      }
    }

    date = addDays(date, 1);
  }

  windows.sort((a, b) => a.startsAt - b.startsAt);

  let coveredUntil = startsAt.getTime();

  for (const window of windows) {
    const windowStart = window.startsAt.getTime();
    const windowEnd = window.endsAt.getTime();

    if (windowEnd <= coveredUntil) {
      continue;
    }

    if (windowStart > coveredUntil) {
      break;
    }

    coveredUntil = Math.max(coveredUntil, windowEnd);

    if (coveredUntil >= endsAt.getTime()) {
      return [];
    }
  }

  return [
    "This class takes place outside regular studio " +
      "operating hours. Management review is required.",
  ];
};

// ======================================================
// SHARED SCHEDULE VALIDATION
// ======================================================

const validateSchedule = async (tx, data, excludeClassId = null) => {
  await checkDanceClassConflicts(tx, data, excludeClassId);

  await checkWeeklyClassConflicts(tx, data);

  await checkRentalConflicts(tx, data);

  await checkRoomBlockConflicts(tx, data);
};

// ======================================================
// GET ALL UPCOMING CLASSES
// ======================================================

export const getAllClassesService = async () => {
  const classes = await prisma.danceClass.findMany({
    where: {
      isActive: true,

      startsAt: {
        gte: new Date(),
      },
    },

    orderBy: {
      startsAt: "asc",
    },

    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      priceCents: true,
      instructorId: true,
      roomId: true,

      instructor: {
        select: instructorSelect,
      },

      room: {
        select: roomSelect,
      },

      _count: {
        select: {
          bookings: {
            where: {
              status: "CONFIRMED",
            },
          },
        },
      },
    },
  });

  return classes.map((danceClass) => {
    const confirmedBookings = danceClass._count.bookings;

    const { _count, ...classData } = danceClass;

    return {
      ...classData,

      confirmedBookings,

      availableSpots: Math.max(0, danceClass.capacity - confirmedBookings),
    };
  });
};

// ======================================================
// CREATE A NEW INDIVIDUAL DANCE CLASS
// ======================================================

export const createClassService = async (classData) => {
  const startsAt = new Date(classData.startsAt);
  const endsAt = new Date(classData.endsAt);

  validateClassDates(startsAt, endsAt);

  return runTransaction(async (tx) => {
    const instructor = await validateInstructor(tx, classData.instructorId);

    const room = await validateRoom(tx, classData.roomId);

    validateCapacity(room, classData.capacity);

    const data = {
      title: classData.title,
      description: classData.description,
      level: classData.level,
      startsAt,
      endsAt,
      capacity: classData.capacity,
      priceCents: classData.priceCents,
      instructorId: instructor.id,
      roomId: room?.id || null,
    };

    await validateSchedule(tx, data);

    const danceClass = await tx.danceClass.create({
      data,

      include: {
        instructor: {
          select: instructorSelect,
        },

        room: {
          select: roomSelect,
        },
      },
    });

    return {
      ...danceClass,

      confirmedBookings: 0,

      availableSpots: danceClass.capacity,

      warnings: getOperatingHoursWarnings(room, startsAt, endsAt),
    };
  });
};

// ======================================================
// ASSIGN OR CHANGE INDIVIDUAL CLASS ROOM
// ======================================================

export const assignDanceClassRoomService = async (classId, roomId) => {
  return runTransaction(async (tx) => {
    const existingClass = await tx.danceClass.findUnique({
      where: {
        id: classId,
      },
    });

    if (!existingClass) {
      throw apiError("Dance class not found.", 404);
    }

    if (!existingClass.isActive) {
      throw apiError("Cannot assign a room to an inactive class.", 409);
    }

    if (existingClass.startsAt <= new Date()) {
      throw apiError(
        "Cannot change the room of a class " + "that has already started.",
        409,
      );
    }

    const room = await validateRoom(tx, roomId);

    validateCapacity(room, existingClass.capacity);

    const updatedData = {
      ...existingClass,
      roomId: room?.id || null,
    };

    await validateSchedule(tx, updatedData, classId);

    const danceClass = await tx.danceClass.update({
      where: {
        id: classId,
      },

      data: {
        roomId: room?.id || null,
      },

      include: {
        instructor: {
          select: instructorSelect,
        },

        room: {
          select: roomSelect,
        },

        _count: {
          select: {
            bookings: {
              where: {
                status: "CONFIRMED",
              },
            },
          },
        },
      },
    });

    const { _count, ...classData } = danceClass;

    return {
      ...classData,

      confirmedBookings: _count.bookings,

      availableSpots: Math.max(0, danceClass.capacity - _count.bookings),

      warnings: getOperatingHoursWarnings(
        room,
        danceClass.startsAt,
        danceClass.endsAt,
      ),
    };
  });
};
