/* hit-probe-set.mjs — 0.5.0 C9 · λWAVES' SCENE LIST for MIR 1.5's tools/hit-probe.mjs: "0 presses through a kit window's gap reach
 * the stage".  (BASINS' 25 inside / 0 through is BASINS' own count, not this one.)
 *   python3 tools/gate/server.py "$PWD" 8823 &          (stop it by pid afterwards)
 *   LW_PORT=8823 node tools/hit-probe-set.mjs [--grid 9] [--step 4] [--press 12] [--json out.json]
 * The kit's tool (always the 1.5 worktree's: MIR15_TOOLS, default ~/Documents/MIR/.claude/worktrees/mir-1.5/tools) asks the browser
 * what an N × N grid over ONE element's box hit-tests as, and press-drags from one point through the browser's own input pipeline
 * (Input.dispatchMouseEvent), never a dispatch at the element.  It takes one URL and one selector; this file is the λWAVES half.
 * For each SCENE a fresh page (after one warm-up navigation: tools/perf/main-thread.mjs' header) has the scene opened through __LW:
 *   1  the window's box is hit-tested on the kit's N × N grid (gridPoints) and on a dense --step px raster; a point the browser
 *      answers with the STAGE (canvas#field) is a GAP — between the modulation window's devices, between its rail's chips,
 *      between a DISCONNECTED card's head and body, a round corner;
 *   2  the kit's probe() presses at the grid's gaps, then at gaps sampled evenly from the raster (--press in all), and drags
 *      40 px with --watch on the camera pose (yaw, pitch, distance, shift): the press REACHED the stage when the pose moved.
 * The CONTROL presses the bare stage the same way and must move the pose, or the watch is blind and the set says so.  A THROUGH scene is
 * judged as the control is: 037 W's widgets layer (#widgets, z 19 over the stage) is never a pointer target, nor is a widget outside EDIT,
 * so a press on either must reach the stage; under EDIT the widget takes the pointer (0 reached) and the layer around it still does not.
 * Exit 0 only when every window was found, the control and every THROUGH scene reached the stage, and 0 gap presses reached it. */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, sleep } from './perf/cdp.mjs';

