/* research/release-0.5.3/cam-probe/sphere-drag.mjs — M5 MEASURES FIRST (B-CAM, 0.5.3): a real mouse drag (the driver's own pointer,
 * WebDriver actions: the button is held across calls and released only at the end) on each CAMERA control, sampling BEFORE mouseup:
 *   the pose (__LW.obs yaw · pitch · dist · fov · shift), __LW.stats.presents, and what the card itself draws (the sphere's tip and
 *   arrow, the YAW / PITCH arcs' readouts, the dial's own readout).  A control that answers live moves the pose AND its drawing on
 *   every step; one that commits on release moves only after the up.
 *   python3 tools/gate/server.py <root> <LW_PORT>   (stop it by pid)
 *   LW_PORT=… GD_PORT=… node research/release-0.5.3/cam-probe/sphere-drag.mjs [--out file.json] [--shot file.png] */
import { writeFileSync } from 'node:fs';
import { open } from '../../../tools/gate/gatekit.mjs';
import { actions, relActions } from '../../../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz&sw=0`;
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const OUT = arg('--out'), SHOT = arg('--shot');   /* --shot file.png: the viewport mid-drag on the sphere (move 3, the button down); the card's box goes to the JSON */
const STEPS = 6, DX = -14, DY = -10;   /* leftward: the CAMERA card sits in the right rack */
/* each control: a selector for the element pressed */
const CONTROLS = [
  ['SPHERE (the three rings)', '.mir-camsphere svg.cs-svg'],
  ['YAW arc', '[data-param="observer.yaw"]'], ['PITCH arc', '[data-param="observer.pitch"]'],
  ['ZOOM', '[data-param="observer.dist"]'], ['FOV', '[data-param="observer.fov"]'],
  ['PAN pad', '.mir-camera .xy-pad'], ['PAN X', '[data-param="observer.panx"]'], ['PAN Y', '[data-param="observer.pany"]'],
];
const SAMPLE = `const L = __LW, o = L.obs, q = (s) => document.querySelector(s), val = (s) => { const e = q(s); const v = e && e.querySelector('.k-val'); return v ? v.textContent : null; };
  const tip = q('.mir-camsphere .cs-tip'), look = q('.mir-camsphere .cs-look');
  return { yaw: +o.yaw.toFixed(5), pitch: +o.pitch.toFixed(5), dist: +o.dist.toFixed(4), fov: +o.fov.toFixed(4), shift: o.shift.map((v) => +v.toFixed(4)), presents: L.stats.presents,
    tip: tip ? [tip.getAttribute('cx'), tip.getAttribute('cy')].join(',') : null, look: look ? [look.getAttribute('x2'), look.getAttribute('y2')].join(',') : null,
    yawArc: val('[data-param="observer.yaw"]'), pitchArc: val('[data-param="observer.pitch"]'), zoom: val('[data-param="observer.dist"]'), fovK: val('[data-param="observer.fov"]'),
    panX: val('[data-param="observer.panx"]'), panY: val('[data-param="observer.pany"]') };`;
const g = await open(LAB, { width: 1500, height: 1000, script: 120000 });
const run = { lab: LAB, controls: [] };
let n = 0;
try {
  if ((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok !== 1) throw new Error('the lab never became ready');
  await g.ev(`__LW.pause(); __LW.governor.on = false; await __LW.settle();
    const S = document.querySelector('.dev[data-id="camera"]'); S.classList.remove('closed'); if (S.classList.contains('folded')) S.querySelector('.dev-fold').click();
    await new Promise((r) => setTimeout(r, 400)); return 1;`);
  for (const [name, sel] of CONTROLS) {
    const at = await g.ev(`__LW.camera.reset(); __LW.camera.stop(); await __LW.settle(); const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
      e.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 300)); await __LW.settle(); await new Promise((r) => setTimeout(r, 200));
      const b = e.getBoundingClientRect(), x = Math.round(b.left + b.width / 2), y = Math.round(b.top + b.height / 2), hit = document.elementFromPoint(x, y);
      return { x, y, w: b.width, h: b.height, hit: !!hit && (hit === e || e.contains(hit)) };`);
    if (!at) { run.controls.push({ name, missing: true }); console.log('MISSING ' + name); continue; }
    const id = 'm' + (++n), samples = [];
    await actions(g.s, [{ type: 'pointer', id, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: at.x, y: at.y }, { type: 'pointerDown', button: 0 }] }]);
    await g.ev('await new Promise((r) => setTimeout(r, 120)); return 1;');
    samples.push({ at: 'down', ...(await g.ev(SAMPLE)) });
    for (let i = 1; i <= STEPS; i++) {
      await actions(g.s, [{ type: 'pointer', id, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 40, origin: 'viewport', x: at.x + i * DX, y: at.y + i * DY }] }]);
      await g.ev('await new Promise((r) => setTimeout(r, 120)); return 1;');   /* two or more frames: a PRESENT asked for on the move has landed */
      samples.push({ at: 'move ' + i, ...(await g.ev(SAMPLE)) });
      if (SHOT && n === 1 && i === 3) { writeFileSync(SHOT, Buffer.from(await g.snap(), 'base64'));
        run.shotBox = await g.ev(`const b = document.querySelector('.dev[data-id="camera"] .mir-camera').getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round);`); }
    }
    await actions(g.s, [{ type: 'pointer', id, parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerUp', button: 0 }] }]);
    await relActions(g.s);
    await g.ev('await new Promise((r) => setTimeout(r, 200)); return 1;');
    samples.push({ at: 'up', ...(await g.ev(SAMPLE)) });
    const d = samples[0], held = samples.slice(1, -1), last = held[held.length - 1], up = samples[samples.length - 1];
    const key = (s) => JSON.stringify([s.yaw, s.pitch, s.dist, s.fov, s.shift]);
    const drew = (s, p) => s.tip !== p.tip || s.yawArc !== p.yawArc || s.pitchArc !== p.pitchArc || s.zoom !== p.zoom || s.fovK !== p.fovK || s.panX !== p.panX || s.panY !== p.panY;
    const poseSteps = held.filter((s, i) => key(s) !== key(i ? held[i - 1] : d)).length;
    const drawSteps = held.filter((s, i) => drew(s, i ? held[i - 1] : d)).length;
    const r = { name, sel, at, poseStepsBeforeUp: poseSteps, drawStepsBeforeUp: drawSteps, presentsBeforeUp: last.presents - d.presents, presentsAtUp: up.presents - last.presents,
      poseMovedAtUp: key(up) !== key(last), drawMovedAtUp: drew(up, last), samples };
    run.controls.push(r);
    console.log(`${name.padEnd(26)} pose moved on ${poseSteps}/${STEPS} steps · presents ${r.presentsBeforeUp} before up, +${r.presentsAtUp} at up · the card's drawing moved on ${drawSteps}/${STEPS} steps${r.drawMovedAtUp ? ' AND AGAIN AT THE UP' : ''} (press hit ${at.hit})`);
  }
  await g.ev('__LW.camera.reset(); return 1;');
  const errs = await g.errors(); run.errs = errs.errs; if (errs.errs.length) console.log('page errors', errs.errs);
} finally { await g.close(); }
if (OUT) writeFileSync(OUT, JSON.stringify(run, null, 1));
