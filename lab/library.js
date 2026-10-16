/* library.js — THE LIBRARY (0.4.0 S4a · PLAN B2), the fourth storage class.  An installed record is DEVICE CONTENT:
 * content-addressed (lab/library/<sha-256>.json), never in a project, a link or a history row — a project holds only
 * { id, hash, nameKey } (chemview.js).  Records are deployed and NOT precached (sw.js DATA, the one exemption); the lab keeps
 * them in the Cache Storage `lw-data-v1`, a name no build changes, so a new build never clears an installed record.
 *   decodeRecord / validateRecord  the schema (`schema: 1`; a reader ignores members it does not know) — the worker's
 *                                  chem.open reads a record through these, and tools/orbital-library.mjs --check proves them;
 *                                  S4b: the atoms must hash to `input.atomsSha256` and ε, C, D must be finite (a moved atom
 *                                  or a NaN is refused, not opened);
 *   installed / fetchRecord / removeRecord / persistOnce / storageInfo   the store MOLECULES installs into and opens from.
 * tools/orbital-library.mjs writes the records and lab/library.json, the catalogue lab/molecules.js reads. */
import { sha256Hex } from './md.js';
export const SCHEMA = 1, DATA_CACHE = 'lw-data-v1';
export const recordPath = (hash) => 'library/' + hash + '.json';
/** the geometry's own key (0.4.0 S4b): sha-256 of the atoms as [Z, x, y, z] in bohr — a moved atom is not the record it says it is */
export const atomsKey = (atoms) => sha256Hex(JSON.stringify(atoms.map((a) => [a.Z, a.x, a.y, a.z])));

