const hotelSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    starRating: { type: "number" },
    checkInTime: { type: "string" },
    checkOutTime: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    country: { type: "string" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    googlePlaceId: { type: "string" },
    coverImageUrl: { type: "string" },
    amenities: { type: "array", items: { type: "string" } },
    isActive: { type: "boolean" },
    isApproved: { type: "boolean" },
    avgRating: { type: "number" },
    totalReviews: { type: "number" },
    totalRooms: { type: "number" },
    totalBookings: { type: "number" },
    totalRevenue: { type: "number" },
  },
  required: [
    "name",
    "slug",
    "description",
    "starRating",
    "checkInTime",
    "checkOutTime",
    "address",
  ],
  additionalProperties: false,
};

const updateHotelSchema = {
  type: "object",
  properties: hotelSchema.properties,
  required: [],
  additionalProperties: false,
};

module.exports = { hotelSchema, updateHotelSchema };
