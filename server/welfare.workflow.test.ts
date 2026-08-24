import { describe, expect, it } from "vitest";
import { attendanceRequiresGuardianAlert, calculateAttentionCounts, stage5Permissions } from "./welfare";

describe("Stage 5 attendance and welfare workflow", () => {
  it("alerts guardians for absences and late arrivals, but not present or excused records", () => {
    expect(attendanceRequiresGuardianAlert("ABSENT")).toBe(true);
    expect(attendanceRequiresGuardianAlert("LATE")).toBe(true);
    expect(attendanceRequiresGuardianAlert("PRESENT")).toBe(false);
    expect(attendanceRequiresGuardianAlert("EXCUSED")).toBe(false);
  });

  it("aggregates attention indicators without requiring sensitive case details", () => {
    expect(calculateAttentionCounts([
      { attendanceStatus: "ABSENT", disciplineOpen: false, welfareOpen: false, safeguardingOpen: false, exeatRequested: false },
      { attendanceStatus: "LATE", disciplineOpen: true, welfareOpen: true, safeguardingOpen: false, exeatRequested: true },
    ])).toEqual({ absences: 1, lateArrivals: 1, discipline: 1, welfare: 1, safeguarding: 0, exeats: 1 });
  });

  it("keeps welfare, safeguarding, and medical access on distinct permissions", () => {
    expect(stage5Permissions.welfare).toBe("WELFARE_SENSITIVE_VIEW");
    expect(stage5Permissions.safeguarding).toBe("SAFEGUARDING_MANAGE");
    expect(stage5Permissions.medical).toBe("MEDICAL_SENSITIVE_VIEW");
    expect(stage5Permissions.welfare).not.toBe(stage5Permissions.attendance);
  });
});
