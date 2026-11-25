import { z } from "zod";

import {
  getWeeklyClassesService,
  createWeeklyClassService,
  assignWeeklyClassRoomService,
} from "../services/weeklyClassService.js";

// ======================================================
// VALIDATION
// ======================================================

const weeklyClassSchema = z
  .object({
    title: z.string().trim().min(2).max(150),

    description: z.string().trim().max(1000).optional(),

    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "OPEN_LEVEL"]),

    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),

    startTimeMinutes: z.number().int().min(0).max(1439),

    durationMinutes: z.number().int().min(15).max(720),

    capacity: z.number().int().min(1).max(500),

    priceCents: z.number().int().min(0),

    instructorId: z.uuid(),

    // Studio room assignment
    roomId: z.uuid().nullable().optional(),
  })
  .strict()
  .refine((data) => data.startTimeMinutes + data.durationMinutes <= 1440, {
    message: "Weekly classes must end by midnight",
    path: ["durationMinutes"],
  });

// Room assignment validation

const assignRoomSchema = z
  .object({
    roomId: z.uuid().nullable(),
  })
  .strict();

const classIdSchema = z.uuid();

// ======================================================
// GET ALL WEEKLY CLASSES
// GET /api/weekly-classes
// ======================================================

export const getWeeklyClasses = async (req, res, next) => {
  try {
    const classes = await getWeeklyClassesService();

    return res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// CREATE WEEKLY CLASS
// POST /api/weekly-classes
// ======================================================

export const createWeeklyClass = async (req, res, next) => {
  try {
    const result = weeklyClassSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid weekly class information",
        errors: z.flattenError(result.error),
      });
    }

    const weeklyClass = await createWeeklyClassService(result.data);

    return res.status(201).json({
      success: true,
      message: "Weekly class created successfully",
      weeklyClass,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ASSIGN OR CHANGE STUDIO ROOM
// PATCH /api/weekly-classes/:id/room
// ======================================================

export const assignWeeklyClassRoom = async (req, res, next) => {
  try {
    const idResult = classIdSchema.safeParse(req.params.id);

    if (!idResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid weekly class ID",
      });
    }

    const result = assignRoomSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid room assignment",
        errors: z.flattenError(result.error),
      });
    }

    const weeklyClass = await assignWeeklyClassRoomService(
      idResult.data,
      result.data.roomId,
    );

    return res.status(200).json({
      success: true,
      message: result.data.roomId
        ? "Studio room assigned successfully"
        : "Studio room assignment removed successfully",
      weeklyClass,
    });
  } catch (error) {
    next(error);
  }
};
