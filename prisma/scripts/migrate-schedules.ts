import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migración de horarios...");

  const legacySchedules = await prisma.workingHours.findMany({
    where: {
      startTime: {
        not: null,
      },
      endTime: {
        not: null,
      },
      blocks: {
        none: {},
      },
    },
  });

  if (legacySchedules.length === 0) {
    console.log(
      "✅ No se encontraron horarios pendientes de migración. Todo en orden."
    );
    return;
  }

  console.log(
    `⏳ Encontrados ${legacySchedules.length} registros para migrar.`
  );

  const migrationOperations = legacySchedules
    .map((schedule) => {
      if (schedule.startTime && schedule.endTime) {
        return prisma.workScheduleBlock.create({
          data: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            workingHoursId: schedule.id,
            type: "MORNING",
          },
        });
      }
      return null;
    })
    .filter(Boolean);

  try {
    await prisma.$transaction(migrationOperations as any);
    console.log("✅ ¡Migración completada con éxito!");
    console.log(
      `✨ ${legacySchedules.length} horarios han sido transferidos al nuevo formato de bloques.`
    );
  } catch (error) {
    console.error("❌ Error durante la transacción de la migración:", error);
    console.log("No se realizaron cambios en la base de datos.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Ocurrió un error al ejecutar el script de migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
