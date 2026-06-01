const createAttractionOperatorSchema = {
  type: "object",
  required: ["vendorId", "name"],
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
    description: {
      type: "string",
      maxLength: 1000,
      nullable: true,
    },
  },
  additionalProperties: false,
};

const updateAttractionOperatorSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    name: {
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    description: {
      type: "string",
      maxLength: 1000,
      nullable: true,
    },
    isActive: {
      type: "boolean",
    },
  },
  additionalProperties: false,
};

const reviewAttractionOperatorSchema = {
  type: "object",
  required: ["isApproved"],
  properties: {
    isApproved: {
      type: "boolean",
    },
  },
  additionalProperties: false,
};

module.exports = {
  createAttractionOperatorSchema,
  updateAttractionOperatorSchema,
  reviewAttractionOperatorSchema,
};
