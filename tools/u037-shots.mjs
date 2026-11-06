/* u037-shots.mjs — iteration 037 chain U's pictures and its one light check per row (a diagnostic, not a gate): THE DECKS, THE TUTORIAL PLAYER.
 *   LW_PORT=9699 GD_PORT=5699 node tools/u037-shots.mjs <scene> [out-dir]
 * Scenes: decks (the two tabs, deck II's pane) · player (dark and light, a hover title, a choice, the keys) · narrow (the strip under the
 * player at U_W × U_H, e.g. 900 × 1000 and 500 × 900 — headless Firefox opens no narrower than 500) · two (deck II's quiet face).  JPEGs into <out-dir> (default .tmp/U-shots); the readings as JSON. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { open } from './gate/gatekit.mjs';
import * as drv from './gate/drv.mjs';

const scene = process.argv[2] || 'decks', DIR = process.argv[3] || '.tmp/U-shots', PORT = process.env.LW_PORT || 9699;
mkdirSync('.tmp', { recursive: true }); mkdirSync(DIR, { recursive: true });
const W = +(process.env.U_W || 1600), H = +(process.env.U_H || 914);
const g = await open(`https://127.0.0.1:${PORT}/lab/?menu=1&warn=0`, { width: W, height: H, prefs: { 'ui.primaryPointerCapabilities': 6, 'ui.allPointerCapabilities': 6 } });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (k) => drv.actions(g.s, [{ type: 'key', id: 'k', actions: [{ type: 'keyDown', value: k }, { type: 'keyUp', value: k }] }]);
const move = (x, y) => drv.actions(g.s, [{ type: 'pointer', id: 'p', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(x), y: Math.round(y) }] }]);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round);`);
const mid = (r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
const theme = async (t) => { await g.ev(`__LW.setTheme(${JSON.stringify(t)}); return 1;`); await wait(900); };
async function shot(name, box, pad = 8, width = 1000) {
  const png = `.tmp/u-${name}.png`, jpg = `${DIR}/037-${name}.jpg`; writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
  execFileSync('python3', ['-I', '-c', `import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); b = sys.argv[3]; w = int(sys.argv[4])
if b != '-': im = im.crop(tuple(int(v) for v in b.split(',')))
if im.width > w: im = im.resize((w, round(im.height * w / im.width)))
im.save(sys.argv[2], quality=80)`, png, jpg, box ? box.map((v, i) => Math.max(0, v + (i < 2 ? -pad : pad))).join(',') : '-', String(width)]);
  return jpg;
}
/* the tutorial's reading: the head's words, the deck shown, the player's parts and their boxes */
const read = () => g.ev(`const t = document.querySelector('#lwMenu .mm-tut'), q = (s) => t.querySelector(s), box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
  const shown = [...t.querySelectorAll('[data-deck]:not(.seg-b)')].find((p) => !p.hidden);
  const P = shown && shown.querySelector('.mm-player-main'), vid = P && [...P.querySelectorAll('.mm-art-hero')].pop();
  return { sec: document.getElementById('lwMenu').dataset.sec, head: q('.mm-tut-head').textContent, tabs: [...t.querySelectorAll('.mm-tut-head .seg-b')].map((b) => ({ deck: b.dataset.deck, on: b.classList.contains('on'), text: b.textContent })),
    deck: shown && shown.dataset.deck, main: box(P), clips: P ? P.querySelectorAll('.mm-player-clip').length : 0, cap: box(shown && shown.querySelector('.mm-player-cap')), capText: shown && shown.querySelector('.mm-player-cap') ? shown.querySelector('.mm-player-cap').textContent : null,
    list: box(shown && shown.querySelector('.mm-player-list')), tiles: shown ? [...shown.querySelectorAll('.mm-player-tile')].filter((b) => !b.hidden).length : 0,
    video: vid ? { src: vid.getAttribute('src'), paused: vid.paused, on: vid.classList.contains('on'), w: vid.videoWidth, h: vid.videoHeight } : null,
    titles: shown ? [...shown.querySelectorAll('.mm-player-title')].filter((s) => +getComputedStyle(s).opacity > .5).map((s) => s.textContent) : [],
    focus: document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.className) };`);
