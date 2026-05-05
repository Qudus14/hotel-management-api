/*
  Warnings:

  - You are about to drop the `Attraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AttractionBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AttractionTimeSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AttractionBooking" DROP CONSTRAINT "AttractionBooking_attractionId_fkey";

-- DropForeignKey
ALTER TABLE "AttractionBooking" DROP CONSTRAINT "AttractionBooking_timeSlotId_fkey";

-- DropForeignKey
ALTER TABLE "AttractionBooking" DROP CONSTRAINT "AttractionBooking_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "AttractionTimeSlot" DROP CONSTRAINT "AttractionTimeSlot_attractionId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_attractionId_fkey";

-- DropTable
DROP TABLE "Attraction";

-- DropTable
DROP TABLE "AttractionBooking";

-- DropTable
DROP TABLE "AttractionTimeSlot";

-- CreateTable
CREATE TABLE "TouristAttraction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AttractionCategory" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "maxCapacityPerSlot" INTEGER NOT NULL DEFAULT 50,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 2,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 90,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "dynamicPricing" BOOLEAN NOT NULL DEFAULT false,
    "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24,
    "refundPercentage" INTEGER NOT NULL DEFAULT 90,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "images" TEXT[],
    "averageDurationMinutes" INTEGER NOT NULL DEFAULT 120,
    "metadata" JSONB,
    "openingHours" TEXT NOT NULL,
    "additionalInformation" TEXT,
    "relatedAttractionIds" TEXT,
    "travelersPhotos" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristAttraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedTouristAttraction" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "relatedAttractionId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "travelTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelatedTouristAttraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouristAttractionTimeSlot" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "availableSpots" INTEGER NOT NULL DEFAULT 50,
    "maxSpots" INTEGER NOT NULL DEFAULT 50,
    "priceMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "specialPrice" DECIMAL(12,2),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "reservedSpots" INTEGER NOT NULL DEFAULT 0,
    "confirmedSpots" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristAttractionTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouristAttractionBooking" (
    "id" TEXT NOT NULL,
    "unifiedBookingId" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "numberOfPeople" INTEGER NOT NULL,
    "visitorNames" TEXT[],
    "pricePerPerson" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "qrCode" TEXT,
    "ticketNumber" TEXT,
    "entryScanned" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" TIMESTAMP(3),
    "status" "AttractionBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristAttractionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_photos" (
    "id" TEXT NOT NULL,
    "attraction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouristAttractionAmenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristAttractionAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attraction_amenities" (
    "id" TEXT NOT NULL,
    "attraction_id" TEXT NOT NULL,
    "amenity_id" TEXT NOT NULL,

    CONSTRAINT "attraction_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TouristAttractionReason" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristAttractionReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attraction_reasons" (
    "id" TEXT NOT NULL,
    "attraction_id" TEXT NOT NULL,
    "reason_id" TEXT NOT NULL,

    CONSTRAINT "attraction_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TouristAttraction_city_country_idx" ON "TouristAttraction"("city", "country");

-- CreateIndex
CREATE INDEX "TouristAttraction_category_idx" ON "TouristAttraction"("category");

-- CreateIndex
CREATE INDEX "TouristAttraction_isActive_idx" ON "TouristAttraction"("isActive");

-- CreateIndex
CREATE INDEX "TouristAttraction_deletedAt_idx" ON "TouristAttraction"("deletedAt");

-- CreateIndex
CREATE INDEX "RelatedTouristAttraction_attractionId_idx" ON "RelatedTouristAttraction"("attractionId");

-- CreateIndex
CREATE INDEX "RelatedTouristAttraction_relatedAttractionId_idx" ON "RelatedTouristAttraction"("relatedAttractionId");

-- CreateIndex
CREATE UNIQUE INDEX "RelatedTouristAttraction_attractionId_relatedAttractionId_key" ON "RelatedTouristAttraction"("attractionId", "relatedAttractionId");

-- CreateIndex
CREATE INDEX "TouristAttractionTimeSlot_attractionId_date_isBlocked_idx" ON "TouristAttractionTimeSlot"("attractionId", "date", "isBlocked");

-- CreateIndex
CREATE INDEX "TouristAttractionTimeSlot_date_availableSpots_idx" ON "TouristAttractionTimeSlot"("date", "availableSpots");

-- CreateIndex
CREATE UNIQUE INDEX "TouristAttractionTimeSlot_attractionId_date_startTime_key" ON "TouristAttractionTimeSlot"("attractionId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "TouristAttractionBooking_ticketNumber_key" ON "TouristAttractionBooking"("ticketNumber");

-- CreateIndex
CREATE INDEX "TouristAttractionBooking_unifiedBookingId_idx" ON "TouristAttractionBooking"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "TouristAttractionBooking_timeSlotId_status_idx" ON "TouristAttractionBooking"("timeSlotId", "status");

-- CreateIndex
CREATE INDEX "TouristAttractionBooking_ticketNumber_idx" ON "TouristAttractionBooking"("ticketNumber");

-- CreateIndex
CREATE INDEX "TouristAttractionBooking_attractionId_status_idx" ON "TouristAttractionBooking"("attractionId", "status");

-- CreateIndex
CREATE INDEX "traveler_photos_attraction_id_idx" ON "traveler_photos"("attraction_id");

-- CreateIndex
CREATE INDEX "traveler_photos_user_id_idx" ON "traveler_photos"("user_id");

-- CreateIndex
CREATE INDEX "traveler_photos_likes_idx" ON "traveler_photos"("likes");

-- CreateIndex
CREATE UNIQUE INDEX "TouristAttractionAmenity_name_key" ON "TouristAttractionAmenity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attraction_amenities_attraction_id_amenity_id_key" ON "attraction_amenities"("attraction_id", "amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "attraction_reasons_attraction_id_reason_id_key" ON "attraction_reasons"("attraction_id", "reason_id");

-- AddForeignKey
ALTER TABLE "RelatedTouristAttraction" ADD CONSTRAINT "RelatedTouristAttraction_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedTouristAttraction" ADD CONSTRAINT "RelatedTouristAttraction_relatedAttractionId_fkey" FOREIGN KEY ("relatedAttractionId") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouristAttractionTimeSlot" ADD CONSTRAINT "TouristAttractionTimeSlot_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouristAttractionBooking" ADD CONSTRAINT "TouristAttractionBooking_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouristAttractionBooking" ADD CONSTRAINT "TouristAttractionBooking_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TouristAttractionBooking" ADD CONSTRAINT "TouristAttractionBooking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TouristAttractionTimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_photos" ADD CONSTRAINT "traveler_photos_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_photos" ADD CONSTRAINT "traveler_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_amenities" ADD CONSTRAINT "attraction_amenities_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_amenities" ADD CONSTRAINT "attraction_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "TouristAttractionAmenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_reasons" ADD CONSTRAINT "attraction_reasons_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "TouristAttraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_reasons" ADD CONSTRAINT "attraction_reasons_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "TouristAttractionReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "TouristAttraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
