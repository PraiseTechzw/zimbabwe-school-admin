import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const adminUser = {
  id: 1,
  openId: "admin-user",
  name: "Admin User",
  email: "admin@example.com",
  loginMethod: "manus",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("foundation permissions", () => {
  it("requires authentication to read foundation data", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.foundation.overview()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires administrator access to change the school profile", async () => {
    const caller = appRouter.createCaller(contextFor({
      id: 7,
      openId: "teacher-user",
      name: "Teacher User",
      email: "teacher@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));
    await expect(caller.foundation.saveSchoolProfile({
      schoolName: "Example Secondary School",
      motto: null,
      registrationNumber: "MOPSE-001",
      registrationAuthority: "MoPSE",
      schoolType: "secondary",
      logoKey: null,
      logoUrl: null,
      primaryColour: "#123B5D",
      accentColour: "#C99A3E",
      addressLine1: "1 School Road",
      addressLine2: null,
      town: "Harare",
      province: "Harare",
      country: "Zimbabwe",
      phone: null,
      alternativePhone: null,
      email: null,
      website: null,
      headteacherName: null,
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reports full capabilities to the project administrator", async () => {
    const caller = appRouter.createCaller(contextFor(adminUser));
    await expect(caller.foundation.capabilities()).resolves.toMatchObject({
      profile: true,
      calendar: true,
      structure: true,
      subjects: true,
      facilities: true,
      staff: true,
      assignments: true,
      documents: true,
    });
  });

  it("rejects an undersized base64 payload before attempting document storage", async () => {
    const caller = appRouter.createCaller(contextFor(adminUser));
    await expect(caller.foundation.uploadDocument({
      title: "Policy",
      category: "POLICY",
      fileName: "policy.pdf",
      mimeType: "application/pdf",
      base64Data: "x",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
