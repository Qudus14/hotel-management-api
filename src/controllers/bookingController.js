const { prisma } = require("../config/db");

const createBookings = async (req, res) => {
  try {
    // ✅ Get userId from authenticated user (from token), NOT from body
    const userId = req.user.sub; // <-- THIS IS THE KEY FIX
    const {
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
    } = req.body;

    // ✅ Remove this validation since userId comes from token
    // if (!userId || !roomId || !checkInDate || !checkOutDate) { ... }

    // Rest of your code remains the same...
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));

    if (numberOfNights <= 0) {
      return res
        .status(400)
        .json({ error: "Check-out date must be after check-in date" });
    }

    const totalPrice = parseFloat(room.price) * numberOfNights;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { not: "cancelled" },
        OR: [{ checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn } }],
      },
    });

    if (existingBooking) {
      return res
        .status(400)
        .json({ error: "Room is already booked for these dates" });
    }

    const newBooking = await prisma.booking.create({
      data: {
        roomId,
        userId, // ✅ Now using userId from token
        totalPrice,
        status: "pending",
        paymentStatus: "PENDING",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: numberOfGuests || 1,
        specialRequests: specialRequests || null,
      },
      include: {
        room: { select: { roomNumber: true, type: true, price: true } },
        user: { select: { name: true, email: true } },
      },
    });

    res.status(201).json({
      status: "success",
      message: "Booking created successfully",
      data: newBooking,
    });
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
      where: { id: bookingId },
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
    const { bookingId } = req.params;
    const { status, paymentStatus } = req.body; // Only accept these two fields

    // Find the booking using UUID or numeric ID
    const where = bookingId.includes("-")
      ? { id: bookingId }
      : { bookingId: parseInt(bookingId) };

    const existingBooking = await prisma.booking.findUnique({
      where,
      include: { room: true },
    });

    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Validate status transition if status is being updated
    if (status && status !== existingBooking.status) {
      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["checked_in", "cancelled", "no_show"],
        checked_in: ["checked_out"],
        checked_out: [],
        cancelled: [],
        no_show: [],
      };

      if (!validTransitions[existingBooking.status]?.includes(status)) {
        return res.status(400).json({
          error: `Cannot transition from "${existingBooking.status}" to "${status}"`,
        });
      }
    }

    // Prepare update data
    const updateData = {};

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Auto-set timestamps based on status changes
    if (status === "checked_in" && !existingBooking.actualCheckIn) {
      updateData.actualCheckIn = new Date();
    }
    if (status === "checked_out" && !existingBooking.actualCheckOut) {
      updateData.actualCheckOut = new Date();
    }

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
      status: "success",
      message: "Booking updated successfully",
      data: updatedBooking,
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
      where: { id: bookingId },
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
      where: { id: bookingId },
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