const out = {};
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up: ' + JSON.stringify((await g.errors()).errs));
  await g.waitFor(`!!document.querySelector('#lwMenu .mm-face:not([hidden])')`, 100, 100);
  await wait(1200); out.tap = await g.tap('.mm-face:not([hidden]) .mm-door[data-door="tutorial"]'); await wait(1400);
  out.open = await read();
  if (scene === 'decks') {
    out.shotI = await shot('U1-decks-I', null, 0, 1000);
    out.tapII = await g.tap('#lwMenu .mm-tut-head .seg-b[data-deck="two"]'); await wait(500);
    out.II = await read(); out.shotII = await shot('U1-decks-II', null, 0, 1000);
  }
  if (scene === 'player') {
    const playing = () => g.waitFor(`(() => { const v = [...document.querySelectorAll('#lwMenu .mm-player:not([hidden]) .mm-art-hero')].pop(); return v && !v.paused && v.currentTime > 0.4; })()`, 100, 100);
    for (const t of ['dark', 'light']) {
      await theme(t); out[t + 'Playing'] = await playing(); out[t] = await read();
      out[t + 'Shot'] = await shot(`U2-player-${t}`, null, 0, 1000);
    }
    /* a hover over the third tile: its title alone rises */
    const r3 = await rectOf('#lwMenu .mm-player:not([hidden]) .mm-player-tile:not([hidden]):nth-of-type(4)');
    await move(...mid(r3)); await wait(400); out.hover = await read();
    out.hoverShot = await shot('U2-hover-title-light', [r3[0] - 130, r3[1] - 30, r3[2] + 130, r3[3] + 30], 0, 700);
    /* a press on it: the clip cross-fades to its row, the tile leaves the scroller */
    const before = out.hover.video && out.hover.video.src;
    await g.tap('#lwMenu .mm-player:not([hidden]) .mm-player-tile:not([hidden]):nth-of-type(4)'); await wait(120);
    out.midFade = await read(); await wait(500); out.chosen = await read();
    out.swapped = { before, after: out.chosen.video && out.chosen.video.src, clipsMid: out.midFade.clips, clipsAfter: out.chosen.clips };
    /* the keys: → one tile, ↓ a row, Enter plays */
    await g.ev(`document.querySelector('#lwMenu .mm-player:not([hidden]) .mm-player-tile:not([hidden])').focus(); return 1;`);
    const at = () => g.ev(`const vis = [...document.querySelectorAll('#lwMenu .mm-player:not([hidden]) .mm-player-tile:not([hidden])')]; return vis.indexOf(document.activeElement);`);
    out.keys = { start: await at() };
    await key(''); out.keys.right = await at();
    await key(''); out.keys.down = await at();
    await key(''); out.keys.up = await at();
    const want = await g.ev(`return document.activeElement.getAttribute('aria-label');`);
    await key(''); await wait(500); out.keys.enter = { want, playing: (await read()).video, focus: (await read()).focus };
    out.dark2 = (await theme('dark'), await shot('U2-chosen-dark', null, 0, 1000));
  }
  if (scene === 'narrow') {
    out.strip = await read(); out.stripShot = await shot(`U2-narrow-${W}`, null, 0, Math.min(W, 1000));
  }
  if (scene === 'two') {
    for (const t of ['dark', 'light']) {
      await theme(t); await g.tap('#lwMenu .mm-tut-head .seg-b[data-deck="two"]'); await wait(500);
      out[t] = await read(); out[t + 'Shot'] = await shot(`U3-deck-II-${t}`, null, 0, 1000);
      out[t + 'Heroes'] = await g.ev(`return [...document.querySelectorAll('#lwMenu .mm-tut .mm-art-hero')].map((v) => ({ src: v.getAttribute('src'), paused: v.paused })).concat([{ ground: getComputedStyle(document.querySelector('#lwMenu .mm-player[data-deck="two"] .mm-player-main')).backgroundImage.slice(0, 40) }]);`);
      await g.tap('#lwMenu .mm-tut-head .seg-b[data-deck="one"]'); await wait(500); out[t + 'Back'] = await read();
    }
  }
  out.errors = await g.errors();
} finally { await g.close(); }
console.log(JSON.stringify(out, null, 1));