/* ── the record ── a big array is { $f64 | $i32: base64 } (little-endian, exact); everything else is plain JSON */
const TYPED = { $f64: Float64Array, $i32: Int32Array, $f32: Float32Array };
export function arr(v) {
  for (const k in TYPED) if (v && typeof v[k] === 'string') {
    const s = atob(v[k]), u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return new TYPED[k](u.buffer);
  }
  return null;
}
const len = (v) => (v && typeof (v.$f64 || v.$i32 || v.$f32) === 'string' ? atob(v.$f64 || v.$i32 || v.$f32).length / (v.$f64 ? 8 : 4) : -1);
/** everything a reader needs before it trusts a record; [] is a valid one */
export function validateRecord(r) {
  const bad = [], need = (ok, why) => { if (!ok) bad.push(why); return ok; };
  if (!need(r && typeof r === 'object', 'not an object')) return bad;
  need(r.schema === SCHEMA, `schema ${r.schema} is not ${SCHEMA}`);
  need(typeof r.id === 'string' && r.id.length > 0, 'no id');
  const I = r.input || {}, G = r.ground || {}, caps = r.caps || {};
  if (need(Array.isArray(I.atoms) && I.atoms.length > 0 && I.atoms.every((a) => Number.isInteger(a.Z) && [a.x, a.y, a.z].every(Number.isFinite)), 'input.atoms'))
    need(I.atomsSha256 === atomsKey(I.atoms), 'input.atoms: not the geometry the record was made at (atomsSha256)');
  need(typeof I.basis === 'string' && Number.isInteger(I.charge), 'input.basis / input.charge');
  if (r.kind === 'vibrate') { const V = r.vibrate || {}, K = V.K, n = G.nAO, N = (I.atoms || []).length, fin = (a) => Array.isArray(a) && a.length === K && a.every(Number.isFinite);   // 0.7.0 V1 THE MODES
    return need(Number.isInteger(K) && K > 0 && Number.isInteger(n) && typeof G.hash === 'string' && ['omega', 'mu', 'q0'].every((k) => fin(V[k])) && Array.isArray(V.irrep) && V.irrep.length === K
      && len(V.L) === 3 * N * K && len(V.D1) === n * n * K && [arr(V.L), arr(V.D1)].every((a) => a.every(Number.isFinite)), 'vibrate: K modes — ω, μ, Q₀, irreps, L at 3N·K and D₁ at nAO²·K, finite'), bad; }
  for (const k of ['orbitals', 'states', 'rpa', 'tdhf']) need(typeof caps[k] === 'boolean', 'caps.' + k);
  /* 0.4.0 S4c: a FRONTIER record (C₆₀) carries ε and a few whole columns of C — `ground.cols`, ascending — and nothing else */
  const n = G.nAO, nocc = G.nocc, d = nocc * (n - nocc), cols = G.cols;
  need(caps.orbitals === true && (caps.rpa === true || (Array.isArray(cols) && !caps.states && !caps.tdhf)), 'a record always carries its orbitals and its RPA sticks, or is a frontier record');
  if (!need(Number.isFinite(G.energy) && Number.isInteger(n) && n > 0 && Number.isInteger(nocc) && nocc > 0 && nocc < n && typeof G.hash === 'string' && G.names && typeof G.names === 'object', 'ground')) return bad;
  const O = r.orbitals || {};
  if (cols) return need(cols.length > 0 && cols.every((k, j) => Number.isInteger(k) && k >= (j ? cols[j - 1] + 1 : 0) && k < n) && len(O.eps) === n && len(O.C) === n * cols.length, 'frontier: ε at nAO, C at nAO × cols')
    && need(['eps', 'C'].every((k) => arr(O[k]).every(Number.isFinite)), 'orbitals: a non-finite ε or C'), bad;
  if (need(len(O.eps) === n && len(O.C) === n * n && len(O.D) === n * n, 'orbitals: ε, C and D at nAO'))
    need(['eps', 'C', 'D'].every((k) => arr(O[k]).every(Number.isFinite)), 'orbitals: a non-finite ε, C or D');
  const S = r.spectrum || {};
  need(['omega', 'omegaTDA', 'f', 'tdaOmega', 'tdaF'].every((k) => len(S[k]) === d) && len(S.mu) === 3 * d && len(S.tdaMu) === 3 * d
    && ['domI', 'domA'].every((k) => len(S[k]) === 4 * d) && ['domX', 'domY'].every((k) => len(S[k]) === 4 * d), 'spectrum: the RPA sticks and the TDA ladder');
  if (caps.states) {
    const T = r.states || {};
    need(T.d === d && ['omega', 'f', 'pivot'].every((k) => len(T[k]) === d) && len(T.mu) === 3 * d && ['cluster', 'size'].every((k) => len(T[k]) === d)
      && len(T.X) === d * d && len(T.rMO) === 3 * n * n, 'states: the canonical TDA ladder, X and the MO position matrices');
  }
  return bad;
}
/** a vibrate record (0.7.0 V1) as chem.vib.frames and the card read it: L (3N·K) and D₁ (nAO²·K) typed, the rest as written */
export const decodeVibrate = (r) => ({ ...r.vibrate, id: r.id, atoms: r.input.atoms, basis: r.input.basis, charge: r.input.charge, nAO: r.ground.nAO, L: arr(r.vibrate.L), D1: arr(r.vibrate.D1), dipole1: arr(r.vibrate.dipole1) });
/** the record as the worker's solve cache holds it: typed arrays, the RPA sticks and the TDA ladder as the wire's objects */
export function decodeRecord(r) {
  const G = r.ground, n = G.nAO, nocc = G.nocc, d = nocc * (n - nocc);
  if (G.cols) {   // a FRONTIER record: C laid out n × n as every reader indexes it, the columns it does not carry zero (and never offered)
    const m = G.cols.length, c = arr(r.orbitals.C), C = new Float64Array(n * n);
    for (let i = 0; i < n; i++) G.cols.forEach((k, j) => { C[i * n + k] = c[i * m + j]; });
    return { id: r.id, atoms: r.input.atoms, basis: r.input.basis, charge: r.input.charge, caps: r.caps, ground: G, eps: arr(r.orbitals.eps), C, D: null, spectrum: null, states: null, cols: G.cols };
  }
  const s = Object.fromEntries(Object.entries(r.spectrum).map(([k, v]) => [k, arr(v)]));
  const roots = [], tda = [];
  for (let k = 0; k < d; k++) {
    const dominant = [];
    for (let j = 0; j < 4; j++) { const q = 4 * k + j; if (s.domI[q] >= 0) dominant.push({ i: s.domI[q], a: s.domA[q], x: s.domX[q], y: s.domY[q] }); }
    roots.push({ omega: s.omega[k], omegaTDA: s.omegaTDA[k], f: s.f[k], mu: [s.mu[3 * k], s.mu[3 * k + 1], s.mu[3 * k + 2]], dominant });
    tda.push({ omega: s.tdaOmega[k], f: s.tdaF[k], mu: [s.tdaMu[3 * k], s.tdaMu[3 * k + 1], s.tdaMu[3 * k + 2]] });
  }
  let states = null;
  if (r.caps.states) {
    const T = r.states, rMO = arr(T.rMO);
    states = { n, nocc, nvir: n - nocc, d, omega: arr(T.omega), f: arr(T.f), mu: arr(T.mu), cluster: arr(T.cluster), size: arr(T.size),
      pivot: arr(T.pivot), X: arr(T.X), rMO: [0, 1, 2].map((q) => rMO.slice(q * n * n, (q + 1) * n * n)) };
  }
  return { id: r.id, atoms: r.input.atoms, basis: r.input.basis, charge: r.input.charge, caps: r.caps, ground: G,
    eps: arr(r.orbitals.eps), C: arr(r.orbitals.C), D: arr(r.orbitals.D), spectrum: { roots, tda }, states };
}

