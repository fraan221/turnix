import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  await prisma.booking.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.workingHours.deleteMany({});
  await prisma.timeBlock.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.barbershop.deleteMany({});

  console.log("Cleaned database.");

  const barbershop = await prisma.barbershop.create({
    data: {
      name: "Test Barber Shop",
      slug: "test-barber",
      owner: {
        create: {
          name: "Test Barber",
          email: "test@barber.com",
          password: await bcrypt.hash("password123", 10),
          role: Role.OWNER,
          onboardingCompleted: true,
        },
      },
    },
    include: {
      owner: true,
    },
  });

  console.log(
    `Created barbershop: ${barbershop.name} with owner ${barbershop.owner.name}`
  );

  const barberUser = barbershop.owner;

  await prisma.user.update({
    where: { id: barberUser.id },
    data: {
      barbershopId: barbershop.id,
    },
  });

  console.log(
    `Associated barber ${barberUser.name} with barbershop ${barbershop.name}`
  );

  const service = await prisma.service.create({
    data: {
      name: "Standard Haircut",
      price: 30,
      durationInMinutes: 30,
      description: "A classic haircut.",
      barberId: barberUser.id,
      barbershopId: barbershop.id,
    },
  });

  console.log(`Created service: ${service.name}`);

  const today = new Date();
  const nextWednesday = new Date(today);
  nextWednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7));

  const dayOfWeek = nextWednesday.getDay();

  const workingHours = await prisma.workingHours.create({
    data: {
      dayOfWeek: dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      isWorking: true,
      barberId: barberUser.id,
    },
  });

  console.log(
    `Created working hours for day ${workingHours.dayOfWeek} (Wednesday)`
  );

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
