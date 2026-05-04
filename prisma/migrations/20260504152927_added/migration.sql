/*
  Warnings:

  - You are about to drop the column `seatId` on the `FlightBooking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[flightId,seatNumber]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AddOnType" AS ENUM ('BAGGAGE', 'MEAL', 'WIFI', 'PRIORITY_BOARDING');

-- DropForeignKey
ALTER TABLE "FlightBooking" DROP CONSTRAINT "FlightBooking_flightId_fkey";

-- DropForeignKey
ALTER TABLE "FlightBooking" DROP CONSTRAINT "FlightBooking_seatId_fkey";

-- DropIndex
DROP INDEX "FlightBooking_seatId_key";

-- AlterTable
ALTER TABLE "FlightBooking" DROP COLUMN "seatId",
ADD COLUMN     "boardingPassUrl" TEXT,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "totalPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "flightId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Seat" ADD COLUMN     "flightBookingId" TEXT;

-- CreateTable
CREATE TABLE "BookingSegment" (
    "id" TEXT NOT NULL,
    "flightBookingId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,

    CONSTRAINT "BookingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddOn" (
    "id" TEXT NOT NULL,
    "flightBookingId" TEXT NOT NULL,
    "addOnId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL,
    "type" "AddOnType" NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_flightId_seatNumber_key" ON "Seat"("flightId", "seatNumber");

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "FlightBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "FlightBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSegment" ADD CONSTRAINT "BookingSegment_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_flightBookingId_fkey" FOREIGN KEY ("flightBookingId") REFERENCES "FlightBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
