/*
  Warnings:

  - You are about to drop the `AddOn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Airplane` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingAddOn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingSegment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CartItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Coupon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CouponUsage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Flight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FlightBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IdempotencyKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RelatedTouristAttraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Seat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TouristAttraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TouristAttractionAmenity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TouristAttractionBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TouristAttractionReason` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TouristAttractionTimeSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnifiedBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attraction_reasons` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "IDType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'BVN', 'NIN');

-- CreateEnum
CREATE TYPE "OTPType" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('HOTEL', 'CAR_RENTAL', 'AIRLINE', 'ATTRACTION');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'BUNK');

-- CreateEnum
CREATE TYPE "RoomTypeEnum" AS ENUM ('single', 'double', 'suite', 'deluxe', 'family', 'presidential', 'standard', 'economy', 'luxury');

-- CreateEnum
CREATE TYPE "SeatClass" AS ENUM ('ECONOMY', 'BUSINESS', 'FIRST');

-- CreateEnum
CREATE TYPE "PlaneStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttractionCategory" ADD VALUE 'ADVENTURE';
ALTER TYPE "AttractionCategory" ADD VALUE 'FOOD_TOUR';
ALTER TYPE "AttractionCategory" ADD VALUE 'NIGHTLIFE';
ALTER TYPE "AttractionCategory" ADD VALUE 'WELLNESS';
ALTER TYPE "AttractionCategory" ADD VALUE 'EDUCATIONAL';
ALTER TYPE "AttractionCategory" ADD VALUE 'SPORTS';

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'refunded';

-- AlterEnum
ALTER TYPE "FlightStatus" ADD VALUE 'DIVERTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'VENDOR_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'VENDOR_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'VENDOR_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'KYC_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE 'KYC_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'STRIPE';
ALTER TYPE "PaymentMethod" ADD VALUE 'PAYSTACK';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'vendor';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "BookingAddOn" DROP CONSTRAINT "BookingAddOn_addOnId_fkey";

-- DropForeignKey
ALTER TABLE "BookingAddOn" DROP CONSTRAINT "BookingAddOn_flightBookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingSegment" DROP CONSTRAINT "BookingSegment_flightBookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingSegment" DROP CONSTRAINT "BookingSegment_flightId_fkey";

-- DropForeignKey
ALTER TABLE "BookingSegment" DROP CONSTRAINT "BookingSegment_seatId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_couponId_fkey";

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "CouponUsage" DROP CONSTRAINT "CouponUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "FlightBooking" DROP CONSTRAINT "FlightBooking_flightId_fkey";

-- DropForeignKey
ALTER TABLE "FlightBooking" DROP CONSTRAINT "FlightBooking_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "FlightBooking" DROP CONSTRAINT "FlightBooking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "RelatedTouristAttraction" DROP CONSTRAINT "RelatedTouristAttraction_attractionId_fkey";

-- DropForeignKey
ALTER TABLE "RelatedTouristAttraction" DROP CONSTRAINT "RelatedTouristAttraction_relatedAttractionId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_attractionId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_flightBookingId_fkey";

-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_flightId_fkey";

-- DropForeignKey
ALTER TABLE "TouristAttractionBooking" DROP CONSTRAINT "TouristAttractionBooking_attractionId_fkey";

-- DropForeignKey
ALTER TABLE "TouristAttractionBooking" DROP CONSTRAINT "TouristAttractionBooking_timeSlotId_fkey";

-- DropForeignKey
ALTER TABLE "TouristAttractionBooking" DROP CONSTRAINT "TouristAttractionBooking_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "TouristAttractionTimeSlot" DROP CONSTRAINT "TouristAttractionTimeSlot_attractionId_fkey";

-- DropForeignKey
ALTER TABLE "UnifiedBooking" DROP CONSTRAINT "UnifiedBooking_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_unifiedBookingId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "attraction_amenities" DROP CONSTRAINT "attraction_amenities_amenity_id_fkey";

-- DropForeignKey
ALTER TABLE "attraction_amenities" DROP CONSTRAINT "attraction_amenities_attraction_id_fkey";

-- DropForeignKey
ALTER TABLE "attraction_reasons" DROP CONSTRAINT "attraction_reasons_attraction_id_fkey";

-- DropForeignKey
ALTER TABLE "attraction_reasons" DROP CONSTRAINT "attraction_reasons_reason_id_fkey";

-- DropForeignKey
ALTER TABLE "traveler_photos" DROP CONSTRAINT "traveler_photos_attraction_id_fkey";

-- DropForeignKey
ALTER TABLE "traveler_photos" DROP CONSTRAINT "traveler_photos_user_id_fkey";

-- DropTable
DROP TABLE "AddOn";

-- DropTable
DROP TABLE "Airplane";

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "BookingAddOn";

-- DropTable
DROP TABLE "BookingSegment";

-- DropTable
DROP TABLE "Cart";

-- DropTable
DROP TABLE "CartItem";

-- DropTable
DROP TABLE "Coupon";

-- DropTable
DROP TABLE "CouponUsage";

-- DropTable
DROP TABLE "Flight";

-- DropTable
DROP TABLE "FlightBooking";

-- DropTable
DROP TABLE "IdempotencyKey";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "RelatedTouristAttraction";

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "Room";

-- DropTable
DROP TABLE "Seat";

-- DropTable
DROP TABLE "TouristAttraction";

-- DropTable
DROP TABLE "TouristAttractionAmenity";

-- DropTable
DROP TABLE "TouristAttractionBooking";

-- DropTable
DROP TABLE "TouristAttractionReason";

-- DropTable
DROP TABLE "TouristAttractionTimeSlot";

-- DropTable
DROP TABLE "UnifiedBooking";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "WalletTransaction";

-- DropTable
DROP TABLE "attraction_reasons";

-- DropEnum
DROP TYPE "RoomType";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "address" TEXT,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImage" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "kycSubmittedAt" TIMESTAMP(3),
    "kycVerifiedAt" TIMESTAMP(3),
    "kycRejectedReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idType" "IDType" NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idExpiryDate" TIMESTAMP(3),
    "idFrontImageUrl" TEXT NOT NULL,
    "idBackImageUrl" TEXT,
    "selfieImageUrl" TEXT NOT NULL,
    "bvnEnc" TEXT,
    "ninEnc" TEXT,
    "passportNumber" TEXT,
    "passportExpiry" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNote" TEXT,
    "riskScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OTPType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorType" "VendorType" NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "businessPhone" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "yearEstablished" INTEGER,
    "description" TEXT,
    "registrationNumber" TEXT NOT NULL,
    "taxIdEnc" TEXT,
    "licenseNumber" TEXT,
    "businessRegDocUrl" TEXT,
    "ownerIdDocUrl" TEXT,
    "taxDocUrl" TEXT,
    "licenseDocUrl" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "payoutAccountName" TEXT,
    "payoutBankName" TEXT,
    "payoutAccountEnc" TEXT,
    "payoutProvider" TEXT,
    "payoutProviderId" TEXT,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "checkInTime" TEXT NOT NULL,
    "checkOutTime" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "googlePlaceId" TEXT,
    "coverImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalRooms" INTEGER NOT NULL DEFAULT 0,
    "amenities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_images" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "hotel_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_policies" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "cancellationPolicy" TEXT NOT NULL,
    "petPolicy" TEXT,
    "smokingPolicy" TEXT,
    "childPolicy" TEXT,
    "extraBedPolicy" TEXT,

    CONSTRAINT "hotel_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_operating_hours" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hotel_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_categories" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bedType" "BedType" NOT NULL,
    "maxOccupancy" INTEGER NOT NULL,
    "sizeSqm" DOUBLE PRECISION,
    "basePricePerNight" DECIMAL(12,2) NOT NULL,
    "discountPrice" DECIMAL(12,2),
    "amenities" TEXT[],
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "hotelId" TEXT,
    "roomCategoryId" TEXT,
    "type" "RoomTypeEnum" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "bedType" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'available',
    "amenities" TEXT[],
    "images" TEXT[],
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "hotelId" TEXT,
    "roomCategoryId" TEXT,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "actualCheckIn" TIMESTAMP(3),
    "actualCheckOut" TIMESTAMP(3),
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "depositAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "specialRequests" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "unifiedBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_stores" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_locations" (
    "id" TEXT NOT NULL,
    "carStoreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pickup_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_categories" (
    "id" TEXT NOT NULL,
    "carStoreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePerDay" DECIMAL(12,2) NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "car_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "carStoreId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "pickupLocationId" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "plateNumber" TEXT NOT NULL,
    "transmission" "Transmission" NOT NULL DEFAULT 'AUTOMATIC',
    "seats" INTEGER NOT NULL,
    "status" "CarStatus" NOT NULL DEFAULT 'AVAILABLE',
    "images" TEXT[],
    "features" TEXT[],
    "depositRequired" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_rentals" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "actualReturn" TIMESTAMP(3),
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "depositPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "unifiedBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_hours" (
    "id" TEXT NOT NULL,
    "carStoreId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "store_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airlines" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "status" "PlaneStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_maps" (
    "id" TEXT NOT NULL,
    "planeId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "class" "SeatClass" NOT NULL,
    "isWindow" BOOLEAN NOT NULL DEFAULT false,
    "isAisle" BOOLEAN NOT NULL DEFAULT false,
    "isExtraLeg" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seat_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flights" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "airlineId" TEXT,
    "planeId" TEXT,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "originCity" TEXT,
    "destinationCity" TEXT,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "price" DECIMAL(12,2) NOT NULL,
    "status" "FlightStatus" NOT NULL DEFAULT 'SCHEDULED',
    "gateNumber" TEXT,
    "terminal" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "delayReason" TEXT,
    "economyPrice" DECIMAL(12,2),
    "economySeats" INTEGER NOT NULL DEFAULT 0,
    "economySold" INTEGER NOT NULL DEFAULT 0,
    "businessPrice" DECIMAL(12,2),
    "businessSeats" INTEGER NOT NULL DEFAULT 0,
    "businessSold" INTEGER NOT NULL DEFAULT 0,
    "firstClassPrice" DECIMAL(12,2),
    "firstClassSeats" INTEGER NOT NULL DEFAULT 0,
    "firstClassSold" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(12,2) NOT NULL,
    "flightBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airplanes" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tailNumber" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "airline" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airplanes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flightId" TEXT,
    "totalPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "FlightBookingStatus" NOT NULL DEFAULT 'BOOKED',
    "qrCode" TEXT,
    "boardingPassUrl" TEXT,
    "unifiedBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_segments" (
    "id" TEXT NOT NULL,
    "flightBookingId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "seatMapId" TEXT,

    CONSTRAINT "booking_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "add_ons" (
    "id" TEXT NOT NULL,
    "flightId" TEXT,
    "type" "AddOnType" NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_add_ons" (
    "id" TEXT NOT NULL,
    "flightBookingId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "booking_add_ons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attraction_operators" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attraction_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourist_attractions" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT,
    "slug" TEXT,
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
    "averageDurationMinutes" INTEGER NOT NULL DEFAULT 120,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "dynamicPricing" BOOLEAN NOT NULL DEFAULT false,
    "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24,
    "refundPercentage" INTEGER NOT NULL DEFAULT 90,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "images" TEXT[],
    "openingHours" TEXT NOT NULL,
    "additionalInformation" TEXT,
    "included" TEXT[],
    "notIncluded" TEXT[],
    "whatToBring" TEXT[],
    "relatedAttractionIds" TEXT,
    "travelersPhotos" JSONB,
    "metadata" JSONB,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourist_attractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "related_tourist_attractions" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "relatedAttractionId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "travelTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "related_tourist_attractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourist_attraction_time_slots" (
    "id" TEXT NOT NULL,
    "attractionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "availableSpots" INTEGER NOT NULL DEFAULT 50,
    "maxSpots" INTEGER NOT NULL DEFAULT 50,
    "reservedSpots" INTEGER NOT NULL DEFAULT 0,
    "confirmedSpots" INTEGER NOT NULL DEFAULT 0,
    "priceMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "specialPrice" DECIMAL(12,2),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourist_attraction_time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourist_attraction_bookings" (
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

    CONSTRAINT "tourist_attraction_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourist_attraction_amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourist_attraction_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourist_attraction_reasons" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourist_attraction_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attraction_reason_mappings" (
    "id" TEXT NOT NULL,
    "attraction_id" TEXT NOT NULL,
    "reason_id" TEXT NOT NULL,

    CONSTRAINT "attraction_reason_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unified_bookings" (
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

    CONSTRAINT "unified_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
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

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
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

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
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
    "attractionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionId" TEXT,
    "reference" TEXT NOT NULL,
    "unifiedBookingId" TEXT,
    "bookingId" TEXT,
    "userId" TEXT,
    "gatewayResponse" JSONB,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAmount" DECIMAL(12,2),
    "refundedAt" TIMESTAMP(3),
    "refundReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "bookingId" TEXT,
    "unifiedBookingId" TEXT,
    "fundedBy" TEXT,
    "fundingReason" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "resourceId" TEXT,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'PENDING',
    "response" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
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

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unifiedBookingId" TEXT NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "unifiedBookingId" TEXT,
    "vendorId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "sentEmail" BOOLEAN NOT NULL DEFAULT false,
    "sentSMS" BOOLEAN NOT NULL DEFAULT false,
    "sentPush" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "actorIp" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB,
    "reason" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_kyc_userId_key" ON "user_kyc"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "otps_userId_type_idx" ON "otps"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_items_userId_serviceType_serviceId_key" ON "saved_items"("userId", "serviceType", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_userId_key" ON "vendors"("userId");

-- CreateIndex
CREATE INDEX "vendors_vendorType_status_idx" ON "vendors"("vendorType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_vendorId_key" ON "hotels"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_slug_key" ON "hotels"("slug");

-- CreateIndex
CREATE INDEX "hotels_city_country_idx" ON "hotels"("city", "country");

-- CreateIndex
CREATE INDEX "hotels_isActive_isApproved_idx" ON "hotels"("isActive", "isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_policies_hotelId_key" ON "hotel_policies"("hotelId");

-- CreateIndex
CREATE INDEX "room_categories_hotelId_isActive_idx" ON "room_categories"("hotelId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_roomNumber_key" ON "rooms"("roomNumber");

-- CreateIndex
CREATE INDEX "rooms_status_idx" ON "rooms"("status");

-- CreateIndex
CREATE INDEX "rooms_type_idx" ON "rooms"("type");

-- CreateIndex
CREATE INDEX "rooms_hotelId_idx" ON "rooms"("hotelId");

-- CreateIndex
CREATE INDEX "rooms_deletedAt_idx" ON "rooms"("deletedAt");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_hotelId_idx" ON "bookings"("hotelId");

-- CreateIndex
CREATE INDEX "bookings_roomId_checkInDate_checkOutDate_idx" ON "bookings"("roomId", "checkInDate", "checkOutDate");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_unifiedBookingId_idx" ON "bookings"("unifiedBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "car_stores_vendorId_key" ON "car_stores"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "cars_plateNumber_key" ON "cars"("plateNumber");

-- CreateIndex
CREATE INDEX "car_rentals_carId_idx" ON "car_rentals"("carId");

-- CreateIndex
CREATE INDEX "car_rentals_userId_idx" ON "car_rentals"("userId");

-- CreateIndex
CREATE INDEX "car_rentals_unifiedBookingId_idx" ON "car_rentals"("unifiedBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "airlines_vendorId_key" ON "airlines"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "airlines_iataCode_key" ON "airlines"("iataCode");

-- CreateIndex
CREATE UNIQUE INDEX "planes_registration_key" ON "planes"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "seat_maps_planeId_seatNumber_key" ON "seat_maps"("planeId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "flights_flightNumber_key" ON "flights"("flightNumber");

-- CreateIndex
CREATE INDEX "flights_departureAirport_arrivalAirport_idx" ON "flights"("departureAirport", "arrivalAirport");

-- CreateIndex
CREATE INDEX "flights_departureTime_status_idx" ON "flights"("departureTime", "status");

-- CreateIndex
CREATE INDEX "flights_deletedAt_idx" ON "flights"("deletedAt");

-- CreateIndex
CREATE INDEX "seats_flightId_isAvailable_idx" ON "seats"("flightId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "seats_flightId_seatNumber_key" ON "seats"("flightId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "airplanes_tailNumber_key" ON "airplanes"("tailNumber");

-- CreateIndex
CREATE INDEX "flight_bookings_userId_idx" ON "flight_bookings"("userId");

-- CreateIndex
CREATE INDEX "flight_bookings_status_idx" ON "flight_bookings"("status");

-- CreateIndex
CREATE INDEX "flight_bookings_unifiedBookingId_idx" ON "flight_bookings"("unifiedBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_segments_flightBookingId_flightId_seatId_key" ON "booking_segments"("flightBookingId", "flightId", "seatId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_add_ons_flightBookingId_addOnId_key" ON "booking_add_ons"("flightBookingId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "attraction_operators_vendorId_key" ON "attraction_operators"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "tourist_attractions_slug_key" ON "tourist_attractions"("slug");

-- CreateIndex
CREATE INDEX "tourist_attractions_city_country_idx" ON "tourist_attractions"("city", "country");

-- CreateIndex
CREATE INDEX "tourist_attractions_category_idx" ON "tourist_attractions"("category");

-- CreateIndex
CREATE INDEX "tourist_attractions_isActive_idx" ON "tourist_attractions"("isActive");

-- CreateIndex
CREATE INDEX "tourist_attractions_deletedAt_idx" ON "tourist_attractions"("deletedAt");

-- CreateIndex
CREATE INDEX "related_tourist_attractions_attractionId_idx" ON "related_tourist_attractions"("attractionId");

-- CreateIndex
CREATE INDEX "related_tourist_attractions_relatedAttractionId_idx" ON "related_tourist_attractions"("relatedAttractionId");

-- CreateIndex
CREATE UNIQUE INDEX "related_tourist_attractions_attractionId_relatedAttractionI_key" ON "related_tourist_attractions"("attractionId", "relatedAttractionId");

-- CreateIndex
CREATE INDEX "tourist_attraction_time_slots_attractionId_date_isBlocked_idx" ON "tourist_attraction_time_slots"("attractionId", "date", "isBlocked");

-- CreateIndex
CREATE INDEX "tourist_attraction_time_slots_date_availableSpots_idx" ON "tourist_attraction_time_slots"("date", "availableSpots");

-- CreateIndex
CREATE UNIQUE INDEX "tourist_attraction_time_slots_attractionId_date_startTime_key" ON "tourist_attraction_time_slots"("attractionId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "tourist_attraction_bookings_ticketNumber_key" ON "tourist_attraction_bookings"("ticketNumber");

-- CreateIndex
CREATE INDEX "tourist_attraction_bookings_unifiedBookingId_idx" ON "tourist_attraction_bookings"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "tourist_attraction_bookings_timeSlotId_status_idx" ON "tourist_attraction_bookings"("timeSlotId", "status");

-- CreateIndex
CREATE INDEX "tourist_attraction_bookings_ticketNumber_idx" ON "tourist_attraction_bookings"("ticketNumber");

-- CreateIndex
CREATE INDEX "tourist_attraction_bookings_attractionId_status_idx" ON "tourist_attraction_bookings"("attractionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tourist_attraction_amenities_name_key" ON "tourist_attraction_amenities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attraction_reason_mappings_attraction_id_reason_id_key" ON "attraction_reason_mappings"("attraction_id", "reason_id");

-- CreateIndex
CREATE UNIQUE INDEX "unified_bookings_referenceCode_key" ON "unified_bookings"("referenceCode");

-- CreateIndex
CREATE INDEX "unified_bookings_userId_bookingStatus_idx" ON "unified_bookings"("userId", "bookingStatus");

-- CreateIndex
CREATE INDEX "unified_bookings_serviceType_serviceStartDate_idx" ON "unified_bookings"("serviceType", "serviceStartDate");

-- CreateIndex
CREATE INDEX "unified_bookings_bundleId_idx" ON "unified_bookings"("bundleId");

-- CreateIndex
CREATE INDEX "unified_bookings_referenceCode_idx" ON "unified_bookings"("referenceCode");

-- CreateIndex
CREATE INDEX "unified_bookings_bookingStatus_paymentStatus_idx" ON "unified_bookings"("bookingStatus", "paymentStatus");

-- CreateIndex
CREATE INDEX "unified_bookings_cancellationDeadline_idx" ON "unified_bookings"("cancellationDeadline");

-- CreateIndex
CREATE INDEX "unified_bookings_serviceStartDate_bookingStatus_idx" ON "unified_bookings"("serviceStartDate", "bookingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "carts"("userId");

-- CreateIndex
CREATE INDEX "carts_userId_status_idx" ON "carts"("userId", "status");

-- CreateIndex
CREATE INDEX "carts_expiresAt_idx" ON "carts"("expiresAt");

-- CreateIndex
CREATE INDEX "carts_status_abandonedAt_idx" ON "carts"("status", "abandonedAt");

-- CreateIndex
CREATE INDEX "cart_items_inventoryHoldExpiresAt_idx" ON "cart_items"("inventoryHoldExpiresAt");

-- CreateIndex
CREATE INDEX "cart_items_serviceType_serviceId_idx" ON "cart_items"("serviceType", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_serviceType_serviceId_key" ON "cart_items"("cartId", "serviceType", "serviceId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_serviceType_serviceId_idx" ON "reviews"("serviceType", "serviceId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_isPublished_createdAt_idx" ON "reviews"("isPublished", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_unifiedBookingId_serviceType_key" ON "reviews"("unifiedBookingId", "serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "payments_unifiedBookingId_idx" ON "payments"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_reference_idx" ON "payments"("reference");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_reference_key" ON "wallet_transactions"("reference");

-- CreateIndex
CREATE INDEX "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_idx" ON "wallet_transactions"("reference");

-- CreateIndex
CREATE INDEX "wallet_transactions_unifiedBookingId_idx" ON "wallet_transactions"("unifiedBookingId");

-- CreateIndex
CREATE INDEX "wallet_transactions_createdAt_idx" ON "wallet_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_status_idx" ON "idempotency_keys"("key", "status");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_isActive_idx" ON "coupons"("code", "isActive");

-- CreateIndex
CREATE INDEX "coupons_validFrom_validUntil_idx" ON "coupons"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_couponId_userId_unifiedBookingId_key" ON "coupon_usages"("couponId", "userId", "unifiedBookingId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "user_kyc" ADD CONSTRAINT "user_kyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_policies" ADD CONSTRAINT "hotel_policies_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_operating_hours" ADD CONSTRAINT "hotel_operating_hours_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_categories" ADD CONSTRAINT "room_categories_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomCategoryId_fkey" FOREIGN KEY ("roomCategoryId") REFERENCES "room_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_roomCategoryId_fkey" FOREIGN KEY ("roomCategoryId") REFERENCES "room_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_stores" ADD CONSTRAINT "car_stores_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_locations" ADD CONSTRAINT "pickup_locations_carStoreId_fkey" FOREIGN KEY ("carStoreId") REFERENCES "car_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_categories" ADD CONSTRAINT "car_categories_carStoreId_fkey" FOREIGN KEY ("carStoreId") REFERENCES "car_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_carStoreId_fkey" FOREIGN KEY ("carStoreId") REFERENCES "car_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "car_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "pickup_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_rentals" ADD CONSTRAINT "car_rentals_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_rentals" ADD CONSTRAINT "car_rentals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_rentals" ADD CONSTRAINT "car_rentals_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_carStoreId_fkey" FOREIGN KEY ("carStoreId") REFERENCES "car_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "airlines" ADD CONSTRAINT "airlines_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes" ADD CONSTRAINT "planes_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "airlines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_maps" ADD CONSTRAINT "seat_maps_planeId_fkey" FOREIGN KEY ("planeId") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "airlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_planeId_fkey" FOREIGN KEY ("planeId") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_segments" ADD CONSTRAINT "booking_segments_seatMapId_fkey" FOREIGN KEY ("seatMapId") REFERENCES "seat_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "add_ons" ADD CONSTRAINT "add_ons_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "flight_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "add_ons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_operators" ADD CONSTRAINT "attraction_operators_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourist_attractions" ADD CONSTRAINT "tourist_attractions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "attraction_operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_tourist_attractions" ADD CONSTRAINT "related_tourist_attractions_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_tourist_attractions" ADD CONSTRAINT "related_tourist_attractions_relatedAttractionId_fkey" FOREIGN KEY ("relatedAttractionId") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourist_attraction_time_slots" ADD CONSTRAINT "tourist_attraction_time_slots_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourist_attraction_bookings" ADD CONSTRAINT "tourist_attraction_bookings_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourist_attraction_bookings" ADD CONSTRAINT "tourist_attraction_bookings_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tourist_attraction_bookings" ADD CONSTRAINT "tourist_attraction_bookings_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "tourist_attraction_time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_photos" ADD CONSTRAINT "traveler_photos_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_photos" ADD CONSTRAINT "traveler_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_amenities" ADD CONSTRAINT "attraction_amenities_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_amenities" ADD CONSTRAINT "attraction_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "tourist_attraction_amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_reason_mappings" ADD CONSTRAINT "attraction_reason_mappings_attraction_id_fkey" FOREIGN KEY ("attraction_id") REFERENCES "tourist_attractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attraction_reason_mappings" ADD CONSTRAINT "attraction_reason_mappings_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "tourist_attraction_reasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unified_bookings" ADD CONSTRAINT "unified_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "tourist_attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_unifiedBookingId_fkey" FOREIGN KEY ("unifiedBookingId") REFERENCES "unified_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
