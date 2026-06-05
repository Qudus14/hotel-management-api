const { prisma } = require("../config/db");
const { format } = require("date-fns");

// Add this to your unified booking controller
const getAdminUnifiedBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const { serviceType, bookingStatus, paymentStatus, search } = req.query;

    const where = {};
    if (serviceType && serviceType !== "all") where.serviceType = serviceType;
    if (bookingStatus && bookingStatus !== "all")
      where.bookingStatus = bookingStatus;
    if (paymentStatus && paymentStatus !== "all")
      where.paymentStatus = paymentStatus;

    // Search by reference code or user name
    if (search) {
      where.OR = [
        { referenceCode: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.unifiedBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true, phoneNumber: true } },
          payments: { where: { status: "SUCCESSFUL" } },
          bookings: { include: { room: { include: { hotel: true } } } },
          flightBookings: {
            include: { segments: { include: { flight: true, seat: true } } },
          },
          attractionBookings: { include: { attraction: true, timeSlot: true } },
          carRentals: { include: { car: { include: { carStore: true } } } },
        },
      }),
      prisma.unifiedBooking.count({ where }),
    ]);

    // Transform to consistent format
    const transformed = bookings.map((booking) => ({
      id: booking.id,
      referenceCode: booking.referenceCode,
      source: booking.serviceType.toLowerCase(),
      serviceName: booking.serviceType,
      customerName: booking.user.name,
      amount: parseFloat(booking.totalPrice),
      paymentStatus: booking.paymentStatus.toLowerCase(),
      status: booking.bookingStatus.toLowerCase(),
      dates: getServiceDates(booking),
      serviceDetails: getServiceDetails(booking),
      createdAt: booking.createdAt,
      user: booking.user,
      raw: booking,
    }));

    return res.status(200).json({
      status: "success",
      results: transformed.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: transformed,
    });
  } catch (error) {
    console.error("Get Admin Unified Bookings Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// Helper functions
function getServiceDates(booking) {
  if (booking.serviceType === "HOTEL" && booking.bookings[0]) {
    const b = booking.bookings[0];
    return `${format(b.checkInDate, "MMM dd")} – ${format(b.checkOutDate, "MMM dd, yyyy")}`;
  }
  if (
    booking.serviceType === "FLIGHT" &&
    booking.flightBookings[0]?.segments[0]
  ) {
    return format(
      booking.flightBookings[0].segments[0].flight.departureTime,
      "MMM dd, yyyy",
    );
  }
  if (
    booking.serviceType === "ATTRACTION" &&
    booking.attractionBookings[0]?.timeSlot
  ) {
    const ts = booking.attractionBookings[0].timeSlot;
    return `${format(ts.date, "MMM dd, yyyy")} ${ts.startTime}–${ts.endTime}`;
  }
  if (booking.serviceType === "CAR" && booking.carRentals[0]) {
    const cr = booking.carRentals[0];
    return `${format(cr.pickupDate, "MMM dd")} – ${format(cr.returnDate, "MMM dd, yyyy")}`;
  }
  return format(booking.serviceStartDate, "MMM dd, yyyy");
}

function getServiceDetails(booking) {
  if (booking.serviceType === "HOTEL" && booking.bookings[0]?.room) {
    const room = booking.bookings[0].room;
    return `${room.hotel?.name || "Hotel"} · Room ${room.roomNumber} (${room.type})`;
  }
  if (booking.serviceType === "FLIGHT" && booking.flightBookings[0]?.segments) {
    const segments = booking.flightBookings[0].segments;
    const first = segments[0]?.flight;
    const last = segments[segments.length - 1]?.flight;
    return `${first?.departureAirport} → ${last?.arrivalAirport}`;
  }
  if (booking.serviceType === "ATTRACTION" && booking.attractionBookings[0]) {
    const ab = booking.attractionBookings[0];
    return `${ab.attraction?.name || "Attraction"} · ${ab.numberOfPeople} ${ab.numberOfPeople === 1 ? "person" : "people"}`;
  }
  if (booking.serviceType === "CAR" && booking.carRentals[0]?.car) {
    const car = booking.carRentals[0].car;
    return `${car.make} ${car.model} · ${car.plateNumber}`;
  }
  return booking.serviceType;
}

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
          carRentals: {
            take: 1,
            include: {
              car: {
                select: {
                  make: true,
                  model: true,
                  year: true,
                  color: true,
                  images: true,
                  plateNumber: true,
                  category: { select: { name: true, pricePerDay: true } },
                  pickupLocation: { select: { name: true, address: true } },
                  carStore: {
                    select: { name: true, phoneNumber: true, email: true },
                  },
                },
              },
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
        } else if (booking.serviceType === "CAR") {
          serviceDetails = booking.carRentals?.[0] || null;
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
    } else if (unifiedBooking.serviceType === "CAR") {
      // Find the linked car rental via relation
      const linkedRental = await prisma.carRental.findFirst({
        where: { unifiedBookingId: unifiedBooking.id },
      });
      if (linkedRental) {
        cancelledServiceBooking = await prisma.carRental.update({
          where: { id: linkedRental.id },
          data: { status: "cancelled" },
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
      } else if (unifiedBooking.serviceType === "CAR") {
        refundPercentage =
          hoursUntilStart > 48 ? 100 : hoursUntilStart > 24 ? 50 : 0;
      } else if (unifiedBooking.serviceType === "ATTRACTION") {
        refundPercentage = 90;
      } else if (unifiedBooking.serviceType === "FLIGHT") {
        refundPercentage = 0;
      }

      refundAmount = parseFloat(
        (
          (parseFloat(unifiedBooking.totalPrice) * refundPercentage) /
          100
        ).toFixed(2),
      );
    }

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
  cancelUnifiedBooking,
  getAdminUnifiedBookings,
  getMyUnifiedBookings,
};
