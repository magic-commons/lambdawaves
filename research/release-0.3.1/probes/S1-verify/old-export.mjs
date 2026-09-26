/* old-export.mjs — S1 verifier: make a GENUINE pre-S1 save.  Run against a server on the pre-S1 tree (125884b, `git archive`
 * into a temp dir): sets every preference the old build wrote into a project (theme, card, frost, disc, accent, camera feel,
 * field chrome, palette choice, camera mode) plus distinctive PROJECT content, saves a project, exports it, mints a link,
 * and writes { settings, exportText, link, serialize } to old030.json beside this file.
 *   LW_PORT=8734 GD_PORT=5234 node research/release-0.3.1/probes/S1-verify/old-export.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
const PORT = process.env.LW_PORT || '8734';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 120000 });
let R = {};
try {
  const w = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  if (!w || !w.ok) throw new Error('lab never became ready');
  await g.ev('try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;');
  R = await g.ev(`const L = __LW, M = L.mod.model, w = (n) => new Promise((r) => setTimeout(r, n));
    const t0 = L.themeChoice; L.setTheme(t0 === 'light' ? 'dark' : 'light');
    L.setCardStyle(L.cardStyle === 'tinted' ? 'refractive' : 'tinted');
    L.setFrost(L.frost === 'off' ? 'always' : 'off');
    L.setDisconnected(!L.disconnected);
    L.accent.set(123, 234);
    L.camera.setFriction(0.31); L.camera.setSpeed(0.9); L.camera.setDragGain(3.3); L.camera.setFling(1.7);
    L.mat.frame = false; L.mat.axis = false; L.mat.invert = true; L.mat.axisInk = 'rgb';
    L.setPalette('lambda'); L.setCamMode('turntable', true); L.orbitBy(0.3, 0.1);
    M.addSource('lfo'); L.layout.modulation.expand(); await w(400); M.addRoute(M.macroList()[0].id, 'material.exposure', 0.5, 4);
    L.layout.reopen('settings', 'R'); L.layout.reopen('state', 'R'); await w(200);
    L.kepler.setOn(true); L.vortex.setOn(true); L.spectrum.setDials(true); L.layout.notebookResize(520, 380);
    const tr = [...document.querySelectorAll('.dev[data-id=state] .trig')], by = (t) => tr.find((b) => b.textContent.trim() === t);
    by('STORE A').click(); L.loadPreset('2p+'); await w(150); by('STORE B').click();
    const sc = document.querySelector('.stage-colour'); sc.value = '#203040'; sc.dispatchEvent(new Event('input', { bubbles: true }));
    const follow = document.querySelector('.stage-follow'); if (L.serialize().presentation.ui.stage.follow) follow.click();
    L.saveSettings(); await w(300);
    const ok = L.projects.save('verify/old030');
    return { ok, settings: localStorage.getItem('lambdawaves.q0.settings'), exportText: L.projects.exportText('verify/old030'),
      link: L.link.mint().href, serialize: L.serialize(), theme: document.body.dataset.theme, errs: (window.__e || []).map(String) };`);
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
const S = R.settings ? JSON.parse(R.settings) : {};
console.log(JSON.stringify({ ok: R.ok, theme: R.theme, settingsPalette: S.palette, settingsCamMode: S.camMode, friction: S.friction, frame: S.frame, invert: S.invert,
  exportBytes: R.exportText && R.exportText.length, linkChars: R.link && R.link.length, errs: R.errs, error: R.error }, null, 1));
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'old030.json'), JSON.stringify(R, null, 1));
