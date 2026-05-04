const { prisma } = require("../../config/db");

const checkInFlight = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.flightBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Generate QR Code
    const qrData = await generateBoardingQR(bookingId);

    const updatedBooking = await prisma.flightBooking.update({
      where: { id: bookingId },
      data: {
        status: "PAID", // Or create a new status 'CHECKED_IN'
        qrCode: qrData,
      },
    });

    res.status(200).json({ message: "Check-in successful", qrCode: qrData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  checkInFlight,
};
