/* s-shots.mjs — iteration 015 chain S's pictures (a diagnostic, not a gate).
 *   LW_PORT=9621 GD_PORT=5321 node tools/s-shots.mjs <scene> [out.png]
 * Scenes: spectrum (SPECTRUM floated, the picker open, HAMILTONIAN's fold open; prints the group's height per system and the body order) ·
 * fill (the FILL ALL / EMPTY buttons of SPECTRUM, ORBITAL and STATES; SPECTRUM's twice, empty and filled) · preset (one user save, the list open).
 * Writes a PNG (the driver's composite); python turns it to a small JPEG. Prints what the scene measured. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'spectrum', OUT = process.argv[3] || `.tmp/s-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9621}/lab/?starter=home`, { width: 1600, height: 1750 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const float = (id, x, y, w) => g.ev(`__LW.layout.reopen(${JSON.stringify(id)}); __LW.layout.raise(${JSON.stringify(id)}); __LW.layout.popOut(${JSON.stringify(id)}, { x: ${x}, y: ${y}, w: ${w} });
  await new Promise((r) => setTimeout(r, 300)); const d = document.querySelector('.dev[data-id=${JSON.stringify(id)}]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); return 1;`);
/* the HAMILTONIAN group: the body's `.grp` that holds the ‹ SYSTEM › stepper */
const HAM = `const d = document.querySelector('.dev[data-id="spectrum"]'), grp = [...d.querySelectorAll('.dev-body > .grp')].find((x) => x.querySelector('[aria-label="SYSTEM"]'));`;
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  let info = null;
  if (scene === 'spectrum') {
    await float('spectrum', 560, 10, 320); await wait(800);
    info = await g.ev(`${HAM} const add = [...d.querySelectorAll('.sp-head .trig')].find((b) => /MODE/.test(b.textContent));
      if (add && !add.classList.contains('on')) add.click();
      const f = d.querySelector('.lw-fold[data-fold="ham"]'); if (f && f.getAttribute('aria-expanded') !== 'true') f.click();
      await new Promise((r) => setTimeout(r, 400));
      const body = d.querySelector('.dev-body'), kids = [...body.children].filter((k) => !k.hidden && getComputedStyle(k).display !== 'none').map((k) => k.tagName.toLowerCase() + '.' + [...k.classList].slice(0, 3).join('.'));
      return { order: kids, fold: !!f, card: Math.round(d.getBoundingClientRect().height) };`);
    info.groupH = {};
    for (const id of ['atom', 'well', 'hydrogen', ...(process.env.SYS ? [process.env.SYS] : [])]) {   // SYS=well: the picture under that system
      await g.ev(`__LW.setHamiltonian(${JSON.stringify(id)}); return 1;`); await wait(700);
      info.groupH[id] = await g.ev(`${HAM} const r = grp.getBoundingClientRect(), row = [...grp.querySelectorAll('.sp-ham-body > .row')].filter((x) => !x.hidden && x.offsetHeight).pop();
        return [Math.round(r.height), row ? [...row.children].filter((c) => c.offsetWidth).map((c) => c.className.split(' ')[0] + ':' + c.offsetWidth).join(' ') + ' | row ' + row.clientWidth : ''];`);
    }
    await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; return 1;`); await wait(300);   // the picture is the card's
  } else if (scene === 'preset') {   // S4: 1s + 2p_z saved as MY DIPOLE, another preset loaded, then MY DIPOLE from the list; the list left open for the picture
    await float('spectrum', 560, 10, 320); await wait(800);
    info = await g.ev(`const d = document.querySelector('.dev[data-id="spectrum"]'), w = (ms) => new Promise((r) => setTimeout(r, ms));
      d.querySelector('.sp-presave').click(); await w(100); const f = d.querySelector('.sp-prename'), asked = f ? f.value : null;
      f.value = 'MY DIPOLE'; f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await w(200);
      const stored = localStorage.getItem('lambdawaves.q0.presets'), shown = d.querySelector('.sp-preset .mir-step-text').textContent;
      __LW.ui ? 0 : 0; d.querySelector('.sp-preset .mir-step-name').click(); await w(200);
      const pick = (id) => { const b = document.querySelector('.mir-pick-i[data-id="' + id + '"]'); if (b) b.click(); return !!b; };
      pick('3dz2'); await w(400); const after3d = __LW.reg.populated().length;
      d.querySelector('.sp-preset .mir-step-name').click(); await w(200); const rows = [...document.querySelectorAll('.mir-pick-i')].map((b) => b.dataset.id);
      pick('user:MY DIPOLE'); await w(500); const back = __LW.reg.populated(), provenance = __LW.reg.preset, value = d.querySelector('.sp-preset .mir-step-text').textContent;
      const s = d.querySelector('.sp-presave').getBoundingClientRect();
      return { asked, stored, shown, after3d, rows: rows.slice(0, 5), back, provenance, value, save: [s.left, s.top, s.width, s.height].map(Math.round) };`);
    await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; return 1;`); await wait(300);
    writeFileSync(OUT.replace(/\.png$/, '-a.png'), Buffer.from(await g.snap(), 'base64'));   // the row: ‹ MY DIPOLE › and the glyph
    await g.ev(`document.querySelector('.dev[data-id="spectrum"] .sp-preset .mir-step-name').click(); return 1;`); await wait(400);
  } else if (scene === 'palette') {   // P3: the current stops saved as MY SEA, another preset picked, MY SEA picked back; the list left open for the picture
    await float('palette', 560, 10, 320); await wait(800);
    info = await g.ev(`const d = document.querySelector('.dev[data-id="palette"]'), w = (ms) => new Promise((r) => setTimeout(r, ms)), nm = () => d.querySelector('.mir-ramp-step .mir-step-name');
      const stops0 = JSON.stringify(__LW.palette.stops); d.querySelector('.mir-ramp-presets .sp-presave').click(); await w(100);
      const f = d.querySelector('.sp-prename'), asked = f ? f.value : null; f.value = 'MY SEA'; f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await w(300);
      const stored = localStorage.getItem('lambdawaves.q0.palettes'), shown = nm().textContent.trim();
      const pick = (id) => { nm().click(); const b = document.querySelector('.mir-pick-i[data-id="' + id + '"]'); if (b) b.click(); return !!b; };
      nm().click(); await w(200); const rows = [...document.querySelectorAll('.mir-pick-i')].slice(0, 4).map((b) => b.dataset.id + ':' + (b.querySelector('.pal-strip') ? Math.round(b.querySelector('.pal-strip').getBoundingClientRect().left) : '-')); nm().click(); await w(200);
      const other = __LW.palette.groups[0].items.find((id) => id !== __LW.palette.id); pick(other); await w(400); const changed = JSON.stringify(__LW.palette.stops) !== stops0;
      pick('user:MY SEA'); await w(400); const back = JSON.stringify(__LW.palette.stops) === stops0, id = __LW.palette.id, link = __LW.palette.id.startsWith('user:');
      const s = d.querySelector('.mir-ramp-presets .sp-presave').getBoundingClientRect();
      return { asked, stored: stored && stored.slice(0, 80), shown, rows, changed, back, id, userIdLeaks: link, save: [s.left, s.top, s.width, s.height].map(Math.round) };`);
    await g.ev(`const t = document.getElementById('transport'); if (t) t.style.visibility = 'hidden'; return 1;`); await wait(300);
    writeFileSync(OUT.replace(/\.png$/, '-a.png'), Buffer.from(await g.snap(), 'base64'));
    await g.ev(`document.querySelector('.dev[data-id="palette"] .mir-ramp-step .mir-step-name').click(); return 1;`); await wait(400);
  } else if (scene === 'fill') {
    /* SPECTRUM's button as it stands (1s + 2p: EMPTY), then pressed (FILL ALL); then the register's ORBITAL pane on water — each shot's rect printed */
    const read = () => g.ev(`return [...document.querySelectorAll('.reg-fill')].filter((b) => b.getBoundingClientRect().width).map((b) => { const r = b.getBoundingClientRect();
      return { state: b.dataset.state, aria: b.getAttribute('aria-label'), help: b.dataset.help || b.title, rect: [r.left, r.top, r.width, r.height].map(Math.round) }; });`);
    await float('spectrum', 40, 10, 320); await wait(800);
    info = { a: await read() }; writeFileSync(OUT.replace(/\.png$/, '-a.png'), Buffer.from(await g.snap(), 'base64'));
    await g.ev(`document.querySelector('.dev[data-id="spectrum"] .reg-fill').click(); return 1;`); await wait(600);
    info.b = await read(); writeFileSync(OUT.replace(/\.png$/, '-b.png'), Buffer.from(await g.snap(), 'base64'));
    await g.ev(`__LW.chem.setOn(true); return 1;`);
    await g.waitFor('document.querySelector(".mol-reg canvas.mol-c")?.clientHeight > 0', 300, 100);
    await float('chem', 1000, 10, 340); await wait(1500);
    info.c = await read();
  }
  writeFileSync(OUT, Buffer.from(await g.snap(), 'base64'));
  console.log(JSON.stringify({ scene, OUT, info, errors: (await g.errors()).errs }, null, 1));
} finally { await g.close(); }
