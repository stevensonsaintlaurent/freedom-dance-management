import prisma from "../lib/prisma.js";

// Get all active weekly classes
export const getWeeklyClassesService = async () => {
  return prisma.weeklyClass.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTimeMinutes: "asc" }],
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });
};

// Create a recurring weekly class
export const createWeeklyClassService = async (data) => {
  const instructor = await prisma.user.findFirst({
    where: {
      id: data.instructorId,
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
    const error = new Error("Instructor not found or not authorized to teach");
    error.statusCode = 400;
    throw error;
  }

  // Prevent overlapping weekly classes for the same instructor
  const overlappingClass = await prisma.weeklyClass.findFirst({
    where: {
      instructorId: instructor.id,
      dayOfWeek: data.dayOfWeek,
      isActive: true,
      startTimeMinutes: {
        lt: data.startTimeMinutes + data.durationMinutes,
      },
      AND: [
        {
          startTimeMinutes: {
            gte: 0,
          },
        },
      ],
    },
  });

  if (overlappingClass) {
    const existingEnd =
      overlappingClass.startTimeMinutes + overlappingClass.durationMinutes;

    if (existingEnd > data.startTimeMinutes) {
      const error = new Error(
        `Instructor already has a weekly class at this time: ${overlappingClass.title}`,
      );
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.weeklyClass.create({
    data: {
      title: data.title,
      description: data.description,
      level: data.level,
      dayOfWeek: data.dayOfWeek,
      startTimeMinutes: data.startTimeMinutes,
      durationMinutes: data.durationMinutes,
      capacity: data.capacity,
      priceCents: data.priceCents,
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
