// iteration 016 E1 · EMISSION SPECTRA: the strip of lines, a press populates the pair that makes one.
//   1 shipped closed, in + · 2 a press on Hα loads 3d₀ + 2p₀ as ONE history row `EMISSION · Hα`, and the lit line stands at 656.47 nm
//   3 Shift + press plays the A ↔ B TRANSITION (upper → lower) · 4 MOLECULES hides the card, HYDROGEN brings it back.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const URL = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?warn=0`;
const g = await open(URL, { width: 1600, height: 1000, script: 120000 });
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n));
  /* a pointer press on the strip at a wavelength: the canvas' own geometry (6 px gutters, RANGE ALL is 90 nm – 12.5 µm, logarithmic) */
  window.__press = async (nm, shift) => { const c = __LW.emission.canvas, r = c.getBoundingClientRect(), x = r.left + 6 + Math.log(nm / 90) / Math.log(12500 / 90) * (r.width - 12), y = r.top + r.height / 2;
    const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1, pointerId: 7, pointerType: 'mouse', isPrimary: true, shiftKey: !!shift };
    c.dispatchEvent(new PointerEvent('pointerdown', o)); await __w(30); c.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 })); await __w(700); await __LW.settle(); };
  __LW.pause(); await __LW.settle(); return 1;`;
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1); await g.ev(HELP);

  /* 1 · closed on a first run, in + */
  const first = await g.ev(`const d = document.querySelector('.dev[data-id="emission"]');
    __LW.layout.finder.open(); const plus = [...document.querySelectorAll('.mir-window-picker .wp-row:not(.off)')].map((i) => i.dataset.win); __LW.layout.finder.close();
    return { made: !!d, closed: d.classList.contains('closed'), plus: plus.includes('emission'), eyebrow: d.querySelector('.dev-eyebrow').textContent.trim() };`);
  assert.deepEqual(first, { made: true, closed: true, plus: true, eyebrow: 'EMISSION SPECTRA' });
  console.log('PASS EMISSION SPECTRA ships closed and is listed in the FINDER');

  /* 2 · a press on Hα: the pair, one history row, the lit line */
  const pressed = await g.ev(`__LW.layout.reopen('emission'); await __w(400); await __LW.settle();
    const lines = __LW.emission.lines(), ha = lines.find((l) => l.name === 'Hα'), rows0 = __LW.history.entries().length;
    await __press(ha.lambda);
    const E = __LW.history.entries();
    return { n: lines.length, ha: ha.lambda, rows: E.length - rows0, label: E[E.length - 1].label, pop: __LW.reg.populated(), pair: __LW.emission.pair(), lit: __LW.emission.lit(),
      status: document.querySelector('.dev[data-id="emission"] .dev-stat').textContent, errs: (window.__e || []).slice() };`);
  assert.equal(pressed.n, 21, JSON.stringify(pressed));
  assert.equal(pressed.rows, 1, JSON.stringify(pressed)); assert.equal(pressed.label, 'EMISSION · Hα');
  assert.deepEqual(pressed.pop, [3, 11]);   // 2p₀ and 3d₀, BASIS order
  assert.equal(pressed.pair.upper, '3d₀'); assert.equal(pressed.pair.lower, '2p₀'); assert.equal(pressed.pair.decay, false);
  assert.equal(pressed.lit.length, 1); assert.ok(Math.abs(pressed.lit[0].lambda - 656.47) < 0.005, JSON.stringify(pressed.lit));
  assert.match(pressed.status, /^EMISSION · computed/); assert.deepEqual(pressed.errs, []);
  console.log(`PASS a press on Hα (${pressed.ha.toFixed(2)} nm) loads 3d₀ + 2p₀ as ONE history row "EMISSION · Hα"; the lit line stands at ${pressed.lit[0].lambda.toFixed(2)} nm`);

  /* 3 · Shift + press: the TRANSITION, upper → lower */
  const decayed = await g.ev(`const rows0 = __LW.history.entries().length; await __press(121.57, true); __LW.pause();
    const E = __LW.history.entries(), ab = __LW.reg.transition;
    return { rows: E.length - rows0, label: E[E.length - 1].label, on: !!ab, pair: __LW.emission.pair(), A: ab ? [...ab.reA].findIndex((v) => v === 1) : -1, B: ab ? [...ab.reB].findIndex((v) => v === 1) : -1 };`);
  assert.equal(decayed.on, true, JSON.stringify(decayed)); assert.equal(decayed.rows, 1); assert.equal(decayed.label, 'EMISSION · Lyα');
  assert.equal(decayed.A, 3); assert.equal(decayed.B, 0); assert.equal(decayed.pair.decay, true);   // 2p₀ upper, 1s lower
  console.log('PASS Shift + press on Lyα plays the A ↔ B TRANSITION from 2p₀ (A) to 1s (B), one history row');

  /* 4 · MOLECULES hides the card; HYDROGEN brings it back */
  const modes = await g.ev(`const d = document.querySelector('.dev[data-id="emission"]'); __LW.chem.setOn(true); await __w(300); const hid = d.hidden;
    __LW.chem.setOn(false); await __w(300); return { hid, back: !d.hidden, closed: d.classList.contains('closed') };`);
  assert.deepEqual(modes, { hid: true, back: true, closed: false });
  console.log('PASS MOLECULES hides EMISSION SPECTRA (hidden, never closed); HYDROGEN shows it again');
} catch (e) { failed = true; console.error(e); } finally { await g.close(); }
console.log(failed ? 'RED emission.browser-test' : 'GREEN emission.browser-test');
process.exit(failed ? 1 : 0);
