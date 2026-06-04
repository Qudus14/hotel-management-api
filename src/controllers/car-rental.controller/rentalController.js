const { prisma } = require("../../config/db");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const generateReferenceCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CAR-${timestamp}-${random}`;
};

const calculateRentalPrice = (pricePerDay, pickupDate, returnDate) => {
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  const diffMs = returnD - pickup;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { days, totalPrice: days * pricePerDay };
};

// ─────────────────────────────────────────────
// CREATE RENTAL (User books a car)
// ─────────────────────────────────────────────
const createRental = async (req, res) => {
  try {
    const { carId, pickupDate, returnDate, notes, unifiedBookingId } = req.body;
    const userId = req.user.sub;

    if (!carId || !pickupDate || !returnDate) {
      return res.status(400).json({
        status: "fail",
        error: "carId, pickupDate, and returnDate are required",
      });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    if (pickup >= returnD) {
      return res.status(400).json({
        status: "fail",
        error: "returnDate must be after pickupDate",
      });
    }

    if (pickup < new Date()) {
      return res.status(400).json({
        status: "fail",
        error: "pickupDate cannot be in the past",
      });
    }

    // Check car exists and is available
    const car = await prisma.car.findFirst({
      where: { id: carId, deletedAt: null, status: "AVAILABLE" },
      include: {
        category: { select: { pricePerDay: true } },
        carStore: { select: { isApproved: true, isActive: true } },
      },
    });

    if (!car) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car not found or not available" });
    }

    if (!car.carStore.isApproved || !car.carStore.isActive) {
      return res.status(403).json({
        status: "fail",
        error: "This car store is not currently active",
      });
    }

    // Check for conflicting rentals
    const conflict = await prisma.carRental.findFirst({
      where: {
        carId,
        status: { in: ["pending", "confirmed", "checked_in"] },
        OR: [{ pickupDate: { lte: returnD }, returnDate: { gte: pickup } }],
      },
    });

    if (conflict) {
      return res.status(409).json({
        status: "fail",
        error: "Car is already booked for the selected dates",
      });
    }

    // Fetch full car details needed for unified booking metadata
    const carFull = await prisma.car.findUnique({
      where: { id: carId },
      include: {
        category: { select: { name: true, pricePerDay: true } },
        pickupLocation: { select: { name: true, address: true } },
        carStore: { select: { id: true, name: true } },
      },
    });

    const pricePerDay = parseFloat(carFull.category?.pricePerDay || 0);
    const { days, totalPrice: rawTotal } = calculateRentalPrice(
      pricePerDay,
      pickup,
      returnD,
    );

    const subtotal = parseFloat(rawTotal.toFixed(2));
    const tax = parseFloat((subtotal * 0.075).toFixed(2)); // 7.5% VAT
    const serviceFee = parseFloat((subtotal * 0.02).toFixed(2)); // 2% service fee
    const totalPrice = parseFloat((subtotal + tax + serviceFee).toFixed(2));

    const cancellationDeadline = new Date(pickup);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - 48);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the car rental record
      const carRental = await tx.carRental.create({
        data: {
          carId,
          userId,
          pickupDate: pickup,
          returnDate: returnD,
          totalPrice,
          depositPaid: carFull.depositRequired || 0,
          paymentStatus: "PENDING",
          status: "pending",
          notes: notes || null,
        },
        include: {
          car: {
            select: {
              make: true,
              model: true,
              year: true,
              plateNumber: true,
              images: true,
              category: { select: { name: true, pricePerDay: true } },
              pickupLocation: { select: { name: true, address: true } },
              carStore: { select: { name: true, phoneNumber: true } },
            },
          },
        },
      });

      // 2. Create unified booking linked to the car rental
      const unifiedBooking = await tx.unifiedBooking.create({
        data: {
          userId,
          serviceType: "CAR",
          carRentals: { connect: { id: carRental.id } },
          serviceStartDate: pickup,
          serviceEndDate: returnD,
          subtotal,
          tax,
          serviceFee,
          totalPrice,
          bookingStatus: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          referenceCode: generateReferenceCode(),
          cancellationDeadline,
          specialRequests: notes || null,
          metadata: {
            carId,
            carMake: carFull.make,
            carModel: carFull.model,
            carYear: carFull.year,
            plateNumber: carFull.plateNumber,
            categoryName: carFull.category?.name,
            storeId: carFull.carStore?.id,
            storeName: carFull.carStore?.name,
            pickupLocationName: carFull.pickupLocation?.name,
            rentalDays: days,
          },
        },
      });

      // 3. Link the rental back to the unified booking
      await tx.carRental.update({
        where: { id: carRental.id },
        data: { unifiedBookingId: unifiedBooking.id },
      });

      return {
        carRental: { ...carRental, unifiedBookingId: unifiedBooking.id },
        unifiedBooking,
      };
    });

    return res.status(201).json({
      status: "success",
      message: `Rental booked successfully for ${days} day(s)`,
      data: {
        rental: result.carRental,
        unified: {
          id: result.unifiedBooking.id,
          referenceCode: result.unifiedBooking.referenceCode,
          bookingStatus: result.unifiedBooking.bookingStatus,
          cancellationDeadline: result.unifiedBooking.cancellationDeadline,
          pricing: {
            subtotal,
            tax,
            serviceFee,
            totalPrice,
            currency: "NGN",
            breakdown: {
              pricePerDay,
              rentalDays: days,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Create Rental Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET ALL RENTALS (Admin)
// ─────────────────────────────────────────────
const getAllRentals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, paymentStatus, userId, carId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (userId) where.userId = userId;
    if (carId) where.carId = carId;

    const [rentals, total] = await Promise.all([
      prisma.carRental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          car: {
            select: {
              make: true,
              model: true,
              year: true,
              plateNumber: true,
              carStore: { select: { name: true } },
            },
          },
        },
      }),
      prisma.carRental.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: rentals.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: rentals,
    });
  } catch (error) {
    console.error("Get All Rentals Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET MY RENTALS (Logged-in user)
// ─────────────────────────────────────────────
const getMyRentals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status } = req.query;
    const userId = req.user.sub;

    const where = { userId };
    if (status) where.status = status;

    const [rentals, total] = await Promise.all([
      prisma.carRental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          car: {
            select: {
              make: true,
              model: true,
              year: true,
              color: true,
              images: true,
              category: { select: { name: true, pricePerDay: true } },
              pickupLocation: { select: { name: true, address: true } },
              carStore: { select: { name: true, phoneNumber: true } },
            },
          },
        },
      }),
      prisma.carRental.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: rentals.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: rentals,
    });
  } catch (error) {
    console.error("Get My Rentals Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET VENDOR'S STORE RENTALS
// ─────────────────────────────────────────────
const getStoreRentals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const carStore = await prisma.carStore.findFirst({
      where: { vendorId: vendor.id },
    });
    if (!carStore) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car store not found" });
    }

    const where = {
      car: { carStoreId: carStore.id },
      ...(status ? { status } : {}),
    };

    const [rentals, total] = await Promise.all([
      prisma.carRental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          car: {
            select: {
              make: true,
              model: true,
              year: true,
              plateNumber: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.carRental.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: rentals.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: rentals,
    });
  } catch (error) {
    console.error("Get Store Rentals Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET RENTAL BY ID
// ─────────────────────────────────────────────
const getRentalById = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const rental = await prisma.carRental.findUnique({
      where: { id: rentalId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        car: {
          include: {
            category: true,
            pickupLocation: true,
            carStore: {
              select: { name: true, phoneNumber: true, email: true },
            },
          },
        },
      },
    });

    if (!rental) {
      return res
        .status(404)
        .json({ status: "fail", error: "Rental not found" });
    }

    // Only admin or the renter can view
    if (userRole !== "admin" && rental.userId !== userId) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    return res.status(200).json({ status: "success", data: rental });
  } catch (error) {
    console.error("Get Rental By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// UPDATE RENTAL
// ─────────────────────────────────────────────
const updateRental = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const rental = await prisma.carRental.findUnique({
      where: { id: rentalId },
    });
    if (!rental) {
      return res
        .status(404)
        .json({ status: "fail", error: "Rental not found" });
    }

    const isAdmin = userRole === "admin";
    const isOwner = rental.userId === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    // Users can only update PENDING rentals
    if (!isAdmin && rental.status !== "PENDING") {
      return res.status(400).json({
        status: "fail",
        error: "You can only modify pending rentals",
      });
    }

    const {
      pickupDate,
      returnDate,
      notes,
      status,
      paymentStatus,
      totalPrice,
      depositPaid,
    } = req.body;

    const updateData = {};

    // Date updates — recalculate price if both dates change
    if (pickupDate || returnDate) {
      const newPickup = pickupDate ? new Date(pickupDate) : rental.pickupDate;
      const newReturn = returnDate ? new Date(returnDate) : rental.returnDate;

      if (newPickup >= newReturn) {
        return res.status(400).json({
          status: "fail",
          error: "returnDate must be after pickupDate",
        });
      }

      updateData.pickupDate = newPickup;
      updateData.returnDate = newReturn;

      // Recalculate price if car has a category price
      const car = await prisma.car.findUnique({
        where: { id: rental.carId },
        include: { category: { select: { pricePerDay: true } } },
      });

      if (car?.category?.pricePerDay) {
        const { totalPrice: newTotal } = calculateRentalPrice(
          car.category.pricePerDay,
          newPickup,
          newReturn,
        );
        updateData.totalPrice = newTotal;
      }
    }

    if (notes !== undefined) updateData.notes = notes;

    // Admin-only fields
    if (isAdmin) {
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (totalPrice !== undefined)
        updateData.totalPrice = parseFloat(totalPrice);
      if (depositPaid !== undefined)
        updateData.depositPaid = parseFloat(depositPaid);

      // If admin marks as returned, set actualReturn
      if (status === "RETURNED" && !rental.actualReturn) {
        updateData.actualReturn = new Date();
      }
    }

    const updated = await prisma.carRental.update({
      where: { id: rentalId },
      data: updateData,
      include: {
        car: {
          select: { make: true, model: true, year: true, plateNumber: true },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Rental updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Rental Error:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", error: "Rental not found" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// CANCEL RENTAL
// ─────────────────────────────────────────────
const cancelRental = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;

    const rental = await prisma.carRental.findUnique({
      where: { id: rentalId },
    });
    if (!rental) {
      return res
        .status(404)
        .json({ status: "fail", error: "Rental not found" });
    }

    const isAdmin = userRole === "admin";
    const isOwner = rental.userId === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ status: "fail", error: "Access denied" });
    }

    if (["cancelled", "checked_out", "no_show"].includes(rental.status)) {
      return res.status(400).json({
        status: "fail",
        error: `Rental cannot be cancelled — current status: ${rental.status}`,
      });
    }

    // Check unified booking cancellation deadline
    let unifiedBooking = null;
    if (rental.unifiedBookingId) {
      unifiedBooking = await prisma.unifiedBooking.findUnique({
        where: { id: rental.unifiedBookingId },
      });

      if (unifiedBooking && !isAdmin) {
        if (
          unifiedBooking.cancellationDeadline &&
          new Date() > unifiedBooking.cancellationDeadline
        ) {
          return res.status(400).json({
            status: "fail",
            error: "Cancellation window has expired",
            deadline: unifiedBooking.cancellationDeadline,
          });
        }
      }
    }

    // Calculate refund — 100% if > 48h before pickup, 50% if > 24h, 0% otherwise
    let refundAmount = 0;
    if (unifiedBooking && unifiedBooking.paymentStatus === "SUCCESSFUL") {
      const hoursUntilPickup =
        (new Date(rental.pickupDate) - new Date()) / (1000 * 3600);
      const refundPct =
        hoursUntilPickup > 48 ? 100 : hoursUntilPickup > 24 ? 50 : 0;
      refundAmount = parseFloat(
        ((parseFloat(rental.totalPrice) * refundPct) / 100).toFixed(2),
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Cancel the rental
      const cancelledRental = await tx.carRental.update({
        where: { id: rentalId },
        data: { status: "cancelled" },
      });

      // Mirror to unified booking
      if (unifiedBooking) {
        await tx.unifiedBooking.update({
          where: { id: unifiedBooking.id },
          data: {
            bookingStatus: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy: userId,
            cancellationReason: req.body?.reason || null,
            refundAmount: refundAmount > 0 ? refundAmount : null,
            refundProcessedAt: refundAmount > 0 ? new Date() : null,
          },
        });
      }

      // Credit wallet if eligible for refund
      if (refundAmount > 0) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const balanceBefore = parseFloat(user.walletBalance);
        const balanceAfter = parseFloat(
          (balanceBefore + refundAmount).toFixed(2),
        );

        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: refundAmount } },
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            amount: refundAmount,
            type: "CREDIT",
            balanceBefore,
            balanceAfter,
            description: `Refund for cancelled car rental ${unifiedBooking.referenceCode}`,
            reference: `REF-${unifiedBooking.referenceCode}-${Date.now()}`,
            unifiedBookingId: unifiedBooking.id,
            status: "COMPLETED",
          },
        });
      }

      return cancelledRental;
    });

    return res.status(200).json({
      status: "success",
      message: "Rental cancelled successfully",
      data: {
        rental: result,
        refund: {
          eligible: refundAmount > 0,
          amount: refundAmount,
          currency: "NGN",
          processedToWallet: refundAmount > 0,
        },
      },
    });
  } catch (error) {
    console.error("Cancel Rental Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createRental,
  getAllRentals,
  getMyRentals,
  getStoreRentals,
  getRentalById,
  updateRental,
  cancelRental,
};
