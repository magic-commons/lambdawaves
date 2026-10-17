/* lab/volumes.js — THE VOLUMES (iteration 004 · row P, Josh 2026-10-17: "we need a 'VOL.I', 'VOL.II' expansion names for the gigabytes of
 * libraries (each expansion library should be 5GB each and an easy way to install the libraries)").  The LIBRARY's store over THE VOLUME
 * FORMAT v1 (research/iteration-004/PLAN.md): a shelf, its catalogues, and one press that installs a whole volume on this device.
 *
 *   <VOLUME_BASE>/volumes.json          THE SHELF       { schema: 1, volumes: [ { id, numeral, title, blurb, count, bytes, bases, tags, index, indexSha256, built } ] }
 *   <VOLUME_BASE>/vol-1/index.json      THE CATALOGUE   { schema: 1, id, numeral, title, bases, molecules: [ { id, name, formula, formulaM, tags, file, bytes, sha256, thumb, … } ] }
 *   <VOLUME_BASE>/vol-1/m/<id>.lwm      one molecule, all its rungs       <VOLUME_BASE>/vol-1/t/<id>.webp   its picture
 *
 * VOLUME_BASE is './volumes/' beside lab/index.html (dev: the git-ignored symlink lab/volumes → ~/Documents/LAMBDAWAVES-VOLUMES/dist).
 * An installed volume is DEVICE CONTENT, like a library record (lab/library.js): it lives in the Cache Storage 'lw-vol-<id>' — a name no
 * build changes (sw.js collects only its own 'lw-lab-' caches), never precached, never in a project, a link or a history row — and it holds
 * every m/<id>.lwm and t/<id>.webp of the catalogue, the catalogue itself, and its own shelf entry (so the shelf reads offline).  An .lwm is
 * kept only after its bytes hash to the catalogue's sha-256; a thumbnail has no hash in format v1 and is kept as served.
 *   shelf()                       the published volumes; [] when none is (no volumes.json): "no volumes are published yet"
 *   index(volId)                  the catalogue (from this device when installed, else the network), checked against the shelf's indexSha256
 *   status(volId)                 'absent' | 'partial n/N' | 'installed'   (statusOf: the same as { state, n, N, bytes, total })
 *   install(volId, { onProgress, signal })   every file into 'lw-vol-<id>': six at a time, resumable (a file already kept is skipped),
 *                                 cancellable (an AbortSignal); asks persist() once, on the first install press (library.js persistOnce)
 *   remove(volId)                 the whole cache
 *   file(volId, molId, { network })   the .lwm as an ArrayBuffer, from this device or (network, the default) the network, checked either way
 *   picture(volId, molId)         a URL for the molecule's picture: the device's copy (an object URL) when installed, else the network's
 *   storageInfo()                 library.js': persisted, usage, quota
 * The reader (lab/volumes-format.js parseLwm · rungRecord) and the open (chemview.js openVolume, THE RECORD ROAD's chem.open) are row V2's. */
import { persistOnce, storageInfo } from './library.js';
export { storageInfo };
export const VOLUME_BASE = new URL('./volumes/', import.meta.url).href;
export const cacheOf = (volId) => 'lw-vol-' + volId;
const SHELF_URL = VOLUME_BASE + 'volumes.json';
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,95}$/;   // an id goes into a URL: no slash, no dot-dot
const RELATIVE = /^(?!\/)(?!.*\.\.)[A-Za-z0-9._+/-]{1,200}$/;   // a path inside the volume (m/<id>.lwm, t/<id>.webp, vol-1/index.json)

const hex = async (buf) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');
const caching = () => typeof caches !== 'undefined';
/* a READ never creates a volume's cache (a look writes nothing); the first install does */
async function store(volId, create = false) {
  if (!caching()) return null;
  try { return create || await caches.has(cacheOf(volId)) ? await caches.open(cacheOf(volId)) : null; } catch (_) { return null; }
}
const validVolume = (v) => v && SAFE.test(v.id) && typeof v.numeral === 'string' && typeof v.index === 'string' && RELATIVE.test(v.index);
const validMolecule = (m) => m && SAFE.test(m.id) && typeof m.file === 'string' && RELATIVE.test(m.file) && (m.thumb == null || (typeof m.thumb === 'string' && RELATIVE.test(m.thumb)));
const indexUrl = (v) => new URL(v.index, VOLUME_BASE).href;
const inVolume = (v, rel) => new URL(rel, indexUrl(v)).href;   // the catalogue's paths are relative to its own folder

