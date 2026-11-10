/* d041-shots.mjs — iteration 041 chain D's pictures and probes (a diagnostic, not a gate).
 *   node tools/d041-shots.mjs <scene> [width] [height] [light|dark|-] [sys-dark|sys-light]     (LW_PORT / GD_PORT default to chain D's 9755 / 5755)
 * Every run is a CLEAN PROFILE (a new Firefox, no stored settings): the lab as a new user meets it.  `sys-dark` / `sys-light` sets the
 * system's colour scheme the browser reports.  Runs the scene's body in the page, prints what it returned and writes the driver's composite
 * to .tmp/D-shots/041-<scene>[-<theme>][-<width>].png (a scene named `probe-…` writes no picture). */
import { writeFileSync, mkdirSync } from 'node:fs';
process.env.LW_PORT = process.env.LW_PORT || '9755'; process.env.GD_PORT = process.env.GD_PORT || '5755';
const { open } = await import('./gate/gatekit.mjs');

const w8 = `const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const px = (n, p) => n ? getComputedStyle(n)[p] : null; const DWIN = ${JSON.stringify(process.env.D_WIN || '')};`;   // D_WIN: the window ids a walk opens
const SCENES = {
  /* D0a: SPACING at home, 0, 3 and 24 — the racks' gap and inset, a window's padding, the bar's; the skin's name at home and under an old record */
  'probe-spacing': `const read = () => ({ v: __LW.look.get('spacing'), skin: __LW.look.preset(), rackR: [px(document.getElementById('rack'), 'gap'), px(document.getElementById('rack'), 'paddingTop')], rackL: [px(document.getElementById('rackL'), 'gap'), px(document.getElementById('rackL'), 'paddingTop')],
      pane: px(document.querySelector('#rack .dev .dev-body'), 'padding'), bar: px(document.getElementById('transport'), 'padding'), k: document.documentElement.style.getPropertyValue('--pad-k') });
    const out = [read()]; for (const v of [0, 3, 24, 'default', 10]) { __LW.look.set({ spacing: v }); await wait(150); out.push(read()); } return out;`,
  /* D0c · THE FACES WALK (the kit's tools/faces-walk.mjs body, run in this rig's Firefox: the kit's tool wants a Chromium and a third port): under
     FACES · GLASS (REFRACTIVE, FROST ALWAYS) every visible pressable face in the lab whose own background still paints a fill, by owner and class */
  'probe-faces': `const ids = (DWIN || 'spectrum,chem,informational,settings,stage,palette,observer,camera,light,clip').split(',');
    for (const id of ids) { try { __LW.layout.reopen(id); } catch (_) {} } await wait(500);
    for (const d of document.querySelectorAll('#rack .dev.folded, #rackL .dev.folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } await wait(400);
    for (const f of document.querySelectorAll('.dev .lw-fold[aria-expanded="false"]')) f.click(); await wait(500);
    __LW.look.set({ faces: 'glass', card: 'refractive', frost: 'always' }); await wait(600);
    const PRESS = 'button, select, input, textarea, [role="button"], [role="slider"], [role="switch"], [role="tab"], [role="option"], [role="menuitem"], .k-dial, .trig, .seg, .seg-b, .sw, .fd, .ro, .badge, .mir-chip, [class*="-btn"], [class*="-chip"], [class*="-cell"], [class*="-tab"], [class*="-field"], [class*="-well"], [class*="-seat"], [class*="-tool"], [class*="-pill"], [class*="-tile"], [class*="-step"], [class*="-key"]';
    const clear = (c) => c === 'transparent' || /rgba\\([^)]*,\\s*0\\)$/.test(c);
    const alpha = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return 1; const q = m[1].split(/[,\\/]/).map((x) => parseFloat(x)); return q.length > 3 ? q[3] : 1; };
    const out = {};
    for (const n of document.querySelectorAll(PRESS)) {
      if (!(n.checkVisibility ? n.checkVisibility() : n.getClientRects().length)) continue;
      if (n.matches('.on, [aria-pressed="true"], [aria-selected="true"], [aria-checked="true"], [aria-expanded="true"], :disabled, .dev-power, [data-kind="swatch"], .swatch, input[type="color"]') || n.closest('.on.seg-b, [hidden]')) continue;
      const cs = getComputedStyle(n), bc = cs.backgroundColor, bi = cs.backgroundImage;
      if (!((!clear(bc) && alpha(bc) > 0.03) || (bi && bi !== 'none'))) continue;
      const o = n.closest('.dev, #transport, .mir-win, .mir-rail, .mb-list, #menubar, .csb-float');
      const key = (o ? (o.dataset.id || o.id || o.className.toString().split(' ')[0]) : 'page') + ' › ' + n.tagName.toLowerCase() + '.' + [...n.classList].slice(0, 3).join('.');
      const r = out[key] || (out[key] = { n: 0, bg: bc, img: bi === 'none' ? '' : bi.slice(0, 40) }); r.n++;
    }
    return Object.entries(out).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => v.n + ' ' + k + ' ' + v.bg + (v.img ? ' img ' + v.img : ''));`,
  'probe-body': `__LW.look.set({ faces: 'glass', card: 'refractive', frost: 'always' }); await wait(600); const b = document.body; return { ds: { ...b.dataset }, cls: b.className, look: __LW.look.get(), html: { ...document.documentElement.dataset } };`,
  'probe-folds': `return [...document.querySelectorAll('.dev .lw-fold')].map((b) => b.closest('.dev').dataset.id + ' · ' + (b.dataset.fold || b.className) + ' · ' + b.getAttribute('aria-expanded')).concat([...document.querySelectorAll('.dev')].filter((d) => !d.classList.contains('closed')).map((d) => d.dataset.id + (d.classList.contains('folded') ? ' folded' : ' OPEN') + ' in ' + (d.parentElement.id)));`,
  /* D1–D4 · THE FIRST RUN, read: the theme and its choice, INFORMATIONAL's record, the look's rows, the rack's windows and the open inner folds */
  'probe-first': `const I = JSON.parse(localStorage.getItem('lambdawaves.q0.info') || '{}'), L = __LW.look;
    return { theme: [__LW.themeChoice, document.body.dataset.theme], info: Object.fromEntries(['molFormulaSize', 'molName', 'listCap', 'atomLabelsSize', 'skeleton', 'skeletonSize', 'skeletonOpacity', 'sayPreset', 'sayHead', 'sayRegistry', 'sayView', 'sayBasis', 'sayRate', 'sayStyle'].map((k) => [k, I[k]])),
      look: Object.fromEntries(['saturation', 'corners', 'veil', 'reliefLink', 'grip', 'spacing'].map((k) => [k, L.get(k)])), skin: L.preset(), iconGrip: document.body.classList.contains('icon-grip'),
      css: { r: getComputedStyle(document.querySelector('#rack .dev')).borderRadius, sat: getComputedStyle(document.querySelector('#rack .dev')).backdropFilter },
      wins: [...document.querySelectorAll('.dev')].filter((d) => !d.classList.contains('closed') && d.parentElement.id.startsWith('rack')).map((d) => d.dataset.id + (d.classList.contains('folded') ? '' : ' OPEN') + (getComputedStyle(d).display === 'none' ? ' (hidden by the mode)' : '')),
      folds: [...document.querySelectorAll('.dev .lw-fold[aria-expanded="true"]')].map((b) => b.closest('.dev').dataset.id + ' · ' + b.dataset.fold), mode: __LW.mode && __LW.mode.id, cam: __LW.camera.lock };`,
  /* the first run as a new user meets it (no act): the theme the system gave, SPECTRUM open, the icons in the handles' seats */
  'first': `await wait(600); return [__LW.themeChoice, document.body.dataset.theme];`,
  /* the first run in MOLECULES: the mode switched, water picked — MOLECULES open with its presets and A ↔ B, the formula at 200 % with its NAME */
  'first-mol': `__LW.actions.run('mode'); await wait(2500); return { mode: document.body.className.match(/mode-\\w+/g), words: __LW.stageText && __LW.stageText.text };`,
  'd0-spacing': `__LW.look.set({ spacing: 24 }); await wait(400); return __LW.look.get('spacing');`,
};
const [scene = 'probe-spacing', W = '1300', H = '850', light = '-', sys = ''] = process.argv.slice(2);
if (!SCENES[scene]) { console.error('scenes: ' + Object.keys(SCENES).join(' · ')); process.exit(2); }
const prefs = { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 };
if (sys) { prefs['ui.systemUsesDarkTheme'] = sys === 'sys-dark' ? 1 : 0; prefs['layout.css.prefers-color-scheme.content-override'] = sys === 'sys-dark' ? 0 : 1; }
const g = await open(`https://127.0.0.1:${process.env.LW_PORT}/lab/?preset=1s%2B2pz&warn=0&menu=0&sw=0`, { width: +W, height: +H, prefs });
try {
  await g.armErrors();
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify(await g.errors()).slice(0, 900));
  if (light !== '-') await g.ev(`__LW.look.set({ theme: ${JSON.stringify(light)} }); await new Promise((r) => setTimeout(r, 500)); return 1;`);
  for (const step of [].concat(SCENES[scene])) {   // a step is a body run in the page, `press:<key>` (the driver's own key) or `tap:<selector>`
    if (step.startsWith('press:')) await g.press(step.slice(6)); else if (step.startsWith('tap:')) console.log(JSON.stringify(await g.tap(step.slice(4)))); else console.log(JSON.stringify(await g.ev(w8 + step)));
  }
  await new Promise((r) => setTimeout(r, 700));
  if (!scene.startsWith('probe-')) {
    mkdirSync('.tmp/D-shots', { recursive: true });
    writeFileSync(`.tmp/D-shots/041-${scene}${light !== '-' ? '-' + light : ''}${sys ? '-' + sys : ''}${W === '1300' ? '' : '-' + W}.png`, Buffer.from(await g.snap(), 'base64'));
  }
  const e = await g.errors(); if (e.errs && e.errs.length) console.log('PAGE ERRORS', JSON.stringify(e.errs).slice(0, 600));
} finally { await g.close(); }
