import { randomBytes, createCipheriv } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  academicYears,
  approvedSchoolCharges,
  beamRecords,
  feeStructureItems,
  feeStructures,
  financialAccounts,
  forms,
  guardianContacts,
  invoiceLines,
  invoices,
  learnerGuardians,
  learners,
  paymentReconciliations,
  payments,
  paynowSettings,
  scholarships,
  staff,
  staffRoleAssignments,
  staffRoles,
} from "../drizzle/schema";
import { getDb } from "./db";

export type Currency = "USD" | "ZIG";
export type InvoiceLineInput = {
  feeItemId?: number | null;
  description: string;
  quantity: number;
  unitAmountMinor: number;
};

export async function assertFinanceRole(
  userId: number,
  allowedRoles: string[],
  isAdministrator = false
) {
  if (isAdministrator) return;
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const rows = await db
    .select({ code: staffRoles.code })
    .from(staff)
    .innerJoin(staffRoleAssignments, eq(staffRoleAssignments.staffId, staff.id))
    .innerJoin(staffRoles, eq(staffRoles.id, staffRoleAssignments.roleId))
    .where(
      and(
        eq(staff.userId, userId),
        eq(staff.status, "ACTIVE"),
        eq(staffRoles.isActive, true),
        lte(staffRoleAssignments.effectiveFrom, new Date()),
        or(
          isNull(staffRoleAssignments.effectiveTo),
          gt(staffRoleAssignments.effectiveTo, new Date())
        )
      )
    );
  if (!rows.some(row => allowedRoles.includes(row.code)))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your school role does not allow this finance operation.",
    });
}

export async function canViewWholeSchoolFinance(
  userId: number,
  isAdministrator = false
) {
  if (isAdministrator) return true;
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ code: staffRoles.code })
    .from(staff)
    .innerJoin(staffRoleAssignments, eq(staffRoleAssignments.staffId, staff.id))
    .innerJoin(staffRoles, eq(staffRoles.id, staffRoleAssignments.roleId))
    .where(
      and(
        eq(staff.userId, userId),
        eq(staff.status, "ACTIVE"),
        eq(staffRoles.isActive, true),
        lte(staffRoleAssignments.effectiveFrom, new Date()),
        or(
          isNull(staffRoleAssignments.effectiveTo),
          gt(staffRoleAssignments.effectiveTo, new Date())
        )
      )
    );
  return rows.some(row =>
    [
      "HEADTEACHER",
      "DEPUTY_HEAD",
      "BURSAR",
      "FINANCE_OFFICER",
      "SCHOOL_ADMINISTRATOR",
    ].includes(row.code)
  );
}

export function normalizeCurrency(currency: string): Currency {
  const value = currency.trim().toUpperCase();
  if (value !== "USD" && value !== "ZIG")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only USD and ZiG accounts are supported.",
    });
  return value;
}

export function displayCurrency(currency: Currency) {
  return currency === "ZIG" ? "ZiG" : "USD";
}

export function calculateInvoiceTotals(
  lines: InvoiceLineInput[],
  discountMinor = 0
) {
  if (lines.length === 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "An invoice must contain at least one line item.",
    });
  const lineTotals = lines.map(line => ({
    ...line,
    lineTotalMinor: line.quantity * line.unitAmountMinor,
  }));
  const subtotalMinor = lineTotals.reduce(
    (sum, line) => sum + line.lineTotalMinor,
    0
  );
  if (
    discountMinor < 0 ||
    lineTotals.some(line => line.quantity <= 0 || line.unitAmountMinor < 0) ||
    discountMinor > subtotalMinor
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invoice quantities, amounts, and discount must be valid.",
    });
  return {
    lineTotals,
    subtotalMinor,
    discountMinor,
    totalMinor: subtotalMinor - discountMinor,
  };
}

function encryptSecret(secret: string) {
  const keyMaterial =
    process.env.FINANCE_SECRET_KEY ?? process.env.PAYNOW_ENCRYPTION_KEY;
  if (!keyMaterial)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Configure FINANCE_SECRET_KEY before saving Paynow credentials.",
    });
  const key =
    Buffer.from(keyMaterial, "base64").length === 32
      ? Buffer.from(keyMaterial, "base64")
      : Buffer.from(keyMaterial.padEnd(32, "0").slice(0, 32));
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function maskSecret() {
  return "•••••••• configured";
}

