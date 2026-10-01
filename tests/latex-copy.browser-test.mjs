// THE COPY (0.3.3 · wave 135): SPECTRUM's ⧉ and EDIT › COPY the state as LaTeX, in the real app, on WAVE DANCER.
// The head button is found where the lab's other ⧉ sits, pressed by the driver's own pointer at a centre elementFromPoint
// says is the button; what it copies is judged against Josh's own sentence in the demo's notebook, the EDIT row must copy
// the same text, the text must render under KaTeX in the notebook with no .katex-error, and an empty register copies nothing.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`, { width: 1500, height: 1000, script: 30000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  /* the clipboard, stubbed: a driver press is trusted, but what is judged is WHAT the copy writes, and a headless
     Firefox may refuse the real clipboard; the menubar driver is menubar.browser-test's own */
  await g.ev(`window.__clip = []; navigator.clipboard.writeText = async (t) => { __clip.push(t); };
    window.__row = async (menu, label) => {
      __LW.layout.menu.open();
      const bar = document.getElementById('menubar');
      const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.textContent === menu);
      if (!btn) return { found: false, why: 'no menu ' + menu };
      btn.click();
      const it = [...btn.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.startsWith(label));
      if (!it) { btn.click(); return { found: false, why: 'no row ' + label }; }
      const disabled = it.disabled, title = it.dataset.help || it.title;
      if (!disabled) it.click(); else btn.click();
      await __LW.settle();
      return { found: true, disabled, title, closed: bar.hidden };
    };
    return 1;`);

  /* ── 1 · WAVE DANCER opens through the projects road; Josh's two sentences are read out of its notebook ── */
  const demo = await g.ev(`const w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
    __LW.layout.notebook.open('projects'); await w(200); document.querySelector('.pj-demo').click();
    for (let i = 0; i < 60 && !/WAVE DANCER/.test(document.querySelector('.pj-status').textContent); i++) await w(100);
    await w(300);
    const m = __LW.layout.notebook.text.match(/running (.+?) in STATE-A and (.+?) in STATE-B/);
    __LW.layout.notebook.close(); __LW.pause();
    return { status: document.querySelector('.pj-status').textContent, A: m && m[1], B: m && m[2], ab: !!(__LW.ab.A && __LW.ab.B), mix: __LW.ab.on, errs: __e.slice() };`);
  assert.match(demo.status, /opened demo DEMOS\/WAVE DANCER/);
  assert.equal(demo.A, '$2p_{-1}$, $2p_{1}$, $4p_{-1}$, and $4d_{2}$');
  assert.equal(demo.B, '$2s_{0}$, $2p_{0}$, $4p_{1}$, and $4d_{-2}$');
  assert.equal(demo.ab, true); assert.deepEqual(demo.errs, []);
  console.log(`PASS WAVE DANCER opens (A/B transition ${demo.mix ? 'playing' : 'stored'}) and its notebook says A = ${demo.A}, B = ${demo.B}`);

  /* ── 2 · the head button: one ⧉ in SPECTRUM's .dev-util, in the INFO panels' seat (after ⏻, before ▾), and it is the
         topmost thing at its own centre ── */
  const head = await g.ev(`__LW.layout.raise('spectrum'); await __LW.settle();
    const card = document.querySelector('.dev[data-id="spectrum"]'), util = card.querySelector('.dev-util'), b = util.querySelector('.dev-copy');
    const kids = [...util.children], r = b ? b.getBoundingClientRect() : null;
    const hit = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    const info = document.querySelector('.dev[data-kind="info"] .dev-util .dev-copy');
    return { copies: card.querySelectorAll('.dev-copy').length, inUtil: !!b && b.parentElement === util, type: b && b.type, title: b && (b.dataset.help || b.title),   /* the kit's control-help moves a title into data-help, the house hint */ aria: b && b.getAttribute('aria-label'), glyph: b && b.textContent,
      afterPower: !!b && kids.indexOf(b) > kids.indexOf(util.querySelector('.dev-power')), beforeFold: !!b && b.nextElementSibling === util.querySelector('.dev-fold'),
      infoSeat: !!info && info.nextElementSibling === info.parentElement.querySelector('.dev-fold'), size: r && [Math.round(r.width), Math.round(r.height)], hit: hit === b };`);
  assert.deepEqual(head, { copies: 1, inUtil: true, type: 'button', title: 'Copy the state as LaTeX', aria: 'Copy the state as LaTeX', glyph: '⧉',
    afterPower: true, beforeFold: true, infoSeat: true, size: [22, 22], hit: true });
  console.log('PASS SPECTRUM\'s ⧉ is one 22 × 22 button in .dev-util, in the same seat as the INFO panels\' ⧉ (after ⏻, before ▾), and elementFromPoint at its centre is the button');

  /* ── 3 · a real press on the A set → line 1 is the notebook's own sentence; `copied` flashes; the status counts ── */
  const pressA = await g.ev(`__LW.ab.recallA(); __LW.pause(); await __LW.settle(); __clip.length = 0; return { on: __LW.ab.on, n: __LW.reg.populated().length };`);
  assert.deepEqual(pressA, { on: false, n: 4 });
  const tapA = await g.tap('.dev[data-id="spectrum"] .dev-copy');
  assert.equal(tapA.ok, 1, JSON.stringify(tapA));
  const gotA = await g.ev(`for (let i = 0; i < 40 && !__clip.length; i++) await new Promise((r) => setTimeout(r, 25));
    const card = document.querySelector('.dev[data-id="spectrum"]');
    return { clip: __clip.slice(), copied: card.classList.contains('copied'), status: card.querySelector('.dev-stat').textContent, t: __LW.clock.t };`);
  assert.equal(gotA.clip.length, 1);
  const A = gotA.clip[0].split('\n');
  assert.equal(A.length, 2);
  assert.equal(A[0], demo.A);
  assert.match(A[1], /^\$\\psi = 0\.50\\,2p_\{-1\} \+ 0\.50\\,(e\^\{[^}]+\}\\,)?2p_\{1\} \+ 0\.50\\,(e\^\{[^}]+\}\\,)?4p_\{-1\} \+ 0\.50\\,(e\^\{[^}]+\}\\,)?4d_\{2\}\$$/);
  assert.equal(gotA.copied, true);
  assert.equal(gotA.status, '4 states as LaTeX');
  console.log('PASS a real press on the A set copies line 1 = the notebook\'s sentence, line 2 = ψ with 0.50 on each term; SPECTRUM flashes · COPIED and says "4 states as LaTeX"');
  console.log(`     copied (A at t = ${gotA.t}): ` + JSON.stringify(gotA.clip[0]));

  /* ── 4 · EDIT › COPY the state as LaTeX writes the same text through the same road ── */
  const rowA = await g.ev(`__clip.length = 0; await new Promise((r) => setTimeout(r, 950));
    const r = await __row('EDIT', 'COPY the state as LaTeX'); for (let i = 0; i < 40 && !__clip.length; i++) await new Promise((q) => setTimeout(q, 25));
    return { r, clip: __clip.slice(), copied: document.querySelector('.dev[data-id="spectrum"]').classList.contains('copied') };`);
  assert.equal(rowA.r.found, true); assert.equal(rowA.r.disabled, false); assert.equal(rowA.r.closed, true);
  assert.match(rowA.r.title, /chemistry order/);
  assert.deepEqual(rowA.clip, gotA.clip);
  assert.equal(rowA.copied, true);
  console.log('PASS EDIT › COPY the state as LaTeX copies the identical text and flashes the same `copied`');

  /* ── 4b · the phases are the LIVE ones: at t = 16π/3 the n = 4 terms have turned −(E₄ − E₂)t = −(3/32)(16π/3) = −π/2
          against the n = 2 terms (E_n = −1/(2n²), every RATE 1 in WAVE DANCER, no field), and the amplitudes have not moved ── */
  const live = await g.ev(`__LW.scrub(16 * Math.PI / 3); await __LW.settle(); __clip.length = 0; await new Promise((r) => setTimeout(r, 950)); return __LW.clock.t;`);
  assert.ok(Math.abs(live - 16 * Math.PI / 3) < 1e-9, 'scrubbed to ' + live);
  const tapL = await g.tap('.dev[data-id="spectrum"] .dev-copy');
  assert.equal(tapL.ok, 1, JSON.stringify(tapL));
  const gotL = await g.ev(`for (let i = 0; i < 40 && !__clip.length; i++) await new Promise((r) => setTimeout(r, 25)); return __clip.slice();`);
  assert.deepEqual(gotL, [demo.A + '\n$\\psi = 0.50\\,2p_{-1} + 0.50\\,2p_{1} + 0.50\\,e^{-i\\pi/2}\\,4p_{-1} + 0.50\\,e^{-i\\pi/2}\\,4d_{2}$']);
  console.log('PASS the phases are c(t)\'s: at t = 16π/3 the A set copies e^{-iπ/2} on 4p₋₁ and 4d₂ against the n = 2 pair, amplitudes still 0.50');
  console.log('     copied (A at t = 16π/3): ' + JSON.stringify(gotL[0]));

  /* ── 5 · the B set, pressed ── */
  await g.ev(`__LW.ab.recallB(); __LW.pause(); await __LW.settle(); __clip.length = 0; return 1;`);
  const tapB = await g.tap('.dev[data-id="spectrum"] .dev-copy');
  assert.equal(tapB.ok, 1, JSON.stringify(tapB));
  const gotB = await g.ev(`for (let i = 0; i < 40 && !__clip.length; i++) await new Promise((r) => setTimeout(r, 25)); return __clip.slice();`);
  assert.equal(gotB.length, 1);
  assert.equal(gotB[0].split('\n')[0], demo.B);
  const tB = await g.ev('return __LW.clock.t;');
  console.log('PASS a real press on the B set copies line 1 = "' + demo.B + '"');
  console.log(`     copied (B at t = ${tB}): ` + JSON.stringify(gotB[0]));

  /* ── 6 · pasted into the notebook, both copies render under KaTeX with no error ── */
  const paste = await g.ev(`const nb = document.getElementById('notebook'), ta = nb.querySelector('.nb-text');
    __LW.layout.notebook.open('notes');
    ta.value = ${JSON.stringify(gotA.clip[0] + '\n\n' + gotB[0])}; ta.dispatchEvent(new Event('input'));
    __LW.layout.notebook.setMode('view');
    const view = nb.querySelector('.nb-view');
    const out = { katex: !!window.katex, formulas: view.querySelectorAll('.katex').length, errors: view.querySelectorAll('.katex-error').length, dollars: (view.textContent.match(/\\$/g) || []).length, mode: nb.dataset.mode };
    __LW.layout.notebook.setMode('edit'); ta.value = ''; ta.dispatchEvent(new Event('input')); __LW.layout.notebook.close();
    return out;`);
  assert.deepEqual(paste, { katex: true, formulas: 10, errors: 0, dollars: 0, mode: 'view' });
  console.log('PASS pasted into the notebook, the two copies render as 10 KaTeX formulas (4 names + ψ, twice) with no .katex-error and no stray $');

  /* ── 7 · the empty register copies nothing and says so ── */
  const empty = await g.ev(`__LW.reg.clear(); await __LW.settle(); __clip.length = 0; await new Promise((r) => setTimeout(r, 950)); return __LW.reg.populated().length;`);
  assert.equal(empty, 0);
  const tapE = await g.tap('.dev[data-id="spectrum"] .dev-copy');
  assert.equal(tapE.ok, 1, JSON.stringify(tapE));
  const gotE = await g.ev(`await new Promise((r) => setTimeout(r, 200)); const card = document.querySelector('.dev[data-id="spectrum"]');
    const status = card.querySelector('.dev-stat').textContent, copied = card.classList.contains('copied');
    const r = await __row('EDIT', 'COPY the state as LaTeX'); await new Promise((q) => setTimeout(q, 100));
    return { clip: __clip.slice(), status, copied, row: r, errs: __e.slice() };`);
  assert.deepEqual(gotE.clip, []);
  assert.equal(gotE.status, 'nothing to copy — the register is empty');
  assert.equal(gotE.copied, false); assert.equal(gotE.row.disabled, false);
  assert.deepEqual(gotE.errs, []);
  console.log('PASS the empty register: the press and the EDIT row write nothing, SPECTRUM says "nothing to copy — the register is empty", no flash');

  /* ── 8 · a molecular field owner stands SPECTRUM down: the EDIT row is disabled (there is no list to copy) ── */
  const mol = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.molecule.setOn(true); await __LW.settle();
    const hidden = document.querySelector('.dev[data-id="spectrum"]').hidden; __clip.length = 0;
    const r = await __row('EDIT', 'COPY the state as LaTeX');
    __LW.molecule.setOn(false); await __LW.settle();
    const back = !document.querySelector('.dev[data-id="spectrum"]').hidden;
    const r2 = await __row('EDIT', 'COPY the state as LaTeX'); for (let i = 0; i < 40 && !__clip.length; i++) await new Promise((q) => setTimeout(q, 25));
    return { hidden, disabled: r.disabled, back, enabled: !r2.disabled, clip: __clip.slice(), errs: __e.slice() };`);
  assert.equal(mol.hidden, true); assert.equal(mol.disabled, true); assert.equal(mol.back, true); assert.equal(mol.enabled, true);
  assert.equal(mol.clip.length, 1); assert.equal(mol.clip[0].split('\n')[0], '$1s_{0}$ and $2p_{0}$');
  assert.deepEqual(mol.errs, []);
  console.log('PASS under the H₂⁺ field owner SPECTRUM stands down and the EDIT row is disabled; back on hydrogen the row copies "$1s_{0}$ and $2p_{0}$"');
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED latex-copy.browser-test' : 'GREEN latex-copy.browser-test');
process.exit(failed ? 1 : 0);
