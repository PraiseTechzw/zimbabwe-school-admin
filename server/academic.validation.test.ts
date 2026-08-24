import { describe, expect, it } from "vitest";
import { validateNormalProgression } from "./academic";

describe("normal secondary progression", () => {
  it("starts a learner in Form 1 when no history exists", () => {
    expect(validateNormalProgression(undefined, 1)).toBe(true);
    expect(validateNormalProgression(undefined, 2)).toBe(false);
  });

  it("advances exactly one O-Level form from Forms 1 to 4", () => {
    expect(validateNormalProgression(1, 2)).toBe(true);
    expect(validateNormalProgression(2, 3)).toBe(true);
    expect(validateNormalProgression(3, 4)).toBe(true);
    expect(validateNormalProgression(1, 3)).toBe(false);
    expect(validateNormalProgression(2, 4)).toBe(false);
  });

  it("does not treat Form 4 to Form 5 as normal promotion", () => {
    expect(validateNormalProgression(4, 5)).toBe(false);
  });
});
