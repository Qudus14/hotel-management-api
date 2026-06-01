const carSchema = {
  id: "string",
  carStoreId: "string",
  categoryId: "string",
  pickupLocationId: "string",
  make: "string",
  model: "string",
  year: "number",
  color: "string",
  plateNumber: "string",
  transmission: "string",
  seats: "number",
  status: "string",
  images: "string[]",
  features: "string[]",
  depositRequired: "number",
  deletedAt: "Date",
  deletedBy: "string",
  createdAt: "Date",
  updatedAt: "Date",
};

const updateCarSchema = {
  name: "string",
  description: "string",
  price: "number",
  features: "string[]",
  status: "string",
  images: "string[]",
  depositRequired: "number",
  carStoreId: "string",
  categoryId: "string",
  pickupLocationId: "string",
  make: "string",
  model: "string",
  year: "number",
  color: "string",
  plateNumber: "string",
  transmission: "string",
  seats: "number",
};

carStoreSchema = {
  id: "string",
  vendorId: "string",
  name: "string",
  description: "string",
  isActive: "boolean",
  isApproved: "boolean",
  images: "string[]",
  createdAt: "Date",
  updatedAt: "Date",
};

const pickupLocationSchema = {
  id: "string",
  carStoreId: "string",
  name: "string",
  address: "string",
  latitude: "number",
  longitude: "number",
  isActive: "boolean",
  createdAt: "Date",
  updatedAt: "Date",
};

const carCategorySchema = {
  id: "string",
  carStoreId: "string",
  name: "string",
  description: "string",
  pricePerDay: "number",
  imageUrl: "string",
};

const storeHoursSchema = {
  id: "string",
  carStoreId: "string",
  dayOfWeek: "number",
  openTime: "string",
  closeTime: "string",
  isClosed: "boolean",
};
module.exports = {
  carSchema,
  updateCarSchema,
  carStoreSchema,
  pickupLocationSchema,
  carCategorySchema,
  storeHoursSchema,
};