async function ensureFinancialAccount(learnerId: number, currency: Currency) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const existing = await db
    .select()
    .from(financialAccounts)
    .where(
      and(
        eq(financialAccounts.learnerId, learnerId),
        eq(financialAccounts.currency, currency)
      )
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const learner = (
    await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1)
  )[0];
  if (!learner)
    throw new TRPCError({ code: "NOT_FOUND", message: "Learner not found." });
  const result = await db.insert(financialAccounts).values({
    accountNumber: `${learner.studentId}-${currency}`,
    learnerId,
    currency,
    isActive: true,
  });
  return (
    await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.id, Number(result[0].insertId)))
      .limit(1)
  )[0];
}

async function linkedLearnerIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const direct = await db
    .select({ id: learners.id })
    .from(learners)
    .where(eq(learners.userId, userId));
  const guardian = await db
    .select({ learnerId: learnerGuardians.learnerId })
    .from(guardianContacts)
    .innerJoin(
      learnerGuardians,
      eq(learnerGuardians.guardianId, guardianContacts.id)
    )
    .where(eq(guardianContacts.userId, userId));
  return Array.from(
    new Set([
      ...direct.map(row => row.id),
      ...guardian.map(row => row.learnerId),
    ])
  );
}

export async function getFinanceData(
  userId?: number,
  isAdministrator = false,
  wholeSchoolFinance = false
) {
  const db = await getDb();
  if (!db) return null;
  const ids =
    isAdministrator || wholeSchoolFinance || userId === undefined
      ? null
      : await linkedLearnerIds(userId);
  if (ids && ids.length === 0)
    return {
      feeStructures: [],
      feeStructureItems: [],
      approvedCharges: [],
      financialAccounts: [],
      invoices: [],
      invoiceLines: [],
      payments: [],
      scholarships: [],
      beamRecords: [],
      reconciliations: [],
      learners: [],
      academicYears: [],
      forms: [],
      paynow: null,
    };
  const [
    structureRows,
    itemRows,
    chargeRows,
    accountRows,
    invoiceRows,
    lineRows,
    paymentRows,
    scholarshipRows,
    beamRows,
    reconciliationRows,
    learnerRows,
    yearRows,
    formRows,
    paynowRows,
  ] = await Promise.all([
    db.select().from(feeStructures).orderBy(desc(feeStructures.createdAt)),
    db.select().from(feeStructureItems).orderBy(asc(feeStructureItems.name)),
    db
      .select()
      .from(approvedSchoolCharges)
      .orderBy(desc(approvedSchoolCharges.createdAt)),
    ids
      ? db
          .select()
          .from(financialAccounts)
          .where(inArray(financialAccounts.learnerId, ids))
      : db.select().from(financialAccounts),
    ids
      ? db
          .select()
          .from(invoices)
          .where(inArray(invoices.learnerId, ids))
          .orderBy(desc(invoices.createdAt))
      : db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select().from(invoiceLines),
    ids
      ? db
          .select()
          .from(payments)
          .where(inArray(payments.learnerId, ids))
          .orderBy(desc(payments.paidAt))
      : db.select().from(payments).orderBy(desc(payments.paidAt)),
    ids
      ? db
          .select()
          .from(scholarships)
          .where(inArray(scholarships.learnerId, ids))
      : db.select().from(scholarships),
    ids
      ? db.select().from(beamRecords).where(inArray(beamRecords.learnerId, ids))
      : db.select().from(beamRecords),
    db
      .select()
      .from(paymentReconciliations)
      .orderBy(desc(paymentReconciliations.createdAt)),
    ids
      ? db.select().from(learners).where(inArray(learners.id, ids))
      : db.select().from(learners).orderBy(asc(learners.lastName)),
    db.select().from(academicYears).orderBy(desc(academicYears.startDate)),
    db.select().from(forms).orderBy(asc(forms.formNumber)),
    isAdministrator
      ? db
          .select({
            id: paynowSettings.id,
            integrationId: paynowSettings.integrationId,
            returnUrl: paynowSettings.returnUrl,
            resultUrl: paynowSettings.resultUrl,
            isActive: paynowSettings.isActive,
            updatedAt: paynowSettings.updatedAt,
          })
          .from(paynowSettings)
          .orderBy(desc(paynowSettings.updatedAt))
          .limit(1)
      : Promise.resolve([]),
  ]);
  return {
    feeStructures: structureRows,
    feeStructureItems: itemRows,
    approvedCharges: chargeRows,
    financialAccounts: accountRows,
    invoices: invoiceRows,
    invoiceLines: ids
      ? lineRows.filter(line =>
          invoiceRows.some(invoice => invoice.id === line.invoiceId)
        )
      : lineRows,
    payments: paymentRows,
    scholarships: scholarshipRows,
    beamRecords: beamRows,
    reconciliations: ids
      ? reconciliationRows.filter(row =>
          paymentRows.some(payment => payment.id === row.paymentId)
        )
      : reconciliationRows,
    learners: learnerRows,
    academicYears: yearRows,
    forms: formRows,
    paynow: paynowRows[0] ?? null,
  };
}

