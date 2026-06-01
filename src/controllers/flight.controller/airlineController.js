const { prisma } = require("../../config/db");

// ==================== CREATE AIRLINE ====================
const createAirline = async (req, res) => {
  try {
    // Find the vendor first to get their ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });

    console.log("vendor found:", vendor);

    const { name, iataCode, logoUrl, description } = req.body;

    if (!vendor) {
      return res
        .status(400)
        .json({ status: "fail", error: "Vendor not found for this user" });
    }

    const vendorId = vendor.id; // Extract the ID from the vendor object

    // Verify vendor exists and is an AIRLINE type
    if (vendor.vendorType !== "AIRLINE") {
      return res.status(400).json({
        status: "fail",
        error: "Vendor must be of type AIRLINE to create an airline",
      });
    }

    const airline = await prisma.airline.create({
      data: {
        vendorId, // Now vendorId is a string, not an object
        name,
        iataCode: iataCode.toUpperCase(),
        logoUrl: logoUrl || null,
        description: description || null,
        isActive: true,
        isApproved: false,
      },
      include: {
        vendor: {
          select: { id: true, businessName: true, businessEmail: true },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Airline created successfully. Awaiting admin approval.",
      data: airline,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: `Airline with IATA code '${req.body.iataCode?.toUpperCase()}' already exists`,
      });
    }
    console.error("Create Airline Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL AIRLINES ====================
const getAllAirlines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { isActive, isApproved, search } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (isApproved !== undefined) where.isApproved = isApproved === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { iataCode: { contains: search.toUpperCase() } },
      ];
    }

    const [airlines, total] = await Promise.all([
      prisma.airline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: { id: true, businessName: true, city: true, country: true },
          },
          _count: { select: { planes: true, flights: true } },
        },
      }),
      prisma.airline.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: airlines.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: airlines,
    });
  } catch (error) {
    console.error("Get All Airlines Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET AIRLINE BY ID ====================
const getAirlineById = async (req, res) => {
  try {
    const { airlineId } = req.params;

    const airline = await prisma.airline.findUnique({
      where: { id: airlineId },
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
        planes: {
          select: {
            id: true,
            registration: true,
            model: true,
            manufacturer: true,
            totalSeats: true,
            status: true,
          },
        },
        _count: { select: { flights: true, planes: true } },
      },
    });

    if (!airline) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airline not found" });
    }

    return res.status(200).json({ status: "success", data: airline });
  } catch (error) {
    console.error("Get Airline By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE AIRLINE ====================
const updateAirlineById = async (req, res) => {
  try {
    const { airlineId } = req.params;
    const { name, iataCode, logoUrl, description, isActive } = req.body;

    const existing = await prisma.airline.findUnique({
      where: { id: airlineId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airline not found" });
    }

    // Vendors can only update their own airline
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
    if (iataCode !== undefined) updateData.iataCode = iataCode.toUpperCase();
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined && req.user.role === "admin") {
      updateData.isActive = isActive;
    }

    const updated = await prisma.airline.update({
      where: { id: airlineId },
      data: updateData,
      include: {
        vendor: { select: { id: true, businessName: true } },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Airline updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: "IATA code already in use",
      });
    }
    console.error("Update Airline Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== APPROVE / REJECT AIRLINE (admin) ====================
const reviewAirline = async (req, res) => {
  try {
    const { airlineId } = req.params;
    const { action, reason } = req.body; // action: "approve" | "reject"

    const existing = await prisma.airline.findUnique({
      where: { id: airlineId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airline not found" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        status: "fail",
        error: "Action must be 'approve' or 'reject'",
      });
    }

    if (action === "reject" && !reason) {
      return res.status(400).json({
        status: "fail",
        error: "A rejection reason is required",
      });
    }

    const updated = await prisma.airline.update({
      where: { id: airlineId },
      data: {
        isApproved: action === "approve",
        isActive: action === "approve",
      },
    });

    return res.status(200).json({
      status: "success",
      message: `Airline ${action === "approve" ? "approved" : "rejected"} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Review Airline Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE AIRLINE (admin) ====================
const deleteAirlineById = async (req, res) => {
  try {
    const { airlineId } = req.params;

    const existing = await prisma.airline.findUnique({
      where: { id: airlineId },
      include: { _count: { select: { flights: true } } },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airline not found" });
    }

    if (existing._count.flights > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete airline with ${existing._count.flights} associated flight(s). Deactivate it instead.`,
      });
    }

    await prisma.airline.delete({ where: { id: airlineId } });

    return res.status(200).json({
      status: "success",
      message: "Airline deleted successfully",
    });
  } catch (error) {
    console.error("Delete Airline Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createAirline,
  getAllAirlines,
  getAirlineById,
  updateAirlineById,
  reviewAirline,
  deleteAirlineById,
};
