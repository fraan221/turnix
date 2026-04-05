import { test, expect } from "../fixtures/test-session";
import { critical } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";

test.describe("Critical - Owner service assignment", () => {
  test(`${critical} owner can create one service for self and one for team member`, async ({
    page,
    loginAsScenario,
  }) => {
    const authData = await loginAsScenario("owner-with-team");
    const teamMemberName = authData.teamMember?.name;
    if (!teamMemberName) {
      test.fail(true, "No se recibió teamMember.name en el setup de prueba.");
      return;
    }

    await page.goto("/dashboard/services");

    await dismissWhatsNewDialog(page);

    const ownerServiceName = `Owner Critical ${Date.now()}`;
    await page.getByRole("button", { name: "Crear Servicio" }).first().click();
    await page.getByLabel("Nombre del servicio").fill(ownerServiceName);
    await page.getByLabel("Precio").fill("11000");
    await page.getByLabel("Duración (opcional)").fill("30");
    await page.getByRole("button", { name: "Crear Servicio" }).last().click();
    await expect(page.getByText("¡Servicio creado!")).toBeVisible();

    await dismissWhatsNewDialog(page);

    const teamServiceName = `Team Critical ${Date.now()}`;
    await page.getByRole("button", { name: "Crear Servicio" }).first().click();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: teamMemberName }).click();
    await page.getByLabel("Nombre del servicio").fill(teamServiceName);
    await page.getByLabel("Precio").fill("12000");
    await page.getByLabel("Duración (opcional)").fill("45");
    await page.getByRole("button", { name: "Crear Servicio" }).last().click();
    await expect(page.getByText("¡Servicio creado!")).toBeVisible();

    await expect(page.getByRole("heading", { name: ownerServiceName })).toBeVisible();
    await expect(page.getByRole("heading", { name: teamServiceName })).toBeVisible();
  });
});
