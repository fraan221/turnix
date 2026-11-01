import { test, expect } from "@playwright/test";
import { getDateRangeForPeriod as getAnalyticsDateRange } from "../../lib/reports";
import { getStartOfMonth, getEndOfMonth } from "../../lib/date-helpers";

test.describe("Historical Month Period Logic", () => {
  test("calculates start and end of specific month correctly (May 2024)", () => {
    const { startDate, endDate } = getAnalyticsDateRange("customMonth" as any, "2024-05-15");
    
    expect(startDate.getFullYear()).toBe(2024);
    expect(startDate.getMonth()).toBe(4); // 0-indexed: May (4)
    expect(startDate.getDate()).toBe(1);

    expect(endDate.getFullYear()).toBe(2024);
    expect(endDate.getMonth()).toBe(4);
    expect(endDate.getDate()).toBe(31);
  });

  test("calculates February non-leap and leap year day counts", () => {
    // 2024 is a leap year (29 days)
    const leap = getAnalyticsDateRange("customMonth" as any, "2024-02-01");
    expect(leap.endDate.getDate()).toBe(29);

    // 2025 is not a leap year (28 days)
    const nonLeap = getAnalyticsDateRange("customMonth" as any, "2025-02-01");
    expect(nonLeap.endDate.getDate()).toBe(28);
  });

  test("falls back to current month if customDate is undefined", () => {
    const now = new Date();
    const { startDate, endDate } = getAnalyticsDateRange("customMonth" as any, undefined);
    
    expect(startDate.getMonth()).toBe(now.getMonth());
    expect(endDate.getMonth()).toBe(now.getMonth());
  });
});
