/* k039-shots.mjs — iteration 039 chain K's one check per door and its pictures (a diagnostic, not a gate).
 *   LW_PORT=9627 GD_PORT=5627 node tools/k039-shots.mjs <scene> [out-dir]
 * Scenes: k1 (THE STEPPED CLOCK LOOPS: PLAYBACK LOCK on, a 2-bar ACTIVE range, 20 s of play — the head wraps; a 3-bar film over the 2-bar
 * loop renders 3 bars) · k2 · k3m · k3 · k4 · k6 · k7 (FOLDERS' window) · k7v (its card and the MAIN MENU's page) · k8 (the empty TIMELINE) ·
 * k9 (THE FINISH at K_W × K_H). [out-dir] [before|after] tag the pictures.
 * JPEGs into <out-dir> (default .tmp/K-shots). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'k1', DIR = process.argv[3] || '.tmp/K-shots';
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = +process.env.K_W || 1500, H = +process.env.K_H || 950;   // K_W / K_H: the narrow page (K9 FINISH)
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9627}/lab/?starter=home&warn=0&sw=0`, { width: W, height: H,
  prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const nap = (ms) => g.ev(`await new Promise((r) => setTimeout(r, ${ms})); return 1;`);
async function shot(name, box, pad = 8) {
  const png = `.tmp/k-${name}.png`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]
if b != '-': x0, y0, x1, y1 = (int(v) for v in b.split(',')); im = im.crop((x0, y0, min(x1, im.width), min(y1, im.height)))
if im.width > 1200: im = im.resize((1200, round(im.height * 1200 / im.width)))
im.save(sys.argv[2], quality=84)`, png, `${DIR}/${name}.jpg`, box ? box.map((v, i) => Math.round(Math.max(0, v + (i < 2 ? -pad : pad)))).join(',') : '-']);
  return `${DIR}/${name}.jpg`;
}
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready && __LW.timeline', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  if (scene === 'k1') {
    /* the check: PLAYBACK LOCK at 60 Hz, 120 BPM, an ACTIVE range of 2 bars (8 beats) from 1.1; play 20 s (40 beats) sampling the head every 250 ms —
       it never reaches 8 and comes back past 1.1 (the loops counter moves); then a 6-s RECORD (3 bars at 120 BPM) from beat 0 with MOD armed: the
       film's frame log runs 0 → 12 beats unlooped (the recorder's step passes nothing) */
    out.setup = await g.ev(`__LW.loadPreset('1s+2pz'); __LW.pause(); await __LW.settle();
      __LW.fieldRate.lock = true; __LW.fieldRate.hz = 60; __LW.mod.clock.setBpm(120); __LW.mod.arm(true);
      const tl = __LW.timeline; tl.editor.setActiveRange({ start: 0, end: 8 }); tl.controller.seek(0); await __LW.settle();
      return { lock: __LW.fieldRate.lock, hz: __LW.fieldRate.hz, bpm: __LW.mod.model.transport.bpm, loop: __LW.mod.clock.loop(), loops0: __LW.mod.clock.stats().loops };`);
    out.play = await g.ev(`__LW.play(); const T0 = performance.now(), seen = []; let max = 0, wraps = 0, prev = -1;
      while (performance.now() - T0 < 20000) { await new Promise((r) => setTimeout(r, 250)); const b = __LW.mod.model.transport.beats; seen.push(+b.toFixed(2)); if (b > max) max = b; if (b < prev - 1) wraps++; prev = b; }
      const loops = __LW.mod.clock.stats().loops, steps = __LW.mod.clock.stats().steps; __LW.pause(); await __LW.settle();
      return { max: +max.toFixed(3), wraps, loops, steps, first: seen.slice(0, 6), last: seen.slice(-6), n: seen.length };`);
    out.film = await g.ev(`const F = __LW.captureUI.exact; F.save = () => true; __LW.timeline.controller.seek(0); await __LW.settle();
      const r = await __LW.captureUI.record(); const fr = (r && r.manifest && r.manifest.frames) || [], beats = fr.map((x) => x.beat).filter(Number.isFinite);
      let mono = true; for (let i = 1; i < beats.length; i++) if (!(beats[i] > beats[i - 1])) mono = false;
      return { ok: r && r.ok, frames: r && r.frames, error: r && r.error, first: beats[0], last: beats.at(-1), mono, n: beats.length };`);
    out.verdict = { headWraps: out.play.max < 8 && out.play.wraps >= 2 && out.play.loops > out.setup.loops0, filmThreeBars: !!out.film.ok && out.film.mono && out.film.first < 0.1 && out.film.last > 11.8 };
  }
  if (scene === 'k2') {
    /* the count: every seg and stepper root in the page (hydrogen, then a molecule), and how many wear a hint on the root itself */
    const count = () => g.ev(`await __LW.settle(); const R = [...document.querySelectorAll('.segw, .mir-step')], tip = (r) => r.dataset.helpEn || r.title || '', hinted = R.filter(tip);
      const where = (r) => (r.closest('.dev') && r.closest('.dev').dataset.id) || (r.closest('[data-mir-window]') && r.closest('[data-mir-window]').dataset.mirWindow) || r.parentElement.className.split(' ')[0];
      return { roots: R.length, hinted: hinted.length, long: hinted.filter((r) => tip(r).length > 60).map(tip), list: hinted.map((r) => where(r) + ': ' + tip(r)) };`);
    out.hydrogen = await count();
    await g.ev(`__LW.run('mode', { id: 'molecules' }); await new Promise((r) => setTimeout(r, 2500)); return 1;`);
    out.molecules = await count();
    /* the node faces: LEVELS and ABERRATION with their feet open (MASK, TARGET and ABERRATION's mode are segs) — the root hint is the kit's now */
    await g.ev(`const N = __LW.nodes; N.open(); await new Promise((r) => setTimeout(r, 600)); N.win.place({ x: 600, y: 40, w: 520, h: 760 }); N.add('levels'); N.add('aberration');
      await new Promise((r) => setTimeout(r, 600)); for (const f of document.querySelectorAll('[data-mir-window="nodes"] .nodes-foot-fold, [data-mir-window="nodes"] [data-fold]')) f.click(); await new Promise((r) => setTimeout(r, 400)); return 1;`);
    out.nodes = await count();
  }
  if (scene === 'k3m' || scene === 'k3') {
    /* every seg in a fit row (hydrogen, a molecule, three nodes with their feet open): its cells now, the room it needs, one cell's width — so the
       one-cell default can be judged row by row; k3 also takes the nodes' full cards (FILM GRAIN's KIND · BLEND, ABERRATION's MODE, the feet) */
    const measure = () => g.ev(`await __LW.settle(); const rows = [...document.querySelectorAll('.row.fit')], out = [];
      for (const r of rows) { const cols = getComputedStyle(r).gridTemplateColumns.split(' ').filter((x) => /px$/.test(x)).map(parseFloat);
        for (const s of r.querySelectorAll(':scope > .segw, :scope > .seg')) { const bs = [...s.querySelectorAll('.seg-b')], need = bs.reduce((n, b) => n + b.scrollWidth, 0);
          const where = (s.closest('.dev') && s.closest('.dev').dataset.id) || (s.closest('[data-mir-window]') && s.closest('[data-mir-window]').dataset.mirWindow) || '?';
          out.push({ shown: !!r.offsetParent, where, opts: bs.map((b) => b.textContent.trim()).join('|'), span: getComputedStyle(s).gridColumnStart + '/' + getComputedStyle(s).gridColumnEnd, w: Math.round(s.getBoundingClientRect().width), need: Math.round(need), cell: Math.round(cols[0] || 0), cols: cols.length, cls: s.className }); } }
      return out;`);
    out.hydrogen = await measure();
    await g.ev(`__LW.run('mode', { id: 'molecules' }); await new Promise((r) => setTimeout(r, 2500)); return 1;`);
    out.molecules = await measure();
    await g.ev(`const N = __LW.nodes; N.open(); await new Promise((r) => setTimeout(r, 600)); N.win.place({ x: 560, y: 30, w: 560, h: 880 }); N.add('grain'); N.add('aberration'); N.add('levels');
      await new Promise((r) => setTimeout(r, 800)); for (const f of document.querySelectorAll('[data-mir-window="nodes"] .nodes-foot-fold, [data-mir-window="nodes"] [data-fold]')) f.click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    out.nodes = (await measure()).filter((x) => x.where === 'nodes');
    if (scene === 'k3') {
      const tag = process.argv[4] || 'after';
      for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
        const box = await g.ev(`const w = document.querySelector('[data-mir-window="nodes"]'); const r = w.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
        out['shot-' + t] = await shot(`039-K3-nodes-${tag}-${t}`, box); }
    }
  }
  if (scene === 'k4') {
    /* the timeline's work-bar power seat is built with the word face: MOD, the kit's own label (data-t), with no relabel in the app; a press arms / disarms */
    await g.ev(`__LW.timeline.open(); await new Promise((r) => setTimeout(r, 1200)); return 1;`);
    const seat = () => g.ev(`const p = __LW.timeline.root.querySelector('.tl-transport .mir-mod-power'); return p && { face: p.dataset.face, text: p.textContent.trim(), key: p.dataset.t || null, on: p.classList.contains('on'), svg: !!p.querySelector('svg'), armed: __LW.mod.armed };`);
    out.seat = await seat();
    await g.tap('.tl-transport .mir-mod-power'); await nap(300); out.pressed = await seat();
    await g.tap('.tl-transport .mir-mod-power'); await nap(300); out.back = await seat();
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      const box = await g.ev(`const r = __LW.timeline.root.querySelector('.tl-transport').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
      out['shot-' + t] = await shot(`039-K4-work-bar-${t}`, box, 12); }
  }
  if (scene === 'k6') {
    /* a real hover on MOLECULES' fold button (unfolded, at the left rack's top) and on SPECTRUM's: the hint's rect against the card's head and its
       first row below the head — the hint must not cover the first row; pictures dark and light (argv[4] tags them before / after) */
    const tag = process.argv[4] || 'after';
    await g.ev(`__LW.run('mode', { id: 'molecules' }); await new Promise((r) => setTimeout(r, 2500)); for (const id of ['chem', 'spectrum']) { __LW.layout.reopen(id); const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); } await new Promise((r) => setTimeout(r, 800)); return 1;`);
    const hover = async (id) => {
      const c = await g.ev(`__LW.layout.raise('${id}'); await new Promise((r) => setTimeout(r, 600)); const rk = document.querySelector('.dev[data-id="${id}"]').closest('#rackL, #rackR, .rack'); if (rk) rk.scrollTop = 0; await new Promise((r) => setTimeout(r, 300)); const b = document.querySelector('.dev[data-id="${id}"] .dev-head .dev-fold'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2].map(Math.round);`);
      if (!c) return { missing: id };
      await drv.actions(g.s, [{ type: 'pointer', id: 'h' + id, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 5, y: 600 }, { type: 'pointerMove', duration: 120, origin: 'viewport', x: c[0], y: c[1] }] }]);
      await nap(1100);
      return g.ev(`const d = document.querySelector('.dev[data-id="${id}"]'), head = d.querySelector('.dev-head').getBoundingClientRect(), tip = document.getElementById('controlHelp');
        const kids = [...d.children].filter((k) => k !== d.querySelector('.dev-head') && k.getBoundingClientRect().height > 0), first = kids.length ? kids[0].getBoundingClientRect() : null, t = tip.getBoundingClientRect();
        const R = (q) => q && [q.left, q.top, q.right, q.bottom].map(Math.round);
        return { shown: !tip.hidden, text: tip.textContent, tip: R(t), head: R(head), first: R(first), overFirst: !!first && !tip.hidden && t.bottom > first.top + 1 && t.top < first.bottom && t.right > first.left && t.left < first.right, card: R(d.getBoundingClientRect()) };`);
    };
    for (const t of ['dark', 'light']) {
      await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      for (const id of ['chem', 'spectrum']) {
        const o = out[id + '-' + t] = await hover(id);
        if (o && o.card) { const b = [Math.min(o.card[0], o.tip[0]), Math.min(o.head[1], o.tip[1]) - 4, Math.max(o.card[2], o.tip[2]), Math.max(o.head[3] + 90, o.tip[3])]; o.shot = await shot(`039-K6-${id}-fold-hint-${tag}-${t}`, b, 10); }
      }
    }
  }
  if (scene === 'k7') {
    /* FOLDERS with two saved projects at ROOT: each card's name at rest (a caption row, shown), the card's hint, and after one press the chosen
       card's; the window's height and whether its grid scrolls; pictures dark and light (argv[4] tags them before / after) */
    const tag = process.argv[4] || 'after';
    await g.ev(`__LW.loadPreset('1s+2pz'); await __LW.settle(); __LW.projects.save('PULSE LOOP'); __LW.loadPreset('3dz2'); await __LW.settle(); __LW.projects.save('SLOW SPIN');
      __LW.projects.folders.open(); await new Promise((r) => setTimeout(r, 1500)); return 1;`);
    const read = () => g.ev(`const W = document.querySelector('.mir-folders'), cards = [...W.querySelectorAll('.sv-card')], grid = W.querySelector('.sv-project-grid'), win = W.closest('[data-mir-window]') || W;
      const vis = (n) => !!n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0;
      return { cards: cards.map((c) => ({ name: c.dataset.name, shown: vis(c.querySelector('.sv-name')), caption: !!c.querySelector('.sv-cap'), hint: c.querySelector('.sv-shot').dataset.helpEn || c.querySelector('.sv-shot').title, aria: c.querySelector('.sv-shot').getAttribute('aria-label') })),
        win: Math.round(win.getBoundingClientRect().height), scrolls: [...W.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(n).overflowY)).map((n) => n.className.split(' ')[0]) };`);
    out.rest = await read();
    await g.tap('.mir-folders .sv-card[data-name="PULSE LOOP"] .sv-shot'); await nap(500);
    out.chosen = await read();
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      const box = await g.ev(`const r = (document.querySelector('.mir-folders').closest('[data-mir-window]') || document.querySelector('.mir-folders')).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
      out['shot-' + t] = await shot(`039-K7-folders-${tag}-${t}`, box, 6); }
  }
  if (scene === 'k7v') {
    /* THE OTHER TWO VIEWS of the one library with `captions`: the FOLDERS rack card (8 a page) and the MAIN MENU's FOLDERS page (picker.js
       sizes its page). Nine saved projects (two pages of the card): every card's name shown and uncut or cut with …, the page buttons' top on
       page 1 and page 2 (equal = the page reserves its rows), the card's height, what scrolls; pictures dark and light */
    const tag = process.argv[4] || 'after';
    await g.ev(`const names = ['PULSE LOOP', 'SLOW SPIN', 'A VERY LONG PROJECT NAME THAT RUNS ON', 'BENZENE', 'WATER', 'TWO', 'THREE', 'FOUR', 'NINE'];
      for (const [i, n] of names.entries()) { __LW.loadPreset(i % 2 ? '3dz2' : '1s+2pz'); await __LW.settle(); __LW.projects.save(n); } return 1;`);
    const readView = (sel) => g.ev(`const V = document.querySelector(${JSON.stringify(sel)}); if (!V) return null; const vis = (n) => !!n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0;
      const cards = [...V.querySelectorAll('.sv-card')], pages = V.querySelector('.sv-pages'), lab = V.querySelector('.sv-page-label');
      return { cards: cards.length, named: cards.filter((c) => vis(c.querySelector('.sv-cap .sv-name'))).length, cut: cards.filter((c) => { const n = c.querySelector('.sv-name'); return n && n.scrollWidth > n.clientWidth + 1; }).map((c) => c.dataset.name),
        capH: cards[0] ? Math.round(cards[0].querySelector('.sv-meta').getBoundingClientRect().height) : 0, card: cards[0] ? Math.round(cards[0].getBoundingClientRect().height) : 0,
        grid: (() => { const G = V.querySelector('.sv-project-grid'), cs = getComputedStyle(G), f = V.querySelector('.mm-fgal') || V; return { w: Math.round(G.getBoundingClientRect().width), h: Math.round(G.getBoundingClientRect().height), fw: Math.round(f.getBoundingClientRect().width), gap: cs.columnGap, minH: cs.minHeight, rows: cs.gridTemplateRows, cols: cs.gridTemplateColumns }; })(),
        pagesTop: pages && vis(pages) ? Math.round(pages.getBoundingClientRect().top) : null, page: lab ? lab.textContent : null, view: Math.round(V.getBoundingClientRect().height),
        scrolls: [...V.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(n).overflowY)).map((n) => n.className.split(' ')[0]) };`);
    const next = (sel) => g.ev(`const b = document.querySelector(${JSON.stringify(sel)} + ' .sv-pages button:last-child'); if (b && !b.disabled) b.click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    const prev = (sel) => g.ev(`const b = document.querySelector(${JSON.stringify(sel)} + ' .sv-pages button:first-child'); if (b && !b.disabled) b.click(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
    /* the rack card */
    const CARD = '.dev[data-id="projects"]';
    await g.ev(`__LW.actions.run('window.projects.open'); __LW.layout.raise('projects'); await new Promise((r) => setTimeout(r, 1200)); const d = document.querySelector('${CARD}'); d.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 400)); return 1;`);
    out.card1 = await readView(CARD); await next(CARD); out.card2 = await readView(CARD); await prev(CARD);
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      const box = await g.ev(`const r = document.querySelector('${CARD}').getBoundingClientRect(); return [r.left, r.top, r.right, Math.min(r.bottom, innerHeight)].map(Math.round);`);
      out['card-' + t] = await shot(`039-K7-folders-card-${tag}-${t}`, box, 6); }
    await g.ev(`__LW.actions.run('window.projects.close'); await new Promise((r) => setTimeout(r, 400)); return 1;`);
    /* the MAIN MENU's FOLDERS page */
    const PAGE = '#lwMenu .mm-folders';
    await g.ev(`__LW.run('menu'); await new Promise((r) => setTimeout(r, 1500)); document.querySelector('#lwMenu .mm-navb[data-nav="folders"]').click(); await new Promise((r) => setTimeout(r, 2500)); return 1;`);
    out.page1 = await readView(PAGE); await next(PAGE); out.page2 = await readView(PAGE); await prev(PAGE);
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      out['page-' + t] = await shot(`039-K7-folders-page-${tag}-${t}`, null); }
  }
  if (scene === 'k8') {
    /* THE EMPTY TIMELINE: no clip; what the lanes say (the empty line, each lane's band and pane hint), then a real hover on an empty lane's pane
       (the hint shown), dark and light; then one clip made by the knob road (CREATE AUTOMATION CLIP on a registered target): the empty line goes,
       the laned lane's hint is its name again and the other lane still says how (argv[4] tags the pictures before / after) */
    const tag = process.argv[4] || 'after';
    out.open = await g.ev(`__LW.timeline.open(); await new Promise((r) => setTimeout(r, 1500)); const st = __LW.timeline.model.state(); if (st.lanes.length < 2) __LW.timeline.model.addLane(); await new Promise((r) => setTimeout(r, 400));
      return { clips: __LW.timeline.model.state().clips.length, lanes: __LW.timeline.model.state().lanes.length };`);
    const read = () => g.ev(`const W = document.querySelector('[data-mir-window="timeline"]'), e = W.querySelector('.tl-empty'), vis = (n) => !!n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().height > 0;
      return { empty: vis(e) ? e.textContent : null, emptyBox: vis(e) ? [...Object.values(e.getBoundingClientRect().toJSON())].slice(0, 4).map(Math.round) : null,
        lanes: [...W.querySelectorAll('.tl-row')].map((r) => ({ band: r.querySelector('.tl-titleband').dataset.helpEn || r.querySelector('.tl-titleband').title || null, pane: r.querySelector('.tl-pane').dataset.helpEn || r.querySelector('.tl-pane').title || null })),
        win: Math.round(W.getBoundingClientRect().height) };`);
    out.rest = await read();
    const hover = async () => {
      const c = await g.ev(`const p = document.querySelectorAll('[data-mir-window="timeline"] .tl-row .tl-pane'); const r = p[p.length - 1].getBoundingClientRect(); return [Math.round(r.left + r.width * .7), Math.round(r.top + r.height / 2)];`);
      await drv.actions(g.s, [{ type: 'pointer', id: 'hk8', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 5, y: 300 }, { type: 'pointerMove', duration: 120, origin: 'viewport', x: c[0], y: c[1] }] }]);
      await nap(1100);
      return g.ev(`const tip = document.getElementById('controlHelp'); return { shown: !!tip && !tip.hidden, text: tip ? tip.textContent : null };`);
    };
    for (const t of ['dark', 'light']) {
      await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      out['hint-' + t] = await hover();
      const box = await g.ev(`const r = document.querySelector('[data-mir-window="timeline"]').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
      out['shot-' + t] = await shot(`039-K8-timeline-empty-${tag}-${t}`, box, 6);
    }
    out.made = await g.ev(`const id = 'observer.yaw', has = __LW.mod.registry.has(id); __LW.timeline.editor.createClip(id); await new Promise((r) => setTimeout(r, 800)); return { id, has, clips: __LW.timeline.model.state().clips.length };`);
    out.full = await read();
    const box = await g.ev(`const r = document.querySelector('[data-mir-window="timeline"]').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
    out['shot-full'] = await shot(`039-K8-timeline-one-clip-${tag}-light`, box, 6);
  }
  if (scene === 'k9') {
    /* THE FINISH over K7's and K8's surfaces at this page's size (K_W × K_H), both themes: the empty TIMELINE (its line inside the window, how
       many lines), the knob menu by the keyboard (Shift+F10 on a focused routable knob: CLIP › there; Escape closes it), the FOLDERS window with
       two projects (names at rest; Tab reaches a card, Enter selects it and its hint turns, Escape lets go) */
    const tag = W + 'x' + H, key = (k) => g.press(k);
    const chord = async (a, b) => { await drv.actions(g.s, [{ type: 'key', id: 'k9c', actions: [{ type: 'keyDown', value: a }, { type: 'keyDown', value: b }, { type: 'pause', duration: 40 }, { type: 'keyUp', value: b }, { type: 'keyUp', value: a }] }]); await drv.relActions(g.s); };
    await g.ev(`__LW.loadPreset('1s+2pz'); await __LW.settle(); __LW.projects.save('PULSE LOOP'); __LW.loadPreset('3dz2'); await __LW.settle(); __LW.projects.save('SLOW SPIN'); return 1;`);
    await g.ev(`__LW.timeline.open(); await new Promise((r) => setTimeout(r, 1500)); return 1;`);
    out.tl = await g.ev(`const W = document.querySelector('[data-mir-window="timeline"]'), e = W.querySelector('.tl-empty span') || W.querySelector('.tl-empty'), w = W.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(W.querySelector('.tl-empty')); const rs = [...range.getClientRects()], tb = rs.reduce((a, r) => [Math.min(a[0], r.left), Math.min(a[1], r.top), Math.max(a[2], r.right), Math.max(a[3], r.bottom)], [1e9, 1e9, -1e9, -1e9]);
      return { win: [w.left, w.top, w.right, w.bottom].map(Math.round), text: tb.map(Math.round), inside: tb[0] >= w.left && tb[2] <= w.right && tb[1] >= w.top && tb[3] <= w.bottom, lines: new Set(rs.map((r) => Math.round(r.top))).size };`);
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      out['tl-' + t] = await shot(`039-K9-timeline-empty-${tag}-${t}`, out.tl.win, 6); }
    out.knobMenu = await g.ev(`const k = [...document.querySelectorAll('.k[data-param]')].find((n) => n.getBoundingClientRect().height > 0 && __LW.mod.registry.has(n.dataset.param)); if (!k) return null;
      const f = k.matches('[tabindex]') ? k : k.querySelector('[tabindex]') || k; f.focus(); return { param: k.dataset.param, focused: document.activeElement === f };`);
    await chord('\uE008', '\uE01A'); await nap(500);
    out.knobMenu.open = await g.ev(`const m = [...document.querySelectorAll('.glass[data-mir-surface="menu"]')].find((n) => !n.hidden && n.getBoundingClientRect().height > 0); return m ? [...m.querySelectorAll('button, [role="menuitem"]')].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 10) : null;`);
    await key('\uE00C'); await nap(400);
    out.knobMenu.closed = await g.ev(`return ![...document.querySelectorAll('.glass[data-mir-surface="menu"]')].some((n) => !n.hidden && n.getBoundingClientRect().height > 0);`);
    await g.ev(`__LW.timeline.close(); await new Promise((r) => setTimeout(r, 600)); __LW.projects.folders.open(); await new Promise((r) => setTimeout(r, 1500)); document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
    const card = () => g.ev(`const a = document.activeElement, c = a && a.closest && a.closest('.sv-card'); return c ? { name: c.dataset.name, pressed: a.getAttribute('aria-pressed'), hint: a.dataset.helpEn || a.title, ring: getComputedStyle(a).outlineStyle } : { at: a ? (a.className || a.tagName) : null };`);
    await g.ev(`const t = document.querySelector('.mir-folders .sv-toolbar button, .mir-folders .sv-toolbar [tabindex]'); if (t) t.focus(); return !!t;`);
    let tabs = 0; for (; tabs < 24; tabs++) { await key('\uE004'); const c = await card(); if (c.name) break; }
    out.kbd = { tabs: tabs + 1, at: await card() };
    await key('\uE007'); await nap(400); out.kbd.enter = await card();
    await key('\uE00C'); await nap(400); out.kbd.escape = await card();
    out.fold = await g.ev(`const W = document.querySelector('.mir-folders'), w = (W.closest('[data-mir-window]') || W).getBoundingClientRect(); return { win: [w.left, w.top, w.right, w.bottom].map(Math.round), names: [...W.querySelectorAll('.sv-card .sv-cap .sv-name')].map((n) => n.getBoundingClientRect().height > 0 ? n.textContent : null), scrolls: [...W.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(n).overflowY)).map((n) => n.className.split(' ')[0]), over: w.bottom > innerHeight || w.right > innerWidth };`);
    for (const t of ['dark', 'light']) { await g.ev(`__LW.look.set({ theme: '${t}' }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
      out['folders-' + t] = await shot(`039-K9-folders-${tag}-${t}`, out.fold.win, 6); }
  }
  out.errs = (await g.errors()).errs;
} catch (e) { out.E = String(e && e.stack || e); }
finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
