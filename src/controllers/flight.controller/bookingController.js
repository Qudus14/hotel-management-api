const { prisma } = require("../../config/db");
const { generateBoardingQR } = require("../../utils/qrGenerator");

const generateReferenceCode = (serviceType) => {
  const prefix = { HOTEL: "HTL", FLIGHT: "FLT", ATTRACTION: "ATR", CAR: "CAR" }[
    serviceType
  ];
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ==================== CREATE FLIGHT BOOKING ====================
const createFlightBooking = async (req, res) => {
  try {
    const userId = req.user.sub; // FIX: from JWT, NOT req.body
    const { segments, addOnIds = [], cartId } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;

      // 1. Validate every seat and accumulate price
      for (const segment of segments) {
        const flight = await tx.flight.findUnique({
          where: { id: segment.flightId },
        });
        if (!flight) throw new Error(`Flight ${segment.flightId} not found`);
        if (flight.status === "CANCELLED")
          throw new Error(`Flight ${flight.flightNumber} is cancelled`);

        const seat = await tx.seat.findUnique({
          where: { id: segment.seatId },
        });
        if (!seat) throw new Error(`Seat ${segment.seatId} not found`);
        if (!seat.isAvailable)
          throw new Error(`Seat ${seat.seatNumber} is already taken`);
        if (seat.flightId !== segment.flightId) {
          throw new Error(
            `Seat ${seat.seatNumber} does not belong to flight ${flight.flightNumber}`,
          );
        }

        subtotal += parseFloat(seat.price);
      }

      // 2. Validate and add add-on prices
      if (addOnIds.length > 0) {
        const addOns = await tx.addOn.findMany({
          where: { id: { in: addOnIds } },
        });
        if (addOns.length !== addOnIds.length) {
          throw new Error("One or more add-ons not found");
        }
        addOns.forEach((a) => (subtotal += parseFloat(a.price)));
      }

      const tax = parseFloat((subtotal * 0.075).toFixed(2));
      const serviceFee = parseFloat((subtotal * 0.02).toFixed(2));
      const totalPrice = parseFloat((subtotal + tax + serviceFee).toFixed(2));

      // 3. Get first flight for service dates
      const firstFlight = await tx.flight.findUnique({
        where: { id: segments[0].flightId },
      });
      const lastFlight = await tx.flight.findUnique({
        where: { id: segments[segments.length - 1].flightId },
      });

      // 4. Create FlightBooking
      const flightBooking = await tx.flightBooking.create({
        data: { userId, totalPrice, status: "BOOKED" },
      });

      // 5. Create all segments
      await tx.bookingSegment.createMany({
        data: segments.map((seg) => ({
          flightBookingId: flightBooking.id,
          flightId: seg.flightId,
          seatId: seg.seatId,
        })),
      });

      // 6. Create add-on links
      if (addOnIds.length > 0) {
        await tx.bookingAddOn.createMany({
          data: addOnIds.map((id) => ({
            flightBookingId: flightBooking.id,
            addOnId: id,
          })),
        });
      }

      // 7. Lock all seats atomically
      await tx.seat.updateMany({
        where: { id: { in: segments.map((s) => s.seatId) } },
        data: { isAvailable: false },
      });

      // 8. Create UnifiedBooking (was missing entirely before)
      const unifiedBooking = await tx.unifiedBooking.create({
        data: {
          userId,
          serviceType: "FLIGHT",
          flightBookingId: flightBooking.id,
          serviceStartDate: firstFlight.departureTime,
          serviceEndDate: lastFlight.arrivalTime,
          subtotal,
          tax,
          serviceFee,
          totalPrice,
          bookingStatus: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          referenceCode: generateReferenceCode("FLIGHT"),
          cartId: cartId || null,
        },
      });

      // 9. Link unified booking back to flight booking
      await tx.flightBooking.update({
        where: { id: flightBooking.id },
        data: { unifiedBookingId: unifiedBooking.id },
      });

      if (cartId) {
        await tx.cart.update({
          where: { id: cartId },
          data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
        });
      }

      // 10. Return full booking details
      const fullBooking = await tx.flightBooking.findUnique({
        where: { id: flightBooking.id },
        include: {
          segments: { include: { flight: true, seat: true } },
          addOns: { include: { addOn: true } },
        },
      });

      return { flightBooking: fullBooking, unifiedBooking };
    });

    return res.status(201).json({
      status: "success",
      message: "Flight booked successfully",
      data: {
        booking: result.flightBooking,
        unified: {
          id: result.unifiedBooking.id,
          referenceCode: result.unifiedBooking.referenceCode,
          bookingStatus: result.unifiedBooking.bookingStatus,
          pricing: {
            subtotal: result.unifiedBooking.subtotal,
            tax: result.unifiedBooking.tax,
            serviceFee: result.unifiedBooking.serviceFee,
            totalPrice: result.unifiedBooking.totalPrice,
            currency: "NGN",
          },
        },
      },
    });
  } catch (error) {
    console.error("Create Flight Booking Error:", error);
    // Distinguish validation errors (400) from server errors (500)
    const isClientError =
      error.message.includes("not found") ||
      error.message.includes("taken") ||
      error.message.includes("cancelled") ||
      error.message.includes("does not belong");
    return res.status(isClientError ? 400 : 500).json({
      status: "fail",
      error: error.message,
    });
  }
};

