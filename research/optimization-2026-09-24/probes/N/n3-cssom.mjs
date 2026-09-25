/* n3-cssom.mjs — lane N · N3's Firefox gate, adapted from probes/C/refute/fe4-cssom.mjs: the FULL computed style
 * (every property but custom properties) of EVERY element, in C's widest state (every window open and unfolded,
 * offscreen presented, the modulation window open with a macro routed, played 1.5 s) across C's four states —
 * light/disc/frost · dark/disc/frost · dark/connected/frost off · light/connected/tinted — on:
 *   A  probes/N/lab-pre-n3/ (lab/ with the PRE-N3 lab.css + skin.css), loaded twice → the A/A noise across loads
 *   B  /lab/ (the cut sheets)
 * Verdict: elements that differ between A and B beyond the A/A noise, per state; plus the rule/selector counts of
 * lab.css + skin.css as each page's CSSOM holds them (proof B really runs the cut sheets).
 *   LW_PORT=8726 GD_PORT=5245 node research/optimization-2026-09-24/probes/N/n3-cssom.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8726';
const HASH = String.raw`
  const out = []; const els = document.querySelectorAll('body, body *');
  for (let k = 0; k < els.length; k++) { const el = els[k]; const cs = getComputedStyle(el); let h = 2166136261 >>> 0;
    const mix = (s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } };
    for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (p.startsWith('--')) continue; mix(p); mix(cs.getPropertyValue(p)); }
    out.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').split(' ')[0]) + '@' + k + ':' + h.toString(16)); }
  return out;`;
const COUNT = String.raw`let rules = 0, sels = 0; const walk = (L) => { for (const r of L) { if (r.cssRules && r.media) walk(r.cssRules); else if (r.selectorText) { rules++; sels += r.selectorText.split(/,(?![^(]*\))/).length; } } };
  for (const s of document.styleSheets) { const f = (s.href || '').split('/').pop(); if (f === 'lab.css' || f === 'skin.css') walk(s.cssRules); } return { rules, sels };`;
const STATES = [
  ['light · disc · frost', `__LW.setTheme('light'); __LW.setDisconnected(true); __LW.setFrost('always')`],
  ['dark · disc · frost', `__LW.setTheme('dark')`],
  ['dark · connected · frost off', `__LW.setDisconnected(false); __LW.setFrost('off')`],
  ['light · connected · tinted', `__LW.setTheme('light'); __LW.setCardStyle('tinted')`],
];
async function load(path) {
  const g = await open(`https://127.0.0.1:${PORT}/${path}?preset=1s%2B2pz&sw=0&warn=0`, { width: 1920, height: 1080, script: 900000 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    await g.ev(`__LW.pause(); for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.windowActivity.presentOffscreen(true);
      __LW.mod.expand(); const m = __LW.mod.addMacro(); try { __LW.mod.route(m, 'material.exposure'); } catch(e) {}
      __LW.play(); await new Promise(r=>setTimeout(r,1500)); __LW.pause(); await __LW.settle(); return 1;`);
    const r = { count: await g.ev(COUNT), states: [] };
    for (const [label, set] of STATES) { await g.ev(`${set}; await __LW.settle(); await new Promise(r=>setTimeout(r,600)); return 1;`); r.states.push({ label, els: await g.ev(HASH) }); }
    r.errors = await g.ev('return (window.__e || []).map(String).slice(0, 5)');
    return r;
  } finally { await g.close(); }
}
const diff = (A, B) => A.states.map((a, i) => { const b = B.states[i], d = []; const n = Math.max(a.els.length, b.els.length); for (let k = 0; k < n; k++) if (a.els[k] !== b.els[k]) d.push(k);
  return { label: a.label, n: a.els.length, nB: b.els.length, differ: d.length, idx: d.slice(0, 60), who: d.slice(0, 12).map((k) => (a.els[k] || '') + ' / ' + (b.els[k] || '')) }; });
const A1 = await load('research/optimization-2026-09-24/probes/N/lab-pre-n3/');
const A2 = await load('research/optimization-2026-09-24/probes/N/lab-pre-n3/');
const B = await load('lab/');
const aa = diff(A1, A2), ab = diff(A1, B);
const beyond = ab.map((s, i) => ({ label: s.label, n: s.n, nB: s.nB, idx: s.idx.filter((k) => !aa[i].idx.includes(k)), who: s.who }));
const out = { at: new Date().toISOString(), countA: A1.count, countB: B.count, aa: aa.map((s) => ({ label: s.label, n: s.n, differ: s.differ, who: s.who })),
  ab: ab.map((s) => ({ label: s.label, differ: s.differ })), beyondNoise: beyond, errors: { A1: A1.errors, A2: A2.errors, B: B.errors } };
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync('research/optimization-2026-09-24/probes/N/n3-cssom.json', JSON.stringify(out, null, 1));
