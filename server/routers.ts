import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { addSchoolDocument, getDb, getFoundationData, getSchoolDocuments, saveSchoolProfile, userHasPermission } from "./db";
import { academicTerms, academicYears, classes, departments, forms, houses, rooms, staff, subjects, teacherAssignments } from "../drizzle/schema";

const schoolProfileInput = z.object({
  schoolName: z.string().min(2).max(180),
  motto: z.string().max(240).optional().nullable(),
  registrationNumber: z.string().min(1).max(80),
  registrationAuthority: z.string().max(120).default("MoPSE"),
  schoolType: z.literal("secondary").default("secondary"),
  logoKey: z.string().max(500).optional().nullable(),
  logoUrl: z.string().max(700).optional().nullable(),
  primaryColour: z.string().max(20).default("#123B5D"),
  accentColour: z.string().max(20).default("#C99A3E"),
  addressLine1: z.string().min(2).max(180),
  addressLine2: z.string().max(180).optional().nullable(),
  town: z.string().min(2).max(100),
  province: z.string().max(100).optional().nullable(),
  country: z.string().max(80).default("Zimbabwe"),
  phone: z.string().max(40).optional().nullable(),
  alternativePhone: z.string().max(40).optional().nullable(),
  email: z.string().email().max(320).optional().nullable(),
  website: z.string().max(320).optional().nullable(),
  headteacherName: z.string().max(180).optional().nullable(),
});

const documentInput = z.object({
  title: z.string().min(2).max(180),
  category: z.enum(["SCHOOL_PROFILE", "POLICY", "ADMINISTRATION", "OTHER"]).default("ADMINISTRATION"),
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(1).max(120),
  base64Data: z.string().min(10),
  });

const quickCreateInput = z.object({
  entity: z.enum(["academicYear", "term", "house", "department", "subject", "room", "staff", "class", "assignment"]),
  name: z.string().max(140).optional(),
});

