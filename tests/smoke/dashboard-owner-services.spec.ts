import { test, expect } from "../fixtures/test-session";
import { smoke } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";

test.describe("Dashboard Services - Owner", () => {
  test(`${smoke} owner can create a service for a team barber`, async ({
    page,
    loginAsScenario,
  }) => {
    const authData = await loginAsScenario("owner-with-team");

    await page.goto("/dashboard/services");
    await expect(page.getByText("Mis Servicios")).toBeVisible();
    await dismissWhatsNewDialog(page);

    await page.getByRole("button", { name: "Crear Servicio" }).first().click();
    await expect(page.getByRole("heading", { name: "Crear Nuevo Servicio" })).toBeVisible();

    const teamBarberName = authData.teamMember?.name;
    if (!teamBarberName) {
      test.fail(true, "No se recibió teamMember en el setup de prueba.");
      return;
    }

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: teamBarberName }).click();

    const serviceName = `Servicio E2E Team ${Date.now()}`;
    await page.getByLabel("Nombre del servicio").fill(serviceName);
    await page.getByLabel("Precio").fill("12500");
    await page.getByLabel("Duración (opcional)").fill("45");
    await page.getByRole("button", { name: "Crear Servicio" }).last().click();

    await expect(page.getByText("¡Servicio creado!")).toBeVisible();

    await expect(page.getByRole("heading", { name: serviceName })).toBeVisible();
  });
});
