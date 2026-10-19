/* tools/settings-probe.mjs — THE SETTINGS PROBE (0.5.0 A1, PLAN §2 A1's closer; C2 widens it).  One fresh Firefox profile, three
 * scenes in order: the boot, the bundled demo through its DEMOS press (WAVE DANCER PROTOTYPE; iteration 009 deleted WATER, BENZENE
 * and N₂ with the other seven) and NEW.
 *   1 · THE WHOLE-localStorage DIFF around each open: a snapshot after a saveSettings, the open, a snapshot (what the open wrote),
 *       a saveSettings and a third snapshot (what the live state now says).  Every changed key is classified by
 *       lab/settings-store.js — the blob's own keys by WORKSPACE (else PREFERENCE), the rest by FAMILIES — and a change outside
 *       WORKSPACE and PROJECT is RED.
 *   2 · THE BLOB ROUND TRIP: saveSettings → B1; reload → B2 (what the boot left) → saveSettings → B3.  B1 and B3 must be the
 *       same bytes (less the modwin.modes rows of sources the reloaded, shipped rack lacks — named); B2 is reported.
 *   3 · THE LOOK IS THE KIT'S (0.5.0 C2): `mir.gui` is PREFERENCE (FAMILIES), and a B3 that still holds a look key (lab/look.js
 *       BLOB_LOOK: the keys the lift moves out of the blob) is RED.
 *   python3 tools/gate/server.py <root> <LW_PORT>   (stop it by pid)
 *   LW_PORT=… GD_PORT=… node tools/settings-probe.mjs [--out .tmp/settings-probe.json]
 * --out keeps every blob and every diff, so a tree served from `git archive` can be compared with this one by `diff`. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';
import { go } from './gate/drv.mjs';
import { SETTINGS_KEY, WORKSPACE, FAMILIES } from '../lab/settings-store.js';
import { BLOB_LOOK } from '../lab/look.js';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;
const SCENES = [['boot'], ['WAVE DANCER PROTOTYPE', 'wave-dancer'], ['NEW']];   // iteration 009: the one demo
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
  const md = navigator.mediaDevices; if (md) md.getUserMedia = () => Promise.reject(new Error('probe: no microphone'));
  window.__snap = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; };
  window.__quiet = async () => { await __LW.settle(); let st = __LW.chem.state();
    for (let i = 0; i < 600 && st.on && !(st.fieldOwner && st.nocc); i++) { await __w(100); st = __LW.chem.state(); }
    await __LW.settle(); await __w(400); return 1; };
  return 1;`;
const scopeOf = (k) => { const f = FAMILIES[k] || Object.entries(FAMILIES).find(([p]) => k.startsWith(p + '.'))?.[1]; return f ? f[1] : 'UNKNOWN'; };
/** what moved from snapshot a to b: [{ key, sub?, scope }]; the blob is read key by key */
function diff(a, b) {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[k] === b[k]) continue;
    if (k !== SETTINGS_KEY) { out.push({ key: k, scope: scopeOf(k) }); continue; }
    const A = JSON.parse(a[k] || '{}'), B = JSON.parse(b[k] || '{}');
    for (const s of new Set([...Object.keys(A), ...Object.keys(B)])) if (JSON.stringify(A[s]) !== JSON.stringify(B[s]))
      out.push({ key: k, sub: s, scope: WORKSPACE.includes(s) ? 'WORKSPACE' : 'PREFERENCE', from: A[s], to: B[s] });
    if (a[k] !== b[k] && !out.some((d) => d.key === k)) out.push({ key: k, sub: '(key order)', scope: 'PREFERENCE' });
  }
  return out;
}
const bad = (d) => d.filter((x) => x.scope !== 'WORKSPACE' && x.scope !== 'PROJECT');
/* 0.5.0 C4 · a reload boots the SHIPPED rack (there is no reopen-last-project), and the window keeps `modwin.modes` rows only for
   sources that exist (window.js, and modwindow.js before it): a demo's own device (WAVE DANCER's s3) cannot survive the reload,
   and its file brings the row back.  Those rows are compared only for the sources live after the reload, and named. */
const unseat = (blob, ids) => { const o = JSON.parse(blob || '{}'), m = o.modwin && o.modwin.modes; const gone = m ? Object.keys(m).filter((k) => !ids.includes(k)) : [];
  for (const k of gone) delete m[k]; return { json: JSON.stringify(o), gone }; };
