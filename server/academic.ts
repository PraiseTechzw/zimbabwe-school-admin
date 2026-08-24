import { and, asc, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  aLevelApplicationSubjects,
  aLevelApplications,
  aLevelRequirementSubjects,
  aLevelRequirements,
  academicTerms,
  academicYears,
  classes,
  forms,
  learnerAcademicHistory,
  learners,
  guardianContacts,
  learnerGuardians,
  oLevelResultSubjects,
  oLevelResults,
  subjects,
} from "../drizzle/schema";
import { getDb } from "./db";

export const applicationStatusValues = ["NOT_STARTED", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "RESULTS_VERIFICATION", "ACCEPTED", "CONDITIONALLY_ACCEPTED", "REJECTED", "WITHDRAWN"] as const;
export const verificationStatusValues = ["NOT_STARTED", "PENDING", "VERIFIED", "FAILED"] as const;
export const decisionStatusValues = ["PENDING", "SELECTED", "NOT_SELECTED", "ADMITTED", "NOT_ADMITTED"] as const;

export function validateNormalProgression(previousFormNumber: number | undefined, targetFormNumber: number) {
  if (targetFormNumber < 1 || targetFormNumber > 4) return false;
  if (previousFormNumber === undefined) return targetFormNumber === 1;
  return previousFormNumber >= 1 && previousFormNumber < 4 && targetFormNumber === previousFormNumber + 1;
}

export function validateALevelAdmissionReview(input: { applicationStatus: string; verificationStatus: string; selectionDecision: string }) {
  if (input.applicationStatus === "ACCEPTED" || input.applicationStatus === "CONDITIONALLY_ACCEPTED") {
    if (input.verificationStatus !== "VERIFIED") throw new TRPCError({ code: "BAD_REQUEST", message: "Verify ZIMSEC results before accepting an A-Level application." });
    if (input.selectionDecision !== "SELECTED") throw new TRPCError({ code: "BAD_REQUEST", message: "Select the learner before accepting an A-Level application." });
  }
  return true;
}

export function canExplicitlyEnrolForm5(input: { applicationStatus: string; admissionDecision: string }) {
  return input.applicationStatus === "ACCEPTED" && input.admissionDecision === "ADMITTED";
}

type HistoryInput = {
  learnerId: number;
  academicYearId: number;
  termId: number;
  formId: number;
  classId?: number | null;
  pathway: "O_LEVEL" | "A_LEVEL";
  progressionType?: "NORMAL_SECONDARY" | "A_LEVEL_ADMISSION" | "A_LEVEL_CONTINUATION" | null;
  previousHistoryId?: number | null;
  notes?: string | null;
  recordedByUserId: number;
};

export async function getAcademicData() {
  const db = await getDb();
  if (!db) return null;
  const [learnerRows, historyRows, resultRows, resultSubjectRows, requirementRows, requirementSubjectRows, applicationRows, applicationSubjectRows, subjectRows, yearRows, termRows, formRows] = await Promise.all([
    db.select().from(learners).orderBy(asc(learners.lastName), asc(learners.firstName)),
    db.select().from(learnerAcademicHistory).orderBy(desc(learnerAcademicHistory.createdAt)),
    db.select().from(oLevelResults).orderBy(desc(oLevelResults.examinationYear)),
    db.select().from(oLevelResultSubjects).orderBy(asc(oLevelResultSubjects.subjectName)),
    db.select().from(aLevelRequirements).orderBy(desc(aLevelRequirements.createdAt)),
    db.select().from(aLevelRequirementSubjects),
    db.select().from(aLevelApplications).orderBy(desc(aLevelApplications.createdAt)),
    db.select().from(aLevelApplicationSubjects),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db.select().from(academicYears).orderBy(desc(academicYears.startDate)),
    db.select().from(academicTerms).orderBy(asc(academicTerms.academicYearId), asc(academicTerms.termNumber)),
    db.select().from(forms).orderBy(asc(forms.formNumber)),
  ]);
  return { learners: learnerRows, academicHistory: historyRows, oLevelResults: resultRows, oLevelResultSubjects: resultSubjectRows, aLevelRequirements: requirementRows, aLevelRequirementSubjects: requirementSubjectRows, aLevelApplications: applicationRows, aLevelApplicationSubjects: applicationSubjectRows, subjects: subjectRows, academicYears: yearRows, academicTerms: termRows, forms: formRows };
}

