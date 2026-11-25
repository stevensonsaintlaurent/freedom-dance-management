import prisma from "../lib/prisma.js";

// ==========================================
// HELPERS
// ==========================================

const roomCounts = {
  weeklyClasses: true,
  danceClasses: true,
  rentals: true,
};

const validateRoom = (data) => {
  const errors = [];

  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (!name || name.length > 100) {
    errors.push("Room name must contain 1–100 characters.");
  }

  const parsePositiveInteger = (value, label) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const number = Number(value);

    if (
      !["string", "number"].includes(typeof value) ||
      !Number.isSafeInteger(number) ||
      number <= 0 ||
      number > 2147483647
    ) {
      errors.push(`${label} must be a positive integer.`);
      return null;
    }

    return number;
  };

  const capacity = parsePositiveInteger(data.capacity, "Capacity");

  const areaSquareFeet = parsePositiveInteger(data.areaSquareFeet, "Room size");

  const parseStringArray = (value, label) => {
    if (value === undefined || value === null) return [];

    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string")
    ) {
      errors.push(`${label} must be an array of strings.`);
      return [];
    }

    return [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  };

  const amenities = parseStringArray(data.amenities, "Amenities");

  const photoUrls = parseStringArray(data.photoUrls, "Photo URLs");

  for (const url of photoUrls) {
    try {
      const parsedUrl = new URL(url);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      errors.push(`Invalid photo URL: ${url}`);
    }
  }

  if (data.description != null && typeof data.description !== "string") {
    errors.push("Description must be a string.");
  }

  return {
    errors,
    data: {
      name,
      description:
        typeof data.description === "string"
          ? data.description.trim() || null
          : null,
      capacity,
      areaSquareFeet,
      amenities,
      photoUrls,
    },
  };
};

// ==========================================
// GET PUBLIC ROOMS
// GET /api/rooms/public
// ==========================================

export const getPublicRooms = async (req, res, next) => {
  try {
    const rooms = await prisma.studioRoom.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        capacity: true,
        areaSquareFeet: true,
        amenities: true,
        photoUrls: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL ROOMS
// GET /api/rooms
// ==========================================

export const getRooms = async (req, res, next) => {
  try {
    const rooms = await prisma.studioRoom.findMany({
      include: {
        _count: {
          select: roomCounts,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const activeRooms = rooms.filter((room) => room.isActive).length;

    return res.status(200).json({
      success: true,
      count: rooms.length,
      summary: {
        total: rooms.length,
        active: activeRooms,
        inactive: rooms.length - activeRooms,
      },
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET SINGLE ROOM
// GET /api/rooms/:id
// ==========================================

export const getRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await prisma.studioRoom.findUnique({
      where: { id },
      include: {
        rates: {
          include: {
            category: true,
          },
        },
        operatingHours: true,
        _count: {
          select: roomCounts,
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Studio room not found.",
      });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREATE ROOM
// POST /api/rooms
// ==========================================

export const createRoom = async (req, res, next) => {
  try {
    const validation = validateRoom(req.body || {});

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const room = await prisma.studioRoom.create({
      data: {
        ...validation.data,
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Studio room created successfully.",
      room,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A room with this name already exists.",
      });
    }

    next(error);
  }
};

// ==========================================
// UPDATE ROOM
// PATCH /api/rooms/:id
// ==========================================

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingRoom = await prisma.studioRoom.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: "Studio room not found.",
      });
    }

    const validation = validateRoom({
      ...existingRoom,
      ...req.body,
    });

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const room = await prisma.studioRoom.update({
      where: { id },
      data: validation.data,
    });

    return res.status(200).json({
      success: true,
      message: "Studio room updated successfully.",
      room,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A room with this name already exists.",
      });
    }

    next(error);
  }
};

// ==========================================
// ACTIVATE / DEACTIVATE ROOM
// PATCH /api/rooms/:id/status
// ==========================================

export const updateRoomStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const existingRoom = await prisma.studioRoom.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: "Studio room not found.",
      });
    }

    // Prevent deactivation when the room is still in use.
    if (!isActive) {
      const now = new Date();

      const [weeklyClasses, upcomingClasses, upcomingRentals] =
        await Promise.all([
          prisma.weeklyClass.count({
            where: {
              roomId: id,
              isActive: true,
            },
          }),

          prisma.danceClass.count({
            where: {
              roomId: id,
              isActive: true,
              endsAt: {
                gt: now,
              },
            },
          }),

          prisma.rentalRoom.count({
            where: {
              roomId: id,
              rental: {
                endsAt: {
                  gt: now,
                },
                status: {
                  in: ["PENDING", "APPROVED", "CONFIRMED"],
                },
              },
            },
          }),
        ]);

      if (weeklyClasses > 0 || upcomingClasses > 0 || upcomingRentals > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This room cannot be deactivated because it has active classes or upcoming rentals.",
          conflicts: {
            weeklyClasses,
            upcomingClasses,
            upcomingRentals,
          },
        });
      }
    }

    const room = await prisma.studioRoom.update({
      where: { id },
      data: {
        isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Studio room activated successfully."
        : "Studio room deactivated successfully.",
      room,
    });
  } catch (error) {
    next(error);
  }
};