const g = await open(LAB, { width: 1500, height: 1000, script: 180000 });
const dump = { lab: LAB, scenes: [] };
let red = 0;
try {
  if ((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok !== 1) throw new Error('the lab never became ready');
  await g.ev(HELP); await g.ev('return __quiet();');
  for (const [name, file] of SCENES) {
    const r = { name };
    if (name !== 'boot') {
      const opened = await g.ev(`__LW.layout.notebook.open('projects'); await __w(200); __LW.saveSettings(); await __w(50); const s0 = __snap();
        if (${JSON.stringify(!!file)}) { __LW.projects.demo(${JSON.stringify(file || '')});   /* 0.5.0 C6: the DEMOS press; FOLDERS is open (the alias) */
          for (let i = 0; i < 100 && !/opened demo/.test(__LW.projects.status); i++) await __w(100); }
        else await __LW.layout.projects.requestFresh();
        await __quiet(); const s1 = __snap(); __LW.saveSettings(); await __w(50);
        return { s0, s1, s2: __snap(), status: __LW.projects.status, errs: __e.slice() };`);
      if (!opened || opened.E) throw new Error(name + ': the open threw in the page — ' + (opened && opened.E));
      r.status = opened.status; r.errs = opened.errs;
      r.wrote = diff(opened.s0, opened.s1); r.live = diff(opened.s0, opened.s2);
      r.outside = [...bad(r.wrote), ...bad(r.live)];
    }
    r.B1 = await g.ev(`__LW.saveSettings(); await __w(50); return localStorage.getItem(${JSON.stringify(SETTINGS_KEY)});`);
    await go(g.s, LAB);
    if ((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok !== 1) throw new Error(name + ': the reload never became ready');
    await g.armErrors(); await g.ev(HELP); await g.ev('return __quiet();');
    r.B2 = await g.ev(`return localStorage.getItem(${JSON.stringify(SETTINGS_KEY)});`);
    r.B3 = await g.ev(`__LW.saveSettings(); await __w(50); return localStorage.getItem(${JSON.stringify(SETTINGS_KEY)});`);
    const ids = await g.ev('return __LW.mod.model.sourceList().map((s) => s.id);'), u1 = unseat(r.B1, ids);
    r.unseated = u1.gone; r.roundTrip = r.B1 === r.B3 || u1.json === unseat(r.B3, ids).json; r.bootLeft = r.B2 === r.B1;
    r.reloadErrs = (await g.ev('return __e.slice();'));
    r.lookLeft = BLOB_LOOK.filter((k) => k in JSON.parse(r.B3 || '{}'));
    const ok = r.roundTrip && !r.lookLeft.length && !(r.outside || []).length && !(r.errs || []).length && !r.reloadErrs.length && (name === 'boot' || /^(opened demo|new)/.test(r.status));
    if (!ok) red++;
    console.log((ok ? 'GREEN ' : 'RED   ') + name.padEnd(12) + ' blob ' + r.B1.length + ' B, reload ' + (r.roundTrip ? (r.B1 === r.B3 ? 'byte-identical' : 'byte-identical but modwin.modes ' + r.unseated.join(', ') + ' (no such source after the reload)') : 'DIFFERS: ' + JSON.stringify(diff({ [SETTINGS_KEY]: r.B1 }, { [SETTINGS_KEY]: r.B3 })))
      + (r.bootLeft ? '' : ' (the boot left ' + (r.B2 ? r.B2.length + ' B' : 'no blob') + ' before its save)')
      + (r.wrote ? ' · the open wrote ' + (r.wrote.map((d) => d.sub ? 'settings.' + d.sub : d.key).join(', ') || 'nothing') + ' · after a save ' + (r.live.map((d) => d.sub ? 'settings.' + d.sub : d.key).join(', ') || 'nothing') : '')
      + (r.lookLeft.length ? ' · LOOK KEYS STILL IN THE BLOB: ' + r.lookLeft.join(', ') : '')
      + (r.outside && r.outside.length ? ' · OUTSIDE WORKSPACE/PROJECT: ' + JSON.stringify(r.outside) : '') + (r.status ? ' · "' + r.status + '"' : ''));
    dump.scenes.push(r);
  }
} catch (e) { red++; console.error(e); }
finally { await g.close(); }
if (OUT) writeFileSync(OUT, JSON.stringify(dump, null, 1));
console.log((red ? 'RED' : 'GREEN') + ' settings-probe — ' + red + ' of ' + SCENES.length + ' scenes red');
process.exit(red ? 1 : 0);
