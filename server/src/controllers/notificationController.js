import prisma from "../lib/prisma.js";

// ==========================================
// HELPERS
// ==========================================

const getUserId = (req) => {
  return req.user?.id || req.user?.userId;
};

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  data: true,
  weeklyBookingId: true,
  readAt: true,
  createdAt: true,
};

// ==========================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ==========================================

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const filter = req.query.filter ?? "all";

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 10000 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    if (!["all", "unread", "read"].includes(filter)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification filter",
      });
    }

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(filter === "unread" ? { readAt: null } : {}),
      ...(filter === "read" ? { readAt: { not: null } } : {}),
    };

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        select: notificationSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where,
      }),

      prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,

      notifications,

      unreadCount,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + notifications.length < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET UNREAD COUNT
// GET /api/notifications/unread-count
// ==========================================

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ==========================================

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
      select: notificationSelect,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.notification.updateMany({
        where: {
          id,
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      const updatedNotification = await tx.notification.findFirst({
        where: {
          id,
          userId,
        },
        select: notificationSelect,
      });

      const unreadCount = await tx.notification.count({
        where: {
          userId,
          readAt: null,
        },
      });

      return {
        notification: updatedNotification,
        unreadCount,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ==========================================

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      const unreadCount = await tx.notification.count({
        where: {
          userId,
          readAt: null,
        },
      });

      return {
        updatedCount: updated.count,
        unreadCount,
      };
    });

    return res.status(200).json({
      success: true,
      message: "All existing unread notifications marked as read",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
