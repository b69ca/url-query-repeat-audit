import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { analyze } from '../src/index.js';
const cli = (input, args = []) => spawnSync(process.execPath, ['src/cli.js', ...args], { input, encoding: 'utf8' });
test('distinguishes conflicting values from identical repetition', () => {
  const r = analyze(['https://example.com/?id=1&id=2&tag=x&tag=x']);
  assert.equal(r.queryCount, 4); assert.equal(r.findingCount, 2);
  assert.deepEqual(r.findings.map(f => f.type), ['conflicting-values', 'repeated-value']);
  assert.deepEqual(r.findings.map(f => f.distinctValueCount), [2, 1]);
});
test('compares decoded names and values including plus, blanks, and encoded separators', () => {
  assert.equal(analyze(['https://example.com/?%69d=a+b&id=a%20b']).findings[0].type, 'repeated-value');
  assert.equal(analyze(['https://example.com/?x&x=']).findings[0].type, 'repeated-value');
  assert.equal(analyze(['https://example.com/?x=a%26b&x=a%26b']).findings[0].occurrences, 2);
});
test('query names are case sensitive and fragments are ignored', () => {
  assert.equal(analyze(['https://example.com/?id=1&ID=2#id=3']).findingCount, 0);
});
test('does not leak keys, credentials, URLs, or values', () => {
  const r = JSON.stringify(analyze(['https://user:password@example.com/private?secret=token-one&secret=token-two']));
  for (const value of ['user', 'password', 'example.com', 'private', 'secret', 'token-one', 'token-two']) assert.equal(r.includes(value), false);
});
test('rejects empty inputs and non-HTTP absolute URLs', () => {
  assert.throws(() => analyze([]));
  for (const url of ['/relative', 'not a URL', 'file:///tmp/example']) assert.throws(() => analyze([url]));
});
test('CLI supports stdin, blank lines, JSON, and exit codes', () => {
  assert.equal(cli('https://example.com/?x=1\n', ['--fail']).status, 0);
  const result = cli('\nhttps://example.com/?x=1&x=2\n', ['--json', '--fail']);
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).findings[0].line, 2);
  const invalid = cli('\ninvalid\n'); assert.equal(invalid.status, 2); assert.match(invalid.stderr, /line 2/);
  assert.equal(cli('', ['--wat']).status, 2);
  assert.equal(cli('', ['missing.txt']).status, 2); assert.equal(cli('', ['--help']).status, 0);
});
