import prisma from "../lib/prisma.js";

// ==========================================
// VALIDATION
// ==========================================

const validateCategory = (data) => {
  const errors = [];

  const name = typeof data.name === "string" ? data.name.trim() : "";

  const description =
    typeof data.description === "string" ? data.description.trim() : null;

  if (!name || name.length > 100) {
    errors.push("Category name must contain 1–100 characters.");
  }

  if (data.description != null && typeof data.description !== "string") {
    errors.push("Description must be a string.");
  }

  if (description && description.length > 1000) {
    errors.push("Description cannot exceed 1000 characters.");
  }

  return {
    errors,
    data: {
      name,
      description: description || null,
    },
  };
};

// ==========================================
// GET PUBLIC CATEGORIES
// GET /api/rental-categories/public
// ==========================================

export const getPublicRentalCategories = async (req, res, next) => {
  try {
    const categories = await prisma.rentalCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL CATEGORIES
// GET /api/rental-categories
// ==========================================

export const getRentalCategories = async (req, res, next) => {
  try {
    const categories = await prisma.rentalCategory.findMany({
      include: {
        _count: {
          select: {
            rentals: true,
            rates: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const active = categories.filter((category) => category.isActive).length;

    return res.status(200).json({
      success: true,
      count: categories.length,
      summary: {
        total: categories.length,
        active,
        inactive: categories.length - active,
      },
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET SINGLE CATEGORY
// GET /api/rental-categories/:id
// ==========================================

export const getRentalCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.rentalCategory.findUnique({
      where: { id },
      include: {
        rates: {
          include: {
            room: true,
          },
        },
        _count: {
          select: {
            rentals: true,
            rates: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Rental category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREATE CATEGORY
// POST /api/rental-categories
// ==========================================

export const createRentalCategory = async (req, res, next) => {
  try {
    const validation = validateCategory(req.body || {});

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const existingCategory = await prisma.rentalCategory.findFirst({
      where: {
        name: {
          equals: validation.data.name,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A rental category with this name already exists.",
      });
    }

    const category = await prisma.rentalCategory.create({
      data: {
        ...validation.data,
        isActive: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Rental category created successfully.",
      category,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A rental category with this name already exists.",
      });
    }

    next(error);
  }
};

// ==========================================
// UPDATE CATEGORY
// PATCH /api/rental-categories/:id
// ==========================================

export const updateRentalCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.rentalCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Rental category not found.",
      });
    }

    const validation = validateCategory({
      ...existingCategory,
      ...req.body,
    });

    if (validation.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    const duplicateCategory = await prisma.rentalCategory.findFirst({
      where: {
        id: {
          not: id,
        },
        name: {
          equals: validation.data.name,
          mode: "insensitive",
        },
      },
    });

    if (duplicateCategory) {
      return res.status(409).json({
        success: false,
        message: "Another category already uses this name.",
      });
    }

    const category = await prisma.rentalCategory.update({
      where: { id },
      data: validation.data,
    });

    return res.status(200).json({
      success: true,
      message: "Rental category updated successfully.",
      category,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Another category already uses this name.",
      });
    }

    next(error);
  }
};

// ==========================================
// ACTIVATE / DEACTIVATE CATEGORY
// PATCH /api/rental-categories/:id/status
// ==========================================

export const updateRentalCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const existingCategory = await prisma.rentalCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Rental category not found.",
      });
    }

    const category = await prisma.rentalCategory.update({
      where: { id },
      data: {
        isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Rental category activated successfully."
        : "Rental category deactivated successfully.",
      category,
    });
  } catch (error) {
    next(error);
  }
};