export async function getLearnerStatement(
  userId: number,
  learnerId: number,
  isAdministrator = false
) {
  if (!isAdministrator && !(await linkedLearnerIds(userId)).includes(learnerId))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You may only view financial information for a linked learner.",
    });
  const db = await getDb();
  if (!db) return null;
  const learner = (
    await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1)
  )[0];
  if (!learner)
    throw new TRPCError({ code: "NOT_FOUND", message: "Learner not found." });
  const [accountRows, invoiceRows, paymentRows, scholarshipRows, beamRows] =
    await Promise.all([
      db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.learnerId, learnerId)),
      db
        .select()
        .from(invoices)
        .where(eq(invoices.learnerId, learnerId))
        .orderBy(desc(invoices.createdAt)),
      db
        .select()
        .from(payments)
        .where(eq(payments.learnerId, learnerId))
        .orderBy(desc(payments.paidAt)),
      db
        .select()
        .from(scholarships)
        .where(
          and(
            eq(scholarships.learnerId, learnerId),
            eq(scholarships.status, "APPROVED")
          )
        ),
      db
        .select()
        .from(beamRecords)
        .where(
          and(
            eq(beamRecords.learnerId, learnerId),
            eq(beamRecords.status, "APPROVED")
          )
        ),
    ]);
  const balances = accountRows.map(account => {
    const billed = invoiceRows
      .filter(
        invoice =>
          invoice.currency === account.currency && invoice.status !== "VOID"
      )
      .reduce((sum, invoice) => sum + invoice.totalMinor, 0);
    const paid = paymentRows
      .filter(
        payment =>
          payment.currency === account.currency &&
          payment.status === "CONFIRMED"
      )
      .reduce((sum, payment) => sum + payment.amountMinor, 0);
    const credits = [...scholarshipRows, ...beamRows]
      .filter(record => record.currency === account.currency)
      .reduce((sum, record) => sum + record.amountMinor, 0);
    return {
      currency: account.currency,
      accountNumber: account.accountNumber,
      billedMinor: billed,
      paidMinor: paid,
      creditsMinor: credits,
      balanceMinor: Math.max(0, billed - paid - credits),
      arrearsMinor: Math.max(0, billed - paid - credits),
    };
  });
  return {
    learner,
    accounts: accountRows,
    invoices: invoiceRows,
    payments: paymentRows,
    scholarships: scholarshipRows,
    beamRecords: beamRows,
    balances,
  };
}

