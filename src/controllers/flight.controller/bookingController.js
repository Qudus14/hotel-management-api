const { prisma } = require("../../config/db");
const { generateBoardingQR } = require("../../utils/qrGenerator");

const createFlightBooking = async (req, res) => {
  try {
    const { userId, segments, addOnIds } = req.body;
    // Expecting segments: [{ flightId, seatId }, { flightId, seatId }]
    // Expecting addOnIds: ["uuid1", "uuid2"]

    const result = await prisma.$transaction(async (tx) => {
      let calculatedTotalPrice = 0;

      // 1. Validate Seats and calculate price for all legs/segments
      for (const segment of segments) {
        const seat = await tx.seat.findUnique({
          where: { id: segment.seatId },
        });
        if (!seat || !seat.isAvailable) {
          throw new Error(
            `Seat ${segment.seatId} is unavailable or not found.`,
          );
        }
        calculatedTotalPrice += parseFloat(seat.price);
      }

      // 2. Add prices of selected Add-Ons
      if (addOnIds && addOnIds.length > 0) {
        const selectedAddOns = await tx.addOn.findMany({
          where: { id: { in: addOnIds } },
        });
        selectedAddOns.forEach((addon) => {
          calculatedTotalPrice += parseFloat(addon.price);
        });
      }

      // 3. Create the parent FlightBooking
      const booking = await tx.flightBooking.create({
        data: {
          userId,
          totalPrice: calculatedTotalPrice,
          status: "BOOKED",
        },
      });

      // 4. Create BookingSegments for each leg
      await tx.bookingSegment.createMany({
        data: segments.map((seg) => ({
          flightBookingId: booking.id,
          flightId: seg.flightId,
          seatId: seg.seatId,
        })),
      });

      // 5. Create BookingAddOn entries
      if (addOnIds && addOnIds.length > 0) {
        await tx.bookingAddOn.createMany({
          data: addOnIds.map((id) => ({
            flightBookingId: booking.id,
            addOnId: id,
          })),
        });
      }

      // 6. Mark all involved seats as booked
      await tx.seat.updateMany({
        where: { id: { in: segments.map((s) => s.seatId) } },
        data: { isAvailable: false },
      });

      return await tx.flightBooking.findUnique({
        where: { id: booking.id },
        include: {
          segments: {
            include: {
              flight: true, // Includes departure/arrival info
              seat: true, // Includes seat number and class
            },
          },
          addOns: {
            include: {
              addOn: true, // Includes name and price of the baggage/meal
            },
          },
        },
      });
    });

    res
      .status(201)
      .json({ message: "Trip booked successfully", booking: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllFlightBookings = async (req, res) => {
  try {
    const bookings = await prisma.FlightBooking.findMany();
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get Bookings Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getFlightBookingById = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await prisma.FlightBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({ booking });
  } catch (error) {
    console.error("Get Booking By ID Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateFlightBookingByStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const updateData = { status: status.toUpperCase() };

    if (status.toUpperCase() === "PAID") {
      const qrData = await generateBoardingQR(bookingId);
      updateData.qrCode = qrData;
    }

    const updatedBooking = await prisma.flightBooking.update({
      where: { id: bookingId },
      data: updateData,
      // ADD THIS INCLUDE BLOCK:
      include: {
        segments: {
          include: {
            flight: true, // This brings back the Flight details
            seat: true, // This brings back the Seat details
          },
        },
        addOns: true, // This brings back the baggage/meals
      },
    });

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelFlightBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params; // Keep as string (UUID)

    // 1. Fetch booking with its segments to get ALL seat IDs
    const existingBooking = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
      include: { segments: true },
    });

    if (!existingBooking)
      return res.status(404).json({ error: "Booking not found" });
    if (existingBooking.status === "CANCELLED")
      return res.status(400).json({ error: "Already cancelled" });

    const seatIds = existingBooking.segments.map((seg) => seg.seatId);

    // 2. Transaction: Update Booking + Release ALL Seats
    const [cancelledBooking] = await prisma.$transaction([
      prisma.flightBooking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      }),
      prisma.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { isAvailable: true },
      }),
    ]);

    res.status(200).json({
      message: "Trip cancelled. All seats released.",
      booking: cancelledBooking,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFlightBookingById = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const existingBooking = await prisma.FlightBooking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    await prisma.FlightBooking.delete({
      where: { id: bookingId },
    });

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createFlightBooking,
  getAllFlightBookings,
  getFlightBookingById,
  cancelFlightBookingById,
  updateFlightBookingByStatus,
  deleteFlightBookingById,
};
