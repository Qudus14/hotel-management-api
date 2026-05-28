const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixEnum() {
  try {
    // First, check what values exist in the database
    const allRecords = await prisma.touristAttractionBooking.findMany();
    console.log("All records in database:");
    allRecords.forEach((record) => {
      console.log(`ID: ${record.id}, Status: ${record.status}`);
    });

    // Update CONFIRMED to BOOKED
    const updated = await prisma.touristAttractionBooking.updateMany({
      where: {
        status: "CONFIRMED",
      },
      data: {
        status: "BOOKED",
      },
    });

    console.log(
      `\n✅ Updated ${updated.count} records from 'CONFIRMED' to 'BOOKED'`,
    );

    // Verify no more CONFIRMED records
    const remaining = await prisma.touristAttractionBooking.findMany({
      where: {
        status: "CONFIRMED",
      },
    });

    if (remaining.length === 0) {
      console.log("✅ No more CONFIRMED records found!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnum();
