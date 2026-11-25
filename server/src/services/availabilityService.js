import prisma from "../lib/prisma.js";

import {
  TIME_ZONE,
  apiError,
  parseDate,
  addDays,
  getDayOfWeek,
  getTodayInVegas,
  parseTime,
  localToUtc,
  getDayRange,
  overlaps,
} from "../utils/rentalDateTime.js";

// ======================================================
// CONFIGURATION
// ======================================================

const BLOCKING_RENTAL_STATUSES = ["PENDING", "APPROVED", "CONFIRMED"];

// ======================================================
// OPERATING HOURS
// ======================================================

const getOperatingHours = (room, date) => {
  const dayOfWeek = getDayOfWeek(date);

  const configured = room.operatingHours.length > 0;

  const windows = room.operatingHours
    .filter((item) => item.dayOfWeek === dayOfWeek)
    .map((item) => {
      if (
        item.opensAtMinutes < 0 ||
        item.closesAtMinutes > 1440 ||
        item.opensAtMinutes >= item.closesAtMinutes
      ) {
        throw apiError("Invalid room operating hours configuration.", 422);
      }

      return {
        opensAtMinutes: item.opensAtMinutes,
        closesAtMinutes: item.closesAtMinutes,
      };
    })
    .sort((a, b) => a.opensAtMinutes - b.opensAtMinutes);

  return {
    configured,
    windows,
  };
};

const isWithinOperatingHours = (operatingHours, startMinutes, endMinutes) => {
  if (!operatingHours.configured) {
    return null;
  }

  let coveredUntil = startMinutes;

  for (const window of operatingHours.windows) {
    if (window.opensAtMinutes > coveredUntil) {
      break;
    }

    if (window.closesAtMinutes > coveredUntil) {
      coveredUntil = window.closesAtMinutes;
    }

    if (coveredUntil >= endMinutes) {
      return true;
    }
  }

  return false;
};

// ======================================================
// EVENT FORMAT
// ======================================================

const createEvent = ({
  id,
  type,
  title,
  roomIds,
  startsAt,
  endsAt,
  status = null,
  unassigned = false,
}) => ({
  id,
  type,
  title,
  roomIds,
  startsAt,
  endsAt,
  status,
  unassigned,
});

// ======================================================
// DAILY AVAILABILITY
// ======================================================