// ==================== GET ALL FLIGHT BOOKINGS ====================
const getAllFlightBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Customers only see their own, admins see all
    const where = req.user.role !== "admin" ? { userId: req.user.sub } : {};

    const [bookings, total] = await Promise.all([
      prisma.flightBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          segments: { include: { flight: true, seat: true } },
          addOns: { include: { addOn: true } },
        },
      }),
      prisma.flightBooking.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: bookings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: bookings,
    });
  } catch (error) {
    console.error("Get All Flight Bookings Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET FLIGHT BOOKING BY ID ====================
const getFlightBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
      include: {
        segments: { include: { flight: true, seat: true } },
        addOns: { include: { addOn: true } },
        unifiedBooking: {
          select: {
            referenceCode: true,
            bookingStatus: true,
            totalPrice: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    // Customers can only view their own bookings
    if (req.user.role !== "admin" && booking.userId !== req.user.sub) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    return res.status(200).json({ status: "success", data: booking });
  } catch (error) {
    console.error("Get Flight Booking By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE FLIGHT BOOKING STATUS (admin) ====================
const updateFlightBookingByStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const upperStatus = status.toUpperCase();

    const existing = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    // Validate status transitions
    const validTransitions = {
      BOOKED: ["PAID", "CANCELLED"],
      PAID: ["BOARDED", "CANCELLED"],
      BOARDED: [],
      CANCELLED: [],
    };

    if (!validTransitions[existing.status]?.includes(upperStatus)) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot transition from "${existing.status}" to "${upperStatus}"`,
        allowedTransitions: validTransitions[existing.status],
      });
    }

    const updateData = { status: upperStatus };

    // Generate QR code when payment is confirmed
    if (upperStatus === "PAID") {
      updateData.qrCode = await generateBoardingQR(bookingId);
    }

    const updatedBooking = await prisma.flightBooking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        segments: { include: { flight: true, seat: true } },
        addOns: { include: { addOn: true } },
      },
    });

    // Mirror status to unified booking
    if (existing.unifiedBookingId) {
      const unifiedStatus =
        upperStatus === "PAID"
          ? "CONFIRMED"
          : upperStatus === "CANCELLED"
            ? "CANCELLED"
            : undefined;
      if (unifiedStatus) {
        await prisma.unifiedBooking.update({
          where: { id: existing.unifiedBookingId },
          data: {
            bookingStatus: unifiedStatus,
            paymentStatus: upperStatus === "PAID" ? "SUCCESSFUL" : undefined,
          },
        });
      }
    }

    return res.status(200).json({
      status: "success",
      message: `Booking status updated to ${upperStatus}`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Update Flight Booking Status Error:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// ==================== CANCEL FLIGHT BOOKING ====================
const cancelFlightBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub;

    const existing = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
      include: { segments: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    // Ownership check (admin can cancel any)
    if (req.user.role !== "admin" && existing.userId !== userId) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    if (existing.status === "CANCELLED") {
      return res
        .status(400)
        .json({ status: "fail", error: "Booking is already cancelled" });
    }

    if (existing.status === "BOARDED") {
      return res
        .status(400)
        .json({ status: "fail", error: "Cannot cancel a boarded flight" });
    }

    const seatIds = existing.segments.map((seg) => seg.seatId);

    await prisma.$transaction([
      prisma.flightBooking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      }),
      // Release all seats back to available
      prisma.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { isAvailable: true },
      }),
    ]);

    // Update unified booking status
    if (existing.unifiedBookingId) {
      await prisma.unifiedBooking.update({
        where: { id: existing.unifiedBookingId },
        data: {
          bookingStatus: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Flight booking cancelled. All seats released.",
      data: { bookingId, seatsReleased: seatIds.length },
    });
  } catch (error) {
    console.error("Cancel Flight Booking Error:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// ==================== DELETE FLIGHT BOOKING (admin) ====================
const deleteFlightBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const existing = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    await prisma.flightBooking.delete({ where: { id: bookingId } });

    return res
      .status(200)
      .json({ status: "success", message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Flight Booking Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createFlightBooking,
  getAllFlightBookings,
  getFlightBookingById,
  updateFlightBookingByStatus,
  cancelFlightBookingById,
  deleteFlightBookingById,
};
