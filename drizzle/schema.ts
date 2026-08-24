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

export const registrationStatuses = mysqlEnum("registrationStatus", ["ACTIVE", "INACTIVE", "WITHDRAWN", "COMPLETED"]);
export const applicationStatuses = mysqlEnum("applicationStatus", ["NOT_STARTED", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "RESULTS_VERIFICATION", "ACCEPTED", "CONDITIONALLY_ACCEPTED", "REJECTED", "WITHDRAWN"]);
export const verificationStatuses = mysqlEnum("verificationStatus", ["NOT_STARTED", "PENDING", "VERIFIED", "FAILED"]);
const decisionStatusValues = ["PENDING", "SELECTED", "NOT_SELECTED", "ADMITTED", "NOT_ADMITTED"] as const;
export const progressionTypes = mysqlEnum("progressionType", ["NORMAL_SECONDARY", "A_LEVEL_ADMISSION", "A_LEVEL_CONTINUATION"]);
export const feeFrequencies = mysqlEnum("feeFrequency", ["ONCE", "TERM", "ANNUAL"]);
export const invoiceStatuses = mysqlEnum("invoiceStatus", ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID", "OVERDUE"]);
export const paymentMethods = mysqlEnum("paymentMethod", ["CASH", "BANK_TRANSFER", "ECOCASH", "ZIPIT", "INNBUCKS", "PAYNOW", "CARD", "OTHER"]);
export const residencyTypes = mysqlEnum("residencyType", ["BOARDING", "DAY_SCHOLAR", "ALL"]);
export const chargeStatuses = mysqlEnum("chargeStatus", ["DRAFT", "SUBMITTED", "APPROVED", "RETIRED"]);
export const assistanceTypes = mysqlEnum("assistanceType", ["SCHOLARSHIP", "BEAM"]);
export const assistanceStatuses = mysqlEnum("assistanceStatus", ["PENDING", "APPROVED", "DECLINED", "EXPIRED"]);
export const reconciliationStatuses = mysqlEnum("reconciliationStatus", ["UNMATCHED", "MATCHED", "EXCEPTION", "REVERSED"]);
export const timetableEntryTypes = mysqlEnum("timetableEntryType", ["LESSON", "ASSEMBLY", "EXAMINATION", "EVENT"]);
export const eventTypes = mysqlEnum("eventType", ["ASSEMBLY", "EXAMINATION", "SCHOOL_EVENT", "SPORTS_EVENT", "CONSULTATION_DAY", "SPEECH_DAY"]);
export const eventVisibility = mysqlEnum("eventVisibility", ["HEADTEACHER", "STAFF", "LEARNERS_GUARDIANS", "ALL"]);
export const portalAssignmentStatuses = mysqlEnum("portalAssignmentStatus", ["ASSIGNED", "SUBMITTED", "GRADED", "OVERDUE"]);
export const noticeAudiences = mysqlEnum("noticeAudience", ["ALL", "LEARNERS", "GUARDIANS", "STAFF"]);
export const paymentStatuses = mysqlEnum("paymentStatus", ["PENDING", "CONFIRMED", "REVERSED"]);
export const attendanceModes = mysqlEnum("attendanceMode", ["DAILY", "PERIOD", "BOARDING_ROLL_CALL"]);
export const attendanceStatuses = mysqlEnum("attendanceStatus", ["PRESENT", "ABSENT", "LATE", "EXCUSED"]);
export const disciplineIncidentStatuses = mysqlEnum("disciplineIncidentStatus", ["OPEN", "RESOLVED", "REFERRED"]);
export const disciplineActionTypes = mysqlEnum("disciplineActionType", ["NONE", "DEMERIT", "DETENTION", "SUSPENSION"]);
export const welfareCaseStatuses = mysqlEnum("welfareCaseStatus", ["OPEN", "ON_HOLD", "CLOSED"]);
export const safeguardingReferralStatuses = mysqlEnum("safeguardingReferralStatus", ["DRAFT", "SUBMITTED", "IN_REVIEW", "ACTIONED", "CLOSED"]);
export const exeatStatuses = mysqlEnum("exeatStatus", ["REQUESTED", "APPROVED", "DECLINED", "RETURNED", "CANCELLED"]);
export const guardianAlertTypes = mysqlEnum("guardianAlertType", ["ABSENCE", "LATE_ARRIVAL", "WELFARE"]);
export const guardianAlertStatuses = mysqlEnum("guardianAlertStatus", ["QUEUED", "SENT", "FAILED"]);

export const learners = mysqlTable("learners", {
  id: int("id").autoincrement().primaryKey(),
  studentId: varchar("studentId", { length: 60 }).notNull(),
  admissionNumber: varchar("admissionNumber", { length: 60 }),
  userId: int("userId").references(() => users.id),
  houseId: int("houseId").references(() => houses.id),
  firstName: varchar("firstName", { length: 80 }).notNull(),
  middleName: varchar("middleName", { length: 80 }),
  lastName: varchar("lastName", { length: 80 }).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: varchar("gender", { length: 30 }),
  status: registrationStatuses.default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ studentIdUnique: uniqueIndex("learner_student_id_unique").on(table.studentId), admissionNumberUnique: uniqueIndex("learner_admission_number_unique").on(table.admissionNumber) }));

