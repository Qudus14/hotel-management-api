const { prisma } = require("../../config/db");
const { updateAirplane } = require("../../model/flight.model/airplaneModel");

const createAirplane = async (req, res) => {
  try {
    const { model, capacity, airline, tailNumber } = req.body;

    const newAirplane = await prisma.airplane.create({
      data: {
        model,
        capacity: Number(capacity),
        airline,
        tailNumber,
        totalSeats: Number(capacity), // Assuming totalSeats is the same as capacity for simplicity
      },
    });

    res.status(201).json({
      message: "Airplane created successfully",
      airplane: newAirplane,
    });
  } catch (error) {
    console.error("Create Airplane Error:", error);
    if (
      error.code === "P2002" &&
      error.meta &&
      error.meta.target &&
      error.meta.target.includes("model")
    ) {
      return res.status(400).json({
        error: "Airplane with this model already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to create airplane",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllAirplanes = async (req, res) => {
  try {
    const airplanes = await prisma.airplane.findMany();
    res.status(200).json({ airplanes });
  } catch (error) {
    console.error("Get Airplanes Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAirplaneById = async (req, res) => {
  try {
    const airplaneId = req.params.id;
    const airplane = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });

    if (!airplane) {
      return res.status(404).json({ error: "Airplane not found" });
    }

    res.status(200).json({ airplane });
  } catch (error) {
    console.error("Get Airplane By ID Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateAirplaneById = async (req, res) => {
  try {
    const airplaneId = req.params.airplaneId;
    const { model, capacity, airline, tailNumber } = req.body;

    const existingAirplane = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });
    if (!existingAirplane) {
      return res.status(404).json({ error: "Airplane not found" });
    }

    const updatedAirplane = await prisma.airplane.update({
      where: { id: airplaneId },
      data: {
        model,
        capacity: Number(capacity),
        airline,
        tailNumber,
        totalSeats: Number(capacity),
      },
    });

    res.status(200).json({
      message: "Airplane updated successfully",
      airplane: updatedAirplane,
    });
  } catch (error) {
    console.error("Update Airplane Error:", error);
    if (
      error.code === "P2002" &&
      error.meta &&
      error.meta.target &&
      error.meta.target.includes("model")
    ) {
      return res.status(400).json({
        error: "Airplane with this model already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to update airplane",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteAirplaneById = async (req, res) => {
  const airplaneId = parseInt(req.params.airplaneId);

  try {
    const existingAirplane = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });
    if (!existingAirplane) {
      return res.status(404).json({ error: "Airplane not found" });
    }

    await prisma.airplane.delete({
      where: { id: airplaneId },
    });

    res.status(200).json({
      message: "Airplane deleted successfully",
    });
  } catch (error) {
    console.error("Delete Airplane Error:", error);
    return res.status(500).json({
      error: "Failed to delete airplane",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createAirplane,
  getAllAirplanes,
  getAirplaneById,
  updateAirplaneById,
  deleteAirplaneById,
};
