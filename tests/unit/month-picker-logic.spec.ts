import { test, expect } from "@playwright/test";
import { formatMonthLabel, isMonthDisabled } from "../../lib/date-helpers";

test.describe("MonthPicker logic", () => {
  test("formats month label nicely in Argentine Spanish", () => {
    expect(formatMonthLabel("2024-05-01")).toBe("Mayo 2024");
    expect(formatMonthLabel("2024-12-01")).toBe("Diciembre 2024");
    expect(formatMonthLabel(undefined)).toBe("Seleccionar mes");
  });

  test("disables future months beyond current date", () => {
    const currentDate = new Date(2026, 10, 1); // Nov 2026 (month index 10)
    // Nov 2026 is allowed
    expect(isMonthDisabled(2026, 10, 2024, currentDate)).toBe(false);
    // Dec 2026 is future -> disabled
    expect(isMonthDisabled(2026, 11, 2024, currentDate)).toBe(true);
    // Jan 2027 is future -> disabled
    expect(isMonthDisabled(2027, 0, 2024, currentDate)).toBe(true);
    // Jan 2023 is before minYear 2024 -> disabled
    expect(isMonthDisabled(2023, 0, 2024, currentDate)).toBe(true);
  });
});
