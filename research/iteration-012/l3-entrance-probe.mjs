/* research/iteration-012/l3-entrance-probe.mjs — iteration 012 L3 · the first run's time-to-last-tile, in a fresh headless Firefox profile.
 *   LW_PORT=9501 GD_PORT=5301 node research/iteration-012/l3-entrance-probe.mjs [runs] [--tab]
 * A human start (?opener=1): the photosensitivity notice, a real press on CONTINUE (t0, the press), then the MOLECULAR deck's first page:
 * t1 = every tile visible (computed opacity 1 on the tile and its picture) AND every picture decoded; `pics` = when every picture of the page had loaded.  --tab presses the MOLECULAR tab right
 * after CONTINUE (the old Picker opened on ATOMIC: a new reader had to go there).  Prints one JSON line per run and the median. */
import { open } from '../../tools/gate/gatekit.mjs';

const runs = Number(process.argv[2]) || 3, TAB = process.argv.includes('--tab');
const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 9501}/lab/?opener=1`;
const NOTICE = '.mir-dialog[data-kind="notice"]', CONTINUE = NOTICE + ' .trig[data-kind="primary"]';
const out = [];
for (let r = 0; r < runs; r++) {
  const g = await open(URL_, { width: 1920, height: 1080, script: 120000 });
  try {
    await g.waitFor(`document.querySelector('${CONTINUE}')`, 300, 100);
    await g.ev(`await new Promise((r) => setTimeout(r, 1500)); addEventListener('pointerdown', () => { window.__t0 = performance.now(); }, { capture: true, once: true }); return 1;`);
    const tap = await g.tap(CONTINUE); if (!tap.ok) throw new Error('CONTINUE: ' + JSON.stringify(tap));
    const res = await g.ev(`
      const tab = ${TAB}; let pressed = false, pics = null;
      for (let i = 0; i < 400; i++) {
        const m = document.getElementById('lwMenu');
        if (tab && !pressed && m && !m.hidden) { const b = document.querySelectorAll('#lwMenu .mm-tab')[1]; if (b) { b.click(); pressed = true; } }
        const page = document.querySelector('#lwMenu .mm-molecular .mm-page');
        const tiles = page ? [...page.children] : [];
        const r = page && page.getBoundingClientRect();
        if (pics == null && tiles.length && tiles.every((t) => { const p = t.querySelector('.mm-pic'); return p && p.complete && p.naturalWidth > 0; })) pics = Math.round(performance.now() - window.__t0);
        const ok = m && !m.hidden && tiles.length && r.top >= 0 && r.top < innerHeight && tiles.every((t) => { const p = t.querySelector('.mm-pic'); return +getComputedStyle(t).opacity >= 0.999 && p && p.complete && p.naturalWidth > 0 && +getComputedStyle(p).opacity >= 0.999 && !p.getAnimations().length && !t.getAnimations().length; });
        if (ok) return { ms: Math.round(performance.now() - window.__t0), pics, tiles: tiles.length };
        await new Promise((r) => setTimeout(r, 20));
      }
      return { ms: null };`);
    out.push(res); console.log(JSON.stringify({ run: r + 1, tab: TAB, ...res }));
  } finally { await g.close(); }
}
const ms = out.map((o) => o.ms).filter((x) => x != null).sort((a, b) => a - b);
console.log(JSON.stringify({ median: ms[Math.floor(ms.length / 2)] ?? null, all: ms, tab: TAB }));