export async function createFeeStructure(input: {
  name: string;
  academicYearId: number;
  formId?: number | null;
  pathway?: "O_LEVEL" | "A_LEVEL" | null;
  residencyType: "BOARDING" | "DAY_SCHOLAR" | "ALL";
  currency: string;
  items: Array<{
    code: string;
    name: string;
    description?: string | null;
    amountMinor: number;
    frequency: "ONCE" | "TERM" | "ANNUAL";
    isMandatory: boolean;
  }>;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const currency = normalizeCurrency(input.currency);
  if (!input.items.length)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A fee structure requires at least one fee item.",
    });
  const result = await db.insert(feeStructures).values({
    name: input.name,
    academicYearId: input.academicYearId,
    formId: input.formId ?? null,
    pathway: input.pathway ?? null,
    residencyType: input.residencyType,
    currency,
    isActive: true,
    createdByUserId: input.createdByUserId,
  });
  const structureId = Number(result[0].insertId);
  await db
    .insert(feeStructureItems)
    .values(
      input.items.map(item => ({ feeStructureId: structureId, ...item }))
    );
  return (
    await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, structureId))
      .limit(1)
  )[0];
}

export async function createApprovedCharge(input: {
  code: string;
  name: string;
  description?: string | null;
  amountMinor: number;
  currency: string;
  residencyType: "BOARDING" | "DAY_SCHOLAR" | "ALL";
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const result = await db.insert(approvedSchoolCharges).values({
    ...input,
    description: input.description ?? null,
    currency: normalizeCurrency(input.currency),
    amountMinor: input.amountMinor,
    status: "SUBMITTED",
  });
  return (
    await db
      .select()
      .from(approvedSchoolCharges)
      .where(eq(approvedSchoolCharges.id, Number(result[0].insertId)))
      .limit(1)
  )[0];
}

export async function approveSchoolCharge(input: {
  chargeId: number;
  approvedByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const current = (
    await db
      .select()
      .from(approvedSchoolCharges)
      .where(eq(approvedSchoolCharges.id, input.chargeId))
      .limit(1)
  )[0];
  if (!current)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "School charge not found.",
    });
  await db
    .update(approvedSchoolCharges)
    .set({
      status: "APPROVED",
      approvedByUserId: input.approvedByUserId,
      approvedAt: new Date(),
    })
    .where(eq(approvedSchoolCharges.id, input.chargeId));
  return (
    await db
      .select()
      .from(approvedSchoolCharges)
      .where(eq(approvedSchoolCharges.id, input.chargeId))
      .limit(1)
  )[0];
}

export async function savePaynowSettings(input: {
  integrationId: string;
  integrationKey: string;
  returnUrl: string;
  resultUrl: string;
  isActive: boolean;
  updatedByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const encrypted = encryptSecret(input.integrationKey);
  const current = await db.select().from(paynowSettings).limit(1);
  if (current[0])
    await db
      .update(paynowSettings)
      .set({
        integrationId: input.integrationId,
        integrationKeyEncrypted: encrypted,
        returnUrl: input.returnUrl,
        resultUrl: input.resultUrl,
        isActive: input.isActive,
        updatedByUserId: input.updatedByUserId,
      })
      .where(eq(paynowSettings.id, current[0].id));
  else
    await db.insert(paynowSettings).values({
      integrationId: input.integrationId,
      integrationKeyEncrypted: encrypted,
      returnUrl: input.returnUrl,
      resultUrl: input.resultUrl,
      isActive: input.isActive,
      updatedByUserId: input.updatedByUserId,
    });
  return {
    integrationId: input.integrationId,
    isActive: input.isActive,
    key: maskSecret(),
  };
}

export async function createInvoice(input: {
  learnerId: number;
  financialAccountId?: number | null;
  academicYearId: number;
  termId?: number | null;
  feeStructureId?: number | null;
  invoiceNumber: string;
  currency: string;
  discountMinor?: number;
  dueDate?: Date | null;
  status: "DRAFT" | "ISSUED";
  notes?: string | null;
  lines: InvoiceLineInput[];
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const currency = normalizeCurrency(input.currency);
  const account = input.financialAccountId
    ? (
        await db
          .select()
          .from(financialAccounts)
          .where(
            and(
              eq(financialAccounts.id, input.financialAccountId),
              eq(financialAccounts.learnerId, input.learnerId)
            )
          )
          .limit(1)
      )[0]
    : await ensureFinancialAccount(input.learnerId, currency);
  if (!account || account.currency !== currency)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Invoice must use the learner's matching financial account currency.",
    });
  const totals = calculateInvoiceTotals(input.lines, input.discountMinor ?? 0);
  const result = await db.insert(invoices).values({
    invoiceNumber: input.invoiceNumber,
    learnerId: input.learnerId,
    financialAccountId: account.id,
    academicYearId: input.academicYearId,
    termId: input.termId ?? null,
    feeStructureId: input.feeStructureId ?? null,
    currency,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    totalMinor: totals.totalMinor,
    status: input.status,
    issuedAt: input.status === "ISSUED" ? new Date() : null,
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
    createdByUserId: input.createdByUserId,
  });
  const invoiceId = Number(result[0].insertId);
  await db.insert(invoiceLines).values(
    totals.lineTotals.map(line => ({
      invoiceId,
      feeItemId: line.feeItemId ?? null,
      description: line.description,
      quantity: line.quantity,
      unitAmountMinor: line.unitAmountMinor,
      lineTotalMinor: line.lineTotalMinor,
    }))
  );
  return (
    await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1)
  )[0];
}