export async function createLearner(input: typeof learners.$inferInsert) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const result = await db.insert(learners).values(input);
  const rows = await db.select().from(learners).where(eq(learners.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function recordAcademicHistory(input: HistoryInput) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.progressionType === "A_LEVEL_ADMISSION" || input.progressionType === "A_LEVEL_CONTINUATION") throw new TRPCError({ code: "BAD_REQUEST", message: "Use the dedicated A-Level admission or continuation workflow; do not insert A-Level progression as a generic history record." });
  if (input.progressionType === "NORMAL_SECONDARY") {
    const previous = await db.select().from(learnerAcademicHistory).where(eq(learnerAcademicHistory.learnerId, input.learnerId)).orderBy(desc(learnerAcademicHistory.createdAt)).limit(1);
    const target = await db.select().from(forms).where(eq(forms.id, input.formId)).limit(1);
    if (!target[0] || target[0].pathway !== "O_LEVEL" || target[0].formNumber > 4) throw new TRPCError({ code: "BAD_REQUEST", message: "Normal secondary progression is limited to O-Level Forms 1–4." });
    if (!previous[0]) {
      if (!validateNormalProgression(undefined, target[0].formNumber)) throw new TRPCError({ code: "BAD_REQUEST", message: "A learner without history must begin in Form 1." });
    } else {
      const previousForm = await db.select().from(forms).where(eq(forms.id, previous[0].formId)).limit(1);
      if (!previousForm[0] || previousForm[0].pathway !== "O_LEVEL" || !validateNormalProgression(previousForm[0].formNumber, target[0].formNumber)) throw new TRPCError({ code: "BAD_REQUEST", message: "Normal secondary progression must advance exactly one O-Level form at a time." });
    }
  }
  const duplicate = await db.select({ id: learnerAcademicHistory.id }).from(learnerAcademicHistory).where(and(eq(learnerAcademicHistory.learnerId, input.learnerId), eq(learnerAcademicHistory.academicYearId, input.academicYearId), eq(learnerAcademicHistory.termId, input.termId))).limit(1);
  if (duplicate[0]) throw new TRPCError({ code: "CONFLICT", message: "Academic history for this learner, year, and term already exists. Previous records are never overwritten." });
  const result = await db.insert(learnerAcademicHistory).values(input);
  const rows = await db.select().from(learnerAcademicHistory).where(eq(learnerAcademicHistory.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function saveOLevelResults(input: { learnerId: number; examinationYear: number; candidateNumber: string; centreNumber?: string | null; candidateName: string; subjects: Array<{ subjectId?: number | null; subjectName: string; grade: string; points?: number | null }> }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.subjects.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "At least one ZIMSEC subject result is required." });
  const existing = await db.select({ id: oLevelResults.id }).from(oLevelResults).where(and(eq(oLevelResults.learnerId, input.learnerId), eq(oLevelResults.examinationYear, input.examinationYear))).limit(1);
  if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "O-Level results for this learner and examination year already exist. Add a new examination year instead of overwriting the record." });
  const result = await db.insert(oLevelResults).values({ learnerId: input.learnerId, examinationYear: input.examinationYear, candidateNumber: input.candidateNumber, centreNumber: input.centreNumber ?? null, candidateName: input.candidateName, verificationStatus: "PENDING" });
  const resultId = Number(result[0].insertId);
  await db.insert(oLevelResultSubjects).values(input.subjects.map(subject => ({ resultId, subjectId: subject.subjectId ?? null, subjectName: subject.subjectName, grade: subject.grade, points: subject.points ?? null })));
  return (await db.select().from(oLevelResults).where(eq(oLevelResults.id, resultId)).limit(1))[0];
}

