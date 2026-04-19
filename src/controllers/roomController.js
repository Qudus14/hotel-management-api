const { prisma } = require("../config/db");

const createRoom = async (req, res) => {
  try {
    const { roomNumber, type, price, status, capacity } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber: roomNumber },
    });
    if (existingRoom) {
      return res.status(400).json({ error: "Room number already exists" });
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber,
        type,
        price: Number(price),
        status,
        capacity: Number(capacity),
      },
    });

    res
      .status(201)
      .json({ message: "Room created successfully", room: newRoom });
  } catch (error) {
    console.error("Create Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllRooms = async (req, res) => {
  try {
    // 1. Get pagination parameters from query string (e.g., /rooms?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Fetch data and total count simultaneously
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        skip: skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // Newest rooms first
      }),
      prisma.room.count(),
    ]);

    // 3. Return a professional response structure
    res.status(200).json({
      status: "success",
      results: rooms.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: rooms,
    });
  } catch (error) {
    console.error("Get All Rooms Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({
        status: "fail",
        message: "No room found with that ID",
      });
    }

    res.status(200).json({ status: "success", data: room });
  } catch (error) {}
};

const updateRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      roomNumber,
      floor,
      type,
      price,
      status,
      capacity,
      bedType,
      images,
      amenities,
      description,
    } = req.body;

    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        roomNumber,
        type,
        description,
        bedType,
        floor,
        images,
        description,
        price: price !== undefined ? Number(price) : undefined,
        status,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        amenities: amenities || undefined,
      },
    });

    res
      .status(200)
      .json({ message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteRoomById = async (req, res) => {
  const { roomId } = req.params;

  try {
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoomById,
  deleteRoomById,
};
