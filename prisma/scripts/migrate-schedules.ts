// prisma/scripts/migrate-schedules.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migración de horarios...");

  // 1. Encontrar todos los horarios que tienen el formato antiguo (startTime no es null)
  const legacySchedules = await prisma.workingHours.findMany({
    where: {
      startTime: {
        not: null,
      },
      endTime: {
        not: null,
      },
    },
  });

  if (legacySchedules.length === 0) {
    console.log(
      "✅ No se encontraron horarios con el formato antiguo para migrar. Todo en orden."
    );
    return;
  }

  console.log(
    `⏳ Encontrados ${legacySchedules.length} registros para migrar.`
  );

  // 2. Crear un nuevo WorkScheduleBlock para cada horario antiguo
  const migrationOperations = legacySchedules
    .map((schedule) => {
      // Aseguramos que startTime y endTime no sean null para TypeScript
      if (schedule.startTime && schedule.endTime) {
        // Devolvemos la OPERACIÓN de Prisma, no la ejecutamos aún
        return prisma.workScheduleBlock.create({
          data: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            workingHoursId: schedule.id,
          },
        });
      }
      return null; // Devolvemos null para los casos que no aplican
    })
    .filter(Boolean); // <-- CAMBIO CLAVE: Filtramos los valores null del array

  try {
    // 3. Ejecutar todas las creaciones en una transacción para seguridad
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
    // 4. Asegurarse de que el cliente de Prisma se desconecte
    await prisma.$disconnect();
  });
