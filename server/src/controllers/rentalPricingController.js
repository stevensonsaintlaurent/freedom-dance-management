import prisma from "../lib/prisma.js";

const SCOPES = ["SINGLE_ROOM", "ENTIRE_STUDIO", "LARGE_GROUP"];

const DAY_TYPES = ["EVERY_DAY", "WEEKDAY", "WEEKEND"];

const orderBy = [
  { scope: "asc" },
  { dayType: "asc" },
  { startTimeMinutes: "asc" },
];

// ==========================================
// VALIDATION
// ==========================================

const validatePricingRule = (input) => {
  const errors = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!name || name.length > 100) {
    errors.push("Name must contain 1–100 characters.");
  }

  if (!SCOPES.includes(input.scope)) {
    errors.push("Invalid rental pricing scope.");
  }

  if (!DAY_TYPES.includes(input.dayType)) {
    errors.push("Invalid rental day type.");
  }

  const parseInteger = (value, label, min, max) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      !["number", "string"].includes(typeof value)
    ) {
      errors.push(`${label} is required.`);
      return min;
    }

    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < min || number > max) {
      errors.push(`${label} must be between ${min} and ${max}.`);

      return min;
    }

    return number;
  };

  const startTimeMinutes = parseInteger(
    input.startTimeMinutes,
    "Start time",
    0,
    1439,
  );

  const endTimeMinutes = parseInteger(
    input.endTimeMinutes,
    "End time",
    1,
    1440,
  );

  if (endTimeMinutes <= startTimeMinutes) {
    errors.push("End time must be after start time.");
  }

  if (typeof input.requiresQuote !== "boolean") {
    errors.push("requiresQuote must be a boolean.");
  }

  if (typeof input.depositRefundable !== "boolean") {
    errors.push("depositRefundable must be a boolean.");
  }

  const requiresQuote = input.requiresQuote === true;

  const hourlyRateCents = requiresQuote
    ? null
    : parseInteger(input.hourlyRateCents, "Hourly rate", 0, 2147483647);

  const cleaningFeeCents = parseInteger(
    input.cleaningFeeCents,
    "Cleaning fee",
    0,
    2147483647,
  );

  const minimumMinutes = parseInteger(
    input.minimumMinutes,
    "Minimum rental duration",
    1,
    1440,
  );

  const billingIncrementMinutes = parseInteger(
    input.billingIncrementMinutes,
    "Billing increment",
    1,
    1440,
  );

  const depositBasisPoints = parseInteger(
    input.depositBasisPoints,
    "Deposit percentage",
    0,
    10000,
  );

  let minimumGuestCount = null;

  if (
    input.minimumGuestCount !== null &&
    input.minimumGuestCount !== undefined &&
    input.minimumGuestCount !== ""
  ) {
    if (input.scope !== "LARGE_GROUP") {
      errors.push("Minimum guest count is only available for large groups.");
    } else {
      minimumGuestCount = parseInteger(
        input.minimumGuestCount,
        "Minimum guest count",
        1,
        100000,
      );
    }
  }

  if (input.description != null && typeof input.description !== "string") {
    errors.push("Description must be a string.");
  }

  const description =
    typeof input.description === "string"
      ? input.description.trim() || null
      : null;

  if (description && description.length > 1000) {
    errors.push("Description cannot exceed 1000 characters.");
  }

  return {
    errors,
    data: {
      name,
      description,
      scope: input.scope,
      dayType: input.dayType,
      startTimeMinutes,
      endTimeMinutes,
      hourlyRateCents,
      requiresQuote,
      cleaningFeeCents,
      minimumMinutes,
      billingIncrementMinutes,
      depositBasisPoints,
      depositRefundable: input.depositRefundable,
      minimumGuestCount,
    },
  };
};

// ==========================================
// CHECK OVERLAPPING PRICING RULES
// ==========================================

const findOverlappingRule = async (db, data, excludeId = null) => {
  const applicableDays =
    data.dayType === "EVERY_DAY" ? DAY_TYPES : [data.dayType, "EVERY_DAY"];

  return db.rentalPricingRule.findFirst({
    where: {
      ...(excludeId && {
        id: { not: excludeId },
      }),

      isActive: true,
      scope: data.scope,

      dayType: {
        in: applicableDays,
      },

      startTimeMinutes: {
        lt: data.endTimeMinutes,
      },

      endTimeMinutes: {
        gt: data.startTimeMinutes,
      },
    },
  });
};

const apiError = (status, message) => {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
};

const handleError = (error, res, next) => {
  if (error.httpStatus) {
    return res.status(error.httpStatus).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A pricing rule with this configuration already exists.",
    });
  }

  if (error.code === "P2034") {
    return res.status(409).json({
      success: false,
      message: "Pricing was modified concurrently. Please try again.",
    });
  }

  return next(error);
};

const transactionOptions = {
  isolationLevel: "Serializable",
  maxWait: 10000,
  timeout: 20000,
};