/* ── THE SHELF ── the network's, else (offline) the entries the installed volumes keep */
let shelfMemo = null;
export async function shelf({ fresh = false } = {}) {
  if (shelfMemo && !fresh) return shelfMemo;
  let s = null, from = 'network';
  try { const r = await fetch(SHELF_URL, { cache: 'no-cache' }); if (r.ok) s = await r.json(); } catch (_) { s = null; }
  if (!s || s.schema !== 1 || !Array.isArray(s.volumes)) { s = await deviceShelf(); from = 'device'; }
  const volumes = (s && Array.isArray(s.volumes) ? s.volumes : []).filter(validVolume);
  const out = { volumes, from: volumes.length ? from : null };
  if (volumes.length) shelfMemo = out;   // an empty shelf is asked again next time (a volume may be published meanwhile)
  return out;
}
async function deviceShelf() {
  if (!caching()) return null;
  const names = await caches.keys().catch(() => []), volumes = [];
  for (const n of names) {
    if (!n.startsWith('lw-vol-')) continue;
    const hit = await (await caches.open(n)).match(SHELF_URL).catch(() => null);
    if (!hit) continue;
    try { const e = await hit.json(); if (validVolume(e)) volumes.push(e); } catch (_) { /* a damaged copy: not on the shelf */ }
  }
  return { schema: 1, volumes: volumes.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true })) };
}
async function volume(volId) {
  if (!SAFE.test(volId)) throw new Error('not a volume id: ' + volId);
  const v = (await shelf()).volumes.find((x) => x.id === volId) || (await shelf({ fresh: true })).volumes.find((x) => x.id === volId);
  if (!v) throw new Error('no volume ' + volId + ' on the shelf');
  return v;
}

/* ── THE CATALOGUE ── its bytes as kept (the install stores exactly what the shelf's hash names) */
const indexMemo = new Map();
async function indexBytes(v) {
  const url = indexUrl(v), c = await store(v.id);
  const hit = c && await c.match(url).catch(() => null);
  if (hit) { const buf = await hit.arrayBuffer(); if (!v.indexSha256 || await hex(buf) === v.indexSha256) return buf; }
  let r; try { r = await fetch(url, { cache: 'no-cache' }); } catch (_) { throw new Error('the catalogue of ' + v.id + ' could not be fetched (offline?)'); }
  if (!r.ok) throw new Error('the catalogue of ' + v.id + ': the server answered ' + r.status);
  const buf = await r.arrayBuffer();
  if (v.indexSha256 && await hex(buf) !== v.indexSha256) throw new Error('the catalogue of ' + v.id + ' does not match its shelf entry');
  return buf;
}
export async function index(volId) {
  const v = await volume(volId), memo = indexMemo.get(volId);
  if (memo && memo.sha === v.indexSha256) return memo.idx;
  const idx = JSON.parse(new TextDecoder().decode(await indexBytes(v)));
  if (!idx || idx.schema !== 1 || !Array.isArray(idx.molecules)) throw new Error('the catalogue of ' + volId + ' is not schema 1');
  idx.molecules = idx.molecules.filter(validMolecule);
  indexMemo.set(volId, { sha: v.indexSha256, idx });
  return idx;
}
const filesOf = (v, m) => [{ url: inVolume(v, m.file), sha: m.sha256, bytes: m.bytes, type: 'application/octet-stream', lwm: true },
  ...(m.thumb ? [{ url: inVolume(v, m.thumb), sha: null, bytes: 0, type: 'image/webp', lwm: false }] : [])];

/* ── THE STATUS ── molecules whose every file is kept; bytes are the .lwm bytes (the pictures are a few kB each) */
export async function statusOf(volId) {
  const v = await volume(volId), c = await store(volId);
  let idx = null; try { idx = await index(volId); } catch (_) { idx = null; }
  const N = idx ? idx.molecules.length : (v.count || 0), total = idx ? idx.molecules.reduce((s, m) => s + (m.bytes || 0), 0) : (v.bytes || 0);
  if (!c || !idx) return { state: 'absent', n: 0, N, bytes: 0, total };
  const keys = new Set((await c.keys().catch(() => [])).map((r) => r.url));
  let n = 0, bytes = 0;
  for (const m of idx.molecules) { const fs = filesOf(v, m); if (keys.has(fs[0].url)) bytes += m.bytes || 0; if (fs.every((f) => keys.has(f.url))) n++; }
  return { state: n === 0 ? 'absent' : n < N ? 'partial' : 'installed', n, N, bytes, total };
}
export async function status(volId) {
  const s = await statusOf(volId);
  return s.state === 'partial' ? `partial ${s.n}/${s.N}` : s.state;
}

