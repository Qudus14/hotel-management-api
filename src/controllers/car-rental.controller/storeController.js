const { prisma } = require("../../config/db");

// ═══════════════════════════════════════════════
// PICKUP LOCATIONS
// ═══════════════════════════════════════════════

const addPickupLocation = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, address, latitude, longitude } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ status: "fail", error: "name is required" });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });
    if (!store) {
      return res
        .status(404)
        .json({
          status: "fail",
          error: "Car store not found or access denied",
        });
    }

    const location = await prisma.pickupLocation.create({
      data: {
        carStoreId: storeId,
        name,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        isActive: true,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Pickup location added successfully",
      data: location,
    });
  } catch (error) {
    console.error("Add Pickup Location Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getPickupLocations = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await prisma.carStore.findUnique({ where: { id: storeId } });
    if (!store) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car store not found" });
    }

    const locations = await prisma.pickupLocation.findMany({
      where: { carStoreId: storeId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return res
      .status(200)
      .json({ status: "success", results: locations.length, data: locations });
  } catch (error) {
    console.error("Get Pickup Locations Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const updatePickupLocation = async (req, res) => {
  try {
    const { storeId, locationId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });
    if (!store) {
      return res
        .status(404)
        .json({
          status: "fail",
          error: "Car store not found or access denied",
        });
    }

    const location = await prisma.pickupLocation.findFirst({
      where: { id: locationId, carStoreId: storeId },
    });
    if (!location) {
      return res
        .status(404)
        .json({ status: "fail", error: "Pickup location not found" });
    }

    const { name, address, latitude, longitude, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.pickupLocation.update({
      where: { id: locationId },
      data: updateData,
    });

    return res
      .status(200)
      .json({
        status: "success",
        message: "Pickup location updated",
        data: updated,
      });
  } catch (error) {
    console.error("Update Pickup Location Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const deletePickupLocation = async (req, res) => {
  try {
    const { storeId, locationId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });
    if (!store) {
      return res
        .status(404)
        .json({
          status: "fail",
          error: "Car store not found or access denied",
        });
    }

    const location = await prisma.pickupLocation.findFirst({
      where: { id: locationId, carStoreId: storeId },
    });
    if (!location) {
      return res
        .status(404)
        .json({ status: "fail", error: "Pickup location not found" });
    }

    // Check if any active cars are assigned to this location
    const carsAssigned = await prisma.car.count({
      where: { pickupLocationId: locationId, deletedAt: null },
    });
    if (carsAssigned > 0) {
      return res.status(409).json({
        status: "fail",
        error: `Cannot delete — ${carsAssigned} car(s) are assigned to this location. Reassign them first.`,
      });
    }

    await prisma.pickupLocation.update({
      where: { id: locationId },
      data: { isActive: false },
    });

    return res
      .status(200)
      .json({
        status: "success",
        message: "Pickup location deactivated successfully",
      });
  } catch (error) {
    console.error("Delete Pickup Location Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ═══════════════════════════════════════════════
// CAR CATEGORIES
// ═══════════════════════════════════════════════

const addCarCategory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, description, pricePerDay, imageUrl } = req.body;

    if (!name || !pricePerDay) {
      return res
        .status(400)
        .json({ status: "fail", error: "name and pricePerDay are required" });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });
    if (!store) {
      return res
        .status(404)
        .json({
          status: "fail",
          error: "Car store not found or access denied",
        });
    }

    // Prevent duplicate category names within the same store
    const existing = await prisma.carCategory.findFirst({
      where: {
        carStoreId: storeId,
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (existing) {
      return res
        .status(409)
        .json({
          status: "fail",
          error: `Category "${name}" already exists in this store`,
        });
    }

    const category = await prisma.carCategory.create({
      data: {
        carStoreId: storeId,
        name,
        description: description || null,
        pricePerDay: parseFloat(pricePerDay),
        imageUrl: imageUrl || null,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Car category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Add Car Category Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getCarCategories = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await prisma.carStore.findUnique({ where: { id: storeId } });
    if (!store) {
      return res
        .status(404)
        .json({ status: "fail", error: "Car store not found" });
    }

    const categories = await prisma.carCategory.findMany({
      where: { carStoreId: storeId },
      orderBy: { pricePerDay: "asc" },
      include: { _count: { select: { cars: true } } },
    });

    return res
      .status(200)
      .json({
        status: "success",
        results: categories.length,
        data: categories,
      });
  } catch (error) {
    console.error("Get Car Categories Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const updateCarCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });
    if (!store) {
      return res
        .status(404)
        .json({
          status: "fail",
          error: "Car store not found or access denied",
        });
    }

    const category = await prisma.carCategory.findFirst({
      where: { id: categoryId, carStoreId: storeId },
    });
    if (!category) {
      return res
        .status(404)
        .json({ status: "fail", error: "Category not found" });
    }

    const { name, description, pricePerDay, imageUrl } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (pricePerDay !== undefined)
      updateData.pricePerDay = parseFloat(pricePerDay);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const updated = await prisma.carCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    return res
      .status(200)
      .json({
        status: "success",
        message: "Category updated successfully",
        data: updated,
      });
  } catch (error) {
    console.error("Update Car Category Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const deleteCarCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.sub },
    });
    if (!vendor) {
      return res
        .status(404)
        .json({ status: "fail", error: "Vendor profile not found" });
    }

    const store = await prisma.carStore.findFirst({
      where: { id: storeId, vendorId: vendor.id },
    });
    if (!store) {
      return res
        .status(404)
        .json({
          status: "fail",
          error: "Car store not found or access denied",
        });
    }

    const category = await prisma.carCategory.findFirst({
      where: { id: categoryId, carStoreId: storeId },
    });
    if (!category) {
      return res
        .status(404)
        .json({ status: "fail", error: "Category not found" });
    }

    // Block deletion if cars are using this category
    const carsUsing = await prisma.car.count({
      where: { categoryId, deletedAt: null },
    });
    if (carsUsing > 0) {
      return res.status(409).json({
        status: "fail",
        error: `Cannot delete — ${carsUsing} car(s) are using this category. Reassign them first.`,
      });
    }

    await prisma.carCategory.delete({ where: { id: categoryId } });

    return res
      .status(200)
      .json({ status: "success", message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete Car Category Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  addPickupLocation,
  getPickupLocations,
  updatePickupLocation,
  deletePickupLocation,
  addCarCategory,
  getCarCategories,
  updateCarCategory,
  deleteCarCategory,
};
