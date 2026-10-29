// 027 D4 · A MAPPED CONTROLLER IS LIVE AT LAUNCH (lab/mapping.js resumeMidi over the kit's mir/shell/midi.js): a map saved by a LEARN, read by a
// fresh createMidi (the reload), is live at boot with no LEARN where the browser already grants MIDI — a note from the fake input runs its action;
// 'prompt' asks nothing (the privacy law: a prompt waits for a hand); a refusal is said once and never thrown; no map asks nothing.
import assert from 'node:assert/strict';
import { createMidi } from '../lab/mir/shell/midi.js';
import { resumeMidi } from '../lab/mapping.js';

const store = () => { let v = null; return { get: () => v, set: (r) => { v = JSON.parse(JSON.stringify(r)); }, remove: () => { v = null; } }; };
function fakeNavigator(permission, grant = true) {
  const input = { id: 'in1', name: 'FAKE PAD', state: 'connected', onmidimessage: null }, asked = [];
  const nav = { asked, input,
    permissions: permission === null ? undefined : { query: async (d) => { assert.equal(d.name, 'midi'); return { state: permission }; } },
    requestMIDIAccess: async (o) => { asked.push(o); if (!grant) throw new DOMException('refused', 'SecurityError'); return { inputs: new Map([['in1', input]]), onstatechange: null }; } };
  Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  return nav;
}
let failed = 0;
const row = async (name, fn) => { try { await fn(); console.log('PASS ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n  ' + (e && e.stack || e)); } };

/* the LEARN of an earlier session: NOTE 1·60 → transport.play, saved to the PREFERENCE store */
const saved = store(); createMidi({ storage: saved }).set('note:1:60', { id: 'transport.play', mode: 'trigger' });

await row('a saved mapping is live after a reload where MIDI is granted: no LEARN, one request, the fake pad\'s NOTE 1·60 runs its action', async () => {
  const nav = fakeNavigator('granted'), ran = [], said = [];
  const midi = createMidi({ storage: saved, run: (id) => ran.push(id) });   // the reload: a fresh instance over the stored map
  assert.equal(await resumeMidi(midi, (m) => said.push(m)), true);
  assert.equal(midi.state, 'live'); assert.deepEqual(nav.asked, [{ sysex: false }]); assert.deepEqual(said, []);
  assert.equal(typeof nav.input.onmidimessage, 'function', 'the input is not bound');
  nav.input.onmidimessage({ data: [0x90, 60, 100] }); nav.input.onmidimessage({ data: [0x80, 60, 0] });
  assert.deepEqual(ran, ['transport.play']);
});
await row('a browser with no \'midi\' permission name lets the request decide (Firefox): live the same way', async () => {
  const nav = fakeNavigator(null), midi = createMidi({ storage: saved });
  assert.equal(await resumeMidi(midi), true); assert.equal(nav.asked.length, 1);
});
await row('\'prompt\' asks nothing at boot (CONNECT MIDI or LEARN will)', async () => {
  const nav = fakeNavigator('prompt'), said = [], midi = createMidi({ storage: saved });
  assert.equal(await resumeMidi(midi, (m) => said.push(m)), false);
  assert.deepEqual(nav.asked, []); assert.equal(midi.state, 'idle'); assert.deepEqual(said, []);
});
await row('a refusal is said once and never thrown (denied: nothing asked; a refused request: asked once)', async () => {
  for (const [perm, grant, asks] of [['denied', true, 0], ['granted', false, 1]]) {
    const nav = fakeNavigator(perm, grant), said = [], midi = createMidi({ storage: saved });
    assert.equal(await resumeMidi(midi, (m) => said.push(m)), false);
    assert.equal(nav.asked.length, asks); assert.equal(said.length, 1); assert.match(said[0], /MIDI/);
  }
});
await row('no saved mapping asks nothing', async () => {
  const nav = fakeNavigator('granted'), midi = createMidi({ storage: store() });
  assert.equal(await resumeMidi(midi), false); assert.deepEqual(nav.asked, []);
});
console.log(failed ? `RED midi-resume.test — ${failed} failing` : 'GREEN midi-resume.test');
process.exit(failed ? 1 : 0);
