/* probes/AS/as-serialize.js — the saved-project bytes are untouched by AS (2026-09-25): __LW.serialize() of the booted
 * default, paused, the camera stilled, hashed (FNV-1a over the JSON, presentation.layout.at — a wall-clock stamp — zeroed);
 * autoScale at 0.5 is written as the live value (projectSnapshot writes 1), and back at 1 the bytes are the boot's.
 *   Firefox: LW_PORT=<port> GD_PORT=5249 node research/optimization-2026-09-24/probes/A/run.mjs <this> <out> */
const LW = __LW;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
LW.pause(); LW.camera.setAutoRotate(false); LW.camera.stop(); await LW.settle();
const ser = () => { const d = LW.serialize(); if (d.presentation && d.presentation.layout) d.presentation.layout.at = 0; return JSON.stringify(d); };   // layout.at is a wall-clock stamp
const a = ser();
const out = { boot: { hash: H(a), bytes: a.length, qualityKeys: Object.keys(JSON.parse(a).presentation.quality).join(',') } };
LW.quality.auto = true; LW.quality.autoScale = 0.5; LW.pause(); await LW.settle();
out.atHalf = { autoScaleWritten: JSON.parse(JSON.stringify(LW.serialize())).presentation.quality.autoScale };
LW.quality.autoScale = 1; await LW.settle();
const b = ser();
out.again = { hash: H(b), same: a === b };
return out;
