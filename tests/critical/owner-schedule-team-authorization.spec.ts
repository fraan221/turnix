import { test, expect } from "../fixtures/test-session";
import { critical } from "../utils/tags";
import { dismissWhatsNewDialog } from "../utils/ui";

test.describe("Critical - Owner schedule authorization", () => {
  test(`${critical} owner can access and edit a team member time block form`, async ({
    page,
    loginAsScenario,
  }) => {
    const authData = await loginAsScenario("owner-with-team");
    const teamMemberId = authData.teamMember?.id;
    if (!teamMemberId) {
      test.fail(true, "No se recibió teamMember.id en el setup de prueba.");
      return;
    }

    await page.goto(`/dashboard/schedule?barberId=${teamMemberId}`);
    await expect(page.getByText("Bloqueos de Horario")).toBeVisible();

    await dismissWhatsNewDialog(page);

    await page
      .locator('a[href*="/dashboard/schedule/"][href*="/edit"]')
      .first()
      .click();

    await expect(page.getByText("Editar Bloqueo", { exact: true })).toBeVisible();

    const reasonInput = page.getByLabel(/Razón del bloqueo/i);
    await reasonInput.fill(`Owner update critical ${Date.now()}`);
    await expect(reasonInput).toHaveValue(/Owner update critical/);

    await expect(
      page.getByRole("link", { name: "Volver a horarios" })
    ).toHaveAttribute("href", `/dashboard/schedule?barberId=${teamMemberId}`);
  });
});
