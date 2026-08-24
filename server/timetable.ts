import { and, asc, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  academicTerms,
  academicYears,
  classes,
  guardianContacts,
  learnerAcademicHistory,
  learnerGuardians,
  learners,
  rooms,
  schoolEvents,
  staff,
  staffRoleAssignments,
  staffRoles,
  subjects,
  timetableEntries,
} from "../drizzle/schema";
import { getDb } from "./db";

export type TimetableDraft = {
  academicYearId: number;
  termId?: number | null;
  classId?: number | null;
  teacherStaffId?: number | null;
  subjectId?: number | null;
  roomId?: number | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  entryType: "LESSON" | "ASSEMBLY" | "EXAMINATION" | "EVENT";
  title: string;
  isLaboratory?: boolean;
  isRecurring?: boolean;
  notes?: string | null;
};
export type ClashCandidate = TimetableDraft & { id?: number };

const dayOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const asMinutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};
export function validateTimeRange(startTime: string, endTime: string) {
  return (
    /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) &&
    asMinutes(startTime) < asMinutes(endTime)
  );
}
export function detectTimetableClashes(
  candidate: ClashCandidate,
  existing: ClashCandidate[]
) {
  if (!validateTimeRange(candidate.startTime, candidate.endTime))
    return [
      {
        type: "TIME_RANGE",
        message: "The timetable start time must be before the end time.",
      },
    ];
  return existing
    .filter(
      entry =>
        entry.id !== candidate.id &&
        entry.academicYearId === candidate.academicYearId &&
        entry.termId === candidate.termId &&
        entry.dayOfWeek === candidate.dayOfWeek &&
        asMinutes(candidate.startTime) < asMinutes(entry.endTime) &&
        asMinutes(candidate.endTime) > asMinutes(entry.startTime) &&
        ((candidate.classId && candidate.classId === entry.classId) ||
          (candidate.teacherStaffId &&
            candidate.teacherStaffId === entry.teacherStaffId) ||
          (candidate.roomId && candidate.roomId === entry.roomId))
    )
    .map(entry => ({
      type:
        candidate.teacherStaffId === entry.teacherStaffId
          ? "TEACHER"
          : candidate.roomId === entry.roomId
            ? "ROOM"
            : "CLASS",
      entryId: entry.id,
      message: `Clash with ${entry.title} (${entry.startTime}–${entry.endTime}).`,
    }));
}
export function calculateTeacherWorkload(
  entries: Array<{
    teacherStaffId: number | null;
    startTime: string;
    endTime: string;
  }>
) {
  const totals = new Map<number, { periods: number; minutes: number }>();
  for (const entry of entries) {
    if (!entry.teacherStaffId) continue;
    const current = totals.get(entry.teacherStaffId) ?? {
      periods: 0,
      minutes: 0,
    };
    current.periods += 1;
    current.minutes += Math.max(
      0,
      asMinutes(entry.endTime) - asMinutes(entry.startTime)
    );
    totals.set(entry.teacherStaffId, current);
  }
  return Array.from(totals.entries()).map(([teacherStaffId, total]) => ({
    teacherStaffId,
    ...total,
    hours: Number((total.minutes / 60).toFixed(1)),
  }));
}

async function ensureDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  return db;
}

