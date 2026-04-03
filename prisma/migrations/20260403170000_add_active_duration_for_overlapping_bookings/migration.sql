ALTER TABLE "Service"
ADD COLUMN "activeDurationInMinutes" INTEGER;

ALTER TABLE "Booking"
ADD COLUMN "activeDurationAtBooking" INTEGER;
