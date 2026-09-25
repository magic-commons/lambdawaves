/* fe4-cssom.mjs — Lane C cross-refutation of FE4: remove lane E's 124 orphan selectors FROM THE LIVE CSSOM (lab/ untouched)
 * and hash every element's full computed style before/after, across states: every window open + the modulation window
 * open (with a route and its pop-over) × light/dark × connected/disconnected × frost on/off.  Also: the second-tier list.
 *   LW_PORT=8721 GD_PORT=5233 node research/optimization-2026-09-24/probes/C/refute/fe4-cssom.mjs */
import { open } from '../../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8721';
const E = JSON.parse(fs.readFileSync('research/optimization-2026-09-24/probes/E/css-orphans.json', 'utf8'));
const FALSE_POS = new Set(['.nb-view .katex-display', '.hist-future', '.hist-future .hist-lbl']);
const list = E.strong.filter((s) => !FALSE_POS.has(s.sel)).map((s) => ({ file: s.file, media: s.media || '', sel: s.sel }));
const SECOND = [ // lane E's second tier, removed separately
  { file: 'lab.css', media: '', sel: '.keys-list' }, { file: 'skin.css', media: '', sel: '.dev .keys-list' },
  { file: 'skin.css', media: '', sel: '.native-clean .grp .grp' }, { file: 'skin.css', media: '', sel: '.native-clean[data-id="observer"] .grp' },
  { file: 'skin.css', media: '', sel: '.native-clean[data-id="camera"] .camera-motion .sw' },
  { file: 'lab.css', media: '', sel: '.orbit-row' }, { file: 'lab.css', media: '', sel: '.orbit-band' }, { file: 'lab.css', media: '', sel: '.orbit-id' },
  { file: 'lab.css', media: '', sel: '.orbit-c.drive' }, { file: 'lab.css', media: '', sel: '.dyn-row' }];
if (process.env.FIVE) SECOND.splice(5);
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: 1920, height: 1080, script: 900000 });
const HASH = String.raw`
  const out = []; const els = document.querySelectorAll('body, body *');
  for (let k = 0; k < els.length; k++) { const el = els[k]; const cs = getComputedStyle(el); let h = 2166136261 >>> 0;
    const mix = (s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
    for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (p.startsWith('--')) continue; mix(p); mix(cs.getPropertyValue(p)); }
    out.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').split(' ')[0]) + '@' + k + ':' + h.toString(16)); }
  return out;`;
const PROPS = (idx) => String.raw`
  const els = document.querySelectorAll('body, body *'); const o = {};
  for (const k of ${JSON.stringify(idx)}) { const cs = getComputedStyle(els[k]); const m = {}; for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (!p.startsWith('--')) m[p] = cs.getPropertyValue(p); } o[k] = m; }
  return o;`;
const REMOVE = (items) => String.raw`
  const want = ${JSON.stringify(items)}; const norm = (s) => s.replace(/\s*([>+~,])\s*/g, '$1').replace(/\s+/g, ' ').replace(/'/g, '"').trim();
  const W = want.map((w) => ({ ...w, n: norm(w.sel), m: norm(w.media) })); let removed = 0, rules = 0; const hit = new Set();
  const walk = (sheet, rulesList, media, file) => { for (let i = rulesList.length - 1; i >= 0; i--) { const r = rulesList[i];
      if (r.cssRules && r.media) { walk(sheet, r.cssRules, norm(r.media.mediaText), file); continue; }
      if (!r.selectorText) continue;
      const parts = r.selectorText.split(/,(?![^(]*\))/).map((p) => p.trim());
      const keep = parts.filter((p) => { const k = W.find((w) => w.file === file && w.m === media && w.n === norm(p)); if (k) { hit.add(k.sel + '|' + k.media); removed++; return false; } return true; });
      if (keep.length === parts.length) continue;
      rules++;
      const parent = r.parentRule || sheet; const idx = [...parent.cssRules].indexOf(r);
      if (!keep.length) parent.deleteRule(idx); else r.selectorText = keep.join(', ');
  } };
  for (const s of document.styleSheets) { const f = (s.href || '').split('/').pop(); if (f !== 'lab.css' && f !== 'skin.css') continue; walk(s, s.cssRules, '', f); }
  return { removed, rules, matched: hit.size, wanted: want.length, missing: want.filter((w) => !hit.has(w.sel + '|' + w.media)).map((w) => w.sel) };`;
const STATES = [
  ['light · disc · frost', `__LW.setTheme('light'); __LW.setDisconnected(true); __LW.setFrost('always')`],
  ['dark · disc · frost', `__LW.setTheme('dark')`],
  ['dark · connected · frost off', `__LW.setDisconnected(false); __LW.setFrost('off')`],
  ['light · connected · tinted', `__LW.setTheme('light'); __LW.setCardStyle('tinted')`],
];
const out = { at: new Date().toISOString(), selectors: list.length };
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev(`__LW.pause(); for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true);
    __LW.mod.expand(); const m = __LW.mod.addMacro(); try { __LW.mod.route(m, 'material.exposure'); } catch(e) {}
    __LW.play(); await new Promise(r=>setTimeout(r,1500)); __LW.pause(); await __LW.settle(); return 1;`);
  const run = async () => { const r = []; for (const [label, set] of STATES) { await g.ev(`${set}; await __LW.settle(); await new Promise(r=>setTimeout(r,600)); return 1;`); r.push({ label, els: await g.ev(HASH) }); } return r; };
  const diff = (A, B) => A.map((a, i) => { const d = []; const n = Math.max(a.els.length, B[i].els.length); for (let k = 0; k < n; k++) if (a.els[k] !== B[i].els[k]) d.push(k); return { label: a.label, n: a.els.length, differ: d.length, idx: d.slice(0, 40), who: d.slice(0, 12).map((k) => a.els[k]) }; });
  const b1 = await run(); const b2 = await run();
  out.aa = diff(b1, b2);
  out.removeStrong = await g.ev(REMOVE(list));
  const a1 = await run();
  out.strong = diff(b2, a1);
  /* the elements that moved only across the removal (not in the A/A noise) */
  out.strongBeyondNoise = out.strong.map((s, i) => ({ label: s.label, idx: s.idx.filter((k) => !out.aa[i].idx.includes(k)) }));
  out.removeSecond = await g.ev(REMOVE(SECOND));
  const a2 = await run();
  out.second = diff(a1, a2);
  out.secondBeyondNoise = out.second.map((s, i) => ({ label: s.label, idx: s.idx.filter((k) => !out.aa[i].idx.includes(k)), who: s.who }));
  out.liveSecondTier = await g.ev(`return { orbitRows: document.querySelectorAll('.orbit-row').length, dynRows: document.querySelectorAll('.dyn-row').length, orbitC: document.querySelectorAll('.orbit-c').length };`);
  console.log(JSON.stringify(out, null, 1));
} catch (e) { console.error('PROBE ERROR', e); out.error = String(e); }
finally { await g.close(); }
fs.writeFileSync('research/optimization-2026-09-24/probes/C/refute/fe4-cssom' + (process.env.FIVE ? '-five' : '') + '.json', JSON.stringify(out, null, 1));
