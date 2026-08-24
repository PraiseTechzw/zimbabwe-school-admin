import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { attendanceRecords, attendanceSessions, counsellingRecords, disciplineActions, disciplineIncidents, exeatRequests, guardianAlerts, medicalProfiles, prefectReports, safeguardingReferrals, welfareCases } from "../drizzle/schema";
import { getDb, userHasPermission } from "./db";

export const stage5Permissions = {
  attendance: "ATTENDANCE_MANAGE",
  discipline: "DISCIPLINE_MANAGE",
  welfare: "WELFARE_SENSITIVE_VIEW",
  safeguarding: "SAFEGUARDING_MANAGE",
  medical: "MEDICAL_SENSITIVE_VIEW",
  boarding: "BOARDING_MANAGE",
} as const;

export async function assertStage5Permission(userId: number, permissionCode: string, action: "canView" | "canCreate" | "canEdit" | "canDelete" = "canView", isAdministrator = false) {
  if (!isAdministrator && !await userHasPermission(userId, permissionCode, action)) throw new TRPCError({ code: "FORBIDDEN", message: "Your role does not allow access to this Stage 5 record." });
}

export function attendanceRequiresGuardianAlert(status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") { return status === "ABSENT" || status === "LATE"; }

export function calculateAttentionCounts(input: { attendanceStatus: string; disciplineOpen: boolean; welfareOpen: boolean; safeguardingOpen: boolean; exeatRequested: boolean }[]) {
  return input.reduce((summary, row) => ({ absences: summary.absences + (row.attendanceStatus === "ABSENT" ? 1 : 0), lateArrivals: summary.lateArrivals + (row.attendanceStatus === "LATE" ? 1 : 0), discipline: summary.discipline + (row.disciplineOpen ? 1 : 0), welfare: summary.welfare + (row.welfareOpen ? 1 : 0), safeguarding: summary.safeguarding + (row.safeguardingOpen ? 1 : 0), exeats: summary.exeats + (row.exeatRequested ? 1 : 0) }), { absences: 0, lateArrivals: 0, discipline: 0, welfare: 0, safeguarding: 0, exeats: 0 });
}

export async function getStage5Dashboard() {
  const db = await getDb();
  if (!db) return null;
  const [attendance, incidents, welfare, safeguarding, exeats, alerts] = await Promise.all([
    db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.createdAt)).limit(500),
    db.select().from(disciplineIncidents).where(eq(disciplineIncidents.status, "OPEN")).limit(500),
    db.select({ id: welfareCases.id, learnerId: welfareCases.learnerId, severity: welfareCases.severity, status: welfareCases.status }).from(welfareCases).where(eq(welfareCases.status, "OPEN")).limit(500),
    db.select({ id: safeguardingReferrals.id, learnerId: safeguardingReferrals.learnerId, status: safeguardingReferrals.status }).from(safeguardingReferrals).where(inArray(safeguardingReferrals.status, ["SUBMITTED", "IN_REVIEW", "ACTIONED"])).limit(500),
    db.select({ id: exeatRequests.id, learnerId: exeatRequests.learnerId, status: exeatRequests.status }).from(exeatRequests).where(eq(exeatRequests.status, "REQUESTED")).limit(500),
    db.select().from(guardianAlerts).orderBy(desc(guardianAlerts.queuedAt)).limit(100),
  ]);
  return { counts: calculateAttentionCounts(attendance.map(row => ({ attendanceStatus: row.status, disciplineOpen: false, welfareOpen: false, safeguardingOpen: false, exeatRequested: false }))), attendance: attendance.map(row => ({ id: row.id, learnerId: row.learnerId, status: row.status, guardianAlerted: row.guardianAlerted, createdAt: row.createdAt })), disciplineCount: incidents.length, welfareCount: welfare.length, safeguardingCount: safeguarding.length, exeatCount: exeats.length, guardianAlertCount: alerts.length };
}

export async function getStage5SensitiveData(userId: number, isAdministrator = false) {
  const [welfareAllowed, safeguardingAllowed, medicalAllowed] = isAdministrator ? [true, true, true] : await Promise.all([userHasPermission(userId, stage5Permissions.welfare, "canView"), userHasPermission(userId, stage5Permissions.safeguarding, "canView"), userHasPermission(userId, stage5Permissions.medical, "canView")]);
  if (!welfareAllowed && !safeguardingAllowed && !medicalAllowed) throw new TRPCError({ code: "FORBIDDEN", message: "Your role does not allow access to sensitive learner records." });
  const db = await getDb();
  if (!db) return null;
  const [welfare, counselling, safeguarding, medical] = await Promise.all([
    welfareAllowed ? db.select().from(welfareCases).orderBy(desc(welfareCases.openedAt)) : Promise.resolve([]),
    welfareAllowed ? db.select().from(counsellingRecords).orderBy(desc(counsellingRecords.sessionAt)) : Promise.resolve([]),
    safeguardingAllowed ? db.select().from(safeguardingReferrals).orderBy(desc(safeguardingReferrals.referredAt)) : Promise.resolve([]),
    medicalAllowed ? db.select().from(medicalProfiles).orderBy(asc(medicalProfiles.learnerId)) : Promise.resolve([]),
  ]);
  return { welfare, counselling, safeguarding, medical };
}

