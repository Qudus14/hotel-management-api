const attraction = {
  // Basic Info
  id: string,
  name: string,
  description: string,
  
  // Location
  location: {
    address: string,
    city: string,
    country: string,
    latitude: number,
    longitude: number,
  },
  
  // Category (single enum, not array)
  category: "MUSEUM" | "PARK" | "HISTORICAL" | "BEACH" | "THEME_PARK" | "ZOO" | "LANDMARK" | "SHOPPING" | "TOUR" | "ENTERTAINMENT" | "WATER_PARK" | "AQUARIUM" | "ART_GALLERY" | "CONCERT_VENUE" | "SPORTS_VENUE" | "RELIGIOUS_SITE" | "NATURE_RESERVE",
  
  // Opening Hours (moved to metadata)
  openingHours: string,
  
  // Pricing
  ticketPrice: number,
  
  // Media
  images: [string],
  
  // Additional Info (moved to metadata)
  additionalInformation: string,
  
  // Features (moved to metadata)
  amenities: [string],
  ReasonToVisit: [string],
  
  // Reviews
  reviews: [
    {
      id: string,
      userId: string,
      userName: string,
      rating: number,
      title: string,
      comment: string,
      images: [string],
      helpfulCount: number,
      isVerified: boolean,
      ownerResponse: string | null,
      createdAt: Date,
    },
  ],
  
  // Related Attractions
  relatedAttractions: [
    {
      id: string,
      name: string,
      distance: string | null,
      estimatedTravelTime: string | null,
    },
  ],
  
  // Travelers Photos
  travelersPhotos: [
    {
      id: string,
      userId: string,
      userName: string,
      imageUrl: string,
      caption: string | null,
      likes: number,
      createdAt: Date,
    },
  ],
  
  // Booking Rules (REQUIRED - was missing)
  isBookable: boolean,
  maxCapacityPerSlot: number,
  minAdvanceHours: number,
  maxAdvanceDays: number,
  
  // Pricing Rules (REQUIRED - was missing)
  basePrice: number,
  dynamicPricing: boolean,
  
  // Cancellation Policy (REQUIRED - was missing)
  cancellationWindowHours: number,
  refundPercentage: number,
  
  // Contact Info (REQUIRED - was missing)
  contact: {
    phone: string | null,
    email: string | null,
    website: string | null,
  },
  
  // Duration (REQUIRED - was missing)
  averageDurationMinutes: number,
  
  // Time Slots (REQUIRED - was missing)
  timeSlots: [
    {
      id: string,
      date: Date,
      startTime: string,
      endTime: string,
      availableSpots: number,
      maxSpots: number,
      priceMultiplier: number,
      specialPrice: number | null,
      isBlocked: boolean,
      isHoliday: boolean,
      reservedSpots: number,
      confirmedSpots: number,
    },
  ],
  
  // Bookings (REQUIRED - was missing)
  bookings: [
    {
      id: string,
      unifiedBookingId: string,
      numberOfPeople: number,
      visitorNames: [string],
      pricePerPerson: number,
      subtotal: number,
      tax: number,
      totalPrice: number,
      qrCode: string | null,
      ticketNumber: string | null,
      entryScanned: boolean,
      scannedAt: Date | null,
      status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" | "REFUNDED",
      timeSlotId: string,
      createdAt: Date,
    },
  ],
  
  // Stats (Calculated)
  stats: {
    averageRating: number | null,
    totalReviews: number,
    totalBookings: number,
    averageBookingSize: number,
    occupancyRate: number,
    peakHours: [string],
  },
  
  // Status
  isActive: boolean,
  deletedAt: Date | null,
  deletedBy: string | null,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}