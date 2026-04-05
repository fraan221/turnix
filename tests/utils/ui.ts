import { Page } from "@playwright/test";

export async function dismissWhatsNewDialog(page: Page) {
  const understoodButton = page.getByRole("button", { name: "Entendido" }).first();

  try {
    await understoodButton.waitFor({ state: "visible", timeout: 5000 });
    await understoodButton.click();
  } catch {
    // El modal puede no mostrarse.
  }
}
