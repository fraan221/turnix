import { test, expect } from "../fixtures/test-session";
import { critical } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";
import prisma from "../../lib/prisma";

test.describe("Critical - Payment Method Flow", () => {
  const createdClientIds: string[] = [];
  const createdBookingIds: string[] = [];

  test.afterAll(async () => {
    if (createdBookingIds.length > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
    }
    if (createdClientIds.length > 0) {
      await prisma.client.deleteMany({ where: { id: { in: createdClientIds } } });
    }
  });

  test(`${critical} completes booking with payment method`, async ({ page, loginAsScenario }) => {
    const authData = await loginAsScenario("owner");
    
    const client = await prisma.client.create({
      data: {
        name: `Test Client A ${Date.now()}`,
        phone: `11${Date.now().toString().slice(-8)}`,
        barbershopId: authData.barbershop!.id,
      }
    });
    createdClientIds.push(client.id);

    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    const booking = await prisma.booking.create({
      data: {
        startTime: pastDate,
        durationAtBooking: 30,
        status: "SCHEDULED",
        clientId: client.id,
        barberId: authData.user!.id,
        barbershopId: authData.barbershop!.id,
      }
    });
    createdBookingIds.push(booking.id);

    await page.goto("/dashboard");
    await dismissWhatsNewDialog(page);

    await page.getByText(client.name).first().click();

    await page.getByRole("button", { name: "Marcar como Completado" }).click();
    await page.getByRole("button", { name: "Efectivo" }).click();
    
    await expect(page.getByText("¡Éxito!")).toBeVisible();
    await page.getByRole("button", { name: "Omitir" }).click();
    
    const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking?.status).toBe("COMPLETED");
    expect(updatedBooking?.paymentMethod).toBe("CASH");
  });

  test(`${critical} allows retroactive payment method assignment`, async ({ page, loginAsScenario }) => {
    const authData = await loginAsScenario("owner");
    
    const client = await prisma.client.create({
      data: {
        name: `Test Client B ${Date.now()}`,
        phone: `12${Date.now().toString().slice(-8)}`,
        barbershopId: authData.barbershop!.id,
      }
    });
    createdClientIds.push(client.id);

    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    const booking = await prisma.booking.create({
      data: {
        startTime: pastDate,
        durationAtBooking: 30,
        status: "COMPLETED",
        clientId: client.id,
        barberId: authData.user!.id,
        barbershopId: authData.barbershop!.id,
        paymentMethod: null,
      }
    });
    createdBookingIds.push(booking.id);

    await page.goto("/dashboard");
    await dismissWhatsNewDialog(page);

    await page.getByText(client.name).first().click();

    await expect(page.getByText("Falta registrar el método de cobro")).toBeVisible();
    
    await page.getByRole("button", { name: "Transf." }).click();
    
    await expect(page.getByText("Método de pago registrado con éxito.")).toBeVisible();
    
    const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking?.paymentMethod).toBe("TRANSFER");
  });

  test(`${critical} reflects payment method in analytics`, async ({ page, loginAsScenario }) => {
    const authData = await loginAsScenario("owner");
    
    const client = await prisma.client.create({
      data: {
        name: `Test Client C ${Date.now()}`,
        phone: `13${Date.now().toString().slice(-8)}`,
        barbershopId: authData.barbershop!.id,
      }
    });
    createdClientIds.push(client.id);

    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    const booking = await prisma.booking.create({
      data: {
        startTime: pastDate,
        durationAtBooking: 30,
        status: "COMPLETED",
        clientId: client.id,
        barberId: authData.user!.id,
        barbershopId: authData.barbershop!.id,
        paymentMethod: "CARD",
      }
    });
    createdBookingIds.push(booking.id);

    await page.goto("/dashboard/analytics");
    await dismissWhatsNewDialog(page);
    
    await expect(page.getByRole("heading", { name: "Métodos de cobro" })).toBeVisible();
    await expect(page.getByText("Tarjeta")).toBeVisible();
  });
});
