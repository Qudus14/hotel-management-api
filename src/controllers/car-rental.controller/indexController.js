const { prisma } = require("../../config/db");

const createCarStore = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      state,
      latitude,
      longitude,
      phoneNumber,
      email,
      website,
      images,
    } = req.body; // Removed 'country' from destructuring

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });

    if (!vendor) {
      return res.status(404).json({
        status: "fail",
        error: "Vendor profile not found. Register as a vendor first.",
      });
    }

    if (vendor.vendorType !== "CAR_RENTAL") {
      return res.status(403).json({
        status: "fail",
        error: "Only CAR_RENTAL vendors can create a car store",
      });
    }

    const existingCarStore = await prisma.carStore.findFirst({
      where: { vendorId: vendor.id },
    });

    if (existingCarStore) {
      return res.status(409).json({
        status: "fail",
        error:
          "You already have a car store. Update it or add pickup locations for branches.",
      });
    }

    const carStore = await prisma.carStore.create({
      data: {
        vendorId: vendor.id,
        name,
        description: description || null,
        address: address || null,
        city: city || null,
        state: state || null,
        // country removed from here
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        phoneNumber: phoneNumber || null,
        email: email || null,
        website: website || null,
        images: images || [],
        isActive: true,
        isApproved: false,
      },
      include: {
        vendor: { select: { businessName: true, status: true } },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Car store created successfully. Awaiting admin approval.",
      data: carStore,
    });
  } catch (error) {
    console.error("Create Car Store Error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        error: "Duplicate entry detected",
      });
    }

    return res.status(error.statusCode || 500).json({
      status: "error",
      error: error.message || "Internal Server Error",
    });
  }
};

const getAllCarStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { city, state } = req.query;

    const where = { isActive: true, isApproved: true };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = { contains: state, mode: "insensitive" };

    const [stores, total] = await Promise.all([
      prisma.carStore.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          carCategories: {
            select: { name: true, pricePerDay: true, imageUrl: true },
            orderBy: { pricePerDay: "asc" },
            take: 3,
          },
          pickupLocations: {
            where: { isActive: true },
            select: { name: true, address: true },
          },
          _count: { select: { cars: true } },
        },
      }),
      prisma.carStore.count({ where }),
    ]);

    return res.status(200).json({
      status: "success",
      results: stores.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: stores,
    });
  } catch (error) {
    console.error("Get All Car Stores Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getCarStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;

    const carStore = await prisma.carStore.findUnique({
      where: { id: storeId },
      include: {
        vendor: {
          select: {
            businessName: true,
            businessEmail: true,
            avgRating: true,
          },
        },
        cars: {
          where: { deletedAt: null, status: "AVAILABLE" },
          include: {
            category: true,
            pickupLocation: true,
          },
          orderBy: { createdAt: "desc" },
        },
        pickupLocations: { where: { isActive: true } },
        carCategories: { orderBy: { pricePerDay: "asc" } },
        operatingHours: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    if (!carStore) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car store not found" });
    }

    return res.status(200).json({ status: "success", data: carStore });
  } catch (error) {
    console.error("Get Car Store By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getMyCarStore = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    // FIXED: Changed from findUnique to findFirst
    const carStore = await prisma.carStore.findFirst({
      where: { vendorId: vendor.id },
      include: {
        cars: {
          where: { deletedAt: null },
          include: { category: true, pickupLocation: true },
          orderBy: { createdAt: "desc" },
        },
        pickupLocations: true,
        carCategories: true,
        operatingHours: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { cars: true } }, // Removed carRentals if not in schema
      },
    });

    if (!carStore) {
      return res.status(404).json({
        status: "fail",
        error: "No car store found. Create one first.",
      });
    }

    return res.status(200).json({ status: "success", data: carStore });
  } catch (error) {
    console.error("Get My Car Store Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const updateCarStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    // Make sure vendor owns this store
    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });

    if (!store) {
      return res.status(404).json({
        status: "fail",
        error: "Car store not found or access denied",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "address",
      "city",
      "state",
      // "country",
      "latitude",
      "longitude",
      "phoneNumber",
      "email",
      "website",
      "images",
      "isActive",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Parse numeric fields
    if (updateData.latitude)
      updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude)
      updateData.longitude = parseFloat(updateData.longitude);

    // Admin can toggle approval
    if (req.user.role === "admin" && req.body.isApproved !== undefined) {
      updateData.isApproved = req.body.isApproved;
    }

    const updated = await prisma.carStore.update({
      where: { id: storeId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Car store updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Car Store Error:", error);
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", error: "Car store not found" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const deleteCarStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    await prisma.carStore.update({
      where: { id: storeId },
      data: { isActive: false },
    });

    return res.status(200).json({
      status: "success",
      message: "Car store deactivated successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", error: "Car store not found" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createCarStore,
  getAllCarStores,
  getCarStoreById,
  getMyCarStore,
  updateCarStore,
  deleteCarStore,
};
