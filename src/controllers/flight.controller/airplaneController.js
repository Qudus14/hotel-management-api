const { prisma } = require("../../config/db");

// ==================== CREATE PLANE ====================
const createAirplane = async (req, res) => {
  try {
    const { airlineId, registration, model, manufacturer, totalSeats, status } =
      req.body;

    // Verify airline exists and is approved
    const airline = await prisma.airline.findUnique({
      where: { id: airlineId },
    });
    if (!airline) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airline not found" });
    }
    if (!airline.isApproved) {
      return res.status(400).json({
        status: "fail",
        error: "Airline must be approved before planes can be added",
      });
    }

    const plane = await prisma.plane.create({
      data: {
        airlineId,
        registration,
        model,
        manufacturer,
        totalSeats: Number(totalSeats),
        status: status ? status.toUpperCase() : "ACTIVE",
      },
      include: {
        airline: { select: { id: true, name: true, iataCode: true } },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Plane created successfully",
      data: plane,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: `A plane with registration '${req.body.registration}' already exists`,
      });
    }
    console.error("Create Plane Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL PLANES ====================
const getAllAirplanes = async (req, res) => {
  try {
    const { airlineId, status } = req.query;
    const where = {};
    if (airlineId) where.airlineId = airlineId;
    if (status) where.status = status.toUpperCase();

    const planes = await prisma.plane.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        airline: { select: { id: true, name: true, iataCode: true } },
        _count: { select: { flights: true } },
      },
    });

    return res.status(200).json({
      status: "success",
      results: planes.length,
      data: planes,
    });
  } catch (error) {
    console.error("Get All Planes Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET PLANE BY ID ====================
const getAirplaneById = async (req, res) => {
  try {
    const { airplaneId } = req.params;

    const plane = await prisma.plane.findUnique({
      where: { id: airplaneId },
      include: {
        airline: { select: { id: true, name: true, iataCode: true } },
        seatMaps: true,
        _count: { select: { flights: true } },
      },
    });

    if (!plane) {
      return res.status(404).json({ status: "fail", error: "Plane not found" });
    }

    return res.status(200).json({ status: "success", data: plane });
  } catch (error) {
    console.error("Get Plane By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE PLANE ====================
const updateAirplaneById = async (req, res) => {
  try {
    const { airplaneId } = req.params;
    const { registration, model, manufacturer, totalSeats, status } = req.body;

    const existing = await prisma.plane.findUnique({
      where: { id: airplaneId },
    });
    if (!existing) {
      return res.status(404).json({ status: "fail", error: "Plane not found" });
    }

    const updateData = {};
    if (registration !== undefined) updateData.registration = registration;
    if (model !== undefined) updateData.model = model;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (totalSeats !== undefined) updateData.totalSeats = Number(totalSeats);
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updated = await prisma.plane.update({
      where: { id: airplaneId },
      data: updateData,
      include: {
        airline: { select: { id: true, name: true, iataCode: true } },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Plane updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: "Registration number already exists",
      });
    }
    console.error("Update Plane Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE PLANE ====================
const deleteAirplaneById = async (req, res) => {
  try {
    const { airplaneId } = req.params;

    const existing = await prisma.plane.findUnique({
      where: { id: airplaneId },
      include: { _count: { select: { flights: true } } },
    });
    if (!existing) {
      return res.status(404).json({ status: "fail", error: "Plane not found" });
    }

    if (existing._count.flights > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete plane with ${existing._count.flights} associated flight(s). Set status to RETIRED instead.`,
      });
    }

    await prisma.plane.delete({ where: { id: airplaneId } });

    return res.status(200).json({
      status: "success",
      message: "Plane deleted successfully",
    });
  } catch (error) {
    console.error("Delete Plane Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createAirplane,
  getAllAirplanes,
  getAirplaneById,
  updateAirplaneById,
  deleteAirplaneById,
};
