/* readers91.mjs — LANE B: the two default readers on the widest state (91 labels), timed directly.
 *   LW_PORT=8721 GD_PORT=5232 node research/optimization-2026-09-24/probes/B/readers91.mjs
 * spectrum.update with DIALS closed (the shipped fold) vs open; shadow.update; the ink read on a clean and a dirty style. */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const g = await open('https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0', { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const r = await g.ev(`const L=__LW; L.pause(); L.loadPreset('1s'); for(let a=0;a<91;a++) L.reg.set(a,1,0,0); L.reg.normalize(); L.schedule(4);
    for (let i=0;i<60 && L.spectrum.building;i++) await L.settle();
    const T=(f,n)=>{ for(let i=0;i<3;i++) f(0); const t0=performance.now(); for(let i=0;i<n;i++) f(i); return +((performance.now()-t0)/n).toFixed(4); };
    const ids=L.reg.populated(); const out={ lanes:L.spectrum.lanes.size, dialsOpen:L.spectrum.dials };
    out.spectrumUpdateDialsClosedMs = T((i)=>{ const t=1+i*0.01; L.spectrum.update(L.reg.at(t), t); }, 200);
    L.spectrum.setDials(true); await L.settle();
    out.spectrumUpdateDialsOpenMs = T((i)=>{ const t=2+i*0.01; L.spectrum.update(L.reg.at(t), t); }, 200);
    L.spectrum.setDials(false); await L.settle();
    out.shadowUpdate91Ms = T((i)=>{ const t=3+i*0.01; L.shadowView.update(L.reg.at(t), t, ids, -1); }, 200);
    out.inkReadCleanUs = +(T(()=>L.ink.css('--fg'), 2000)*1000).toFixed(2);
    const st=document.body.style; out.inkReadAfterStyleWriteUs = +(T((i)=>{ st.setProperty('--lb-probe', String(i)); return L.ink.css('--fg'); }, 500)*1000).toFixed(2);
    st.removeProperty('--lb-probe');
    const cv=document.querySelector('.dev[data-id="shadow"] canvas'); out.canvasClientWidthAfterWriteUs = cv ? +(T((i)=>{ st.setProperty('--lb-probe', String(i)); return cv.clientWidth; }, 500)*1000).toFixed(2) : null;
    st.removeProperty('--lb-probe');
    L.loadPreset('1s+2pz'); await L.settle(); return out;`);
  console.log(JSON.stringify(r));
  fs.writeFileSync('research/optimization-2026-09-24/probes/B/readers91.json', JSON.stringify(r, null, 1));
} finally { await g.close(); }
