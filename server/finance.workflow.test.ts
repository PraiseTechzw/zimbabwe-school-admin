import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals, displayCurrency, normalizeCurrency } from "./finance";

describe("Stage 6 school finance", () => {
  it("supports USD and ZiG without implicit conversion", () => {
    expect(normalizeCurrency("usd")).toBe("USD");
    expect(normalizeCurrency("ZIG")).toBe("ZIG");
    expect(displayCurrency("ZIG")).toBe("ZiG");
    expect(() => normalizeCurrency("ZAR")).toThrow(/USD and ZiG/);
  });

  it("calculates term invoices with integer minor units and discounts", () => {
    expect(calculateInvoiceTotals([{ description: "Tuition", quantity: 1, unitAmountMinor: 25000 }, { description: "Levy", quantity: 2, unitAmountMinor: 1500 }], 1000)).toEqual({ lineTotals: [{ description: "Tuition", quantity: 1, unitAmountMinor: 25000, lineTotalMinor: 25000 }, { description: "Levy", quantity: 2, unitAmountMinor: 1500, lineTotalMinor: 3000 }], subtotalMinor: 28000, discountMinor: 1000, totalMinor: 27000 });
    expect(() => calculateInvoiceTotals([{ description: "Tuition", quantity: 1, unitAmountMinor: 1000 }], 1001)).toThrow(/discount/);
  });

  it("keeps payment channel names explicit for Zimbabwean reconciliation", () => {
    const channels = ["CASH", "BANK_TRANSFER", "ECOCASH", "ZIPIT", "INNBUCKS", "PAYNOW"];
    expect(new Set(channels).size).toBe(6);
    expect(channels).toContain("PAYNOW");
    expect(channels).toContain("INNBUCKS");
  });
});
