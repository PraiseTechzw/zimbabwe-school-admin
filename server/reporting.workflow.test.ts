import { describe, expect, it } from "vitest";
import { isValidStudentId, reportToCsv } from "./reporting";

describe("Stage 11 reporting and integrity", () => {
  it("accepts the configured Student ID format and rejects invalid IDs", () => {
    expect(isValidStudentId("SCH-2024-00125")).toBe(true);
    expect(isValidStudentId("SCHOOL-2026-1234")).toBe(true);
    expect(isValidStudentId("student-2026-1")).toBe(false);
    expect(isValidStudentId("SCH-26-001")).toBe(false);
  });

  it("exports nested report metrics as escaped CSV rows", () => {
    const csv = reportToCsv({ summary: { totalLearners: 12, note: "Term, 2" }, finance: { USD: { collectedMinor: 2500 } } });
    expect(csv).toContain('"summary","totalLearners","12"');
    expect(csv).toContain('"summary","note","Term, 2"');
    expect(csv).toContain('"finance","USD.collectedMinor","2500"');
  });
});