const KIT = process.env.MIR15_TOOLS || path.join(os.homedir(), 'Documents/MIR/.claude/worktrees/mir-1.5/tools');
const { probe, gridPoints } = await import(pathToFileURL(path.join(KIT, 'hit-probe.mjs')).href);
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
if (!process.env.CHROMIUM && fs.existsSync(PW)) process.env.CHROMIUM = PW;
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const GRID = Number(opt('--grid', 9)), STEP = Number(opt('--step', 4)), PRESS = Number(opt('--press', 12)), JSON_OUT = opt('--json', null);
const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 8823}/lab/?sw=0&warn=0&starter=home&menu=0`;   // menu=0: the Picker opens at boot (iteration 012) and would cover every scene
const POSE = 'JSON.stringify([__LW.obs.yaw, __LW.obs.pitch, __LW.obs.dist, __LW.obs.shift])';
const MOD = `__LW.layout.modulation.expand(); for (let i = 0; i < 3; i++) __LW.mod.addSource('lfo');`;
const SHUT = '__LW.layout.modulation.collapse(); __LW.sw.closeOffer(); __LW.widgets.clear();';   // 032: the update popup is put away too; 038: a widget scene's CLOCK too (the record is the profile's)   // the first-run modulation window is open over the middle of the stage: every other scene shuts it
/* 038 Z6: a card M1's first run (or a saved layout) folded is a head alone — no body, no head-body gap, nothing to press: every floated card is unfolded */
const UNFOLD = (id) => ` if (__LW.actions.get('window.${id}.fold').get()) __LW.run('window.${id}.fold');`;
const FLOAT = SHUT + ` __LW.layout.reopen('shadow'); __LW.layout.popOut('shadow', { x: 640, y: 180, w: 300 });` + UNFOLD('shadow');   // SHADOW ships closed: open it, then float it
const NODES = SHUT + ` __LW.layout.reopen('nodes'); __LW.layout.popOut('nodes', { x: 640, y: 120, w: 300 });` + UNFOLD('nodes');   // the CURVES card's seat since 020 X: NODES' card, the chain as a column
const WIDGET = SHUT + ` __LW.widgets.add('clock');`;   // 037 W: one CLOCK at the stage's centre
/* [name, selector, the scene's setup through __LW, THROUGH?] — the C9 row's list: the modulation window open, a floated card, the chip rail,
   the keyboard window, the notebook, the sheet, the offer, FOLDERS; 037 W's widgets layer; NODES (the CURVES card's successor) */
const SCENES = [
  ['control: the bare stage', '#field', '', true],
  /* the widgets first, before a scene leaves a window open over the stage's centre (the profile keeps NODES, FOLDERS and the TIMELINE open) */
  ['a widget on the stage, outside EDIT (037 W: never a pointer target — THROUGH)', '#widgets > .lw-widget', WIDGET, true],
  ['the widget under EDIT (it takes the pointer)', '#widgets > .lw-widget', WIDGET + ' __LW.widgets.edit(true);'],
  ['the widgets layer under EDIT (the empty stage still turns the camera — THROUGH)', '#widgets', WIDGET + ' __LW.widgets.edit(true);', true],
  ['the modulation window open', '[data-mir-window="modulation"]', MOD],
  ['its chip rail', '[data-mir-rail="modulation"]', MOD],
  ['a floated card, DISCONNECTED (the first-run look: head and body apart)', '#floats > .dev[data-id="shadow"]', FLOAT + ' __LW.setDisconnected(true);'],
  ['a floated card, JOINED', '#floats > .dev[data-id="shadow"]', FLOAT + ' __LW.setDisconnected(false);'],
  ['the NODES card floated, DISCONNECTED (0.5.1 D10-24\'s CURVES card became a node in it, 020 X)', '#floats > .dev[data-id="nodes"]', NODES + ' __LW.setDisconnected(true);'],
  ['the NODES card floated, JOINED', '#floats > .dev[data-id="nodes"]', NODES + ' __LW.setDisconnected(false);'],
  ['the NODES window (the FREE graph: its ground pans, never the camera)', '[data-mir-window="nodes"]', SHUT + " __LW.run('nodes');"],
  ['the keyboard window', '[data-mir-window="keyboard"]', SHUT + ' __LW.keymap.open();'],
  ['the notebook', '[data-mir-window="notebook"]', SHUT + ' __LW.layout.notebook.open();'],
  ['the sheet', '#sheet', SHUT + " document.getElementById('sheet').hidden = false;"],
  ['the offer (032: the update popup)', '.mir-dialog[data-kind="notice"]', SHUT + " const sw = __LW.sw; sw.state = 'ready'; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'hit-probe' }; sw.offer();"],
  ['FOLDERS (0.5.0 C6: the kit window; the notebook\'s PROJECTS face left)', '[data-mir-window="folders"]', SHUT + " __LW.layout.notebook.open('projects');"],
  ['its chip rail', '[data-mir-rail="folders"]', SHUT + " __LW.layout.notebook.open('projects');"],
  ['the TIMELINE, docked at the foot (0.5.0 C7b: the window is clear; its ruler, lanes and work bar are panes)', '[data-mir-window="timeline"]', SHUT + ' __LW.timeline.open();'],
  ['its chip rail', '[data-mir-rail="timeline"]', SHUT + ' __LW.timeline.open();'],
];
/* the page side: the first visible match's box, and what each point hit-tests as ('inside' · 'stage' · the name of anything else) */
const FIND = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })`;
const classify = (sel, pts) => `(() => { const n = ${FIND(sel)}, cv = document.getElementById('field');
  return ${JSON.stringify(pts)}.map((p) => { const h = document.elementFromPoint(p.x, p.y); return h === cv ? 'stage' : h && (h === n || n.contains(h)) ? 'inside'
    : !h ? 'nothing' : h.tagName.toLowerCase() + (h.id ? '#' + h.id : '') + (h.getAttribute('class') ? '.' + String(h.getAttribute('class')).trim().split(/\\s+/)[0] : ''); }); })()`;
const raster = (box) => { const out = []; for (let y = box.top + STEP / 2; y < box.top + box.height; y += STEP) for (let x = box.left + STEP / 2; x < box.left + box.width; x += STEP) out.push({ x, y }); return out; };
const sample = (list, k) => (list.length <= k ? list : Array.from({ length: k }, (_, i) => list[Math.floor((i + 0.5) * list.length / k)]));

