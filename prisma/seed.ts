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
  await prisma.team.deleteMany({});
  await prisma.barbershop.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Cleaned database.");

  const adminPassword = await bcrypt.hash("Fdhdrhch234!", 10);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const adminBarbershop = await prisma.barbershop.create({
    data: {
      name: "Admin's Cuts",
      slug: "admin-cuts",
      teamsEnabled: true,
      owner: {
        create: {
          name: "Admin User",
          email: "admin@admin.com",
          password: adminPassword,
          role: Role.OWNER,
          onboardingCompleted: true,
          trialEndsAt: trialEndsAt,
        },
      },
    },
    include: {
      owner: true,
    },
  });
  console.log(
    `✅ Created barbershop: ${adminBarbershop.name} with owner ${adminBarbershop.owner.name}`
  );

  const employeePassword = await bcrypt.hash("password123", 10);
  const employeeUser = await prisma.user.create({
    data: {
      name: "Empleado Prueba",
      email: "empleado@test.com",
      password: employeePassword,
      role: Role.BARBER,
      onboardingCompleted: true,
    },
  });
  console.log(`✅ Created employee user: ${employeeUser.name}`);

  await prisma.team.create({
    data: {
      barbershopId: adminBarbershop.id,
      userId: employeeUser.id,
    },
  });
  console.log(
    `✅ Linked ${employeeUser.name} to ${adminBarbershop.name}'s team.`
  );

  await prisma.service.create({
    data: {
      name: "Corte de Admin",
      price: 5000,
      durationInMinutes: 45,
      barberId: adminBarbershop.ownerId,
      barbershopId: adminBarbershop.id,
    },
  });
  await prisma.service.create({
    data: {
      name: "Corte de Empleado",
      price: 4500,
      durationInMinutes: 45,
      barberId: employeeUser.id,
      barbershopId: adminBarbershop.id,
    },
  });
  console.log(`✅ Created services for Admin and Employee.`);

  await prisma.workingHours.createMany({
    data: [
      {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "20:00",
        isWorking: true,
        barberId: adminBarbershop.ownerId,
      },
      {
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "20:00",
        isWorking: true,
        barberId: adminBarbershop.ownerId,
      },
      {
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "20:00",
        isWorking: true,
        barberId: adminBarbershop.ownerId,
      },
      {
        dayOfWeek: 4,
        startTime: "09:00",
        endTime: "20:00",
        isWorking: true,
        barberId: adminBarbershop.ownerId,
      },
      {
        dayOfWeek: 5,
        startTime: "10:00",
        endTime: "21:00",
        isWorking: true,
        barberId: adminBarbershop.ownerId,
      },
      {
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "21:00",
        isWorking: true,
        barberId: adminBarbershop.ownerId,
      },
      {
        dayOfWeek: 0,
        isWorking: false,
        startTime: "00:00",
        endTime: "00:00",
        barberId: adminBarbershop.ownerId,
      },
    ],
  });
  console.log(`✅ Created working hours for ${adminBarbershop.name}.`);

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
