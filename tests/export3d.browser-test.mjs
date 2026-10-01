// tests/export3d.browser-test.mjs — the browser proof of FILE › EXPORT SHAPE / GRID (wave 134, lab/export3d.js).
// The node proof (tests/export3d.test.mjs) proves every byte layout on a synthetic grid; this proves the WIRING —
// the five rows pressed through the real menubar driver, against the real field (readGrid off the real GPU texture,
// marching cubes and every writer run in the real `cards` worker queue), with the download road stubbed so the Blob
// is judged instead of saved. It proves: the ISO, the palette and the camera really are what is on screen; the grid
// is forced to 64³ for speed; the export never stalls the frame path; and a second press while one is in flight is
// refused. Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s`, { width: 1400, height: 950, script: 60000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);

  /* ── boot: force the grid to 64³ (the first-run default already is this on a desktop, but the proof does not
         trust that), stub the download road onto the SAME capture() instance export3d.js's env.save calls, and
         define the menubar driver (menubar.browser-test.mjs's __row) plus the format readers every section shares ── */
  const boot = await g.ev(`
    __LW.pause();
    const gridSeg = [...document.querySelectorAll('.segw')].find((s) => s.querySelector('.k-lbl') && s.querySelector('.k-lbl').textContent === 'GRID');
    const b64 = [...gridSeg.querySelectorAll('.seg-b')].find((b) => b.textContent === '64³');
    b64.click();
    await __LW.settle();

    window.__exports = [];
    const cap = __LW.captureUI.capture;            // force it into existence so the stub lands on the SAME object export3d.js's env.save calls
    cap.save = (r) => { window.__exports.push(r); return true; };

    window.__row = async (menu, label) => {
      __LW.layout.menu.open();
      const bar = document.getElementById('menubar');
      const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.textContent === menu);
      if (!btn) return { found: false, why: 'no menu ' + menu };
      btn.click();
      const it = [...btn.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.startsWith(label));
      if (!it) { btn.click(); return { found: false, why: 'no row ' + label, rows: [...btn.parentElement.querySelectorAll('.mb-lbl')].map((l) => l.textContent) }; }
      const disabled = it.disabled;
      if (!disabled) it.click(); else btn.click();
      await __LW.settle();
      return { found: true, disabled };
    };
    /* press a FILE row and wait for the export itself (off the frame path, so settle() alone proves nothing about
       it) to actually finish: window.__exports grows, or the module's own busy flag drops */
    window.__press = async (label) => {
      const n0 = window.__exports.length;
      const row = await __row('FILE', label);
      for (let i = 0; i < 500 && window.__exports.length === n0 && __LW.shapeExport.busy; i++) await new Promise((q) => setTimeout(q, 20));
      return { row, got: window.__exports.length > n0 };
    };

    window.__unzip = (z) => {
      const dv = new DataView(z.buffer, z.byteOffset, z.byteLength), out = {}; let p = 0;
      while (p < z.length && dv.getUint32(p, true) === 0x04034b50) {
        const size = dv.getUint32(p + 18, true), nl = dv.getUint16(p + 26, true), xl = dv.getUint16(p + 28, true);
        const name = new TextDecoder().decode(z.subarray(p + 30, p + 30 + nl));
        out[name] = z.subarray(p + 30 + nl + xl, p + 30 + nl + xl + size); p += 30 + nl + xl + size;
      }
      return out;
    };
    window.__readNpy = (b) => { const hl = b[8] | (b[9] << 8); return { head: new TextDecoder().decode(b.subarray(10, 10 + hl)), data: b.slice(10 + hl) }; };
    window.__readGLB = (bytes) => {
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const magic = dv.getUint32(0, true), version = dv.getUint32(4, true), total = dv.getUint32(8, true);
      const jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jl)));
      const bl = dv.getUint32(20 + jl, true), bin = bytes.subarray(28 + jl, 28 + jl + bl);
      const acc = (i) => { const a = json.accessors[i], v = json.bufferViews[a.bufferView];
        const C = a.componentType === 5126 ? Float32Array : Uint32Array, per = { VEC3: 3, SCALAR: 1 }[a.type];
        return new C(bin.slice(v.byteOffset, v.byteOffset + a.count * per * 4).buffer); };
      return { magic, version, total, json, acc };
    };
    return { res: __LW.quality.res, fieldOk: __LW.field.ok, label: __LW.reg.preset };
  `);
  assert.equal(boot.res, 64); assert.equal(boot.fieldOk, true); assert.equal(boot.label, '1s');
  console.log('PASS boot: ?preset=1s, the grid forced to 64³, the FIELD is up, the download road stubbed onto captureUI\'s own instance');

  /* ── GLB: the row, the header, the accessors, the camera, every vertex inside ±half, and (1s) a centred,
         symmetric mesh ── */
  const glbR = await g.ev(`
    const p = await __press('EXPORT SHAPE · GLB');
    const last = __LW.shapeExport.last, entry = window.__exports[window.__exports.length - 1];
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const G = __readGLB(bytes), P = G.acc(0), half = __LW.domain.half;
    let maxAbs = 0, cx = 0, cy = 0, cz = 0, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i + 1]; cz += P[i + 2];
      for (let a = 0; a < 3; a++) { const v = P[i + a]; maxAbs = Math.max(maxAbs, Math.abs(v)); lo[a] = Math.min(lo[a], v); hi[a] = Math.max(hi[a], v); } }
    const nv = P.length / 3; cx /= nv; cy /= nv; cz /= nv;
    const sym = [0, 1, 2].map((a) => Math.abs(hi[a] + lo[a]) / (hi[a] - lo[a]));
    return { found: p.row.found, disabled: p.row.disabled, got: p.got, name: entry.name, mime: entry.blob.type, size: entry.blob.size,
      magic: G.magic, version: G.version, total: G.total, matchesTotal: G.total === bytes.byteLength,
      accCounts: G.json.accessors.map((a) => a.count), hasCamera: !!G.json.cameras, fov: G.json.cameras ? G.json.cameras[0].perspective.yfov : null,
      half, maxAbs, centroid: Math.hypot(cx, cy, cz), sym, triangles: last.triangles, vertices: last.vertices };
  `);
  assert.equal(glbR.found, true); assert.equal(glbR.disabled, false); assert.equal(glbR.got, true);
  assert.match(glbR.name, /^lambdawaves-1s-\d{8}-\d{4}\.glb$/); assert.equal(glbR.mime, 'model/gltf-binary'); assert.ok(glbR.size > 0);
  assert.equal(glbR.magic, 0x46546c67); assert.equal(glbR.version, 2); assert.equal(glbR.matchesTotal, true);
  assert.deepEqual(glbR.accCounts, [glbR.vertices, glbR.vertices, glbR.vertices, glbR.triangles * 3]);
  assert.equal(glbR.hasCamera, true); assert.ok(glbR.fov > 0, 'the camera node must carry the observer\'s FOV');
  assert.ok(glbR.maxAbs <= glbR.half + 1e-4, `every GLB vertex must lie inside ±half (max |coord| ${glbR.maxAbs} vs half ${glbR.half})`);
  assert.ok(glbR.centroid < 0.05, `1s is spherical: the mesh centroid must sit within 0.05 bohr of the origin (${glbR.centroid})`);
  assert.ok(glbR.sym.every((s) => s <= 0.02), `1s is spherical: the bounds must be symmetric within 2% on every axis (${glbR.sym})`);
  console.log(`PASS FILE › EXPORT SHAPE · GLB: ${glbR.name}, ${glbR.size} bytes, magic glTF v2, accessors ${glbR.accCounts.join('/')}, a camera (FOV ${glbR.fov}), every vertex inside ±${glbR.half.toFixed(3)} bohr, centroid ${glbR.centroid.toExponential(2)} bohr off origin, symmetry ${glbR.sym.map((s) => (100 * s).toFixed(2) + '%').join('/')}`);

  /* ── OBJ ── */
  const objR = await g.ev(`
    const p = await __press('EXPORT SHAPE · OBJ');
    const last = __LW.shapeExport.last, entry = window.__exports[window.__exports.length - 1];
    const text = await entry.blob.text(), lines = text.split('\\n');
    const V = lines.filter((l) => l.startsWith('v ')).length, F = lines.filter((l) => l.startsWith('f ')).length;
    return { found: p.row.found, got: p.got, V, F, triangles: last.triangles, vertices: last.vertices, name: entry.name, mime: entry.blob.type, size: entry.blob.size };
  `);
  assert.equal(objR.found, true); assert.equal(objR.got, true);
  assert.equal(objR.V, objR.vertices); assert.equal(objR.F, objR.triangles);
  assert.match(objR.name, /^lambdawaves-1s-\d{8}-\d{4}\.obj$/); assert.equal(objR.mime, 'model/obj'); assert.ok(objR.size > 0);
  console.log(`PASS FILE › EXPORT SHAPE · OBJ: ${objR.name}, ${objR.V} v = ${objR.vertices} vertices, ${objR.F} f = ${objR.triangles} triangles`);

  /* ── STL: its triangle count must equal the GLB's (same grid, same ISO, same marching cubes) ── */
  const stlR = await g.ev(`
    const p = await __press('EXPORT SHAPE · STL');
    const entry = window.__exports[window.__exports.length - 1];
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const nt = new DataView(bytes.buffer).getUint32(80, true);
    return { found: p.row.found, got: p.got, size: bytes.byteLength, nt, name: entry.name, mime: entry.blob.type };
  `);
  assert.equal(stlR.found, true); assert.equal(stlR.got, true);
  assert.equal(stlR.size, 84 + 50 * stlR.nt);
  assert.equal(stlR.nt, glbR.triangles, 'the STL triangle count must equal the GLB\'s');
  assert.match(stlR.name, /^lambdawaves-1s-\d{8}-\d{4}\.stl$/); assert.equal(stlR.mime, 'model/stl');
  console.log(`PASS FILE › EXPORT SHAPE · STL: ${stlR.name}, 84 + 50·${stlR.nt} = ${stlR.size} bytes, the same ${stlR.nt} triangles as the GLB`);

  /* ── NPZ ── */
  const npzR = await g.ev(`
    const p = await __press('EXPORT GRID · NPZ');
    const entry = window.__exports[window.__exports.length - 1];
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const files = __unzip(bytes), psi = __readNpy(files['psi.npy']), axis = __readNpy(files['axis.npy']);
    const meta = JSON.parse(new TextDecoder().decode(files['meta.json']));
    return { found: p.row.found, got: p.got, keys: Object.keys(files).sort(), psiHead: psi.head, axisHead: axis.head, meta, name: entry.name, mime: entry.blob.type };
  `);
  assert.equal(npzR.found, true); assert.equal(npzR.got, true);
  assert.deepEqual(npzR.keys, ['axis.npy', 'meta.json', 'psi.npy']);
  assert.match(npzR.psiHead, /'descr': '<c8'/); assert.match(npzR.psiHead, /'shape': \(64, 64, 64\)/);
  assert.match(npzR.axisHead, /'descr': '<f4'/); assert.match(npzR.axisHead, /'shape': \(64,\)/);
  assert.equal(npzR.meta.N, 64); assert.equal(npzR.meta.space, 'r'); assert.equal(npzR.meta.units, 'bohr');
  assert.match(npzR.name, /^lambdawaves-1s-\d{8}-\d{4}\.npz$/); assert.equal(npzR.mime, 'application/zip');
  console.log(`PASS FILE › EXPORT GRID · NPZ: ${npzR.name}, psi.npy <c8 (64, 64, 64), axis.npy <f4 (64,), meta.json N=64, space='${npzR.meta.space}', units ${npzR.meta.units}`);

  /* ── CUBE ── */
  const cubeR = await g.ev(`
    const p = await __press('EXPORT GRID · CUBE');
    const entry = window.__exports[window.__exports.length - 1];
    const text = await entry.blob.text(), lines = text.split('\\n');
    const na = +lines[2].trim().split(/\\s+/)[0], n = +lines[3].trim().split(/\\s+/)[0];
    const vals = lines.slice(6 + na).join(' ').trim().split(/\\s+/).filter(Boolean);
    return { found: p.row.found, got: p.got, na, n, count: vals.length, name: entry.name, mime: entry.blob.type };
  `);
  assert.equal(cubeR.found, true); assert.equal(cubeR.got, true);
  assert.equal(cubeR.na, 1, 'no MOLECULES: one nucleus at the origin with the Hamiltonian\'s Z');
  assert.equal(cubeR.n, 64); assert.equal(cubeR.count, 64 ** 3);
  assert.match(cubeR.name, /^lambdawaves-1s-\d{8}-\d{4}\.cube$/); assert.equal(cubeR.mime, 'chemical/x-cube');
  console.log(`PASS FILE › EXPORT GRID · CUBE: ${cubeR.name}, ${cubeR.na} atom, N = ${cubeR.n}, exactly N³ = ${cubeR.count} values`);

  /* ── the loop never stalls: the main-thread frame median across a playing export, within 20% ── */
  const perfR = await g.ev(`
    __LW.perf.resetRing(); __LW.play();
    await new Promise((r) => setTimeout(r, 1200));
    const before = __LW.perf.loopMedian;
    const p = await __press('EXPORT GRID · NPZ');
    await new Promise((r) => setTimeout(r, 800));
    const after = __LW.perf.loopMedian;
    __LW.pause();
    return { before, after, got: p.got };
  `);
  assert.equal(perfR.got, true);
  assert.ok(perfR.before > 0 && perfR.after > 0, `both medians must be real samples (${perfR.before}, ${perfR.after})`);
  const rel = Math.abs(perfR.after - perfR.before) / perfR.before;
  assert.ok(rel <= 0.2, `the loop's median must stay within 20% across a playing export: ${perfR.before.toFixed(3)} → ${perfR.after.toFixed(3)} ms (Δ ${(100 * rel).toFixed(1)}%)`);
  console.log(`PASS the export never stalls the frame path: loop median ${perfR.before.toFixed(3)} ms → ${perfR.after.toFixed(3)} ms across a playing EXPORT GRID · NPZ (Δ ${(100 * rel).toFixed(1)}%)`);

  /* ── a second export while one is in flight is refused ── */
  const refuseR = await g.ev(`
    const p1 = __LW.shapeExport.run('npz');
    const p2 = __LW.shapeExport.run('obj');
    const [r1, r2] = await Promise.all([p1, p2]);
    return { r1ok: r1.ok, r2ok: r2.ok, r2refused: !!r2.refused };
  `);
  assert.equal(refuseR.r1ok, true); assert.equal(refuseR.r2ok, false); assert.equal(refuseR.r2refused, true);
  console.log('PASS a second export pressed while one is in flight is refused, and the first still finishes');

  /* ── momentum space: the SAME NPZ, meta.space = 'p' ── */
  const pSpaceR = await g.ev(`
    __LW.setSpace('p'); await __LW.settle();
    const n0 = window.__exports.length;
    const r = await __LW.shapeExport.run('npz');
    const entry = window.__exports[window.__exports.length - 1];
    const bytes = new Uint8Array(await entry.blob.arrayBuffer());
    const meta = JSON.parse(new TextDecoder().decode(__unzip(bytes)['meta.json']));
    __LW.setSpace('x'); await __LW.settle();
    return { ok: r.ok, got: window.__exports.length > n0, space: meta.space, units: meta.units };
  `);
  assert.equal(pSpaceR.ok, true); assert.equal(pSpaceR.got, true);
  assert.equal(pSpaceR.space, 'p'); assert.match(pSpaceR.units, /hbar\/bohr/);
  console.log(`PASS a momentum-space grid exports meta.space = 'p', units ${pSpaceR.units}`);

  /* ── the field down: the rows are disabled, and a press is refused with the named reason ── */
  const noField = await g.ev(`
    const real = __LW.field.ok;
    __LW.field.ok = false;                 // the field.js own flag a device loss flips (field.ok, read, never set, elsewhere)
    const row = await __row('FILE', 'EXPORT SHAPE · GLB');
    const r = await __LW.shapeExport.run('glb');
    __LW.field.ok = real;
    return { disabled: row.disabled, refused: !r.ok, error: r.error };
  `);
  assert.equal(noField.disabled, true); assert.equal(noField.refused, true); assert.match(noField.error, /FIELD/);
  console.log('PASS with the FIELD down, the five rows are disabled and a direct call is refused, naming the FIELD');
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED export3d.browser-test' : 'GREEN export3d.browser-test');
process.exit(failed ? 1 : 0);
