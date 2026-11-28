import { createHash } from "node:crypto";
import prisma from "../lib/prisma.js";

const EVENT_TYPES = [
  "WEEKEND_INTENSIVE",
  "DANCE_WORKSHOP",
  "SOCIAL",
  "MASTERCLASS",
  "LIVE_CONCERT",
  "FESTIVAL",
  "SPECIAL_EVENT",
  "OTHER",
];

const TIMEZONE = "America/Los_Angeles";

// ==========================================
// VALIDATION HELPERS
// ==========================================

const validationError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.status = statusCode;

  return error;
};

const requiredText = (value, field, maxLength = 200) => {
  if (typeof value !== "string" || !value.trim()) {
    throw validationError(`${field} is required`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    throw validationError(`${field} cannot exceed ${maxLength} characters`);
  }

  return text;
};

const optionalText = (value, field, maxLength = 500) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw validationError(`${field} must be text`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    throw validationError(`${field} cannot exceed ${maxLength} characters`);
  }

  return text || null;
};

const parseDate = (value, field) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw validationError(`${field} must use YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw validationError(`${field} is invalid`);
  }

  return date;
};

const parseBoolean = (value, field, fallback = false) => {
  if (value === undefined) return fallback;

  if (typeof value !== "boolean") {
    throw validationError(`${field} must be true or false`);
  }

  return value;
};

const parseCapacity = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!Number.isInteger(value) || value < 1 || value > 100000) {
    throw validationError(
      "Capacity must be a whole number between 1 and 100000",
    );
  }

  return value;
};

// ==========================================
// SLUG GENERATION
// ==========================================

const generateSlug = (title) => {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
};

// ==========================================
// IMAGE VALIDATION
// ==========================================

const validateImageUrl = (value) => {
  const imageUrl = optionalText(value, "Image URL", 2000);

  if (!imageUrl) return null;

  // Allow local event flyers.
  if (/^\/events\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png|avif)$/i.test(imageUrl)) {
    return imageUrl;
  }

  // Allow externally hosted HTTPS images.
  try {
    const url = new URL(imageUrl);

    if (url.protocol === "https:" && !url.username && !url.password) {
      return url.href;
    }
  } catch {
    // Invalid URL.
  }

  throw validationError(
    "Image must be a valid HTTPS URL or a local /events/ image path",
  );
};

// ==========================================
// IDEMPOTENCY PROTECTION
// ==========================================

const validateIdempotencyKey = (value) => {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      value,
    )
  ) {
    throw validationError("A valid Idempotency-Key header is required", 400);
  }

  return value.toLowerCase();
};

const generateRequestHash = (data) => {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
};

const findExistingRequest = async (key, hash, userId) => {
  const event = await prisma.event.findUnique({
    where: {
      idempotencyKey: key,
    },
    include: {
      sessions: true,
      ticketTypes: true,
    },
  });

  if (!event) return null;

  if (event.createdById !== userId || event.requestHash !== hash) {
    throw validationError("This request key has already been used", 409);
  }

  return event;
};

// ==========================================
// CREATE EVENT
// ==========================================

export const createEventService = async (input, userId, requestKey) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationError("Invalid event information");
  }

  if (!userId) {
    throw validationError("Authentication required", 401);
  }

  const title = requiredText(input.title, "Event title", 200);

  const type = requiredText(input.type, "Event type", 50).toUpperCase();

  if (!EVENT_TYPES.includes(type)) {
    throw validationError("Invalid event type");
  }

  const startDate = parseDate(input.startDate, "Start date");

  const endDate = parseDate(input.endDate || input.startDate, "End date");

  if (endDate < startDate) {
    throw validationError("End date cannot be before start date");
  }

  const imageFit = input.imageFit ?? "contain";

  if (!["contain", "cover"].includes(imageFit)) {
    throw validationError("Image fit must be contain or cover");
  }

  const eventData = {
    title,

    subtitle: optionalText(input.subtitle, "Subtitle", 250),

    description: optionalText(input.description, "Description", 10000),

    category: optionalText(input.category, "Category", 150),

    type,

    instructorName: optionalText(
      input.instructorName,
      "Instructor or artist name",
      200,
    ),

    level: optionalText(input.level, "Level", 100),

    startDate,
    endDate,

    timezone: TIMEZONE,

    timeLabel: optionalText(input.timeLabel, "Event time", 200),

    durationLabel: optionalText(input.durationLabel, "Duration", 100),

    location: optionalText(input.location, "Location", 250),

    address: optionalText(input.address, "Address", 500),

    imageUrl: validateImageUrl(input.imageUrl),

    imageFit,

    highlight: optionalText(input.highlight, "Highlight", 200),

    announcement: optionalText(input.announcement, "Announcement", 1000),

    buttonLabel:
      optionalText(input.buttonLabel, "Button label", 80) || "Register Now",

    capacity: parseCapacity(input.capacity),

    featured: parseBoolean(input.featured, "Featured"),

    showInHero: parseBoolean(input.showInHero, "Show in hero"),

    // New events are always saved as drafts.
    status: "DRAFT",

    // Registration must be enabled separately.
    registrationEnabled: false,

    createdById: userId,
  };

  // ==========================================
  // DUPLICATE REQUEST PROTECTION
  // ==========================================

  const idempotencyKey = validateIdempotencyKey(requestKey);

  const requestHash = generateRequestHash(eventData);

  const existingEvent = await findExistingRequest(
    idempotencyKey,
    requestHash,
    userId,
  );

  if (existingEvent) {
    return {
      event: existingEvent,
      replayed: true,
    };
  }

  // ==========================================
  // UNIQUE SLUG GENERATION
  // ==========================================

  const baseSlug = generateSlug(title) || "event";

  const reservedSlugs = new Set(["manage", "create", "new"]);

  const safeSlug = reservedSlugs.has(baseSlug) ? `${baseSlug}-event` : baseSlug;

  // ==========================================
  // CREATE EVENT
  // ==========================================

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug =
      attempt === 0
        ? safeSlug
        : `${safeSlug}-${idempotencyKey.slice(0, 8)}-${attempt}`;

    try {
      const event = await prisma.event.create({
        data: {
          ...eventData,
          slug,
          idempotencyKey,
          requestHash,
        },

        include: {
          sessions: true,
          ticketTypes: true,
        },
      });

      return {
        event,
        replayed: false,
      };
    } catch (error) {
      if (error.code !== "P2002") {
        throw error;
      }

      // Another request may have created the event
      // while this request was processing.

      const existingEvent = await findExistingRequest(
        idempotencyKey,
        requestHash,
        userId,
      );

      if (existingEvent) {
        return {
          event: existingEvent,
          replayed: true,
        };
      }
    }
  }

  throw validationError("Unable to generate a unique event URL", 409);
};
