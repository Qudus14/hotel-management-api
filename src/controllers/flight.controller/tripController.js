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
      airlineId,
      planeId,
      departureAirport,
      arrivalAirport,
      originCity,
      destinationCity,
      departureTime,
      arrivalTime,
      price,
      status,
      gateNumber,
      terminal,
      economyPrice,
      economySeats,
      businessPrice,
      businessSeats,
      firstClassPrice,
      firstClassSeats,
    } = req.body;

    // Validate plane exists
    const plane = await prisma.plane.findUnique({ where: { id: planeId } });
    if (!plane) {
      return res.status(404).json({ status: "fail", error: "Plane not found" });
    }
    if (plane.status !== "ACTIVE") {
      return res.status(400).json({
        status: "fail",
        error: `Plane is currently ${plane.status} and cannot be assigned to a new flight`,
      });
    }

    // Validate airline if provided
    if (airlineId) {
      const airline = await prisma.airline.findUnique({
        where: { id: airlineId },
      });
      if (!airline) {
        return res
          .status(404)
          .json({ status: "fail", error: "Airline not found" });
      }
      if (!airline.isApproved) {
        return res.status(400).json({
          status: "fail",
          error: "Airline is not yet approved",
        });
      }
    }

    const depTime = new Date(departureTime);
    const arrTime = new Date(arrivalTime);

    if (arrTime <= depTime) {
      return res.status(400).json({
        status: "fail",
        error: "Arrival time must be after departure time",
      });
    }

    const durationMinutes = Math.round((arrTime - depTime) / 60000);
    const basePrice = parseFloat(price);

    const result = await prisma.$transaction(async (tx) => {
      const flight = await tx.flight.create({
        data: {
          flightNumber,
          airlineId: airlineId || null,
          planeId,
          departureAirport: departureAirport.toUpperCase(),
          arrivalAirport: arrivalAirport.toUpperCase(),
          originCity: originCity || null,
          destinationCity: destinationCity || null,
          departureTime: depTime,
          arrivalTime: arrTime,
          durationMinutes,
          price: basePrice,
          status: status ? status.toUpperCase() : "SCHEDULED",
          gateNumber: gateNumber || null,
          terminal: terminal || null,
          // Seat class breakdown — use provided values or auto-calculate from totalSeats
          economyPrice: economyPrice ? parseFloat(economyPrice) : basePrice,
          economySeats: economySeats ?? Math.floor(plane.totalSeats * 0.7),
          economySold: 0,
          businessPrice: businessPrice
            ? parseFloat(businessPrice)
            : parseFloat((basePrice * 1.5).toFixed(2)),
          businessSeats:
            businessSeats ??
            Math.floor(plane.totalSeats * 0.3) -
              Math.floor(plane.totalSeats * 0.1),
          businessSold: 0,
          firstClassPrice: firstClassPrice
            ? parseFloat(firstClassPrice)
            : parseFloat((basePrice * 3.0).toFixed(2)),
          firstClassSeats:
            firstClassSeats ?? Math.floor(plane.totalSeats * 0.1),
          firstClassSold: 0,
        },
      });

      // Auto-generate seats based on plane capacity
      const totalSeats = plane.totalSeats;
      const firstLimit = Math.floor(totalSeats * 0.1);
      const businessLimit = Math.floor(totalSeats * 0.3);

      const calcFirstClassPrice = firstClassPrice
        ? parseFloat(firstClassPrice)
        : parseFloat((basePrice * 3.0).toFixed(2));
      const calcBusinessPrice = businessPrice
        ? parseFloat(businessPrice)
        : parseFloat((basePrice * 1.5).toFixed(2));
      const calcEconomyPrice = economyPrice
        ? parseFloat(economyPrice)
        : basePrice;

      const seats = Array.from({ length: totalSeats }, (_, i) => {
        const seatNum = i + 1;
        let seatClass = "Economy";
        let seatPrice = calcEconomyPrice;

        if (seatNum <= firstLimit) {
          seatClass = "First";
          seatPrice = calcFirstClassPrice;
        } else if (seatNum <= businessLimit) {
          seatClass = "Business";
          seatPrice = calcBusinessPrice;
        }

        return {
          flightId: flight.id,
          seatNumber: seatNum.toString().padStart(3, "0"),
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
        seatsGenerated: plane.totalSeats,
        seatBreakdown: {
          first: Math.floor(plane.totalSeats * 0.1),
          business:
            Math.floor(plane.totalSeats * 0.3) -
            Math.floor(plane.totalSeats * 0.1),
          economy: plane.totalSeats - Math.floor(plane.totalSeats * 0.3),
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
    console.error("Create Flight Error:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
};

// ==================== SEARCH / GET ALL FLIGHTS ====================
const getAllFlights = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { from, to, date, status, airlineId, originCity, destinationCity } =
      req.query;

    const where = { deletedAt: null };

    if (from) where.departureAirport = from.toUpperCase();
    if (to) where.arrivalAirport = to.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (airlineId) where.airlineId = airlineId;
    if (originCity)
      where.originCity = { contains: originCity, mode: "insensitive" };
    if (destinationCity)
      where.destinationCity = {
        contains: destinationCity,
        mode: "insensitive",
      };

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
          airline: {
            select: { id: true, name: true, iataCode: true, logoUrl: true },
          },
          plane: { select: { id: true, model: true, registration: true } },
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
    console.error("Get All Flights Error:", error);
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
        airline: {
          select: { id: true, name: true, iataCode: true, logoUrl: true },
        },
        plane: {
          select: {
            id: true,
            model: true,
            manufacturer: true,
            registration: true,
            totalSeats: true,
          },
        },
        addOns: true,
        _count: { select: { seats: { where: { isAvailable: true } } } },
      },
    });

    if (!flight || flight.deletedAt) {
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
    console.error("Get Flight By ID Error:", error);
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
    if (!existing || existing.deletedAt) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      originCity,
      destinationCity,
      departureTime,
      arrivalTime,
      price,
      gateNumber,
      terminal,
      delayMinutes,
      delayReason,
      economyPrice,
      businessPrice,
      firstClassPrice,
    } = req.body;

    const updateData = {};
    if (flightNumber !== undefined) updateData.flightNumber = flightNumber;
    if (departureAirport !== undefined)
      updateData.departureAirport = departureAirport.toUpperCase();
    if (arrivalAirport !== undefined)
      updateData.arrivalAirport = arrivalAirport.toUpperCase();
    if (originCity !== undefined) updateData.originCity = originCity;
    if (destinationCity !== undefined)
      updateData.destinationCity = destinationCity;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (gateNumber !== undefined) updateData.gateNumber = gateNumber;
    if (terminal !== undefined) updateData.terminal = terminal;
    if (delayMinutes !== undefined)
      updateData.delayMinutes = Number(delayMinutes);
    if (delayReason !== undefined) updateData.delayReason = delayReason;
    if (economyPrice !== undefined)
      updateData.economyPrice = parseFloat(economyPrice);
    if (businessPrice !== undefined)
      updateData.businessPrice = parseFloat(businessPrice);
    if (firstClassPrice !== undefined)
      updateData.firstClassPrice = parseFloat(firstClassPrice);

    if (departureTime !== undefined)
      updateData.departureTime = new Date(departureTime);
    if (arrivalTime !== undefined)
      updateData.arrivalTime = new Date(arrivalTime);

    // Recalculate duration if times changed
    const newDep = updateData.departureTime || existing.departureTime;
    const newArr = updateData.arrivalTime || existing.arrivalTime;
    if (updateData.departureTime || updateData.arrivalTime) {
      if (newArr <= newDep) {
        return res.status(400).json({
          status: "fail",
          error: "Arrival time must be after departure time",
        });
      }
      updateData.durationMinutes = Math.round((newArr - newDep) / 60000);
    }

    const updated = await prisma.flight.update({
      where: { id: flightId },
      data: updateData,
      include: {
        airline: { select: { id: true, name: true, iataCode: true } },
        plane: { select: { id: true, model: true, registration: true } },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Flight updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Flight Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE FLIGHT STATUS ONLY ====================
const updateFlightStatus = async (req, res) => {
  try {
    const { flightId } = req.params;
    const { status, delayMinutes, delayReason } = req.body;
    const upperStatus = status?.toUpperCase();

    if (!VALID_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        status: "fail",
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const flight = await prisma.flight.findUnique({ where: { id: flightId } });
    if (!flight || flight.deletedAt) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    const updateData = { status: upperStatus };
    if (upperStatus === "DELAYED") {
      if (delayMinutes !== undefined)
        updateData.delayMinutes = Number(delayMinutes);
      if (delayReason !== undefined) updateData.delayReason = delayReason;
    }

    const updated = await prisma.flight.update({
      where: { id: flightId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: `Flight status updated to ${upperStatus}`,
      data: updated,
    });
  } catch (error) {
    console.error("Update Flight Status Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== SOFT DELETE FLIGHT ====================
const deleteFlightById = async (req, res) => {
  try {
    const { flightId } = req.params;
    const adminId = req.user.sub;

    const existing = await prisma.flight.findUnique({
      where: { id: flightId },
    });
    if (!existing || existing.deletedAt) {
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
        error: `Cannot delete flight with ${activeBookings} active booking(s). Cancel the flight status instead.`,
      });
    }

    await prisma.flight.update({
      where: { id: flightId },
      data: { deletedAt: new Date(), deletedBy: adminId },
    });

    return res.status(200).json({
      status: "success",
      message: "Flight deleted successfully",
    });
  } catch (error) {
    console.error("Delete Flight Error:", error);
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
