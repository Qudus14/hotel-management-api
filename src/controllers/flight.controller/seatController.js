const { prisma } = require("../../config/db");

const getSeatsByFlight = async (req, res) => {
  try {
    const { flightId } = req.params;

    if (!flightId) {
      return res
        .status(400)
        .json({ error: "flightId query parameter is required" });
    }

    const seats = await prisma.seat.findMany({
      where: {
        flightId: flightId,
        isAvailable: true, // Only fetch seats the user can actually book
      },
      orderBy: {
        seatNumber: "asc", // Keep them in order (01, 02, 03...)
      },
      select: {
        id: true, // The UUID needed for the booking
        seatNumber: true,
        class: true,
        price: true,
        isAvailable: true,
      },
    });

    res.status(200).json({
      flightId,
      count: seats.length,
      seats,
    });
  } catch (error) {
    console.error("Get Seats Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getSeatsByFlight,
};
