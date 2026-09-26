/* verify.mjs — S1 verifier (fresh context): tries to break THE SCOPE LAW in the browser.  Needs old030.json from
 * old-export.mjs (a genuine pre-S1 save, settings object and link).  Each scene is its own Firefox session (a fresh profile).
 *   LW_PORT=8733 GD_PORT=5233 node research/release-0.3.1/probes/S1-verify/verify.mjs [scene …]
 * Writes verify.<scene>.json beside this file. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import { go } from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const PORT = process.env.LW_PORT || '8733';
const URL0 = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`;
const OLD = JSON.parse(fs.readFileSync(path.join(here, 'old030.json'), 'utf8'));

/* in-page helpers, prepended to every evaluation */
const H = `const L = __LW, w = (n) => new Promise((r) => setTimeout(r, n)), WS = ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts'];
  const raw = () => JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
  const strip = () => { const o = raw(); for (const k of WS) delete o[k]; return JSON.stringify(o); };
  const kdiff = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b), out = []; for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) out.push(k + ': ' + JSON.stringify(A[k]) + ' -> ' + JSON.stringify(B[k])); return out; };
  const live = () => ({ theme: document.body.dataset.theme, choice: L.themeChoice, card: L.cardStyle, frost: L.frost, disc: L.disconnected,
    bodyClass: [...document.body.classList].filter((c) => !/^(busy|playing|paused|pace|hover|drag)/.test(c)).sort().join(' '),
    accent: [L.accent.a, L.accent.b], rootAccent: ['--acc', '--acc2'].map((v) => getComputedStyle(document.body).getPropertyValue(v).trim()).join('|'),
    feel: [L.camera.friction, L.camera.speed, L.camera.dragGain, L.camera.flingGain],
    chrome: ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'].map((k) => L.mat[k] === undefined ? null : L.mat[k]) });
  const errs = () => (window.__e || []).map(String).slice(0, 8);`;

async function session(fn) {
  const g = await open(URL0, { width: 1600, height: 1000, script: 180000 });
  try {
    const r = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    if (!r || !r.ok) throw new Error('lab never became ready');
    await g.ev('try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;');
    const ev = (body, args) => g.ev(H + body, args);
    const reload = async (u = URL0) => { await go(g.s, u); const q = await g.waitFor('window.__LW && __LW.ready', 3000, 20); if (!q || !q.ok) throw new Error('reload never ready');
      await g.ev('try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;'); };
    return await fn({ ev, reload, g });
  } finally { await g.close(); }
}

