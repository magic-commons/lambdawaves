/* w129-nb.mjs — W129-4's gate: the notebook's remembered size (settings nbW/nbH, abW/abH), on the three roads that write it.
 *   closedOpen  a returning browser (nbW/nbH 500 × 400 stored) opens a project whose layout sizes the notebook 470 × 670
 *               while the notebook is CLOSED: what the settings key holds after, and the size the notebook reopens at;
 *   saves       the notebook open, five saves through each writer (the desktop resize's pointerup, layout.notebookResize
 *               with the size it already has, a project save + open): the stored size and the style after each;
 *   reopen      an existing stored size (500 × 400, and the ABOUT face's 470 × 670) reopens at exactly those pixels;
 *   carried     another preference change after a save keeps nbW/nbH/abW/abH (the abkeys law, M4).
 *   LW_PORT=8744 GD_PORT=5255 node research/optimization-2026-09-24/probes/W129/w129-nb.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import { go } from '../../../../tools/gate/drv.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8744', TAG = process.argv[2] || 'run';
const url = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`;
const KEY = 'lambdawaves.q0.settings';
const g = await open(url, { width: 1600, height: 1000, script: 600000 });
let out = null;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  await g.ev(`localStorage.setItem('${KEY}', JSON.stringify({ warned: true, nbW: 500, nbH: 400, abW: 470, abH: 670 })); return 1;`);
  await go(g.s, url);
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out = await g.ev(`
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), LW = __LW, P = LW.projects, nb = document.getElementById('notebook');
    LW.pause(); await LW.settle();
    const S = () => { const s = LW.settings; return [s.nbW, s.nbH, s.abW, s.abH]; };
    const box = () => ({ style: [nb.style.width, nb.style.height], offset: [nb.offsetWidth, nb.offsetHeight], rect: [Math.round(nb.getBoundingClientRect().width * 10) / 10, Math.round(nb.getBoundingClientRect().height * 10) / 10], boxSizing: getComputedStyle(nb).boxSizing, border: getComputedStyle(nb).borderLeftWidth });
    const out = { boot: { hidden: nb.hidden, stored: S() } };
    /* closedOpen */
    const dancer = await (await fetch('demos/wave-dancer.lambdawaves.json')).text();
    const pd = P.importText(dancer); P.open(pd); await LW.settle(); await sleep(300);
    out.closedOpen = { hidden: nb.hidden, storedAfterOpen: S(), layoutNb: JSON.parse(dancer).data.presentation.layout.nb };
    LW.layout.notebook.open('notes'); await sleep(100);
    out.closedOpen.reopened = box(); out.closedOpen.storedAfterReopen = S();
    /* saves */
    const up = () => nb.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    const rows = { pointerup: [], notebookResize: [], project: [] };
    for (let i = 0; i < 5; i++) { up(); rows.pointerup.push({ stored: S(), style: nb.style.width + ' ' + nb.style.height }); LW.layout.notebook.close && LW.layout.notebook.close(); LW.layout.notebook.open('notes'); }
    for (let i = 0; i < 5; i++) { const w = parseInt(nb.style.width, 10), h = parseInt(nb.style.height, 10); LW.layout.notebookResize(w, h); rows.notebookResize.push({ stored: S(), style: nb.style.width + ' ' + nb.style.height }); }
    for (let i = 0; i < 5; i++) { P.save('w129/nb'); const p = 'w129/nb'; P.open(p); await LW.settle(); rows.project.push({ stored: S(), style: nb.style.width + ' ' + nb.style.height, fileNb: JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items[p].data.presentation.layout.nb }); }
    out.saves = rows; out.savesBox = box();
    /* reopen of an existing stored size, and the ABOUT face */
    localStorage.setItem('${KEY}', JSON.stringify({ ...LW.settings, nbW: 500, nbH: 400, abW: 470, abH: 670 }));
    LW.layout.notebook.close && LW.layout.notebook.close(); LW.layout.notebook.open('notes'); await sleep(50); out.reopenNotes = box();
    LW.layout.notebook.open('about'); await sleep(50); out.reopenAbout = box(); up(); out.aboutAfterUp = S();
    LW.layout.notebook.open('notes'); await sleep(50);
    /* carried by another preference change */
    LW.setTheme('dark'); LW.saveSettings(); out.carried = S();
    out.errs = (window.__e || []).map(String).slice(0, 5);
    return out;`);
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { await g.close(); }
fs.writeFileSync(new URL(`./w129-nb.${TAG}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
