# Contributing to Zimbabwe School Admin

Thank you for helping improve Zimbabwe School Admin. Contributions should make the product more reliable, more understandable, and more useful for real school administration workflows.

## Before you begin

Please search existing issues and pull requests before starting work. For a substantial feature, open an issue first so the proposed scope, data model, permissions, and user workflow can be discussed before implementation begins.

Do not include real student, staff, guardian, or school records in issues, tests, screenshots, fixtures, or pull requests. Use clearly fictional data.

## Local development

```bash
git clone https://github.com/PraiseTechzw/zimbabwe-school-admin.git
cd zimbabwe-school-admin
pnpm install
pnpm dev
```

The repository expects a configured local environment for database-backed development. Keep `.env` files and all credentials outside version control.

## Development standards

Use TypeScript throughout the application. Prefer small, composable React components, explicit shared types, and server-side validation for every mutation. Permission checks belong on the server even when the client hides or disables a control.

Use the existing design language: clear hierarchy, calm navy surfaces, gold accents, accessible contrast, responsive layouts, and concise administrative copy. Avoid introducing a new component library or visual pattern when an existing primitive already solves the problem.

## Validation

Before submitting a pull request, run:

```bash
pnpm check
pnpm test
pnpm build
```

When a change affects a visible workflow, include a short manual verification note in the pull request. If possible, add or update a focused test for new permission, database, or router behaviour.

## Commits and pull requests

Use a short imperative commit subject, such as `Add academic term lifecycle validation` or `Improve school profile layout`. Keep unrelated changes in separate commits where practical.

A pull request should explain the problem, summarize the solution, identify database or environment changes, describe validation performed, and include screenshots for meaningful UI changes. Reviewers should be able to understand the operational impact without reconstructing the feature from the diff.

## Review checklist

| Check | Expectation |
| --- | --- |
| Correctness | The requested workflow works for valid and invalid inputs. |
| Security | Authentication, authorization, validation, and sensitive-data handling are covered. |
| Data integrity | Relations and lifecycle rules remain consistent. |
| Accessibility | Forms have labels, controls are keyboard-friendly, and contrast remains readable. |
| Responsiveness | The workflow remains usable on desktop, tablet, and mobile widths. |
| Documentation | User-facing behaviour and setup changes are documented. |
| Verification | `pnpm check`, `pnpm test`, and `pnpm build` pass. |

## Questions

For general questions, consult [`SUPPORT.md`](SUPPORT.md). For a suspected vulnerability, follow [`SECURITY.md`](SECURITY.md) rather than opening a public issue.
