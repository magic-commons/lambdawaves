// THE TAKE-IN's CHEAP BUGS (0.4.0 S0 · wave 137), in the real app, each with the road a user takes:
//   1 · LINKED: at project start, after a project open and after NEW, a real Space plays BOTH clocks (Josh's NEXT UPDATE note);
//       with nothing to run the modulation clock waits for its editor, and plays the instant it opens
//   2 · CALCULUS's ⧉ copies its rows, not one header line (DIGESTS.calculus read a `stats` field the view never had)
//   3 · the STATUS TAGS tick with METERS closed (they rode METERS' tick and went stale)
//   4 · WIGNER stands down under MOLECULES (hydroReader did not know `chem`)
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const SPACE = '';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 60000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  const helpers = `window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
    window.__clocks = () => ({ field: __LW.clock.playing, t: __LW.clock.t, mod: __LW.mod.playing, refused: __LW.mod.clock.stats().refusedPlays, link: __LW.mod.clockLink, editor: __LW.mod.expanded });
    return 1;`;
  await g.ev(helpers);

  /* ── 1 · LINKED: a real Space, from the page.  What was measured (probe, 2026-10-07): with the modulation editor OPEN, or
         anything routed, Space plays both clocks.  With the editor CLOSED and nothing routed (the fresh first run, NEW) the kit
         refuses the modulation play — 'nothing-to-run' (lab/mir/modulation/host.js setPlaying: unrouted sources run only to
         animate their editor) — and the link law retried that refusal once a second, so opening the editor under a playing
         field showed a STOPPED modulation transport for up to a second.  The law now re-arms the instant the editor opens. ── */
  const space = async (label, openAfter) => {
    await g.ev(`if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); return 1;`);
    const before = await g.ev(`await __w(200); return __clocks();`);
    await g.press(SPACE);
    const after = await g.ev(`await __w(600); return __clocks();`);
    let opened = null;
    if (openAfter) opened = await g.ev(`const t0 = performance.now(); __LW.layout.modulation.expand();
      while (performance.now() - t0 < 1500 && !__LW.mod.playing) await __w(10);
      return { ms: performance.now() - t0, ...__clocks() };`);
    await g.press(SPACE);
    const paused = await g.ev(`await __w(300); return __clocks();`);
    return { label, before, after, opened, paused };
  };
  const starts = [];
  starts.push(await space('project start, editor closed, nothing routed', true));
  await g.ev(`__LW.saveSettings(); await __w(200); setTimeout(() => location.reload(), 50); return 1;`);   // the editor was left open: the next start has it open
  await new Promise((r) => setTimeout(r, 1500));
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1);
  await g.ev(helpers);
  starts.push(await space('project start, editor left open'));
  await g.ev(`__LW.layout.notebook.open('projects'); await __w(200); document.querySelector('.pj-demo').click();
    for (let i = 0; i < 60 && !/WAVE DANCER/.test(document.querySelector('.pj-status').textContent); i++) await __w(100);
    await __w(400); __LW.layout.notebook.close(); __LW.layout.modulation.collapse(); if (__LW.clock.playing) __LW.pause(); await __w(400); return 1;`);
  starts.push(await space('WAVE DANCER opened (routed), editor closed'));
  await g.ev(`await __LW.layout.projects.requestFresh(); await __LW.settle(); await __w(400); __LW.layout.notebook.close(); __LW.layout.modulation.collapse(); if (__LW.clock.playing) __LW.pause(); await __w(400); return 1;`);
  starts.push(await space('after NEW, editor closed, nothing routed', true));
  for (const s of starts) {
    const why = JSON.stringify(s);
    assert.equal(s.before.link, true, 'LINKED is the default: ' + why);
    assert.equal(s.before.field, false, 'paused before the press: ' + why); assert.equal(s.before.mod, false, 'mod paused before the press: ' + why);
    assert.equal(s.after.field, true, 'Space plays the field clock: ' + why); assert.ok(s.after.t > s.before.t, 'the field clock advanced: ' + why);
    if (s.opened) {
      /* nothing to run until the editor opens: the kit's refusal stands, and the editor opening plays it within a frame or two */
      assert.ok(s.after.mod || s.after.refused > s.before.refused, 'refused for nothing-to-run, not ignored: ' + why);
      assert.equal(s.opened.mod, true, 'the modulation clock plays once its editor opens: ' + why);
      assert.ok(s.opened.ms <= 150, `opening the editor under a playing field plays the modulation clock at once (${s.opened.ms.toFixed(0)} ms; the old once-a-second retry took up to 1000): ` + why);
    } else {
      assert.equal(s.after.mod, true, 'Space plays the modulation clock too (LINKED): ' + why);
      assert.equal(s.after.refused, s.before.refused, 'no nothing-to-run refusal: ' + why);
    }
    assert.equal(s.paused.field, false, 'a second Space pauses the field: ' + why); assert.equal(s.paused.mod, false, 'and the modulation clock: ' + why);
  }
  console.log('PASS LINKED: a real Space plays both clocks and a second pauses both — ' + starts.map((s) => `${s.label}: t ${s.before.t.toFixed(2)} → ${s.after.t.toFixed(2)}, mod ${s.after.mod ? 'playing' : 'refused (nothing to run)'}` + (s.opened ? `, playing ${s.opened.ms.toFixed(0)} ms after the editor opened` : '')).join('; '));

  /* ── 2 · CALCULUS's ⧉: the digest carries the rows ── */
  const calc = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.layout.raise('calculus'); await __LW.settle(); await __w(300); await __LW.settle();
    const d = __LW.layout.digest('calculus'), lines = d.split('\\n');
    return { lines: lines.length, rows: /"rows"/.test(d), named: /"name"/.test(d), head: lines[0] };`);
  assert.ok(calc.rows && calc.named && calc.lines > 3, JSON.stringify(calc));
  console.log(`PASS CALCULUS's ⧉ copies ${calc.lines} lines with its rows (was the header line alone)`);

  /* ── 3 · the STATUS TAGS tick with METERS closed ── */
  const tags = await g.ev(`const met = document.querySelector('.dev[data-id="meters"]'); if (met && !met.classList.contains('closed')) met.querySelector('.dev-close').click();
    const sw = [...document.querySelectorAll('.dev[data-id="settings"] .sw')].find((s) => /^STATUS TAGS/.test(s.textContent.trim()));
    if (document.body.classList.contains('no-badges')) sw.click();
    __LW.reg.setField({ Fz: 0 }); await __LW.settle(); await __w(250);
    const stark = () => [...document.querySelectorAll('#badges .badge')].find((b) => /STARK/.test(b.textContent));
    const before = !!stark() && !stark().hidden; const t0 = performance.now();
    __LW.reg.setField({ Fz: 1e-3 }); __LW.settle();
    let ms = null; while (performance.now() - t0 < 300) { await __w(20); const b = stark(); if (b && !b.hidden) { ms = performance.now() - t0; break; } }
    const out = { metersClosed: !!met && met.classList.contains('closed'), tagsOn: !document.body.classList.contains('no-badges'), before, ms, text: stark() ? stark().textContent : '' };
    __LW.reg.setField({ Fz: 0 }); await __LW.settle(); return out;`);
  assert.equal(tags.metersClosed, true); assert.equal(tags.tagsOn, true); assert.equal(tags.before, false);
  assert.ok(tags.ms !== null && tags.ms <= 300, JSON.stringify(tags));
  console.log(`PASS with METERS closed and STATUS TAGS on, switching Stark on shows "${tags.text}" in ${tags.ms.toFixed(0)} ms`);

  /* ── 4 · WIGNER stands down under MOLECULES ── */
  const wig = await g.ev(`__LW.layout.raise('wigner'); await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle();
    const st = () => document.querySelector('.dev[data-id="wigner"] .dev-stat').textContent;
    let s = ''; for (let i = 0; i < 40; i++) { await __LW.settle(); s = st(); if (/hydrogenic register only/.test(s)) break; await __w(50); }
    __LW.chem.setOn(false); await __LW.settle(); return { status: s, errs: __e.slice() };`);
  assert.match(wig.status, /hydrogenic register only/); assert.deepEqual(wig.errs, []);
  console.log(`PASS under MOLECULES WIGNER says "${wig.status}" instead of computing hydrogenic physics`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED take-in-bugs.browser-test' : 'GREEN take-in-bugs.browser-test');
process.exit(failed ? 1 : 0);
