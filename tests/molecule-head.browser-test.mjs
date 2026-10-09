// 0.5.1 D2 · THE MOLECULE'S HEAD, in the real page: a HAND pick of a molecule (the MOLECULE dropdown's own change) shows its head —
// latex-state.js moleculeHead, every number the live solve's — in THE FADE's seat once that solve lands, at most 500 ms after it;
// it holds through a press on the picture before 2.5 s and leaves on one after; Escape takes it at once; the next pick takes it
// before its own solve lands.  A `?preset=` boot, an undo back to the molecule, a link open and a demo open show nothing
// (`__LW.head.shown`, the witness); STAGE TEXT off shows nothing; STATUS TAGS off (the first run's) hides nothing.
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
    window.__fades = () => __LW.stageText.layer.root.querySelectorAll('.mir-info-block[data-fade]').length;
    /* the hand's road: the page turner to the molecule's section (the dropdown holds one), then the dropdown's own change */
    window.__pick = (id) => { const s = document.querySelector('.dev[data-id="chem"] .mol-pick select.sel');
      for (const sec of ['DIATOMICS', 'HYDRIDES', 'ORGANIC', 'BIO', 'LATTICE', 'HEAVY']) { if ([...s.options].some((o) => o.value === id)) break; __LW.chem.section(sec); }
      s.value = id; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); };
    window.__until = async (f, ms = 20000) => { const t0 = performance.now(); while (!f()) { if (performance.now() - t0 > ms) return false; await __w(10); } return true; };
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    return 1;`);

  /* ── 1 · a hand pick of WATER (LIVE, no record): the head lands with the solve, holds through an early press, leaves on a late one ── */
  const t1 = await ev(`const S = __LW.stageText, Hd = __LW.head, c = __LW.chem;
    const boot = { shown: Hd.shown, fades: __fades(), tags: __LW.look.get('badges') };
    const t0 = performance.now(); __pick('H2O');
    await __until(() => { const s = c.solution(); return s && s.key === 'H2O|sto-3g|0'; }); const tSolve = performance.now() - t0;
    await __until(() => __fades() === 1 && /water/.test(__LW.stageText.layer.root.querySelector('.mir-info-block[data-fade]').textContent)); const tHead = performance.now() - t0;
    window.__shownAt = performance.now();
    const blk = S.layer.root.querySelector('.mir-info-block[data-fade]');
    return { boot, tSolve, tHead, shown: Hd.shown, md: Hd.md, banner: S.banner === Hd.md, katex: blk.querySelectorAll('.katex').length, err: blk.querySelectorAll('.katex-error').length,
      text: blk.textContent.replace(/\\s+/g, ' ').slice(0, 400), recordOnly: !!(c.solution().stem), errs: __e.slice() };`);
  assert.deepEqual(t1.boot, { shown: 0, fades: 0, tags: false }, 'a ?preset= boot showed a head, or STATUS TAGS is not off: ' + JSON.stringify(t1.boot));
  assert.equal(t1.shown, 1, 'the hand pick did not show the head once: ' + JSON.stringify(t1));
  assert.ok(t1.tHead - t1.tSolve <= 500, `the head came ${(t1.tHead - t1.tSolve).toFixed(0)} ms after the solve: ` + JSON.stringify(t1));
  assert.ok(t1.banner && t1.katex >= 5 && t1.err === 0, 'the head is not the fade block, set in KaTeX: ' + JSON.stringify(t1));
  assert.ok(/^\*\*\$\\mathrm\{H_\{2\}O\}\$ · water\*\*\nRHF\/STO-3G · \$E = -74\.\d{6}\\,E_h\$\n5 occupied of 7 AO · \$C_\{2v\}\$\nHOMO \$1b_\{1\}\$ · gap \$\d\.\d{4}\\,E_h\$ = \d+\.\d{2} eV$/.test(t1.md), 'the head: ' + t1.md);
  assert.equal(t1.recordOnly, false, 'WATER opened from a record: it has none');
  assert.deepEqual(t1.errs, []);
  await ev(`while (performance.now() - __shownAt < 1000) await __w(20); return 1;`);
  assert.deepEqual(await g.tap('#field'), { ok: 1 });
  const early = await ev(`await __w(120); return { banner: __LW.stageText.banner === __LW.head.md, fades: __fades(), at: performance.now() - __shownAt };`);
  assert.ok(early.banner && early.fades === 1, 'a press on the picture before 2.5 s took the head: ' + JSON.stringify(early));
  await ev(`while (performance.now() - __shownAt < 2650) await __w(20); return 1;`);
  assert.deepEqual(await g.tap('#field'), { ok: 1 });
  const late = await ev(`await __w(600); return { banner: __LW.stageText.banner, fades: __fades(), md: __LW.stageText.md, at: performance.now() - __shownAt };`);
  assert.ok(late.banner === null && late.fades === 0 && /^\$/.test(late.md), 'a press on the picture after 2.5 s did not take the head (or the formula did not come back): ' + JSON.stringify(late));
  pass(`a hand pick of WATER: solved in ${t1.tSolve.toFixed(0)} ms, its head on the stage ${(t1.tHead - t1.tSolve).toFixed(0)} ms later (≤ 500) — "${t1.text.slice(0, 120)}…"; a press on the picture at ${early.at.toFixed(0)} ms kept it, one at ≈ 2.65 s took it and the formula came back; STATUS TAGS off`);

  /* ── 2 · Escape takes the head at once; the next pick takes it before its own solve lands ── */
  const t2 = await ev(`const S = __LW.stageText, Hd = __LW.head, n0 = Hd.shown;
    __pick('N2'); await __until(() => Hd.shown === n0 + 1); await __w(300); const n2 = { banner: S.banner === Hd.md, md: Hd.md };
    return { n0, n2, shown: Hd.shown };`);
  assert.ok(t2.n2.banner && /nitrogen/.test(t2.n2.md) && /\$D_\{\\infty h\}\$/.test(t2.n2.md) && /HOMO \$3\\sigma_\{g\}\$/.test(t2.n2.md), 'N₂\'s head: ' + JSON.stringify(t2));
  await g.press('');
  const esc = await ev(`await __w(500); return { banner: __LW.stageText.banner, fades: __fades() };`);
  assert.deepEqual(esc, { banner: null, fades: 0 }, 'Escape did not take the head: ' + JSON.stringify(esc));
  const t2b = await ev(`const S = __LW.stageText, Hd = __LW.head, n0 = Hd.shown;
    __pick('H2O'); await __until(() => Hd.shown === n0 + 1); await __w(300); const water = S.banner === Hd.md;
    __pick('NH3'); const gone = S.banner;   /* synchronous: the next pick takes the head before NH₃'s solve lands */
    await __until(() => Hd.shown === n0 + 2); await __w(300);
    return { water, gone, nh3: S.banner === Hd.md && /ammonia/.test(Hd.md), shown: Hd.shown - n0 };`);
  assert.ok(t2b.water && t2b.gone === null && t2b.nh3 && t2b.shown === 2, 'the next pick: ' + JSON.stringify(t2b));
  pass(`N₂'s head (D∞h, HOMO 3σg) left on Escape; WATER's head left the moment NH₃ was picked, and NH₃'s came with its solve`);

  /* ── 3 · NEVER on a handless road: an undo back to WATER, a link open, a demo open, STAGE TEXT off ── */
  const t3 = await ev(`const S = __LW.stageText, Hd = __LW.head, H = __LW.history, P = __LW.layout.projects, c = __LW.chem, c0 = window.confirm; window.confirm = () => true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await __w(400); H.flush(); await __w(450); H.flush();
    const n0 = Hd.shown, a0 = S.stats.announced;
    let undos = 0; while (c.preset() !== 'H2O' && undos < 12 && H.undo()) { undos++; await __w(200); }
    await __until(() => { const s = c.solution(); return s && s.key === 'H2O|sto-3g|0'; }); await __w(900);
    const undo = { preset: c.preset(), undos, shown: Hd.shown - n0, fades: __fades() };
    const link = __LW.link.open(__LW.link.mint().href); await __w(900);
    const r = await fetch('./demos/water.lambdawaves.json', { cache: 'no-cache' }); const path = P.importText(await r.text()); P.open(path);
    await __until(() => c.solution() && c.preset() === 'H2O' && c.on); await __w(1500);
    const demo = { on: c.on, shown: Hd.shown - n0, fades: __fades() };
    const sw = [...document.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl') || {}).textContent === 'STAGE TEXT');
    sw.click(); await __w(100); __pick('HF'); await __until(() => { const s = c.solution(); return s && s.key === 'HF|sto-3g|0'; }); await __w(600);
    const off = { stage: S.on, shown: Hd.shown - n0 }; sw.click(); await __w(300);
    window.confirm = c0;
    return { undo, link: link.opened && link.ok, demo, off, announced: S.stats.announced - a0, after: { shown: Hd.shown - n0, fades: __fades() }, errs: __e.slice() };`);
  assert.ok(t3.undo.preset === 'H2O' && t3.undo.undos > 0, 'the undo did not walk back to WATER: ' + JSON.stringify(t3));
  assert.deepEqual([t3.undo.shown, t3.undo.fades], [0, 0], 'an undo back to WATER showed its head: ' + JSON.stringify(t3));
  assert.equal(t3.link, true);
  assert.deepEqual([t3.demo.shown, t3.demo.fades], [0, 0], 'a link or a demo open showed a head: ' + JSON.stringify(t3));
  assert.deepEqual(t3.off, { stage: false, shown: 0 }, 'STAGE TEXT off still showed a head: ' + JSON.stringify(t3));
  assert.deepEqual(t3.after, { shown: 0, fades: 0 }); assert.equal(t3.announced, 0, 'a handless road announced: ' + JSON.stringify(t3));
  assert.deepEqual(t3.errs, []);
  pass(`no head on a handless road: ${t3.undo.undos} undos back to WATER, a link open, the water demo's open (MOLECULES on: ${t3.demo.on}) and a hand pick under STAGE TEXT off — 0 heads, 0 fades, 0 announcements`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED molecule-head' : 'GREEN molecule-head');
process.exit(failed ? 1 : 0);
