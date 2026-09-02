/* tests/smoke.mjs — is the bare field pipeline alive in headless Firefox WebGPU?
 *   LW_PORT=8701 GD_PORT=5201 node tests/smoke.mjs
 */
import { open, judge, done } from '/home/joshua-hosain/Documents/MANDELBROT APP/project/mbgate/gatekit.mjs';
const PORT = process.env.LW_PORT || '8701';
const g = await open(`https://127.0.0.1:${PORT}/lab/smoke.html?preset=1s%2B2pz`, { width: 900, height: 700 });
try {
  const r = await g.waitFor('window.__LW && __LW.ready', 300, 100);
  judge('smoke boots', r && r.ok, r);
  const st = await g.ev(`return {error: __LW.error||null, s: document.getElementById('s').textContent, gpuErr: __LW.field && __LW.field.lastGpuError};`);
  judge('field created without error', !st.error && !st.gpuErr, st);
  const px = await g.ev(`return await __LW.field.readPixels(__LW.obs, __LW.mat);`);
  judge('render is non-black', px && px.nonBlack > 500, px);
  const dg = await g.ev(`return await __LW.field.fieldDigest();`);
  judge('grid integral of |ψ|² ≈ 1 (normalized 1s+2p_z, midpoint rule on the cache)', dg && Math.abs(dg.integral - 1) < 0.05 && dg.nan === 0, dg);
  const cmp = await g.ev(`const out=[]; const n=__LW.field.resolution;
    for (const [i,j,k] of [[n/2|0,n/2|0,n/2|0],[n/2+7|0,n/2-3|0,n/2+11|0],[n/4|0,n/3|0,n/2+5|0],[n/2+2|0,n/2+20|0,n/2-9|0]]) {
      const v = await __LW.field.sampleVoxel(i,j,k); const c = __LW.cpuPsi(v.x,v.y,v.z);
      out.push({ijk:[i,j,k], gpu:[v.re,v.im], cpu:[c.re,c.im], err: Math.hypot(v.re-c.re, v.im-c.im), mag: Math.hypot(c.re,c.im)});
    } return out;`);
  const worst = Math.max(...cmp.map((c) => c.err / (Math.max(...cmp.map((d) => d.mag)) || 1)));
  judge('GPU voxels agree with CPU closed form (f16 storage; rel to max sample)', worst < 5e-3, { worst, cmp });
  const errs = await g.errors();
  judge('no page errors', errs.errs.length === 0, errs);
  const png = await g.snap();
  const fs = await import('node:fs');
  fs.mkdirSync('/home/joshua-hosain/Documents/LAMBDAWAVES/.tmp', { recursive: true });
  fs.writeFileSync('/home/joshua-hosain/Documents/LAMBDAWAVES/.tmp/smoke.png', Buffer.from(png, 'base64'));
} finally { await g.close(); }
process.exit(done('smoke'));
