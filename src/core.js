'use strict';

const DEFAULTS = Object.freeze({
  redactSecrets: true,
  workspaceListingMaxEntries: 200,
  workspaceListingMaxDepth: 4,
  editorExcerptMaxChars: 4000,
});

/**
 * Directories that are never listed in a handoff. They are generated,
 * vendored or otherwise noisy and add no useful context.
 */
const SKIP_DIRECTORIES = Object.freeze([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
]);

function asText(value) {
  return value == null ? '' : String(value).replace(/\r\n/g, '\n');
}

function cleanSection(value, fallback = '_Not provided._') {
  const text = asText(value).trim();
  return text || fallback;
}

/**
 * True when a directory should be excluded from the workspace listing.
 */
function shouldSkipDirectory(name) {
  return SKIP_DIRECTORIES.includes(asText(name).trim());
}

/**
 * True for filenames that commonly hold credentials. These are never
 * listed and their contents are never collected.
 */
function isSecretFileName(name) {
  const fileName = asText(name).trim();
  if (!fileName) {
    return false;
  }
  if (fileName === '.env' || fileName.startsWith('.env.')) {
    return true;
  }
  if (/^(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)$/i.test(fileName)) {
    return true;
  }
  return /\.(?:pem|key|p12|pfx|keystore)$/i.test(fileName);
}

/**
 * Truncates text to a maximum character count and reports whether the
 * content was cut, so callers can label the excerpt honestly.
 */
function truncateText(value, maxChars) {
  const text = asText(value);
  const limit = Number.isFinite(maxChars) && maxChars > 0
    ? Math.floor(maxChars)
    : DEFAULTS.editorExcerptMaxChars;

  if (text.length <= limit) {
    return { text, truncated: false };
  }
  return { text: text.slice(0, limit), truncated: true };
}

/**
 * Redacts a deliberately narrow set of common credential formats. This is a
 * convenience layer, not a substitute for reviewing content before sharing.
 */
function redactSecrets(value) {
  let text = asText(value);

  text = text.replace(
    /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/gi,
    '[REDACTED PRIVATE KEY]'
  );
  text = text.replace(
    /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
    '[REDACTED GITHUB TOKEN]'
  );
  text = text.replace(/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED AWS ACCESS KEY]');
  text = text.replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g, '[REDACTED API KEY]');
  text = text.replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/g, '[REDACTED API KEY]');

  // Named assignments such as API_KEY=..., "api_key": "..." or token: ...
  // The name may start with the keyword itself, so the keyword is allowed to
  // begin at the first character of the name.
  text = text.replace(
    /([A-Za-z0-9_.-]*(?:api[_-]?key|secret|token|password|passwd|passphrase|credential|authorization)[A-Za-z0-9_.-]*)(\s*["']?\s*[:=]\s*)("[^"\n]*"|'[^'\n]*'|Bearer\s+[A-Za-z0-9._~+/=-]{8,}|[^\s"'`]+)/gi,
    (match, name, separator, rawValue) => {
      const quote = rawValue.startsWith('"') ? '"' : rawValue.startsWith("'") ? "'" : '';
      return `${name}${separator}${quote}[REDACTED]${quote}`;
    }
  );

  // Bare Authorization headers that are not attached to a named field.
  text = text.replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1[REDACTED]');

  return text;
}

function estimateTokens(value) {
  const length = asText(value).length;
  return length === 0 ? 0 : Math.ceil(length / 4);
}

function formatWorkspaceListing(entries, options = {}) {
  const maxEntries = Number.isFinite(options.maxEntries)
    ? Math.max(0, Math.floor(options.maxEntries))
    : DEFAULTS.workspaceListingMaxEntries;
  const safeEntries = Array.isArray(entries) ? entries.slice(0, maxEntries) : [];
  const lines = safeEntries.map((entry) => {
    if (typeof entry === 'string') {
      return `- ${entry}`;
    }
    const suffix = entry && entry.kind === 'directory' ? '/' : '';
    return `- ${asText(entry && entry.path)}${suffix}`;
  });
  if (Array.isArray(entries) && entries.length > safeEntries.length) {
    lines.push(`- _Listing capped at ${maxEntries} entries._`);
  }
  return lines.length ? lines.join('\n') : '_No workspace entries collected._';
}

function formatEditorExcerpts(excerpts) {
  if (!Array.isArray(excerpts) || excerpts.length === 0) {
    return '_No editor excerpts included._';
  }
  return excerpts.map((excerpt) => {
    const language = asText(excerpt.languageId).trim() || 'text';
    const body = cleanSection(excerpt.content, '_Empty editor._');
    const truncated = excerpt.truncated ? '\n\n_Excerpt truncated._' : '';
    return `### ${asText(excerpt.path)}\n\n\`\`\`${language}\n${body}\n\`\`\`${truncated}`;
  }).join('\n\n');
}

function generateHandoff(input = {}) {
  const redact = input.redactSecrets !== false;
  const maybeRedact = (value) => redact ? redactSecrets(value) : asText(value);
  const title = cleanSection(maybeRedact(input.title), 'Untitled session handoff');
  const workspaceName = cleanSection(maybeRedact(input.workspaceName), '_No workspace folder open._');
  const generatedAt = input.generatedAt || new Date().toISOString();
  const workspaceListing = formatWorkspaceListing(input.workspaceEntries, {
    maxEntries: input.workspaceListingMaxEntries,
  });
  const gitStatus = cleanSection(maybeRedact(input.gitStatus), '_Git context was not collected._');
  const gitLog = cleanSection(maybeRedact(input.gitLog), '_Git context was not collected._');
  const projectNotes = cleanSection(maybeRedact(input.projectNotes), '_No project notes recorded._');
  const excerpts = (input.editorExcerpts || []).map((excerpt) => ({
    ...excerpt,
    path: maybeRedact(excerpt.path),
    content: maybeRedact(excerpt.content),
  }));

  const body = `# Session Handoff: ${title}

> Generated locally by Gravion Context Bridge on ${generatedAt}. Review this handoff before sharing it: secret redaction is best-effort, not a guarantee.

## Project

- **Workspace:** ${workspaceName}
- **Task or project title:** ${title}

## Goal

${cleanSection(maybeRedact(input.goal))}

## Current state

${cleanSection(maybeRedact(input.currentState))}

## Decisions already made

${cleanSection(maybeRedact(input.decisions))}

## Next steps

${cleanSection(maybeRedact(input.nextSteps))}

## Open questions or blockers

${cleanSection(maybeRedact(input.blockers))}

## Project notes

${projectNotes}

## Workspace listing

${workspaceListing}

## Git status (read-only)

\`\`\`text
${gitStatus}
\`\`\`

## Recent commits (read-only)

\`\`\`text
${gitLog}
\`\`\`

## Optional visible-editor excerpts

${formatEditorExcerpts(excerpts)}

## Continuation instructions for the next agent

1. Verify the actual workspace files and current Git state before relying on this handoff.
2. Respect the recorded decisions unless new evidence contradicts them.
3. Ask before destructive or externally visible actions.
4. State which tests you actually ran and what remains unverified.
`;

  return {
    markdown: body,
    estimatedTokens: estimateTokens(body),
  };
}

module.exports = {
  DEFAULTS,
  SKIP_DIRECTORIES,
  estimateTokens,
  formatEditorExcerpts,
  formatWorkspaceListing,
  generateHandoff,
  isSecretFileName,
  redactSecrets,
  shouldSkipDirectory,
  truncateText,
};
