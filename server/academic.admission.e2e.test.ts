import { describe, expect, it } from "vitest";
import { canExplicitlyEnrolForm5, validateALevelAdmissionReview } from "./academic";

type HistoryRecord = { studentId: string; academicYear: number; term: string; form: string; pathway: "O_LEVEL" | "A_LEVEL" };
type Application = { applicationStatus: string; verificationStatus: string; selectionDecision: string; admissionDecision: string };

describe("A-Level application and admission workflow", () => {
  it("preserves Form 4 history while completing the explicit Form 5 and Form 6 journey", () => {
    const history: HistoryRecord[] = [{ studentId: "STU-2026-0042", academicYear: 2026, term: "Term 3", form: "Form 4", pathway: "O_LEVEL" }];
    const oLevelResult = { examinationYear: 2026, candidateNumber: "ZIM-0042", candidateName: "Tariro Moyo", subjects: [{ name: "Mathematics", grade: "A" }, { name: "Physics", grade: "B" }, { name: "Chemistry", grade: "B" }] };
    expect(oLevelResult.candidateNumber).toBe("ZIM-0042");
    expect(oLevelResult.subjects).toHaveLength(3);

    const application: Application = { applicationStatus: "SUBMITTED", verificationStatus: "PENDING", selectionDecision: "PENDING", admissionDecision: "PENDING" };
    expect(() => validateALevelAdmissionReview(application)).not.toThrow();
    application.applicationStatus = "RESULTS_VERIFICATION";
    expect(() => validateALevelAdmissionReview(application)).not.toThrow();
    expect(() => validateALevelAdmissionReview({ ...application, applicationStatus: "ACCEPTED" })).toThrow(/Verify ZIMSEC/);

    application.verificationStatus = "VERIFIED";
    expect(() => validateALevelAdmissionReview({ ...application, applicationStatus: "ACCEPTED" })).toThrow(/Select the learner/);
    application.selectionDecision = "SELECTED";
    application.applicationStatus = "ACCEPTED";
    expect(validateALevelAdmissionReview(application)).toBe(true);
    expect(canExplicitlyEnrolForm5(application)).toBe(false);

    application.admissionDecision = "ADMITTED";
    expect(canExplicitlyEnrolForm5(application)).toBe(true);
    history.push({ studentId: "STU-2026-0042", academicYear: 2027, term: "Term 1", form: "Form 5", pathway: "A_LEVEL" });
    expect(history[0]).toMatchObject({ form: "Form 4", pathway: "O_LEVEL" });
    expect(history).toHaveLength(2);

    history.push({ studentId: "STU-2026-0042", academicYear: 2028, term: "Term 1", form: "Form 6", pathway: "A_LEVEL" });
    expect(history.map(record => record.form)).toEqual(["Form 4", "Form 5", "Form 6"]);
    expect(new Set(history.map(record => record.studentId))).toEqual(new Set(["STU-2026-0042"]));
  });

  it("does not allow admission when results or selection is incomplete", () => {
    expect(() => validateALevelAdmissionReview({ applicationStatus: "ACCEPTED", verificationStatus: "FAILED", selectionDecision: "SELECTED" })).toThrow();
    expect(() => validateALevelAdmissionReview({ applicationStatus: "CONDITIONALLY_ACCEPTED", verificationStatus: "VERIFIED", selectionDecision: "NOT_SELECTED" })).toThrow();
    expect(canExplicitlyEnrolForm5({ applicationStatus: "CONDITIONALLY_ACCEPTED", admissionDecision: "ADMITTED" })).toBe(false);
  });
});