export async function saveALevelRequirement(input: { name: string; description?: string | null; minimumPoints?: number | null; minimumPasses?: number | null; subjects: Array<{ subjectId: number; minimumGrade?: string | null; isRequired: boolean }>; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.subjects.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Configure at least one A-Level subject in the requirement." });
  const result = await db.insert(aLevelRequirements).values({ name: input.name, description: input.description ?? null, minimumPoints: input.minimumPoints ?? null, minimumPasses: input.minimumPasses ?? null, isActive: true, createdByUserId: input.createdByUserId });
  const requirementId = Number(result[0].insertId);
  await db.insert(aLevelRequirementSubjects).values(input.subjects.map(subject => ({ requirementId, subjectId: subject.subjectId, minimumGrade: subject.minimumGrade ?? null, isRequired: subject.isRequired })));
  return (await db.select().from(aLevelRequirements).where(eq(aLevelRequirements.id, requirementId)).limit(1))[0];
}

export async function saveALevelApplication(input: { learnerId: number; academicYearId: number; oLevelResultId: number; requirementId?: number | null; preferredPathway: "A_LEVEL"; subjectIds: number[]; status?: (typeof applicationStatusValues)[number]; notes?: string | null }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.subjectIds.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Select an A-Level subject combination before saving the application." });
  const existing = await db.select({ id: aLevelApplications.id }).from(aLevelApplications).where(and(eq(aLevelApplications.learnerId, input.learnerId), eq(aLevelApplications.academicYearId, input.academicYearId))).limit(1);
  if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "This learner already has an A-Level application for the selected academic year." });
  const status = input.status ?? "DRAFT";
  const result = await db.insert(aLevelApplications).values({ learnerId: input.learnerId, academicYearId: input.academicYearId, oLevelResultId: input.oLevelResultId, requirementId: input.requirementId ?? null, preferredPathway: input.preferredPathway, applicationStatus: status, verificationStatus: status === "SUBMITTED" ? "PENDING" : "NOT_STARTED", selectionDecision: "PENDING", admissionDecision: "PENDING", submittedAt: status === "SUBMITTED" ? new Date() : null, notes: input.notes ?? null });
  const applicationId = Number(result[0].insertId);
  const selectedSubjects = await db.select({ id: subjects.id, name: subjects.name }).from(subjects);
  const subjectRows = input.subjectIds.map(subjectId => ({ applicationId, subjectId, subjectName: selectedSubjects.find(subject => subject.id === subjectId)?.name ?? `Subject ${subjectId}` }));
  await db.insert(aLevelApplicationSubjects).values(subjectRows);
  return (await db.select().from(aLevelApplications).where(eq(aLevelApplications.id, applicationId)).limit(1))[0];
}

export async function updateALevelApplication(input: { applicationId: number; applicationStatus?: (typeof applicationStatusValues)[number]; verificationStatus?: (typeof verificationStatusValues)[number]; selectionDecision?: (typeof decisionStatusValues)[number]; admissionDecision?: (typeof decisionStatusValues)[number]; reviewedByUserId: number; notes?: string | null }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const current = await db.select().from(aLevelApplications).where(eq(aLevelApplications.id, input.applicationId)).limit(1);
  if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "A-Level application not found." });
  const nextStatus = input.applicationStatus ?? current[0].applicationStatus;
  validateALevelAdmissionReview({ applicationStatus: nextStatus, verificationStatus: input.verificationStatus ?? current[0].verificationStatus, selectionDecision: input.selectionDecision ?? current[0].selectionDecision });
  await db.update(aLevelApplications).set({ applicationStatus: nextStatus, verificationStatus: input.verificationStatus ?? current[0].verificationStatus, selectionDecision: input.selectionDecision ?? current[0].selectionDecision, admissionDecision: input.admissionDecision ?? current[0].admissionDecision, reviewedByUserId: input.reviewedByUserId, reviewedAt: new Date(), notes: input.notes ?? current[0].notes }).where(eq(aLevelApplications.id, input.applicationId));
  return (await db.select().from(aLevelApplications).where(eq(aLevelApplications.id, input.applicationId)).limit(1))[0];
}

