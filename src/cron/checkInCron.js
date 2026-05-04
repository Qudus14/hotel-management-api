const cron = require("node-cron");
const { prisma } = require("../config/db");
const { generateBoardingQR } = require("../utils/qrGenerator");

// This runs every hour on the hour
cron.schedule("0 * * * *", async () => {
  console.log("Running Auto-Check-in Task...");

  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);

  // 1. Find bookings for flights departing in exactly 24 hours
  const upcomingBookings = await prisma.flightBooking.findMany({
    where: {
      status: "BOOKED",
      segments: {
        some: {
          flight: {
            departureTime: {
              lte: tomorrow,
              gt: new Date(),
            },
          },
        },
      },
    },
  });

  // 2. Automatically check them in
  for (const booking of upcomingBookings) {
    const qrData = await generateBoardingQR(booking.id);

    await prisma.flightBooking.update({
      where: { id: booking.id },
      data: {
        status: "PAID", // In your enum, maybe use 'BOARDED' or 'CHECKED_IN'
        qrCode: qrData,
      },
    });
    console.log(`Auto-checked in booking: ${booking.id}`);
  }
});
