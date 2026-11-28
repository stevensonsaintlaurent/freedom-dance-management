import prisma from "../lib/prisma.js";

// ==========================================
// DEFAULT PREFERENCES
// ==========================================

const DEFAULT_PREFERENCES = {
  dashboardEnabled: true,
  emailEnabled: true,
  remindersEnabled: true,
  smsEnabled: false,
};

const ALLOWED_FIELDS = [
  "dashboardEnabled",
  "emailEnabled",
  "remindersEnabled",
  "smsEnabled",
];

const preferenceSelect = {
  id: true,
  userId: true,
  dashboardEnabled: true,
  emailEnabled: true,
  remindersEnabled: true,
  smsEnabled: true,
  createdAt: true,
  updatedAt: true,
};

const getUserId = (req) => req.user?.id || req.user?.userId;

// ==========================================
// GET MY NOTIFICATION PREFERENCES
// GET /api/notification-preferences
// ==========================================

export const getMyNotificationPreferences = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: {
        userId,
      },
      update: {},
      create: {
        userId,
        ...DEFAULT_PREFERENCES,
      },
      select: preferenceSelect,
    });

    return res.status(200).json({
      success: true,
      preferences,
      capabilities: {
        smsAvailable: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE MY NOTIFICATION PREFERENCES
// PATCH /api/notification-preferences
// ==========================================

export const updateMyNotificationPreferences = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body = req.body;

    // Validate request body

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
      });
    }

    const fields = Object.keys(body);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No preferences provided.",
      });
    }

    const unsupportedFields = fields.filter(
      (field) => !ALLOWED_FIELDS.includes(field),
    );

    if (unsupportedFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unsupported preference fields.",
        fields: unsupportedFields,
      });
    }

    const updates = {};

    // Only accept boolean values

    for (const field of fields) {
      if (typeof body[field] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a boolean.`,
        });
      }

      updates[field] = body[field];
    }

    // SMS is not available yet

    if (updates.smsEnabled === true) {
      return res.status(400).json({
        success: false,
        message: "SMS notifications are not available yet.",
      });
    }

    // Remove SMS consent when disabled

    if (updates.smsEnabled === false) {
      updates.smsConsentAt = null;
      updates.smsConsentVersion = null;
    }

    const preferences = await prisma.notificationPreference.upsert({
      where: {
        userId,
      },
      update: updates,
      create: {
        userId,
        ...DEFAULT_PREFERENCES,
        ...updates,
      },
      select: preferenceSelect,
    });

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully.",
      preferences,
      capabilities: {
        smsAvailable: false,
      },
    });
  } catch (error) {
    next(error);
  }
};