export async function createTimetableEntry(
  input: TimetableDraft & { createdByUserId: number }
) {
  const db = await ensureDb();
  if (
    !dayOrder.includes(input.dayOfWeek) ||
    !validateTimeRange(input.startTime, input.endTime)
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Use a valid weekday and a start time before the end time.",
    });
  if (input.isLaboratory && input.roomId) {
    const room = (
      await db.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1)
    )[0];
    if (!room || room.roomType !== "LABORATORY")
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Laboratory lessons must use a laboratory room.",
      });
  }
  const existing = await db
    .select()
    .from(timetableEntries)
    .where(
      and(
        eq(timetableEntries.academicYearId, input.academicYearId),
        eq(timetableEntries.dayOfWeek, input.dayOfWeek),
        input.termId
          ? eq(timetableEntries.termId, input.termId)
          : eq(timetableEntries.academicYearId, input.academicYearId)
      )
    );
  const clashes = detectTimetableClashes(input, existing);
  if (clashes.length)
    throw new TRPCError({
      code: "CONFLICT",
      message: clashes.map(clash => clash.message).join(" "),
    });
  const result = await db
    .insert(timetableEntries)
    .values({
      ...input,
      termId: input.termId ?? null,
      classId: input.classId ?? null,
      teacherStaffId: input.teacherStaffId ?? null,
      subjectId: input.subjectId ?? null,
      roomId: input.roomId ?? null,
      isLaboratory: input.isLaboratory ?? false,
      isRecurring: input.isRecurring ?? true,
      notes: input.notes ?? null,
    });
  return (
    await db
      .select()
      .from(timetableEntries)
      .where(eq(timetableEntries.id, Number(result[0].insertId)))
      .limit(1)
  )[0];
}

export async function createSchoolEvent(input: {
  academicYearId: number;
  termId?: number | null;
  eventType:
    | "ASSEMBLY"
    | "EXAMINATION"
    | "SCHOOL_EVENT"
    | "SPORTS_EVENT"
    | "CONSULTATION_DAY"
    | "SPEECH_DAY";
  visibility: "HEADTEACHER" | "STAFF" | "LEARNERS_GUARDIANS" | "ALL";
  title: string;
  startAt: Date;
  endAt: Date;
  roomId?: number | null;
  description?: string | null;
  isRecurring?: boolean;
  createdByUserId: number;
}) {
  const db = await ensureDb();
  if (input.startAt >= input.endAt)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Event start must be before event end.",
    });
  const result = await db
    .insert(schoolEvents)
    .values({
      ...input,
      termId: input.termId ?? null,
      roomId: input.roomId ?? null,
      description: input.description ?? null,
      isRecurring: input.isRecurring ?? false,
    });
  return (
    await db
      .select()
      .from(schoolEvents)
      .where(eq(schoolEvents.id, Number(result[0].insertId)))
      .limit(1)
  )[0];
}

async function idsForUser(
  userId: number,
  view: "HEADTEACHER" | "TEACHER" | "LEARNER" | "GUARDIAN"
) {
  const db = await ensureDb();
  if (view === "TEACHER") {
    const rows = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.status, "ACTIVE")));
    return {
      teacherIds: rows.map(row => row.id),
      classIds: [],
      learnerIds: [],
    };
  }
  if (view === "LEARNER") {
    const learnerRows = await db
      .select({ id: learners.id })
      .from(learners)
      .where(eq(learners.userId, userId));
    const learnerIds = learnerRows.map(row => row.id);
    const histories = learnerIds.length
      ? await db
          .select({ classId: learnerAcademicHistory.classId })
          .from(learnerAcademicHistory)
          .where(inArray(learnerAcademicHistory.learnerId, learnerIds))
      : [];
    return {
      teacherIds: [],
      classIds: histories.flatMap(row => (row.classId ? [row.classId] : [])),
      learnerIds,
    };
  }
  if (view === "GUARDIAN") {
    const guardianRows = await db
      .select({ id: guardianContacts.id })
      .from(guardianContacts)
      .where(eq(guardianContacts.userId, userId));
    const guardianIds = guardianRows.map(row => row.id);
    const links = guardianIds.length
      ? await db
          .select({ learnerId: learnerGuardians.learnerId })
          .from(learnerGuardians)
          .where(inArray(learnerGuardians.guardianId, guardianIds))
      : [];
    const learnerIds = links.map(row => row.learnerId);
    const histories = learnerIds.length
      ? await db
          .select({ classId: learnerAcademicHistory.classId })
          .from(learnerAcademicHistory)
          .where(inArray(learnerAcademicHistory.learnerId, learnerIds))
      : [];
    return {
      teacherIds: [],
      classIds: histories.flatMap(row => (row.classId ? [row.classId] : [])),
      learnerIds,
    };
  }
  return { teacherIds: [], classIds: [], learnerIds: [] };
}

