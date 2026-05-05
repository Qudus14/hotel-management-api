const { prisma } = require("../../config/db");

const getSeatsByFlight = async (req, res) => {
  try {
    const { flightId } = req.params;
    const { class: seatClass, available } = req.query;

    const flight = await prisma.flight.findUnique({ where: { id: flightId } });
    if (!flight) {
      return res
        .status(404)
        .json({ status: "fail", error: "Flight not found" });
    }

    const where = { flightId };

    // Optional filters
    if (seatClass) where.class = seatClass; // Economy, Business, First
    if (available !== undefined) where.isAvailable = available === "true";

    const seats = await prisma.seat.findMany({
      where,
      orderBy: { seatNumber: "asc" },
      select: {
        id: true, // ← this is what you pass as seatId when booking
        seatNumber: true,
        class: true,
        price: true,
        isAvailable: true,
      },
    });

    // Group by class for easier frontend rendering
    const grouped = seats.reduce((acc, seat) => {
      if (!acc[seat.class]) acc[seat.class] = [];
      acc[seat.class].push(seat);
      return acc;
    }, {});

    return res.status(200).json({
      status: "success",
      flightId,
      flight: {
        flightNumber: flight.flightNumber,
        from: flight.departureAirport,
        to: flight.arrivalAirport,
        departure: flight.departureTime,
        status: flight.status,
      },
      summary: {
        total: seats.length,
        available: seats.filter((s) => s.isAvailable).length,
        byClass: Object.entries(grouped).reduce((acc, [cls, s]) => {
          acc[cls] = {
            total: s.length,
            available: s.filter((x) => x.isAvailable).length,
          };
          return acc;
        }, {}),
      },
      data: grouped,
    });
  } catch (error) {
    console.error("Get Seats Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = { getSeatsByFlight };
