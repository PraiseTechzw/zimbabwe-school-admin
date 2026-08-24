# Architecture

## Purpose

Zimbabwe School Admin is being built as a modular web application. Stage 1 establishes the durable school foundation that future operational modules can depend on without duplicating identity, academic, people, facilities, or authorization logic.

## System boundaries

| Boundary | Responsibility |
| --- | --- |
| React client | Responsive workflows, form state, capability-aware controls, feedback, and presentation |
| Server and tRPC | Authentication-aware procedures, input validation, authorization, mutations, and query orchestration |
| Drizzle and MySQL-compatible storage | Relational records, constraints, migrations, and referential integrity |
| Object storage | Logo and document objects referenced by secure application records |
| Shared modules | Cross-boundary constants, types, and stable application contracts |

## Foundation domains

The school profile stores official identity, MoPSE registration context, contacts, branding, and headteacher details. Academic structure stores academic years, terms, forms, pathways, classes, streams, attendance modes, subjects, and departments. People and access stores staff, staff roles, permissions, and role assignments. Operations stores houses, rooms, laboratories, and teacher assignments.

These domains are related but intentionally separable. A later feature should reference the existing records rather than introduce a parallel representation of a school, academic year, staff member, subject, or class.

## Authorization model

Protected procedures validate the authenticated user and then check the relevant capability on the server. Capabilities map to foundation areas such as profile, calendar, structure, subjects, facilities, staff, and assignments. The client uses the same capability result to disable or hide controls, but the server remains the security boundary.

## Data and lifecycle principles

Database relationships should be explicit and enforced. Lifecycle operations should reject invalid references, preserve auditability where required, and avoid silent cascades that could remove operational history. Uploaded files should remain outside relational storage, with only controlled object references and metadata stored in the database.

## Extension guidance

New modules should document their user roles, permissions, records, relations, validation rules, and operational lifecycle before implementation. New mutations should include server-side authorization and focused tests. New UI should reuse the existing primitives and remain usable at desktop, tablet, and mobile widths.

## Current implementation map

```text
client/src/pages/Home.tsx       Foundation dashboard and setup workflows
client/src/components/          Shared interface primitives and layout pieces
server/routers.ts               Authenticated tRPC procedures and capability checks
server/db.ts                    Relational reads, writes, and permission queries
drizzle/schema.ts               Database tables and relations
shared/types.ts                 Shared application contracts
```
