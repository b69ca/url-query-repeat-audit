# url-query-repeat-audit

Find repeated query keys that can produce ambiguous first-value, last-value, or array parsing across services.

The audit reports:

- one decoded query key with multiple distinct decoded values (`conflicting-values`)
- one decoded query key repeated with the same value (`repeated-value`)

## Run

```bash
npx --yes github:b69ca/url-query-repeat-audit urls.txt
npx --yes github:b69ca/url-query-repeat-audit urls.txt --json --fail
cat urls.txt | npx --yes github:b69ca/url-query-repeat-audit - --json
```

## Options

```text
--json  emit machine-readable JSON
--fail  exit 1 when findings exist
--help  print usage
```

Input is one absolute HTTP(S) URL per nonblank line. With no file, read stdin. Exit codes: 0 for a completed audit, 1 for findings with `--fail`, 2 for input or argument errors.

Keys and values use Node's WHATWG `URLSearchParams` decoding: `+` and `%20` both represent a space. Key comparison is case sensitive. Fragments do not contribute query parameters. Repetition is audited within each URL, never across different URLs. Each repeated key produces one finding, with occurrence and distinct-value counts.

Repeated parameters may be intentional for array filters. This tool identifies evidence to review; it cannot infer how a server interprets the query or establish a vulnerability. It does not detect disagreements between different decoding algorithms.

URLs are processed locally and never fetched. Reports print only physical line numbers, counts, and short SHA-256 fingerprints for URLs and keys. Raw URLs, credentials, paths, keys, and values are never printed. Fingerprints are identifiers, not anonymization guarantees. Inputs are held in memory.

## Example

```text
https://example.com/search?sort=asc&sort=desc&tag=node&tag=node
```

Reports `conflicting-values` for the first repeated key and `repeated-value` for the second.

## Library

```js
import { analyze } from 'url-query-repeat-audit';
const report = analyze(['https://example.com/?id=1&id=2']);
console.log(report.findingCount); // 1
```

Library finding `line` values are one-based positions in the input array.

Node.js 20 or newer. No runtime dependencies.

## Development

```bash
npm ci
npm run check
```

## License

MIT
