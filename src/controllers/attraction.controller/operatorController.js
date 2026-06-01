const { prisma } = require("../../config/db");

// ==================== CREATE OPERATOR ====================
const createAttractionOperator = async (req, res) => {
  try {
    const { vendorId, name, description } = req.body;

    // Verify vendor exists and is ATTRACTION type
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor not found" });
    }
    if (vendor.vendorType !== "ATTRACTION") {
      return res.status(400).json({
        status: "fail",
        error: "Vendor must be of type ATTRACTION to create an operator",
      });
    }

    const operator = await prisma.attractionOperator.create({
      data: {
        vendorId,
        name,
        description: description || null,
        isActive: true,
        isApproved: false,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            city: true,
            country: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Attraction operator created. Awaiting admin approval.",
      data: operator,
    });
  } catch (error) {
    console.error("Create Operator Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL OPERATORS ====================
const getAllAttractionOperators = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { isActive, isApproved, search } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (isApproved !== undefined) where.isApproved = isApproved === "true";
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [operators, total] = await Promise.all([
      prisma.attractionOperator.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              city: true,
              country: true,
              status: true,
            },
          },
          _count: { select: { attractions: true } },
        },
      }),
      prisma.attractionOperator.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: operators.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: operators,
    });
  } catch (error) {
    console.error("Get All Operators Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET OPERATOR BY ID ====================
const getAttractionOperatorById = async (req, res) => {
  try {
    const { operatorId } = req.params;

    const operator = await prisma.attractionOperator.findUnique({
      where: { id: operatorId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            businessPhone: true,
            city: true,
            country: true,
          },
        },
        attractions: {
          where: { isActive: true, deletedAt: null },
          select: {
            id: true,
            name: true,
            city: true,
            category: true,
            basePrice: true,
            averageRating: true,
            totalReviews: true,
            images: true,
          },
        },
        _count: { select: { attractions: true } },
      },
    });

    if (!operator) {
      return res
        .status(404)
        .json({ status: "fail", error: "Operator not found" });
    }

    return res.status(200).json({ status: "success", data: operator });
  } catch (error) {
    console.error("Get Operator By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE OPERATOR ====================
const updateAttractionOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { name, description, isActive } = req.body;

    const existing = await prisma.attractionOperator.findUnique({
      where: { id: operatorId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Operator not found" });
    }

    // Vendors can only update their own operator
    if (req.user.role === "vendor") {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.sub },
      });
      if (!vendor || existing.vendorId !== vendor.id) {
        return res.status(403).json({ status: "fail", error: "Access denied" });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    // Only admin can toggle isActive
    if (isActive !== undefined && req.user.role === "admin") {
      updateData.isActive = isActive;
    }

    const updated = await prisma.attractionOperator.update({
      where: { id: operatorId },
      data: updateData,
      include: {
        vendor: { select: { id: true, businessName: true } },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Operator updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Operator Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== REVIEW OPERATOR (admin approve/reject) ====================
const reviewAttractionOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { isApproved } = req.body;

    const existing = await prisma.attractionOperator.findUnique({
      where: { id: operatorId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Operator not found" });
    }

    const updated = await prisma.attractionOperator.update({
      where: { id: operatorId },
      data: {
        isApproved,
        isActive: isApproved, // deactivate if rejected
      },
    });

    return res.status(200).json({
      status: "success",
      message: `Operator ${isApproved ? "approved" : "rejected"} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Review Operator Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE OPERATOR (admin) ====================
const deleteAttractionOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;

    const existing = await prisma.attractionOperator.findUnique({
      where: { id: operatorId },
      include: { _count: { select: { attractions: true } } },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Operator not found" });
    }

    if (existing._count.attractions > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete operator with ${existing._count.attractions} linked attraction(s). Deactivate it instead.`,
      });
    }

    await prisma.attractionOperator.delete({ where: { id: operatorId } });

    return res.status(200).json({
      status: "success",
      message: "Operator deleted successfully",
    });
  } catch (error) {
    console.error("Delete Operator Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createAttractionOperator,
  getAllAttractionOperators,
  getAttractionOperatorById,
  updateAttractionOperator,
  reviewAttractionOperator,
  deleteAttractionOperator,
};