const SCENES = {
  /* item 3 (settings side) + item 4 (feel survives): a genuine pre-S1 settings object boots as prism + FREE, keeps the feel and
     every other preference, and the two dead keys go on the next save. */
  async oldSettings() {
    return session(async ({ ev, reload }) => {
      await ev(`localStorage.setItem('lambdawaves.q0.settings', arguments[0]); return 1;`, [OLD.settings]);
      await reload();
      const boot = await ev(`const s = raw(); return { paletteId: L.paletteId, paletteOn: L.palette && L.palette.on, camMode: L.camMode, live: live(),
        storedPalette: s.palette, storedCamMode: s.camMode, errs: errs() };`);
      const save = await ev(`const before = localStorage.getItem('lambdawaves.q0.settings'); const t = L.themeChoice; L.setTheme(t === 'light' ? 'dark' : 'light'); L.setTheme(t); await w(100);
        const after = localStorage.getItem('lambdawaves.q0.settings');
        const B = JSON.parse(before); delete B.palette; delete B.camMode;
        return { hasPalette: 'palette' in JSON.parse(after), hasCamMode: 'camMode' in JSON.parse(after), diffMinusDead: kdiff(JSON.stringify(B), after), errs: errs() };`);
      return { old: (({ palette, camMode, friction, spin, dragGain, fling, theme, card, frost, frame, axis, invert, axisInk }) => ({ palette, camMode, friction, spin, dragGain, fling, theme, card, frost, frame, axis, invert, axisInk }))(JSON.parse(OLD.settings)), boot, save };
    });
  },

  /* items 2 + 8 through the PROJECTS road with the genuine pre-S1 export: preferences untouched, project content round-trips,
     not dirty after open, SAVE → open byte-stable. */
  async oldProject() {
    return session(async ({ ev }) => {
      return ev(`L.saveSettings(); await w(100);
        const before = strip(), fullBefore = localStorage.getItem('lambdawaves.q0.settings'), live0 = live(), mode0 = L.camMode, pal0 = L.paletteId;
        const path = L.projects.importText(arguments[0]);
        const ok = L.projects.open(path);
        const dirty0 = L.projects.dirty; await w(600); const dirty1 = L.projects.dirty; await w(1500); const dirty2 = L.projects.dirty;
        const after = strip(), live1 = live(), q = L.serialize().presentation, M = L.mod.model;
        const PJ = () => JSON.parse(localStorage.getItem('lambdawaves.q0.projects'));
        const res = { ok, path, dirty: [dirty0, dirty1, dirty2], settingsIdentical: before === after, settingsDiff: kdiff(before, after), fullSettingsDiff: kdiff(fullBefore, localStorage.getItem('lambdawaves.q0.settings')),
          live0, live1, liveSame: JSON.stringify(live0) === JSON.stringify(live1), mode0, mode1: L.camMode, pal0, pal1: L.paletteId,
          stage: q.ui.stage.custom.map((v) => Math.round(v * 255)), follow: q.ui.stage.follow, kepler: q.overlays.kepler, vortex: q.overlays.vortex.on, dials: q.overlays.dials,
          ab: !!(q.ab && q.ab.a && q.ab.b), nb: q.notebook, routes: (q.modulation.routes || []).map((r) => [r.min, r.max]), modwin: !!q.modwin, cards: q.layout && q.layout.cards.length,
          ui: Object.keys(q.ui), camera: Object.keys(q.camera), layoutLook: !!(q.layout.look || q.layout.cam) };
        /* SAVE → open → SAVE: byte-stable */
        L.projects.save('verify/resaved'); const d1 = JSON.stringify(PJ().items['verify/resaved'].data);
        L.projects.open('verify/resaved'); await w(600); res.dirtyAfterReopen = L.projects.dirty;
        L.projects.save('verify/resaved2'); const d2 = JSON.stringify(PJ().items['verify/resaved2'].data);
        res.resaveIdentical = d1 === d2; res.resaveBytes = [d1.length, d2.length];
        /* PROJECT keys of the OLD file vs the re-save: strip PREFERENCE (+ layout.look/cam) from the old one, WORKSPACE from both */
        const old = JSON.parse(arguments[0]).data, neu = JSON.parse(d1);
        const PREF = { ui: ['theme', 'card', 'frost', 'disc', 'accent'], camera: ['friction', 'speed', 'dragGain', 'fling'], mat: ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'] };
        for (const [s, ks] of Object.entries(PREF)) for (const k of ks) if (old.presentation[s]) delete old.presentation[s][k];
        for (const o of [old, neu]) { const p = o.presentation; delete p.layout; delete p.modwin; delete p.notebook; }
        const paths = []; const walk = (a, b, p) => { if (JSON.stringify(a) === JSON.stringify(b)) return; if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], p + '.' + k); } else paths.push(p + ': ' + String(JSON.stringify(a)).slice(0, 80) + ' -> ' + String(JSON.stringify(b)).slice(0, 80)); };
        walk(old, neu, 'data'); res.projectKeyDiffOldVsResave = paths.splice(0);
        walk(JSON.parse(d1), JSON.parse(d2), 'data'); res.resaveDiff = paths.splice(0);
        res.errs = errs(); return res;`, [OLD.exportText]);
    });
  },

  /* item 2 exactly as the brief words it: an object built from serialize(), the old keys injected, restore(obj, {project:true}) */
  async inject() {
    return session(async ({ ev }) => {
      return ev(`const M = L.mod.model;
        M.addSource('lfo'); L.layout.modulation.expand(); await w(400); M.addRoute(M.macroList()[0].id, 'material.exposure', 0.5, 4);
        L.layout.reopen('state', 'R'); await w(200);
        L.kepler.setOn(true); L.vortex.setOn(true); L.spectrum.setDials(true); L.layout.notebookResize(520, 380);
        const tr = [...document.querySelectorAll('.dev[data-id=state] .trig')], by = (t) => tr.find((b) => b.textContent.trim() === t);
        by('STORE A').click(); L.loadPreset('2p+'); await w(150); by('STORE B').click();
        const sc = document.querySelector('.stage-colour'); sc.value = '#405060'; sc.dispatchEvent(new Event('input', { bubbles: true }));
        L.saveSettings(); await w(100);
        const S = JSON.parse(JSON.stringify(L.serialize())), P = S.presentation;
        const live0 = live(), before = strip(), fullBefore = localStorage.getItem('lambdawaves.q0.settings');
        P.ui.theme = live0.theme === 'light' ? 'dark' : 'light'; P.ui.card = live0.card === 'tinted' ? 'refractive' : 'tinted'; P.ui.frost = live0.frost === 'off' ? 'always' : 'off';
        P.ui.disc = !live0.disc; P.ui.accent = { a: 11, b: 222, vivid: 0.95 }; P.camera.friction = 0.31; P.mat.frame = false; P.mat.axis = false; P.mat.invert = true;
        /* scramble the live PROJECT keys so a round-trip is visible */
        L.kepler.setOn(false); L.vortex.setOn(false); L.spectrum.setDials(false); L.layout.notebookResize(300, 200); document.querySelector('.stage-follow').click(); L.loadPreset('1s'); M.deserialize(null);
        await w(200); const mid = strip();
        const ok = L.restore(S, { project: true }); await w(800);
        const q = L.serialize().presentation, live1 = live(), after = strip();
        return { ok, live0, live1, liveSame: JSON.stringify(live0) === JSON.stringify(live1), settingsIdentical: before === after, settingsDiff: kdiff(before, after), midDiff: kdiff(before, mid),
          fullSettingsDiff: kdiff(fullBefore, localStorage.getItem('lambdawaves.q0.settings')),
          stage: q.ui.stage.custom.map((v) => Math.round(v * 255)), follow: q.ui.stage.follow, kepler: q.overlays.kepler, vortex: q.overlays.vortex.on, dials: q.overlays.dials,
          ab: !!(q.ab && q.ab.a && q.ab.b), nb: q.notebook, routes: (q.modulation.routes || []).map((r) => [r.min, r.max]), modwin: !!q.modwin, cards: q.layout && q.layout.cards.length, errs: errs() };`);
    });
  },

  /* item 4: feel survives a reload; the mode is PROJECT-only */
  async camera() {
    return session(async ({ ev, reload }) => {
      const a = await ev(`L.camera.setFriction(0.42); L.camera.setSpeed(0.7); L.camera.setDragGain(2.2); L.camera.setFling(1.3); L.saveSettings();
        L.setCamMode('turntable', true); await w(100); return { mode: L.camMode, stored: (({ friction, spin, dragGain, fling, camMode }) => ({ friction, spin, dragGain, fling, camMode }))(raw()) };`);
      await reload();
      const b = await ev(`return { mode: L.camMode, feel: live().feel, seg: [...document.querySelectorAll('.seg button, [role=radio]')].filter((x) => /TURNTABLE|FREE/.test(x.textContent) && (x.getAttribute('aria-pressed') === 'true' || x.getAttribute('aria-checked') === 'true' || x.classList.contains('on'))).map((x) => x.textContent.trim()) };`);
      const c = await ev(`L.setCamMode('turntable', true); L.orbitBy(0.2, 0.1); await w(100); const pose = JSON.stringify(L.serialize().presentation.obs);
        const saved = L.projects.save('verify/tt'); L.setCamMode('free', true); L.orbitBy(-0.5, 0.3); await w(100); const modeMid = L.camMode;
        const opened = L.projects.open('verify/tt'); await w(300); const pose2 = JSON.stringify(L.serialize().presentation.obs);
        return { saved, modeMid, opened, modeAfter: L.camMode, poseSame: pose === pose2, pose, pose2, settingsHasCamMode: 'camMode' in raw(), errs: errs() };`);
      await reload();
      const d = await ev(`return { modeAfterReload: L.camMode, feel: live().feel };`);
      return { a, b, c, d };
    });
  },

  /* item 5: links carry no preference; opening one changes no settings key and not the theme; an OLD link's chrome bits are ignored */
  async links() {
    return session(async ({ ev }) => {
      return ev(`L.mat.frame = false; L.mat.invert = true; L.mat.axisInk = 'cmy'; L.saveSettings(); await w(100);
        const live0 = live(), full0 = localStorage.getItem('lambdawaves.q0.settings');
        const enc = L.link.mint(), got = L.link.read(enc.href), pm = got.state.presentation.mat;
        const newLink = { chars: enc.chars, notCarried: enc.notCarried, mat: { invert: pm.invert, frame: pm.frame, axis: pm.axis, axisInk: pm.axisInk }, presKeys: Object.keys(got.state.presentation), camera: got.state.presentation.camera || null, ui: got.state.presentation.ui || null };
        const oldGot = L.link.read(arguments[0]), om = oldGot.state.presentation.mat;
        const oldBits = { invert: om.invert, frame: om.frame, axis: om.axis, axisInk: om.axisInk, paletteId: oldGot.paletteId, mode: oldGot.state.presentation.obs.mode };
        const r1 = L.link.open(arguments[0]); await w(600);
        const live1 = live(), full1 = localStorage.getItem('lambdawaves.q0.settings');
        const afterOld = { r: { ok: r1.ok, opened: r1.opened }, liveSame: JSON.stringify(live0) === JSON.stringify(live1), live1, settingsIdentical: full0 === full1, diff: kdiff(full0, full1), paletteId: L.paletteId, mode: L.camMode };
        const r2 = L.link.open(enc.href); await w(600);
        const full2 = localStorage.getItem('lambdawaves.q0.settings');
        const afterNew = { ok: r2.ok, liveSame: JSON.stringify(live0) === JSON.stringify(live()), settingsIdentical: full0 === full2, diff: kdiff(full0, full2) };
        /* the hash road too */
        location.hash = arguments[0].split('#')[1]; await w(900);
        const full3 = localStorage.getItem('lambdawaves.q0.settings');
        const afterHash = { liveSame: JSON.stringify(live0) === JSON.stringify(live()), settingsIdentical: full0 === full3, diff: kdiff(full0, full3), paletteId: L.paletteId };
        return { live0, newLink, oldBits, afterOld, afterNew, afterHash, errs: errs() };`, [OLD.link]);
    });
  },

  /* item 3 (palette side): the menu still works, a menu choice does not survive a reload (D2's cost), custom stops ride a project */
  async palette() {
    return session(async ({ ev, reload }) => {
      const a = await ev(`const s = document.querySelector('select[aria-label=palette]'); s.value = 'ember'; s.dispatchEvent(new Event('change', { bubbles: true })); await w(200);
        const viaMenu = L.paletteId, stops0 = JSON.stringify(L.palette.stops);
        const api = L.setPalette('sea'); await w(100);
        return { viaMenu, api, afterApi: L.paletteId, storedPalette: raw().palette === undefined ? null : raw().palette, stopsChanged: stops0 !== JSON.stringify(L.palette.stops), errs: errs() };`);
      await reload();
      const b = await ev(`return { afterReload: L.paletteId };`);
      const c = await ev(`const custom = [{ at: 0, rgb: [0.9, 0.1, 0.1] }, { at: 0.33, rgb: [0.1, 0.9, 0.2] }, { at: 0.66, rgb: [0.2, 0.3, 0.95] }];
        L.setPalette('twilight'); L.palette.load(custom, 1, 'twilight'); L.palette.setOn(true); await w(100);
        const want = JSON.stringify(L.palette.stops), sel = L.palette.selected;
        const saved = L.projects.save('verify/pal');
        return { saved, want, sel, id: L.paletteId, on: L.palette.on };`);
      await reload();
      const d = await ev(`const booted = L.paletteId, bootStops = JSON.stringify(L.palette.stops); const opened = L.projects.open('verify/pal'); await w(400);
        return { booted, opened, id: L.paletteId, on: L.palette.on, stops: JSON.stringify(L.palette.stops), sel: L.palette.selected, storedPalette: 'palette' in raw(), errs: errs() };`);
      return { a, b, c, d, customBack: d.stops === c.want && d.sel === c.sel && d.id === 'twilight' && d.on === true };
    });
  },

  /* item 7: WAVE DANCER opens through its button */
  async demo() {
    return session(async ({ ev }) => {
      return ev(`L.saveSettings(); await w(100);
        const before = strip(), full0 = localStorage.getItem('lambdawaves.q0.settings'), live0 = live();
        document.querySelector('.pj-demo').click();
        for (let i = 0; i < 100 && !(L.projects.current || '').includes('WAVE'); i++) await w(100);
        for (let i = 0; i < 100 && !(L.projects.current); i++) await w(100);
        await w(800);
        const S = L.serialize(), q = S.presentation, after = strip();
        return { current: L.projects.current, status: (document.querySelector('.pj-status') || {}).textContent, paletteId: L.paletteId, paletteOn: L.palette.on,
          live0, live1: live(), liveSame: JSON.stringify(live0) === JSON.stringify(live()), settingsIdentical: before === after, settingsDiff: kdiff(before, after), fullDiff: kdiff(full0, localStorage.getItem('lambdawaves.q0.settings')),
          notebookText: (localStorage.getItem('lambdawaves.q0.notebook') || '').length, notebookTitle: localStorage.getItem('lambdawaves.q0.notebook.title'),
          routes: (q.modulation.routes || []).length, macros: L.mod.model.macroList().length, modes: (S.experiment.modes || []).length, mode: L.camMode, dirty: L.projects.dirty, errs: errs() };`);
    });
  },

  /* item 6: favourite layouts still save and apply */
  async layouts() {
    return session(async ({ ev }) => {
      return ev(`const slot = L.layout.saveLayout(); const rec = raw().layouts[slot];
        L.layout.reopen('state', 'R'); await w(100); const openAfterChange = !document.querySelector('.dev[data-id=state]').classList.contains('closed');
        const back = L.layout.loadLayout(slot); await w(300);
        const stateClosedAfter = document.querySelector('.dev[data-id=state]').classList.contains('closed');
        const wasClosed = !!(rec.cards.find((c) => c.id === 'state') || {}).closed;
        return { slot, keys: Object.keys(rec), hasLook: 'look' in rec, hasCam: 'cam' in rec, openAfterChange, back, wasClosed, stateClosedAfter, restoredState: stateClosedAfter === wasClosed,
          list: L.layout.layouts().map((x) => x.label), errs: errs() };`);
    });
  },
  /* item 8 follow-up: is the bundled demo dirty right after it opens, and what moves?  (run on both trees) */
  async demoDirty() {
    return session(async ({ ev }) => {
      return ev(`const key = () => { const S = JSON.parse(JSON.stringify(L.serialize())), p = S.presentation; for (const k of ['layout', 'modwin', 'camera', 'ui', 'notebook']) delete p[k]; delete p.quality.autoScale; if (p.domain.auto) delete p.domain.half; return S; };
        document.querySelector('.pj-demo').click();
        let i = 0; for (; i < 200 && !L.projects.current; i++) await w(25);
        const d = [[i * 25, L.projects.dirty]]; const k0 = key();
        for (const t of [100, 400, 1000, 2500]) { await w(t); d.push([t, L.projects.dirty]); }
        const k1 = key(), paths = [];
        const walk = (a, b, p) => { if (JSON.stringify(a) === JSON.stringify(b)) return; if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], p + '.' + k); } else paths.push(p + ': ' + String(JSON.stringify(a)).slice(0, 60) + ' -> ' + String(JSON.stringify(b)).slice(0, 60)); };
        walk(k0, k1, 'S');
        return { dirty: d, playing: L.clock && L.clock.playing, moved: paths.slice(0, 20), errs: errs() };`);
    });
  },
  async demoDirty2() {
    return session(async ({ ev }) => {
      return ev(`document.querySelector('.pj-demo').click();
        let i = 0; for (; i < 200 && !L.projects.current; i++) await w(25);
        const d0 = L.projects.dirty; L.projects.markClean(); const d1 = L.projects.dirty; await w(500); const d2 = L.projects.dirty;
        const P = JSON.parse(localStorage.getItem('lambdawaves.q0.projects')), it = P.items[L.projects.current];
        L.projects.open(L.projects.current); const d3 = L.projects.dirty; await w(300); const d4 = L.projects.dirty;
        return { d0, afterMarkClean: d1, later: d2, reopen: [d3, d4], title: document.querySelector('.nb-title, .nb input') && document.querySelector('.nb-title, .nb input').value, itemTitle: it.notebook.title, name: it.name, errs: errs() };`);
    });
  },
  async demoDirty3() {
    return session(async ({ ev }) => {
      return ev(`document.querySelector('.pj-demo').click();
        let i = 0; for (; i < 200 && !L.projects.current; i++) await w(25); await w(500);
        L.projects.open(L.projects.current); const d3 = L.projects.dirty; const k0 = JSON.parse(JSON.stringify(L.serialize())); const nb0 = [localStorage.getItem('lambdawaves.q0.notebook'), localStorage.getItem('lambdawaves.q0.notebook.title')];
        await w(400); const d4 = L.projects.dirty; const k1 = JSON.parse(JSON.stringify(L.serialize())); const nb1 = [localStorage.getItem('lambdawaves.q0.notebook'), localStorage.getItem('lambdawaves.q0.notebook.title')];
        const paths = []; const walk = (a, b, p) => { if (JSON.stringify(a) === JSON.stringify(b)) return; if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], p + '.' + k); } else paths.push(p + ': ' + String(JSON.stringify(a)).slice(0, 90) + ' -> ' + String(JSON.stringify(b)).slice(0, 90)); };
        walk(k0, k1, 'S');
        return { d3, d4, moved: paths.slice(0, 30), nbSame: JSON.stringify(nb0) === JSON.stringify(nb1), errs: errs() };`);
    });
  },
  /* item 11: the two recorded edges are real (demonstrated, not fixed) */
  async edges() {
    return session(async ({ ev }) => {
      return ev(`const H = L.history;
        L.saveSettings(); await w(100); H.clear(); H.flush();
        const f0 = [L.mat.frame, L.mat.axis];
        L.mat.frame = false; L.mat.axis = false; H.note('chrome'); H.flush(); const rows = H.depth;
        const undone = H.undo(); await w(100); const f1 = [L.mat.frame, L.mat.axis];
        const storedBefore = [raw().frame, raw().axis]; L.saveSettings(); const storedAfter = [raw().frame, raw().axis];
        /* phoneTr through a project's layout */
        const tr0 = raw().phoneTr, S = JSON.parse(JSON.stringify(L.serialize())); const c = S.presentation.layout.cards.find((x) => x.id === 'transport'); c.folded = true; c.closed = false;
        L.restore(S, { project: true }); await w(400); const tr1 = raw().phoneTr;
        return { undo: { f0, rows, undone, f1, storedBefore, storedAfter }, phoneTr: [tr0, tr1], errs: errs() };`);
    });
  },
  /* item 1: with every chrome key set live (non-default), serialize(), a project save and a link carry none of them */
  async chromeLive() {
    return session(async ({ ev }) => {
      return ev(`Object.assign(L.mat, { frame: false, axis: false, frameMode: 'dots', axisMode: 'corner', cornerSide: 'left', invert: true, axisInk: 'rgb' });
        L.setTheme(L.themeChoice === 'light' ? 'dark' : 'light'); L.camera.setFriction(0.2); L.saveSettings();
        const CH = ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'];
        const q = L.serialize().presentation; L.projects.save('verify/chrome'); const d = JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items['verify/chrome'].data.presentation;
        const txt = JSON.stringify(d);
        return { serializeMat: CH.filter((k) => k in q.mat), savedMat: CH.filter((k) => k in d.mat), ui: Object.keys(d.ui), camera: Object.keys(d.camera), layoutKeys: Object.keys(d.layout),
          anyTheme: /"theme"|"frost"|"card"|"friction"|"dragGain"|"accA"/.test(txt), obsMode: d.obs.mode, errs: errs() };`);
    });
  },
};

const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
for (const name of want) {
  let out;
  try { out = await SCENES[name](); } catch (e) { out = { error: String(e && e.stack || e) }; }
  console.log('=== ' + name + '\n' + JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(here, `verify.${name}.json`), JSON.stringify(out, null, 1));
}
