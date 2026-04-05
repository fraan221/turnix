import { test, expect } from "@playwright/test";
import { smoke, critical } from "./utils/tags";

test.describe("Booking Flow", () => {
  test(`${smoke} ${critical} a customer can book an appointment`, async ({ page }) => {
    const setupResponse = await page.request.post("/api/test/login", {
      data: { scenario: "owner" },
    });
    expect(setupResponse.ok()).toBeTruthy();
    const setupData = (await setupResponse.json()) as {
      barbershop?: { slug: string };
    };

    const publicSlug = setupData.barbershop?.slug;
    if (!publicSlug) {
      test.fail(true, "No se recibió un slug público de prueba.");
      return;
    }

    await page.goto(`/${publicSlug}`);
    await page.waitForURL(`**/${publicSlug}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("tab", { name: "Reservas" })).toBeVisible();

    const firstServiceCard = page.getByRole("radio", {
      name: /Servicio Owner/,
    });
    await expect(firstServiceCard).toBeVisible();
    await firstServiceCard.click();

    const dayButtonsLocator = page.locator("button:not([disabled])");
    const texts = await dayButtonsLocator.allInnerTexts();
    let found = false;
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || !/^[0-9]+$/.test(text.trim())) continue;
      const btn = dayButtonsLocator.nth(i);
      await btn.click();
      const noHorarios = await page
        .getByText("No hay horarios disponibles para este día.")
        .isVisible();
      const noTrabaja = await page
        .getByText("El barbero no trabaja en el día seleccionado.")
        .isVisible();
      if (!noHorarios && !noTrabaja) {
        found = true;
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
    await page.getByLabel("Número de Celular").fill("1122334455");
    await page.getByRole("button", { name: "Confirmar reserva" }).click();

    await expect(page).toHaveURL("/booking-confirmed", { timeout: 10000 });
    await expect(
      page.getByText("¡Turno Confirmado!", { exact: true })
    ).toBeVisible();
  });
});
