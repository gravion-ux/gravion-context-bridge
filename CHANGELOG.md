# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-27

Initial MVP.

### Added

- `Create Session Handoff` command that prompts for the task title, goal, current state,
  decisions, next steps and open questions.
- Structured Markdown handoff output with a "Continuation instructions for the next agent"
  section.
- Bounded workspace listing with a configurable depth and entry cap.
- Skipping of `node_modules`, `.git`, `dist`, `build`, `coverage` and `.next`.
- Skipping of `.env*` files, private key files and other credential-bearing filenames.
- Optional read-only Git context (`git status --short`, `git log -5 --oneline --decorate=no`).
- Optional editor excerpts for visible tabs, with per-file truncation.
- Best-effort secret redaction for API keys, GitHub tokens, AWS access key IDs, private key
  blocks, bearer tokens and named secret assignments.
- Approximate token estimation based on a four-character budget.
- `Add Project Note` command storing durable notes in `.gravion/project-notes.md`.
- `Copy Latest Handoff` and `Open Latest Handoff` commands.
- Project notes are included in generated handoffs.
- GitHub Actions CI running `npm test` and `npm run check` on Node.js 18, 20 and 22.

### Known limitations

- Secret redaction is best-effort pattern matching, not a complete secret scanner.
- Token estimation is approximate and not tied to any specific tokenizer.
- The VS Code UI has not yet been validated through a full manual smoke test.

[0.1.0]: https://github.com/gravion-ux/gravion-context-bridge/releases/tag/v0.1.0
