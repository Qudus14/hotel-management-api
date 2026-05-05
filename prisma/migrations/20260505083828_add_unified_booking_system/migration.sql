/*
  Warnings:

  - You are about to alter the column `walletBalance` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `amount` on the `WalletTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `balanceBefore` on the `WalletTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `balanceAfter` on the `WalletTransaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[tailNumber]` on the table `Airplane` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[flightBookingId,addOnId]` on the table `BookingAddOn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[flightBookingId,flightId,seatId]` on the table `BookingSegment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('HOTEL', 'FLIGHT', 'ATTRACTION', 'CAR');

-- CreateEnum
CREATE TYPE "UnifiedBookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AttractionCategory" AS ENUM ('MUSEUM', 'PARK', 'HISTORICAL', 'BEACH', 'THEME_PARK', 'ZOO', 'LANDMARK', 'SHOPPING', 'TOUR', 'ENTERTAINMENT', 'WATER_PARK', 'AQUARIUM', 'ART_GALLERY', 'CONCERT_VENUE', 'SPORTS_VENUE', 'RELIGIOUS_SITE', 'NATURE_RESERVE');

-- CreateEnum
CREATE TYPE "AttractionBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLATION', 'PAYMENT_RECEIPT', 'PAYMENT_FAILED', 'REVIEW_RESPONSE', 'PROMOTION', 'SYSTEM_ALERT');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- AlterTable
ALTER TABLE "AddOn" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "unifiedBookingId" TEXT;

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "FlightBooking" ADD COLUMN     "unifiedBookingId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundReference" TEXT,
ADD COLUMN     "refundedAmount" DECIMAL(12,2),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "unifiedBookingId" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Seat" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ALTER COLUMN "walletBalance" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "unifiedBookingId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "balanceBefore" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "Attraction" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttractionTimeSlot" (
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

    CONSTRAINT "AttractionTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttractionBooking" (
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

    CONSTRAINT "AttractionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnifiedBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "hotelBookingId" TEXT,
    "flightBookingId" TEXT,
    "attractionBookingId" TEXT,
    "carBookingId" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceStartDate" TIMESTAMP(3) NOT NULL,
    "serviceEndDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "serviceFee" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "couponCode" TEXT,
    "discountAmount" DECIMAL(12,2),
    "discountReason" TEXT,
    "bookingStatus" "UnifiedBookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cancellationDeadline" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "refundAmount" DECIMAL(12,2),
    "refundProcessedAt" TIMESTAMP(3),
    "bundleId" TEXT,
    "cartId" TEXT,
    "referenceCode" TEXT NOT NULL,
    "specialRequests" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnifiedBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2) NOT NULL,
    "serviceFee" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "couponCode" TEXT,
    "discountAmount" DECIMAL(12,2),
    "discountId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "abandonedAt" TIMESTAMP(3),
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "checkedOutAt" TIMESTAMP(3),
    "checkoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "serviceId" TEXT NOT NULL,
    "bookingData" JSONB NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "inventoryHoldExpiresAt" TIMESTAMP(3) NOT NULL,
    "holdId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unifiedBookingId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "serviceId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulVotes" JSONB,
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "reportReason" TEXT,
    "images" TEXT[],
    "ownerResponse" TEXT,
    "responseAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "moderatedAt" TIMESTAMP(3),
    "moderatedBy" TEXT,
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attractionId" TEXT,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "applicableServices" "ServiceType"[],
    "maxUses" INTEGER NOT NULL,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "minimumSpend" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unifiedBookingId" TEXT NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "unifiedBookingId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "sentEmail" BOOLEAN NOT NULL DEFAULT false,
    "sentSMS" BOOLEAN NOT NULL DEFAULT false,
    "sentPush" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attraction_city_country_idx" ON "Attraction"("city", "country");

-- CreateIndex
CREATE INDEX "Attraction_category_idx" ON "Attraction"("category");

-- CreateIndex
CREATE INDEX "Attraction_isActive_idx" ON "Attraction"("isActive");

-- CreateIndex
CREATE INDEX "Attraction_deletedAt_idx" ON "Attraction"("deletedAt");

-- CreateIndex
CREATE INDEX "AttractionTimeSlot_attractionId_date_isBlocked_idx" ON "AttractionTimeSlot"("attractionId", "date", "isBlocked");

-- CreateIndex
CREATE INDEX "AttractionTimeSlot_date_availableSpots_idx" ON "AttractionTimeSlot"("date", "availableSpots");

-- CreateIndex
CREATE UNIQUE INDEX "AttractionTimeSlot_attractionId_date_startTime_key" ON "AttractionTimeSlot"("attractionId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "AttractionBooking_ticketNumber_key" ON "AttractionBooking"("ticketNumber");

-- CreateIndex
CREATE INDEX "AttractionBooking_unifiedBookingId_idx" ON "AttractionBooking"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "AttractionBooking_timeSlotId_status_idx" ON "AttractionBooking"("timeSlotId", "status");

-- CreateIndex
CREATE INDEX "AttractionBooking_ticketNumber_idx" ON "AttractionBooking"("ticketNumber");

-- CreateIndex
CREATE INDEX "AttractionBooking_attractionId_status_idx" ON "AttractionBooking"("attractionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UnifiedBooking_referenceCode_key" ON "UnifiedBooking"("referenceCode");

-- CreateIndex
CREATE INDEX "UnifiedBooking_userId_bookingStatus_idx" ON "UnifiedBooking"("userId", "bookingStatus");

-- CreateIndex
CREATE INDEX "UnifiedBooking_serviceType_serviceStartDate_idx" ON "UnifiedBooking"("serviceType", "serviceStartDate");

-- CreateIndex
CREATE INDEX "UnifiedBooking_bundleId_idx" ON "UnifiedBooking"("bundleId");

-- CreateIndex
CREATE INDEX "UnifiedBooking_referenceCode_idx" ON "UnifiedBooking"("referenceCode");

-- CreateIndex
CREATE INDEX "UnifiedBooking_bookingStatus_paymentStatus_idx" ON "UnifiedBooking"("bookingStatus", "paymentStatus");

-- CreateIndex
CREATE INDEX "UnifiedBooking_cancellationDeadline_idx" ON "UnifiedBooking"("cancellationDeadline");

-- CreateIndex
CREATE INDEX "UnifiedBooking_serviceStartDate_bookingStatus_idx" ON "UnifiedBooking"("serviceStartDate", "bookingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "Cart_userId_status_idx" ON "Cart"("userId", "status");

-- CreateIndex
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");

-- CreateIndex
CREATE INDEX "Cart_status_abandonedAt_idx" ON "Cart"("status", "abandonedAt");

-- CreateIndex
CREATE INDEX "CartItem_inventoryHoldExpiresAt_idx" ON "CartItem"("inventoryHoldExpiresAt");

-- CreateIndex
CREATE INDEX "CartItem_serviceType_serviceId_idx" ON "CartItem"("serviceType", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_serviceType_serviceId_key" ON "CartItem"("cartId", "serviceType", "serviceId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_serviceType_serviceId_idx" ON "Review"("serviceType", "serviceId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Review_isPublished_createdAt_idx" ON "Review"("isPublished", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_unifiedBookingId_serviceType_key" ON "Review"("unifiedBookingId", "serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_isActive_idx" ON "Coupon"("code", "isActive");

-- CreateIndex
CREATE INDEX "Coupon_validFrom_validUntil_idx" ON "Coupon"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_userId_unifiedBookingId_key" ON "CouponUsage"("couponId", "userId", "unifiedBookingId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Airplane_tailNumber_key" ON "Airplane"("tailNumber");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_roomId_checkInDate_checkOutDate_idx" ON "Booking"("roomId", "checkInDate", "checkOutDate");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_unifiedBookingId_idx" ON "Booking"("unifiedBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddOn_flightBookingId_addOnId_key" ON "BookingAddOn"("flightBookingId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingSegment_flightBookingId_flightId_seatId_key" ON "BookingSegment"("flightBookingId", "flightId", "seatId");

-- CreateIndex
CREATE INDEX "Flight_departureAirport_arrivalAirport_idx" ON "Flight"("departureAirport", "arrivalAirport");

-- CreateIndex
CREATE INDEX "Flight_departureTime_status_idx" ON "Flight"("departureTime", "status");

-- CreateIndex
CREATE INDEX "Flight_deletedAt_idx" ON "Flight"("deletedAt");

-- CreateIndex
CREATE INDEX "FlightBooking_userId_idx" ON "FlightBooking"("userId");

-- CreateIndex
CREATE INDEX "FlightBooking_status_idx" ON "FlightBooking"("status");

-- CreateIndex
CREATE INDEX "FlightBooking_unifiedBookingId_idx" ON "FlightBooking"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_key_status_idx" ON "IdempotencyKey"("key", "status");

-- CreateIndex
CREATE INDEX "Payment_unifiedBookingId_idx" ON "Payment"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "Payment_reference_idx" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "Room_type_idx" ON "Room"("type");

-- CreateIndex
CREATE INDEX "Room_deletedAt_idx" ON "Room"("deletedAt");

-- CreateIndex
CREATE INDEX "Seat_flightId_isAvailable_idx" ON "Seat"("flightId", "isAvailable");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_unifiedBookingId_idx" ON "WalletTransaction"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttractionTimeSlot" ADD CONSTRAINT "AttractionTimeSlot_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "Attraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttractionBooking" ADD CONSTRAINT "AttractionBooking_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttractionBooking" ADD CONSTRAINT "AttractionBooking_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "Attraction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttractionBooking" ADD CONSTRAINT "AttractionBooking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "AttractionTimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedBooking" ADD CONSTRAINT "UnifiedBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "Attraction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "UnifiedBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
