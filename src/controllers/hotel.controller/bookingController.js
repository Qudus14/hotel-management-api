const { prisma } = require("../../config/db");

const generateReferenceCode = (serviceType) => {
  const prefix = { HOTEL: "HTL", FLIGHT: "FLT", ATTRACTION: "ATR", CAR: "CAR" }[
    serviceType
  ];
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ==================== CREATE BOOKING ====================
const createBookings = async (req, res) => {
  try {
    const userId = req.user.sub;
    const {
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      cartId,
    } = req.body;
    // roomId is already an integer (bookingSchema enforces it + AJV coerces)

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room)
      return res.status(404).json({ status: "fail", error: "Room not found" });

    if (room.status !== "available") {
      return res
        .status(400)
        .json({ status: "fail", error: `Room is currently ${room.status}` });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        status: "fail",
        error: "Check-out date must be after check-in date",
      });
    }

    if (checkIn < new Date()) {
      return res
        .status(400)
        .json({ status: "fail", error: "Check-in date cannot be in the past" });
    }

    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
    const subtotal = parseFloat(room.price) * numberOfNights;
    const tax = parseFloat((subtotal * 0.075).toFixed(2)); // 7.5% VAT
    const serviceFee = parseFloat((subtotal * 0.02).toFixed(2)); // 2% service fee
    const totalPrice = parseFloat((subtotal + tax + serviceFee).toFixed(2));

    // Check date conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { notIn: ["cancelled", "no_show"] },
        OR: [{ checkInDate: { lt: checkOut }, checkOutDate: { gt: checkIn } }],
      },
    });
    if (conflict) {
      return res.status(409).json({
        status: "fail",
        error: "Room is already booked for these dates",
      });
    }

    // Wrap in transaction so hotel + unified booking are always in sync
    const result = await prisma.$transaction(async (tx) => {
      const hotelBooking = await tx.booking.create({
        data: {
          roomId,
          userId,
          totalPrice,
          depositAmount: 0,
          status: "pending",
          paymentStatus: "PENDING",
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: numberOfGuests || 1,
          specialRequests: specialRequests || null,
        },
        include: {
          room: {
            select: {
              roomNumber: true,
              type: true,
              price: true,
              amenities: true,
            },
          },
          user: { select: { name: true, email: true } },
        },
      });

      const cancellationDeadline = new Date(checkIn);
      cancellationDeadline.setHours(cancellationDeadline.getHours() - 48); // 48h before check-in

      const unifiedBooking = await tx.unifiedBooking.create({
        data: {
          userId,
          serviceType: "HOTEL",
          hotelBookingId: hotelBooking.id,
          serviceStartDate: checkIn,
          serviceEndDate: checkOut,
          subtotal,
          tax,
          serviceFee,
          totalPrice,
          bookingStatus: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          referenceCode: generateReferenceCode("HOTEL"),
          cancellationDeadline,
          cartId: cartId || null,
          specialRequests: specialRequests || null,
        },
      });

      // Link the hotel booking back to unified
      await tx.booking.update({
        where: { id: hotelBooking.id },
        data: { unifiedBookingId: unifiedBooking.id },
      });

      if (cartId) {
        await tx.cart.update({
          where: { id: cartId },
          data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
        });
      }

      return { hotelBooking, unifiedBooking };
    });

    return res.status(201).json({
      status: "success",
      message: "Booking created successfully",
      data: {
        booking: {
          id: result.hotelBooking.id,
          room: result.hotelBooking.room,
          guest: result.hotelBooking.user,
          checkInDate: result.hotelBooking.checkInDate,
          checkOutDate: result.hotelBooking.checkOutDate,
          numberOfGuests: result.hotelBooking.numberOfGuests,
          specialRequests: result.hotelBooking.specialRequests,
          status: result.hotelBooking.status,
          paymentStatus: result.hotelBooking.paymentStatus,
        },
        unified: {
          id: result.unifiedBooking.id,
          referenceCode: result.unifiedBooking.referenceCode,
          bookingStatus: result.unifiedBooking.bookingStatus,
          cancellationDeadline: result.unifiedBooking.cancellationDeadline,
          pricing: {
            subtotal,
            tax,
            serviceFee,
            totalPrice,
            currency: "NGN",
            breakdown: {
              pricePerNight: parseFloat(room.price),
              numberOfNights,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL BOOKINGS (admin sees all, user sees own) ====================
const getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.user.role !== "admin") {
      where.userId = req.user.sub; // FIX: was req.user.id — JWT uses sub
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          room: {
            select: { roomNumber: true, type: true, floor: true, price: true },
          },
          user:
            req.user.role === "admin"
              ? { select: { name: true, email: true, phoneNumber: true } }
              : false,
        },
      }),
      prisma.booking.count({ where }),
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
    console.error("Get All Bookings Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET BOOKING BY ID ====================
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
        user: { select: { name: true, email: true, phoneNumber: true } },
        payments: {
          select: {
            amount: true,
            status: true,
            paymentMethod: true,
            paidAt: true,
          },
        },
        unifiedBooking: {
          select: {
            referenceCode: true,
            bookingStatus: true,
            totalPrice: true,
            cancellationDeadline: true,
          },
        },
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ status: "fail", message: "Booking not found" });
    }

    // Non-admin users can only view their own bookings
    if (req.user.role !== "admin" && booking.userId !== req.user.sub) {
      return res.status(403).json({ status: "fail", message: "Access denied" });
    }

    return res.status(200).json({ status: "success", data: booking });
  } catch (error) {
    console.error("Get Booking By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE BOOKING (admin: status transitions) ====================
const updateBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    let { status, paymentStatus } = req.body;

    // Normalize paymentStatus to match Prisma enum
    const paymentStatusMap = {
      completed: "SUCCESSFUL",
      pending: "PENDING",
      failed: "FAILED",
      refunded: "REFUNDED",
    };
    if (paymentStatus) {
      paymentStatus = paymentStatusMap[paymentStatus] ?? paymentStatus;
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!existingBooking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["checked_in", "cancelled", "no_show"],
      checked_in: ["checked_out"],
      checked_out: [],
      cancelled: [],
      no_show: [],
    };

    if (status && status !== existingBooking.status) {
      if (!validTransitions[existingBooking.status]?.includes(status)) {
        return res.status(400).json({
          status: "fail",
          error: `Cannot transition from "${existingBooking.status}" to "${status}"`,
          allowedTransitions: validTransitions[existingBooking.status],
        });
      }
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (status === "checked_in" && !existingBooking.actualCheckIn) {
      updateData.actualCheckIn = new Date();
    }
    if (status === "checked_out" && !existingBooking.actualCheckOut) {
      updateData.actualCheckOut = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        room: { select: { roomNumber: true, type: true } },
        user: { select: { name: true, email: true } },
      },
    });

    // Mirror payment status to unified booking if changed
    if (paymentStatus && existingBooking.unifiedBookingId) {
      await prisma.unifiedBooking.update({
        where: { id: existingBooking.unifiedBookingId },
        data: { paymentStatus },
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(500).json({
      status: "error",
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// ==================== CANCEL BOOKING (hotel-level, no refund logic) ====================
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    // Only owner or admin can cancel
    if (req.user.role !== "admin" && booking.userId !== userId) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot cancel a booking with status: ${booking.status}`,
      });
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });

    return res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully",
      data: cancelledBooking,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE BOOKING (admin only) ====================
const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!existingBooking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    await prisma.booking.delete({ where: { id: bookingId } });

    return res
      .status(200)
      .json({ status: "success", message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UNIFIED: GET MY BOOKINGS (all services) ====================
const getMyUnifiedBookings = async (req, res) => {
  try {
    const userId = req.user.sub;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { serviceType, bookingStatus } = req.query;

    const where = { userId };
    if (
      serviceType &&
      ["HOTEL", "FLIGHT", "ATTRACTION", "CAR"].includes(serviceType)
    ) {
      where.serviceType = serviceType;
    }
    if (bookingStatus) {
      where.bookingStatus = bookingStatus;
    }

    const [bookings, total] = await Promise.all([
      prisma.unifiedBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          payments: {
            where: { status: "SUCCESSFUL" },
            select: {
              amount: true,
              paidAt: true,
              reference: true,
              paymentMethod: true,
            },
          },
        },
      }),
      prisma.unifiedBooking.count({ where }),
    ]);

    // Enrich with service-specific details in parallel
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        let serviceDetails = null;

        if (booking.serviceType === "HOTEL" && booking.hotelBookingId) {
          serviceDetails = await prisma.booking.findUnique({
            where: { id: booking.hotelBookingId },
            include: {
              room: {
                select: {
                  roomNumber: true,
                  type: true,
                  floor: true,
                  images: true,
                },
              },
            },
          });
        } else if (
          booking.serviceType === "FLIGHT" &&
          booking.flightBookingId
        ) {
          serviceDetails = await prisma.flightBooking.findUnique({
            where: { id: booking.flightBookingId },
            include: { segments: { include: { flight: true, seat: true } } },
          });
        } else if (
          booking.serviceType === "ATTRACTION" &&
          booking.attractionBookingId
        ) {
          serviceDetails = await prisma.touristAttractionBooking.findUnique({
            where: { id: booking.attractionBookingId },
            include: {
              attraction: {
                select: {
                  name: true,
                  category: true,
                  city: true,
                  images: true,
                },
              },
              timeSlot: true,
            },
          });
        }

        return { ...booking, serviceDetails };
      }),
    );

    return res.status(200).json({
      status: "success",
      results: enrichedBookings.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: enrichedBookings,
    });
  } catch (error) {
    console.error("Get Unified Bookings Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UNIFIED: CANCEL ANY BOOKING (with refund) ====================
const cancelUnifiedBooking = async (req, res) => {
  try {
    const { unifiedBookingId } = req.params;
    const userId = req.user.sub;
    const { reason } = req.body;

    const unifiedBooking = await prisma.unifiedBooking.findFirst({
      where: { id: unifiedBookingId, userId },
    });

    if (!unifiedBooking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    if (unifiedBooking.bookingStatus === "CANCELLED") {
      return res
        .status(400)
        .json({ status: "fail", error: "Booking is already cancelled" });
    }

    if (
      unifiedBooking.cancellationDeadline &&
      new Date() > unifiedBooking.cancellationDeadline
    ) {
      return res.status(400).json({
        status: "fail",
        error: "Cancellation window has expired",
        deadline: unifiedBooking.cancellationDeadline,
      });
    }

    // Cancel the service-specific record
    let cancelledServiceBooking = null;

    if (
      unifiedBooking.serviceType === "HOTEL" &&
      unifiedBooking.hotelBookingId
    ) {
      cancelledServiceBooking = await prisma.booking.update({
        where: { id: unifiedBooking.hotelBookingId },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
    } else if (
      unifiedBooking.serviceType === "FLIGHT" &&
      unifiedBooking.flightBookingId
    ) {
      // Fetch segments to release seats
      const flightBooking = await prisma.flightBooking.findUnique({
        where: { id: unifiedBooking.flightBookingId },
        include: { segments: true },
      });
      const seatIds = flightBooking.segments.map((s) => s.seatId);

      await prisma.$transaction([
        prisma.flightBooking.update({
          where: { id: unifiedBooking.flightBookingId },
          data: { status: "CANCELLED" },
        }),
        prisma.seat.updateMany({
          where: { id: { in: seatIds } },
          data: { isAvailable: true },
        }),
      ]);
      cancelledServiceBooking = flightBooking;
    } else if (
      unifiedBooking.serviceType === "ATTRACTION" &&
      unifiedBooking.attractionBookingId
    ) {
      cancelledServiceBooking = await prisma.touristAttractionBooking.update({
        where: { id: unifiedBooking.attractionBookingId },
        data: { status: "CANCELLED" },
      });

      if (cancelledServiceBooking?.timeSlotId) {
        await prisma.touristAttractionTimeSlot.update({
          where: { id: cancelledServiceBooking.timeSlotId },
          data: {
            confirmedSpots: {
              decrement: cancelledServiceBooking.numberOfPeople,
            },
            availableSpots: {
              increment: cancelledServiceBooking.numberOfPeople,
            },
          },
        });
      }
    }

    // Calculate refund
    let refundAmount = 0;
    if (unifiedBooking.paymentStatus === "SUCCESSFUL") {
      const hoursUntilStart =
        (new Date(unifiedBooking.serviceStartDate) - new Date()) /
        (1000 * 3600);
      let refundPercentage = 0;

      if (unifiedBooking.serviceType === "HOTEL") {
        refundPercentage =
          hoursUntilStart > 48 ? 100 : hoursUntilStart > 24 ? 50 : 0;
      } else if (unifiedBooking.serviceType === "ATTRACTION") {
        refundPercentage = 90;
      } else if (unifiedBooking.serviceType === "FLIGHT") {
        refundPercentage = 0; // Airlines typically non-refundable
      }

      refundAmount = parseFloat(
        (
          (parseFloat(unifiedBooking.totalPrice) * refundPercentage) /
          100
        ).toFixed(2),
      );
    }

    // Update unified booking + process wallet refund in one transaction
    const [updatedUnifiedBooking] = await prisma.$transaction(async (tx) => {
      const updated = await tx.unifiedBooking.update({
        where: { id: unifiedBookingId },
        data: {
          bookingStatus: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: reason || null,
          refundAmount: refundAmount > 0 ? refundAmount : null,
          refundProcessedAt: refundAmount > 0 ? new Date() : null,
        },
      });

      if (refundAmount > 0) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const balanceBefore = parseFloat(user.walletBalance);
        const balanceAfter = parseFloat(
          (balanceBefore + refundAmount).toFixed(2),
        );

        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: refundAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            amount: refundAmount,
            type: "CREDIT",
            balanceBefore,
            balanceAfter,
            description: `Refund for cancelled booking ${unifiedBooking.referenceCode}`,
            reference: `REF-${unifiedBooking.referenceCode}-${Date.now()}`,
            unifiedBookingId: unifiedBooking.id,
            status: "COMPLETED",
          },
        });
      }

      return [updated];
    });

    return res.status(200).json({
      status: "success",
      message: "Booking cancelled successfully",
      data: {
        unifiedBooking: updatedUnifiedBooking,
        refund: {
          eligible: refundAmount > 0,
          amount: refundAmount,
          currency: "NGN",
          processedToWallet: refundAmount > 0,
        },
      },
    });
  } catch (error) {
    console.error("Cancel Unified Booking Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createBookings,
  getBookings,
  getBookingById,
  updateBookingById,
  cancelBooking,
  deleteBooking,
  getMyUnifiedBookings,
  cancelUnifiedBooking,
};
