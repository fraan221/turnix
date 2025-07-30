import { test, expect } from "@playwright/test";

test.describe("Flujo de Registro de Usuario", () => {
  // --- Test de registro con credenciales ---
  test("un nuevo dueño de barbería puede registrarse con email y contraseña", async ({
    page,
  }) => {
    const uniqueEmail = `test-user-${Date.now()}@turnix.app`;

    await page.goto("/register");
    await expect(page.getByText("Regístrate", { exact: true })).toBeVisible();

    await page.getByRole("combobox").click();
    await page
      .getByRole("option", { name: "Soy el Dueño de la Barbería" })
      .click();

    await page
      .getByLabel("Nombre de tu Barbería")
      .fill("Barbería de Prueba E2E");
    await page.getByLabel("Nombre", { exact: true }).fill("Dueño de Prueba");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Contraseña").fill("PasswordConSimbolo123!");

    await page.getByRole("button", { name: "Crear Cuenta" }).click();
    await expect(page).toHaveURL("/login", { timeout: 10000 });
  });

  // --- Test de Google ---
  test("un nuevo usuario autenticado es redirigido a completar su perfil si no tiene rol", async ({
    page,
    context,
  }) => {
    const response = await page.request.post("/api/test/login");
    expect(response.ok()).toBeTruthy();
    const sessionCookie = await response.json();

    await context.addCookies([
      {
        name: sessionCookie.name,
        value: sessionCookie.value,
        domain: "localhost",
        path: "/",
      },
    ]);

    // 3. Navegamos a una página protegida
    await page.goto("/dashboard");

    // 4. Verificamos que nuestro middleware nos redirige correctamente
    await page.waitForURL("**/complete-profile");
    await expect(page).toHaveURL("/complete-profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByText("Un último paso...", { exact: true })
    ).toBeVisible();
  });
});
