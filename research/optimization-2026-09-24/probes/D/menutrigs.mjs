/* menutrigs.mjs — FE1's storage half: which element does FILE › "SAVE the experiment (quick)" / "LOAD the last quick
 * save" / "COPY as JSON" / "COPY a LINK" actually press (clickTrig = the FIRST .trig with that exact text, document
 * order), on a first visit and with the modulation window open, and what storage each press writes.
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/menutrigs.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || '8721'}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const probe = `const who = (label) => [...document.querySelectorAll('.trig')].filter((t) => t.textContent.trim() === label)
      .map((t) => (t.closest('.dev') ? t.closest('.dev').dataset.id : t.closest('#modwin, .mir-modwindow') ? 'modwindow' : t.closest('#transport') ? 'transport' : (t.parentElement && t.parentElement.className) || '?'));
    return Object.fromEntries(['SAVE', 'LOAD', 'COPY JSON', 'COPY LINK'].map((l) => [l, who(l)]));`;
  const first = await g.ev(probe);
  await g.ev(`__LW.layout.modulation.expand(); await new Promise(r => setTimeout(r, 300)); return 1;`);
  const modOpen = await g.ev(probe);
  /* press the quick SAVE through the real trigger path and read which keys moved */
  const effect = await g.ev(`const keys0 = Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k).length]));
    const b = [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === 'SAVE'); b.click();
    const keys1 = Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k).length]));
    return { changed: Object.keys(keys1).filter((k) => keys0[k] !== keys1[k]) };`);
  console.log(JSON.stringify({ firstVisit: first, modulationOpen: modOpen, quickSaveWrote: effect }));
} finally { await g.close(); }