export const getDailyAvailability = async (date, db = prisma) => {
  parseDate(date);

  const previousDate = addDays(date, -1);

  const dayOfWeek = getDayOfWeek(date);

  const previousDayOfWeek = getDayOfWeek(previousDate);

  const { startsAt, endsAt } = getDayRange(date);

  const [
    rooms,
    weeklyClasses,
    danceClasses,
    rentals,
    roomBlocks,
    studioCancellations,
    classCancellations,
  ] = await Promise.all([
    // Active studio rooms
    db.studioRoom.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        areaSquareFeet: true,
        operatingHours: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    // Include previous day for overnight weekly classes
    db.weeklyClass.findMany({
      where: {
        isActive: true,
        dayOfWeek: {
          in: [dayOfWeek, previousDayOfWeek],
        },
      },
      select: {
        id: true,
        title: true,
        roomId: true,
        dayOfWeek: true,
        startTimeMinutes: true,
        durationMinutes: true,
      },
    }),

    // Individually scheduled dance classes
    db.danceClass.findMany({
      where: {
        isActive: true,
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        id: true,
        title: true,
        roomId: true,
        startsAt: true,
        endsAt: true,
      },
    }),

    // Existing studio rentals
    db.studioRental.findMany({
      where: {
        status: {
          in: BLOCKING_RENTAL_STATUSES,
        },
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        startsAt: true,
        endsAt: true,
        category: {
          select: {
            name: true,
          },
        },
        rooms: {
          select: {
            roomId: true,
          },
        },
      },
    }),

    // Maintenance and unavailable periods
    db.roomBlock.findMany({
      where: {
        isActive: true,
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        id: true,
        roomId: true,
        reason: true,
        startsAt: true,
        endsAt: true,
      },
    }),

    // Studio-wide recurring class cancellations
    db.studioCancellation.findMany({
      where: {
        isActive: true,
        classDate: {
          in: [parseDate(date), parseDate(previousDate)],
        },
      },
      select: {
        classDate: true,
      },
    }),

    // Individual recurring class cancellations
    db.classCancellation.findMany({
      where: {
        isActive: true,
        classDate: {
          in: [parseDate(date), parseDate(previousDate)],
        },
      },
      select: {
        weeklyClassId: true,
        classDate: true,
      },
    }),
  ]);

  const allRoomIds = rooms.map((room) => room.id);

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

  const events = [];

  // ====================================================
  // RECURRING WEEKLY CLASSES
  // ====================================================

  for (const weeklyClass of weeklyClasses) {
    const occurrenceDate =
      weeklyClass.dayOfWeek === dayOfWeek ? date : previousDate;

    if (
      cancelledStudioDates.has(occurrenceDate) ||
      cancelledClassDates.has(`${weeklyClass.id}:${occurrenceDate}`)
    ) {
      continue;
    }

    if (
      weeklyClass.startTimeMinutes < 0 ||
      weeklyClass.startTimeMinutes >= 1440 ||
      weeklyClass.durationMinutes <= 0 ||
      weeklyClass.durationMinutes > 1440
    ) {
      throw apiError("A weekly class has an invalid schedule.", 422);
    }

    const classStart = localToUtc(occurrenceDate, weeklyClass.startTimeMinutes);

    const classEnd = new Date(
      classStart.getTime() + weeklyClass.durationMinutes * 60 * 1000,
    );

    if (!overlaps(classStart, classEnd, startsAt, endsAt)) {
      continue;
    }

    const unassigned = !weeklyClass.roomId;

    events.push(
      createEvent({
        id: `${weeklyClass.id}:${occurrenceDate}`,
        type: "WEEKLY_CLASS",
        title: weeklyClass.title,
        roomIds: unassigned ? allRoomIds : [weeklyClass.roomId],
        startsAt: classStart,
        endsAt: classEnd,
        unassigned,
      }),
    );
  }

  // ====================================================
  // INDIVIDUAL DANCE CLASSES
  // ====================================================

  for (const danceClass of danceClasses) {
    const unassigned = !danceClass.roomId;

    events.push(
      createEvent({
        id: danceClass.id,
        type: "DANCE_CLASS",
        title: danceClass.title,
        roomIds: unassigned ? allRoomIds : [danceClass.roomId],
        startsAt: danceClass.startsAt,
        endsAt: danceClass.endsAt,
        unassigned,
      }),
    );
  }

  // ====================================================
  // STUDIO RENTALS
  // ====================================================

  for (const rental of rentals) {
    const assignedRoomIds = rental.rooms.map((room) => room.roomId);

    const unassigned = assignedRoomIds.length === 0;

    events.push(
      createEvent({
        id: rental.id,
        type: "RENTAL",
        title: rental.category?.name || "Studio Rental",
        roomIds: unassigned ? allRoomIds : assignedRoomIds,
        startsAt: rental.startsAt,
        endsAt: rental.endsAt,
        status: rental.status,
        unassigned,
      }),
    );
  }

  // ====================================================
  // ROOM BLOCKS
  // ====================================================

  for (const block of roomBlocks) {
    events.push(
      createEvent({
        id: block.id,
        type: "ROOM_BLOCK",
        title: block.reason || "Unavailable",
        roomIds: [block.roomId],
        startsAt: block.startsAt,
        endsAt: block.endsAt,
      }),
    );
  }

  events.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  // ====================================================
  // ORGANIZE EVENTS BY ROOM
  // ====================================================

  const roomSchedules = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    areaSquareFeet: room.areaSquareFeet,
    operatingHours: getOperatingHours(room, date),

    events: events.filter((event) => event.roomIds.includes(room.id)),
  }));

  return {
    date,
    dayOfWeek,
    timeZone: TIME_ZONE,
    startsAt,
    endsAt,
    rooms: roomSchedules,

    summary: {
      totalRooms: rooms.length,

      weeklyClasses: events.filter((event) => event.type === "WEEKLY_CLASS")
        .length,

      danceClasses: events.filter((event) => event.type === "DANCE_CLASS")
        .length,

      rentals: events.filter((event) => event.type === "RENTAL").length,

      roomBlocks: events.filter((event) => event.type === "ROOM_BLOCK").length,

      unassignedEvents: events.filter((event) => event.unassigned).length,
    },
  };
};

