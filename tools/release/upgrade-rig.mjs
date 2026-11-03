#!/usr/bin/env node
/* tools/release/upgrade-rig.mjs — THE UPGRADE RIG (033 THE UPDATER, Claude Sos, 2026-11-02).  The real update path, end to end, on the
 * real worker: an OLD build is served and used (installed, a volume kept, a molecule opened, the session flushed), then the NEW build is
 * served at the SAME origin to the SAME Firefox profile, and the rig watches what a returning visitor meets — the old build from its cache,
 * the new worker installing, the offer, the take, the reload, the new build in control, the old cache gone, the volume still there, the
 * session resumed, the volume's molecule opening again.  tests/pwa.test.mjs drives the worker's handlers in node and tests/offer.browser-test.mjs
 * drives LW.sw with no worker; nothing before this ran the two builds against one profile, which is where every update bug lives.
 *
 *   node tools/release/upgrade-rig.mjs --old <tree> --new <tree> [--port 8799] [--gd 5799] [--volume vol-3] [--profile DIR] [--keep] [--shots DIR]
 *
 * The trees need `lab/volumes` (the dev link to ~/Documents/LAMBDAWAVES-VOLUMES/dist) for the volume; without --volume the rig skips it.
 * Exit 0 when every check passes, 1 with the first failures printed.  Pictures: <shots>/upgrade-<step>.jpg (base64 PNG → the caller's ffmpeg). */
