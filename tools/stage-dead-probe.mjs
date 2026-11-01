/* stage-dead-probe.mjs — 0.5.3 M4 · THE LIVE STAGE: "Sometimes the screen is unclickable and can't move the scene" (Josh, ASK.md; §11: "linux
 * and just clicking around, but MIR racks are fine").  The sibling of tools/hit-probe-set.mjs (that one: 0 presses through a window's GAP
 * reach the stage; this one: every press on what LOOKS like bare stage does).
 *   python3 tools/gate/server.py "$PWD" 8943 &          (stop it by pid afterwards)
 *   LW_PORT=8943 node tools/stage-dead-probe.mjs [--step 24] [--json out.json] [--shots dir/prefix-] [--only 1,8]
 * A headless Chromium on the real GPU (hit-probe-set's launch).  Each SCENE is a FIRST RUN (the origin's storage cleared on about:blank, then
 * the lab opened, the photosensitivity notice dismissed, paused, AUTO-ROTATE and fling off), then its setup through __LW.  A grid of --step
 * CSS px over #stage; at every point:
 *   1  the browser's own hit test (`elementFromPoint`) — what a real press would land on;
 *   2  the STAGE'S OWN VERDICT — the canvas' own `pointerdown` listener (stage-gestures.js `pointerDown`, read once through the DevTools
 *      `getEventListeners`) is handed a mouse press (pointerId 1, button 0, no modifier: Josh's mouse) and the canvas is read for `.drag` /
 *      `.kdrag`; the press is then ended through the canvas' own `pointercancel` listener.  Calling the listener, not dispatching an event,
 *      keeps every window-level capture listener out of it (a dialog's outside press, a list's close) so the scene is not changed by its
 *      own measurement; it answers exactly `guard.hit(e)` plus a held `special` / `points` (causes A and B of CAMERA-STAGE.md §1).
 * Each point is then ONE of:
 *   stage   the canvas is hit and the stage takes the press — alive;
 *   ui      a visible thing is hit (effective opacity > 0), or anything inside a shown rack column, window or pane (a colour input laid
 *           clear over its swatch is that window's business) — a press on the interface;
 *   gap     the canvas is hit, the stage refuses, and the point is inside a VISIBLE window's own box, a work bar or a rack column (C9's law:
 *           the gaps between a window's parts and its round corners are UI space — by design, tools/hit-probe-set.mjs' count);
 *   modal   a modal dialog is up and the point is outside it (cause C: its window-capture press swallows every press — by design);
 *   box     a hit element that paints nothing (no fill, border, shadow or text): the 88 px `.corner-axis-hit`, the 16 px `#rackPeek*` strips
 *           (cause E) — reported, and DEAD under `ui-hidden`;
 *   DEAD    the point looks like bare stage and the press does nothing: `ghost-extra #id` (an app pane in the `extra` list that is invisible or
 *           pointer-transparent), `ghost-float` (a float-layer window faded or hidden but laid out), `union` (the modulation window's box joined
 *           with its bars: kit-side), `invisible <el>` (an opacity-0 element outside every window takes the press), `held` (nothing in UI space explains it: the
 *           stage's own pointer state refuses every press — cause B).
 * Scene 8 takes TWO readings: after a real drag (the browser's input pipeline, Input.dispatchMouseEvent), and after a press whose pointerup
 * is LOST (the canvas' pointerdown listener handed pointerId 1 with no up: what a release the browser never delivers leaves behind — a
 * Linux context menu or a window-manager grab mid-drag; the loss itself cannot be made in a headless browser).
 * Exit 0 only when every scene's setup took and no scene has a DEAD point.  --shots writes each scene's picture with the points drawn
 * over it (red DEAD, amber box, grey gap, violet modal). */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { launch, sleep } from './perf/cdp.mjs';

const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
if (!process.env.CHROMIUM && fs.existsSync(PW)) process.env.CHROMIUM = PW;
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const STEP = Number(opt('--step', 24)), JSON_OUT = opt('--json', null), SHOTS = opt('--shots', null);
const ONLY = opt('--only', null) ? new Set(opt('--only', '').split(',').map(Number)) : null;
const PORT = process.env.LW_PORT || 8943, ORIGIN = `https://127.0.0.1:${PORT}`, URL_ = `${ORIGIN}/lab/?sw=0&warn=0&starter=home`;
const W = 1600, H = 1000;

