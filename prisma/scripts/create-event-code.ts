import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando la creación/actualización del código de descuento...");

  const code = "COLORESLOKOS3";

  const validFrom = new Date("2025-10-05T00:00:00.000-03:00");
  const validUntil = new Date("2025-10-12T23:59:59.999-03:00");

  await prisma.discountCode.upsert({
    where: { code: code },
    update: {
      validFrom: validFrom,
      validUntil: validUntil,
      timesUsed: 0,
      maxUses: 50,
      overridePrice: 7900,
      durationMonths: 3,
    },
    create: {
      code: code,
      overridePrice: 7900,
      durationMonths: 3,
      validFrom: validFrom,
      validUntil: validUntil,
      maxUses: 50,
      timesUsed: 0,
    },
  });

  console.log(
    `¡Éxito! El código de descuento "${code}" ha sido configurado para ser válido desde el 5/10 hasta el 12/10.`
  );
}

main()
  .catch((e) => {
    console.error("Hubo un error al configurar el código de descuento:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
