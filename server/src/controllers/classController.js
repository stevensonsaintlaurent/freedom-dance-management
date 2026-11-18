import { z } from "zod";
import {
  getAllClassesService,
  createClassService,
} from "../services/classService.js";

const createClassSchema = z
  .object({
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().max(1000).optional(),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "OPEN_LEVEL"]),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    capacity: z.number().int().min(1).max(500),
    priceCents: z.number().int().min(0),
    instructorId: z.uuid(),
  })
  .strict()
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End time must be after start time",
    path: ["endsAt"],
  });

// GET /api/classes
export const getAllClasses = async (req, res, next) => {
  try {
    const classes = await getAllClassesService();

    return res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/classes
export const createClass = async (req, res, next) => {
  try {
    const result = createClassSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid class information",
        errors: z.flattenError(result.error),
      });
    }

    const danceClass = await createClassService(result.data);

    return res.status(201).json({
      success: true,
      message: "Dance class created successfully",
      danceClass,
    });
  } catch (error) {
    next(error);
  }
};
