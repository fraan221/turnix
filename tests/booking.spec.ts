import { test, expect } from "@playwright/test";

const getNextWednesday = () => {
  const date = new Date();
  date.setDate(date.getDate() + ((3 - date.getDay() + 7) % 7));
  return date;
};

test.describe("Booking Flow", () => {
  test("a customer can book an appointment", async ({ page }) => {
    await page.goto("/test-barber");
    await page.waitForURL("**/test-barber");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText("Nuestros Servicios", { exact: true })
    ).toBeVisible();

    await page.getByText("Standard Haircut").click();

    const dayButtonsLocator = page.locator("button:not([disabled])");
    const texts = await dayButtonsLocator.allInnerTexts();
    let found = false;
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || !/^[0-9]+$/.test(text.trim())) continue;
      const btn = dayButtonsLocator.nth(i);
      await btn.click();
      await page.waitForTimeout(500);
      const noHorarios = await page
        .locator("text=No hay horarios disponibles para este día.")
        .isVisible();
      const noTrabaja = await page
        .locator("text=El barbero no trabaja en el día seleccionado.")
        .isVisible();
      if (!noHorarios && !noTrabaja) {
        found = true;
        await page.waitForResponse(
          (response) =>
            response.url().includes("actions/public.actions") &&
            response.status() === 200
        );
        break;
      }
    }
    if (!found) {
      test.skip(
        true,
        "No se encontró ningún día con horarios disponibles. Test skipped."
      );
    }

    const primerHorario = page
      .getByRole("button", { name: /\d{2}:\d{2}/ })
      .first();
    await expect(primerHorario).toBeVisible();
    await primerHorario.click();

    await page.getByLabel("Nombre y Apellido").fill("Cliente de Prueba E2E");
    await page.getByLabel("Número de WhatsApp").fill("1122334455");
    await page.getByRole("button", { name: "Confirmar Reserva" }).click();

    await expect(page).toHaveURL("/booking-confirmed", { timeout: 10000 });
    await expect(
      page.getByText("¡Turno Confirmado!", { exact: true })
    ).toBeVisible();
  });
});
