/* research/release-0.5.3/cam-probe/lock-wheel.mjs — M6's PICTURE PAIR (B-CAM, 0.5.3): the same hand with the LOCK off and on.
 *   A shifted pose (setShift 0.3, −0.2), then THREE real wheel steps (the driver's own wheel, WebDriver actions) at an off-centre
 *   cursor on the open stage (0.62 w, 0.58 h of the canvas, as camera-shift's cases).  OFF: the zoom is at the cursor, so the pivot
 *   walks.  ON: the switch is pressed after the shift (it puts the pivot home), and the same three steps zoom from the centre.
 *   A thin ring marks where the cursor was (a probe overlay, pointer-events none, removed after the shot).
 *   python3 tools/gate/server.py <root> <LW_PORT>   (stop it by pid)
 *   LW_PORT=… GD_PORT=… node research/release-0.5.3/cam-probe/lock-wheel.mjs --off off.png --on on.png [--out file.json] */
import { writeFileSync } from 'node:fs';
import { open } from '../../../tools/gate/gatekit.mjs';
import { actions, relActions } from '../../../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz&sw=0`;
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const OUT = arg('--out'), SHOTS = { off: arg('--off'), on: arg('--on') };
const POSE = `const LW = __LW, o = LW.obs; return { lock: LW.camera.lock, shift: o.shift.map((v) => +v.toFixed(4)), dist: +o.dist.toFixed(4), fov: +o.fov.toFixed(4), pad: !!document.querySelector('.dev[data-id="camera"] .mir-camera .mir-xy.disabled') };`;
const g = await open(LAB, { width: 1600, height: 1000, script: 120000 });
const run = { lab: LAB, phases: {} };
try {
  if ((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok !== 1) throw new Error('the lab never became ready');
  await g.ev(`__LW.pause(); __LW.governor.on = false; await __LW.settle();
    const S = document.querySelector('.dev[data-id="camera"]'); S.classList.remove('closed'); if (S.classList.contains('folded')) S.querySelector('.dev-fold').click();
    await new Promise((r) => setTimeout(r, 400)); return 1;`);
  for (const phase of ['off', 'on']) {
    const at = await g.ev(`const LW = __LW, cv = document.getElementById('field'), r = cv.getBoundingClientRect();
      const card = document.querySelector('.dev[data-id="camera"]'), sw = [...card.querySelectorAll('button.sw')].find((b) => b.textContent.trim() === 'LOCK');
      if (LW.camera.lock) sw.click(); LW.camera.reset(); LW.camera.stop(); LW.camera.setShift(0.3, -0.2);
      ${phase === 'on' ? 'sw.click();' : ''} sw.scrollIntoView({ block: 'center' }); await new Promise((q) => setTimeout(q, 300)); await LW.settle();
      const x = Math.round(r.left + 0.62 * r.width), y = Math.round(r.top + 0.58 * r.height), hit = document.elementFromPoint(x, y);
      return { x, y, onStage: hit === cv, lock: LW.camera.lock, shift: LW.obs.shift.slice(), dist: LW.obs.dist };`);
    const steps = [];
    for (let i = 0; i < 3; i++) {
      await actions(g.s, [{ type: 'wheel', id: 'w' + phase + i, actions: [{ type: 'scroll', duration: 0, origin: 'viewport', x: at.x, y: at.y, deltaX: 0, deltaY: -120 }] }]);
      await relActions(g.s);
      await g.ev('await new Promise((r) => setTimeout(r, 150)); await __LW.settle(); return 1;');
      steps.push(await g.ev(POSE));
    }
    await g.ev(`await new Promise((r) => setTimeout(r, 300)); await __LW.settle();
      const m = document.createElement('div'); m.id = '__probeRing'; Object.assign(m.style, { position: 'fixed', left: (${at.x} - 9) + 'px', top: (${at.y} - 9) + 'px', width: '18px', height: '18px',
        border: '2px solid #ff3b6b', borderRadius: '50%', pointerEvents: 'none', zIndex: 99999 }); document.body.appendChild(m); await new Promise((r) => setTimeout(r, 100)); return 1;`);
    if (SHOTS[phase]) writeFileSync(SHOTS[phase], Buffer.from(await g.snap(), 'base64'));
    await g.ev(`document.getElementById('__probeRing').remove(); return 1;`);
    run.phases[phase] = { cursor: at, steps, final: steps[steps.length - 1] };
    console.log(`LOCK ${phase.toUpperCase().padEnd(3)} cursor (${at.x}, ${at.y}) on the stage ${at.onStage} · before: lock ${at.lock} shift [${at.shift}] dist ${(+at.dist).toFixed(4)}`
      + ` · after 3 wheel steps: ${steps.map((s) => `shift [${s.shift}] dist ${s.dist}`).join(' → ')} · PAN pad resting ${steps[2].pad}`);
  }
  await g.ev(`const card = document.querySelector('.dev[data-id="camera"]'), sw = [...card.querySelectorAll('button.sw')].find((b) => b.textContent.trim() === 'LOCK'); if (__LW.camera.lock) sw.click(); __LW.camera.reset(); return 1;`);
  const errs = await g.errors(); run.errs = errs.errs; if (errs.errs.length) console.log('page errors', errs.errs);
} finally { await g.close(); }
if (OUT) writeFileSync(OUT, JSON.stringify(run, null, 1));