const SHUT = '__LW.layout.modulation.collapse();';
/* [name, setup (page JS, awaited), the setup's own check (page JS → true when the scene is there)] */
const SCENES = [
  ['first run', '', 'true'],
  ['SETTINGS open (raised, AXES set to CORNER)', SHUT + " __LW.layout.reopen('settings'); __LW.layout.raise('settings'); __LW.mat.axis = true; __LW.mat.axisMode = 'corner';",
    "!document.querySelector('.dev[data-id=\"settings\"]').classList.contains('closed') && !document.querySelector('.corner-axis-hit').hidden"],
  ['the modulation window open with its bars', "__LW.layout.modulation.expand(); for (let i = 0; i < 3; i++) __LW.mod.addSource('lfo');",
    "document.querySelectorAll('[data-mir-window=\"modulation\"] .m2workbar').length > 0 && document.querySelector('[data-mir-window=\"modulation\"]').getBoundingClientRect().width > 0"],
  ['MOLECULES on', SHUT + ' __LW.chem.setOn(true); for (let k = 0; k < 60 && !__LW.chem.solution; k++) await new Promise((r) => setTimeout(r, 250));', '!!__LW.chem.on'],
  ['the keyboard editor open', SHUT + ' __LW.keymap.open();', "document.querySelector('[data-mir-window=\"keyboard\"]').getBoundingClientRect().width > 0"],
  ['a dialog (the kit\'s confirmDialog)', SHUT + " import('/lab/mir/shell/dialog.js').then((m) => { m.confirmDialog('stage-dead-probe: a dialog is up'); });",
    "!!document.querySelector('.mir-dialog')"],
  ['ui-hidden (H), AXES at CORNER first', SHUT + " __LW.mat.axis = true; __LW.mat.axisMode = 'corner'; await __LW.settle(); __LW.keys.toggleUI();", "document.body.classList.contains('ui-hidden')"],
  ['after a drag', SHUT, 'true'],
  ['the transport docked', SHUT + ' __LW.layout.dockTransport();', '__LW.layout.docked'],
  ['the rack folded by its key (B) while the ☆ list is open', SHUT + " document.getElementById('rackFav').click(); __LW.layout.toggleRack();",
    "document.body.classList.contains('rack-hidden') && !document.getElementById('rackFavList').hidden"],
];

/* the page side.  Installed once a scene (after the setup): window.__dp = { down, cancel } from the canvas' own listeners. */
const GRAB = `(() => { const cv = document.getElementById('field'), L = getEventListeners(cv);
  const down = (L.pointerdown || []).map((l) => l.listener).find((f) => f.name === 'pointerDown');
  const cancel = (L.pointercancel || []).map((l) => l.listener)[0];
  window.__dp = { down, cancel }; return !!(down && cancel); })()`;
