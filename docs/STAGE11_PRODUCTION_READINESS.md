# Stage 11: reporting, security, audit, compliance, and production readiness

Stage 11 is the final production-readiness layer for the Zimbabwean secondary school system. It does not introduce university or college functionality. It adds evidence, controls, integrity checks, and operational visibility over Stages 1–10.

## Implemented production controls

| Control | Implementation |
| --- | --- |
| Executive reporting | Server-generated enrolment, demographics, form/class, boarding/day, staff, attendance, academic, examination, discipline, welfare, admissions, and finance summaries. |
| Report filtering | Academic year, term, form, class, gender, and boarding status filters are validated and applied server-side. |
| CSV export | Administrator-only CSV export from the executive report. |
| PDF-ready output | The dashboard provides a print/save-to-PDF workflow without claiming a server-side PDF was generated. |
| Audit trail | Append-only audit records contain user, role, action, entity, entity ID, before/after values, reason, IP, device, and timestamp fields. |
| Student ID audit | Detects missing, invalid, duplicate, duplicate-active, and orphaned academic records. |
| Health checks | Reports database, authentication, storage, notification, payment, backup, and background-job status without exposing secrets. |
| Notification audit | Tracks pending, sent, delivered, and failed notification status; delivery is not claimed without provider confirmation. |
| Sensitive reporting | Executive summaries exclude national IDs, medical data, welfare narratives, and counselling notes. |

## Report areas

The executive report is intentionally built from persisted records rather than placeholder statistics. It includes learner totals, active learners, staff establishment, boarding and day-scholar counts, attendance rate, academic pass rate, missing marks, O-Level candidates, A-Level applications, discipline incidents, open welfare cases, gender/form/class breakdowns, grade distribution, USD/ZiG invoicing and collection totals, and admissions by status.

The same report data can be filtered by academic period and placement dimensions. Leadership can use the CSV export for Excel-compatible analysis. The print action provides a browser-native PDF workflow so the exported view reflects the report currently visible to the authorized administrator.

## Audit policy

Sensitive actions are recorded through `recordAuditEvent`. Current hooks cover learner creation, academic-history creation, O-Level result creation, explicit Form 5 enrolment, Form 6 progression, invoice creation, payment recording, payment reconciliation, and reversals. The audit table has no ordinary-user update or delete procedure.

Further domain-specific audit hooks should be added before production for every remaining mutation path, including role and permission changes, result locking/unlocking, withdrawals, transfers, school-document changes, and notification provider callbacks.

## Student ID integrity

The Student ID is a stable learner identity and must not change during Form 1–6 progression. The integrity audit checks the configured format `PREFIX-YYYY-NNN`, missing IDs, repeated IDs, repeated IDs among active learners, and academic-history rows whose learner no longer exists. Running the audit records findings; it does not rewrite learner data or destroy history.

## Role and server authorization

The reporting, audit, integrity, and health procedures are administrator-only. Existing Stage 3–10 procedures remain server-protected through `adminProcedure`, `protectedProcedure`, and domain permission checks. Guardian and learner portals use relationship-scoped reads, while welfare, safeguarding, medical, finance, examination, and academic mutations remain outside portal access.

The production security review must still be performed against the deployed authentication configuration, because local tests cannot prove the security of an external identity provider, reverse proxy, or production network.

## Backup and recovery runbook

A backup is not considered successful merely because a command exited. The deployment owner must configure a scheduled database backup, retain multiple restore points, encrypt backup storage, and perform a restore test into an isolated database.

Recommended operational sequence:

1. Record the migration version and application release before the backup.
2. Create a consistent database dump using the managed MySQL/TiDB backup facility or an approved `mysqldump` equivalent.
3. Store the encrypted backup outside the application host with a documented retention policy.
4. Restore the dump into an isolated database with no production credentials.
5. Apply migrations to the restored copy and run the application health checks.
6. Verify learner Student IDs, academic-history counts, invoices, payment receipts, attendance, and audit rows.
7. Record the restore result and set `BACKUP_LAST_SUCCESS_AT` only after verification.

The system health dashboard reports backup status as `NOT_CONFIGURED` unless `BACKUP_LAST_SUCCESS_AT` is provided. This prevents the interface from presenting an unverified backup as healthy.

## Deployment checklist

Before production use, configure `DATABASE_URL`, object storage, authentication, notification providers, Paynow settings through the admin dashboard, backup monitoring, and error monitoring. Apply all committed migrations in order. Seed school-specific forms, streams, subjects, houses, rooms, roles, permissions, and academic periods. Then run the Stage 11 integrity audit and review the output.

## Genuine remaining issues

The repository now contains the reporting and control surfaces, but production readiness still requires deployment-specific verification: a real restore test, real notification-provider delivery callbacks, external payment reconciliation, live identity-provider testing, and a complete review of every historical mutation path for audit coverage. These are intentionally not marked complete from local UI presence alone.
