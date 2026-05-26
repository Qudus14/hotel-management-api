const { prisma } = require("../../config/db");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const {
  roomSchema,
  updateRoomSchema,
} = require("../../model/hotel.model/roomsModel");

const ajv = new Ajv();
addFormats(ajv);
const validateRoom = ajv.compile(roomSchema);

const createRoom = async (req, res) => {
  try {
    // Validate request body against schema
    const isValid = validateRoom(req.body);
    if (!isValid) {
      return res.status(400).json({
        error: "Validation failed",
        details: validateRoom.errors,
      });
    }

    const {
      roomNumber,
      type,
      price,
      status,
      capacity,
      floor,
      bedType,
      amenities,
      images,
      description,
      hotelId,
      roomCategoryId,
    } = req.body;

    // Check if room number already exists
    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber: roomNumber },
    });
    if (existingRoom) {
      return res.status(400).json({ error: "Room number already exists" });
    }

    // Optional: Verify hotel exists if hotelId provided
    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId },
      });
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
    }

    // Optional: Verify room category exists if roomCategoryId provided
    if (roomCategoryId) {
      const category = await prisma.roomCategory.findUnique({
        where: { id: roomCategoryId },
      });
      if (!category) {
        return res.status(404).json({ error: "Room category not found" });
      }
    }

    const newRoom = await prisma.room.create({
      data: {
        roomNumber,
        type,
        price: Number(price),
        status: status,
        capacity: Number(capacity),
        floor: floor || null,
        bedType: bedType || null,
        amenities: amenities || [],
        images: images || [],
        description: description || null,
        hotelId: hotelId || null,
        roomCategoryId: roomCategoryId || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: newRoom,
    });
  } catch (error) {
    console.error("Create Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllRooms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        skip: skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          hotel: {
            select: {
              name: true,
              city: true,
              starRating: true,
            },
          },
          roomCategory: {
            select: {
              name: true,
              basePricePerNight: true,
            },
          },
        },
      }),
      prisma.room.count(),
    ]);

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
    const roomId = req.params.roomId;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            name: true,
            city: true,
            address: true,
            starRating: true,
          },
        },
        roomCategory: true,
        bookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res
        .status(404)
        .json({ status: "fail", message: "No room found with that ID" });
    }

    res.status(200).json({ status: "success", data: room });
  } catch (error) {
    console.error("Get Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateRoomById = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const updateData = req.body;

    // Validate update data (optional - you can create a partial schema)
    // For now, we'll just check if the room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    // If roomNumber is being updated, check uniqueness
    if (
      updateData.roomNumber &&
      updateData.roomNumber !== existingRoom.roomNumber
    ) {
      const roomWithSameNumber = await prisma.room.findUnique({
        where: { roomNumber: updateData.roomNumber },
      });
      if (roomWithSameNumber) {
        return res.status(400).json({ error: "Room number already exists" });
      }
    }

    // If hotelId is being updated, verify hotel exists
    if (updateData.hotelId) {
      const hotel = await prisma.hotel.findUnique({
        where: { id: updateData.hotelId },
      });
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
    }

    // If roomCategoryId is being updated, verify category exists
    if (updateData.roomCategoryId) {
      const category = await prisma.roomCategory.findUnique({
        where: { id: updateData.roomCategoryId },
      });
      if (!category) {
        return res.status(404).json({ error: "Room category not found" });
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        roomNumber: updateData.roomNumber,
        floor: updateData.floor,
        type: updateData.type,
        price:
          updateData.price !== undefined ? Number(updateData.price) : undefined,
        status: updateData.status,
        capacity:
          updateData.capacity !== undefined
            ? Number(updateData.capacity)
            : undefined,
        bedType: updateData.bedType,
        amenities: updateData.amenities,
        images: updateData.images,
        description: updateData.description,
        hotelId: updateData.hotelId,
        roomCategoryId: updateData.roomCategoryId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteRoomById = async (req, res) => {
  const roomId = req.params.roomId;

  try {
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        bookings: {
          where: {
            status: { notIn: ["cancelled", "checked_out"] },
          },
        },
      },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if room has active bookings
    if (existingRoom.bookings.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete room with active bookings. Please cancel bookings first or archive the room instead.",
      });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
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