/* ── THE INSTALL ── one press, the whole volume; six files at a time; a file already kept is skipped (resumable); a signal stops it */
const running = new Map();
export function install(volId, { onProgress = null, signal = null } = {}) {
  if (running.has(volId)) return running.get(volId);
  const asked = persistOnce().catch(() => null);   // the iPad law (library.js): asked on the FIRST install press, inside the gesture, never awaited here
  const job = (async () => {
    const v = await volume(volId), buf = await indexBytes(v), idx = await index(volId);
    const c = await store(volId, true);
    if (!c) return { ok: false, why: 'this browser has no Cache Storage' };
    await c.put(indexUrl(v), new Response(buf.slice(0), { headers: { 'content-type': 'application/json' } }));
    await c.put(SHELF_URL, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json' } }));
    const keys = new Set((await c.keys()).map((r) => r.url));
    const total = idx.molecules.reduce((s, m) => s + (m.bytes || 0), 0), N = idx.molecules.length;
    const left = new Map();   // molecule id → files still to fetch
    let bytes = 0, n = 0;
    const queue = [];
    for (const m of idx.molecules) {
      const fs = filesOf(v, m), todo = fs.filter((f) => !keys.has(f.url));
      if (keys.has(fs[0].url)) bytes += m.bytes || 0;   // its .lwm is kept already
      if (!todo.length) { n++; continue; }
      left.set(m.id, todo.length); for (const f of todo) queue.push({ ...f, mol: m });
    }
    const tell = (file) => { if (onProgress) try { onProgress({ n, N, bytes, total, ratio: total ? bytes / total : n / Math.max(1, N), file }); } catch (_) { /* a listener's fault is its own */ } };
    tell(null);
    const failed = []; let stop = null;
    const one = async (f) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal && signal.aborted) throw new DOMException('cancelled', 'AbortError');
        let r; try { r = await fetch(f.url, { signal, cache: 'no-cache' }); } catch (e) { if (signal && signal.aborted) throw e; if (attempt) throw new Error('the network refused it'); continue; }
        if (!r.ok) { if (attempt) throw new Error('the server answered ' + r.status); continue; }
        const b = await r.arrayBuffer();
        if (f.sha && await hex(b) !== f.sha) { if (attempt) throw new Error('its bytes do not match the catalogue'); continue; }
        await c.put(f.url, new Response(b, { headers: { 'content-type': f.type, 'content-length': String(b.byteLength) } }));
        return b.byteLength;
      }
      return 0;
    };
    const worker = async () => {
      while (queue.length && !stop) {
        const f = queue.shift();
        try {
          await one(f);
          if (f.lwm) bytes += f.mol.bytes || 0;
          const k = left.get(f.mol.id) - 1; left.set(f.mol.id, k); if (!k) n++;
          tell(f.url);
        } catch (e) {
          if (e && e.name === 'AbortError') { stop = stop || 'cancelled'; return; }
          if (e && e.name === 'QuotaExceededError') { stop = 'this device is out of room for it'; return; }
          failed.push({ id: f.mol.id, url: f.url, why: String(e && e.message || e) });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, Math.max(1, queue.length)) }, worker));
    const storage = await asked.then(() => storageInfo()).catch(() => null);
    if (stop === 'cancelled') return { ok: false, cancelled: true, n, N, bytes, total, storage };
    if (stop) return { ok: false, why: stop, n, N, bytes, total, storage };
    return { ok: !failed.length, n, N, bytes, total, failed, storage, why: failed.length ? failed.length + ' file(s) failed — press again to resume' : '' };
  })().finally(() => running.delete(volId));
  running.set(volId, job);
  return job;
}
export const installing = (volId) => running.has(volId);

export async function remove(volId) {
  if (!SAFE.test(volId) || !caching()) return false;
  return caches.delete(cacheOf(volId)).catch(() => false);
}

/* ── ONE MOLECULE ── the .lwm's bytes, checked against the catalogue wherever they came from */
async function molecule(volId, molId) {
  const v = await volume(volId), idx = await index(volId), m = idx.molecules.find((x) => x.id === molId);
  if (!m) throw new Error('no molecule ' + molId + ' in ' + volId);
  return { v, m };
}
export async function file(volId, molId, { network = true } = {}) {   // network: false — this device's copy or nothing (a project's re-open)
  const { v, m } = await molecule(volId, molId), url = inVolume(v, m.file), c = await store(volId);
  const hit = c && await c.match(url).catch(() => null);
  if (hit) { const b = await hit.arrayBuffer(); if (!m.sha256 || await hex(b) === m.sha256) return b; await c.delete(url).catch(() => {}); }
  if (!network) throw new Error(molId + ': not on this device');
  let r; try { r = await fetch(url); } catch (_) { throw new Error(molId + ': not on this device, and the network refused it (offline?)'); }
  if (!r.ok) throw new Error(molId + ': the server answered ' + r.status);
  const b = await r.arrayBuffer();
  if (m.sha256 && await hex(b) !== m.sha256) throw new Error(molId + ': its bytes do not match the catalogue');
  return b;
}
export async function picture(volId, molId) {
  const { v, m } = await molecule(volId, molId);
  if (!m.thumb) return null;
  const url = inVolume(v, m.thumb), c = await store(volId), hit = c && await c.match(url).catch(() => null);
  return hit ? URL.createObjectURL(await hit.blob()) : url;
}