export const guardianContacts = mysqlTable("guardian_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  firstName: varchar("firstName", { length: 80 }).notNull(),
  lastName: varchar("lastName", { length: 80 }).notNull(),
  relationship: varchar("relationship", { length: 60 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const learnerGuardians = mysqlTable("learner_guardians", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  guardianId: int("guardianId").notNull().references(() => guardianContacts.id),
  isPrimary: boolean("isPrimary").default(false).notNull(),
}, (table) => ({ learnerGuardianUnique: uniqueIndex("learner_guardian_unique").on(table.learnerId, table.guardianId) }));

export const learnerAcademicHistory = mysqlTable("learner_academic_history", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").notNull().references(() => academicTerms.id),
  formId: int("formId").notNull().references(() => forms.id),
  classId: int("classId").references(() => classes.id),
  pathway: pathways.notNull(),
  registrationStatus: registrationStatuses.default("ACTIVE").notNull(),
  progressionType: progressionTypes,
  previousHistoryId: int("previousHistoryId"),
  recordedByUserId: int("recordedByUserId").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ learnerYearTermUnique: uniqueIndex("learner_history_year_term_unique").on(table.learnerId, table.academicYearId, table.termId) }));

export const oLevelResults = mysqlTable("o_level_results", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  examinationYear: int("examinationYear").notNull(),
  candidateNumber: varchar("candidateNumber", { length: 80 }).notNull(),
  centreNumber: varchar("centreNumber", { length: 80 }),
  candidateName: varchar("candidateName", { length: 180 }).notNull(),
  verificationStatus: verificationStatuses.default("PENDING").notNull(),
  verifiedByUserId: int("verifiedByUserId").references(() => users.id),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ learnerExamYearUnique: uniqueIndex("learner_o_level_exam_year_unique").on(table.learnerId, table.examinationYear) }));

export const oLevelResultSubjects = mysqlTable("o_level_result_subjects", {
  id: int("id").autoincrement().primaryKey(),
  resultId: int("resultId").notNull().references(() => oLevelResults.id),
  subjectId: int("subjectId").references(() => subjects.id),
  subjectName: varchar("subjectName", { length: 140 }).notNull(),
  grade: varchar("grade", { length: 10 }).notNull(),
  points: int("points"),
}, (table) => ({ resultSubjectUnique: uniqueIndex("o_level_result_subject_unique").on(table.resultId, table.subjectName) }));

export const aLevelRequirements = mysqlTable("a_level_requirements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  minimumPoints: int("minimumPoints"),
  minimumPasses: int("minimumPasses"),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const aLevelRequirementSubjects = mysqlTable("a_level_requirement_subjects", {
  id: int("id").autoincrement().primaryKey(),
  requirementId: int("requirementId").notNull().references(() => aLevelRequirements.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  minimumGrade: varchar("minimumGrade", { length: 10 }),
  isRequired: boolean("isRequired").default(false).notNull(),
}, (table) => ({ requirementSubjectUnique: uniqueIndex("a_level_requirement_subject_unique").on(table.requirementId, table.subjectId) }));

export const aLevelApplications = mysqlTable("a_level_applications", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  oLevelResultId: int("oLevelResultId").notNull().references(() => oLevelResults.id),
  requirementId: int("requirementId").references(() => aLevelRequirements.id),
  preferredPathway: pathways.default("A_LEVEL").notNull(),
  applicationStatus: applicationStatuses.default("NOT_STARTED").notNull(),
  verificationStatus: verificationStatuses.default("NOT_STARTED").notNull(),
  selectionDecision: mysqlEnum("selectionDecision", decisionStatusValues).default("PENDING").notNull(),
  admissionDecision: mysqlEnum("admissionDecision", decisionStatusValues).default("PENDING").notNull(),
  submittedAt: timestamp("submittedAt"),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ learnerYearApplicationUnique: uniqueIndex("a_level_application_learner_year_unique").on(table.learnerId, table.academicYearId) }));