export async function recordPayment(input: {
  learnerId: number;
  financialAccountId?: number | null;
  invoiceId?: number | null;
  receiptNumber: string;
  amountMinor: number;
  currency: string;
  method:
    | "CASH"
    | "BANK_TRANSFER"
    | "ECOCASH"
    | "ZIPIT"
    | "INNBUCKS"
    | "PAYNOW"
    | "CARD"
    | "OTHER";
  reference?: string | null;
  status: "PENDING" | "CONFIRMED";
  paidAt?: Date;
  notes?: string | null;
  receivedByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  if (input.amountMinor <= 0)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payment amount must be greater than zero.",
    });
  const currency = normalizeCurrency(input.currency);
  const account = input.financialAccountId
    ? (
        await db
          .select()
          .from(financialAccounts)
          .where(
            and(
              eq(financialAccounts.id, input.financialAccountId),
              eq(financialAccounts.learnerId, input.learnerId)
            )
          )
          .limit(1)
      )[0]
    : await ensureFinancialAccount(input.learnerId, currency);
  if (!account || account.currency !== currency)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Payment must use the learner's matching financial account currency.",
    });
  const invoice = input.invoiceId
    ? (
        await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, input.invoiceId))
          .limit(1)
      )[0]
    : null;
  if (
    invoice &&
    (invoice.learnerId !== input.learnerId || invoice.currency !== currency)
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Payment learner and currency must match the invoice.",
    });
  const result = await db.insert(payments).values({
    learnerId: input.learnerId,
    financialAccountId: account.id,
    invoiceId: input.invoiceId ?? null,
    receiptNumber: input.receiptNumber,
    amountMinor: input.amountMinor,
    currency,
    method: input.method,
    reference: input.reference ?? null,
    status: input.status,
    paidAt: input.paidAt ?? new Date(),
    notes: input.notes ?? null,
    receivedByUserId: input.receivedByUserId,
  });
  const paymentId = Number(result[0].insertId);
  await db.insert(paymentReconciliations).values({
    paymentId,
    externalReference: input.reference ?? null,
    status: input.status === "CONFIRMED" ? "MATCHED" : "UNMATCHED",
    reconciledAt: input.status === "CONFIRMED" ? new Date() : null,
    reconciledByUserId:
      input.status === "CONFIRMED" ? input.receivedByUserId : null,
    exceptionReason: null,
  });
  if (invoice && input.status === "CONFIRMED") {
    const confirmed = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, invoice.id),
          eq(payments.status, "CONFIRMED")
        )
      );
    const paidMinor = confirmed.reduce(
      (sum, payment) => sum + payment.amountMinor,
      0
    );
    await db
      .update(invoices)
      .set({
        status: paidMinor >= invoice.totalMinor ? "PAID" : "PARTIALLY_PAID",
      })
      .where(eq(invoices.id, invoice.id));
  }
  return (
    await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)
  )[0];
}

