import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "Iniciando la creación/actualización del código 'OVERCOMING10'..."
  );

  const code = "OVERCOMING10";
  const overridePrice = 8910;
  const durationMonths = 3;
  const maxUses = 100;

  const validFrom = new Date("2025-10-31T00:00:00.000-03:00");
  const validUntil = new Date("2026-12-31T23:59:59.999-03:00");

  await prisma.discountCode.upsert({
    where: { code: code },
    update: {
      overridePrice: overridePrice,
      durationMonths: durationMonths,
      validFrom: validFrom,
      validUntil: validUntil,
      maxUses: maxUses,
      timesUsed: 0,
    },
    create: {
      code: code,
      overridePrice: overridePrice,
      durationMonths: durationMonths,
      validFrom: validFrom,
      validUntil: validUntil,
      maxUses: maxUses,
      timesUsed: 0,
    },
  });

  console.log(`¡Éxito! El código de descuento "${code}" ha sido configurado.`);
  console.log(`  -> Precio: $${overridePrice} ARS (10% OFF)`);
  console.log(`  -> Usos máximos: ${maxUses}`);
  console.log(`  -> Válido desde: ${validFrom.toLocaleDateString("es-AR")}`);
  console.log(`  -> Válido hasta: ${validUntil.toLocaleDateString("es-AR")}`);
}

main()
  .catch((e) => {
    console.error("Hubo un error al configurar el código de descuento:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