import { spawn } from 'node:child_process';
import { rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open } from '../gate/gatekit.mjs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';   // the gate's self-signed 127.0.0.1 certificate, for the rig's own readiness probe only
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const OLD = path.resolve(arg('old', '')), NEW = path.resolve(arg('new', ROOT)), PORT = +arg('port', process.env.LW_PORT || 8799), GD = arg('gd', process.env.GD_PORT || '5799');
const VOL = arg('volume', 'vol-3'), KEEP = process.argv.includes('--keep'), SHOTS = arg('shots', path.join(ROOT, '.tmp', 'upgrade-rig'));
if (!OLD || !existsSync(path.join(OLD, 'lab', 'sw.js'))) { console.error('usage: --old <tree with lab/sw.js> --new <tree>'); process.exit(2); }
process.env.GD_PORT = String(GD);
mkdirSync(SHOTS, { recursive: true });
/* the profile lives under the tree's .tmp, never /tmp or a dot-directory of $HOME: the snap Firefox cannot read those (geckodriver then says "Failed to set preferences") */
const PROFILE = path.resolve(arg('profile') || path.join(ROOT, '.tmp', 'upgrade-rig', 'profile-' + Date.now().toString(36)));
mkdirSync(PROFILE, { recursive: true });
const URL0 = `https://127.0.0.1:${PORT}/lab/?sw=1`;
const J = (x) => JSON.stringify(x);
const results = []; let shot = 0;
const check = (ok, name, detail = '') => { results.push({ ok: !!ok, name, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + (typeof detail === 'string' ? detail : J(detail)) : ''}`); return !!ok; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the gate: one tree at a time on PORT ── */
let gate = null;
async function serve(tree) {
  if (gate) { gate.kill(); await sleep(400); gate = null; }
  gate = spawn('python3', [path.join(tree, 'tools', 'gate', 'server.py'), tree, String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 80; i++) { try { const r = await fetch(`https://127.0.0.1:${PORT}/lab/sw.js`, { cache: 'no-store' }); if (r.ok) return; } catch (_) {} await sleep(250); }
  throw new Error('the gate on ' + PORT + ' did not answer for ' + tree);
}
const stopGate = () => { if (gate) { gate.kill(); gate = null; } };

/* ── the page's eyes ── */
const STATE = `return (async () => { const reg = await navigator.serviceWorker.getRegistration('./').catch(() => null); const sw = window.__LW && __LW.sw;
  const chem = [...document.querySelectorAll('.dev')].find((d) => (d.dataset.id || d.id) === 'chem'); const ms = window.__LW && __LW.molsession;
  return { ready: !!(window.__LW && __LW.ready), controller: !!navigator.serviceWorker.controller,
    reg: reg ? { active: reg.active && reg.active.state, waiting: reg.waiting && reg.waiting.state, installing: reg.installing && reg.installing.state } : null,
    sw: sw ? { mode: sw.mode, state: sw.state, build: sw.build, cache: sw.cache, error: sw.error, offering: !!sw.offering } : null,
    caches: (await caches.keys().catch(() => [])).sort(),
    page: (window.__LW && __LW.sw && __LW.sw.page) || null,
    selected: ms && ms.selected, mol: (window.__LW && __LW.chem && __LW.chem.volume && (__LW.chem.volume.id || __LW.chem.volume.name)) || (ms && ms.molecule && (ms.molecule.id || ms.molecule.name)) || null, chemOn: !!(window.__LW && __LW.chem && __LW.chem.on),
    chem: chem ? { loading: chem.classList.contains('loading'), busy: chem.getAttribute('aria-busy'), closed: chem.classList.contains('closed') } : null,
    busy: window.__LW && __LW.busy ? __LW.busy.count : null, badge: (() => { const b = document.querySelector('#badges > .badge.build'); return b && !b.hidden ? b.textContent : ''; })(), errs: (window.__e || []).slice(-4).map(String) }; })()`;
const snap = async (g, name) => { try { const b = await g.snap(); writeFileSync(path.join(SHOTS, `upgrade-${++shot}-${name}.b64`), typeof b === 'string' ? b : b.toString('base64')); } catch (_) {} };
const waitState = async (g, pred, tries = 120, gap = 500) => { let s = null; for (let i = 0; i < tries; i++) { try { s = await g.ev(STATE); if (s && !s.E && pred(s)) return s; } catch (_) {} await sleep(gap); } return s; };
const launch = (url) => open(url, { width: 1400, height: 900, script: 240000, profile: PROFILE });

/* the first molecule of the volume, from the tree's own shelf */
let molIds = [];
try { const idx = JSON.parse(readFileSync(path.join(NEW, 'lab', 'volumes', VOL, 'index.json'), 'utf8')); molIds = idx.molecules.slice(0, 2).map((m) => m.id); } catch (_) {}

let g = null;   // the open browser, closed in `finally` whatever happens (a crash mid-run left a geckodriver on the port once)
try {
  console.log(`UPGRADE RIG · old ${OLD}\n             new ${NEW}\n             profile ${PROFILE} · port ${PORT} · volume ${molIds.length ? VOL + ' (' + molIds.join(', ') + ')' : 'none'}`);

  /* ═══ A · THE OLD BUILD ═══ */
  await serve(OLD);
  g = await launch(URL0);
  let s = await waitState(g, (x) => x.ready, 240, 500);
  check(s && s.ready, 'A0 the old build boots', s && s.errs);
  s = await waitState(g, (x) => x.reg && x.reg.active === 'activated', 120, 500);
  check(s && s.reg && s.reg.active === 'activated', 'A1 first launch: the worker installs and activates', s && { controller: s.controller, caches: s.caches });
  check(s && !s.controller, 'A1b first launch runs uncontrolled (THE ONE LAW: no claim)', s && { controller: s.controller });
  await g.nav('about:blank', { wait: false }); await sleep(600); await g.close(); g = null;

  g = await launch(URL0 + '&menu=1');
  s = await waitState(g, (x) => x.ready && x.controller && x.sw && x.sw.cache, 240, 500);
  check(s && s.controller, 'A2 second launch is controlled by the old worker', s && { cache: s.sw && s.sw.cache, caches: s.caches });
  const oldCache = s && s.sw && s.sw.cache, oldPage = (s && s.page) || null;   // 034: the old build's page build (null before 033), the 'new app' marker is any other page build
  if (molIds.length) {
    const inst = await g.ev(`return (async () => { const t = [...document.querySelectorAll('.mm-tab')].find((b) => /LIBRARY/.test(b.textContent)); if (t) t.click(); await new Promise((r) => setTimeout(r, 500));
      const sec = document.querySelector('.mm-sec.mm-library') || document; const size = (t) => { const m = /([\d.]+)\s*(KB|MB|GB)/i.exec(t); return m ? parseFloat(m[1]) * ({ kb: 1e3, mb: 1e6, gb: 1e9 })[m[2].toLowerCase()] : Infinity; };
      const btn = [...sec.querySelectorAll('button')].filter((b) => /^INSTALL/.test(b.textContent.trim())).sort((a, b) => size(a.textContent) - size(b.textContent))[0];   // 034: the smallest volume (VOL. III) on either shelf layout
      if (!btn) return { found: false, buttons: [...sec.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 24)).filter((t) => /INSTALL|REMOVE|RESUME/.test(t)) };
      const word = btn.textContent.trim(); btn.click(); return { found: true, word }; })()`);
    check(inst && inst.found, 'A3 the INSTALL press is found', inst);
    let st = null;
    for (let i = 0; i < 600; i++) { st = await g.ev(`return (async () => { const V = await import('./volumes.js'); const s = await V.installStatus('${VOL}'); return s; })()`).catch(() => null); if (st && st.state === 'installed') break; await sleep(1000); }
    check(st && st.state === 'installed', 'A3b the volume installs into lw-vol-' + VOL, st && { state: st.state, n: st.n, N: st.N, bytes: st.bytes });
    const opened = await g.ev(`return (async () => { const r = await __LW.verbs.run([{ verb: 'volume', args: { volume: '${VOL}', id: '${molIds[0]}' } }], { who: 'UPGRADE RIG' }); return r.refused; })()`);
    s = await waitState(g, (x) => x.mol && x.chemOn && x.chem && !x.chem.loading && x.busy === 0, 60, 500);
    check(opened && !opened.length && s && s.mol && !s.chem.loading, 'A4 the volume\'s molecule opens on the old build', { refused: opened, mol: s && s.mol, chem: s && s.chem });
  }
  await snap(g, 'A-old-build');
  await g.nav('about:blank', { wait: false }); await sleep(800);      // pagehide: the session part flushes
  await g.close(); g = null;

  /* ═══ B · THE NEW BUILD, SAME ORIGIN, SAME PROFILE ═══ */
  await serve(NEW);
  g = await launch(URL0);
  s = await waitState(g, (x) => x.ready, 240, 500);
  if (!process.argv.includes('--quiet')) {   // a TOUCHED session (a history row): the new build must be OFFERED and pressed, never taken under the reader
    const t = await g.ev(`return (async () => { const r = await __LW.verbs.run([{ verb: 'molecule', args: { id: 'H2O' } }], { who: 'UPGRADE RIG' }); return { refused: r.refused, rows: __LW.history ? __LW.history.entries().length : null }; })()`).catch((e) => ({ E: String(e) }));
    console.log('      (B0 the session is touched before the new worker installs: ' + J(t) + ')');
  }
  s = await waitState(g, (x) => x.ready && x.sw && x.sw.cache, 240, 500);
  const onOld = s && s.controller && s.sw.cache === oldCache && !(s.page && s.page !== oldPage), tookQuietly = s && s.controller && (s.page && s.page !== oldPage) && s.sw.cache !== oldCache;
  check(onOld || tookQuietly, 'B1 a returning visitor boots on the OLD build from its cache (the law) while the new worker installs' + (tookQuietly ? ' — taken quietly before the first read (an untouched session)' : ''), s && { cache: s.sw.cache, newApp: (s.page && s.page !== oldPage), reg: s.reg });
  s = await waitState(g, (x) => (x.sw && (x.sw.state === 'ready' || x.sw.offering)) || ((x.page && x.page !== oldPage) && x.controller) || (x.reg && x.reg.waiting === 'installed'), 180, 500);
  const offered = !!(s && s.sw && (s.sw.state === 'ready' || s.sw.offering)), quiet = !!(s && (s.page && s.page !== oldPage) && s.controller);
  check(offered || quiet, 'B2 the new build installs and is offered (or taken quietly for an untouched session)', s && { offered, quiet, reg: s.reg, sw: s.sw, errs: s.errs });
  if (offered) {
    await snap(g, 'B-offer');
    const pressed = await g.ev(`return (async () => { window.confirm = () => true;   // an older build asks UPDATE APP WITHOUT SAVING? natively (033 made it the kit's dialog): the rig says yes
      const root = __LW.sw.offering; let how = null;
      const b = root && [...root.querySelectorAll('button')].find((x) => /RELOAD/.test(x.textContent)); if (b) { b.click(); how = b.textContent.trim(); }
      else { const pane = document.querySelector('#lwOffer'); const u = pane && [...pane.querySelectorAll('button')].find((x) => /UPDATE/.test(x.textContent)); if (u) { u.click(); how = 'pane ' + u.textContent.trim(); } else { const r = await __LW.sw.accept(); how = r ? 'accept()' : 'accept() refused'; } }
      await new Promise((q) => setTimeout(q, 400));
      const ask = [...document.querySelectorAll('.mir-dialog, [role="alertdialog"], [role="dialog"]')].find((d) => /WITHOUT SAVING/i.test(d.textContent)); if (ask) { const y = [...ask.querySelectorAll('button')].find((x) => /UPDATE|YES|RELOAD/i.test(x.textContent)); if (y) { y.click(); how += ' + the kit question: ' + y.textContent.trim(); } }
      return how; })()`).catch((e) => (/unloaded|no such window|context/i.test(String(e && e.message || e)) ? 'pressed — the page reloaded under the press (the take landed)' : { E: String(e && e.message || e).slice(0, 200) }));
    check(pressed && !pressed.E && !/refused/.test(pressed), 'B3 RELOAD PAGE is pressed', pressed);
  }
  s = await waitState(g, (x) => x.ready && (x.page && x.page !== oldPage) && x.controller && x.sw && x.sw.cache && x.sw.cache !== oldCache, 240, 500);
  check(s && (s.page && s.page !== oldPage) && s.controller && s.sw.cache !== oldCache, 'B4 the NEW build is in control after the reload', s && { cache: s.sw && s.sw.cache, state: s.sw && s.sw.state, reg: s.reg });
  const labs = (s && s.caches || []).filter((n) => n.startsWith('lw-lab-'));
  check(labs.length === 1 && labs[0] === (s && s.sw && s.sw.cache), 'B5 exactly one build cache remains (the old one collected)', { caches: s && s.caches });
  if (molIds.length) {
    check(s && s.caches.includes('lw-vol-' + VOL), 'B6 the installed volume survived the update', { caches: s && s.caches });
    const st = await g.ev(`return (async () => { const V = await import('./volumes.js'); return V.installStatus('${VOL}'); })()`).catch((e) => ({ E: String(e) }));
    check(st && st.state === 'installed', 'B6b …and is whole', st && { state: st.state, n: st.n, N: st.N });
  }
  await sleep(3000);
  s = await waitState(g, (x) => x.busy === 0, 40, 500);
  check(s && s.chem && !s.chem.loading && s.chem.busy !== 'true', 'B7 the resumed session leaves no window stuck loading', s && { chem: s.chem, selected: s.selected, mol: s.mol, busy: s.busy, errs: s.errs });
  if (molIds.length) {
    const again = await g.ev(`return (async () => { const r = await __LW.verbs.run([{ verb: 'volume', args: { volume: '${VOL}', id: '${molIds[1] || molIds[0]}' } }], { who: 'UPGRADE RIG' }); return r.refused; })()`);
    s = await waitState(g, (x) => x.mol && x.chemOn && x.chem && !x.chem.loading && x.busy === 0, 60, 500);
    check(again && !again.length && s && s.mol && !s.chem.loading, 'B8 the volume\'s molecule opens on the new build', { refused: again, mol: s && s.mol, chem: s && s.chem, errs: s && s.errs });
  }
  check(s && !(s.errs || []).length, 'B9 no page errors', s && s.errs);
  await snap(g, 'B-new-build');
  /* ═══ C · THE STATE CAN BE SEEN, THEN REPAIR ═══ */
  const diag = await g.ev(`return (async () => { const t = await __LW.sw.diagnostics(); return { lines: t.split(String.fromCharCode(10)).length, head: t.split(String.fromCharCode(10)).slice(0, 3), page: __LW.sw.page, worker: __LW.sw.workerPage, about: (document.querySelector('.ab-build') || {}).textContent || null }; })()`).catch((e) => ({ E: String(e) }));
  check(diag && diag.lines >= 8 && diag.page && diag.worker === diag.page && /offline ready/.test(diag.about || ''), 'C1 diagnostics read, the page build equals the worker\'s, ABOUT says offline ready', diag);
  const rep = await g.ev(`return (async () => { window.confirm = () => true; const p = __LW.sw.refresh(); await new Promise((q) => setTimeout(q, 400));
      const ask = [...document.querySelectorAll('.mir-dialog, [role="alertdialog"], [role="dialog"]')].find((d) => /WITHOUT SAVING/i.test(d.textContent)); if (ask) { const y = [...ask.querySelectorAll('button')].find((x) => /UPDATE|YES|REPAIR/i.test(x.textContent)); if (y) y.click(); }
      const r = await Promise.race([p, new Promise((q) => setTimeout(() => q('reloading'), 8000))]); return { started: r, state: __LW.sw.state }; })()`).catch((e) => ({ E: String(e && e.message || e).slice(0, 160) }));
  console.log('      (C2 REPAIR pressed: ' + J(rep) + ')');
  s = await waitState(g, (x) => x.ready && x.controller && (x.page && x.page !== oldPage) && x.sw && x.sw.cache && /REPAIRED/.test(x.badge || ''), 240, 500);
  check(s && s.controller && /REPAIRED/.test(s.badge || ''), 'C2 REPAIR ends controlled by a verified build and says REPAIRED', s && { badge: s.badge, cache: s.sw && s.sw.cache, caches: s.caches, reg: s.reg });
  const labs2 = (s && s.caches || []).filter((n) => n.startsWith('lw-lab-'));
  check(labs2.length === 1 && (s && s.caches || []).includes('lw-vol-' + VOL), 'C3 after REPAIR: one build cache, the volume untouched', { caches: s && s.caches });
  await snap(g, 'C-repaired');
  await g.nav('about:blank', { wait: false }); await sleep(400); await g.close(); g = null;
} catch (e) {
  check(false, 'the rig itself', String(e && e.stack || e));
} finally {
  try { if (g) await g.close(); } catch (_) {}
  stopGate();
  if (!KEEP && !arg('profile')) rmSync(PROFILE, { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${failed.length ? 'FAIL' : 'PASS'}  upgrade rig: ${results.length - failed.length}/${results.length} checks` + (failed.length ? ' — ' + failed.map((f) => f.name).join('; ') : '') + `  (pictures: ${SHOTS}, profile ${KEEP || arg('profile') ? 'kept at ' + PROFILE : 'removed'})`);
process.exit(failed.length ? 1 : 0);