export async function recordAttendance(input: { academicYearId: number; termId: number; classId?: number | null; sessionDate: Date; mode: "DAILY" | "PERIOD" | "BOARDING_ROLL_CALL"; periodNumber?: number | null; periodName?: string | null; recordedByUserId: number; records: Array<{ learnerId: number; status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; arrivalTime?: Date | null; reason?: string | null; note?: string | null }> }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.mode === "PERIOD" && !input.periodNumber) throw new TRPCError({ code: "BAD_REQUEST", message: "Period attendance requires a period number." });
  const sessionResult = await db.insert(attendanceSessions).values({ academicYearId: input.academicYearId, termId: input.termId, classId: input.classId ?? null, sessionDate: input.sessionDate, mode: input.mode, periodNumber: input.periodNumber ?? null, periodName: input.periodName ?? null, recordedByUserId: input.recordedByUserId });
  const sessionId = Number(sessionResult[0].insertId);
  const rows = input.records.map(record => ({ sessionId, learnerId: record.learnerId, status: record.status, arrivalTime: record.arrivalTime ?? null, reason: record.reason ?? null, note: record.note ?? null, guardianAlerted: false }));
  if (rows.length) await db.insert(attendanceRecords).values(rows);
  const persisted = await db.select({ id: attendanceRecords.id, learnerId: attendanceRecords.learnerId, status: attendanceRecords.status }).from(attendanceRecords).where(eq(attendanceRecords.sessionId, sessionId));
  const attentionRows = persisted.filter(row => attendanceRequiresGuardianAlert(row.status));
  if (attentionRows.length) {
    await db.insert(guardianAlerts).values(attentionRows.map(row => ({ learnerId: row.learnerId, attendanceRecordId: row.id, alertType: row.status === "LATE" ? "LATE_ARRIVAL" as const : "ABSENCE" as const, status: "QUEUED" as const, message: row.status === "LATE" ? "A late arrival has been recorded." : "An absence has been recorded.", queuedAt: new Date() })));
    await db.update(attendanceRecords).set({ guardianAlerted: true, alertSentAt: new Date() }).where(inArray(attendanceRecords.id, attentionRows.map(row => row.id)));
  }
  return { sessionId, records: rows.length, guardianAlertsQueued: attentionRows.length };
}

export async function createDisciplineIncident(input: { learnerId: number; occurredAt: Date; category: string; severity: number; summary: string; details?: string | null; reportedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const result = await db.insert(disciplineIncidents).values({ ...input, details: input.details ?? null, status: "OPEN" });
  return (await db.select().from(disciplineIncidents).where(eq(disciplineIncidents.id, Number(result[0].insertId))).limit(1))[0];
}

export async function addDisciplineAction(input: { incidentId: number; actionType: "NONE" | "DEMERIT" | "DETENTION" | "SUSPENSION"; points?: number | null; startAt?: Date | null; endAt?: Date | null; notes?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.actionType === "DEMERIT" && (!input.points || input.points <= 0)) throw new TRPCError({ code: "BAD_REQUEST", message: "A demerit action requires positive points." });
  const result = await db.insert(disciplineActions).values({ ...input, points: input.points ?? null, startAt: input.startAt ?? null, endAt: input.endAt ?? null, notes: input.notes ?? null });
  return (await db.select().from(disciplineActions).where(eq(disciplineActions.id, Number(result[0].insertId))).limit(1))[0];
}

export async function createWelfareCase(input: { learnerId: number; category: string; severity: number; summary: string; privateNotes?: string | null; assignedToUserId?: number | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const result = await db.insert(welfareCases).values({ ...input, privateNotes: input.privateNotes ?? null, assignedToUserId: input.assignedToUserId ?? null, status: "OPEN" });
  return (await db.select().from(welfareCases).where(eq(welfareCases.id, Number(result[0].insertId))).limit(1))[0];
}

export async function createSafeguardingReferral(input: { welfareCaseId: number; learnerId: number; referralType: string; details: string; externalAgency?: string | null; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const result = await db.insert(safeguardingReferrals).values({ ...input, externalAgency: input.externalAgency ?? null, status: "SUBMITTED" });
  return (await db.select().from(safeguardingReferrals).where(eq(safeguardingReferrals.id, Number(result[0].insertId))).limit(1))[0];
}

export async function upsertMedicalProfile(input: { learnerId: number; bloodGroup?: string | null; allergies?: string | null; conditions?: string | null; medications?: string | null; emergencyContactName?: string | null; emergencyContactPhone?: string | null; notes?: string | null; updatedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const existing = await db.select().from(medicalProfiles).where(eq(medicalProfiles.learnerId, input.learnerId)).limit(1);
  if (existing[0]) { await db.update(medicalProfiles).set(input).where(eq(medicalProfiles.id, existing[0].id)); return (await db.select().from(medicalProfiles).where(eq(medicalProfiles.id, existing[0].id)).limit(1))[0]; }
  const result = await db.insert(medicalProfiles).values(input);
  return (await db.select().from(medicalProfiles).where(eq(medicalProfiles.id, Number(result[0].insertId))).limit(1))[0];
}

export async function createExeatRequest(input: { learnerId: number; requestedByUserId: number; departureAt: Date; expectedReturnAt: Date; destination: string; reason: string }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.expectedReturnAt <= input.departureAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Expected return must be after departure." });
  const result = await db.insert(exeatRequests).values({ ...input, status: "REQUESTED" });
  return (await db.select().from(exeatRequests).where(eq(exeatRequests.id, Number(result[0].insertId))).limit(1))[0];
}
