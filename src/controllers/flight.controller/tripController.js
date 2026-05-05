const { prisma } = require("../../config/db");

const VALID_STATUSES = [
  "SCHEDULED",
  "DELAYED",
  "BOARDING",
  "DEPARTED",
  "ARRIVED",
  "CANCELLED",
];

// ==================== CREATE FLIGHT + AUTO-GENERATE SEATS ====================
const createFlight = async (req, res) => {
  try {
    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      price,
      status,
      airplaneId,
    } = req.body;

    const airplane = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });
    if (!airplane) {
      return res
        .status(404)
        .json({ status: "fail", error: "Airplane not found" });
    }

    const depTime = new Date(departureTime);
    const arrTime = new Date(arrivalTime);

    if (arrTime <= depTime) {
      return res
        .status(400)
        .json({
          status: "fail",
          error: "Arrival time must be after departure time",
        });
    }

    const result = await prisma.$transaction(async (tx) => {
      const flight = await tx.flight.create({
        data: {
          flightNumber,
          departureAirport: departureAirport.toUpperCase(),
          arrivalAirport: arrivalAirport.toUpperCase(),
          departureTime: depTime,
          arrivalTime: arrTime,
          price: parseFloat(price),
          status: status ? status.toUpperCase() : "SCHEDULED",
        },
      });

      // Auto-generate seats based on airplane capacity
      // Layout: 10% First, 20% Business, 70% Economy
      const firstClassLimit = Math.floor(airplane.capacity * 0.1);
      const businessClassLimit = Math.floor(airplane.capacity * 0.3);
      const basePrice = parseFloat(price);

      const seats = Array.from({ length: airplane.capacity }, (_, i) => {
        const seatNum = i + 1;
        let seatClass = "Economy";
        let seatPrice = basePrice;

        if (seatNum <= firstClassLimit) {
          seatClass = "First";
          seatPrice = basePrice * 3.0;
        } else if (seatNum <= businessClassLimit) {
          seatClass = "Business";
          seatPrice = basePrice * 1.5;
        }

        return {
          flightId: flight.id,
          seatNumber: seatNum.toString().padStart(3, "0"), // 001, 002...
          class: seatClass,
          price: parseFloat(seatPrice.toFixed(2)),
          isAvailable: true,
        };
      });

      await tx.seat.createMany({ data: seats });

      return flight;
    });

    return res.status(201).json({
      status: "success",
      message: "Flight created with seats auto-generated",
      data: {
        flight: result,
        seatsGenerated: airplane.capacity,
        seatBreakdown: {
          first: Math.floor(airplane.capacity * 0.1),
          business:
            Math.floor(airplane.capacity * 0.3) -
            Math.floor(airplane.capacity * 0.1),
          economy: airplane.capacity - Math.floor(airplane.capacity * 0.3),
        },
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: `Flight number '${req.body.flightNumber}' already exists`,
      });
    }
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// ==================== SEARCH / GET ALL FLIGHTS ====================
const getAllFlights = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Search filters
    const { from, to, date, status } = req.query;

    const where = { deletedAt: null };

    if (from) where.departureAirport = from.toUpperCase();
    if (to) where.arrivalAirport = to.toUpperCase();
    if (status) where.status = status.toUpperCase();

    // Filter by date (entire day range)
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.departureTime = { gte: start, lt: end };
    }

    const [flights, total] = await Promise.all([
      prisma.flight.findMany({
        where,
        skip,
        take: limit,
        orderBy: { departureTime: "asc" },
        include: {
          _count: { select: { seats: { where: { isAvailable: true } } } },
        },
      }),
      prisma.flight.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: flights.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: flights.map((f) => ({
        ...f,
        availableSeats: f._count.seats,
        _count: undefined,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET FLIGHT BY ID ====================
const getFlightById = async (req, res) => {
  try {
    const { flightId } = req.params;

    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: {
        _count: { select: { seats: { where: { isAvailable: true } } } },
      },
    });

    if (!flight) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    return res.status(200).json({
      status: "success",
      data: {
        ...flight,
        availableSeats: flight._count.seats,
        _count: undefined,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE FLIGHT DETAILS ====================
const updateFlightById = async (req, res) => {
  try {
    const { flightId } = req.params;

    const existing = await prisma.flight.findUnique({
      where: { id: flightId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    const updateData = {};
    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      price,
    } = req.body;

    if (flightNumber) updateData.flightNumber = flightNumber;
    if (departureAirport)
      updateData.departureAirport = departureAirport.toUpperCase();
    if (arrivalAirport)
      updateData.arrivalAirport = arrivalAirport.toUpperCase();
    if (price) updateData.price = parseFloat(price);
    if (departureTime) updateData.departureTime = new Date(departureTime);
    if (arrivalTime) updateData.arrivalTime = new Date(arrivalTime);

    const updated = await prisma.flight.update({
      where: { id: flightId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Flight updated successfully",
      data: updated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE FLIGHT STATUS ONLY ====================
const updateFlightStatus = async (req, res) => {
  try {
    const { flightId } = req.params;
    const { status } = req.body;
    const upperStatus = status?.toUpperCase();

    if (!VALID_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        status: "fail",
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const flight = await prisma.flight.findUnique({ where: { id: flightId } });
    if (!flight) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    const updated = await prisma.flight.update({
      where: { id: flightId },
      data: { status: upperStatus },
    });

    return res.status(200).json({
      status: "success",
      message: `Flight status updated to ${upperStatus}`,
      data: updated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE FLIGHT ====================
const deleteFlightById = async (req, res) => {
  try {
    const { flightId } = req.params;

    const existing = await prisma.flight.findUnique({
      where: { id: flightId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    // Prevent deleting flights with active bookings
    const activeBookings = await prisma.bookingSegment.count({
      where: {
        flightId,
        flightBooking: { status: { notIn: ["CANCELLED"] } },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete flight with ${activeBookings} active booking(s)`,
      });
    }

    await prisma.flight.delete({ where: { id: flightId } });

    return res
      .status(200)
      .json({ status: "success", message: "Flight deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createFlight,
  getAllFlights,
  getFlightById,
  updateFlightById,
  updateFlightStatus,
  deleteFlightById,
};
