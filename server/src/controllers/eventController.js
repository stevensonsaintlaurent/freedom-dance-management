import {
  getPublicEventsService,
  getPublicEventBySlugService,
  getManagerEventsService,
} from "../services/eventService.js";

import { createEventService } from "../services/eventManagementService.js";

// ==========================================
// RESPONSE HELPERS
// ==========================================

const sanitizeEvent = (event) => {
  const { idempotencyKey, requestHash, ...safeEvent } = event;

  return safeEvent;
};

// ==========================================
// PUBLIC - GET ALL EVENTS
// ==========================================

export const getPublicEvents = async (req, res, next) => {
  try {
    const { featured, hero } = req.query;

    if (featured !== undefined && !["true", "false"].includes(featured)) {
      return res.status(400).json({
        success: false,
        message: "Featured must be true or false",
      });
    }

    if (hero !== undefined && !["true", "false"].includes(hero)) {
      return res.status(400).json({
        success: false,
        message: "Hero must be true or false",
      });
    }

    const events = await getPublicEventsService({
      featured: featured === "true",
      hero: hero === "true",
    });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC - GET EVENT BY SLUG
// ==========================================

export const getPublicEventBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (typeof slug !== "string" || !slug.trim() || slug.length > 150) {
      return res.status(400).json({
        success: false,
        message: "A valid event slug is required",
      });
    }

    const event = await getPublicEventBySlugService(slug.trim().toLowerCase());

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MANAGER - GET ALL EVENTS
// ==========================================

export const getManagerEvents = async (req, res, next) => {
  try {
    const { events, summary } = await getManagerEventsService();

    const safeEvents = events.map(sanitizeEvent);

    return res.status(200).json({
      success: true,
      count: safeEvents.length,
      events: safeEvents,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MANAGER - CREATE EVENT
// ==========================================

export const createEvent = async (req, res, next) => {
  try {
    // Authentication protection.
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Read the unique request key.
    const requestKey = req.get("Idempotency-Key");

    if (!requestKey) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key header is required",
      });
    }

    // Create the event or retrieve an existing request.
    const { event, replayed } = await createEventService(
      req.body,
      req.user.id,
      requestKey,
    );

    // Remove internal database protection fields.
    const safeEvent = sanitizeEvent(event);

    // Prevent caching of the creation response.
    res.set("Cache-Control", "no-store");

    return res.status(replayed ? 200 : 201).json({
      success: true,

      message: replayed
        ? "This request was already processed. Existing event returned."
        : "Event created successfully as a draft",

      replayed,

      event: safeEvent,
    });
  } catch (error) {
    next(error);
  }
};