const PROBE = (step) => `(() => {
  const cv = document.getElementById('field'), stage = document.getElementById('stage').getBoundingClientRect(), V = window;
  const cs = (n) => V.getComputedStyle(n);
  const opacity = (n) => { let o = 1; for (let e = n; e && e.nodeType === 1; e = e.parentElement) o *= +cs(e).opacity; return o; };
  const tag = (n) => !n ? 'nothing' : n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.getAttribute('class') ? '.' + String(n.getAttribute('class')).trim().split(/\\s+/)[0] : '');
  const inside = (r, x, y) => !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const laid = (n) => n && !n.hidden && n.getClientRects().length && (() => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; })();
  const paints = (n) => { const s = cs(n); if (n instanceof SVGElement || /^(canvas|img|video|input|select|textarea)$/i.test(n.tagName)) return true;
    if (!/rgba\\(\\d+, \\d+, \\d+, 0\\)|transparent/.test(s.backgroundColor) || s.backgroundImage !== 'none' || s.boxShadow !== 'none') return true;
    if (['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(s['border' + k + 'Width']) > 0 && !/rgba\\(\\d+, \\d+, \\d+, 0\\)/.test(s['border' + k + 'Color']))) return true;
    if ((s.maskImage && s.maskImage !== 'none') || (s.webkitMaskImage && s.webkitMaskImage !== 'none')) return true;
    if (['::before', '::after'].some((p) => { const q = V.getComputedStyle(n, p); return q.content && q.content !== 'none' && q.content !== 'normal'; })) return true;   // an icon drawn by a pseudo-element
    return !!(n.textContent || '').trim() || n.children.length > 0; };
  const hidden = document.body.classList.contains('ui-hidden');
  const dialog = document.querySelector('.mir-dialog[aria-modal="true"]'), dbox = dialog && dialog.getBoundingClientRect();
  /* what UI space is made of (for naming a refusal only — the verdict is the stage's own) */
  const racks = hidden ? [] : ['rack', 'rackL'].map((id) => document.getElementById(id)).filter((n) => { const r = laid(n); if (!r) return false; const s = cs(n); return s.visibility !== 'hidden' && +s.opacity > 0; }).map((n) => n.getBoundingClientRect());
  const floats = hidden ? [] : [...document.getElementById('floats').children].map((n) => { const r = laid(n); if (!r) return null;
    const bars = [...n.querySelectorAll('.m2workbar')].map(laid).filter(Boolean);
    const u = bars.length ? { left: Math.min(r.left, ...bars.map((b) => b.left)), top: Math.min(r.top, ...bars.map((b) => b.top)), right: Math.max(r.right, ...bars.map((b) => b.right)), bottom: Math.max(r.bottom, ...bars.map((b) => b.bottom)) } : r;
    return { r, bars, u, ghost: opacity(n) === 0 || cs(n).visibility === 'hidden', name: tag(n) }; }).filter(Boolean);
  const extras = hidden ? [] : ['transport', 'notebook', 'sheet', 'rackFavList'].map((id) => { const n = document.getElementById(id); const r = laid(n);
    if (!r || cs(n).visibility === 'hidden' || r.width < 2 || r.height < 2) return null;
    return { id, r, ghost: opacity(n) === 0 || cs(n).pointerEvents === 'none' }; }).filter(Boolean);
  function verdict(x, y) {
    cv.classList.remove('drag', 'kdrag');
    window.__dp.down({ pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y, altKey: false, ctrlKey: false, shiftKey: false, metaKey: false, preventDefault() {} });
    const took = cv.classList.contains('drag') || cv.classList.contains('kdrag');
    if (took) window.__dp.cancel({ pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y, buttons: 0 });   // only the probe's own press: a refused one leaves the stage as it found it
    return took;
  }
  const out = [];
  for (let y = stage.top + ${step} / 2; y < stage.bottom; y += ${step}) for (let x = stage.left + ${step} / 2; x < stage.right; x += ${step}) {
    const h = document.elementFromPoint(x, y); let kind, why = '';
    if (dialog && !inside(dbox, x, y)) kind = 'modal';
    else if (h === cv) {
      if (verdict(x, y)) {
        kind = 'stage';
        const f = floats.find((f) => !f.ghost && inside(f.r, x, y)); if (f) why = 'leak ' + f.name;   // a press through a visible window's gap (hit-probe-set's failure)
      } else {
        const f = floats.find((f) => inside(f.r, x, y) || f.bars.some((b) => inside(b, x, y))), e = extras.find((e) => inside(e.r, x, y)), u = floats.find((f) => inside(f.u, x, y));
        if (f && !f.ghost) { kind = 'gap'; why = f.name; }
        else if (f) { kind = 'DEAD'; why = 'ghost-float ' + f.name; }
        else if (e && e.ghost) { kind = 'DEAD'; why = 'ghost-extra #' + e.id; }
        else if (e) { kind = 'gap'; why = '#' + e.id; }
        else if (u) { kind = 'DEAD'; why = 'union ' + u.name; }
        else if (racks.some((r) => inside(r, x, y))) { kind = 'gap'; why = 'rack'; }
        else { kind = 'DEAD'; why = 'held'; }
      }
    } else if (!h) kind = 'ui';
    /* inside a shown rack column, window or pane, a clear control (a colour input laid over its swatch, a readout shown on hover) is that
       window's own business: the stage is not there */
    else if (racks.some((r) => inside(r, x, y)) || floats.some((f) => !f.ghost && inside(f.u, x, y)) || extras.some((e) => !e.ghost && inside(e.r, x, y))) kind = 'ui';
    else if (opacity(h) === 0) { kind = 'DEAD'; why = 'invisible ' + tag(h); }
    else if (!paints(h)) { kind = hidden ? 'DEAD' : 'box'; why = (hidden ? 'box ' : '') + tag(h); }
    else kind = 'ui';
    out.push([Math.round(x), Math.round(y), kind, why]);
  }
  return out;
})()`;
const DRAW = (pts) => `(() => { const NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg');
  s.id = '__dpLayer'; s.setAttribute('style', 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647');
  const C = { DEAD: '#ff2a2a', box: '#ffb000', gap: 'rgba(160,170,190,.55)', modal: 'rgba(170,110,255,.5)' };
  for (const [x, y, k] of ${JSON.stringify(pts)}) { if (!C[k]) continue; const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', k === 'DEAD' ? 5 : 3); c.setAttribute('fill', C[k]); s.appendChild(c); }
  document.body.appendChild(s); return 1; })()`;

