# Security Policy

## Supported versions

This project is currently under active foundation development. Security fixes are applied to the `main` branch first; deployed environments should track a reviewed release or commit rather than an unpinned development build.

| Version or branch | Security support |
| --- | --- |
| `main` | Best effort during active development |
| Unreleased forks | Not guaranteed |

## Reporting a vulnerability

Please do not report security vulnerabilities in a public GitHub issue. Contact the project maintainers privately through the repository owner’s GitHub contact channel and include **Security report** in the subject. If a private contact channel is not available, open a minimal issue asking for a private reporting route without including exploit details.

Include the affected commit or version, a concise description, reproduction steps, impact assessment, and any safe proof of concept. Redact credentials, personal information, school records, and any other sensitive data before sending a report.

You should receive an acknowledgement as soon as practical. The maintainers will validate the report, determine severity, coordinate a fix, and credit the reporter when permission is given. Please avoid public disclosure until a fix or mitigation has been coordinated.

## Data protection expectations

Never commit real learner, guardian, staff, or school data. Treat uploaded logos and documents as potentially sensitive. Use environment variables for credentials, validate uploads, enforce authorization on the server, and keep object-storage access private wherever the deployment supports it.

## Secure development notes

The application uses authenticated procedures and capability-aware authorization for protected foundation actions. Client-side visibility is not a security boundary; every mutation must continue to verify authorization server-side. Dependency and CI changes should be reviewed for supply-chain risk before merging.
