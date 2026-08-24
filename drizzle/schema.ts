import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const schoolProfiles = mysqlTable("school_profiles", {
  id: int("id").autoincrement().primaryKey(),
  schoolName: varchar("schoolName", { length: 180 }).notNull(),
  motto: varchar("motto", { length: 240 }),
  registrationNumber: varchar("registrationNumber", { length: 80 }).notNull(),
  registrationAuthority: varchar("registrationAuthority", { length: 120 }).default("MoPSE").notNull(),
  schoolType: mysqlEnum("schoolType", ["secondary"]).default("secondary").notNull(),
  logoKey: varchar("logoKey", { length: 500 }),
  logoUrl: varchar("logoUrl", { length: 700 }),
  primaryColour: varchar("primaryColour", { length: 20 }).default("#123B5D").notNull(),
  accentColour: varchar("accentColour", { length: 20 }).default("#C99A3E").notNull(),
  addressLine1: varchar("addressLine1", { length: 180 }).notNull(),
  addressLine2: varchar("addressLine2", { length: 180 }),
  town: varchar("town", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 80 }).default("Zimbabwe").notNull(),
  phone: varchar("phone", { length: 40 }),
  alternativePhone: varchar("alternativePhone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 320 }),
  headteacherName: varchar("headteacherName", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ registrationUnique: uniqueIndex("school_profile_registration_unique").on(table.registrationNumber) }));

export const academicYears = mysqlTable("academic_years", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 40 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isCurrent: boolean("isCurrent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ yearUnique: uniqueIndex("academic_year_name_unique").on(table.name) }));

export const academicTerms = mysqlTable("academic_terms", {
  id: int("id").autoincrement().primaryKey(),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termNumber: int("termNumber").notNull(),
  name: varchar("name", { length: 40 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isCurrent: boolean("isCurrent").default(false).notNull(),
}, (table) => ({ termUnique: uniqueIndex("academic_term_year_number_unique").on(table.academicYearId, table.termNumber) }));

export const pathways = mysqlEnum("pathway", ["O_LEVEL", "A_LEVEL"]);

export const forms = mysqlTable("forms", {
  id: int("id").autoincrement().primaryKey(),
  formNumber: int("formNumber").notNull(),
  pathway: pathways.notNull(),
  label: varchar("label", { length: 40 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ formUnique: uniqueIndex("form_number_unique").on(table.formNumber) }));

export const houses = mysqlTable("houses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  colour: varchar("colour", { length: 20 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ houseUnique: uniqueIndex("house_name_unique").on(table.name) }));

export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull().references(() => forms.id),
  name: varchar("name", { length: 80 }).notNull(),
  streamName: varchar("streamName", { length: 80 }),
  attendanceMode: mysqlEnum("attendanceMode", ["DAY_SCHOLAR", "BOARDING", "MIXED"]).default("MIXED").notNull(),
  roomId: int("roomId").references(() => rooms.id),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ classUnique: uniqueIndex("class_form_stream_unique").on(table.formId, table.name, table.streamName) }));

export const departments = mysqlTable("school_departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 30 }).notNull(),
  description: text("description"),
  hodStaffId: int("hodStaffId"),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ departmentCodeUnique: uniqueIndex("school_department_code_unique").on(table.code) }));

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  code: varchar("code", { length: 30 }).notNull(),
  pathway: pathways,
  departmentId: int("departmentId").references(() => departments.id),
  isCore: boolean("isCore").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ subjectCodeUnique: uniqueIndex("subject_code_unique").on(table.code) }));

export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  roomType: mysqlEnum("roomType", ["CLASSROOM", "LABORATORY", "OFFICE", "LIBRARY", "HALL", "OTHER"]).default("CLASSROOM").notNull(),
  capacity: int("capacity"),
  building: varchar("building", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ roomNameUnique: uniqueIndex("room_name_unique").on(table.name) }));

export const staffRoles = mysqlTable("staff_roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 40 }).notNull(),
  description: text("description"),
  isSystemRole: boolean("isSystemRole").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
}, (table) => ({ roleCodeUnique: uniqueIndex("staff_role_code_unique").on(table.code) }));

export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  staffNumber: varchar("staffNumber", { length: 60 }).notNull(),
  firstName: varchar("firstName", { length: 80 }).notNull(),
  lastName: varchar("lastName", { length: 80 }).notNull(),
  nationalId: varchar("nationalId", { length: 40 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  employmentType: mysqlEnum("employmentType", ["PERMANENT", "TEMPORARY", "RELIEF", "VOLUNTEER"]).default("PERMANENT").notNull(),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE", "ON_LEAVE"]).default("ACTIVE").notNull(),
  joinedOn: timestamp("joinedOn"),
  notes: text("notes"),
}, (table) => ({ staffNumberUnique: uniqueIndex("staff_number_unique").on(table.staffNumber) }));

export const staffRoleAssignments = mysqlTable("staff_role_assignments", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull().references(() => staff.id),
  roleId: int("roleId").notNull().references(() => staffRoles.id),
  effectiveFrom: timestamp("effectiveFrom").defaultNow().notNull(),
  effectiveTo: timestamp("effectiveTo"),
}, (table) => ({ assignmentUnique: uniqueIndex("staff_role_assignment_unique").on(table.staffId, table.roleId) }));

export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description"),
}, (table) => ({ permissionCodeUnique: uniqueIndex("permission_code_unique").on(table.code) }));

export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull().references(() => staffRoles.id),
  permissionId: int("permissionId").notNull().references(() => permissions.id),
  canView: boolean("canView").default(true).notNull(),
  canCreate: boolean("canCreate").default(false).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  canDelete: boolean("canDelete").default(false).notNull(),
}, (table) => ({ rolePermissionUnique: uniqueIndex("role_permission_unique").on(table.roleId, table.permissionId) }));

export const teacherAssignments = mysqlTable("teacher_assignments", {
  id: int("id").autoincrement().primaryKey(),
  teacherStaffId: int("teacherStaffId").notNull().references(() => staff.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  classId: int("classId").notNull().references(() => classes.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").references(() => academicTerms.id),
  isPrimaryTeacher: boolean("isPrimaryTeacher").default(false).notNull(),
}, (table) => ({ teacherAssignmentUnique: uniqueIndex("teacher_subject_class_year_unique").on(table.teacherStaffId, table.subjectId, table.classId, table.academicYearId, table.termId) }));

export const schoolDocuments = mysqlTable("school_documents", {
  id: int("id").autoincrement().primaryKey(),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  title: varchar("title", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["SCHOOL_PROFILE", "POLICY", "ADMINISTRATION", "OTHER"]).default("ADMINISTRATION").notNull(),
  storageKey: varchar("storageKey", { length: 600 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 800 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SchoolProfile = typeof schoolProfiles.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type AcademicTerm = typeof academicTerms.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type House = typeof houses.$inferSelect;
export type SchoolClass = typeof classes.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type StaffRole = typeof staffRoles.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type SchoolDocument = typeof schoolDocuments.$inferSelect;
