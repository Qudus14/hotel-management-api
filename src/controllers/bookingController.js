const { prisma } = require("../config/db");

const createBookings = async (req, res) => {
  try {
    const { userId, roomId, checkInDate, totalPrice, status, checkOutDate } =
      req.body;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        roomId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        status: { not: "cancelled" },
      },
    });

    if (existingBooking) {
      return res.status(400).json({ error: "Booking already exists" });
    }

    const newBooking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        totalPrice,
        status,
        checkOutDate,
        checkInDate,
      },
    });

    res
      .status(201)
      .json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where = {};

    // Regular users only see their own bookings
    if (req.user.role !== "admin") {
      where.userId = req.user.id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          room: true,
          user: req.user.role === "admin" ? true : false,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    // 3. Return a professional response structure
    res.status(200).json({
      status: "success",
      results: bookings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: bookings,
    });
  } catch (error) {
    console.error("Get All Bookings Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingId: parseInt(bookingId) },
    });

    if (!booking) {
      return res.status(404).json({
        status: "fail",
        message: "No booking found with that ID",
      });
    }

    res.status(200).json({ status: "success", data: booking });
  } catch (error) {
    console.error("Get Bookings ID Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params; // Get bookingId from route parameter
    const updates = req.body;

    // ✅ FIX: Use bookingId instead of id
    const where = bookingId.includes("-")
      ? { id: bookingId } // UUID
      : { bookingId: parseInt(bookingId) }; // Numeric ID

    const existingBooking = await prisma.booking.findUnique({
      where,
      include: { room: true },
    });

    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Validate status transitions
    if (updates.status && updates.status !== existingBooking.status) {
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["checked_in", "cancelled", "no_show"],
        checked_in: ["checked_out"],
        checked_out: [],
        cancelled: [],
        no_show: [],
      };

      if (!validTransitions[existingBooking.status]?.includes(updates.status)) {
        return res.status(400).json({
          error: `Cannot transition from "${existingBooking.status}" to "${updates.status}"`,
        });
      }

      // Auto-set timestamps
      if (updates.status === "checked_in" && !updates.actualCheckIn) {
        updates.actualCheckIn = new Date();
      }
      if (updates.status === "checked_out" && !updates.actualCheckOut) {
        updates.actualCheckOut = new Date();
      }
    }

    // Check for date conflicts if dates are being changed
    if (updates.checkInDate || updates.checkOutDate) {
      const checkIn = updates.checkInDate
        ? new Date(updates.checkInDate)
        : existingBooking.checkInDate;
      const checkOut = updates.checkOutDate
        ? new Date(updates.checkOutDate)
        : existingBooking.checkOutDate;

      const conflictWhere = {
        roomId: existingBooking.roomId,
        status: { in: ["pending", "confirmed", "checked_in"] },
        OR: [
          {
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        ],
      };

      // ✅ FIX: Use bookingId instead of id
      if (bookingId.includes("-")) {
        conflictWhere.id = { not: bookingId };
      } else {
        conflictWhere.bookingId = { not: parseInt(bookingId) };
      }

      const conflictingBooking = await prisma.booking.findFirst({
        where: conflictWhere,
      });

      if (conflictingBooking) {
        return res.status(409).json({
          error: "Room is already booked for these dates",
        });
      }
    }

    // Prepare update data
    const updateData = {};

    if (updates.status) updateData.status = updates.status;
    if (updates.paymentStatus) updateData.paymentStatus = updates.paymentStatus;
    if (updates.checkInDate)
      updateData.checkInDate = new Date(updates.checkInDate);
    if (updates.checkOutDate)
      updateData.checkOutDate = new Date(updates.checkOutDate);
    if (updates.actualCheckIn)
      updateData.actualCheckIn = new Date(updates.actualCheckIn);
    if (updates.actualCheckOut)
      updateData.actualCheckOut = new Date(updates.actualCheckOut);
    if (updates.totalPrice !== undefined)
      updateData.totalPrice = parseFloat(updates.totalPrice);
    if (updates.depositAmount !== undefined)
      updateData.depositAmount = parseFloat(updates.depositAmount);
    if (updates.numberOfGuests !== undefined)
      updateData.numberOfGuests = parseInt(updates.numberOfGuests);
    if (updates.specialRequests !== undefined)
      updateData.specialRequests = updates.specialRequests;

    // Perform the update
    const updatedBooking = await prisma.booking.update({
      where,
      data: updateData,
      include: {
        room: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { bookingId: parseInt(bookingId) },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Business rule: Can only cancel pending or confirmed bookings
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        error: `Cannot cancel booking with status: ${booking.status}`,
      });
    }

    const cancelledBooking = await prisma.booking.update({
      where: { bookingId: parseInt(bookingId) },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    res.json({
      message: "Booking cancelled successfully",
      booking: cancelledBooking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteBooking = async (req, res) => {
  const { id: bookingId } = req.params;

  try {
    const existingBooking = await prisma.booking.findUnique({
      where: { bookingId: parseInt(bookingId) },
    });
    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await prisma.booking.delete({
      where: { bookingId: parseInt(bookingId) },
    });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createBookings,
  getBookingById,
  getBookings,
  updateBookingById,
  deleteBooking,
  cancelBooking,
};