// ======================================================
// PUBLIC DAILY AVAILABILITY
// ======================================================

export const getPublicDailyAvailability = async (date) => {
  const calendar = await getDailyAvailability(date);

  return {
    date: calendar.date,
    dayOfWeek: calendar.dayOfWeek,
    timeZone: calendar.timeZone,

    rooms: calendar.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      operatingHours: room.operatingHours,

      // Do not expose private event information.
      busyPeriods: room.events.map((event) => ({
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      })),
    })),
  };
};

// ======================================================
// CHECK A SPECIFIC RENTAL PERIOD
// ======================================================

export const checkAvailability = async (
  { date, startTime, durationMinutes, roomIds, entireStudio = false },
  db = prisma,
) => {
  parseDate(date);

  if (date < getTodayInVegas()) {
    throw apiError("Cannot check availability for a past date.");
  }

  const startMinutes = parseTime(startTime);

  const duration = Number(durationMinutes);

  if (!Number.isSafeInteger(duration) || duration < 1 || duration > 1440) {
    throw apiError("Invalid rental duration.");
  }

  const endMinutes = startMinutes + duration;

  if (endMinutes > 1440) {
    throw apiError("Overnight rentals require management approval.");
  }

  const startsAt = localToUtc(date, startMinutes);
  const endsAt = localToUtc(date, endMinutes);

  if (startsAt <= new Date()) {
    throw apiError("Rental start time must be in the future.");
  }

  const calendar = await getDailyAvailability(date, db);

  const selectedRoomIds = entireStudio
    ? calendar.rooms.map((room) => room.id)
    : [...new Set(roomIds || [])];

  if (entireStudio && selectedRoomIds.length !== 2) {
    throw apiError("Both studio rooms must be active.", 409);
  }

  if (!selectedRoomIds.length) {
    throw apiError("Select at least one room.");
  }

  const selectedRooms = selectedRoomIds.map((roomId) => {
    const room = calendar.rooms.find((item) => item.id === roomId);

    if (!room) {
      throw apiError("One or more selected rooms are unavailable.", 404);
    }

    return room;
  });

  const roomResults = selectedRooms.map((room) => {
    const conflicts = room.events.filter((event) =>
      overlaps(startsAt, endsAt, event.startsAt, event.endsAt),
    );

    const withinOperatingHours = isWithinOperatingHours(
      room.operatingHours,
      startMinutes,
      endMinutes,
    );

    const hasConflict = conflicts.length > 0;

    let status = "AVAILABLE";

    if (hasConflict || withinOperatingHours === false) {
      status = "UNAVAILABLE";
    } else if (withinOperatingHours === null) {
      status = "REQUIRES_REVIEW";
    }

    return {
      roomId: room.id,
      roomName: room.name,
      status,
      available: status === "AVAILABLE",
      hasConflict,
      withinOperatingHours,

      conflicts: conflicts.map((event) => ({
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      })),
    };
  });

  const unavailable = roomResults.some((room) => room.status === "UNAVAILABLE");

  const requiresReview = roomResults.some(
    (room) => room.status === "REQUIRES_REVIEW",
  );

  const status = unavailable
    ? "UNAVAILABLE"
    : requiresReview
      ? "REQUIRES_REVIEW"
      : "AVAILABLE";

  return {
    date,
    timeZone: TIME_ZONE,
    startsAt,
    endsAt,
    durationMinutes: duration,
    entireStudio,
    status,
    available: status === "AVAILABLE",
    rooms: roomResults,

    message:
      status === "AVAILABLE"
        ? "No scheduling conflicts found."
        : status === "REQUIRES_REVIEW"
          ? "Operating hours require management confirmation."
          : "One or more selected rooms are unavailable.",
  };
};
