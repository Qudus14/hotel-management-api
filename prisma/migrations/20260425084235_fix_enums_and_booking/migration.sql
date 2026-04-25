-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'checked_in';
ALTER TYPE "BookingStatus" ADD VALUE 'checked_out';
ALTER TYPE "BookingStatus" ADD VALUE 'no_show';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "walletBalance" SET DEFAULT 0;
