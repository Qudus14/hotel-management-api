const userSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 2 },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 8 },
    role: {
      type: "string",
      enum: ["admin", "staff", "customer", "vendor"],
      default: "customer",
    },
    phoneNumber: { type: "string" },
    address: { type: "string" },

    // Senior Additions
    isEmailVerified: { type: "boolean", default: false },
    isActive: { type: "boolean", default: true },
    profileImage: { type: "string" },

    // Vendor specific fields
    vendorType: {
      type: "string",
      enum: ["hotel", "car_rental", "airline", "attraction"],
    },
    vendorStatus: {
      type: "string",
      enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "suspended",
        "deactivated",
      ],
    },

    // Kyc specific fields
    kycStatus: {
      type: "string",
      enum: [
        "not_submitted",
        "submitted",
        "under_review",
        "verified",
        "rejected",
        "expired",
      ],
    },
    kycSubmittedAt: { type: "string", format: "date-time" },
    kycVerifiedAt: { type: "string", format: "date-time" },
    kycRejectedReason: { type: "string" },
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