export async function recordScholarship(input: {
  learnerId: number;
  academicYearId: number;
  name: string;
  amountMinor: number;
  currency: string;
  sponsor?: string | null;
  notes?: string | null;
  approvedByUserId?: number | null;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const account = await ensureFinancialAccount(
    input.learnerId,
    normalizeCurrency(input.currency)
  );
  const result = await db.insert(scholarships).values({
    ...input,
    financialAccountId: account.id,
    currency: normalizeCurrency(input.currency),
    sponsor: input.sponsor ?? null,
    notes: input.notes ?? null,
    status: input.approvedByUserId ? "APPROVED" : "PENDING",
  });
  return (
    await db
      .select()
      .from(scholarships)
      .where(eq(scholarships.id, Number(result[0].insertId)))
      .limit(1)
  )[0];
}
export async function recordBeam(input: {
  learnerId: number;
  academicYearId: number;
  amountMinor: number;
  currency: string;
  referenceNumber?: string | null;
  notes?: string | null;
  approvedByUserId?: number | null;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const account = await ensureFinancialAccount(
    input.learnerId,
    normalizeCurrency(input.currency)
  );
  const result = await db.insert(beamRecords).values({
    ...input,
    financialAccountId: account.id,
    currency: normalizeCurrency(input.currency),
    referenceNumber: input.referenceNumber ?? null,
    notes: input.notes ?? null,
    status: input.approvedByUserId ? "APPROVED" : "PENDING",
  });
  return (
    await db
      .select()
      .from(beamRecords)
      .where(eq(beamRecords.id, Number(result[0].insertId)))
      .limit(1)
  )[0];
}
export async function reconcilePayment(input: {
  paymentId: number;
  externalReference?: string | null;
  status: "UNMATCHED" | "MATCHED" | "EXCEPTION" | "REVERSED";
  exceptionReason?: string | null;
  reconciledByUserId: number;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available.",
    });
  const existing = await db
    .select()
    .from(paymentReconciliations)
    .where(eq(paymentReconciliations.paymentId, input.paymentId))
    .limit(1);
  if (!existing[0])
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Payment reconciliation record not found.",
    });
  await db
    .update(paymentReconciliations)
    .set({
      externalReference:
        input.externalReference ?? existing[0].externalReference,
      status: input.status,
      exceptionReason: input.exceptionReason ?? null,
      reconciledAt: new Date(),
      reconciledByUserId: input.reconciledByUserId,
    })
    .where(eq(paymentReconciliations.id, existing[0].id));
  return (
    await db
      .select()
      .from(paymentReconciliations)
      .where(eq(paymentReconciliations.id, existing[0].id))
      .limit(1)
  )[0];
}

export async function getFinancialReports() {
  const db = await getDb();
  if (!db) return null;
  const [invoicesRows, paymentsRows, scholarshipRows, beamRows] =
    await Promise.all([
      db.select().from(invoices),
      db.select().from(payments),
      db.select().from(scholarships).where(eq(scholarships.status, "APPROVED")),
      db.select().from(beamRecords).where(eq(beamRecords.status, "APPROVED")),
    ]);
  const currencies: Currency[] = ["USD", "ZIG"];
  return {
    byCurrency: currencies.map(currency => {
      const billedMinor = invoicesRows
        .filter(row => row.currency === currency && row.status !== "VOID")
        .reduce((sum, row) => sum + row.totalMinor, 0);
      const collectedMinor = paymentsRows
        .filter(row => row.currency === currency && row.status === "CONFIRMED")
        .reduce((sum, row) => sum + row.amountMinor, 0);
      const assistanceMinor = [...scholarshipRows, ...beamRows]
        .filter(row => row.currency === currency)
        .reduce((sum, row) => sum + row.amountMinor, 0);
      return {
        currency,
        billedMinor,
        collectedMinor,
        assistanceMinor,
        arrearsMinor: Math.max(
          0,
          billedMinor - collectedMinor - assistanceMinor
        ),
      };
    }),
    invoiceCount: invoicesRows.length,
    paymentCount: paymentsRows.length,
    scholarshipCount: scholarshipRows.length,
    beamCount: beamRows.length,
  };
}
