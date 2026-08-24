# Repository instructions for contributors and coding agents

These instructions apply to every change in this repository, whether it is made by a human contributor, an automated coding agent, or a maintainer.

## Required workflow

Start from an up-to-date `main` branch. Work in a short-lived branch named with one of these prefixes:

| Prefix | Use |
| --- | --- |
| `feature/` | New user-facing capability |
| `fix/` | Correctness or regression fix |
| `docs/` | Documentation-only change |
| `refactor/` | Internal restructuring without intended behaviour change |
| `chore/` | Tooling, dependency, or maintenance work |
| `security/` | Security hardening or vulnerability remediation |

Every non-trivial change must have a linked GitHub issue. If no issue exists, create one before implementation. Use the issue templates and explain the problem, expected outcome, affected roles, permissions, data, and acceptance criteria.

Open a pull request into `main`; do not push directly to `main`. Keep the pull request focused, link the issue, describe validation, and include screenshots for meaningful UI changes. Wait for CI and required review before merging.

## Engineering rules

Use TypeScript and the existing React, tRPC, Drizzle, and UI primitives. Validate all external input on the server. Treat server-side authorization as the security boundary; hiding a client control is not permission enforcement. Preserve relational integrity and document migrations.

Never commit secrets, credentials, production URLs, real learner or staff data, school documents, or unredacted screenshots. Use fictional fixtures and sanitized examples only.

## Required validation

Run these commands before opening or updating a pull request:

```bash
pnpm check
pnpm test
pnpm build
```

If a command cannot run because an external service or environment variable is unavailable, state that clearly in the pull request rather than claiming success.

## Agent-specific expectations

Agents must inspect the repository before editing, explain assumptions in the pull request, avoid unrelated rewrites, and preserve user-authored changes. Agents must not merge their own pull requests, bypass CI, weaken authorization, disable security checks, or create fabricated test evidence. When requirements are ambiguous, the agent should ask for clarification or make the narrowest reversible change.

## Documentation

Update the README, architecture notes, changelog, or relevant workflow documentation when a change affects setup, behaviour, data, permissions, security, or user-facing workflows. Follow [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SECURITY.md`](SECURITY.md), and [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md).