export async function explicitlyEnrolForm5(input: { applicationId: number; academicYearId: number; termId: number; classId?: number | null; recordedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const rows = await db.select().from(aLevelApplications).where(eq(aLevelApplications.id, input.applicationId)).limit(1);
  const application = rows[0];
  if (!application || !canExplicitlyEnrolForm5(application)) throw new TRPCError({ code: "BAD_REQUEST", message: "Only an accepted application with an explicit admission decision can create Form 5 enrolment." });
  const form5 = await db.select().from(forms).where(and(eq(forms.formNumber, 5), eq(forms.pathway, "A_LEVEL"))).limit(1);
  if (!form5[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Configure the A-Level Form 5 record before enrolment." });
  const previous = await db.select().from(learnerAcademicHistory).where(eq(learnerAcademicHistory.learnerId, application.learnerId)).orderBy(desc(learnerAcademicHistory.createdAt)).limit(1);
  return recordAcademicHistory({ learnerId: application.learnerId, academicYearId: input.academicYearId, termId: input.termId, formId: form5[0].id, classId: input.classId ?? null, pathway: "A_LEVEL", progressionType: "A_LEVEL_ADMISSION", previousHistoryId: previous[0]?.id ?? null, recordedByUserId: input.recordedByUserId, notes: "Explicitly enrolled after A-Level admission decision." });
}

export async function progressToForm6(input: { learnerId: number; academicYearId: number; termId: number; classId?: number | null; recordedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const previous = await db.select().from(learnerAcademicHistory).where(eq(learnerAcademicHistory.learnerId, input.learnerId)).orderBy(desc(learnerAcademicHistory.createdAt)).limit(1);
  if (!previous[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "The learner has no academic history." });
  const previousForm = await db.select().from(forms).where(eq(forms.id, previous[0].formId)).limit(1);
  if (previousForm[0]?.formNumber !== 5 || previous[0].pathway !== "A_LEVEL") throw new TRPCError({ code: "BAD_REQUEST", message: "Form 6 progression requires the learner's current academic record to be Form 5 on the A-Level pathway." });
  const form6 = await db.select().from(forms).where(and(eq(forms.formNumber, 6), eq(forms.pathway, "A_LEVEL"))).limit(1);
  if (!form6[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Configure the A-Level Form 6 record before progression." });
  return recordAcademicHistory({ learnerId: input.learnerId, academicYearId: input.academicYearId, termId: input.termId, formId: form6[0].id, classId: input.classId ?? null, pathway: "A_LEVEL", progressionType: "A_LEVEL_CONTINUATION", previousHistoryId: previous[0].id, recordedByUserId: input.recordedByUserId, notes: "Explicit Form 5 to Form 6 progression." });
}

export async function getPortalAcademicStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const learnerRows = await db.select().from(learners).where(eq(learners.userId, userId)).limit(1);
  let learner = learnerRows[0];
  if (!learner) {
    const guardianRows = await db.select({ learnerId: learnerGuardians.learnerId }).from(guardianContacts).innerJoin(learnerGuardians, eq(learnerGuardians.guardianId, guardianContacts.id)).where(eq(guardianContacts.userId, userId)).limit(1);
    if (guardianRows[0]) learner = (await db.select().from(learners).where(eq(learners.id, guardianRows[0].learnerId)).limit(1))[0];
  }
  if (!learner) return null;
  const history = await db.select().from(learnerAcademicHistory).where(eq(learnerAcademicHistory.learnerId, learner.id)).orderBy(desc(learnerAcademicHistory.createdAt)).limit(1);
  const current = history[0];
  const year = current ? (await db.select().from(academicYears).where(eq(academicYears.id, current.academicYearId)).limit(1))[0] : null;
  const term = current ? (await db.select().from(academicTerms).where(eq(academicTerms.id, current.termId)).limit(1))[0] : null;
  const form = current ? (await db.select().from(forms).where(eq(forms.id, current.formId)).limit(1))[0] : null;
  const application = (await db.select().from(aLevelApplications).where(eq(aLevelApplications.learnerId, learner.id)).orderBy(desc(aLevelApplications.createdAt)).limit(1))[0] ?? null;
  const result = application ? (await db.select().from(oLevelResults).where(eq(oLevelResults.id, application.oLevelResultId)).limit(1))[0] : null;
  return { learner, currentHistory: current ?? null, academicYear: year ?? null, term: term ?? null, form: form ?? null, application, oLevelResult: result };
}