/* ── the store ── the page is its one writer, and stores a record only after its bytes match its name ── */
const urlOf = (hash) => new URL('./' + recordPath(hash), import.meta.url).href;
/* a READ never creates lw-data-v1 (a boot that only looks writes nothing); the first install does */
const store = async (create = false) => { try { return create || await caches.has(DATA_CACHE) ? await caches.open(DATA_CACHE) : null; } catch (_) { return null; } };
const hex = async (buf) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function installed(hash) { const c = await store(); return !!(c && await c.match(urlOf(hash)).catch(() => null)); }
export async function removeRecord(hash) { const c = await store(); return !!(c && await c.delete(urlOf(hash))); }
/** the record named `hash`: from the device, else — only when `network` — fetched, checked against its name and kept.
    { record, from: 'device' | 'network', bytes } or { record: null, why }.  A damaged copy is deleted: "not installed". */
export async function fetchRecord(hash, { network = false, onProgress = null } = {}) {
  const c = await store(), url = urlOf(hash);
  const hit = c && await c.match(url).catch(() => null);
  if (hit) {
    const buf = await hit.arrayBuffer();
    if (await hex(buf) === hash) return { record: JSON.parse(new TextDecoder().decode(buf)), from: 'device', bytes: buf.byteLength };
    await c.delete(url);
  }
  if (!network) return { record: null, why: 'not installed on this device' };
  let res;
  try { res = await fetch(url); } catch (_) { return { record: null, why: 'the network refused it (offline)' }; }
  if (!res.ok) return { record: null, why: `the server answered ${res.status}` };
  const total = +res.headers.get('content-length') || 0, parts = [];
  let got = 0;
  if (res.body && res.body.getReader) {
    const rd = res.body.getReader();
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; if (onProgress) onProgress(got, total); }
  } else { const b = new Uint8Array(await res.arrayBuffer()); parts.push(b); got = b.length; }
  const buf = new Uint8Array(got); let o = 0; for (const p of parts) { buf.set(p, o); o += p.length; }
  if (await hex(buf) !== hash) return { record: null, why: 'its bytes do not match its name' };
  const w = await store(true);
  if (w) await w.put(url, new Response(buf, { headers: { 'content-type': 'application/json' } })).catch(() => {});
  return { record: JSON.parse(new TextDecoder().decode(buf)), from: 'network', bytes: got };
}

/* ── the iPad law (PLAN B2) ── persist() is asked on the user's FIRST install press, never at boot (Firefox prompts), and the
   answer is remembered in this LIBRARY key — never in settings, a project or a link.  In a Safari TAB (seven days of no use and
   script-writable storage goes) it is not asked until the M5 measures persist granted there (MEASURE.md, M5 pending). */
const ASKED = 'lambdawaves.q0.library';
export const safariTab = () => typeof navigator !== 'undefined' && /Safari\//.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|Firefox|FxiOS|Edg/.test(navigator.userAgent)
  && !navigator.standalone && !(globalThis.matchMedia && matchMedia('(display-mode: standalone)').matches);
export async function storageInfo() {
  const S = typeof navigator !== 'undefined' && navigator.storage;
  const e = S && S.estimate ? await S.estimate().catch(() => null) : null;
  return { persisted: S && S.persisted ? await S.persisted().catch(() => null) : null, usage: e ? e.usage : null, quota: e ? e.quota : null, safariTab: safariTab() };
}
export async function persistOnce() {
  const S = typeof navigator !== 'undefined' && navigator.storage;
  let seen = null; try { seen = JSON.parse(localStorage.getItem(ASKED) || 'null'); } catch (_) {}
  if (!seen && S && S.persist && !safariTab()) {
    /* Firefox asks with a doorhanger: an unanswered prompt must not hold the install, so the answer waits 4 s and then reads
       `null` (unanswered) — the question is still remembered as asked, and storageInfo() reads the real state each time */
    const granted = await Promise.race([S.persist().catch(() => null), new Promise((r) => setTimeout(() => r(null), 4000))]);
    try { localStorage.setItem(ASKED, JSON.stringify({ asked: new Date().toISOString().slice(0, 10), granted })); } catch (_) {}
  }
  return storageInfo();
}