export async function getTimetableView(
  userId: number,
  view: "HEADTEACHER" | "TEACHER" | "LEARNER" | "GUARDIAN",
  isAdministrator = false
) {
  const db = await ensureDb();
  let isHeadteacher = isAdministrator;
  if (view === "HEADTEACHER" && !isAdministrator) {
    const headteacher = await db
      .select({ id: staff.id })
      .from(staff)
      .innerJoin(
        staffRoleAssignments,
        eq(staffRoleAssignments.staffId, staff.id)
      )
      .innerJoin(staffRoles, eq(staffRoles.id, staffRoleAssignments.roleId))
      .where(
        and(
          eq(staff.userId, userId),
          eq(staff.status, "ACTIVE"),
          eq(staffRoles.isActive, true),
          inArray(staffRoles.code, ["HEADTEACHER", "HEAD", "PRINCIPAL"]),
          lte(staffRoleAssignments.effectiveFrom, new Date()),
          or(
            isNull(staffRoleAssignments.effectiveTo),
            gt(staffRoleAssignments.effectiveTo, new Date())
          )
        )
      )
      .limit(1);
    isHeadteacher = Boolean(headteacher[0]);
  }
  if (view === "HEADTEACHER" && !isHeadteacher)
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Only the Headteacher or an administrator may view the whole school timetable.",
    });
  const scope = await idsForUser(userId, view);
  const entries =
    view === "HEADTEACHER" || isAdministrator
      ? await db
          .select()
          .from(timetableEntries)
          .orderBy(
            asc(timetableEntries.dayOfWeek),
            asc(timetableEntries.startTime)
          )
      : view === "TEACHER"
        ? await db
            .select()
            .from(timetableEntries)
            .where(inArray(timetableEntries.teacherStaffId, scope.teacherIds))
            .orderBy(
              asc(timetableEntries.dayOfWeek),
              asc(timetableEntries.startTime)
            )
        : await db
            .select()
            .from(timetableEntries)
            .where(inArray(timetableEntries.classId, scope.classIds))
            .orderBy(
              asc(timetableEntries.dayOfWeek),
              asc(timetableEntries.startTime)
            );
  const events =
    view === "HEADTEACHER" || isAdministrator
      ? await db.select().from(schoolEvents).orderBy(desc(schoolEvents.startAt))
      : await db
          .select()
          .from(schoolEvents)
          .where(
            inArray(
              schoolEvents.visibility,
              view === "TEACHER"
                ? ["STAFF", "ALL"]
                : ["LEARNERS_GUARDIANS", "ALL"]
            )
          )
          .orderBy(desc(schoolEvents.startAt));
  const workloads =
    view === "HEADTEACHER" || isAdministrator
      ? calculateTeacherWorkload(entries)
      : view === "TEACHER"
        ? calculateTeacherWorkload(entries)
        : [];
  return { view, entries, events, workloads, scope };
}

export async function getTimetableAdminData() {
  const db = await ensureDb();
  const [
    entries,
    events,
    years,
    terms,
    classesRows,
    subjectsRows,
    staffRows,
    roomsRows,
  ] = await Promise.all([
    db
      .select()
      .from(timetableEntries)
      .orderBy(
        asc(timetableEntries.dayOfWeek),
        asc(timetableEntries.startTime)
      ),
    db.select().from(schoolEvents).orderBy(desc(schoolEvents.startAt)),
    db.select().from(academicYears).orderBy(desc(academicYears.startDate)),
    db.select().from(academicTerms).orderBy(asc(academicTerms.termNumber)),
    db.select().from(classes).orderBy(asc(classes.name)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db.select().from(staff).orderBy(asc(staff.lastName)),
    db.select().from(rooms).orderBy(asc(rooms.name)),
  ]);
  return {
    entries,
    events,
    years,
    terms,
    classes: classesRows,
    subjects: subjectsRows,
    staff: staffRows,
    rooms: roomsRows,
    workloads: calculateTeacherWorkload(entries),
  };
}
