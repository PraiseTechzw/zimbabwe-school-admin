# Stage 8: school timetable and daily operations

Stage 8 provides a controlled scheduling layer for a Zimbabwean secondary school. It separates recurring timetable entries from dated school events, validates class/teacher/room overlaps before persistence, and exposes different views for school leadership, teachers, learners, and guardians.

## Coverage

| Area | Implementation |
| --- | --- |
| Class timetable | Timetable entries can be attached to an academic year, term, class, subject, teacher, and room. |
| Teacher timetable | Teacher views are scoped through the staff record linked to the signed-in user. |
| Room allocation | A room can be reserved against a slot and is checked for overlap. |
| Laboratory allocation | Laboratory entries require a room whose configured type is `LABORATORY`. |
| Clash detection | Overlapping entries are rejected when they share a class, teacher, or room. Adjacent periods are allowed. |
| Teacher workload | Period counts, total minutes, and decimal hours are calculated from assigned entries. |
| Assembly timetable | Assemblies can be recurring timetable entries or dated `ASSEMBLY` events. |
| Examination timetable | Examination entries and dated `EXAMINATION` events are supported. |
| School events | General school events are represented as dated `SCHOOL_EVENT` records. |
| Sports events | Sports are represented as `SPORTS_EVENT` records. |
| Consultation days | Consultation days are represented as `CONSULTATION_DAY` records. |
| Speech Day | Speech Day is represented as a `SPEECH_DAY` record. |

## Timetable entry rules

A timetable entry has a weekday, start time, end time, academic year, optional term, and optional class, teacher, subject, and room. The server rejects malformed times, reversed time ranges, and conflicts within the same academic year, term, and weekday.

A conflict exists when time intervals overlap and the candidate shares a class, teacher, or room with an existing entry. This prevents double-booking a class, assigning a teacher to two simultaneous lessons, and allocating one room to two simultaneous activities. Laboratory entries also require the selected room to be configured as a laboratory.

The unique database index prevents identical resource-slot combinations from being duplicated, while the server-side overlap detector handles partial overlaps that a simple unique index cannot express.

## Role-specific views

| View | Scope |
| --- | --- |
| Headteacher | Whole-school timetable and event calendar. The current protected procedure requires administrator-level access for this global view. |
| Teacher | Entries attached to the staff record linked to the signed-in user, plus staff-visible events. |
| Learner | Entries attached to classes in the learner’s academic history, plus learner-visible events. |
| Guardian | Entries attached to classes in linked learners’ academic histories, plus learner-visible events. |

Scope is calculated on the server from authenticated user relationships. The client’s role-view selector does not grant access by itself.

## Daily operations

Events are dated records with visibility control. The supported event types are assembly, examination, school event, sports event, consultation day, and Speech Day. Event visibility may be restricted to the Headteacher, staff, learners and guardians, or everyone.

The operations workspace at `/timetable` includes a role-view selector, timetable list, visible upcoming events, schedule builder, resource directory, event publisher, event calendar, and teacher workload cards.

## Files and migration

```text
drizzle/schema.ts                         Stage 8 tables and scheduling enums
drizzle/0006_*.sql                         Stage 8 database migration
server/timetable.ts                        Clash detection, workload, scoping, and mutations
server/timetable.workflow.test.ts          Timetable and workload regression tests
client/src/pages/Timetable.tsx             Operations dashboard and role views
```

Apply the migration to the deployment database with the configured `DATABASE_URL`. Before production use, seed staff-to-user links, learner academic-history class links, rooms, subjects, classes, academic years, and terms so scoped views resolve meaningful records.
