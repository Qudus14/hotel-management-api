const roomSchema = {
  type: "object",
  properties: {
    roomNumber: { type: "string" },
    floor: { type: "integer", nullable: true },
    type: {
      type: "string",
      enum: [
        "single",
        "double",
        "suite",
        "deluxe",
        "family",
        "presidential",
        "standard",
        "economy",
        "luxury",
      ],
    },
    capacity: { type: "integer", minimum: 1 },
    bedType: { type: "string", nullable: true },
    price: { type: "number", minimum: 0 },
    status: {
      type: "string",
      enum: [
        "available",
        "occupied",
        "maintenance",
        "reserved",
        "cleaning",
        "out_of_service",
      ],
    },
    amenities: {
      type: "array",
      items: { type: "string" },
      nullable: true,
      default: [],
    },
    images: {
      type: "array",
      items: { type: "string" },
      nullable: true,
      default: [],
    },
    description: { type: "string", nullable: true },
  },
  required: ["roomNumber", "type", "price", "status", "capacity"],
};

const updateRoomSchema = {
  type: "object",
  properties: roomSchema.properties, // reuse same properties
  required: [], // nothing required on update
};

module.exports = { roomSchema, updateRoomSchema };