const b = await launch({ width: W, height: H, gpu: true, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan'] });
const evalCLI = async (expression) => { const r = await b.send('Runtime.evaluate', { expression, includeCommandLineAPI: true, returnByValue: true, awaitPromise: true });
  if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
/* a scene that moved the camera leaves a dirty project, and its beforeunload guard (rack.js) would hold the next navigation: accept it */
const go = async (u) => { const nav = b.send('Page.navigate', { url: u }); await sleep(600); await b.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); await nav; await sleep(400); };
const ready = async () => { for (let k = 0; k < 120; k++) { if (await b.eval('!!(window.__LW && __LW.ready)')) return true; await sleep(500); } return false; };
const firstRun = async () => { await go('about:blank'); await b.send('Storage.clearDataForOrigin', { origin: ORIGIN, storageTypes: 'local_storage,session_storage,indexeddb,cache_storage,service_workers' });
  await go(URL_); if (!(await ready())) throw new Error('the lab never became ready: ' + b.logs.slice(0, 3).join(' | '));
  return b.eval(`(async () => { if (__LW.warning && __LW.warning.open) __LW.warning.dismiss(); __LW.pause(); __LW.camera.setAutoRotate(false); __LW.camera.setFling(0); __LW.camera.stop();
    await __LW.settle(); return !!__LW.field.ok; })()`); };
const count = (pts) => pts.reduce((m, p) => { m[p[2]] = (m[p[2]] || 0) + 1; return m; }, {});
const deadOf = (pts) => { const by = {}; for (const [x, y, k, why] of pts) if (k === 'DEAD') (by[why] || (by[why] = [])).push([x, y]); return by; };
const whyOf = (pts, kind) => { const by = {}; for (const [, , k, why] of pts) if (k === kind) by[why] = (by[why] || 0) + 1; return by; }, boxesOf = (pts) => whyOf(pts, 'box');
const bbox = (list) => [Math.min(...list.map((p) => p[0])), Math.min(...list.map((p) => p[1])), Math.max(...list.map((p) => p[0])), Math.max(...list.map((p) => p[1]))];
const out = { url: URL_, step: STEP, when: new Date().toISOString(), viewport: [W, H], scenes: [] };
let ok = true;
async function read(row, label, n) {
  if (!(await evalCLI(GRAB))) throw new Error('the canvas has no pointerDown / pointercancel listener');
  const pts = await b.eval(PROBE(STEP)), c = count(pts), dead = deadOf(pts), boxes = boxesOf(pts), leaks = pts.filter((p) => p[2] === 'stage' && p[3]).length;
  const r = { label, points: pts.length, count: c, dead: Object.fromEntries(Object.entries(dead).map(([k, v]) => [k, { n: v.length, box: bbox(v), at: v }])), boxes, gaps: whyOf(pts, 'gap'), leaks };
  row.readings.push(r); if (c.DEAD) row.pass = false;
  console.log(`      ${label}: ${pts.length} points · stage ${c.stage || 0} · ui ${c.ui || 0} · gap ${c.gap || 0}${c.modal ? ' · modal ' + c.modal : ''}${c.box ? ' · box ' + c.box : ''} · DEAD ${c.DEAD || 0}${leaks ? ' · leaks ' + leaks : ''}`);
  for (const [k, v] of Object.entries(boxes)) console.log(`        box ${k}: ${v} points`);
  for (const [k, v] of Object.entries(dead)) console.log(`        DEAD ${k}: ${v.length} points in [${bbox(v).join(', ')}] — ${v.slice(0, 8).map((p) => p.join(',')).join(' ')}${v.length > 8 ? ' …' : ''}`);
  if (SHOTS) { await b.eval(DRAW(pts)); await b.shot(`${SHOTS}${n}${label === 'reading' ? '' : '-' + label.split(' ').pop()}.png`); await b.eval("document.getElementById('__dpLayer').remove(), 1"); }
}
try {
  await go(URL_); await ready();   // the warm-up: a cold launch's first navigation never brings the field up (tools/perf/main-thread.mjs)
  for (const [i, [name, setup, check]] of SCENES.entries()) {
    const n = i + 1; if (ONLY && !ONLY.has(n)) continue;
    const field = await firstRun();
    await b.eval(`(async () => { ${setup} await __LW.settle(); await new Promise((r) => setTimeout(r, 500)); return 1; })()`);
    const took = await b.eval(`(async () => { try { return !!(${check}); } catch (_) { return false; } })()`);
    const row = { n, name, field, took, pass: took, readings: [] };
    out.scenes.push(row);
    console.log(`${n}. ${name}  — field ${field ? 'up' : 'DOWN'}, setup ${took ? 'took' : 'DID NOT TAKE'}`);
    if (!took) { ok = false; continue; }
    if (name === 'after a drag') {
      const at = await b.eval(`(() => { const cv = document.getElementById('field'); for (let y = 300; y < 800; y += 20) for (let x = 600; x < 1000; x += 20) if (document.elementFromPoint(x, y) === cv) return [x, y]; return null; })()`);
      const y0 = await b.eval('__LW.obs.yaw');
      const mouse = (type, x, y, down) => b.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' && !down ? 'none' : 'left', buttons: down ? 1 : 0, clickCount: type === 'mouseMoved' ? 0 : 1 });
      await mouse('mouseMoved', at[0], at[1], false); await mouse('mousePressed', at[0], at[1], true);
      for (let k = 1; k <= 8; k++) { await mouse('mouseMoved', at[0] + 10 * k, at[1], true); await sleep(16); }
      await mouse('mouseReleased', at[0] + 80, at[1], false); await sleep(300);
      row.drag = { at, moved: (await b.eval('__LW.obs.yaw')) !== y0 };
      console.log(`      a real drag at ${at.join(',')} → the pose ${row.drag.moved ? 'moved' : 'DID NOT MOVE'}`);
      if (!row.drag.moved) { row.pass = false; ok = false; }
      await read(row, 'after the release', n);
      await evalCLI(GRAB);
      await b.eval(`(window.__dp.down({ pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1, clientX: ${at[0]}, clientY: ${at[1]}, preventDefault() {} }), 1)`);
      console.log('      a press whose pointerup is lost (pointerId 1 handed to the stage, no up)');
      await read(row, 'after a lost pointerup', n);
    } else await read(row, 'reading', n);
    if (!row.pass) ok = false;
    console.log(`   ${row.pass ? 'OK' : 'NOT OK'}`);
    await sleep(200);
  }
} finally { await b.close(); }
const passed = out.scenes.filter((s) => s.pass).length;
out.ok = ok; out.passed = passed;
console.log(`stage-dead-probe: ${passed}/${out.scenes.length} scenes with no dead point — ${ok ? 'OK' : 'NOT OK'}`);
if (JSON_OUT) { fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true }); fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1)); }
process.exit(ok ? 0 : 1);
