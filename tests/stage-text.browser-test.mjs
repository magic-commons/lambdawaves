// 0.4.0 S3 · THE STAGE TEXT (PLAN F2, BRIEF-S3 T1–T3), in the real page: the formula renders real maths through the
// notebook's renderer, keyed on its string (KaTeX only on a change, at most four a second, never while playing a state that
// does not change); nothing reads layout per tick (the placement's witness does not move while the transport plays, the
// atom labels write only when the camera moves); a HAND's preset is announced and fades back to the formula — and an undo,
// a project open and a link open announce nothing (one banner, not three); the WINDING / HOMO + LUMO banners speak the names.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 120000 });
let failed = false;
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1);
  await g.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n));
    window.__node = () => document.getElementById('molFormula');
    window.__field = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    return 1;`);

  /* ── 1 · the formula is KaTeX, keyed on its string ── */
  const t1 = await ev(`const S = __LW.stageText, n = __node(); await __LW.settle(); await __w(400);
    const boot = { md: S.md, katex: n.querySelectorAll('.katex').length, err: n.querySelectorAll('.katex-error').length, hidden: n.hidden };
    const r0 = S.stats.renders, p0 = S.stats.places;
    /* the transport, frame by frame (a loaded GPU starves a free-running rAF): twelve CPU ticks at twelve clock times */
    for (let i = 1; i <= 12; i++) { __LW.scrub(0.37 * i); await __LW.settle(); }
    const play = { renders: S.stats.renders - r0, places: S.stats.places - p0 };
    /* ten strings in about 300 ms: KaTeX runs at most four times a second, and the last string is the one that lands */
    await __w(300); const r1 = S.stats.renders, t0 = performance.now();
    for (let k = 1; k <= 10; k++) { S.setFormula('$x_{' + k + '}$'); await __w(30); }
    const span = performance.now() - t0; await __w(400); const burst = { renders: S.stats.renders - r1, span, md: S.md };
    __LW.loadPreset('3dz2'); await __LW.settle(); await __w(300); burst.preset = S.md;
    return { boot, play, burst, errs: __e.slice() };`);
  assert.equal(t1.boot.md, '$1s_{0}$ and $2p_{0}$', 'boot md: ' + JSON.stringify(t1));
  assert.ok(t1.boot.katex === 2 && t1.boot.err === 0 && !t1.boot.hidden, 'the formula is not KaTeX: ' + JSON.stringify(t1.boot));
  assert.deepEqual(t1.play, { renders: 0, places: 0 }, 'playing an unchanged state rendered or read layout: ' + JSON.stringify(t1.play));
  assert.ok(t1.burst.renders <= Math.ceil(t1.burst.span / 250) + 1 && t1.burst.md === '$x_{10}$' && t1.burst.preset === '$3d_{0}$', 'the burst: ' + JSON.stringify(t1.burst));
  assert.deepEqual(t1.errs, []);
  pass(`the formula is KaTeX (${t1.boot.md}); twelve ticks at twelve clock times rendered 0 times and read layout 0 times; ten strings in ${t1.burst.span.toFixed(0)} ms rendered ${t1.burst.renders}× and the last one landed`);

  /* ── 2 · ONE BANNER, NOT THREE: a hand's preset announces; the undo, a project open and a link open do not ── */
  const t2 = await ev(`const S = __LW.stageText, H = __LW.history, P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true;
    const sel = document.querySelector('.dev[data-id="state"] select.sel'); H.flush(); await __w(450); H.flush();
    const a0 = S.stats.announced;
    __field(sel, '1s+2s'); await __w(80);
    const pressed = { banner: S.banner, md: S.md, n: S.stats.announced - a0, heading: __node().style.fontSize };
    await __w(520); H.flush();
    const undid = H.undo(); await __w(400);
    const href = __LW.link.mint().href; const link = __LW.link.open(href); await __w(300);
    const r = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await r.text()); P.open(path); await __w(800);
    window.confirm = c0;
    await __w(3200);   /* the ttl and the fade */
    return { pressed, undid, link: link.opened && link.ok, n: S.stats.announced - a0, after: { banner: S.banner, md: S.md, title: __node().style.fontSize }, errs: __e.slice() };`);
  assert.equal(t2.pressed.banner, '1s \\+ 2s  beat', 'the press did not announce its preset: ' + JSON.stringify(t2));
  assert.equal(t2.pressed.n, 1); assert.equal(t2.undid, true); assert.equal(t2.link, true);
  assert.equal(t2.n, 1, 'an undo, a link or a project open announced: ' + JSON.stringify(t2));
  assert.equal(t2.after.banner, null, 'the banner did not fade: ' + JSON.stringify(t2.after));
  assert.ok(/^\$/.test(t2.after.md), 'the formula did not come back: ' + JSON.stringify(t2.after));
  assert.equal(t2.pressed.heading, '22px', 'the announcement is not the notebook heading (22 px): ' + JSON.stringify(t2));
  assert.deepEqual(t2.errs, []);
  pass(`a hand's preset announced once ("${t2.pressed.banner}" at ${t2.pressed.heading}) and faded back to the formula (${t2.after.title}); the undo, the link and the project open announced nothing — one banner, not three`);

  /* ── 3 · the names speak: HOMO + LUMO on water, WINDING on ammonia; the atom labels move only with the camera ── */
  const t3 = await ev(`const S = __LW.stageText, sel = () => document.querySelector('.dev[data-id="orbitals"] .reg-bar select.sel');
    await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __LW.settle(); await __w(600);
    const a0 = S.stats.announced; __field(sel(), 'HOMO + LUMO'); await __w(80); const homo = S.banner;
    const l0 = S.stats.labelWrites; for (let i = 1; i <= 8; i++) { __LW.scrub(0.5 * i); await __LW.settle(); } const still = S.stats.labelWrites - l0;
    __LW.orbitBy(0.3, 0.1); await __LW.settle(); await __LW.settle(); const moved = S.stats.labelWrites - l0;
    await __LW.chem.solve('NH3'); await __LW.settle(); await __w(600);
    __field(sel(), 'WINDING'); await __w(80); const winding = S.banner;
    const n = S.stats.announced - a0; await __w(3200); const md = S.md; __LW.chem.setOn(false); await __LW.settle();
    return { homo, winding, n, md, still, moved, labels: document.querySelectorAll('#atomLabels .atom-label').length, errs: __e.slice() };`);
  assert.equal(t3.homo, 'HOMO + LUMO · $1b_{1}$ + $4a_{1}$', 'HOMO + LUMO: ' + JSON.stringify(t3));
  assert.ok(/^WINDING · \$\d+e\$ \(a\) \+ \(b\)$/.test(t3.winding), 'WINDING: ' + JSON.stringify(t3));
  assert.equal(t3.n, 2); assert.equal(t3.md, '$\\mathrm{NH_{3}}$');
  assert.equal(t3.still, 0, 'the atom labels were rewritten under a still camera: ' + JSON.stringify(t3));
  assert.ok(t3.moved > 0, 'the atom labels did not follow the camera: ' + JSON.stringify(t3));
  assert.deepEqual(t3.errs, []);
  pass(`the banners speak the names: "${t3.homo}", "${t3.winding}"; the labels wrote 0 times under a still camera across eight clock times and ${t3.moved} after a turn`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED stage-text' : 'GREEN stage-text');
process.exit(failed ? 1 : 0);
