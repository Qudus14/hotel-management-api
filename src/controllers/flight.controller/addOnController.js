const { prisma } = require("../../config/db");

// ==================== CREATE ADD-ON ====================
const createAddOn = async (req, res) => {
  try {
    const { type, name, price, flightId } = req.body;

    const validTypes = ["BAGGAGE", "MEAL", "WIFI", "PRIORITY_BOARDING"];
    const upperType = type?.toUpperCase();

    if (!validTypes.includes(upperType)) {
      return res.status(400).json({
        status: "fail",
        error: `Invalid add-on type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Validate flight if provided
    if (flightId) {
      const flight = await prisma.flight.findUnique({
        where: { id: flightId },
      });
      if (!flight || flight.deletedAt) {
        return res
          .status(404)
          .json({ status: "fail", error: "Flight not found" });
      }
    }

    const newAddOn = await prisma.addOn.create({
      data: {
        type: upperType,
        name,
        price: parseFloat(price),
        flightId: flightId || null,
      },
      include: flightId
        ? { flight: { select: { id: true, flightNumber: true } } }
        : undefined,
    });

    return res.status(201).json({
      status: "success",
      message: "Add-on created successfully",
      data: newAddOn,
    });
  } catch (error) {
    console.error("Create AddOn Error:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// ==================== GET ALL ADD-ONS ====================
const getAllAddOns = async (req, res) => {
  try {
    const { flightId, type } = req.query;
    const where = {};

    if (flightId) where.flightId = flightId;
    if (type) where.type = type.toUpperCase();

    const addOns = await prisma.addOn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        flight: flightId ? { select: { id: true, flightNumber: true } } : false,
      },
    });

    return res.status(200).json({
      status: "success",
      results: addOns.length,
      data: addOns,
    });
  } catch (error) {
    console.error("Get All AddOns Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ADD-ON BY ID ====================
const getAddOnById = async (req, res) => {
  try {
    const { addOnId } = req.params;

    const addOn = await prisma.addOn.findUnique({
      where: { id: addOnId },
      include: {
        flight: { select: { id: true, flightNumber: true } },
      },
    });

    if (!addOn) {
      return res
        .status(404)
        .json({ status: "fail", error: "Add-on not found" });
    }

    return res.status(200).json({ status: "success", data: addOn });
  } catch (error) {
    console.error("Get AddOn By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE ADD-ON ====================
const updateAddOnById = async (req, res) => {
  try {
    const { addOnId } = req.params;
    const { name, price, type } = req.body;

    const existing = await prisma.addOn.findUnique({ where: { id: addOnId } });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Add-on not found" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (type !== undefined) {
      const validTypes = ["BAGGAGE", "MEAL", "WIFI", "PRIORITY_BOARDING"];
      const upperType = type.toUpperCase();
      if (!validTypes.includes(upperType)) {
        return res.status(400).json({
          status: "fail",
          error: `Invalid add-on type. Must be one of: ${validTypes.join(", ")}`,
        });
      }
      updateData.type = upperType;
    }

    const updated = await prisma.addOn.update({
      where: { id: addOnId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Add-on updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update AddOn Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE ADD-ON ====================
const deleteAddOnById = async (req, res) => {
  try {
    const { addOnId } = req.params;

    const existing = await prisma.addOn.findUnique({ where: { id: addOnId } });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Add-on not found" });
    }

    // Check for active bookings using this add-on
    const activeUsage = await prisma.bookingAddOn.count({
      where: { addOnId },
    });

    if (activeUsage > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete add-on currently used in ${activeUsage} booking(s)`,
      });
    }

    await prisma.addOn.delete({ where: { id: addOnId } });

    return res.status(200).json({
      status: "success",
      message: "Add-on deleted successfully",
    });
  } catch (error) {
    console.error("Delete AddOn Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createAddOn,
  getAllAddOns,
  getAddOnById,
  updateAddOnById,
  deleteAddOnById,
};
