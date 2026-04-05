import { test, expect } from "../fixtures/test-session";
import { smoke } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";

test.describe("Dashboard Services - Barber", () => {
  test(`${smoke} barber sees own service list without team assignment selector`, async ({
    page,
    loginAsScenario,
  }) => {
    const authData = await loginAsScenario("barber-with-team");

    await page.goto("/dashboard/services");
    await expect(page.getByText("Mis Servicios")).toBeVisible();

    const teamServiceName = authData.teamMember?.service.name;
    if (!teamServiceName) {
      test.fail(true, "No se recibió teamMember.service en el setup de prueba.");
      return;
    }

    await expect(page.getByRole("heading", { name: teamServiceName })).toBeVisible();

    await dismissWhatsNewDialog(page);

    await page.getByRole("button", { name: "Crear Servicio" }).first().click();
    await expect(page.getByText("Crear Nuevo Servicio", { exact: true })).toBeVisible();

    await expect(page.getByLabel("Asignar a")).toHaveCount(0);

    await page.getByRole("button", { name: "Close" }).last().click();
  });
});
