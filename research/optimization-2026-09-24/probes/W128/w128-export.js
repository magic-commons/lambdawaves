/* probes/W128/w128-export.js — gate 4 of wave 128: an exact export (captureUI.exact, 3 frames 160×90, stored deflate) with
 * AUTO SCALE ON and the GOVERNOR ON must give the same frame digests on the base and the built tree — render-exact's H2 pin
 * (pause + governor.on = false) and H3 pin (quality.auto = false) hold both levers of the one controller.
 *   E1  1s+2pz at 96³, paused, autoScale forced to 0.5
 *   E2  the axial gas in the BOX at 128³ (gas table as shipped), paused, autoScale forced to 0.5
 *   E3  the axial gas at 128³ with the table OFF, PLAYED 6 s so the controller acts, exported while playing (the pins pause it):
 *       the digests AND the state the export met (grid, stepCap, autoScale) — the base's step rung leaves field.stepCap set,
 *       which no render-exact pin covers; the built tree has no step rung.
 *   Firefox: LW_PORT=<port> GD_PORT=5254 node research/optimization-2026-09-24/probes/A/run.mjs <this> <out> */
const LW = __LW, F = LW.field, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exp = async (label) => {
  const at = { res: F.resolution, stepCap: F.stepCap === Infinity ? 'inf' : F.stepCap, autoScale: LW.quality.autoScale, drop: LW.governor.drop, playing: LW.clock.playing };
  const sched = { N: 3, fps: 12, mode: 'given', at: (k) => k * 0.25, off: (k) => k * 0.25 };
  const r = await LW.captureUI.exact.render({ schedule: sched, width: 160, height: 90, deflate: 'stored', label }).done;
  return r.ok ? { ok: true, at, digests: r.manifest.frames.map((f) => f.digest).join(','), after: { auto: LW.quality.auto, gov: LW.governor.on } } : { ok: false, at, err: r.message || r.error };
};
const out = {};
LW.governor.on = true; LW.quality.auto = true;
LW.loadPreset('1s+2pz'); LW.pause(); LW.quality.res = 96; LW.quality.steps = 160; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
LW.quality.autoScale = 0.5; out.E1 = await exp('w128-e1');
LW.governor.on = true; LW.quality.auto = true;
LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.enterBox(); LW.pause(); LW.quality.res = 128; LW.quality.steps = 240; LW.quality.scale = 1; LW.schedule(4); await LW.settle(); await LW.settle();
for (let i = 0; i < 400 && LW.gasTable() === 'building'; i++) await sleep(25);
LW.quality.autoScale = 0.5; out.E2 = await exp('w128-e2'); out.E2.table = LW.gasTable();
LW.governor.on = true; LW.quality.auto = true; LW.quality.autoScale = 1;
LW.gasTable(false); for (let i = 0; i < 100 && LW.gasTable() !== 'off'; i++) await sleep(10);
if (!LW.uiHidden) LW.keys.toggleUI();
LW.enterBox(); LW.pause(); LW.schedule(4); await LW.settle(); await LW.settle();
LW.play(); await sleep(6000);
out.E3 = await exp('w128-e3');
LW.pause(); await LW.settle();
if (LW.uiHidden) LW.keys.toggleUI();
out.errs = (window.__e || []).map(String).slice(0, 5);
return out;
