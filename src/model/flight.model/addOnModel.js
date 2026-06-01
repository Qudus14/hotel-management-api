// ==================== CREATE ADD-ON SCHEMA ====================
const createAddOnSchema = {
  type: "object",
  required: ["type", "name", "price"],
  properties: {
    type: {
      type: "string",
      enum: ["BAGGAGE", "MEAL", "WIFI", "PRIORITY_BOARDING"],
    },
    name: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      description: "Descriptive name (e.g. Extra 23kg Baggage)",
    },
    price: {
      type: "number",
      minimum: 0,
      description: "Price in NGN",
    },
    flightId: {
      type: "string",
      format: "uuid",
      nullable: true,
      description: "Optional — omit to make add-on available for all flights",
    },
  },
  additionalProperties: false,
};

// ==================== UPDATE ADD-ON SCHEMA ====================
const updateAddOnSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    type: {
      type: "string",
      enum: ["BAGGAGE", "MEAL", "WIFI", "PRIORITY_BOARDING"],
    },
    name: {
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: "number",
      minimum: 0,
    },
  },
  additionalProperties: false,
};

module.exports = {
  createAddOnSchema,
  updateAddOnSchema,
};
