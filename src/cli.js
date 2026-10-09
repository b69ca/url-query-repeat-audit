#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { analyze } from './index.js';
const args = process.argv.slice(2);
if (args.includes('--help')) { console.log('Usage: url-query-repeat-audit [FILE|-] [--json] [--fail]'); process.exit(0); }
try {
  let file = '-', hasFile = false;
  for (const arg of args) {
    if (['--json', '--fail'].includes(arg)) continue;
    if (arg.startsWith('-') && arg !== '-') throw new Error(`unknown option: ${arg}`);
    if (hasFile) throw new Error('only one input file is supported'); file = arg; hasFile = true;
  }
  const input = file === '-' ? process.stdin : createReadStream(file), rl = createInterface({ input, crlfDelay: Infinity }), urls = [];
  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber++; const value = line.trim();
    if (value) {
      try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
      catch { throw new Error(`line ${lineNumber}: an absolute HTTP(S) URL is required`); }
    }
    urls.push(value);
  }
  // Preserve physical line numbers in findings, including blank lines.
  const nonblank = urls.flatMap((url, i) => url ? [{ url, line: i + 1 }] : []);
  const report = analyze(nonblank.map(x => x.url));
  for (const finding of report.findings) finding.line = nonblank[finding.line - 1].line;
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else { console.log(`${report.urlCount} URLs, ${report.queryCount} query parameters, ${report.findingCount} findings`); for (const f of report.findings) console.log(`${f.type}\tline:${f.line}\tresource:${f.resource}\tkey:${f.keyFingerprint}\toccurrences:${f.occurrences}`); }
  if (args.includes('--fail') && report.findingCount) process.exitCode = 1;
} catch (error) { console.error(`url-query-repeat-audit: ${error.message}`); process.exitCode = 2; }
