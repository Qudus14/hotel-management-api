const { prisma } = require("../../config/db");
const { randomUUID } = require("crypto");
const QRCode = require("qrcode");

const generateReferenceCode = (serviceType) => {
  const prefix = { HOTEL: "HTL", FLIGHT: "FLT", ATTRACTION: "ATR", CAR: "CAR" }[
    serviceType
  ];
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ==================== BOOK AN ATTRACTION ====================
const createAttractionBooking = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { attractionId, timeSlotId, numberOfPeople, visitorNames, cartId } =
      req.body;

    // 1. Validate attraction
    const attraction = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!attraction) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }
    if (!attraction.isActive || !attraction.isBookable) {
      return res
        .status(400)
        .json({
          status: "fail",
          error: "Attraction is not available for booking",
        });
    }

    // 2. Validate time slot
    const timeSlot = await prisma.touristAttractionTimeSlot.findUnique({
      where: { id: timeSlotId },
    });
    if (!timeSlot || timeSlot.attractionId !== attractionId) {
      return res
        .status(404)
        .json({ status: "fail", error: "Time slot not found" });
    }
    if (timeSlot.isBlocked) {
      return res
        .status(400)
        .json({ status: "fail", error: "This time slot is not available" });
    }
    if (timeSlot.availableSpots < numberOfPeople) {
      return res.status(400).json({
        status: "fail",
        error: `Only ${timeSlot.availableSpots} spot(s) available, requested ${numberOfPeople}`,
      });
    }

    // 3. Validate advance booking rules
    const slotDateTime = new Date(
      `${timeSlot.date.toISOString().split("T")[0]}T${timeSlot.startTime}`,
    );
    const hoursUntilSlot = (slotDateTime - new Date()) / (1000 * 3600);

    if (hoursUntilSlot < attraction.minAdvanceHours) {
      return res.status(400).json({
        status: "fail",
        error: `Booking must be made at least ${attraction.minAdvanceHours} hour(s) in advance`,
      });
    }
    if (hoursUntilSlot > attraction.maxAdvanceDays * 24) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot book more than ${attraction.maxAdvanceDays} days in advance`,
      });
    }

    // 4. Validate visitor names match numberOfPeople
    if (visitorNames && visitorNames.length !== numberOfPeople) {
      return res.status(400).json({
        status: "fail",
        error: `visitorNames count (${visitorNames.length}) must match numberOfPeople (${numberOfPeople})`,
      });
    }

    // 5. Calculate pricing
    const pricePerPerson = timeSlot.specialPrice
      ? parseFloat(timeSlot.specialPrice)
      : parseFloat(attraction.basePrice) * parseFloat(timeSlot.priceMultiplier);

    const subtotal = parseFloat((pricePerPerson * numberOfPeople).toFixed(2));
    const tax = parseFloat((subtotal * 0.075).toFixed(2));
    const serviceFee = parseFloat((subtotal * 0.02).toFixed(2));
    const totalPrice = parseFloat((subtotal + tax + serviceFee).toFixed(2));

    const cancellationDeadline = new Date(slotDateTime);
    cancellationDeadline.setHours(
      cancellationDeadline.getHours() - attraction.cancellationWindowHours,
    );

    // 6. Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Lock the spots
      await tx.touristAttractionTimeSlot.update({
        where: { id: timeSlotId },
        data: {
          availableSpots: { decrement: numberOfPeople },
          confirmedSpots: { increment: numberOfPeople },
        },
      });

      // Create unified booking first (attraction booking needs its id)
      const unifiedBooking = await tx.unifiedBooking.create({
        data: {
          userId,
          serviceType: "ATTRACTION",
          serviceStartDate: slotDateTime,
          serviceEndDate: slotDateTime, // Same day
          subtotal,
          tax,
          serviceFee,
          totalPrice,
          bookingStatus: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          referenceCode: generateReferenceCode("ATTRACTION"),
          cancellationDeadline,
          cartId: cartId || null,
        },
      });

      // Generate ticket number
      const ticketNumber = `TKT-${unifiedBooking.referenceCode}`;

      // Generate QR code
      const qrCode = await QRCode.toDataURL(
        JSON.stringify({
          ticketNumber,
          attractionId,
          timeSlotId,
          numberOfPeople,
        }),
      );

      // Create the attraction booking
      const attractionBooking = await tx.touristAttractionBooking.create({
        data: {
          unifiedBookingId: unifiedBooking.id,
          attractionId,
          timeSlotId,
          numberOfPeople,
          visitorNames: visitorNames || [],
          pricePerPerson,
          subtotal,
          tax,
          totalPrice,
          qrCode,
          ticketNumber,
          status: "CONFIRMED",
        },
        include: {
          attraction: {
            select: { name: true, city: true, country: true, images: true },
          },
          timeSlot: true,
        },
      });

      // Link back — update unified booking with attractionBookingId
      await tx.unifiedBooking.update({
        where: { id: unifiedBooking.id },
        data: { attractionBookingId: attractionBooking.id },
      });

      if (cartId) {
        await tx.cart.update({
          where: { id: cartId },
          data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
        });
      }

      return { attractionBooking, unifiedBooking };
    });

    return res.status(201).json({
      status: "success",
      message: "Attraction booked successfully",
      data: {
        booking: result.attractionBooking,
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
            pricePerPerson,
            currency: "NGN",
          },
        },
      },
    });
  } catch (error) {
    console.error("Create Attraction Booking Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET MY ATTRACTION BOOKINGS ====================
const getMyAttractionBookings = async (req, res) => {
  try {
    const userId = req.user.sub;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      unifiedBooking: { userId },
    };

    const [bookings, total] = await Promise.all([
      prisma.touristAttractionBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attraction: {
            select: {
              name: true,
              city: true,
              country: true,
              images: true,
              category: true,
            },
          },
          timeSlot: { select: { date: true, startTime: true, endTime: true } },
          unifiedBooking: {
            select: {
              referenceCode: true,
              bookingStatus: true,
              paymentStatus: true,
              totalPrice: true,
            },
          },
        },
      }),
      prisma.touristAttractionBooking.count({ where }),
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
    console.error("Get My Attraction Bookings Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ATTRACTION BOOKING BY ID ====================
const getAttractionBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.sub;

    const booking = await prisma.touristAttractionBooking.findUnique({
      where: { id: bookingId },
      include: {
        attraction: true,
        timeSlot: true,
        unifiedBooking: {
          select: {
            referenceCode: true,
            bookingStatus: true,
            paymentStatus: true,
            totalPrice: true,
            cancellationDeadline: true,
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Booking not found" });
    }

    // Ownership check
    if (req.user.role !== "admin" && booking.unifiedBooking.userId !== userId) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    return res.status(200).json({ status: "success", data: booking });
  } catch (error) {
    console.error("Get Attraction Booking By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== SCAN TICKET (staff/admin) ====================
const scanAttractionTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const booking = await prisma.touristAttractionBooking.findUnique({
      where: { ticketNumber },
      include: {
        attraction: { select: { name: true } },
        timeSlot: { select: { date: true, startTime: true, endTime: true } },
        unifiedBooking: {
          select: { bookingStatus: true, paymentStatus: true },
        },
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ status: "fail", error: "Ticket not found" });
    }

    if (booking.entryScanned) {
      return res.status(400).json({
        status: "fail",
        error: "Ticket already scanned",
        scannedAt: booking.scannedAt,
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        status: "fail",
        error: `Ticket status is ${booking.status} — entry not permitted`,
      });
    }

    if (booking.unifiedBooking.paymentStatus !== "SUCCESSFUL") {
      return res.status(400).json({
        status: "fail",
        error: "Payment not confirmed — entry not permitted",
      });
    }

    const scanned = await prisma.touristAttractionBooking.update({
      where: { ticketNumber },
      data: { entryScanned: true, scannedAt: new Date(), status: "COMPLETED" },
    });

    return res.status(200).json({
      status: "success",
      message: "Entry granted",
      data: {
        ticketNumber,
        attraction: booking.attraction.name,
        visitors: scanned.numberOfPeople,
        visitorNames: scanned.visitorNames,
        scannedAt: scanned.scannedAt,
      },
    });
  } catch (error) {
    console.error("Scan Ticket Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL BOOKINGS FOR AN ATTRACTION (admin) ====================
const getAttractionBookingsAdmin = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, date } = req.query;

    const where = { attractionId };
    if (status) where.status = status;
    if (date) where.timeSlot = { date: new Date(date) };

    const [bookings, total] = await Promise.all([
      prisma.touristAttractionBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          timeSlot: { select: { date: true, startTime: true, endTime: true } },
          unifiedBooking: {
            select: {
              referenceCode: true,
              paymentStatus: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.touristAttractionBooking.count({ where }),
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
    console.error("Get Attraction Bookings Admin Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createAttractionBooking,
  getMyAttractionBookings,
  getAttractionBookingById,
  scanAttractionTicket,
  getAttractionBookingsAdmin,
};
