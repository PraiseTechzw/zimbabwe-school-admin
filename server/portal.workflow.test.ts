import { describe, expect, it } from "vitest";
import { isPortalFieldEditable, portalProtectedFields } from "./portal";

describe("Stage 10 learner and guardian portal", () => {
  it("protects official identity, placement, marks, and attendance fields", () => {
    expect(portalProtectedFields).toEqual(expect.arrayContaining(["studentId", "admissionNumber", "registrationStatus", "currentForm", "className", "marks", "attendance"]));
    for (const field of portalProtectedFields) expect(isPortalFieldEditable(field)).toBe(false);
  });

  it("does not treat unrelated portal preferences as official records", () => {
    expect(isPortalFieldEditable("notificationPreference")).toBe(true);
    expect(isPortalFieldEditable("avatarUrl")).toBe(true);
  });
});
