# Stage 3: learner academic history, progression, and A-Level admission

Stage 3 separates a learner’s permanent academic history from the current academic status shown in portals. Every year-and-term placement is an append-only record identified by the learner’s stable Student ID.

## Progression workflows

| Workflow | Allowed path | System behaviour |
| --- | --- | --- |
| Normal secondary progression | Form 1 → Form 2 → Form 3 → Form 4 | Server validation permits one O-Level form step at a time and rejects skips. |
| A-Level admission | Form 4 → O-Level results → application → verification → selection/admission → Form 5 | No Form 5 record is created by Form 4 completion or application acceptance alone. Administration must explicitly enrol the learner. |
| A-Level continuation | Form 5 → Form 6 | Administration explicitly creates a new Form 6 history record while retaining the same Student ID and all earlier history. |

The generic history procedure rejects A-Level admission and continuation progression types. Those transitions are handled by dedicated procedures that enforce their prerequisites.

## Stored records

The learner record stores stable identity. `learner_academic_history` stores academic year, term, form, class, pathway, registration status, progression type, previous record reference, and the recording user. The year-and-term uniqueness constraint prevents duplicate snapshots while preventing updates to prior history.

O-Level results store examination year, candidate number, centre number, candidate name, verification status, and individual subject grades. Results are append-only per learner and examination year.

A-Level requirements are school-configured. They can define minimum passes, minimum points, required subjects, and subject-specific minimum grades. Applications store the preferred A-Level pathway, selected subject combination, O-Level result reference, application status, verification status, selection decision, admission decision, timestamps, and notes.

## Application statuses

The application status enum is: Not Started, Draft, Submitted, Under Review, Results Verification, Accepted, Conditionally Accepted, Rejected, or Withdrawn. Acceptance requires verified results and a selected learner. Explicit Form 5 enrolment additionally requires an admitted decision.

## Portal status

The `academic.portalStatus` read model returns the latest academic history, year, term, form, learner registration, ZIMSEC result, and latest A-Level application. It supports a learner linked directly by `learners.userId` and a guardian linked through `guardian_contacts`, `learner_guardians`, and `guardian_contacts.userId`.

A portal should present fields such as Academic Year, Term, Current Form, Pathway, Registration, ZIMSEC Candidate, A-Level Application, and Student ID. The portal is a current-status view; it must never replace the permanent academic timeline.

## Implementation map

```text
drizzle/schema.ts                         Stage 3 tables and enum states
drizzle/0002_stage3_academic_history.sql  Database migration
server/academic.ts                        Domain helpers and transition guards
server/routers.ts                         Protected tRPC contracts
client/src/pages/AcademicHistory.tsx       Administration and portal status workspace
server/academic.validation.test.ts         Normal progression tests
```

All Stage 3 procedures use server-side input validation. Authorization remains enforced through the existing authenticated/admin procedure model, and sensitive school or learner data must not be placed in fixtures, screenshots, or issue reports.
