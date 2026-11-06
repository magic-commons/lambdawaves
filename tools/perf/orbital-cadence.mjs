/* tools/perf/orbital-cadence.mjs — 038 C2's proof: a TIMELINE clip sweeping `chem.orbital` over benzene's ladder (STO-3G, 36 orbitals), the
 * orbital the card holds sampled every frame while the clip plays, against the orbital the clip says at that beat.
 *
 *   python3 tools/gate/server.py "$PWD" 9697 &
 *   LW_PORT=9697 GD_PORT=5697 node tools/perf/orbital-cadence.mjs [seconds=2] [rungs=36]
 *
 * Prints one JSON line over `seconds` of play (the transport loops the clip; its wrap is not counted as a step): frames, the fps, the clip's
 * own steps a second, the applied steps a second, the rungs visited of those the clip crossed, the jumps (a frame that moved more than one
 * rung) and the worst lag in rungs. */
import { open } from '../gate/gatekit.mjs';
const PORT = process.env.LW_PORT || 9697;
const SECS = Number(process.argv[2]) || 2, RUNGS = Number(process.argv[3]) || 36;
const g = await open(`https://127.0.0.1:${PORT}/lab/?warn=0`, { width: 1500, height: 1000, script: 240000 });
try {
  const boot = await g.waitFor('window.__LW && __LW.ready && __LW.timeline', 600, 100);
  const solved = await g.ev(`const t0 = performance.now(), C = __LW.chem; await C.solve('C6H6'); C.setOn(true); C.setView('orbital'); await __LW.settle();
    await new Promise((r) => setTimeout(r, 800)); return { ms: Math.round(performance.now() - t0), preset: C.preset(), span: C.span(), on: C.on, view: C.view };`);
  const placed = await g.ev(`const C = __LW.chem, tl = __LW.timeline, M = __LW.mod.model, [lo, hi] = C.span(), top = Math.min(hi, lo + ${RUNGS} - 1);
    const beats = ${SECS} * M.transport.bpm / 60, id = tl.model.create({ targetId: 'chem.orbital', value: 0, start: 0, duration: beats });
    const clip = tl.model.state().clips.find((c) => c.id === id), u = (k) => (k - lo) / (hi - lo);
    const ok = tl.model.updateCurve(clip.curveId, { points: [{ t: 0, v: u(lo), tension: 0 }, { t: 1, v: u(top), tension: 0 }] });
    tl.controller.seek(0); await __LW.settle(); await new Promise((r) => setTimeout(r, 400));
    window.__cad = { beats, lo, hi, top }; return { id, ok, beats, bpm: M.transport.bpm, lo, hi, top, k: C.orbital() };`);
  const r = await g.ev(`const C = __LW.chem, tl = __LW.timeline, M = __LW.mod.model, R = __LW.mod.host.registry, { beats, lo, top } = window.__cad, S = [];
    await new Promise((done) => { __LW.mod.play(); const t0 = performance.now();
      const look = () => { const b = M.transport.beats, ms = performance.now() - t0, want = R.fromNorm('chem.orbital', tl.automation('chem.orbital', Math.min(b, beats - 1e-9)));
        S.push({ ms, b, k: C.orbital(), want });
        if (ms < ${SECS} * 1000) requestAnimationFrame(look); else done(); };
      requestAnimationFrame(look); });
    __LW.mod.stop();
    const run = S.filter((s) => s.b > 0); if (run.length < 2) return { stalled: true, samples: S.length, first: S[0], last: S.at(-1) };
    const secs = (run.at(-1).ms - run[0].ms) / 1000, wrap = (d) => d > (top - lo) / 2;   // the transport loops the clip: its wrap is not a step
    let jumps = 0, moves = 0, wantMoves = 0, lag = 0; const seen = new Set(run.map((s) => s.k)), crossed = new Set(run.map((s) => s.want));
    for (let i = 1; i < run.length; i++) { const d = Math.abs(run[i].k - run[i - 1].k), dw = Math.abs(run[i].want - run[i - 1].want);
      if (d && !wrap(d)) moves++; if (dw && !wrap(dw)) wantMoves++; if (d > 1 && !wrap(d)) jumps++; }
    for (const s of run) { const d = Math.abs(s.k - s.want); if (!wrap(d)) lag = Math.max(lag, d); }
    return { sweep: [lo, top], frames: run.length, secs: +secs.toFixed(2), fps: +(run.length / secs).toFixed(1), clipStepsPerSec: +(wantMoves / secs).toFixed(1),
      appliedStepsPerSec: +(moves / secs).toFixed(1), visited: seen.size, crossed: crossed.size, jumps, worstLagRungs: lag, last: { k: run.at(-1).k, want: run.at(-1).want } };`);
  console.log(JSON.stringify({ boot: boot.ok, solved, placed, ...r }));
} finally { await g.close(); }
