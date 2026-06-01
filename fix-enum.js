// scripts/createQatarAirwaysVendor.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createQatarAirwaysVendor() {
  try {
    const vendor = await prisma.vendor.create({
      data: {
        userId: "e36c5e4c-087d-4053-a92b-3b0e1ca0bd5f",
        vendorType: "ATTRACTION",
        businessName: "Lagos State Parks Agency",
        businessEmail: "info@lagosparks.gov.ng",
        businessPhone: "+2348023456789",
        businessAddress: "Parks and Recreation Department, Alausa, Ikeja",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        website: "https://lagosparks.gov.ng",
        yearEstablished: 2005,
        description:
          "Government agency responsible for managing and maintaining all parks, gardens, and recreation centers in Lagos State. We operate Lekki Conservation Centre, Ndubuisi Kanu Park, Johnson Jakande Tinubu Park, and other recreational facilities.",
        registrationNumber: "LASG/PARK/001",
        taxIdEnc: "TAX789012345",
        licenseNumber: "LASG/TOUR/2023/001",
        status: "APPROVED",
        submittedAt: new Date(),
        avgRating: 4.5,
        totalReviews: 1500,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    console.log("✅ Qatar Airways vendor profile created!");
    console.log("Vendor ID:", vendor.id);
    console.log("Airline:", vendor.businessName);
    console.log("Status:", vendor.status);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createQatarAirwaysVendor();