export const aLevelApplicationSubjects = mysqlTable("a_level_application_subjects", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => aLevelApplications.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  subjectName: varchar("subjectName", { length: 140 }).notNull(),
}, (table) => ({ applicationSubjectUnique: uniqueIndex("a_level_application_subject_unique").on(table.applicationId, table.subjectId) }));

export const financialAccounts = mysqlTable("financial_accounts", {
  id: int("id").autoincrement().primaryKey(),
  accountNumber: varchar("accountNumber", { length: 60 }).notNull(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ accountNumberUnique: uniqueIndex("financial_account_number_unique").on(table.accountNumber), learnerCurrencyUnique: uniqueIndex("financial_account_learner_currency_unique").on(table.learnerId, table.currency) }));

export const approvedSchoolCharges = mysqlTable("approved_school_charges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  residencyType: residencyTypes.default("ALL").notNull(),
  status: chargeStatuses.default("DRAFT").notNull(),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ schoolChargeCodeUnique: uniqueIndex("approved_school_charge_code_unique").on(table.code) }));

export const feeStructures = mysqlTable("fee_structures", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  formId: int("formId").references(() => forms.id),
  pathway: pathways,
  residencyType: residencyTypes.default("ALL").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const feeStructureItems = mysqlTable("fee_structure_items", {
  id: int("id").autoincrement().primaryKey(),
  feeStructureId: int("feeStructureId").notNull().references(() => feeStructures.id),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  amountMinor: int("amountMinor").notNull(),
  frequency: feeFrequencies.default("TERM").notNull(),
  isMandatory: boolean("isMandatory").default(true).notNull(),
}, (table) => ({ feeItemCodeUnique: uniqueIndex("fee_structure_item_code_unique").on(table.feeStructureId, table.code) }));

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 60 }).notNull(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  financialAccountId: int("financialAccountId").references(() => financialAccounts.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").references(() => academicTerms.id),
  feeStructureId: int("feeStructureId").references(() => feeStructures.id),
  currency: varchar("currency", { length: 3 }).notNull(),
  subtotalMinor: int("subtotalMinor").notNull(),
  discountMinor: int("discountMinor").default(0).notNull(),
  totalMinor: int("totalMinor").notNull(),
  status: invoiceStatuses.default("DRAFT").notNull(),
  issuedAt: timestamp("issuedAt"),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ invoiceNumberUnique: uniqueIndex("invoice_number_unique").on(table.invoiceNumber) }));

