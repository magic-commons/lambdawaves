// THE TAKE-IN's CHEAP BUGS (0.4.0 S0 · wave 137), in the real app, each with the road a user takes:
//   1 · THE ONE CLOCK (0.5.0 A6; C4 R-B1: LINKED/SEPARATE retired): a real Space plays THE play and the modulation with it — editor
//       closed, nothing routed, no sources, MOD power off — holding the kit's app-play demand; a pause releases it; a bare host with no
//       demand still refuses
//   2 · CALCULUS's ⧉ copies its rows, not one header line (DIGESTS.calculus read a `stats` field the view never had); since 0.4.0 S3 the prose figure
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
    window.__clocks = () => ({ field: __LW.clock.playing, t: __LW.clock.t, mod: __LW.mod.playing, refused: __LW.mod.clock.stats().refusedPlays, editor: __LW.mod.expanded,
      running: __LW.mod.running, power: __LW.mod.armed, demand: __LW.mod.clock.anyRouted() && !__LW.mod.model.needsClock(), sources: __LW.mod.model.sourceList().length,
      routes: __LW.mod.model.routeList().length, held: __LW.mod.registry.isModulated('material.stage') });
    return 1;`;
  await g.ev(helpers);

  /* ── 1 · THE ONE CLOCK (0.5.0 A6 · C4 R-B1: LINKED/SEPARATE retired).  A real Space is THE play, and the modulation follows it
         by holding the kit's app-play demand (host.clock.demand('app.play'), MIR 1.5's installModulation().play) on EVERY edge.
         Four scenes: (a) with the editor CLOSED and nothing routed — at a fresh boot, with no sources at all, after NEW, with the MOD
         POWER OFF (a route bypass: play never powers, power never plays) — the play SUCCEEDS: no 'nothing-to-run', app time advances,
         the demand is held; (b) a pause releases the demand; (c) a routed source (WAVE DANCER) follows the one clock;
         (d) a bare host play with no demand still refuses with its own reason — that law stays the kit's. ── */
  const space = async (label, setup) => {
    await g.ev(`${setup || ''}; if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); return 1;`);
    const before = await g.ev(`await __w(200); return __clocks();`);
    await g.press(SPACE);
    const after = await g.ev(`await __w(600); return __clocks();`);
    await g.press(SPACE);
    const paused = await g.ev(`await __w(300); return __clocks();`);
    return { label, before, after, paused };
  };
  const starts = [];
  starts.push(await space('fresh boot, editor closed, nothing routed'));
  /* (d) the bare host: THE play paused, no demand, the editor closed, no route — the kit's own refusal stands */
  const bare = await g.ev(`const C = __LW.mod.clock, n0 = C.stats().refusedPlays; const r = C.play(performance.now() / 1000);
    return { ok: r.ok, reason: r.reason, refused: C.stats().refusedPlays - n0, mod: __LW.mod.playing, field: __LW.clock.playing, editor: __LW.mod.expanded };`);
  starts.push(await space('no sources at all, editor closed', `const M = __LW.mod.model; for (const s of M.sourceList()) M.removeSource(s.id);
    __LW.mod.clock.recomputeRunning()`));
  starts.push(await space('after NEW, editor closed, nothing routed', `await __LW.layout.projects.requestFresh(); await __LW.settle(); await __w(400);
    __LW.layout.notebook.close(); __LW.layout.modulation.collapse(); if (__LW.clock.playing) __LW.pause(); await __w(400)`));
  starts.push(await space('MOD power off, editor closed, nothing routed', `__LW.mod.arm(false); await __w(200)`));
  starts.push(await space('WAVE DANCER opened (routed), editor closed', `__LW.mod.arm(true); __LW.projects.demo('wave-dancer');
    for (let i = 0; i < 60 && !/WAVE DANCER/.test(__LW.projects.status); i++) await __w(100);
    await __w(400); __LW.layout.notebook.close(); __LW.layout.modulation.collapse(); if (__LW.clock.playing) __LW.pause(); await __w(400)`));
  for (const s of starts) {
    const why = JSON.stringify(s), routed = s.after.routes > 0;
    assert.equal(s.after.power, !/power off/.test(s.label), 'play never powers, power never plays: ' + why); assert.equal(s.before.editor, false, 'the editor is closed: ' + why); assert.equal(routed, /routed\)/.test(s.label), 'routes as the scene says: ' + why);
    assert.equal(s.before.field, false, 'paused before the press: ' + why); assert.equal(s.before.mod, false, 'mod paused before the press: ' + why);
    assert.equal(s.after.field, true, 'Space plays THE play: ' + why); assert.ok(s.after.t > s.before.t, 'app time advances: ' + why);
    assert.equal(s.after.mod, true, 'the modulation follows the one clock: ' + why);
    assert.equal(s.after.refused, s.before.refused, 'no nothing-to-run refusal: ' + why);
    assert.equal(s.after.running, true, 'the modulation runs under the one clock: ' + why);
    if (!routed) { assert.equal(s.before.demand, false, 'no demand before the press: ' + why); assert.equal(s.after.demand, true, 'the app-play demand is held: ' + why); }
    else assert.equal(s.after.held, true, 'the routed source holds its target under the one clock: ' + why);
    assert.equal(s.paused.field, false, 'a second Space pauses THE play: ' + why); assert.equal(s.paused.mod, false, 'and the modulation with it: ' + why);
    assert.equal(s.paused.demand, false, 'the pause releases the demand: ' + why);
  }
  assert.equal(starts[1].after.sources, 0, 'the no-sources scene has sources');
  assert.deepEqual(bare, { ok: false, reason: 'nothing-to-run', refused: 1, mod: false, field: false, editor: false }, 'the bare host: ' + JSON.stringify(bare));
  console.log('PASS THE ONE CLOCK: a real Space plays THE play and the modulation with it, holding the app-play demand — ' + starts.map((s) => `${s.label}: t ${s.before.t.toFixed(2)} → ${s.after.t.toFixed(2)}, mod playing, running, ${s.after.refused - s.before.refused} refusals`).join('; ') + '; a second Space pauses both and releases the demand; a bare host play with no demand still refuses (' + bare.reason + ')');

  /* ── 2 · CALCULUS's ⧉: the digest carries the rows — since 0.4.0 S3 as THE PROSE FIGURE (calculus.js calculusMarkdown) ── */
  const calc = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.layout.raise('calculus'); await __LW.settle(); await __w(300); await __LW.settle();
    const d = __LW.layout.digest('calculus'), lines = d.split('\\n');
    return { lines: lines.length, head: lines[0], figure: /\\nFigure\\. /.test(d), ehrenfest: (d.match(/Ehrenfest: /g) || []).length, laws: (d.match(/\\$\\$/g) || []).length / 2 };`);
  assert.ok(/^### CALCULUS · \$t = /.test(calc.head) && calc.figure && calc.ehrenfest === 1 && calc.laws >= 3 && calc.lines > 3, JSON.stringify(calc));
  console.log(`PASS CALCULUS's ⧉ copies the prose figure — ${calc.lines} lines, one Ehrenfest sentence, ${calc.laws} displayed laws (was the header line alone)`);

  /* ── 3 · the STATUS TAGS tick with METERS closed ── */
  const tags = await g.ev(`const met = document.querySelector('.dev[data-id="meters"]'); if (met && !met.classList.contains('closed')) met.querySelector('.dev-close').click();
    if (document.body.classList.contains('no-badges')) __LW.look.set({ badges: true });   // 017 S1: STATUS TAGS is the kit's TEXT › SHOW (mir/shell/gui.js 'badges'), not a SETTINGS switch since iteration 003
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

  /* ── 4 · WIGNER stands down under MOLECULES — 022 E0: since 021 R5 (ONE MODE, shell/settings.js MODE.wigner = 'hydrogen') it is HIDDEN under
     MOLECULES (never closed or moved) and draws nothing; its stand-down sentence is still the one written while a molecule holds the field ── */
  const wig = await g.ev(`__LW.layout.raise('wigner'); await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle();
    const dev = () => document.querySelector('.dev[data-id="wigner"]'), st = () => dev().querySelector('.dev-stat').textContent;
    let s = ''; for (let i = 0; i < 40; i++) { await __LW.settle(); s = st(); if (dev().hidden && /hydrogenic register only/.test(s)) break; await __w(50); }
    const hidden = dev().hidden, closed = dev().classList.contains('closed');
    __LW.chem.setOn(false); await __LW.settle(); return { hidden, closed, back: !dev().hidden, status: s, errs: __e.slice() };`);
  assert.equal(wig.hidden, true); assert.equal(wig.closed, false); assert.equal(wig.back, true); assert.deepEqual(wig.errs, []);
  console.log(`PASS under MOLECULES WIGNER is hidden (not closed) and computes nothing ("${wig.status}"); HYDROGEN brings it back`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED take-in-bugs.browser-test' : 'GREEN take-in-bugs.browser-test');
process.exit(failed ? 1 : 0);
