const { prisma } = require("../../config/db");

const createAirplane = async (req, res) => {
  try {
    const { model, capacity, airline, tailNumber } = req.body;

    const airplane = await prisma.airplane.create({
      data: {
        model,
        capacity: Number(capacity),
        totalSeats: Number(capacity),
        airline,
        tailNumber,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Airplane created successfully",
      data: airplane,
    });
  } catch (error) {
    // tailNumber is the unique field, not model
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: `An airplane with tail number '${req.body.tailNumber}' already exists`,
      });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getAllAirplanes = async (req, res) => {
  try {
    const airplanes = await prisma.airplane.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ status: "success", data: airplanes });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getAirplaneById = async (req, res) => {
  try {
    const { airplaneId } = req.params; // FIX: consistent param name

    const airplane = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });

    if (!airplane) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airplane not found" });
    }

    return res.status(200).json({ status: "success", data: airplane });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const updateAirplaneById = async (req, res) => {
  try {
    const { airplaneId } = req.params;
    const { model, capacity, airline, tailNumber } = req.body;

    const existing = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airplane not found" });
    }

    const updateData = {};
    if (model !== undefined) updateData.model = model;
    if (airline !== undefined) updateData.airline = airline;
    if (tailNumber !== undefined) updateData.tailNumber = tailNumber;
    if (capacity !== undefined) {
      updateData.capacity = Number(capacity);
      updateData.totalSeats = Number(capacity);
    }

    const updated = await prisma.airplane.update({
      where: { id: airplaneId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Airplane updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ status: "fail", error: "Tail number already exists" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const deleteAirplaneById = async (req, res) => {
  try {
    const { airplaneId } = req.params; // FIX: was parseInt() on a UUID

    const existing = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airplane not found" });
    }

    await prisma.airplane.delete({ where: { id: airplaneId } });

    return res
      .status(200)
      .json({ status: "success", message: "Airplane deleted successfully" });
  } catch (error) {
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
