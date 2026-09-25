/* field-prop.mjs — which computed property of #field moves between two reads with nothing removed (is it live state?) */
import { open } from '../../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
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

const E = JSON.parse(fs.readFileSync('research/optimization-2026-09-24/probes/E/css-orphans.json', 'utf8'));
const FP = new Set(['.nb-view .katex-display', '.hist-future', '.hist-future .hist-lbl']);
const LIST = E.strong.filter((s) => !FP.has(s.sel)).map((s) => ({ file: s.file, media: s.media || '', sel: s.sel }));
const FIVE = [{ file: 'lab.css', media: '', sel: '.keys-list' }, { file: 'skin.css', media: '', sel: '.dev .keys-list' }, { file: 'skin.css', media: '', sel: '.native-clean .grp .grp' }, { file: 'skin.css', media: '', sel: '.native-clean[data-id="observer"] .grp' }, { file: 'skin.css', media: '', sel: '.native-clean[data-id="camera"] .camera-motion .sw' }];
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || '8721'}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: 1920, height: 1080, script: 300000 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const snap = `const cs = getComputedStyle(document.getElementById('field')); const m = {}; for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (!p.startsWith('--')) m[p] = cs.getPropertyValue(p); } return { m, cls: document.getElementById('field').className };`;
  await g.ev(`__LW.pause(); for(const d of document.querySelectorAll('.dev')) d.classList.remove('closed','folded'); __LW.mod.expand(); await __LW.settle(); return 1;`);
  const a = await g.ev(snap);
  await g.ev(REMOVE(LIST)); await g.ev(REMOVE(FIVE)); await g.ev(`__LW.setTheme('dark'); await __LW.settle(); __LW.setTheme('light'); await __LW.settle(); await new Promise(r=>setTimeout(r,800)); return 1;`);
  const b = await g.ev(snap);
  const d = Object.keys(a.m).filter((k) => a.m[k] !== b.m[k]).map((k) => [k, a.m[k], b.m[k]]);
  console.log(JSON.stringify({ clsA: a.cls, clsB: b.cls, differ: d }));
} finally { await g.close(); }
