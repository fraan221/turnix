import { test, expect } from "./fixtures/test-session";
import { smoke, critical } from "./utils/tags";

test.describe("Flujo de Registro de Usuario", () => {
  // --- Test de registro con credenciales ---
  test(
    `${smoke} ${critical} un nuevo dueño de barbería puede registrarse con email y contraseña`,
    async ({ page }) => {
    const uniqueEmail = `test-user-${Date.now()}@turnix.app`;

    await page.goto("/register");
    await expect(page.getByText("Crea tu cuenta", { exact: true })).toBeVisible();

    await page.getByRole("combobox").click();
    await page
      .getByRole("option", { name: "Soy el Dueño de la Barbería" })
      .click();

    await page
      .getByLabel(/Nombre de tu Barbería/)
      .fill("Barbería de Prueba E2E");
    await page.getByLabel(/Tu Nombre/).fill("Dueño de Prueba");
    await page.getByLabel(/Tu Celular/).fill("1122334455");
    await page.getByLabel(/Email/).fill(uniqueEmail);
    await page.getByLabel(/Contraseña/).fill("PasswordConSimbolo123!");

    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("¡Listo! Ya podés empezar", { exact: true })).toBeVisible();
    }
  );

  // --- Test de Google ---
  test(
    `${smoke} ${critical} un usuario autenticado sin rol es redirigido a completar su perfil`,
    async ({ page, loginAsScenario }) => {
      await loginAsScenario("incomplete-profile");

      await page.goto("/dashboard");

      await page.waitForURL("**/complete-profile");
      await expect(page).toHaveURL("/complete-profile");
      await expect(
        page.getByText("Un último paso...", { exact: true })
      ).toBeVisible();
    }
  );
});