const b = await launch({ width: 1600, height: 1000, gpu: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan'] });
/* a scene that moved the camera leaves a dirty project, and its beforeunload guard (rack.js) would hold the next navigation: accept it */
const go = async (u) => { const nav = b.send('Page.navigate', { url: u }); await sleep(800); await b.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); await nav; await sleep(500); };
const ready = async () => { for (let k = 0; k < 120; k++) { if (await b.eval('!!(window.__LW && __LW.ready)')) return true; await sleep(500); } return false; };
const out = { url: URL_, grid: GRID, step: STEP, press: PRESS, kit: KIT, when: new Date().toISOString(), scenes: [] };
let ok = true;
try {
  await go(URL_); if (!(await ready())) throw new Error('the lab never became ready (warm-up): ' + b.logs.slice(0, 3).join(' | '));
  for (const [name, selector, setup, through = false] of SCENES) {
    await go(URL_); if (!(await ready())) throw new Error('the lab never became ready: ' + name);
    const field = await b.eval(`(async () => { if (__LW.warning && __LW.warning.open) __LW.warning.dismiss(); __LW.pause(); __LW.camera.setAutoRotate(false);
      __LW.camera.setFling(0); __LW.camera.stop(); ${setup} await __LW.settle(); await new Promise((r) => setTimeout(r, 400)); return !!__LW.field.ok; })()`);
    const box = await b.eval(`(() => { const n = ${FIND(selector)}; if (!n) return null; const r = n.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; })()`);
    const row = { name, selector, through, field, found: !!box, box: box && [box.left, box.top, box.width, box.height].map(Math.round), grid: { n: GRID, inside: 0, stage: 0, other: {} }, raster: null, pressed: 0, reached: 0, presses: [] };
    if (!box) { ok = false; out.scenes.push(row); console.log(`FAIL  ${name}: no visible ${selector}`); continue; }
    if (/^#floats/.test(selector) && box.height < 80) { ok = false; out.scenes.push(row); console.log(`FAIL  ${name}: the card arrived folded (${row.box.join(',')}) — no body, no gap to press`); continue; }
    const control = through, grid = gridPoints(box, GRID), hits = await b.eval(classify(selector, grid));
    for (const h of hits) if (h === 'inside') row.grid.inside++; else if (h === 'stage') row.grid.stage++; else row.grid.other[h] = (row.grid.other[h] || 0) + 1;
    let gaps = grid.filter((p, i) => hits[i] === 'stage');
    if (control) gaps = gaps.sort((p, q) => Math.hypot(p.x - 800, p.y - 500) - Math.hypot(q.x - 800, q.y - 500)).slice(0, 3);
    else {
      const dense = raster(box), dh = await b.eval(classify(selector, dense)), dgaps = dense.filter((p, i) => dh[i] === 'stage');
      row.raster = { step: STEP, points: dense.length, stage: dgaps.length };
      gaps = gaps.slice(0, PRESS).concat(sample(dgaps, Math.max(0, PRESS - gaps.length)));
    }
    for (const p of gaps) {
      await b.eval('__LW.camera.stop(), 1');
      const r = await probe({ url: URL_, selector, drag: [40, 0], from: [(p.x - box.left) / box.width, (p.y - box.top) / box.height], watch: [POSE], grid: 1 }, b);
      const reached = !!(r.drag && r.drag.changed.some((c) => c.startsWith('--watch')));
      row.pressed++; if (reached) row.reached++;
      row.presses.push({ at: [Math.round(p.x), Math.round(p.y)], landedOn: r.drag && r.drag.landedOn, reached });
      await sleep(120);
    }
    const bad = control ? !row.pressed || row.reached !== row.pressed : row.reached > 0; if (bad) ok = false;
    out.scenes.push(row);
    const others = Object.entries(row.grid.other).map(([k, v]) => `${k} ×${v}`).join(', ');
    console.log(`${bad ? 'FAIL' : 'OK  '}  ${name}  (${selector})  field ${field ? 'up' : 'DOWN'}  box ${row.box.join(',')}\n`
      + `      grid ${GRID}×${GRID}: ${row.grid.inside} inside · ${row.grid.stage} on the stage${others ? ' · ' + others : ''}`
      + (row.raster ? `  ·  raster ${STEP} px: ${row.raster.stage} of ${row.raster.points} on the stage` : '')
      + `\n      → ${row.pressed} pressed, ${row.reached} reached the stage`);
  }
} finally { await b.close(); }
const win = out.scenes.filter((s) => !s.through), thru = out.scenes.filter((s) => s.through);
out.total = { pressed: win.reduce((t, s) => t + s.pressed, 0), reached: win.reduce((t, s) => t + s.reached, 0),
  through: { pressed: thru.reduce((t, s) => t + s.pressed, 0), reached: thru.reduce((t, s) => t + s.reached, 0) } };
out.ok = ok;
console.log(`hit-probe set: ${out.total.pressed} presses through a kit window's gap, ${out.total.reached} reached the stage; ${out.total.through.pressed} presses on the stage and through the widgets layer, ${out.total.through.reached} reached it — ${ok ? 'OK' : 'NOT OK'}`);
if (JSON_OUT) { fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true }); fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1)); }
process.exit(ok ? 0 : 1);
