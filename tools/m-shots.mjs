/* m-shots.mjs — iteration 015 chain M's pictures (a diagnostic, not a gate).
 *   LW_PORT=9591 GD_PORT=5291 node tools/m-shots.mjs <scene> [out.png]
 * Scenes: head (M1: THE LOOK DROP open over the MOLECULAR deck) · hue (M6: the ring at rest beside its hovered self) · look (M2: the
 * MOLECULAR deck in LOOK=$LOOK) · atomic (M3: ATOMS) · hydrogen (M3: THE 140) · folders (M4) · shelf (M5: the LIBRARY's volume cards).
 * Writes a PNG (the driver's composite); python turns it into a small JPEG.  Prints what the scene measured. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'head', OUT = process.argv[3] || `.tmp/m-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9591}/lab/?menu=1`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tab = (word) => g.ev(`[...document.querySelectorAll('#lwMenu .mm-tab')].find((b) => b.textContent.includes(${JSON.stringify(word)})).click(); return 1;`);
try {
  if (!(await g.waitFor('window.__LW?.ready && document.querySelector("#lwMenu .mm-tab")', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1200);
  let info = null;
  if (scene === 'head') {
    await tab('MOLECULAR'); await wait(900);
    await g.ev(`document.querySelector('#lwMenu .mm-lookb').click(); return 1;`); await wait(700);
    info = await g.ev(`const d = document.querySelector('#lwMenu .mm-lookdrop'), b = document.querySelector('#lwMenu .mm-lookb').getBoundingClientRect(), r = d.getBoundingClientRect();
      const order = [...document.querySelectorAll('#lwMenu .mm-top > *')].map((e) => e.className);
      return { order, drop: [r.left, r.top, r.width, r.height].map(Math.round), centred: Math.round(r.left + r.width / 2 - (b.left + b.width / 2)), tiles: [...d.children].map((t) => t.textContent + (t.classList.contains('on') ? '*' : '') + (t.classList.contains('off') ? '(off)' : '')),
        font: getComputedStyle(d.querySelector('.mm-lk-g')).fontFamily, logo: Math.round(document.querySelector('#lwMenu .mm-logo').getBoundingClientRect().height) };`);
  } else if (scene === 'hue') {
    const read = () => g.ev(`const h = document.querySelector('#lwMenu .mm-hue'), ring = h.querySelector('.mm-hue-ring'); return { filter: getComputedStyle(ring).filter, opacity: getComputedStyle(h).opacity };`);
    const rest = await read(); writeFileSync(OUT.replace(/\.png$/, '-rest.png'), Buffer.from(await g.snap(), 'base64'));
    await g.ev(`document.querySelector('#lwMenu .mm-hue').classList.add('drag'); return 1;`); await wait(500);
    info = { rest, hand: await read() };
  } else if (scene === 'look') {
    await g.ev(`const p = JSON.parse(localStorage.getItem('lambdawaves.q0.picker') || '{}'); return 1;`);
    await tab('MOLECULAR'); await wait(900);
    await g.ev(`document.querySelector('#lwMenu .mm-lookb').click(); await new Promise((r) => setTimeout(r, 400)); document.querySelector('#lwMenu .mm-lk[data-look="${process.env.LOOK || 'esp'}"]').click(); return 1;`); await wait(2500);
    info = await g.ev(`return [...document.querySelectorAll('#lwMenu .mm-molecular .mm-pic')].slice(0, 6).map((i) => i.getAttribute('src'));`);
  } else if (scene === 'atomic' || scene === 'hydrogen') {
    await tab('ATOMIC'); await wait(900);
    if (scene === 'hydrogen') { await g.ev(`const b = document.querySelector('#lwMenu .mm-amode [data-amode="hydrogen"]'); if (b) b.click(); return 1;`); await wait(2500); }
    info = await g.ev(`const t = [...document.querySelectorAll('#lwMenu .mm-atomic .mm-tile')].filter((x) => x.getClientRects().length); const h = t[3]; if (h) h.dispatchEvent(new PointerEvent('pointerenter')); return { tiles: t.length, first: t.slice(0, 4).map((x) => x.textContent), caption: document.querySelector('#lwMenu .mm-caption').textContent };`);
    await wait(600);
  } else if (scene === 'folders') {
    await g.ev(`document.querySelector('#lwMenu .mm-navb[data-nav="folders"]').click(); return 1;`); await wait(2500);
    info = await g.ev(`const p = document.querySelector('#lwMenu .mm-folders'); return { shown: !!p && !!p.getClientRects().length, cards: p ? p.querySelectorAll('.mir-gal-card, [class*="card"]').length : 0, picker: !document.querySelector('#lwMenu').hidden };`);
  } else if (scene === 'shelf') {
    await tab('LIBRARY'); await g.waitFor('document.querySelector("#lwMenu .mm-vol-open")', 300, 100); await wait(1500);
    info = await g.ev(`return [...document.querySelectorAll('#lwMenu .mm-shelf .mm-vol')].map((c) => c.textContent.replace(/\\s+/g, ' ').trim());`);
  }
  writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ scene, OUT, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
