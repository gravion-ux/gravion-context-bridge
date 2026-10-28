# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| < 0.1 | No |

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](https://github.com/gravion-ux/gravion-context-bridge/security/advisories/new)
on this repository. If that is unavailable, open a regular issue that contains **no exploit
details and no private data**, and ask for a private channel.

Please do not include real credentials, tokens or customer data in a report. Redact them first.

You can expect an acknowledgement within a few days. Because this is an early MVP maintained by
one person, a full fix timeline is not guaranteed — please describe the impact clearly so it can
be prioritised.

## Data handling

Gravion Context Bridge is local-first by design:

- Handoffs are written to `<workspace>/.gravion/handoffs/` on your machine.
- Project notes are written to `<workspace>/.gravion/project-notes.md`.
- `.gravion/` is excluded by `.gitignore`, so handoffs and notes are not committed by accident.
- **No telemetry** is collected.
- **No AI provider is contacted.** The extension never sends code, prompts or handoffs to a
  model API.
- **No automatic upload or context sharing** happens. You decide whether and where to share a
  handoff, by copying it or pasting it yourself.
- Editor contents are only collected after you explicitly choose to include them.
- Git commands are read-only: `git status --short` and `git log -5 --oneline --decorate=no`.

## Secret redaction is best-effort

When redaction is enabled (the default), the extension replaces common credential patterns:

- Private key blocks (`-----BEGIN ... PRIVATE KEY-----`).
- GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`, `github_pat_`).
- AWS access key IDs (`AKIA` + 16 characters).
- Stripe-style keys (`sk_live_`, `sk_test_`, `rk_live_`, `pk_live_` and variants).
- OpenAI-style keys (`sk-...`).
- Bearer tokens.
- Named assignments such as `API_KEY=...`, `"api_key": "..."`, `token: ...`, `password = ...`,
  `client_secret=...`.

**This is pattern matching, not a complete secret scanner.** Known limitations:

- Values that are unquoted and contain spaces are only partially redacted
  (`password: my secret phrase` redacts only the first word).
- Credentials with unusual formats, custom names or encodings (base64, encrypted blobs,
  environment-specific formats) are not detected.
- The redaction runs on the generated text; it does not scan your project as a whole.
- Redaction can produce false positives on ordinary text that looks like a secret assignment.

**Always read a handoff before sharing it.** Treat every handoff as potentially containing
sensitive material.

## Files that are never read or listed

The workspace listing excludes `node_modules`, `.git`, `dist`, `build`, `coverage` and `.next`.
Files commonly used to store credentials — `.env`, `.env.*`, `id_rsa`, `id_dsa`, `id_ecdsa`,
`id_ed25519`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore` — are never listed and their
contents are never collected.

This is a convenience filter, not a guarantee: a secret stored under an unusual filename can
still appear in a listing, and an editor excerpt can contain anything in that file.

## Known gaps in this release

- Secret redaction does not cover every credential format (see above).
- Token estimation is approximate and not tied to any specific tokenizer.
- The VS Code UI has not yet been validated through a full manual smoke test.
- There is no defence against a compromised editor, extension or operating system.
