// discovery: the cards, their switches / segments / selects / inputs, and the modulation window's classes
import { lab } from './kit.mjs';
const g = await lab();
try {
  const out = await g.run(`const txt = (e) => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
    const devs = [...document.querySelectorAll('.dev')].map((d) => ({ id: d.dataset.id, eb: txt(d.querySelector('.dev-eyebrow')), closed: d.classList.contains('closed'), hidden: d.hidden,
      sw: [...d.querySelectorAll('.sw')].map((s) => txt(s.querySelector('.sw-lbl'))),
      seg: [...d.querySelectorAll('.seg, .segw')].map((s) => txt(s.querySelector('.k-lbl')) + ':' + [...s.querySelectorAll('.seg-b')].map((b) => txt(b)).join('|')),
      sel: [...d.querySelectorAll('select')].map((s) => s.getAttribute('aria-label') || s.title || '?'),
      inp: [...d.querySelectorAll('input')].map((s) => s.type + ':' + (s.getAttribute('aria-label') || s.className || '?')),
      k: [...d.querySelectorAll('.k')].map((s) => txt(s.querySelector('.k-lbl'))) }));
    __LW.layout.modulation.expand(); await __w(400);
    const mw = document.querySelector('#modwin');
    const cls = new Set(); if (mw) for (const e of mw.querySelectorAll('*')) for (const c of e.classList) cls.add(c);
    return { devs, mw: mw ? [...cls].sort().join(' ') : null, title: txt(mw && mw.querySelector('.kwin-title')), menubar: [...document.querySelectorAll('.mb-top, .menubar button')].map(txt).slice(0, 30), rows: __rows() };`);
  console.log(JSON.stringify(out, null, 1));
} finally { await g.close(); }
