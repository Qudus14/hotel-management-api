// ==================== CREATE AIRLINE SCHEMA ====================
const createAirlineSchema = {
  type: "object",
  required: ["vendorId", "name", "iataCode"],
  properties: {
    vendorId: {
      type: "string",
      format: "uuid",
    },
    name: {
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    iataCode: {
      type: "string",
      minLength: 2,
      maxLength: 3,
      description: "2-letter IATA airline designator (e.g. P4, W3, Q9)",
    },
    logoUrl: {
      type: "string",
      format: "uri",
      nullable: true,
    },
    description: {
      type: "string",
      maxLength: 1000,
      nullable: true,
    },
  },
  additionalProperties: false,
};

// ==================== UPDATE AIRLINE SCHEMA ====================
const updateAirlineSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    name: {
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    iataCode: {
      type: "string",
      minLength: 2,
      maxLength: 3,
    },
    logoUrl: {
      type: "string",
      format: "uri",
      nullable: true,
    },
    description: {
      type: "string",
      maxLength: 1000,
      nullable: true,
    },
    isActive: {
      type: "boolean",
      description: "Admin only",
    },
  },
  additionalProperties: false,
};

// ==================== REVIEW AIRLINE SCHEMA (admin) ====================
const reviewAirlineSchema = {
  type: "object",
  required: ["action"],
  properties: {
    action: {
      type: "string",
      enum: ["approve", "reject"],
    },
    reason: {
      type: "string",
      minLength: 5,
      maxLength: 500,
      description: "Required when action is reject",
    },
  },
  additionalProperties: false,
};

module.exports = {
  createAirlineSchema,
  updateAirlineSchema,
  reviewAirlineSchema,
};
