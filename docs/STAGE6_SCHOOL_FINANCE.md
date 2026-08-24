# Stage 6: school finance

Stage 6 provides a controlled finance workspace for Zimbabwean secondary-school operations. All learner-facing financial records are attached to a **financial account**, and every financial account belongs to exactly one learner through the learner’s stable Student ID relationship.

## Financial coverage

| Area | Implementation |
| --- | --- |
| Fee structures | Academic-year, form, pathway, residency, currency, frequency, and item-level charges. |
| Residency | Separate `BOARDING`, `DAY_SCHOLAR`, and `ALL` fee structures and approved charges. |
| Approved charges | Charges have an approval lifecycle before they are used for billing. |
| Term invoices | Invoices may be linked to academic year, term, fee structure, and financial account. |
| Currencies | USD and ZiG are stored as separate currency accounts; the system never performs an implicit conversion. |
| Payment channels | Cash, bank transfer, EcoCash, ZIPIT, InnBucks, Paynow, card, and other controlled methods. |
| Receipts | A unique receipt number is stored on every payment. |
| Statements | Per-learner statements show accounts, invoices, payments, approved scholarships, BEAM credits, balances, and arrears. |
| Assistance | Scholarships and BEAM-related records are applied as account credits after approval. |
| Reconciliation | Each payment receives a reconciliation record that can be matched, left unmatched, marked as an exception, or reversed. |
| Reports | Billed, collected, assistance, arrears, invoice count, payment count, scholarship count, and BEAM count are reported per currency. |

## Student ID and account rules

The `financial_accounts` table is keyed by learner and currency. A learner may have one USD account and one ZiG account, each with an account number derived from the learner’s Student ID. Invoices, payments, scholarships, and BEAM records store the corresponding `financialAccountId` as well as `learnerId` for safe query scoping.

The server validates that a supplied financial account belongs to the learner in the request and that its currency matches the invoice or payment. When no account is supplied, the server creates the correct currency account for the learner. This prevents one learner’s account from being attached to another learner’s invoice or payment.

## Guardian access

The finance overview is scoped on the server. A guardian may see only learners connected through `learner_guardians`; a learner may see only their own linked account. The statement procedure repeats this authorization check for the requested learner ID, so changing a URL parameter or form value cannot reveal another learner’s financial information.

Guardians have read access to balances and payment history. Financial administration mutations remain administrator-only, including fee-structure creation, invoice issuance, payment recording, assistance records, reconciliation, reports, and Paynow configuration.

> **Privacy guarantee:** financial account scoping is enforced in server procedures, not only in the client interface.

## Paynow configuration

Paynow integration details are entered in the administrator finance dashboard. The integration ID, return URL, and result URL are stored with the active setting. The integration key is encrypted before persistence and is never returned in the finance overview. Configure `FINANCE_SECRET_KEY` or `PAYNOW_ENCRYPTION_KEY` in the deployment environment before saving credentials.

The current implementation stores Paynow configuration and supports recording a confirmed `PAYNOW` payment. A future integration adapter can use the encrypted credentials to create payment requests and process result callbacks without changing learner account or invoice contracts.

## Amounts and currency

Amounts are stored as integer minor units, for example `25000` represents `USD 250.00` or `ZiG 250.00` depending on the record currency. USD and ZiG totals are reported independently. Exchange rates, conversions, and settlement rules must be explicitly configured in a future financial policy rather than inferred by the application.

## Migration and files

```text
drizzle/schema.ts                         Stage 6 tables and finance enums
drizzle/0004_dear_purple_man.sql           Stage 6 database migration
server/finance.ts                          Finance domain, scoping, reports, and Paynow settings
server/routers.ts                          Validated finance tRPC procedures
client/src/pages/Finance.tsx               Admin and guardian-scoped finance workspace
server/finance.workflow.test.ts             Currency and invoice calculation tests
```

Apply the migration to the deployment database with the configured `DATABASE_URL`. Never place live Paynow credentials, bank details, payment references, or learner financial information in fixtures, screenshots, commits, or issue reports.
