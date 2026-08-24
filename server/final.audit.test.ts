import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import {
  canExplicitlyEnrolForm5,
  validateALevelAdmissionReview,
} from "./academic";
import { getRoleProfile } from "./dashboard";
import { isPortalFieldEditable, portalProtectedFields } from "./portal";
import { attendanceRequiresGuardianAlert, stage5Permissions } from "./welfare";
import type { TrpcContext } from "./_core/context";

function contextFor(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const staffRoles = [
  "HEADTEACHER",
  "DEPUTY_HEAD",
  "HOD",
  "CLASS_TEACHER",
  "SUBJECT_TEACHER",
  "BURSAR",
  "ADMISSIONS_OFFICER",
  "EXAMINATION_OFFICER",
] as const;

describe("Final automated audit — Tests 1–15", () => {
  it("Test 1 — requires authentication for the role dashboard", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.dashboard.role()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("Test 2 — resolves Headteacher to whole-school executive navigation", () => {
    const profile = getRoleProfile(["HEADTEACHER"]);
    expect(profile.title).toContain("Headteacher");
    expect(profile.paths.map(item => item.path)).toEqual(
      expect.arrayContaining(["/production-readiness", "/finance", "/welfare"])
    );
  });

  it("Test 3 — resolves Deputy Head to daily operations and learner support", () => {
    const profile = getRoleProfile(["DEPUTY_HEAD"]);
    expect(profile.title).toContain("Deputy Head");
    expect(profile.paths.map(item => item.path)).toEqual(
      expect.arrayContaining(["/welfare", "/timetable"])
    );
  });

  it("Test 4 — resolves HOD to academic and department workspaces", () => {
    const profile = getRoleProfile(["HOD"]);
    expect(profile.title).toContain("Department");
    expect(profile.paths.map(item => item.path)).toContain("/academic");
  });

  it("Test 5 — resolves Class Teacher to class register, attendance, and welfare work", () => {
    const profile = getRoleProfile(["CLASS_TEACHER"]);
    expect(profile.title).toContain("Class Teacher");
    expect(profile.paths.map(item => item.path)).toEqual(
      expect.arrayContaining(["/welfare", "/academic"])
    );
  });

  it("Test 6 — resolves Subject Teacher to subject and assessment work", () => {
    const profile = getRoleProfile(["SUBJECT_TEACHER"]);
    expect(profile.title).toContain("Subject Teacher");
    expect(profile.paths.map(item => item.path)).toContain("/academic");
  });

  it("Test 7 — resolves Bursar to financial operations only", () => {
    const profile = getRoleProfile(["BURSAR"]);
    expect(profile.title).toContain("Bursar");
    expect(profile.paths).toEqual([
      { label: "School finance", path: "/finance" },
    ]);
  });

  it("Test 8 — resolves Admissions Officer to learner admission work", () => {
    const profile = getRoleProfile(["ADMISSIONS_OFFICER"]);
    expect(profile.title).toContain("Admissions");
    expect(profile.paths.map(item => item.path)).toEqual(["/academic"]);
  });

  it("Test 9 — resolves Examination Officer to examination and results work", () => {
    const profile = getRoleProfile(["EXAMINATION_OFFICER"]);
    expect(profile.title).toContain("Examination");
    expect(profile.paths.map(item => item.path)).toEqual(
      expect.arrayContaining(["/academic", "/timetable"])
    );
  });

  it("Test 10 — covers every mandated staff dashboard role without university terminology", () => {
    for (const role of staffRoles) {
      const profile = getRoleProfile([role]);
      expect(profile.title.length).toBeGreaterThan(0);
      expect(profile.summary.toLowerCase()).not.toMatch(
        /university|college|semester|campus/
      );
    }
  });

  it("Test 11 — keeps A-Level admission review blocked until ZIMSEC results are verified", () => {
    expect(() =>
      validateALevelAdmissionReview({
        applicationStatus: "ACCEPTED",
        verificationStatus: "PENDING",
        selectionDecision: "SELECTED",
      })
    ).toThrow(/Verify ZIMSEC/);
    expect(() =>
      validateALevelAdmissionReview({
        applicationStatus: "ACCEPTED",
        verificationStatus: "FAILED",
        selectionDecision: "SELECTED",
      })
    ).toThrow(/Verify ZIMSEC/);
  });

  it("Test 12 — requires explicit selection and admission before Form 5 enrolment", () => {
    const application = {
      applicationStatus: "ACCEPTED",
      verificationStatus: "VERIFIED",
      selectionDecision: "SELECTED",
      admissionDecision: "PENDING",
    };
    expect(validateALevelAdmissionReview(application)).toBe(true);
    expect(canExplicitlyEnrolForm5(application)).toBe(false);
    expect(
      canExplicitlyEnrolForm5({ ...application, admissionDecision: "ADMITTED" })
    ).toBe(true);
  });

  it("Test 13 — defines guardian alerts for absences and late arrivals, not excused absences", () => {
    expect(attendanceRequiresGuardianAlert("ABSENT")).toBe(true);
    expect(attendanceRequiresGuardianAlert("LATE")).toBe(true);
    expect(attendanceRequiresGuardianAlert("EXCUSED")).toBe(false);
    expect(stage5Permissions.medical).toBe("MEDICAL_SENSITIVE_VIEW");
  });

  it("Test 14 — prevents portal edits to official identity, placement, marks, and attendance", () => {
    expect(portalProtectedFields).toEqual(
      expect.arrayContaining([
        "studentId",
        "registrationStatus",
        "currentForm",
        "marks",
        "attendance",
      ])
    );
    for (const field of portalProtectedFields)
      expect(isPortalFieldEditable(field)).toBe(false);
  });

  it("Test 15 — falls back to the least-privilege teacher workspace for an unknown role", () => {
    const profile = getRoleProfile(["UNRECOGNISED_ROLE"]);
    expect(profile.title).toContain("Teacher");
    expect(profile.paths).not.toEqual(
      expect.arrayContaining([{ label: "School finance", path: "/finance" }])
    );
    expect(profile.paths).not.toEqual(
      expect.arrayContaining([
        {
          label: "Reports, audit & system health",
          path: "/production-readiness",
        },
      ])
    );
  });
});
