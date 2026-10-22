/* d-shots.mjs — iteration 014 chain D's pictures (a diagnostic, not a gate).
 *   LW_PORT=9571 GD_PORT=5271 node tools/d-shots.mjs <scene> [out.png]
 * Scenes: picker-volume (D1: a volume open, the search under the tabs, NAME · MASS pressed once each in turn) · register (D3) ·
 * palette (D4: the presets list open) · bonds (D6: benzene + water-dimer-like BALL AND STICK with the BONDS set on).
 * Writes a PNG (the driver's composite); tools/ or python turns it to a small JPEG. Prints what the scene measured. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'picker-volume', OUT = process.argv[3] || `.tmp/d-${scene}.png`;
const q = scene === 'picker-volume' ? '?menu=1' : '?starter=home';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9571}/lab/${q}`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  let info = null;
  if (scene === 'picker-volume') {
    await g.waitFor('document.querySelector("#lwMenu .mm-tab")', 200, 100);
    await g.ev(`[...document.querySelectorAll('#lwMenu .mm-tab')].find((b) => /LIBRARY/i.test(b.textContent)).click(); return 1;`);
    await g.waitFor('document.querySelector("#lwMenu .mm-vol-open")', 300, 100); await wait(800);
    await g.ev(`document.querySelector('#lwMenu .mm-vol-open').click(); return 1;`);
    await g.waitFor('document.querySelectorAll("#lwMenu .mm-volview .mm-mol").length > 4', 600, 100);
    const order = () => g.ev(`return [...document.querySelectorAll('#lwMenu .mm-volview .mm-page')].flatMap((p) => [...p.querySelectorAll('.mm-mol .mm-lbl')]).slice(0, 5).map((b) => b.textContent);`);
    const asIs = await order();
    await g.ev(`document.querySelector('#lwMenu .mm-sort[data-sort="name"]').click(); return 1;`); const az = await order();
    await g.ev(`document.querySelector('#lwMenu .mm-sort[data-sort="name"]').click(); return 1;`); const za = await order();
    await g.ev(`document.querySelector('#lwMenu .mm-sort[data-sort="mass"]').click(); return 1;`); const heavy = await order();
    await wait(900);
    info = { asIs, az, za, heavy, search: await g.ev(`const s = document.querySelector('#lwMenu .mm-opts .mm-search'), b = s.getBoundingClientRect(), t = document.querySelector('#lwMenu .mm-tabs').getBoundingClientRect();
      return { shown: getComputedStyle(s).display, centreX: Math.round(b.left + b.width / 2), tabsCentreX: Math.round(t.left + t.width / 2), belowTabs: b.top >= t.bottom }; `),
      buttons: await g.ev(`return [...document.querySelectorAll('#lwMenu .mm-sort')].map((b) => b.getAttribute("aria-label"));`) };
  } else if (scene === 'register') {
    await g.ev(`__LW.chem.setOn(true); return 1;`);
    await g.waitFor('document.querySelector(".mol-reg canvas.mol-c")?.clientHeight > 0', 300, 100);
    await g.ev(`__LW.layout.raise('chem'); __LW.layout.popOut('chem', { x: 560, y: 40, w: 340 }); return 1;`); await wait(1500);
    info = await g.ev(`const c = document.querySelector('.mol-reg canvas.mol-c'), r0 = document.querySelector('.mol-r0'), card = document.querySelector('.dev[data-id="chem"]').getBoundingClientRect();
      return { ladderH: c.clientHeight, r0: r0 ? { kids: r0.children.length, shown: getComputedStyle(r0).display } : null, card: [card.left, card.top, card.width, card.height].map(Math.round) };`);
  }
  writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ scene, OUT, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