export const invoiceLines = mysqlTable("invoice_lines", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull().references(() => invoices.id),
  feeItemId: int("feeItemId").references(() => feeStructureItems.id),
  description: varchar("description", { length: 180 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitAmountMinor: int("unitAmountMinor").notNull(),
  lineTotalMinor: int("lineTotalMinor").notNull(),
});

export const scholarships = mysqlTable("scholarships", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  financialAccountId: int("financialAccountId").references(() => financialAccounts.id),
  name: varchar("name", { length: 160 }).notNull(),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  status: assistanceStatuses.default("PENDING").notNull(),
  sponsor: varchar("sponsor", { length: 160 }),
  notes: text("notes"),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const beamRecords = mysqlTable("beam_records", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  financialAccountId: int("financialAccountId").references(() => financialAccounts.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  referenceNumber: varchar("referenceNumber", { length: 120 }),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: assistanceStatuses.default("PENDING").notNull(),
  notes: text("notes"),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paymentReconciliations = mysqlTable("payment_reconciliations", {
  id: int("id").autoincrement().primaryKey(),
  paymentId: int("paymentId").notNull().references(() => payments.id),
  externalReference: varchar("externalReference", { length: 160 }),
  status: reconciliationStatuses.default("UNMATCHED").notNull(),
  reconciledAt: timestamp("reconciledAt"),
  reconciledByUserId: int("reconciledByUserId").references(() => users.id),
  exceptionReason: text("exceptionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paynowSettings = mysqlTable("paynow_settings", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: varchar("integrationId", { length: 120 }).notNull(),
  integrationKeyEncrypted: text("integrationKeyEncrypted").notNull(),
  returnUrl: varchar("returnUrl", { length: 500 }).notNull(),
  resultUrl: varchar("resultUrl", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  updatedByUserId: int("updatedByUserId").notNull().references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receiptNumber", { length: 60 }).notNull(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  financialAccountId: int("financialAccountId").references(() => financialAccounts.id),
  invoiceId: int("invoiceId").references(() => invoices.id),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  method: paymentMethods.notNull(),
  reference: varchar("reference", { length: 120 }),
  status: paymentStatuses.default("CONFIRMED").notNull(),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  receivedByUserId: int("receivedByUserId").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ receiptNumberUnique: uniqueIndex("payment_receipt_number_unique").on(table.receiptNumber) }));

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
export type Learner = typeof learners.$inferSelect;
export type LearnerAcademicHistory = typeof learnerAcademicHistory.$inferSelect;
export type OLevelResult = typeof oLevelResults.$inferSelect;
export type ALevelRequirement = typeof aLevelRequirements.$inferSelect;
export type ALevelApplication = typeof aLevelApplications.$inferSelect;
export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type ApprovedSchoolCharge = typeof approvedSchoolCharges.$inferSelect;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type FeeStructureItem = typeof feeStructureItems.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Scholarship = typeof scholarships.$inferSelect;
export type BeamRecord = typeof beamRecords.$inferSelect;
export type PaymentReconciliation = typeof paymentReconciliations.$inferSelect;
export type PaynowSettings = typeof paynowSettings.$inferSelect;

export const timetableEntries = mysqlTable("timetable_entries", {
  id: int("id").autoincrement().primaryKey(),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").references(() => academicTerms.id),
  classId: int("classId").references(() => classes.id),
  teacherStaffId: int("teacherStaffId").references(() => staff.id),
  subjectId: int("subjectId").references(() => subjects.id),
  roomId: int("roomId").references(() => rooms.id),
  dayOfWeek: varchar("dayOfWeek", { length: 12 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  entryType: timetableEntryTypes.default("LESSON").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  isLaboratory: boolean("isLaboratory").default(false).notNull(),
  isRecurring: boolean("isRecurring").default(true).notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ timetableSlotIndex: uniqueIndex("timetable_slot_index").on(table.academicYearId, table.termId, table.dayOfWeek, table.startTime, table.endTime, table.classId, table.teacherStaffId, table.roomId) }));

export const schoolEvents = mysqlTable("school_events", {
  id: int("id").autoincrement().primaryKey(),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").references(() => academicTerms.id),
  eventType: eventTypes.notNull(),
  visibility: eventVisibility.default("ALL").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  roomId: int("roomId").references(() => rooms.id),
  description: text("description"),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type SchoolEvent = typeof schoolEvents.$inferSelect;

export const learnerResults = mysqlTable("learner_results", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").notNull().references(() => academicTerms.id),
  subjectId: int("subjectId").references(() => subjects.id),
  subjectName: varchar("subjectName", { length: 140 }).notNull(),
  marks: int("marks"),
  grade: varchar("grade", { length: 20 }),
  remarks: varchar("remarks", { length: 500 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const learnerReportCards = mysqlTable("learner_report_cards", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").notNull().references(() => academicTerms.id),
  status: varchar("status", { length: 30 }).default("PUBLISHED").notNull(),
  summary: text("summary"),
  documentUrl: varchar("documentUrl", { length: 800 }),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const learnerAssignments = mysqlTable("learner_assignments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => classes.id),
  subjectId: int("subjectId").references(() => subjects.id),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  dueAt: timestamp("dueAt"),
  status: portalAssignmentStatuses.default("ASSIGNED").notNull(),
  documentUrl: varchar("documentUrl", { length: 800 }),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const sbpRecords = mysqlTable("sbp_records", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  title: varchar("title", { length: 180 }).notNull(),
  status: varchar("status", { length: 40 }).default("RECORDED").notNull(),
  score: int("score"),
  remarks: text("remarks"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const schoolNotices = mysqlTable("school_notices", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  audience: noticeAudiences.default("ALL").notNull(),
  publishedAt: timestamp("publishedAt"),
  expiresAt: timestamp("expiresAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const learnerDocuments = mysqlTable("learner_documents", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  title: varchar("title", { length: 180 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  documentUrl: varchar("documentUrl", { length: 800 }).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LearnerResult = typeof learnerResults.$inferSelect;
export type LearnerReportCard = typeof learnerReportCards.$inferSelect;
export type LearnerAssignment = typeof learnerAssignments.$inferSelect;
export type SbpRecord = typeof sbpRecords.$inferSelect;
export type SchoolNotice = typeof schoolNotices.$inferSelect;
export type LearnerDocument = typeof learnerDocuments.$inferSelect;

export const attendanceSessions = mysqlTable("attendance_sessions", {
  id: int("id").autoincrement().primaryKey(),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  termId: int("termId").notNull().references(() => academicTerms.id),
  classId: int("classId").references(() => classes.id),
  sessionDate: timestamp("sessionDate").notNull(),
  mode: attendanceModes.notNull(),
  periodNumber: int("periodNumber"),
  periodName: varchar("periodName", { length: 80 }),
  recordedByUserId: int("recordedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => attendanceSessions.id),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  status: attendanceStatuses.notNull(),
  arrivalTime: timestamp("arrivalTime"),
  reason: varchar("reason", { length: 500 }),
  note: text("note"),
  guardianAlerted: boolean("guardianAlerted").default(false).notNull(),
  alertSentAt: timestamp("alertSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ attendanceSessionLearnerUnique: uniqueIndex("attendance_session_learner_unique").on(table.sessionId, table.learnerId) }));

export const disciplineIncidents = mysqlTable("discipline_incidents", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  occurredAt: timestamp("occurredAt").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  severity: int("severity").default(1).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  details: text("details"),
  status: disciplineIncidentStatuses.default("OPEN").notNull(),
  reportedByUserId: int("reportedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const disciplineActions = mysqlTable("discipline_actions", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull().references(() => disciplineIncidents.id),
  actionType: disciplineActionTypes.notNull(),
  points: int("points"),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const prefectReports = mysqlTable("prefect_reports", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  reportedAt: timestamp("reportedAt").defaultNow().notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  status: disciplineIncidentStatuses.default("OPEN").notNull(),
  reviewedByUserId: int("reviewedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const counsellingRecords = mysqlTable("counselling_records", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  sessionAt: timestamp("sessionAt").notNull(),
  summary: text("summary").notNull(),
  outcome: text("outcome"),
  followUpAt: timestamp("followUpAt"),
  recordedByUserId: int("recordedByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const welfareCases = mysqlTable("welfare_cases", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  category: varchar("category", { length: 100 }).notNull(),
  severity: int("severity").default(1).notNull(),
  status: welfareCaseStatuses.default("OPEN").notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  privateNotes: text("privateNotes"),
  assignedToUserId: int("assignedToUserId").references(() => users.id),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
});

export const safeguardingReferrals = mysqlTable("safeguarding_referrals", {
  id: int("id").autoincrement().primaryKey(),
  welfareCaseId: int("welfareCaseId").notNull().references(() => welfareCases.id),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  referralType: varchar("referralType", { length: 120 }).notNull(),
  status: safeguardingReferralStatuses.default("DRAFT").notNull(),
  details: text("details").notNull(),
  referredAt: timestamp("referredAt").defaultNow().notNull(),
  externalAgency: varchar("externalAgency", { length: 180 }),
  resolvedAt: timestamp("resolvedAt"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
});

export const medicalProfiles = mysqlTable("medical_profiles", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  bloodGroup: varchar("bloodGroup", { length: 10 }),
  allergies: text("allergies"),
  conditions: text("conditions"),
  medications: text("medications"),
  emergencyContactName: varchar("emergencyContactName", { length: 160 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 40 }),
  notes: text("notes"),
  updatedByUserId: int("updatedByUserId").notNull().references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ medicalLearnerUnique: uniqueIndex("medical_profile_learner_unique").on(table.learnerId) }));

export const exeatRequests = mysqlTable("exeat_requests", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  requestedByUserId: int("requestedByUserId").notNull().references(() => users.id),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  departureAt: timestamp("departureAt").notNull(),
  expectedReturnAt: timestamp("expectedReturnAt").notNull(),
  destination: varchar("destination", { length: 240 }).notNull(),
  reason: varchar("reason", { length: 500 }).notNull(),
  status: exeatStatuses.default("REQUESTED").notNull(),
  decisionNotes: text("decisionNotes"),
  decidedByUserId: int("decidedByUserId").references(() => users.id),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type DisciplineIncident = typeof disciplineIncidents.$inferSelect;
export type DisciplineAction = typeof disciplineActions.$inferSelect;
export type PrefectReport = typeof prefectReports.$inferSelect;
export type CounsellingRecord = typeof counsellingRecords.$inferSelect;
export type WelfareCase = typeof welfareCases.$inferSelect;
export type SafeguardingReferral = typeof safeguardingReferrals.$inferSelect;
export type MedicalProfile = typeof medicalProfiles.$inferSelect;
export type ExeatRequest = typeof exeatRequests.$inferSelect;

export const guardianAlerts = mysqlTable("guardian_alerts", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull().references(() => learners.id),
  attendanceRecordId: int("attendanceRecordId").references(() => attendanceRecords.id),
  alertType: guardianAlertTypes.notNull(),
  status: guardianAlertStatuses.default("QUEUED").notNull(),
  message: varchar("message", { length: 500 }).notNull(),
  queuedAt: timestamp("queuedAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
});

export type GuardianAlert = typeof guardianAlerts.$inferSelect;
