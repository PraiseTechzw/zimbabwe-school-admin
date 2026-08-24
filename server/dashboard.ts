import { and, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  classes,
  departments,
  guardianContacts,
  learnerGuardians,
  learners,
  permissions,
  rolePermissions,
  staff,
  staffRoleAssignments,
  staffRoles,
  teacherAssignments,
} from "../drizzle/schema";
import { getDb } from "./db";

const roleAliases: Record<
  string,
  {
    title: string;
    summary: string;
    paths: Array<{ label: string; path: string }>;
  }
> = {
  HEADTEACHER: {
    title: "Headteacher dashboard",
    summary:
      "Whole-school performance, approvals, safeguarding visibility, and executive reporting.",
    paths: [
      {
        label: "Reports, audit & system health",
        path: "/production-readiness",
      },
      { label: "Timetable & daily operations", path: "/timetable" },
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "School finance", path: "/finance" },
    ],
  },
  DEPUTY_HEAD: {
    title: "Deputy Head dashboard",
    summary:
      "Daily operations, attendance, discipline, timetable, and operational alerts.",
    paths: [
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "Timetable & daily operations", path: "/timetable" },
      { label: "Learner academic history", path: "/academic" },
    ],
  },
  SENIOR_MASTER: {
    title: "Senior Master dashboard",
    summary:
      "Whole-school attendance, learner movement, duties, timetable, and school activities.",
    paths: [
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  SENIOR_TEACHER: {
    title: "Senior Teacher dashboard",
    summary:
      "Whole-school attendance, learner movement, duties, timetable, and school activities.",
    paths: [
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  HOD: {
    title: "Head of Department dashboard",
    summary:
      "Department teachers, subjects, classes, marks, SBPs, moderation, and department performance.",
    paths: [
      { label: "Learner academic history", path: "/academic" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  CLASS_TEACHER: {
    title: "Class Teacher dashboard",
    summary:
      "Assigned class register, attendance, learner performance, welfare alerts, contacts, and class reports.",
    paths: [
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "Learner academic history", path: "/academic" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  SUBJECT_TEACHER: {
    title: "Subject Teacher dashboard",
    summary:
      "Assigned subjects and classes, timetable, marks, SBPs, assignments, and teacher notices.",
    paths: [
      { label: "Learner academic history", path: "/academic" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  TEACHER: {
    title: "Teacher dashboard",
    summary:
      "Assigned classes, subjects, timetable, attendance, assessment, and learner support.",
    paths: [
      { label: "Learner academic history", path: "/academic" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  BURSAR: {
    title: "Bursar dashboard",
    summary:
      "Collections, invoices, receipts, arrears, assistance, reconciliation, and financial reports.",
    paths: [{ label: "School finance", path: "/finance" }],
  },
  FINANCE_OFFICER: {
    title: "Finance Officer dashboard",
    summary:
      "Collections, invoices, receipts, arrears, assistance, reconciliation, and financial reports.",
    paths: [{ label: "School finance", path: "/finance" }],
  },
  ADMISSIONS_OFFICER: {
    title: "Admissions dashboard",
    summary:
      "Applications, document verification, decisions, offers, enrolments, and registration status.",
    paths: [{ label: "Learner academic history", path: "/academic" }],
  },
  EXAMINATION_OFFICER: {
    title: "Examination Officer dashboard",
    summary:
      "Examination entries, ZIMSEC candidates, missing marks, moderation, verification, and results.",
    paths: [
      { label: "Learner academic history", path: "/academic" },
      { label: "Timetable & daily operations", path: "/timetable" },
    ],
  },
  HOUSEMASTER: {
    title: "Housemaster / Housemistress dashboard",
    summary:
      "Boarders, houses, roll calls, exeats, boarding discipline, and welfare.",
    paths: [
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "Learner & guardian portal", path: "/portal" },
    ],
  },
  HOUSEMISTRESS: {
    title: "Housemaster / Housemistress dashboard",
    summary:
      "Boarders, houses, roll calls, exeats, boarding discipline, and welfare.",
    paths: [
      { label: "Attendance & learner welfare", path: "/welfare" },
      { label: "Learner & guardian portal", path: "/portal" },
    ],
  },
  COUNSELLOR: {
    title: "Counsellor / Welfare Officer dashboard",
    summary:
      "Authorized learner support, counselling, welfare, and safeguarding follow-up.",
    paths: [{ label: "Attendance & learner welfare", path: "/welfare" }],
  },
  WELFARE_OFFICER: {
    title: "Counsellor / Welfare Officer dashboard",
    summary:
      "Authorized learner support, counselling, welfare, and safeguarding follow-up.",
    paths: [{ label: "Attendance & learner welfare", path: "/welfare" }],
  },
  SECRETARY: {
    title: "School Secretary dashboard",
    summary:
      "Learner records, admissions, documents, calendar, notices, and administrative reports.",
    paths: [
      { label: "Learner academic history", path: "/academic" },
      { label: "Learner & guardian portal", path: "/portal" },
    ],
  },
  SCHOOL_ADMINISTRATOR: {
    title: "School Administrator dashboard",
    summary:
      "Learner records, admissions, documents, calendar, notices, and administrative reports.",
    paths: [
      { label: "Learner academic history", path: "/academic" },
      { label: "Learner & guardian portal", path: "/portal" },
    ],
  },
};

export function getRoleProfile(roleCodes: string[]) {
  const role = roleCodes.find(code => roleAliases[code]) || "TEACHER";
  return roleAliases[role];
}

export async function getRoleDashboard(
  userId: number,
  isAdministrator = false
) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  if (isAdministrator) {
    const [learnerCount, staffCount] = await Promise.all([
      db.select({ id: learners.id }).from(learners),
      db.select({ id: staff.id }).from(staff),
    ]);
    return {
      roleCodes: ["ADMINISTRATOR", "HEADTEACHER"],
      title: "Headteacher and administrator dashboard",
      summary:
        "Whole-school performance, approvals, security, and executive reporting.",
      audience: "STAFF",
      permissions: ["ALL_ADMINISTRATOR_PERMISSIONS"],
      assignedClassIds: [],
      assignedSubjectIds: [],
      assignedDepartmentIds: [],
      linkedLearnerIds: [],
      counts: { learners: learnerCount.length, staff: staffCount.length },
      navigation: [
        {
          label: "Reports, audit & system health",
          path: "/production-readiness",
        },
        { label: "Learner academic history", path: "/academic" },
        { label: "Attendance & learner welfare", path: "/welfare" },
        { label: "School finance", path: "/finance" },
        { label: "Timetable & daily operations", path: "/timetable" },
      ],
    };
  }
  const [staffRows, learnerRows, guardianRows] = await Promise.all([
    db.select({ id: staff.id }).from(staff).where(and(eq(staff.userId, userId), eq(staff.status, "ACTIVE"))),
    db
      .select({ id: learners.id })
      .from(learners)
      .where(eq(learners.userId, userId)),
    db
      .select({ id: guardianContacts.id })
      .from(guardianContacts)
      .where(eq(guardianContacts.userId, userId)),
  ]);
  if (learnerRows.length)
    return {
      roleCodes: ["LEARNER"],
      title: "Learner portal",
      summary:
        "Your official registration, academic identity, results, attendance, timetable, fees, and school services.",
      audience: "LEARNER",
      permissions: [],
      assignedClassIds: [],
      assignedSubjectIds: [],
      assignedDepartmentIds: [],
      linkedLearnerIds: learnerRows.map(row => row.id),
      counts: { learners: 1, staff: 0 },
      navigation: [{ label: "Learner & guardian portal", path: "/portal" }],
    };
  if (guardianRows.length) {
    const links = await db
      .select({ learnerId: learnerGuardians.learnerId })
      .from(learnerGuardians)
      .where(
        inArray(
          learnerGuardians.guardianId,
          guardianRows.map(row => row.id)
        )
      );
    return {
      roleCodes: ["GUARDIAN"],
      title: "Guardian portal",
      summary:
        "Switch between your linked children and view their official school records.",
      audience: "GUARDIAN",
      permissions: [],
      assignedClassIds: [],
      assignedSubjectIds: [],
      assignedDepartmentIds: [],
      linkedLearnerIds: links.map(row => row.learnerId),
      counts: { learners: links.length, staff: 0 },
      navigation: [{ label: "Learner & guardian portal", path: "/portal" }],
    };
  }
  if (!staffRows.length)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No school dashboard is assigned to this account.",
    });
  const staffIds = staffRows.map(row => row.id);
  const [roleRows, assignmentRows, permissionRows, departmentRows] =
    await Promise.all([
      db
        .select({ code: staffRoles.code })
        .from(staffRoleAssignments)
        .innerJoin(staffRoles, eq(staffRoles.id, staffRoleAssignments.roleId))
        .where(and(inArray(staffRoleAssignments.staffId, staffIds), eq(staffRoles.isActive, true), lte(staffRoleAssignments.effectiveFrom, new Date()), or(isNull(staffRoleAssignments.effectiveTo), gt(staffRoleAssignments.effectiveTo, new Date())))),
      db
        .select({
          classId: teacherAssignments.classId,
          subjectId: teacherAssignments.subjectId,
        })
        .from(teacherAssignments)
        .where(inArray(teacherAssignments.teacherStaffId, staffIds)),
      db
        .select({ name: permissions.name })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(permissions.id, rolePermissions.permissionId)
        )
        .innerJoin(
          staffRoleAssignments,
          eq(staffRoleAssignments.roleId, rolePermissions.roleId)
        )
        .innerJoin(staffRoles, eq(staffRoles.id, staffRoleAssignments.roleId))
        .where(and(inArray(staffRoleAssignments.staffId, staffIds), eq(staffRoles.isActive, true), lte(staffRoleAssignments.effectiveFrom, new Date()), or(isNull(staffRoleAssignments.effectiveTo), gt(staffRoleAssignments.effectiveTo, new Date())))),
      db
        .select({ id: departments.id })
        .from(departments)
        .where(inArray(departments.hodStaffId, staffIds)),
    ]);
  const roleCodes = Array.from(new Set(roleRows.map(row => row.code)));
  const profile = getRoleProfile(roleCodes);
  const classIds = Array.from(new Set(assignmentRows.map(row => row.classId)));
  const subjectIds = Array.from(
    new Set(assignmentRows.map(row => row.subjectId))
  );
  return {
    roleCodes,
    title: profile.title,
    summary: profile.summary,
    audience: "STAFF",
    permissions: Array.from(new Set(permissionRows.map(row => row.name))),
    assignedClassIds: classIds,
    assignedSubjectIds: subjectIds,
    assignedDepartmentIds: departmentRows.map(row => row.id),
    linkedLearnerIds: [],
    counts: { learners: 0, staff: staffIds.length },
    navigation: profile.paths,
  };
}
