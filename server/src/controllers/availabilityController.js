import {
  getDailyAvailability,
  getPublicDailyAvailability,
  checkAvailability,
} from "../services/availabilityService.js";

import { getTodayInVegas, apiError } from "../utils/rentalDateTime.js";

// ======================================================
// PUBLIC DAILY AVAILABILITY
// ======================================================

export const getPublicAvailability = async (req, res, next) => {
  try {
    const date = req.query.date || getTodayInVegas();

    const calendar = await getPublicDailyAvailability(date);

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      ...calendar,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// MANAGER AND ADMIN CALENDAR
// ======================================================

export const getAvailabilityCalendar = async (req, res, next) => {
  try {
    const date = req.query.date || getTodayInVegas();

    const calendar = await getDailyAvailability(date);

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      ...calendar,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// CHECK SPECIFIC ROOM AVAILABILITY
// ======================================================

export const checkRoomAvailability = async (req, res, next) => {
  try {
    const { date, startTime, durationMinutes, roomIds, entireStudio } =
      req.query;

    if (!date || !startTime || !durationMinutes) {
      throw apiError("Date, start time and duration are required.");
    }

    if (
      entireStudio !== undefined &&
      !["true", "false"].includes(entireStudio)
    ) {
      throw apiError("entireStudio must be true or false.");
    }

    if (typeof durationMinutes !== "string" || !/^\d+$/.test(durationMinutes)) {
      throw apiError("Duration must be a positive integer.");
    }

    if (roomIds !== undefined && typeof roomIds !== "string") {
      throw apiError("Room IDs must be comma-separated.");
    }

    const selectedRoomIds =
      typeof roomIds === "string"
        ? roomIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [];

    if (selectedRoomIds.length > 2) {
      throw apiError("A maximum of two rooms can be selected.");
    }

    const result = await checkAvailability({
      date,
      startTime,
      durationMinutes,
      roomIds: selectedRoomIds,
      entireStudio: entireStudio === "true",
    });

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
