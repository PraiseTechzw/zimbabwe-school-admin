# GitHub workflow

This project uses GitHub as the source of truth for planning, review, and delivery. The workflow is the same for a person or a coding agent: work must be traceable to an issue, changes must be isolated in a branch, and `main` must receive reviewed, passing changes through a pull request.

## End-to-end process

| Step | Required practice |
| --- | --- |
| 1. Plan | Search existing issues. Create or select one that describes the problem and acceptance criteria. |
| 2. Branch | Start from the latest `main` and create a short-lived branch using `feature/`, `fix/`, `docs/`, `refactor/`, `chore/`, or `security/`. |
| 3. Implement | Keep the change focused. Preserve unrelated work and protect data, permissions, and secrets. |
| 4. Validate | Run `pnpm check`, `pnpm test`, and `pnpm build`. Add focused tests for changed behaviour. |
| 5. Pull request | Open a PR into `main`, link the issue, explain the design and validation, and attach redacted UI evidence when relevant. |
| 6. Review | Address review comments. At least one appropriate reviewer should approve, and CI must pass. |
| 7. Merge | Use a squash merge after approval and passing checks. Do not merge directly to `main` or bypass required checks. |
| 8. Clean up | Delete the merged branch and update the issue, changelog, or documentation when appropriate. |

## Branch examples

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/student-enrolment
# or: fix/term-lifecycle-validation
# or: docs/improve-contributor-guide
```

Branch names should describe the work, not the person or tool making the change. Avoid long-lived branches and avoid committing directly to `main`.

## Issue quality

A good issue explains who is affected, what is difficult today, what the desired result is, and how success will be verified. Feature issues should identify roles, permissions, data relationships, privacy considerations, and acceptance criteria. Bug reports should include a minimal reproduction and sanitized environment details.

## Pull request quality

A pull request should be small enough to review confidently. The description must state the issue being solved, the implementation approach, validation results, migration or environment changes, and security or permission impact. UI changes need screenshots or a clear reason screenshots are not applicable. Never use real school or personal records in evidence.

## Rules for agents

An agent may inspect, implement, test, and propose changes, but it must not merge its own pull request, bypass review, disable CI, or fabricate validation. The agent must report assumptions, ask when requirements are materially ambiguous, and leave a human-readable summary in the pull request.

## Rules for reviewers

Reviewers should check behaviour, authorization, data integrity, privacy, accessibility, responsive layout, tests, documentation, and migration safety. Review comments should be specific and actionable. Approval means the reviewer is satisfied that the change is safe to merge, not merely that it compiles.

## References

[1]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests "GitHub pull request documentation"
[2]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository "GitHub branch and merge documentation"

The workflow aligns with GitHub’s pull request and branch-management guidance. [1] [2]
