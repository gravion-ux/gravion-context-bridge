# Gravion Context Bridge

Create privacy-conscious Markdown handoffs that carry an AI-assisted coding session forward.

When a chat ends, a model changes, or a new agent takes over, the next session starts from
zero. You re-explain the project, the architecture, the bug, the decisions and the unfinished
work. **Gravion Context Bridge** turns that context into a structured Markdown document you can
paste into the next conversation.

The goal is not to archive the entire transcript. The goal is to preserve the *working context*
of the project — the parts a new agent actually needs — in a form you can read, edit and review
before sharing it.

---

## Features

- **Session handoff generation** — answer a short set of questions (goal, current state,
  decisions, next steps, blockers) and get a structured Markdown handoff.
- **Workspace context** — a bounded listing of the project tree, so the next agent understands
  the structure without reading the whole repository.
- **Git context** — optional, read-only `git status --short` and `git log -5 --oneline`.
- **Optional editor excerpts** — you decide whether the contents of visible editor tabs are
  included; each excerpt is truncated to a configurable size.
- **Best-effort secret redaction** — common credential patterns are replaced before the handoff
  is written.
- **Approximate token estimate** — a rough character-based size indicator, so you know whether the
  handoff will fit in a fresh context window.
- **Persistent project notes** — durable decisions, constraints and known issues, stored locally
  and included in future handoffs.
- **Local-first** — no telemetry, no model-provider calls, no automatic upload.

## Requirements

- VS Code `1.85.0` or newer.
- Node.js `18` or newer for running the test suite.

## Installation

### From a VSIX

```bash
npm run package
code --install-extension gravion-context-bridge-0.1.0.vsix
```

### From source

1. Clone this repository.
2. Open it in VS Code.
3. Press `F5` to launch the Extension Development Host.
4. Run **Gravion Context Bridge: Create Session Handoff** from the Command Palette.

## Commands

| Command | What it does |
| --- | --- |
| `Gravion Context Bridge: Create Session Handoff` | Walks through the handoff questions, collects workspace/Git/editor context and saves the result. |
| `Gravion Context Bridge: Copy Latest Handoff` | Copies the most recent handoff to the clipboard. |
| `Gravion Context Bridge: Open Latest Handoff` | Opens the most recent handoff in the editor. |
| `Gravion Context Bridge: Add Project Note` | Appends a durable note to `.gravion/project-notes.md`. |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `gravionContextBridge.includeGitContext` | `true` | Include read-only Git status and recent commits. |
| `gravionContextBridge.workspaceListingMaxDepth` | `4` | Maximum directory depth in the workspace listing. |
| `gravionContextBridge.workspaceListingMaxEntries` | `200` | Maximum number of paths listed. |
| `gravionContextBridge.editorExcerptMaxChars` | `4000` | Maximum characters kept per editor excerpt. |
| `gravionContextBridge.redactSecrets` | `true` | Best-effort redaction of common secret patterns. |

## How it works

1. You open a project folder in VS Code.
2. You run **Create Session Handoff**.
3. The extension asks for the task title, goal, current state, decisions, next steps and blockers.
4. It collects a bounded file listing and, when enabled, read-only Git information.
5. It asks whether visible editor contents should be included.
6. It renders a structured Markdown handoff and saves it under `.gravion/handoffs/`.
7. You review it, then copy or open it.
8. You paste it into a new AI coding session.
9. The new agent verifies the actual project files before continuing.

## Files it writes

```text
<workspace>/
└── .gravion/
    ├── handoffs/
    │   └── handoff-20261028-094512.md
    └── project-notes.md
```

`.gravion/` is excluded by `.gitignore`. Handoffs and notes frequently contain private
information, so they never end up in a commit by accident.

## What is skipped when listing the workspace

These directories are never listed:

`node_modules`, `.git`, `dist`, `build`, `coverage`, `.next`

These filenames are never listed, and their contents are never read:

`.env`, `.env.*`, `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`, `*.pem`, `*.key`, `*.p12`, `*.pfx`,
`*.keystore`

## Security and privacy

- Everything is written to your local disk. Nothing is uploaded.
- No telemetry is collected.
- No AI provider is contacted. The extension never sends your code anywhere.
- Editor contents are only included after you explicitly choose to include them.
- Git commands are read-only (`status`, `log`).
- Secret redaction is **best-effort pattern matching, not a complete secret scanner.**
  Always read a handoff before sharing it.

See [SECURITY.md](SECURITY.md) for the full data-handling notes and known limitations.

## Development

```bash
npm test        # runs the Node.js built-in test runner
npm run check   # syntax-checks every JavaScript file
npm run package # builds a VSIX with @vscode/vsce
```

The core logic lives in `src/core.js` and has no VS Code dependency, so it is directly testable.
The VS Code integration lives in `src/extension.js`.

## Project layout

```text
.
├── .github/workflows/ci.yml   # CI: npm test + npm run check on Node 18/20/22
├── src/core.js                # handoff rendering, redaction, token estimate (pure)
├── src/extension.js           # VS Code commands, workspace/Git/editor collection
├── test/core.test.js          # node:test suite for the core module
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
└── package.json
```

## Roadmap

- Handoff schema/version validation.
- Summaries of changed files and outstanding tests.
- Explicit size-budget controls.
- Checks for missing goals, acceptance criteria, blockers and test status.
- Optional agent-specific instruction files.
- VS Code Marketplace release, after the UI smoke tests pass.

## License

MIT — see [LICENSE](LICENSE).
