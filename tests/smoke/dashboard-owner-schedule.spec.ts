import { test, expect } from "../fixtures/test-session";
import { smoke } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";

test.describe("Dashboard Schedule - Owner", () => {
  test(`${smoke} owner can edit a team member schedule block`, async ({
    page,
    loginAsScenario,
  }) => {
    const authData = await loginAsScenario("owner-with-team");

    const teamMemberId = authData.teamMember?.id;
    if (!teamMemberId) {
      test.fail(true, "No se recibió teamMember en el setup de prueba.");
      return;
    }

    await page.goto(`/dashboard/schedule?barberId=${teamMemberId}`);
    await expect(page.getByText("Bloqueos de Horario")).toBeVisible();

    await dismissWhatsNewDialog(page);

    const teamBlockReason = /Bloqueo team e2e/;
    await expect(page.getByText(teamBlockReason).first()).toBeVisible();

    await page
      .locator('a[href*="/dashboard/schedule/"][href*="/edit"]')
      .first()
      .click();

    await expect(page.getByRole("heading", { name: "Editar Bloqueo" })).toBeVisible();

    const reasonInput = page.getByLabel(/Razón del bloqueo/i);
    await reasonInput.fill(`Bloqueo editado owner ${Date.now()}`);

    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Bloqueo actualizado")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/dashboard/schedule\\?barberId=${teamMemberId}`));
  });
});
