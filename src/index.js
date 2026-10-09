import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
export function analyze(urls) {
  if (!Array.isArray(urls) || !urls.length) throw new Error('at least one URL is required');
  const findings = []; let queryCount = 0;
  urls.forEach((input, index) => {
    let url;
    try { url = new URL(input); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
    catch { throw new Error(`line ${index + 1}: an absolute HTTP(S) URL is required`); }
    const params = new Map();
    for (const [key, value] of url.searchParams) {
      queryCount++;
      const values = params.get(key) || []; values.push(value); params.set(key, values);
    }
    for (const [key, values] of params) {
      if (values.length < 2) continue;
      const distinctValueCount = new Set(values).size;
      findings.push({ type: distinctValueCount > 1 ? 'conflicting-values' : 'repeated-value', line: index + 1, resource: hash(url.href.split('#')[0]), keyFingerprint: hash(key), occurrences: values.length, distinctValueCount });
    }
  });
  const counts = Object.fromEntries(['conflicting-values', 'repeated-value'].map(type => [type, findings.filter(f => f.type === type).length]));
  return { urlCount: urls.length, queryCount, findingCount: findings.length, counts, findings };
}
