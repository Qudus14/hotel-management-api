const { prisma } = require("../../config/db");

const VALID_CATEGORIES = [
  "MUSEUM",
  "PARK",
  "HISTORICAL",
  "BEACH",
  "THEME_PARK",
  "ZOO",
  "LANDMARK",
  "SHOPPING",
  "TOUR",
  "ENTERTAINMENT",
  "WATER_PARK",
  "AQUARIUM",
  "ART_GALLERY",
  "CONCERT_VENUE",
  "SPORTS_VENUE",
  "RELIGIOUS_SITE",
  "NATURE_RESERVE",
];

// ==================== CREATE ATTRACTION ====================
const createAttraction = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      address,
      city,
      country,
      latitude,
      longitude,
      openingHours,
      additionalInformation,
      basePrice,
      dynamicPricing,
      isBookable,
      maxCapacityPerSlot,
      minAdvanceHours,
      maxAdvanceDays,
      cancellationWindowHours,
      refundPercentage,
      contactPhone,
      contactEmail,
      website,
      averageDurationMinutes,
      images,
      amenities, // array of amenity names/ids
      reasonToVisit, // array of reason names/ids
    } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        status: "fail",
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const attraction = await prisma.touristAttraction.create({
      data: {
        name,
        description,
        category,
        address,
        city,
        country,
        latitude: latitude || null,
        longitude: longitude || null,
        openingHours,
        additionalInformation: additionalInformation || null,
        basePrice: parseFloat(basePrice),
        dynamicPricing: dynamicPricing || false,
        isBookable: isBookable !== undefined ? isBookable : true,
        maxCapacityPerSlot: maxCapacityPerSlot || 50,
        minAdvanceHours: minAdvanceHours || 2,
        maxAdvanceDays: maxAdvanceDays || 90,
        cancellationWindowHours: cancellationWindowHours || 24,
        refundPercentage: refundPercentage || 90,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        website: website || null,
        averageDurationMinutes: averageDurationMinutes || 120,
        images: images || [],
        isActive: true,
      },
      include: {
        attractionAmenityMappings: { include: { amenity: true } },
        attractionReasonMappings: { include: { reason: true } },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Attraction created successfully",
      data: attraction,
    });
  } catch (error) {
    console.error("Create Attraction Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL ATTRACTIONS (with search + filters) ====================
const getAllAttractions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { city, country, category, isBookable, search } = req.query;

    const where = { isActive: true, deletedAt: null };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (category && VALID_CATEGORIES.includes(category))
      where.category = category;
    if (isBookable !== undefined) where.isBookable = isBookable === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [attractions, total] = await Promise.all([
      prisma.touristAttraction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          attractionAmenityMappings: { include: { amenity: true } },
          attractionReasonMappings: { include: { reason: true } },
          _count: {
            select: {
              bookings: true,
              reviews: true,
              timeSlots: true,
            },
          },
        },
      }),
      prisma.touristAttraction.count({ where }),
    ]);

    // Compute average rating for each
    const enriched = await Promise.all(
      attractions.map(async (a) => {
        const ratingResult = await prisma.review.aggregate({
          where: { attractionId: a.id, isPublished: true },
          _avg: { rating: true },
          _count: { rating: true },
        });
        return {
          ...a,
          stats: {
            averageRating: ratingResult._avg.rating
              ? parseFloat(ratingResult._avg.rating.toFixed(1))
              : null,
            totalReviews: ratingResult._count.rating,
            totalBookings: a._count.bookings,
          },
          _count: undefined,
        };
      }),
    );

    return res.status(200).json({
      status: "success",
      results: enriched.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: enriched,
    });
  } catch (error) {
    console.error("Get Attractions Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ATTRACTION BY ID (full detail) ====================
const getAttractionById = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const attraction = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
      include: {
        attractionAmenityMappings: { include: { amenity: true } },
        attractionReasonMappings: { include: { reason: true } },
        timeSlots: {
          where: {
            date: { gte: new Date() }, // Only future slots
            isBlocked: false,
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
          take: 30,
        },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { name: true, profileImage: true } },
          },
        },
        travelerPhotos: {
          where: { isApproved: true },
          orderBy: { likes: "desc" },
          take: 20,
          include: {
            user: { select: { name: true } },
          },
        },
        originalRelations: {
          include: {
            relatedAttraction: {
              select: {
                id: true,
                name: true,
                city: true,
                category: true,
                images: true,
                basePrice: true,
              },
            },
          },
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!attraction) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    // Compute stats
    const ratingResult = await prisma.review.aggregate({
      where: { attractionId, isPublished: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const bookingStats = await prisma.touristAttractionBooking.aggregate({
      where: { attractionId, status: { not: "CANCELLED" } },
      _sum: { numberOfPeople: true },
      _count: { id: true },
    });

    const response = {
      ...attraction,
      amenities: attraction.attractionAmenityMappings.map((m) => m.amenity),
      reasonsToVisit: attraction.attractionReasonMappings.map((m) => m.reason),
      relatedAttractions: attraction.originalRelations.map((r) => ({
        id: r.relatedAttraction.id,
        name: r.relatedAttraction.name,
        city: r.relatedAttraction.city,
        category: r.relatedAttraction.category,
        images: r.relatedAttraction.images,
        basePrice: r.relatedAttraction.basePrice,
        distanceKm: r.distanceKm,
        travelTime: r.travelTime,
      })),
      travelersPhotos: attraction.travelerPhotos.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        imageUrl: p.imageUrl,
        caption: p.caption,
        likes: p.likes,
        createdAt: p.createdAt,
      })),
      stats: {
        averageRating: ratingResult._avg.rating
          ? parseFloat(ratingResult._avg.rating.toFixed(1))
          : null,
        totalReviews: ratingResult._count.rating,
        totalBookings: bookingStats._count.id,
        totalVisitors: bookingStats._sum.numberOfPeople || 0,
      },
      // Clean up raw relation fields
      attractionAmenityMappings: undefined,
      attractionReasonMappings: undefined,
      originalRelations: undefined,
      travelerPhotos: undefined,
      _count: undefined,
    };

    return res.status(200).json({ status: "success", data: response });
  } catch (error) {
    console.error("Get Attraction By ID Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPDATE ATTRACTION ====================
const updateAttractionById = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const existing = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    const {
      name,
      description,
      category,
      address,
      city,
      country,
      latitude,
      longitude,
      openingHours,
      additionalInformation,
      basePrice,
      dynamicPricing,
      isBookable,
      maxCapacityPerSlot,
      minAdvanceHours,
      maxAdvanceDays,
      cancellationWindowHours,
      refundPercentage,
      contactPhone,
      contactEmail,
      website,
      averageDurationMinutes,
      images,
    } = req.body;

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ status: "fail", error: "Invalid category" });
    }

    const updateData = {};
    // Only update fields that were sent
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (openingHours !== undefined) updateData.openingHours = openingHours;
    if (additionalInformation !== undefined)
      updateData.additionalInformation = additionalInformation;
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
    if (dynamicPricing !== undefined)
      updateData.dynamicPricing = dynamicPricing;
    if (isBookable !== undefined) updateData.isBookable = isBookable;
    if (maxCapacityPerSlot !== undefined)
      updateData.maxCapacityPerSlot = maxCapacityPerSlot;
    if (minAdvanceHours !== undefined)
      updateData.minAdvanceHours = minAdvanceHours;
    if (maxAdvanceDays !== undefined)
      updateData.maxAdvanceDays = maxAdvanceDays;
    if (cancellationWindowHours !== undefined)
      updateData.cancellationWindowHours = cancellationWindowHours;
    if (refundPercentage !== undefined)
      updateData.refundPercentage = refundPercentage;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (website !== undefined) updateData.website = website;
    if (averageDurationMinutes !== undefined)
      updateData.averageDurationMinutes = averageDurationMinutes;
    if (images !== undefined) updateData.images = images;

    const updated = await prisma.touristAttraction.update({
      where: { id: attractionId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Attraction updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Attraction Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== SOFT DELETE ====================
const deleteAttractionById = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const adminId = req.user.sub;

    const existing = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    // Check for upcoming confirmed bookings
    const upcomingBookings = await prisma.touristAttractionBooking.count({
      where: {
        attractionId,
        status: "CONFIRMED",
        timeSlot: { date: { gte: new Date() } },
      },
    });

    if (upcomingBookings > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete attraction with ${upcomingBookings} upcoming confirmed booking(s)`,
      });
    }

    await prisma.touristAttraction.update({
      where: { id: attractionId },
      data: { isActive: false, deletedAt: new Date(), deletedBy: adminId },
    });

    return res.status(200).json({
      status: "success",
      message: "Attraction deleted successfully",
    });
  } catch (error) {
    console.error("Delete Attraction Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== MANAGE TIME SLOTS ====================
const upsertTimeSlots = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { timeSlots } = req.body;

    const existing = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    // Upsert each slot individually (unique: attractionId + date + startTime)
    const results = await Promise.all(
      timeSlots.map((slot) =>
        prisma.touristAttractionTimeSlot.upsert({
          where: {
            attractionId_date_startTime: {
              attractionId,
              date: new Date(slot.date),
              startTime: slot.startTime,
            },
          },
          update: {
            endTime: slot.endTime,
            maxSpots: slot.maxSpots || existing.maxCapacityPerSlot,
            availableSpots:
              slot.availableSpots ||
              slot.maxSpots ||
              existing.maxCapacityPerSlot,
            priceMultiplier: slot.priceMultiplier || 1.0,
            specialPrice: slot.specialPrice
              ? parseFloat(slot.specialPrice)
              : null,
            isBlocked: slot.isBlocked || false,
            isHoliday: slot.isHoliday || false,
          },
          create: {
            attractionId,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxSpots: slot.maxSpots || existing.maxCapacityPerSlot,
            availableSpots:
              slot.availableSpots ||
              slot.maxSpots ||
              existing.maxCapacityPerSlot,
            priceMultiplier: slot.priceMultiplier || 1.0,
            specialPrice: slot.specialPrice
              ? parseFloat(slot.specialPrice)
              : null,
            isBlocked: slot.isBlocked || false,
            isHoliday: slot.isHoliday || false,
          },
        }),
      ),
    );

    return res.status(200).json({
      status: "success",
      message: `${results.length} time slot(s) saved`,
      data: results,
    });
  } catch (error) {
    console.error("Upsert Time Slots Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET AVAILABLE TIME SLOTS ====================
const getTimeSlots = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { date, from, to } = req.query;

    const where = { attractionId, isBlocked: false };

    if (date) {
      where.date = new Date(date);
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    } else {
      where.date = { gte: new Date() }; // Default: future only
    }

    const slots = await prisma.touristAttractionTimeSlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const attraction = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
      select: { basePrice: true, name: true },
    });

    // Enrich with effective price
    const enriched = slots.map((slot) => ({
      ...slot,
      effectivePrice: slot.specialPrice
        ? parseFloat(slot.specialPrice)
        : parseFloat(attraction.basePrice) * parseFloat(slot.priceMultiplier),
      isSoldOut: slot.availableSpots === 0,
    }));

    return res.status(200).json({
      status: "success",
      attractionName: attraction?.name,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    console.error("Get Time Slots Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== TOGGLE ACTIVE STATUS ====================
const toggleAttractionStatus = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const existing = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    const updated = await prisma.touristAttraction.update({
      where: { id: attractionId },
      data: { isActive: !existing.isActive },
    });

    return res.status(200).json({
      status: "success",
      message: `Attraction ${updated.isActive ? "activated" : "deactivated"}`,
      data: { id: updated.id, isActive: updated.isActive },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

module.exports = {
  createAttraction,
  getAllAttractions,
  getAttractionById,
  updateAttractionById,
  deleteAttractionById,
  upsertTimeSlots,
  getTimeSlots,
  toggleAttractionStatus,
};
