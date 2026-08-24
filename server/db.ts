import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  academicTerms,
  academicYears,
  classes,
  departments,
  forms,
  houses,
  permissions,
  rolePermissions,
  rooms,
  schoolDocuments,
  schoolProfiles,
  staff,
  staffRoles,
  staffRoleAssignments,
  subjects,
  teacherAssignments,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getFoundationData() {
  const db = await getDb();
  if (!db) return null;
  const [profile, years, terms, formRows, classRows, houseRows, subjectRows, departmentRows, roomRows, staffRows, roleRows, permissionRows, rolePermissionRows, assignmentRows] = await Promise.all([
    db.select().from(schoolProfiles).limit(1),
    db.select().from(academicYears).orderBy(desc(academicYears.startDate)),
    db.select().from(academicTerms).orderBy(asc(academicTerms.academicYearId), asc(academicTerms.termNumber)),
    db.select().from(forms).orderBy(asc(forms.formNumber)),
    db.select().from(classes).orderBy(asc(classes.formId), asc(classes.name)),
    db.select().from(houses).orderBy(asc(houses.name)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db.select().from(departments).orderBy(asc(departments.name)),
    db.select().from(roomRowsSafe(rooms)).orderBy(asc(rooms.name)),
    db.select().from(staff).orderBy(asc(staff.lastName), asc(staff.firstName)),
    db.select().from(staffRoles).orderBy(asc(staffRoles.name)),
    db.select().from(permissions).orderBy(asc(permissions.name)),
    db.select().from(rolePermissions),
    db.select().from(teacherAssignments).orderBy(desc(teacherAssignments.id)),
  ]);
  return {
    profile: profile[0] ?? null,
    academicYears: years,
    academicTerms: terms,
    forms: formRows,
    classes: classRows,
    houses: houseRows,
    subjects: subjectRows,
    departments: departmentRows,
    rooms: roomRows,
    staff: staffRows,
    staffRoles: roleRows,
    permissions: permissionRows,
    rolePermissions: rolePermissionRows,
    teacherAssignments: assignmentRows,
  };
}

function roomRowsSafe<T>(table: T): T {
  return table;
}

export async function saveSchoolProfile(input: typeof schoolProfiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select({ id: schoolProfiles.id }).from(schoolProfiles).limit(1);
  if (existing[0]) {
    await db.update(schoolProfiles).set(input).where(eq(schoolProfiles.id, existing[0].id));
    const updated = await db.select().from(schoolProfiles).where(eq(schoolProfiles.id, existing[0].id)).limit(1);
    return updated[0];
  }
  const inserted = await db.insert(schoolProfiles).values(input);
  const created = await db.select().from(schoolProfiles).where(eq(schoolProfiles.id, Number(inserted[0].insertId))).limit(1);
  return created[0];
}

export async function addSchoolDocument(input: typeof schoolDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(schoolDocuments).values(input);
  const rows = await db.select().from(schoolDocuments).where(eq(schoolDocuments.id, Number(result[0].insertId))).limit(1);
  return rows[0];
}

export async function getSchoolDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schoolDocuments).orderBy(desc(schoolDocuments.createdAt));
}

export async function userHasPermission(userId: number, permissionCode: string, action: "canView" | "canCreate" | "canEdit" | "canDelete") {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ allowed: rolePermissions[action] })
    .from(staff)
    .innerJoin(staffRoleAssignments, eq(staffRoleAssignments.staffId, staff.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, staffRoleAssignments.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(staff.userId, userId), eq(permissions.code, permissionCode)))
    .limit(1);
  return Boolean(rows[0]?.allowed);
}

export async function getRolePermission(roleCode: string, permissionCode: string, action: "canView" | "canCreate" | "canEdit" | "canDelete") {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ allowed: rolePermissions[action] })
    .from(rolePermissions)
    .innerJoin(staffRoles, eq(rolePermissions.roleId, staffRoles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(staffRoles.code, roleCode), eq(permissions.code, permissionCode)))
    .limit(1);
  return Boolean(rows[0]?.allowed);
}
