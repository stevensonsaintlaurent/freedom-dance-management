import prisma from "../lib/prisma.js";

// ======================================================
// CONFIGURATION
// ======================================================

const TIME_ZONE = "America/Los_Angeles";

const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const BLOCKING_RENTAL_STATUSES = ["PENDING", "APPROVED", "CONFIRMED"];

const classInclude = {
  instructor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },

  room: {
    select: {
      id: true,
      name: true,
      capacity: true,
      areaSquareFeet: true,
      isActive: true,
    },
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
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
// TIME UTILITIES
// ======================================================

const overlaps = (firstStart, firstEnd, secondStart, secondEnd) => {
  return firstStart < secondEnd && firstEnd > secondStart;
};

const formatTime = (minutes) => {
  if (minutes === 1440) return "12:00 AM";

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${hour % 12 || 12}:${String(minute).padStart(
    2,
    "0",
  )} ${hour >= 12 ? "PM" : "AM"}`;
};

const getLocalDateParts = (date) => {
  const parts = Object.fromEntries(
    dateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,

    dayOfWeek: parts.weekday.toUpperCase(),

    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

const addDays = (date, amount) => {
  const result = new Date(`${date}T00:00:00.000Z`);

  result.setUTCDate(result.getUTCDate() + amount);

  return result.toISOString().slice(0, 10);
};

// ======================================================
// CHECK RECURRING CLASS AGAINST DATED ACTIVITY
// ======================================================

const findOccurrenceConflict = (
  weeklyClass,
  startsAt,
  endsAt,
  cancelledDates = new Set(),
) => {
  const start = getLocalDateParts(new Date(startsAt));
  const end = getLocalDateParts(new Date(endsAt));

  const targetDay = DAYS.indexOf(weeklyClass.dayOfWeek);

  const startDate = new Date(`${start.date}T00:00:00.000Z`);

  const offset = (targetDay - startDate.getUTCDay() + 7) % 7;

  let date = addDays(start.date, offset);

  const classStart = weeklyClass.startTimeMinutes;

  const classEnd = classStart + weeklyClass.durationMinutes;

  while (date <= end.date) {
    if (!cancelledDates.has(date)) {
      const activityStart = date === start.date ? start.minutes : 0;

      const activityEnd = date === end.date ? end.minutes : 1440;

      // Conservatively include activities during
      // daylight-saving clock transitions.
      const ambiguousInterval =
        start.date === end.date &&
        activityEnd <= activityStart &&
        new Date(endsAt) > new Date(startsAt);

      if (
        ambiguousInterval ||
        overlaps(classStart, classEnd, activityStart, activityEnd)
      ) {
        return date;
      }
    }

    date = addDays(date, 7);
  }

  return null;
};

// ======================================================
// VALIDATE INSTRUCTOR
// ======================================================

const validateInstructor = async (tx, instructorId) => {
  const instructor = await tx.user.findFirst({
    where: {
      id: instructorId,

      role: {
        in: ["INSTRUCTOR", "MANAGER", "ADMIN"],
      },

      isActive: true,
    },

    select: {
      id: true,
    },
  });

  if (!instructor) {
    throw apiError("Instructor not found or not authorized to teach.");
  }

  return instructor;
};

// ======================================================
// VALIDATE STUDIO ROOM
// ======================================================

const validateRoom = async (tx, roomId) => {
  if (!roomId) return null;

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
// CHECK ROOM CAPACITY
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
// CHECK RECURRING WEEKLY CLASS CONFLICTS
// ======================================================

const checkWeeklyClassConflicts = async (tx, data, excludeClassId = null) => {
  const start = data.startTimeMinutes;
  const end = start + data.durationMinutes;

  const candidates = await tx.weeklyClass.findMany({
    where: {
      isActive: true,

      dayOfWeek: data.dayOfWeek,

      startTimeMinutes: {
        lt: end,
      },

      ...(excludeClassId
        ? {
            id: {
              not: excludeClassId,
            },
          }
        : {}),
    },

    include: classInclude,
  });

  const conflictingClasses = candidates.filter((weeklyClass) =>
    overlaps(
      start,
      end,
      weeklyClass.startTimeMinutes,
      weeklyClass.startTimeMinutes + weeklyClass.durationMinutes,
    ),
  );

  // Always prevent instructor double-booking.

  const instructorConflict = conflictingClasses.find(
    (weeklyClass) => weeklyClass.instructorId === data.instructorId,
  );

  if (instructorConflict) {
    throw apiError(
      `Instructor already teaches "${instructorConflict.title}" ` +
        `at this time.`,
      409,
    );
  }

  // Unassigned classes conservatively occupy both rooms.

  const roomConflict = conflictingClasses.find(
    (weeklyClass) =>
      !data.roomId || !weeklyClass.roomId || weeklyClass.roomId === data.roomId,
  );

  if (roomConflict) {
    throw apiError(
      `Studio room conflicts with "${roomConflict.title}" ` +
        `(${formatTime(roomConflict.startTimeMinutes)} - ` +
        `${formatTime(
          roomConflict.startTimeMinutes + roomConflict.durationMinutes,
        )}).`,
      409,
    );
  }
};

// ======================================================
// GET CANCELLED OCCURRENCE DATES
// ======================================================

const getCancelledDates = async (tx, weeklyClassId = null) => {
  const [studioCancellations, classCancellations] = await Promise.all([
    tx.studioCancellation.findMany({
      where: {
        isActive: true,
      },

      select: {
        classDate: true,
      },
    }),

    weeklyClassId
      ? tx.classCancellation.findMany({
          where: {
            weeklyClassId,
            isActive: true,
          },

          select: {
            classDate: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return new Set(
    [...studioCancellations, ...classCancellations].map((item) =>
      new Date(item.classDate).toISOString().slice(0, 10),
    ),
  );
};

// ======================================================
// CHECK INDIVIDUAL CLASSES, RENTALS AND ROOM BLOCKS
// ======================================================

const checkDatedConflicts = async (tx, data, weeklyClassId = null) => {
  const now = new Date();

  const cancelledDates = await getCancelledDates(tx, weeklyClassId);

  const [danceClasses, rentals, roomBlocks] = await Promise.all([
    // Individual dance classes

    tx.danceClass.findMany({
      where: {
        isActive: true,

        endsAt: {
          gt: now,
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
        instructorId: true,
        roomId: true,
        startsAt: true,
        endsAt: true,
      },
    }),

    // Existing studio rentals

    tx.studioRental.findMany({
      where: {
        status: {
          in: BLOCKING_RENTAL_STATUSES,
        },

        endsAt: {
          gt: now,
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
    }),

    // Maintenance and temporary room closures

    tx.roomBlock.findMany({
      where: {
        isActive: true,

        endsAt: {
          gt: now,
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
    }),
  ]);

  // Ignore elapsed portions of activities.

  const getConflictDate = (activity) =>
    findOccurrenceConflict(
      data,

      new Date(Math.max(now.getTime(), new Date(activity.startsAt).getTime())),

      activity.endsAt,

      cancelledDates,
    );

  // Individual class conflicts

  for (const danceClass of danceClasses) {
    const conflictDate = getConflictDate(danceClass);

    if (conflictDate) {
      throw apiError(
        `Schedule conflicts with "${danceClass.title}" ` +
          `on ${conflictDate}.`,
        409,
      );
    }
  }

  // Rental conflicts

  for (const rental of rentals) {
    const conflictDate = getConflictDate(rental);

    if (conflictDate) {
      throw apiError(
        `Studio room has an existing rental ` +
          `on ${conflictDate}. ` +
          `Reference: ${rental.reference}.`,
        409,
      );
    }
  }

  // Room block conflicts

  for (const block of roomBlocks) {
    const conflictDate = getConflictDate(block);

    if (conflictDate) {
      throw apiError(
        `Studio room is blocked on ${conflictDate}. ` +
          `Reason: ${block.reason}.`,
        409,
      );
    }
  }
};

// ======================================================
// OPERATING HOURS WARNINGS
// ======================================================

const getOperatingHoursWarnings = (room, data) => {
  if (!room) {
    return ["No room assigned. This class blocks both studio rooms."];
  }

  if (!room.operatingHours.length) {
    return ["Operating hours are not configured for this room."];
  }

  const windows = room.operatingHours
    .filter((window) => window.dayOfWeek === data.dayOfWeek)
    .sort((a, b) => a.opensAtMinutes - b.opensAtMinutes);

  const start = data.startTimeMinutes;
  const end = start + data.durationMinutes;

  let coveredUntil = start;

  for (const window of windows) {
    if (window.closesAtMinutes <= coveredUntil) {
      continue;
    }

    if (window.opensAtMinutes > coveredUntil) {
      break;
    }

    coveredUntil = Math.max(coveredUntil, window.closesAtMinutes);

    if (coveredUntil >= end) {
      return [];
    }
  }

  return [
    "This class takes place outside regular studio " +
      "operating hours. Management authorization is required.",
  ];
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
          "Refresh and try again.",
        409,
      );
    }

    throw error;
  }
};

// ======================================================
// GET ALL ACTIVE WEEKLY CLASSES
// ======================================================

export const getWeeklyClassesService = async () => {
  return prisma.weeklyClass.findMany({
    where: {
      isActive: true,
    },

    orderBy: [
      {
        dayOfWeek: "asc",
      },
      {
        startTimeMinutes: "asc",
      },
    ],

    include: classInclude,
  });
};

// ======================================================
// CREATE A RECURRING WEEKLY CLASS
// ======================================================

export const createWeeklyClassService = async (data) => {
  return runTransaction(async (tx) => {
    const instructor = await validateInstructor(tx, data.instructorId);

    const room = await validateRoom(tx, data.roomId);

    validateCapacity(room, data.capacity);

    const classData = {
      title: data.title,
      description: data.description,
      level: data.level,
      dayOfWeek: data.dayOfWeek,
      startTimeMinutes: data.startTimeMinutes,
      durationMinutes: data.durationMinutes,
      capacity: data.capacity,
      priceCents: data.priceCents,
      instructorId: instructor.id,
      roomId: room?.id || null,
    };

    await checkWeeklyClassConflicts(tx, classData);

    await checkDatedConflicts(tx, classData);

    const weeklyClass = await tx.weeklyClass.create({
      data: classData,

      include: classInclude,
    });

    return {
      ...weeklyClass,

      warnings: getOperatingHoursWarnings(room, classData),
    };
  });
};

// ======================================================
// ASSIGN OR CHANGE WEEKLY CLASS ROOM
// ======================================================

export const assignWeeklyClassRoomService = async (weeklyClassId, roomId) => {
  return runTransaction(async (tx) => {
    const existingClass = await tx.weeklyClass.findUnique({
      where: {
        id: weeklyClassId,
      },
    });

    if (!existingClass) {
      throw apiError("Weekly class not found.", 404);
    }

    if (!existingClass.isActive) {
      throw apiError("Cannot assign a room to an inactive class.", 409);
    }

    const room = await validateRoom(tx, roomId);

    validateCapacity(room, existingClass.capacity);

    const updatedData = {
      ...existingClass,
      roomId: room?.id || null,
    };

    await checkWeeklyClassConflicts(tx, updatedData, weeklyClassId);

    await checkDatedConflicts(tx, updatedData, weeklyClassId);

    const weeklyClass = await tx.weeklyClass.update({
      where: {
        id: weeklyClassId,
      },

      data: {
        roomId: room?.id || null,
      },

      include: classInclude,
    });

    return {
      ...weeklyClass,

      warnings: getOperatingHoursWarnings(room, updatedData),
    };
  });
};
