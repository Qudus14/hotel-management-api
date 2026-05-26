const { prisma } = require("../../config/db");

// ==================== CREATE HOTEL (vendor/admin) ====================
const createHotel = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      starRating,
      checkInTime,
      checkOutTime,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      googlePlaceId,
      amenities,
      coverImageUrl,
    } = req.body;

    // Check slug uniqueness
    const existing = await prisma.hotel.findUnique({ where: { slug } });
    if (existing) {
      return res
        .status(400)
        .json({ status: "fail", error: "Slug already in use" });
    }

    // For now admin creates hotels directly
    // When vendor system is built, vendorId comes from req.user's vendor profile
    const vendorId = req.body.vendorId; // temp: passed in body by admin

    const hotel = await prisma.hotel.create({
      data: {
        vendorId,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description,
        starRating: Number(starRating),
        checkInTime: checkInTime || "14:00",
        checkOutTime: checkOutTime || "11:00",
        address,
        city,
        state,
        country,
        latitude: Number(latitude),
        longitude: Number(longitude),
        googlePlaceId: googlePlaceId || null,
        amenities: amenities || [],
        coverImageUrl: coverImageUrl || null,
        isActive: true,
        isApproved: req.user.role === "admin", // auto-approve if admin creates
      },
      include: { vendor: { select: { businessName: true } } },
    });

    return res.status(201).json({
      status: "success",
      message: "Hotel created successfully",
      data: hotel,
    });
  } catch (error) {
    console.error("Create Hotel Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL HOTELS (public search) ====================
const getAllHotels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const {
      city,
      country,
      minRating,
      maxPrice,
      minPrice,
      amenities,
      checkIn,
      checkOut,
      guests,
    } = req.query;

    const where = { isActive: true, isApproved: true };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (minRating) where.avgRating = { gte: parseFloat(minRating) };

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { avgRating: "desc" },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          roomCategories: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              basePricePerNight: true,
              maxOccupancy: true,
              bedType: true,
              images: true,
            },
            orderBy: { basePricePerNight: "asc" },
            take: 1, // cheapest room category for preview
          },
          _count: {
            select: { rooms: true },
          },
        },
      }),
      prisma.hotel.count({ where }),
    ]);

    // Attach starting price from cheapest room category
    const hotelsWithPrice = hotels.map((hotel) => ({
      ...hotel,
      startingFrom: hotel.roomCategories[0]?.basePricePerNight || null,
      primaryImage: hotel.images[0]?.url || hotel.coverImageUrl || null,
    }));

    return res.status(200).json({
      status: "success",
      results: hotels.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: hotelsWithPrice,
    });
  } catch (error) {
    console.error("Get All Hotels Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET HOTEL BY ID or SLUG ====================
const getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Support lookup by either UUID or slug
    const hotel = await prisma.hotel.findFirst({
      where: {
        OR: [{ id: hotelId }, { slug: hotelId }],
        isActive: true,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        policy: true,
        operatingHours: { orderBy: { dayOfWeek: "asc" } },
        roomCategories: {
          where: { isActive: true },
          include: {
            rooms: {
              where: { status: "available", deletedAt: null },
              select: { id: true, roomNumber: true, floor: true, status: true },
            },
          },
          orderBy: { basePricePerNight: "asc" },
        },
        vendor: {
          select: { businessName: true, avgRating: true },
        },
      },
    });

    if (!hotel) {
      return res.status(404).json({ status: "fail", error: "Hotel not found" });
    }

    return res.status(200).json({ status: "success", data: hotel });
  } catch (error) {
    console.error("Get Hotel By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE HOTEL (admin/vendor) ====================
const updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const updateData = {};

    const allowedFields = [
      "name",
      "description",
      "starRating",
      "checkInTime",
      "checkOutTime",
      "address",
      "city",
      "state",
      "country",
      "latitude",
      "longitude",
      "amenities",
      "coverImageUrl",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    // Admin can also toggle approval
    if (req.user.role === "admin" && req.body.isApproved !== undefined) {
      updateData.isApproved = req.body.isApproved;
    }

    const hotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ status: "fail", error: "Hotel not found" });
    }
    console.error("Update Hotel Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE HOTEL (admin only) ====================
const deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    await prisma.hotel.update({
      where: { id: hotelId },
      data: { isActive: false }, // soft delete
    });

    return res.status(200).json({
      status: "success",
      message: "Hotel deactivated successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ status: "fail", error: "Hotel not found" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== CHECK AVAILABILITY ====================
const checkAvailability = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        status: "fail",
        error: "checkIn and checkOut dates are required",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        status: "fail",
        error: "checkOut must be after checkIn",
      });
    }

    const numberOfNights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 3600 * 24),
    );

    // Find rooms already booked for these dates
    const bookedRoomIds = await prisma.booking.findMany({
      where: {
        hotelId,
        status: { notIn: ["cancelled", "no_show"] },
        OR: [
          {
            checkInDate: { lt: checkOutDate },
            checkOutDate: { gt: checkInDate },
          },
        ],
      },
      select: { roomId: true },
    });

    const bookedIds = bookedRoomIds.map((b) => b.roomId);

    // Get available room categories with at least one available room
    const availableCategories = await prisma.roomCategory.findMany({
      where: {
        hotelId,
        isActive: true,
        ...(guests ? { maxOccupancy: { gte: parseInt(guests) } } : {}),
        rooms: {
          some: {
            status: "available",
            deletedAt: null,
            id: { notIn: bookedIds },
          },
        },
      },
      include: {
        rooms: {
          where: {
            status: "available",
            deletedAt: null,
            id: { notIn: bookedIds },
          },
          select: { id: true, roomNumber: true, floor: true },
        },
      },
      orderBy: { basePricePerNight: "asc" },
    });

    // Calculate total price per category
    const categoriesWithPricing = availableCategories.map((cat) => ({
      ...cat,
      availableRooms: cat.rooms.length,
      pricePerNight: parseFloat(cat.basePricePerNight),
      totalPrice: parseFloat(cat.basePricePerNight) * numberOfNights,
      numberOfNights,
    }));

    return res.status(200).json({
      status: "success",
      data: {
        hotelId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfNights,
        guests: guests || 1,
        availableCategories: categoriesWithPricing,
      },
    });
  } catch (error) {
    console.error("Check Availability Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== ROOM CATEGORY CRUD ====================
const createRoomCategory = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const {
      name,
      description,
      bedType,
      maxOccupancy,
      sizeSqm,
      basePricePerNight,
      discountPrice,
      amenities,
      images,
      totalCount,
    } = req.body;

    const category = await prisma.roomCategory.create({
      data: {
        hotelId,
        name,
        description: description || null,
        bedType,
        maxOccupancy: Number(maxOccupancy),
        sizeSqm: sizeSqm ? Number(sizeSqm) : null,
        basePricePerNight: Number(basePricePerNight),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        amenities: amenities || [],
        images: images || [],
        totalCount: Number(totalCount),
        isActive: true,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Room category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create Room Category Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const getRoomCategories = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const categories = await prisma.roomCategory.findMany({
      where: { hotelId, isActive: true },
      include: {
        _count: { select: { rooms: true } },
      },
      orderBy: { basePricePerNight: "asc" },
    });

    return res.status(200).json({ status: "success", data: categories });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

const updateRoomCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updateData = {};

    const fields = [
      "name",
      "description",
      "bedType",
      "maxOccupancy",
      "sizeSqm",
      "basePricePerNight",
      "discountPrice",
      "amenities",
      "images",
      "totalCount",
      "isActive",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    const category = await prisma.roomCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    return res.status(200).json({ status: "success", data: category });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ status: "fail", error: "Category not found" });
    }
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  checkAvailability,
  createRoomCategory,
  getRoomCategories,
  updateRoomCategory,
};
