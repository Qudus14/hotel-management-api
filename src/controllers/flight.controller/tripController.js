const { prisma } = require("../../config/db");

const createFlight = async (req, res) => {
  try {
    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      status,
      price,
      airplaneId, // Use this to get capacity
    } = req.body;

    // 1. Fetch the airplane to know its capacity
    const airplane = await prisma.airplane.findUnique({
      where: { id: airplaneId },
    });

    if (!airplane) {
      return res.status(404).json({ error: "Airplane not found" });
    }

    // 2. Wrap everything in a transaction so if seat creation fails,
    // the flight isn't created either (Atomic operation)
    const result = await prisma.$transaction(async (tx) => {
      // Create the Flight
      const flight = await tx.flight.create({
        data: {
          flightNumber,
          departureAirport,
          arrivalAirport,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          status: status ? status.toUpperCase() : undefined,
          price: parseFloat(price),
          // If your schema has a relation, link it here:
          // airplaneId: airplaneId
        },
      });

      // Prepare Seat Data based on Airplane capacity (First, Business, Economy)
      const seats = [];
      const firstClassLimit = Math.floor(airplane.capacity * 0.1); // Top 10%
      const businessClassLimit = Math.floor(airplane.capacity * 0.3); // Next 20% (up to 30% total)

      for (let i = 1; i <= airplane.capacity; i++) {
        let seatClass = "Economy";
        let seatPrice = parseFloat(price);

        if (i <= firstClassLimit) {
          // First Class Logic
          seatClass = "First";
          seatPrice = parseFloat(price) * 3.0; // 3x base price
        } else if (i <= businessClassLimit) {
          // Business Class Logic
          seatClass = "Business";
          seatPrice = parseFloat(price) * 1.5; // 1.5x base price
        }

        seats.push({
          flightId: flight.id,
          seatNumber: i.toString().padStart(2, "0"),
          class: seatClass,
          price: seatPrice,
          isAvailable: true,
        });
      }
      // Bulk create the seats
      await tx.seat.createMany({
        data: seats,
      });

      return flight;
    });

    res.status(201).json({
      message: "Flight and seats generated successfully",
      flight: result,
      totalSeats: airplane.capacity,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: `A flight with the number '${req.body.flightNumber}' already exists.`,
      });
    }
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

const getAllFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany();
    res.status(200).json({ flights });
  } catch (error) {
    console.error("Get Flights Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

const getFlightById = async (req, res) => {
  try {
    const flightId = req.params.flightId;
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
    });

    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    res.status(200).json({ flight });
  } catch (error) {
    console.error("Get Flight Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

const updateFlightById = async (req, res) => {
  try {
    // 1. Get the ID (Ensure this matches your Prisma type: String or Int)
    const { flightId } = req.params;

    // 2. Check if flight exists before updating
    const existingFlight = await prisma.flight.findUnique({
      where: { id: flightId },
    });

    if (!existingFlight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    // 3. Prepare the update data dynamically
    const updateData = {};
    const fields = [
      "flightNumber",
      "status",
      "price",
      "departureAirport",
      "arrivalAirport",
    ];

    // Only add fields to the update object if they exist in req.body
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Map 'departureAirport' to 'departure' as per your schema
        if (field === "departureAirport")
          updateData.departureAirport = req.body[field];
        else if (field === "arrivalAirport")
          updateData.arrivalAirport = req.body[field];
        else updateData[field] = req.body[field];
      }
    });

    // Handle Dates safely
    if (req.body.departureTime)
      updateData.departureTime = new Date(req.body.departureTime);
    if (req.body.arrivalTime)
      updateData.arrivalTime = new Date(req.body.arrivalTime);

    // 4. Perform the update
    const updatedFlight = await prisma.flight.update({
      where: { id: flightId },
      data: updateData,
    });

    res.status(200).json({
      message: "Flight updated successfully",
      flight: updatedFlight,
    });
  } catch (error) {
    console.error("Update Flight Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

const updateFlightStatus = async (req, res) => {
  try {
    const { flightId } = req.params;
    const { status } = req.body; // Admin only sends { "status": "delayed" }

    // Ensure the flight exists
    const flight = await prisma.flight.findUnique({ where: { id: flightId } });
    if (!flight) return res.status(404).json({ error: "Flight not found" });

    // Update only the status
    const updatedFlight = await prisma.flight.update({
      where: { id: flightId },
      data: {
        status,
        updatedAt: new Date(), // Manual sync if not handled by Prisma @updatedAt
      },
    });

    res.status(200).json({
      message: `Flight status updated to ${status}`,
      flight: updatedFlight,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to update status" });
  }
};

const deleteFlightById = async (req, res) => {
  try {
    const flightId = req.params.flightId;

    const existingFlight = await prisma.flight.findUnique({
      where: { id: flightId },
    });
    if (!existingFlight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    await prisma.flight.delete({
      where: { id: flightId },
    });

    res.status(200).json({ message: "Flight deleted successfully" });
  } catch (error) {
    console.error("Delete Flight Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
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