// ==========================================
// GET PUBLIC PRICING
// GET /api/rental-pricing/public
// ==========================================

export const getPublicRentalPricing = async (req, res, next) => {
  try {
    const rules = await prisma.rentalPricingRule.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        scope: true,
        dayType: true,
        startTimeMinutes: true,
        endTimeMinutes: true,
        hourlyRateCents: true,
        requiresQuote: true,
        cleaningFeeCents: true,
        minimumMinutes: true,
        billingIncrementMinutes: true,
        depositBasisPoints: true,
        depositRefundable: true,
        minimumGuestCount: true,
      },
      orderBy,
    });

    return res.status(200).json({
      success: true,
      count: rules.length,
      currency: "USD",
      timeZone: "America/Los_Angeles",
      rules,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL PRICING RULES
// GET /api/rental-pricing
// ==========================================

export const getRentalPricing = async (req, res, next) => {
  try {
    const rules = await prisma.rentalPricingRule.findMany({
      orderBy,
    });

    return res.status(200).json({
      success: true,
      count: rules.length,
      summary: {
        total: rules.length,

        active: rules.filter((rule) => rule.isActive).length,

        inactive: rules.filter((rule) => !rule.isActive).length,

        customQuotes: rules.filter((rule) => rule.requiresQuote).length,

        singleRoom: rules.filter((rule) => rule.scope === "SINGLE_ROOM").length,

        entireStudio: rules.filter((rule) => rule.scope === "ENTIRE_STUDIO")
          .length,

        largeGroup: rules.filter((rule) => rule.scope === "LARGE_GROUP").length,
      },
      rules,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET SINGLE PRICING RULE
// GET /api/rental-pricing/:id
// ==========================================

export const getRentalPricingRule = async (req, res, next) => {
  try {
    const rule = await prisma.rentalPricingRule.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Pricing rule not found.",
      });
    }

    return res.status(200).json({
      success: true,
      rule,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREATE PRICING RULE
// POST /api/rental-pricing
// ==========================================

export const createRentalPricingRule = async (req, res, next) => {
  try {
    const validation = validatePricingRule({
      dayType: "EVERY_DAY",
      startTimeMinutes: 0,
      endTimeMinutes: 1440,
      cleaningFeeCents: 0,
      requiresQuote: false,
      minimumMinutes: 60,
      billingIncrementMinutes: 60,
      depositBasisPoints: 5000,
      depositRefundable: false,
      ...req.body,
    });

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const rule = await prisma.$transaction(async (tx) => {
      const overlap = await findOverlappingRule(tx, validation.data);

      if (overlap) {
        throw apiError(409, `Pricing overlaps with "${overlap.name}".`);
      }

      return tx.rentalPricingRule.create({
        data: {
          ...validation.data,
          isActive: true,
        },
      });
    }, transactionOptions);

    return res.status(201).json({
      success: true,
      message: "Pricing rule created successfully.",
      rule,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ==========================================
// UPDATE PRICING RULE
// PATCH /api/rental-pricing/:id
// ==========================================

export const updateRentalPricingRule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rule = await prisma.$transaction(async (tx) => {
      const existingRule = await tx.rentalPricingRule.findUnique({
        where: { id },
      });

      if (!existingRule) {
        throw apiError(404, "Pricing rule not found.");
      }

      const validation = validatePricingRule({
        ...existingRule,
        ...req.body,
      });

      if (validation.errors.length > 0) {
        throw apiError(400, validation.errors[0]);
      }

      if (existingRule.isActive) {
        const overlap = await findOverlappingRule(tx, validation.data, id);

        if (overlap) {
          throw apiError(409, `Pricing overlaps with "${overlap.name}".`);
        }
      }

      return tx.rentalPricingRule.update({
        where: { id },
        data: validation.data,
      });
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: "Pricing rule updated successfully.",
      rule,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// ==========================================
// ACTIVATE / DEACTIVATE PRICING RULE
// PATCH /api/rental-pricing/:id/status
// ==========================================

export const updateRentalPricingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const rule = await prisma.$transaction(async (tx) => {
      const existingRule = await tx.rentalPricingRule.findUnique({
        where: { id },
      });

      if (!existingRule) {
        throw apiError(404, "Pricing rule not found.");
      }

      if (isActive) {
        const validation = validatePricingRule(existingRule);

        if (validation.errors.length > 0) {
          throw apiError(400, validation.errors[0]);
        }

        const overlap = await findOverlappingRule(tx, existingRule, id);

        if (overlap) {
          throw apiError(
            409,
            `Cannot activate because pricing overlaps with "${overlap.name}".`,
          );
        }
      }

      return tx.rentalPricingRule.update({
        where: { id },
        data: { isActive },
      });
    }, transactionOptions);

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Pricing rule activated successfully."
        : "Pricing rule deactivated successfully.",
      rule,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
