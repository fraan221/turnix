import { test, expect } from "@playwright/test";
import { periodsConfig } from "../../lib/reports";

test.describe("PeriodDropdown Configuration", () => {
  test("includes customMonth with label 'Elegir mes'", () => {
    const customMonthOption = periodsConfig.find((p) => p.value === "customMonth");
    expect(customMonthOption).toBeDefined();
    expect(customMonthOption?.label).toBe("Elegir mes");
  });

  test("maintains standard periods order with customMonth alongside custom", () => {
    const values = periodsConfig.map((p) => p.value);
    expect(values).toContain("month");
    expect(values).toContain("lastMonth");
    expect(values).toContain("customMonth");
    expect(values).toContain("custom");
  });
});
