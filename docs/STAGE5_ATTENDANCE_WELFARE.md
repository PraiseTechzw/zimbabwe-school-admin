# Stage 5: attendance, discipline, and learner welfare

Stage 5 separates operational attention indicators from sensitive learner records. Attendance and general discipline workflows can support day-to-day administration, while counselling, welfare, safeguarding, and medical content is protected behind explicit permission codes.

## Operational workflows

| Area | Stored workflow | Privacy behaviour |
| --- | --- | --- |
| Daily attendance | One session per date with learner statuses | Status and guardian-alert state may appear in operational dashboards. |
| Period attendance | One session per date and period | Period number is required server-side. |
| Late arrivals | Attendance status `LATE`, optional arrival time | Queues a guardian alert. |
| Excused absences | Attendance status `EXCUSED` with reason | Does not trigger an absence alert. |
| Boarding roll call | Attendance mode `BOARDING_ROLL_CALL` | Uses the same immutable attendance record model. |
| Guardian absence alerts | Durable `guardian_alerts` records | General users see alert counts, not message history or welfare details. |
| Discipline | Incident followed by linked action | Demerit, detention, and suspension actions remain auditable. |
| Prefect reports | Separate report record for review | Does not disclose welfare or safeguarding details. |
| Boarding exeats | Request, approval, return, or cancellation lifecycle | Requires destination, reason, departure, and expected return. |

## Sensitive workflows

`welfare_cases` stores case summaries, severity, assignment, status, and private notes. `safeguarding_referrals` stores referral details, status, agency, and resolution data. `counselling_records` stores session notes and follow-up information. `medical_profiles` stores health and emergency information. These are returned only through the permission-gated sensitive endpoint.

The permission codes are deliberately separate: `WELFARE_SENSITIVE_VIEW`, `SAFEGUARDING_MANAGE`, and `MEDICAL_SENSITIVE_VIEW`. Attendance, discipline, and boarding use their own management permissions. A user with attendance access must not implicitly receive counselling, safeguarding, or medical data.

## Attention dashboards

The general Stage 5 dashboard returns counts and minimal attendance indicators. It does not return welfare summaries, counselling notes, safeguarding details, medical fields, incident narratives, or referral information. Authorized sensitive users can use the separate sensitive read model after the server verifies the welfare permission.

> **Privacy rule:** dashboard attention is a signal that a learner requires an authorized follow-up; it is not a disclosure of why the learner requires support.

## Data model

- `attendance_sessions` and `attendance_records` preserve daily, period, late, excused, and boarding roll-call history.
- `guardian_alerts` provides an auditable queue for absence and late-arrival notifications.
- `discipline_incidents`, `discipline_actions`, and `prefect_reports` preserve conduct workflows and actions.
- `counselling_records`, `welfare_cases`, and `safeguarding_referrals` isolate sensitive welfare information.
- `medical_profiles` stores one protected current health/emergency profile per learner.
- `exeat_requests` preserves boarding movement requests and decisions.

## Server and client map

```text
drizzle/schema.ts                         Stage 5 tables and permission-oriented states
drizzle/0003_chemical_moonstone.sql        Stage 4/5 database migration
server/welfare.ts                         Privacy gates and domain workflows
server/routers.ts                          Protected tRPC contracts
client/src/pages/Welfare.tsx               Attendance and welfare administration workspace
server/welfare.workflow.test.ts             Privacy and attention-indicator tests
```

The migration must be applied in the deployment environment using its configured `DATABASE_URL`. Sensitive sample values must never be committed to fixtures, screenshots, or issue reports.
