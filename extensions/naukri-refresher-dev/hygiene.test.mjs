// Source hygiene: no stray control characters in the extension, the radar scripts or the API. A
// "\b" written through a shell heredoc once became a literal backspace inside a regex and silently
// broke it (twice); this fails the moment one gets in again.
// Run: node --test extensions/naukri-refresher-dev/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dirs = [['../naukri-refresher', /\.(js|html|json|md)$/], ['../naukri-refresher-dev', /\.mjs$/], ['../../scripts/radar', /\.(mjs|js)$/], ['../../api', /\.mjs$/]];
test('no control characters (backspace, NUL, bell…) in source files', () => {
  const bad = [];
  for (const [dir, rx] of dirs) {
    for (const f of readdirSync(new URL(`${dir}/`, import.meta.url)).filter((x) => rx.test(x))) {
      const s = readFileSync(new URL(`${dir}/${f}`, import.meta.url), 'utf8');
      const m = s.match(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g);
      if (m) bad.push(`${dir}/${f}: ${m.length}`);
    }
  }
  assert.deepEqual(bad, []);
});
