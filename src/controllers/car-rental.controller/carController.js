const { prisma } = require("../../config/db");

// ─────────────────────────────────────────────
// CREATE CAR
// ─────────────────────────────────────────────
const createCar = async (req, res) => {
  try {
    const {
      categoryId,
      pickupLocationId,
      make,
      model,
      year,
      color,
      plateNumber,
      transmission,
      seats,
      images,
      features,
      depositRequired,
    } = req.body;

    // Resolve vendor → carStore
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
      return res.status(404).json({
        status: "fail",
        error: "Car store not found. Create a car store first.",
      });
    }

    if (!carStore.isApproved) {
      return res.status(403).json({
        status: "fail",
        error: "Your car store is pending admin approval.",
      });
    }

    // Validate category belongs to this store
    if (categoryId) {
      const category = await prisma.carCategory.findFirst({
        where: { id: categoryId, carStoreId: carStore.id },
      });
      if (!category) {
        return res
          .status(400)
          .json({ status: "fail", error: "Invalid category for this store" });
      }
    }

    // Validate pickup location belongs to this store
    if (pickupLocationId) {
      const location = await prisma.pickupLocation.findFirst({
        where: { id: pickupLocationId, carStoreId: carStore.id },
      });
      if (!location) {
        return res.status(400).json({
          status: "fail",
          error: "Invalid pickup location for this store",
        });
      }
    }

    const car = await prisma.car.create({
      data: {
        carStoreId: carStore.id,
        categoryId: categoryId || null,
        pickupLocationId: pickupLocationId || null,
        make,
        model,
        year: year ? parseInt(year) : null,
        color: color || null,
        plateNumber,
        transmission: transmission || null,
        seats: seats ? parseInt(seats) : null,
        images: images || [],
        features: features || [],
        depositRequired: depositRequired ? parseFloat(depositRequired) : 0,
        status: "AVAILABLE",
      },
      include: {
        category: true,
        pickupLocation: true,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Car created successfully",
      data: car,
    });
  } catch (error) {
    console.error("Create Car Error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        error: "A car with this plate number already exists",
      });
    }

    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET ALL CARS (public)
// ─────────────────────────────────────────────
const getAllCars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      make,
      model,
      transmission,
      seats,
      minPrice,
      maxPrice,
      city,
      state,
      storeId,
    } = req.query;

    const where = {
      deletedAt: null,
      status: "AVAILABLE",
      carStore: { isActive: true, isApproved: true },
    };

    if (make) where.make = { contains: make, mode: "insensitive" };
    if (model) where.model = { contains: model, mode: "insensitive" };
    if (transmission) where.transmission = transmission;
    if (seats) where.seats = parseInt(seats);
    if (storeId) where.carStoreId = storeId;
    if (city || state) {
      where.carStore = {
        ...where.carStore,
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(state ? { state: { contains: state, mode: "insensitive" } } : {}),
      };
    }
    if (minPrice || maxPrice) {
      where.category = {
        pricePerDay: {
          ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
          ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
        },
      };
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { name: true, pricePerDay: true } },
          pickupLocation: { select: { name: true, address: true } },
          carStore: { select: { name: true, city: true, state: true } },
        },
      }),
      prisma.car.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: cars.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: cars,
    });
  } catch (error) {
    console.error("Get All Cars Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE CAR BY ID (public)
// ─────────────────────────────────────────────
const getCarById = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await prisma.car.findFirst({
      where: { id: carId, deletedAt: null },
      include: {
        category: true,
        pickupLocation: true,
        carStore: {
          select: {
            name: true,
            city: true,
            state: true,
            phoneNumber: true,
            email: true,
            operatingHours: true,
          },
        },
      },
    });

    if (!car) {
      return res.status(404).json({ status: "fail", error: "Car not found" });
    }

    return res.status(200).json({ status: "success", data: car });
  } catch (error) {
    console.error("Get Car By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// GET VENDOR'S OWN CARS
// ─────────────────────────────────────────────
const getMyCars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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

    const where = { carStoreId: carStore.id, deletedAt: null };
    if (status) where.status = status;

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          pickupLocation: true,
          _count: { select: { carRentals: true } },
        },
      }),
      prisma.car.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: cars.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: cars,
    });
  } catch (error) {
    console.error("Get My Cars Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// UPDATE CAR
// ─────────────────────────────────────────────
const updateCar = async (req, res) => {
  try {
    const { carId } = req.params;

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

    // Confirm car belongs to vendor's store
    const existingCar = await prisma.car.findFirst({
      where: { id: carId, carStoreId: carStore.id, deletedAt: null },
    });

    if (!existingCar) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car not found or access denied" });
    }

    const allowedFields = [
      "categoryId",
      "pickupLocationId",
      "make",
      "model",
      "year",
      "color",
      "plateNumber",
      "transmission",
      "seats",
      "images",
      "features",
      "depositRequired",
      "status",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.seats) updateData.seats = parseInt(updateData.seats);
    if (updateData.depositRequired)
      updateData.depositRequired = parseFloat(updateData.depositRequired);

    const updated = await prisma.car.update({
      where: { id: carId },
      data: updateData,
      include: { category: true, pickupLocation: true },
    });

    return res.status(200).json({
      status: "success",
      message: "Car updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Car Error:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ status: "fail", error: "Car not found" });
    }
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ status: "error", error: "Plate number already in use" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────
// SOFT DELETE CAR
// ─────────────────────────────────────────────
const deleteCar = async (req, res) => {
  try {
    const { carId } = req.params;

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

    const car = await prisma.car.findFirst({
      where: { id: carId, carStoreId: carStore.id, deletedAt: null },
    });

    if (!car) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car not found or access denied" });
    }

    // Check for active rentals
    const activeRental = await prisma.carRental.findFirst({
      where: { carId, status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } },
    });

    if (activeRental) {
      return res.status(409).json({
        status: "fail",
        error: "Cannot delete car with active or pending rentals",
      });
    }

    await prisma.car.update({
      where: { id: carId },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.sub,
        status: "UNAVAILABLE",
      },
    });

    return res
      .status(200)
      .json({ status: "success", message: "Car deleted successfully" });
  } catch (error) {
    console.error("Delete Car Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createCar,
  getAllCars,
  getCarById,
  getMyCars,
  updateCar,
  deleteCar,
};
