import prisma from "../lib/prisma.js";

// ======================================
// GET ALL UPCOMING CLASSES
// ======================================

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

      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
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

// ======================================
// CREATE A NEW DANCE CLASS
// ======================================

export const createClassService = async (classData) => {
  const instructor = await prisma.user.findFirst({
    where: {
      id: classData.instructorId,
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
    const error = new Error("Instructor not found or not active");
    error.statusCode = 400;
    throw error;
  }

  const startsAt = new Date(classData.startsAt);
  const endsAt = new Date(classData.endsAt);

  // Check if the instructor has another class
  // that overlaps with the requested schedule.
  const overlappingClass = await prisma.danceClass.findFirst({
    where: {
      instructorId: instructor.id,
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
    },
  });

  if (overlappingClass) {
    const error = new Error(
      `Instructor already has a class scheduled at this time: ${overlappingClass.title}`,
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.danceClass.create({
    data: {
      title: classData.title,
      description: classData.description,
      level: classData.level,
      startsAt: new Date(classData.startsAt),
      endsAt: new Date(classData.endsAt),
      capacity: classData.capacity,
      priceCents: classData.priceCents,
      instructorId: instructor.id,
    },
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};
