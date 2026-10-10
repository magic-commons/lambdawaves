// 0.5.2 G-W · THE RUNTIME FACADE FIXTURE — `window.__LW`, as the page hands it to the suites, is pinned by name, kind and order:
// `Object.entries(Object.getOwnPropertyDescriptors(__LW))` → [name, kind] with kind = get (an accessor) | method (a function value) |
// value, in property order.  The fixture (research/release-0.5.2/lw-facade.json) was captured on v0.5.1-alpha (U7) and is re-captured
// only by a row that changes the facade on purpose and says the diff (R0: the dead `windowActivity` wrapper and the first `frost` left).
// A static walker cannot see this once the literal lives in a module (R5 moves it whole); the page can.  One scene:
//   1 boot (a driver: no notice, no title screen), LW.ready, a settle; the descriptors match the fixture — names, kinds, order
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.  `--write` re-captures the fixture instead.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { open } from '../tools/gate/gatekit.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const FIXTURE = new URL('../research/release-0.5.2/lw-facade.json', import.meta.url);
const write = process.argv.includes('--write');
let n = 0, failed = false;
const pass = (m) => console.log('PASS ' + ++n + ' ' + m);
const g = await open(LAB, { width: 1300, height: 900 });
try {
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 300, 100)).ok, 1, 'the lab never reached LW.ready');
  const got = await g.ev(`await __LW.settle();
    return Object.entries(Object.getOwnPropertyDescriptors(__LW)).map(([k, d]) => [k, d.get || d.set ? 'get' : typeof d.value === 'function' ? 'method' : 'value']);`);
  assert.ok(Array.isArray(got) && got.length > 100, 'no facade read: ' + JSON.stringify(got).slice(0, 200));
  const kinds = got.reduce((o, [, k]) => ((o[k] = (o[k] || 0) + 1), o), {});
  if (write) {
    writeFileSync(FIXTURE, '[\n' + got.map((e) => ' ' + JSON.stringify(e)).join(',\n') + '\n]\n');
    pass(`wrote the fixture: ${got.length} members (${Object.entries(kinds).map(([k, v]) => v + ' ' + k).join(' · ')})`);
  } else {
    const want = JSON.parse(readFileSync(FIXTURE, 'utf8'));
    const names = (xs) => xs.map(([k]) => k);
    const gone = names(want).filter((k) => !names(got).includes(k)), added = names(got).filter((k) => !names(want).includes(k));
    const turned = got.filter(([k, kind]) => { const w = want.find(([x]) => x === k); return w && w[1] !== kind; });
    assert.deepEqual({ gone, added, turned }, { gone: [], added: [], turned: [] }, 'the facade\'s members moved');
    assert.deepEqual(names(got), names(want), 'the facade\'s order moved');
    pass(`the facade is the fixture: ${got.length} members, names, kinds and order (${Object.entries(kinds).map(([k, v]) => v + ' ' + k).join(' · ')})`);
  }
} catch (error) { failed = true; console.error(error); }
finally {
  try { await Promise.race([g.close(), new Promise((_, reject) => setTimeout(() => reject(new Error('driver cleanup timed out')), 10000))]); }
  catch (error) { failed = true; console.error('INFRASTRUCTURE:', error.message); }
  console.log((failed ? 'RED' : 'GREEN') + ' lw-facade.browser-test — ' + n + ' of 1 scenes');
  process.exit(failed ? 1 : 0);
}