const manageRecordInput = z.object({
  action: z.enum(["update", "delete"]),
  entity: z.enum(["academicYear", "term", "house", "department", "subject", "room", "staff", "class", "assignment"]),
  id: z.number().int().positive(),
  name: z.string().max(140).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  foundation: router({
    overview: protectedProcedure.query(async () => getFoundationData()),
    capabilities: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") return { profile: true, calendar: true, structure: true, subjects: true, facilities: true, staff: true, assignments: true, documents: true };
      const check = async (code: string, action: "canView" | "canCreate" | "canEdit" | "canDelete" = "canCreate") => userHasPermission(ctx.user.id, code, action);
      const [profile, calendar, structure, subjects, facilities, staff, assignments, documents] = await Promise.all([
        check("SCHOOL_PROFILE_MANAGE", "canEdit"), check("ACADEMIC_CALENDAR_MANAGE"), check("ACADEMIC_STRUCTURE_MANAGE"), check("SUBJECTS_MANAGE"), check("FACILITIES_MANAGE"), check("STAFF_MANAGE"), check("ASSIGNMENTS_MANAGE"), check("DOCUMENTS_MANAGE"),
      ]);
      return { profile, calendar, structure, subjects, facilities, staff, assignments, documents };
    }),
    documents: protectedProcedure.query(async () => getSchoolDocuments()),
    saveSchoolProfile: protectedProcedure.input(schoolProfileInput).mutation(async ({ input, ctx }) => {
      const allowed = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "SCHOOL_PROFILE_MANAGE", "canEdit");
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Your school role does not allow editing the school profile." });
      try {
        return await saveSchoolProfile(input);
      } catch (error) {
        console.error("[Foundation] Failed to save school profile", error);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unable to save the school profile. Check that the MoPSE registration number is unique." });
      }
    }),
    uploadDocument: protectedProcedure.input(documentInput).mutation(async ({ input, ctx }) => {
      const allowed = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "DOCUMENTS_MANAGE", "canCreate");
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Your school role does not allow uploading documents." });
      const raw = input.base64Data.includes(",") ? input.base64Data.split(",", 2)[1] : input.base64Data;
      if (!raw) throw new TRPCError({ code: "BAD_REQUEST", message: "The uploaded file is empty." });
      const buffer = Buffer.from(raw, "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Files must be 10 MB or smaller." });
      }
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const stored = await storagePut(`school-documents/${ctx.user.id}/${safeName}`, buffer, input.mimeType);
      return addSchoolDocument({
        uploadedByUserId: ctx.user.id,
        title: input.title,
        category: input.category,
        storageKey: stored.key,
        storageUrl: stored.url,
        mimeType: input.mimeType,
        fileSize: buffer.length,
      });
    }),
    quickCreate: protectedProcedure.input(quickCreateInput).mutation(async ({ input, ctx }) => {
      const permissionByEntity = { academicYear: "ACADEMIC_CALENDAR_MANAGE", term: "ACADEMIC_CALENDAR_MANAGE", house: "ACADEMIC_STRUCTURE_MANAGE", department: "SUBJECTS_MANAGE", subject: "SUBJECTS_MANAGE", room: "FACILITIES_MANAGE", staff: "STAFF_MANAGE", class: "ACADEMIC_STRUCTURE_MANAGE", assignment: "ASSIGNMENTS_MANAGE" } as const;
      const allowed = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, permissionByEntity[input.entity], "canCreate");
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Your school role does not allow creating this record." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
      const name = input.name?.trim();
      if (input.entity === "academicYear") {
        const year = name || String(new Date().getFullYear() + 1);
        const result = await db.insert(academicYears).values({ name: year, startDate: new Date(`${year}-01-01`), endDate: new Date(`${year}-12-31`), isCurrent: false });
        const yearId = Number(result[0].insertId);
        await db.insert(academicTerms).values([1, 2, 3].map(termNumber => ({ academicYearId: yearId, termNumber, name: `Term ${termNumber}`, startDate: new Date(`${year}-${termNumber === 1 ? "01-12" : termNumber === 2 ? "05-05" : "09-01"}`), endDate: new Date(`${year}-${termNumber === 1 ? "04-02" : termNumber === 2 ? "08-07" : "12-04"}`), isCurrent: false })));
        return { entity: input.entity, id: yearId };
      }
      if (input.entity === "house") { const result = await db.insert(houses).values({ name: name || `House ${Date.now() % 1000}`, colour: "#C99A3E", isActive: true }); return { entity: input.entity, id: Number(result[0].insertId) }; }
      if (input.entity === "department") { const label = name || "General Studies"; const result = await db.insert(departments).values({ name: label, code: label.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || `DEP${Date.now() % 1000}`, isActive: true }); return { entity: input.entity, id: Number(result[0].insertId) }; }
      if (input.entity === "subject") { const label = name || "Mathematics"; const result = await db.insert(subjects).values({ name: label, code: label.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || `SUB${Date.now() % 1000}`, pathway: "O_LEVEL", isCore: true, isActive: true }); return { entity: input.entity, id: Number(result[0].insertId) }; }
      if (input.entity === "room") { const result = await db.insert(rooms).values({ name: name || `Classroom ${Date.now() % 1000}`, roomType: "CLASSROOM", isActive: true }); return { entity: input.entity, id: Number(result[0].insertId) }; }
      if (input.entity === "staff") { const firstName = name || "New"; const result = await db.insert(staff).values({ staffNumber: `STAFF-${Date.now()}`, firstName, lastName: "Staff member", employmentType: "PERMANENT", status: "ACTIVE" }); return { entity: input.entity, id: Number(result[0].insertId) }; }
      const foundation = await getFoundationData();
      if (!foundation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Foundation data is not available." });
      if (input.entity === "class") { const firstForm = foundation.forms[0]; if (!firstForm) throw new TRPCError({ code: "BAD_REQUEST", message: "Create a Form before adding a class." }); const result = await db.insert(classes).values({ formId: firstForm.id, name: name || `${firstForm.label} A`, streamName: "A", attendanceMode: "MIXED", isActive: true }); return { entity: input.entity, id: Number(result[0].insertId) }; }
      const firstTeacher = foundation.staff[0]; const firstSubject = foundation.subjects[0]; const firstClass = foundation.classes[0]; const firstYear = foundation.academicYears[0];
      if (!firstTeacher || !firstSubject || !firstClass || !firstYear) throw new TRPCError({ code: "BAD_REQUEST", message: "Add staff, subjects, classes and an academic year before creating an assignment." });
      const result = await db.insert(teacherAssignments).values({ teacherStaffId: firstTeacher.id, subjectId: firstSubject.id, classId: firstClass.id, academicYearId: firstYear.id, isPrimaryTeacher: true });
      return { entity: input.entity, id: Number(result[0].insertId) };
    }),
    manageRecord: protectedProcedure.input(manageRecordInput).mutation(async ({ input, ctx }) => {
      const permissionByEntity = { academicYear: "ACADEMIC_CALENDAR_MANAGE", term: "ACADEMIC_CALENDAR_MANAGE", house: "ACADEMIC_STRUCTURE_MANAGE", department: "SUBJECTS_MANAGE", subject: "SUBJECTS_MANAGE", room: "FACILITIES_MANAGE", staff: "STAFF_MANAGE", class: "ACADEMIC_STRUCTURE_MANAGE", assignment: "ASSIGNMENTS_MANAGE" } as const;
      const action = input.action === "update" ? "canEdit" : "canDelete";
      const allowed = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, permissionByEntity[input.entity], action);
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Your school role does not allow this record action." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
      if (input.entity === "term") {
        if (input.action === "delete") await db.delete(academicTerms).where(eq(academicTerms.id, input.id));
        else if (input.name) await db.update(academicTerms).set({ name: input.name }).where(eq(academicTerms.id, input.id));
      } else if (input.entity === "academicYear") {
        if (input.action === "delete") { await db.delete(academicTerms).where(eq(academicTerms.academicYearId, input.id)); await db.delete(academicYears).where(eq(academicYears.id, input.id)); }
        else if (input.name) await db.update(academicYears).set({ name: input.name }).where(eq(academicYears.id, input.id));
      } else if (input.entity === "house") { if (input.action === "delete") await db.delete(houses).where(eq(houses.id, input.id)); else if (input.name) await db.update(houses).set({ name: input.name }).where(eq(houses.id, input.id)); }
      else if (input.entity === "department") { if (input.action === "delete") await db.delete(departments).where(eq(departments.id, input.id)); else if (input.name) await db.update(departments).set({ name: input.name }).where(eq(departments.id, input.id)); }
      else if (input.entity === "subject") { if (input.action === "delete") await db.delete(subjects).where(eq(subjects.id, input.id)); else if (input.name) await db.update(subjects).set({ name: input.name }).where(eq(subjects.id, input.id)); }
      else if (input.entity === "room") { if (input.action === "delete") await db.delete(rooms).where(eq(rooms.id, input.id)); else if (input.name) await db.update(rooms).set({ name: input.name }).where(eq(rooms.id, input.id)); }
      else if (input.entity === "staff") { if (input.action === "delete") await db.delete(staff).where(eq(staff.id, input.id)); else if (input.name) await db.update(staff).set({ firstName: input.name }).where(eq(staff.id, input.id)); }
      else if (input.entity === "class") { if (input.action === "delete") await db.delete(classes).where(eq(classes.id, input.id)); else if (input.name) await db.update(classes).set({ name: input.name }).where(eq(classes.id, input.id)); }
      else if (input.entity === "assignment" && input.action === "delete") await db.delete(teacherAssignments).where(eq(teacherAssignments.id, input.id));
      return { success: true } as const;
    }),
    uploadLogo: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(180), mimeType: z.string().startsWith("image/"), base64Data: z.string().min(10) })).mutation(async ({ input, ctx }) => {
      const allowed = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "SCHOOL_PROFILE_MANAGE", "canEdit");
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN", message: "Your school role does not allow changing school branding." });
      const raw = input.base64Data.includes(",") ? input.base64Data.split(",", 2)[1] : input.base64Data;
      if (!raw) throw new TRPCError({ code: "BAD_REQUEST", message: "The logo file is empty." });
      const buffer = Buffer.from(raw, "base64");
      if (buffer.length > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Logo files must be 5 MB or smaller." });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const stored = await storagePut(`school-logos/${ctx.user.id}/${safeName}`, buffer, input.mimeType);
      return { key: stored.key, url: stored.url };
    }),
  }),
});

export type AppRouter = typeof appRouter;
