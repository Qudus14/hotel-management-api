const userSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 2 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8 },
    role: {
      type: "string",
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },
    phoneNumber: { type: "string" },
    address: { type: "string" },

    // Senior Additions
    isEmailVerified: { type: "boolean", default: false },
    isActive: { type: "boolean", default: true },
    profileImage: { type: "string" },
    isCreatedAt: {
      type: "string",
      format: "date-time",
      default: new Date().toISOString(),
    },
    isUpdatedAt: {
      type: "string",
      format: "date-time",
      default: new Date().toISOString(),
    },
  },
  required: ["name", "email", "password"],
};

module.exports = { userSchema };
