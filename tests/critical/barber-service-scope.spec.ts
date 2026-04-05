import { test, expect } from "../fixtures/test-session";
import { critical } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";

test.describe("Critical - Barber service scope", () => {
  test(`${critical} barber cannot choose assignment target when creating services`, async ({
    page,
    loginAsScenario,
  }) => {
    await loginAsScenario("barber-with-team");

    await page.goto("/dashboard/services");

    await dismissWhatsNewDialog(page);

    await page.getByRole("button", { name: "Crear Servicio" }).first().click();

    await expect(page.getByText("Crear Nuevo Servicio", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Asignar a")).toHaveCount(0);

    const serviceName = `Barber Scoped ${Date.now()}`;
    await page.getByLabel("Nombre del servicio").fill(serviceName);
    await page.getByLabel("Precio").fill("9900");
    await page.getByLabel("Duración (opcional)").fill("35");
    await page.getByRole("button", { name: "Crear Servicio" }).last().click();

    await expect(page.getByText("¡Servicio creado!")).toBeVisible();
    await expect(page.getByRole("heading", { name: serviceName })).toBeVisible();
  });
});
