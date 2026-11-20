import { z } from "zod";

import {
  getWeeklyClassesService,
  createWeeklyClassService,
} from "../services/weeklyClassService.js";

// Validate weekly class information
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
  })
  .strict()
  .refine((data) => data.startTimeMinutes + data.durationMinutes <= 1440, {
    message: "Weekly classes must end before midnight",
    path: ["durationMinutes"],
  });

// GET /api/weekly-classes
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

// POST /api/weekly-classes
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
