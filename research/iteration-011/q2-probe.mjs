// research/iteration-011/q2-probe.mjs — ROW Q2 (MINIMIZED BY DEFAULT): a FIRST RUN (a fresh Firefox profile) at desktop and phone size.
// Two shots per device: AS IT BOOTS (the whole page, the rack's windows folded) and UNFOLDED (a tall page, every first-run window's own
// fold pressed open — the rack shown on a phone — so each window's INNER disclosures show their first-run state).  The JSON lists every
// window on the rack and every disclosure (aria-expanded) with its state.
//   LW_PORT=9411 GD_PORT=5411 node research/iteration-011/q2-probe.mjs <tag> [desktop|phone]      (tag: before | after)
import { writeFileSync, mkdirSync } from 'node:fs';
import { open } from '../../tools/gate/gatekit.mjs';
const TAG = process.argv[2] || 'probe', PORT = process.env.LW_PORT || 9411, only = process.argv[3];
const OUT = new URL('./q2-shots/', import.meta.url); mkdirSync(OUT, { recursive: true });
const READ = `await __LW.settle(); await new Promise((r) => setTimeout(r, 1500));
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const devOf = (e) => { const d = e.closest('.dev'); return d ? d.dataset.id : ((e.closest('[id]') || {}).id || null); };
  const cards = [...document.querySelectorAll('.dev')].filter((d) => !d.classList.contains('closed') && !d.hidden).map((d) => ({ id: d.dataset.id, rack: d.parentElement && d.parentElement.id, folded: d.classList.contains('folded') }));
  const disc = [...document.querySelectorAll('[aria-expanded]')].map((e) => ({ dev: devOf(e), cls: String(e.className).split(' ').filter((c) => c && c !== 'trig').join('.'), fold: e.dataset.fold || null, label: (e.getAttribute('aria-label') || e.title || e.textContent || '').trim().slice(0, 50), open: e.getAttribute('aria-expanded') === 'true', shown: vis(e) }));
  return { w: innerWidth, h: innerHeight, body: [...document.body.classList], cards, disc };`;
const UNFOLD = `if (document.body.classList.contains('rack-hidden')) { const t = document.querySelector('.rack-toggle, [data-act="rack"], #rackToggle, .mir-rack-toggle'); if (t) t.click(); }
  for (const d of document.querySelectorAll('.dev')) if (!d.classList.contains('closed') && !d.hidden && d.classList.contains('folded')) d.querySelector('.dev-fold').click();
  await new Promise((r) => setTimeout(r, 2500));
  return [...document.querySelectorAll('.dev')].filter((d) => !d.classList.contains('closed') && !d.hidden).map((d) => ({ id: d.dataset.id, h: Math.round(d.getBoundingClientRect().height), open: [...d.querySelectorAll('[aria-expanded="true"]')].map((b) => (b.dataset.fold || b.className) + ':' + (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 40)) }));`;
for (const [dev, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]]) {
  if (only && only !== dev) continue;
  for (const tall of [false, true]) {
    const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: w, height: tall ? 2400 : h, script: 180000 });
    try {
      await g.waitFor('window.__LW && __LW.ready', 600, 100);
      const r = await g.ev(READ);
      const name = `${TAG}-${dev}${tall ? '-unfolded' : ''}`;
      if (tall) r.unfolded = await g.ev(UNFOLD);
      writeFileSync(new URL(name + '.json', OUT), JSON.stringify(r, null, 1));
      writeFileSync(new URL(name + '.png', OUT), Buffer.from(await g.snap(), 'base64'));
      console.log(name, JSON.stringify(tall ? r.unfolded : { cards: r.cards.map((c) => c.id + (c.folded ? '(folded)' : '')), open: r.disc.filter((d) => d.open && d.cls !== 'dev-fold').map((d) => d.dev + ':' + (d.fold || d.cls)) }));
    } finally { await g.close(); }
  }
}
