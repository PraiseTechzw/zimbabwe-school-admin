# Stage 10: learner and guardian portals

Stage 10 provides a read-only portal for official learner registration identity and school-service records. The portal reads the same learner, academic history, attendance, timetable, finance, boarding, and school communication records used by administration.

## Official identity

The registration banner is intentionally prominent. It displays the current registration status, Student ID, academic year, current term, and current form before the rest of the portal content.

| Field | Source |
| --- | --- |
| Student ID | The immutable `learners.studentId` value. |
| Admission number | The official `learners.admissionNumber` value. |
| Full name | The official learner name fields. |
| Registration status | The current academic-history record, falling back to the learner registration status when no history exists. |
| Academic year and term | The current academic-history record, with current calendar fallback for new records. |
| Form, stream, and class | The current academic-history form and class records. |
| Boarding/day scholar | The official class attendance mode. |
| House | The learner’s linked house record. |
| Subjects | Subjects attached to the learner’s current class timetable. |

## Learner portal

A learner account is resolved through the learner record linked to the authenticated user. It can view published results, report cards, SBPs, assignments, school notices, documents, attendance history, timetable entries, finance balances and payment history, O-Level records, and boarding exeat status.

The portal does not expose administrative mutation controls. The official Student ID, admission identity, academic placement, marks, attendance, registration status, and financial history are not editable from this interface.

## Guardian portal

A guardian account is resolved through `guardian_contacts.userId` and `learner_guardians`. The child switcher is populated only from those persisted links. Selecting an arbitrary learner ID that is not linked to the guardian is rejected by the server with a forbidden response.

The guardian can switch between multiple linked children and view each child’s registration status, Student ID, current placement, attendance, results, report cards, timetable, assignments, fees, payment history, notices, documents, important alerts, and exeat status where applicable.

> **Privacy guarantee:** guardian child access is scoped on the server, not only hidden in the client interface.

## Publication and read-only rules

Administrative users publish results, report cards, SBPs, assignments, notices, learner documents, and finance records through their controlled workflows. Portal users receive only published or persisted records. No portal mutation procedure is registered for official identity, placement, marks, attendance, or registration data.

Sensitive welfare and counselling records are not included in the general portal snapshot. Those records remain protected by the Stage 5 permission boundaries.

## Files and migration

```text
drizzle/schema.ts                         Portal record tables and learner house linkage
server/portal.ts                           Server-scoped portal read model
client/src/pages/Portal.tsx                Learner/guardian read-only portal
server/portal.workflow.test.ts             Portal read-only and scoping regression tests
drizzle/0006_*.sql                         Stage 10 database migration
```

Apply the migration to the deployment database with the configured `DATABASE_URL`. Before production use, link learner users, guardian users, guardians to learners, current academic-history records, classes, houses, and published content records.
