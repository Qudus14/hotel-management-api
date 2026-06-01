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
  "ADVENTURE",
  "FOOD_TOUR",
  "NIGHTLIFE",
  "WELLNESS",
  "EDUCATIONAL",
  "SPORTS",
];

// ==================== CREATE ATTRACTION ====================
const createAttraction = async (req, res) => {
  try {
    const {
      operatorId,
      slug,
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
      included,
      notIncluded,
      whatToBring,
      relatedAttractionIds,
      metadata,
    } = req.body;

    const upperCategory = category?.toUpperCase();
    if (!VALID_CATEGORIES.includes(upperCategory)) {
      return res.status(400).json({
        status: "fail",
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    // Verify operator if provided
    if (operatorId) {
      const operator = await prisma.attractionOperator.findUnique({
        where: { id: operatorId },
      });
      if (!operator) {
        return res
          .status(404)
          .json({ status: "fail", error: "Operator not found" });
      }
      if (!operator.isApproved) {
        return res.status(400).json({
          status: "fail",
          error: "Operator must be approved before attractions can be listed",
        });
      }
    }

    const attraction = await prisma.touristAttraction.create({
      data: {
        operatorId: operatorId || null,
        slug: slug || null,
        name,
        description,
        category: upperCategory,
        address,
        city,
        country,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        openingHours,
        additionalInformation: additionalInformation || null,
        basePrice: parseFloat(basePrice),
        dynamicPricing: dynamicPricing ?? false,
        isBookable: isBookable ?? true,
        maxCapacityPerSlot: maxCapacityPerSlot ?? 50,
        minAdvanceHours: minAdvanceHours ?? 2,
        maxAdvanceDays: maxAdvanceDays ?? 90,
        cancellationWindowHours: cancellationWindowHours ?? 24,
        refundPercentage: refundPercentage ?? 90,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        website: website || null,
        averageDurationMinutes: averageDurationMinutes ?? 120,
        images: images || [],
        included: included || [],
        notIncluded: notIncluded || [],
        whatToBring: whatToBring || [],
        relatedAttractionIds: relatedAttractionIds || null,
        metadata: metadata || null,
        isActive: true,
      },
      include: {
        operator: { select: { id: true, name: true } },
        amenityMappings: { include: { amenity: true } },
        reasonMappings: { include: { reason: true } },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Attraction created successfully",
      data: attraction,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        error: "An attraction with this slug already exists",
      });
    }
    console.error("Create Attraction Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ALL ATTRACTIONS ====================
const getAllAttractions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { city, country, category, isBookable, search, minPrice, maxPrice } =
      req.query;

    const where = { isActive: true, deletedAt: null };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (category) {
      const upperCat = category.toUpperCase();
      if (VALID_CATEGORIES.includes(upperCat)) where.category = upperCat;
    }
    if (isBookable !== undefined) where.isBookable = isBookable === "true";
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) where.basePrice.lte = parseFloat(maxPrice);
    }
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
          operator: { select: { id: true, name: true } },
          amenityMappings: { include: { amenity: true } },
          reasonMappings: { include: { reason: true } },
          _count: {
            select: { bookings: true, reviews: true, timeSlots: true },
          },
        },
      }),
      prisma.touristAttraction.count({ where }),
    ]);

    const data = attractions.map((a) => ({
      ...a,
      amenities: a.amenityMappings.map((m) => m.amenity),
      reasonsToVisit: a.reasonMappings.map((m) => m.reason),
      stats: {
        averageRating: a.averageRating,
        totalReviews: a.totalReviews,
        totalBookings: a._count.bookings,
        totalSlots: a._count.timeSlots,
      },
      amenityMappings: undefined,
      reasonMappings: undefined,
      _count: undefined,
    }));

    return res.status(200).json({
      status: "success",
      results: data.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data,
    });
  } catch (error) {
    console.error("Get Attractions Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== GET ATTRACTION BY ID ====================
const getAttractionById = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const attraction = await prisma.touristAttraction.findFirst({
      where: {
        OR: [{ id: attractionId }, { slug: attractionId }],
        deletedAt: null,
      },
      include: {
        operator: {
          select: { id: true, name: true, description: true },
        },
        amenityMappings: { include: { amenity: true } },
        reasonMappings: { include: { reason: true } },
        timeSlots: {
          where: {
            date: { gte: new Date() },
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
        // relatedFrom = "original" side of RelatedTouristAttraction
        relatedFrom: {
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

    const bookingStats = await prisma.touristAttractionBooking.aggregate({
      where: { attractionId: attraction.id, status: { not: "CANCELLED" } },
      _sum: { numberOfPeople: true },
      _count: { id: true },
    });

    const response = {
      ...attraction,
      amenities: attraction.amenityMappings.map((m) => m.amenity),
      reasonsToVisit: attraction.reasonMappings.map((m) => m.reason),
      relatedAttractions: attraction.relatedFrom.map((r) => ({
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
        averageRating: attraction.averageRating,
        totalReviews: attraction.totalReviews,
        totalBookings: bookingStats._count.id,
        totalVisitors: bookingStats._sum.numberOfPeople || 0,
      },
      // Clean up raw mapping fields
      amenityMappings: undefined,
      reasonMappings: undefined,
      relatedFrom: undefined,
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
    if (!existing || existing.deletedAt) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    const {
      slug,
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
      included,
      notIncluded,
      whatToBring,
      isActive,
    } = req.body;

    if (category) {
      const upperCat = category.toUpperCase();
      if (!VALID_CATEGORIES.includes(upperCat)) {
        return res
          .status(400)
          .json({ status: "fail", error: "Invalid category" });
      }
    }

    const updateData = {};
    if (slug !== undefined) updateData.slug = slug;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category.toUpperCase();
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
    if (included !== undefined) updateData.included = included;
    if (notIncluded !== undefined) updateData.notIncluded = notIncluded;
    if (whatToBring !== undefined) updateData.whatToBring = whatToBring;
    if (isActive !== undefined) updateData.isActive = isActive;

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
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ status: "fail", error: "Slug already in use" });
    }
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
    if (!existing || existing.deletedAt) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    const upcomingBookings = await prisma.touristAttractionBooking.count({
      where: {
        attractionId,
        status: "BOOKED",
        timeSlot: { date: { gte: new Date() } },
      },
    });

    if (upcomingBookings > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete attraction with ${upcomingBookings} upcoming booking(s). Cancel them first.`,
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

// ==================== TOGGLE ACTIVE STATUS ====================
const toggleAttractionStatus = async (req, res) => {
  try {
    const { attractionId } = req.params;

    const existing = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!existing || existing.deletedAt) {
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
    console.error("Toggle Attraction Status Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== UPSERT TIME SLOTS ====================
const upsertTimeSlots = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { timeSlots } = req.body;

    const existing = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
    });
    if (!existing || existing.deletedAt) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    const results = await Promise.all(
      timeSlots.map((slot) => {
        const slotDate = new Date(slot.date);
        const maxSpots = slot.maxSpots ?? existing.maxCapacityPerSlot;
        const availableSpots = slot.availableSpots ?? maxSpots;

        return prisma.touristAttractionTimeSlot.upsert({
          where: {
            attractionId_date_startTime: {
              attractionId,
              date: slotDate,
              startTime: slot.startTime,
            },
          },
          update: {
            endTime: slot.endTime,
            maxSpots,
            availableSpots,
            priceMultiplier: slot.priceMultiplier ?? 1.0,
            specialPrice: slot.specialPrice
              ? parseFloat(slot.specialPrice)
              : null,
            isBlocked: slot.isBlocked ?? false,
            isHoliday: slot.isHoliday ?? false,
          },
          create: {
            attractionId,
            date: slotDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxSpots,
            availableSpots,
            priceMultiplier: slot.priceMultiplier ?? 1.0,
            specialPrice: slot.specialPrice
              ? parseFloat(slot.specialPrice)
              : null,
            isBlocked: slot.isBlocked ?? false,
            isHoliday: slot.isHoliday ?? false,
          },
        });
      }),
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

// ==================== GET TIME SLOTS ====================
const getTimeSlots = async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { date, from, to } = req.query;

    const attraction = await prisma.touristAttraction.findUnique({
      where: { id: attractionId },
      select: { id: true, name: true, basePrice: true, deletedAt: true },
    });
    if (!attraction || attraction.deletedAt) {
      return res
        .status(404)
        .json({ status: "fail", error: "Attraction not found" });
    }

    const where = { attractionId, isBlocked: false };

    if (date) {
      where.date = new Date(date);
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    } else {
      where.date = { gte: new Date() };
    }

    const slots = await prisma.touristAttractionTimeSlot.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const enriched = slots.map((slot) => ({
      ...slot,
      effectivePrice: slot.specialPrice
        ? parseFloat(slot.specialPrice)
        : parseFloat(attraction.basePrice) * parseFloat(slot.priceMultiplier),
      isSoldOut: slot.availableSpots === 0,
    }));

    return res.status(200).json({
      status: "success",
      attractionName: attraction.name,
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

// ==================== UPDATE SINGLE TIME SLOT ====================
const updateTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const {
      availableSpots,
      maxSpots,
      reservedSpots,
      confirmedSpots,
      priceMultiplier,
      specialPrice,
      isBlocked,
      isHoliday,
    } = req.body;

    const existing = await prisma.touristAttractionTimeSlot.findUnique({
      where: { id: slotId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Time slot not found" });
    }

    const updateData = {};
    if (availableSpots !== undefined)
      updateData.availableSpots = availableSpots;
    if (maxSpots !== undefined) updateData.maxSpots = maxSpots;
    if (reservedSpots !== undefined) updateData.reservedSpots = reservedSpots;
    if (confirmedSpots !== undefined)
      updateData.confirmedSpots = confirmedSpots;
    if (priceMultiplier !== undefined)
      updateData.priceMultiplier = priceMultiplier;
    if (specialPrice !== undefined)
      updateData.specialPrice =
        specialPrice !== null ? parseFloat(specialPrice) : null;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (isHoliday !== undefined) updateData.isHoliday = isHoliday;

    const updated = await prisma.touristAttractionTimeSlot.update({
      where: { id: slotId },
      data: updateData,
    });

    return res.status(200).json({
      status: "success",
      message: "Time slot updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Time Slot Error:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal Server Error" });
  }
};

// ==================== DELETE SINGLE TIME SLOT ====================
const deleteTimeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const existing = await prisma.touristAttractionTimeSlot.findUnique({
      where: { id: slotId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ status: "fail", error: "Time slot not found" });
    }

    if (existing._count.bookings > 0) {
      return res.status(400).json({
        status: "fail",
        error: `Cannot delete slot with ${existing._count.bookings} booking(s). Block it instead.`,
      });
    }

    await prisma.touristAttractionTimeSlot.delete({ where: { id: slotId } });

    return res.status(200).json({
      status: "success",
      message: "Time slot deleted successfully",
    });
  } catch (error) {
    console.error("Delete Time Slot Error:", error);
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
  toggleAttractionStatus,
  upsertTimeSlots,
  getTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
};
