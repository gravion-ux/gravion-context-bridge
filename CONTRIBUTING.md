# Contributing

Thanks for your interest in Gravion Context Bridge. This is an early MVP, so focused, tested
pull requests are far more useful than large feature dumps.

## Getting set up

```bash
git clone https://github.com/gravion-ux/gravion-context-bridge.git
cd gravion-context-bridge
npm test
npm run check
```

There are no runtime dependencies. Node.js 18 or newer is required for the test runner.

## Running the extension locally

1. Open the folder in VS Code.
2. Press `F5` to start the Extension Development Host.
3. Run the commands from the Command Palette and verify each one behaves as documented.

## Guidelines

- **Keep `src/core.js` free of VS Code imports.** The core module holds the pure logic
  (rendering, redaction, token estimation) so it stays directly testable with `node:test`.
  Anything that needs the VS Code API belongs in `src/extension.js`.
- **Add a test with every behaviour change.** The suite uses Node's built-in test runner:
  `const test = require('node:test');` and `const assert = require('node:assert/strict');`.
- **Keep privacy guarantees intact.**
  - No telemetry.
  - No model-provider API calls.
  - No automatic upload or context sharing.
  - Editor contents require an explicit user choice.
  - Git commands must stay read-only.
- **Never weaken secret redaction silently.** If you add a pattern, add the matching test. If a
  pattern has known false positives, document them in `SECURITY.md`.

## Pull requests

1. Create a branch from `main`.
2. Make the change, with tests.
3. Run `npm test` and `npm run check` — both must pass.
4. Open a pull request describing the behaviour change and the tests you ran.

## Reporting bugs

Open an issue with the VS Code version, your operating system, the steps to reproduce and the
relevant output. Please remove any private project content from the report — handoffs can contain
secrets that the best-effort redaction did not catch.

## Security issues

Do not open a public issue for a security problem. Follow the reporting guidance in
[SECURITY.md](SECURITY.md).

## License

By contributing you agree that your contributions are licensed under the MIT License.
