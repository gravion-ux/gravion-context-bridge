'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  estimateTokens,
  formatEditorExcerpts,
  formatWorkspaceListing,
  generateHandoff,
  isSecretFileName,
  redactSecrets,
  shouldSkipDirectory,
  truncateText,
} = require('../src/core');

test('redacts common secret patterns', () => {
  const source = [
    'API_KEY="super-secret-value"',
    'token: ghp_abcdefghijklmnopqrstuvwxyz1234567890',
    'aws = AKIAABCDEFGHIJKLMNOP',
    '-----BEGIN PRIVATE KEY-----\nprivate material\n-----END PRIVATE KEY-----',
  ].join('\n');
  const result = redactSecrets(source);

  assert.doesNotMatch(result, /super-secret-value|ghp_abcdefghijklmnopqrstuvwxyz1234567890|AKIAABCDEFGHIJKLMNOP|private material/);
  assert.match(result, /API_KEY="\[REDACTED\]"/);
  assert.match(result, /\[REDACTED PRIVATE KEY\]/);
});

test('redacts assignments whose name starts with the keyword', () => {
  const source = [
    'API_KEY=plain-value',
    'TOKEN: plain-token',
    'password = plain-password',
    'client_secret=plain-secret',
  ].join('\n');
  const result = redactSecrets(source);

  assert.doesNotMatch(result, /plain-value|plain-token|plain-password|plain-secret/);
  assert.match(result, /API_KEY=\[REDACTED\]/);
  assert.match(result, /TOKEN: \[REDACTED\]/);
});

test('redacts quoted values that contain spaces and json style keys', () => {
  const source = '{"api_key": "value with spaces"}';
  const result = redactSecrets(source);

  assert.doesNotMatch(result, /value with spaces/);
  assert.match(result, /\[REDACTED\]/);
});

test('redacts bearer tokens', () => {
  const result = redactSecrets('Authorization: Bearer abcdef1234567890');

  assert.doesNotMatch(result, /abcdef1234567890/);
  assert.match(result, /\[REDACTED\]/);
});

test('generates a structured handoff with continuation instructions', () => {
  const result = generateHandoff({
    title: 'Repair handoff export',
    workspaceName: 'example-app',
    goal: 'Repair the export command.',
    currentState: 'The command opens but saves malformed Markdown.',
    decisions: 'Keep handoffs local-first.',
    nextSteps: 'Add a regression test.',
    blockers: 'None.',
    workspaceEntries: [{ path: 'src', kind: 'directory' }, { path: 'src/index.js', kind: 'file' }],
    gitStatus: ' M src/index.js',
    gitLog: 'abc123 Initial commit',
    generatedAt: '2026-01-01T00:00:00.000Z',
  });

  assert.match(result.markdown, /# Session Handoff: Repair handoff export/);
  assert.match(result.markdown, /## Workspace listing/);
  assert.match(result.markdown, /Verify the actual workspace files and current Git state/);
  assert.ok(result.estimatedTokens > 0);
});

test('redacts handoff input by default and permits explicit opt-out', () => {
  const hidden = generateHandoff({ title: 'x', goal: 'Use API_KEY=hidden-value' });
  const visible = generateHandoff({ title: 'x', goal: 'Use API_KEY=hidden-value', redactSecrets: false });

  assert.doesNotMatch(hidden.markdown, /hidden-value/);
  assert.match(visible.markdown, /hidden-value/);
});

test('includes project notes when they exist', () => {
  const withNotes = generateHandoff({ title: 'x', projectNotes: 'Keep the API local-first.' });
  const withoutNotes = generateHandoff({ title: 'x' });

  assert.match(withNotes.markdown, /## Project notes[\s\S]*Keep the API local-first\./);
  assert.match(withoutNotes.markdown, /_No project notes recorded\._/);
});

test('estimates tokens from a rough four-character budget', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens('1234'), 1);
  assert.equal(estimateTokens('12345'), 2);
});

test('caps workspace listings and labels directories', () => {
  const listing = formatWorkspaceListing([
    { path: 'src', kind: 'directory' },
    { path: 'src/core.js', kind: 'file' },
    { path: 'test', kind: 'directory' },
  ], { maxEntries: 2 });

  assert.match(listing, /- src\//);
  assert.match(listing, /- src\/core\.js/);
  assert.match(listing, /Listing capped at 2 entries/);
  assert.doesNotMatch(listing, /- test\//);
});

test('skips dependency directories and credential files', () => {
  assert.equal(shouldSkipDirectory('node_modules'), true);
  assert.equal(shouldSkipDirectory('dist'), true);
  assert.equal(shouldSkipDirectory('src'), false);

  assert.equal(isSecretFileName('.env'), true);
  assert.equal(isSecretFileName('.env.local'), true);
  assert.equal(isSecretFileName('server.pem'), true);
  assert.equal(isSecretFileName('index.js'), false);
});

test('truncates excerpts and reports the truncation', () => {
  const result = truncateText('abcdefghij', 4);

  assert.equal(result.text, 'abcd');
  assert.equal(result.truncated, true);
  assert.equal(truncateText('abc', 10).truncated, false);
});

test('marks truncated editor excerpts in the rendered section', () => {
  const rendered = formatEditorExcerpts([
    { path: 'src/core.js', languageId: 'javascript', content: 'console.log(1);', truncated: true },
  ]);

  assert.match(rendered, /### src\/core\.js/);
  assert.match(rendered, /_Excerpt truncated\._/);
});
