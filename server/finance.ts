import { and, asc, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { academicYears, feeStructureItems, feeStructures, forms, invoiceLines, invoices, learners, payments } from "../drizzle/schema";
import { getDb } from "./db";

export type InvoiceLineInput = { feeItemId?: number | null; description: string; quantity: number; unitAmountMinor: number };

export function calculateInvoiceTotals(lines: InvoiceLineInput[], discountMinor = 0) {
  if (lines.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "An invoice must contain at least one line item." });
  if (discountMinor < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Discount cannot be negative." });
  const lineTotals = lines.map(line => ({ ...line, lineTotalMinor: line.quantity * line.unitAmountMinor }));
  const subtotalMinor = lineTotals.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  if (lineTotals.some(line => line.quantity <= 0 || line.unitAmountMinor < 0) || discountMinor > subtotalMinor) throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice quantities, amounts, and discount must be valid." });
  return { lineTotals, subtotalMinor, discountMinor, totalMinor: subtotalMinor - discountMinor };
}

export async function getFinanceData() {
  const db = await getDb();
  if (!db) return null;
  const [structureRows, itemRows, invoiceRows, lineRows, paymentRows, learnerRows, yearRows, formRows] = await Promise.all([
    db.select().from(feeStructures).orderBy(desc(feeStructures.createdAt)),
    db.select().from(feeStructureItems).orderBy(asc(feeStructureItems.name)),
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select().from(invoiceLines),
    db.select().from(payments).orderBy(desc(payments.paidAt)),
    db.select().from(learners).orderBy(asc(learners.lastName), asc(learners.firstName)),
    db.select().from(academicYears).orderBy(desc(academicYears.startDate)),
    db.select().from(forms).orderBy(asc(forms.formNumber)),
  ]);
  return { feeStructures: structureRows, feeStructureItems: itemRows, invoices: invoiceRows, invoiceLines: lineRows, payments: paymentRows, learners: learnerRows, academicYears: yearRows, forms: formRows };
}

export async function createFeeStructure(input: { name: string; academicYearId: number; formId?: number | null; pathway?: "O_LEVEL" | "A_LEVEL" | null; currency: string; items: Array<{ code: string; name: string; description?: string | null; amountMinor: number; frequency: "ONCE" | "TERM" | "ANNUAL"; isMandatory: boolean }>; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const normalizedCurrency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new TRPCError({ code: "BAD_REQUEST", message: "Currency must be a three-letter ISO-style code." });
  if (input.items.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "A fee structure requires at least one fee item." });
  const result = await db.insert(feeStructures).values({ name: input.name, academicYearId: input.academicYearId, formId: input.formId ?? null, pathway: input.pathway ?? null, currency: normalizedCurrency, isActive: true, createdByUserId: input.createdByUserId });
  const structureId = Number(result[0].insertId);
  await db.insert(feeStructureItems).values(input.items.map(item => ({ feeStructureId: structureId, ...item })));
  return (await db.select().from(feeStructures).where(eq(feeStructures.id, structureId)).limit(1))[0];
}

export async function createInvoice(input: { learnerId: number; academicYearId: number; feeStructureId?: number | null; invoiceNumber: string; currency: string; discountMinor?: number; dueDate?: Date | null; status: "DRAFT" | "ISSUED"; notes?: string | null; lines: InvoiceLineInput[]; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  const totals = calculateInvoiceTotals(input.lines, input.discountMinor ?? 0);
  const normalizedCurrency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new TRPCError({ code: "BAD_REQUEST", message: "Currency must be a three-letter ISO-style code." });
  const result = await db.insert(invoices).values({ invoiceNumber: input.invoiceNumber, learnerId: input.learnerId, academicYearId: input.academicYearId, feeStructureId: input.feeStructureId ?? null, currency: normalizedCurrency, subtotalMinor: totals.subtotalMinor, discountMinor: totals.discountMinor, totalMinor: totals.totalMinor, status: input.status, issuedAt: input.status === "ISSUED" ? new Date() : null, dueDate: input.dueDate ?? null, notes: input.notes ?? null, createdByUserId: input.createdByUserId });
  const invoiceId = Number(result[0].insertId);
  await db.insert(invoiceLines).values(totals.lineTotals.map(line => ({ invoiceId, feeItemId: line.feeItemId ?? null, description: line.description, quantity: line.quantity, unitAmountMinor: line.unitAmountMinor, lineTotalMinor: line.lineTotalMinor })));
  return (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
}

export async function recordPayment(input: { learnerId: number; invoiceId?: number | null; receiptNumber: string; amountMinor: number; currency: string; method: "CASH" | "ECOCASH" | "ZIPIT" | "BANK_TRANSFER" | "CARD" | "OTHER"; reference?: string | null; status: "PENDING" | "CONFIRMED"; paidAt?: Date; notes?: string | null; receivedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
  if (input.amountMinor <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Payment amount must be greater than zero." });
  const normalizedCurrency = input.currency.trim().toUpperCase();
  const invoice = input.invoiceId ? (await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1))[0] : null;
  if (input.invoiceId && !invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
  if (invoice && (invoice.learnerId !== input.learnerId || invoice.currency !== normalizedCurrency)) throw new TRPCError({ code: "BAD_REQUEST", message: "Payment learner and currency must match the invoice." });
  if (invoice && input.status === "CONFIRMED") {
    const confirmed = await db.select().from(payments).where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, "CONFIRMED")));
    const paidMinor = confirmed.reduce((sum, payment) => sum + payment.amountMinor, 0);
    if (paidMinor + input.amountMinor > invoice.totalMinor) throw new TRPCError({ code: "BAD_REQUEST", message: "Payment exceeds the outstanding invoice balance." });
  }
  const result = await db.insert(payments).values({ learnerId: input.learnerId, invoiceId: input.invoiceId ?? null, receiptNumber: input.receiptNumber, amountMinor: input.amountMinor, currency: normalizedCurrency, method: input.method, reference: input.reference ?? null, status: input.status, paidAt: input.paidAt ?? new Date(), notes: input.notes ?? null, receivedByUserId: input.receivedByUserId });
  const paymentId = Number(result[0].insertId);
  if (invoice && input.status === "CONFIRMED") {
    const confirmed = await db.select().from(payments).where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, "CONFIRMED")));
    const paidMinor = confirmed.reduce((sum, payment) => sum + payment.amountMinor, 0);
    await db.update(invoices).set({ status: paidMinor >= invoice.totalMinor ? "PAID" : "PARTIALLY_PAID" }).where(eq(invoices.id, invoice.id));
  }
  return (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
}
