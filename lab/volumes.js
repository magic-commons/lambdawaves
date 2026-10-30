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
 * kept only after its bytes hash to the catalogue's sha-256, and carries that sha in its `x-lw-sha256` header (028 R-07): a re-edition under
 * the same id makes a kept file whose sha differs NOT KEPT on every read (install · installStatus · kept · the file road), so it is fetched
 * again; a thumbnail has no hash in format v1 and is kept as served.
 *   shelf()                       the published volumes; [] when none is (no volumes.json): "no volumes are published yet"
 *   index(volId)                  the catalogue (from this device when installed, else the network), checked against the shelf's indexSha256
 *   status(volId)                 'absent' | 'partial n/N' | 'installed'   (installStatus: the same as { state, n, N, bytes, total })
 *   install(volId, { onProgress, signal })   every file into 'lw-vol-<id>': six at a time, resumable (a file already kept is skipped),
 *                                 cancellable (an AbortSignal); asks persist() once, on the first install press (library.js persistOnce);
 *                                 and the ladder's four basis records its rungs read (sw.js DATA) into lw-data-v1 when not there yet
 *                                 (iteration 005 A), so an installed volume opens offline at every rung
 *   installFile(volId, file, { onProgress, signal })   THE FILE ROAD (iteration 005 S): a volume's one .lwv (lab/volumes-format.js THE
 *                                 ARCHIVE), opened from this device's disk — every file's sha-256 checked, stored under EXACTLY the keys the
 *                                 fetch road uses (so installStatus · file · picture · remove see no difference), one at a time, resumable, and
 *                                 refused with a sentence when its volume is not on the shelf or the device has too little room
 *   installMolecule(volId, molId, { onProgress, signal })   iteration 008 V · ONE MOLECULE kept in place (MOLECULES' download glyph and its
 *                                 ring): its .lwm (sha-256 checked) and picture under EXACTLY the keys the whole install uses, the catalogue
 *                                 and the shelf entry beside them (so it reads offline), and the ladder's basis records — installStatus then says
 *                                 partial; only a fetchable volume (an archive volume is its file's)
 *   kept(volId)                   the ids of the molecules whose every file is on this device (a Set; empty when none is)
 *   watch(fn)                     fn({ volume, what: 'install' | 'file' | 'molecule' | 'remove', id }) after anything here changed a volume's
 *                                 cache — MOLECULES' pages and lamps follow the Picker's INSTALL / REMOVE without a poll; → unwatch
 *   remove(volId)                 the whole cache (the basis records stay: another volume may read them)
 *   file(volId, molId, { network })   the .lwm as an ArrayBuffer, from this device or (network, the default) the network, checked either way
 *   picture(volId, molId)         a URL for the molecule's picture: the device's copy (an object URL) when installed, else the network's
 *   storageInfo()                 library.js': persisted, usage, quota
 * The reader (lab/volumes-format.js parseLwm · rungRecord) and the open (chemview.js openVolume, THE RECORD ROAD's chem.open) are row V2's. */
import { persistOnce, storageInfo, keepData } from './library.js';
import { BASIS_FILES } from './rhf-molecule.js';
import { parseLwv, lwvIndexLength } from './volumes-format.js';
const VOLUME_BASE = new URL('./volumes/', import.meta.url).href;
const cacheOf = (volId) => 'lw-vol-' + volId;
const SHELF_URL = VOLUME_BASE + 'volumes.json';
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,95}$/;   // an id goes into a URL: no slash, no dot-dot
const RELATIVE = /^(?!\/)(?!.*\.\.)[A-Za-z0-9._+/-]{1,200}$/;   // a path inside the volume (m/<id>.lwm, t/<id>.webp, vol-1/index.json)

/* iteration 008 V · THE WATCHERS: one listener set, told after an install, a file, a molecule or a remove changed a volume's cache */
const watchers = new Set();
export function watch(fn) { if (typeof fn === 'function') watchers.add(fn); return () => watchers.delete(fn); }
const changed = (volume, what, id = null) => { for (const f of watchers) { try { f({ volume, what, id }); } catch (_) { /* a watcher's fault is its own */ } } };
const hex = async (buf) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map((b) => b.toString(16).padStart(2, '0')).join('');
const caching = () => typeof caches !== 'undefined';
/* 028 R-07 · a kept file's sha-256 rides in its put's headers; url → that sha ('' for a file kept before the header: not kept) */
const SHA = 'x-lw-sha256';
const keptShas = async (c) => new Map(await Promise.all((await c.keys().catch(() => [])).map(async (q) => [q.url, (await c.match(q).catch(() => null))?.headers.get(SHA) || ''])));
const isKept = (shas, f) => shas.has(f.url) && (!f.sha || shas.get(f.url) === f.sha);
const json = (body, sha) => new Response(body, { headers: { 'content-type': 'application/json', ...(sha ? { [SHA]: sha } : {}) } });
/* a READ never creates a volume's cache (a look writes nothing); the first install does */
async function store(volId, create = false) {
  if (!caching()) return null;
  try { return create || await caches.has(cacheOf(volId)) ? await caches.open(cacheOf(volId)) : null; } catch (_) { return null; }
}
/* a volume is fetchable (its `index`, the dev link) or a file (its `archive`: opened from disk; its keys are the same folder's) */
const validVolume = (v) => v && SAFE.test(v.id) && typeof v.numeral === 'string'
  && (typeof v.index === 'string' ? RELATIVE.test(v.index) : !!(v.archive && typeof v.archive.name === 'string') || (v.wip === true && v.count === 0));   // iteration 015 M5: the next volume, still filling (no index yet)
const validMolecule = (m) => m && SAFE.test(m.id) && typeof m.file === 'string' && RELATIVE.test(m.file) && (m.thumb == null || (typeof m.thumb === 'string' && RELATIVE.test(m.thumb)));
const indexUrl = (v) => new URL(v.index || v.id + '/index.json', VOLUME_BASE).href;
const inVolume = (v, rel) => new URL(rel, indexUrl(v)).href;   // the catalogue's paths are relative to its own folder
/** pictureUrl(v, m) — a molecule's picture on the network, synchronously (022 P3: the MOLECULES list's rows; a miss is the row's onerror) */
export const pictureUrl = (v, m) => inVolume(v, m.thumb || 't/' + m.id + '.webp');

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
  if (!v.index) throw new Error(volLabel(v) + ' is not on this device: open its file');
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
/* the basis records only a volume's rungs read (sw.js §1b DATA; STO-3G and 6-31+G* are precached with the live card) */
const LADDER = ['sto-6g', '3-21g', '6-31g', '6-31g-star'];
const basesOf = (v) => LADDER.filter((b) => !Array.isArray(v.bases) || v.bases.includes(b)).map((b) => new URL('./vendor/bse/' + BASIS_FILES[b], import.meta.url).href);
const filesOf = (v, m) => [{ url: inVolume(v, m.file), sha: m.sha256, bytes: m.bytes, type: 'application/octet-stream', lwm: true },
  ...(m.thumb ? [{ url: inVolume(v, m.thumb), sha: null, bytes: 0, type: 'image/webp', lwm: false }] : [])];

/* ── THE STATUS ── molecules whose every file is kept; bytes are the .lwm bytes (the pictures are a few kB each) */
export async function installStatus(volId) {
  const v = await volume(volId), c = await store(volId);
  let idx = null; try { idx = await index(volId); } catch (_) { idx = null; }
  const N = idx ? idx.molecules.length : (v.count || 0), total = idx ? idx.molecules.reduce((s, m) => s + (m.bytes || 0), 0) : (v.bytes || 0);
  if (!c || !idx) return { state: 'absent', n: 0, N, bytes: 0, total };
  const shas = await keptShas(c);
  let n = 0, bytes = 0;
  for (const m of idx.molecules) { const fs = filesOf(v, m); if (isKept(shas, fs[0])) bytes += m.bytes || 0; if (fs.every((f) => isKept(shas, f))) n++; }
  return { state: n === 0 ? 'absent' : n < N ? 'partial' : 'installed', n, N, bytes, total };
}
async function status(volId) {
  const s = await installStatus(volId);
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
    await c.put(indexUrl(v), json(buf.slice(0), v.indexSha256));
    await c.put(SHELF_URL, json(JSON.stringify(v)));
    const shas = await keptShas(c);
    const total = idx.molecules.reduce((s, m) => s + (m.bytes || 0), 0), N = idx.molecules.length;
    const left = new Map();   // molecule id → files still to fetch
    let bytes = 0, n = 0;
    const queue = [];
    for (const m of idx.molecules) {
      const fs = filesOf(v, m), todo = fs.filter((f) => !isKept(shas, f));
      if (isKept(shas, fs[0])) bytes += m.bytes || 0;   // its .lwm is kept already, under this edition's sha
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
        await c.put(f.url, new Response(b, { headers: { 'content-type': f.type, 'content-length': String(b.byteLength), ...(f.sha ? { [SHA]: f.sha } : {}) } }));
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
    if (!stop) for (const u of basesOf(v)) if (!await keepData(u)) failed.push({ id: 'basis', url: u, why: 'the basis record could not be kept' });
    const storage = await asked.then(() => storageInfo()).catch(() => null);
    if (stop === 'cancelled') return { ok: false, cancelled: true, n, N, bytes, total, storage };
    if (stop) return { ok: false, why: stop, n, N, bytes, total, storage };
    return { ok: !failed.length, n, N, bytes, total, failed, storage, why: failed.length ? failed.length + ' file(s) failed — press again to resume' : '' };
  })().finally(() => { running.delete(volId); changed(volId, 'install'); });
  running.set(volId, job);
  return job;
}
const installing = (volId) => running.has(volId);

/* ── THE FILE ROAD ── a volume's .lwv from this device's disk: File.slice per entry, one at a time (one disk read), every sha-256 checked */
const volLabel = (v) => 'VOL. ' + (v.numeral || v.id);
const size = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : Math.max(1, Math.round(b / 1e6)) + ' MB');
export function installFile(volId, file, { onProgress = null, signal = null } = {}) {
  if (running.has(volId)) return running.get(volId);
  const asked = persistOnce().catch(() => null);
  const job = (async () => {
    let lwv;
    try { lwv = parseLwv(await file.slice(0, lwvIndexLength(await file.slice(0, 8).arrayBuffer())).arrayBuffer()); }
    catch (_) { return { ok: false, why: (file.name || 'this file') + ' is not a λWAVES volume file' }; }
    const e = lwv.volume, vols = (await shelf({ fresh: true })).volumes, v = vols.find((x) => x.id === e.id), name = file.name || 'this file';
    if (!v || !v.archive) return { ok: false, why: `${name} holds ${volLabel(e)}, which is not on this shelf` };
    if (volId && e.id !== volId) return { ok: false, why: `${name} holds ${volLabel(e)}, not ${volLabel(vols.find((x) => x.id === volId) || { id: volId })}` };
    if (lwv.files[0].sha256 !== v.indexSha256) return { ok: false, why: `${name} is another edition of ${volLabel(v)} than the one this app lists` };
    const c = await store(v.id, true);
    if (!c) return { ok: false, why: 'this browser has no Cache Storage' };
    const keyOf = (f) => (f.path === 'index.json' ? indexUrl(v) : inVolume(v, f.path));
    const shas = await keptShas(c);
    const todo = lwv.files.filter((f) => shas.get(keyOf(f)) !== f.sha256);   // resumable: a file kept under its sha was checked when it was kept (R-07: a stale index.json is replaced)
    const total = lwv.files.reduce((s, f) => s + f.length, 0), need = todo.reduce((s, f) => s + f.length, 0);
    const est = await navigator.storage?.estimate?.().catch(() => null);
    if (est && est.quota && est.quota - (est.usage || 0) < need) return { ok: false, why: `${volLabel(v)} needs ${size(need)} and this device has ${size(Math.max(0, est.quota - (est.usage || 0)))} free for it` };
    const N = lwv.files.length;
    let n = N - todo.length, bytes = total - need;
    const tell = (url) => { if (onProgress) try { onProgress({ n, N, bytes, total, ratio: total ? bytes / total : 1, file: url }); } catch (_) { /* a listener's fault is its own */ } };
    await c.put(SHELF_URL, json(JSON.stringify(v)));
    tell(null);
    for (const f of todo) {
      if (signal && signal.aborted) return { ok: false, cancelled: true, n, N, bytes, total };
      const b = await file.slice(f.offset, f.offset + f.length).arrayBuffer();
      if (b.byteLength !== f.length || await hex(b) !== f.sha256) return { ok: false, why: `${f.path} in ${name} does not match its index — the file is damaged; download it again`, n, N, bytes, total };
      try { await c.put(keyOf(f), new Response(b, { headers: { 'content-type': f.path.endsWith('.json') ? 'application/json' : f.path.endsWith('.webp') ? 'image/webp' : 'application/octet-stream', 'content-length': String(b.byteLength), [SHA]: f.sha256 } })); }
      catch (err) { return { ok: false, why: err && err.name === 'QuotaExceededError' ? 'this device is out of room for it' : String(err && err.message || err), n, N, bytes, total }; }
      n++; bytes += f.length; tell(keyOf(f));
    }
    const failed = [];
    for (const u of basesOf(v)) if (!await keepData(u)) failed.push({ id: 'basis', url: u, why: 'the basis record could not be kept' });
    const storage = await asked.then(() => storageInfo()).catch(() => null);
    return { ok: !failed.length, n, N, bytes, total, failed, storage, why: failed.length ? 'a basis record could not be kept — open the file again online' : '' };
  })().finally(() => { running.delete(volId); changed(volId, 'file'); });
  running.set(volId, job);
  return job;
}

export async function remove(volId) {
  if (!SAFE.test(volId) || !caching()) return false;
  const ok = await caches.delete(cacheOf(volId)).catch(() => false);
  changed(volId, 'remove'); return ok;
}

/* ── iteration 008 V · ONE MOLECULE IN PLACE ── the fetch road's own keys, so the whole install, installStatus, file, picture and remove see no
   difference; the catalogue and the shelf entry are kept beside it (the first molecule makes the cache), and the ladder's basis records */
export async function kept(volId) {
  const c = await store(volId), out = new Set();
  if (!c) return out;
  let v, idx; try { v = await volume(volId); idx = await index(volId); } catch (_) { return out; }
  const shas = await keptShas(c);
  for (const m of idx.molecules) if (filesOf(v, m).every((f) => isKept(shas, f))) out.add(m.id);
  return out;
}
const runningOne = new Map();
export function installMolecule(volId, molId, { onProgress = null, signal = null } = {}) {
  const key = volId + ':' + molId;
  if (runningOne.has(key)) return runningOne.get(key);
  const asked = persistOnce().catch(() => null);   // the iPad law: asked on the press, inside the gesture, never awaited here
  const job = (async () => {
    const { v, m } = await molecule(volId, molId);
    if (!v.index) return { ok: false, why: volLabel(v) + ' installs from its file (the PICKER\'s LIBRARY: OPEN FILE…)' };
    const c = await store(volId, true);
    if (!c) return { ok: false, why: 'this browser has no Cache Storage' };
    const shas = await keptShas(c);
    if (!isKept(shas, { url: indexUrl(v), sha: v.indexSha256 || null }) || !shas.has(SHELF_URL)) {   // a new edition's catalogue and shelf entry replace the old
      await c.put(indexUrl(v), json((await indexBytes(v)).slice(0), v.indexSha256));
      await c.put(SHELF_URL, json(JSON.stringify(v)));
    }
    const fs = filesOf(v, m).filter((f) => !isKept(shas, f)), total = fs.reduce((s, f) => s + (f.lwm ? m.bytes || 0 : 0), 0) || 1;
    let got = 0;
    const tell = () => { if (onProgress) try { onProgress({ bytes: got, total, ratio: Math.min(1, got / total) }); } catch (_) { /* a listener's fault is its own */ } };
    tell();
    for (const f of fs) {
      if (signal && signal.aborted) return { ok: false, cancelled: true };
      let r; try { r = await fetch(f.url, { signal, cache: 'no-cache' }); } catch (e) { return { ok: false, why: signal && signal.aborted ? 'cancelled' : 'the network refused it (offline?)' }; }
      if (!r.ok) return { ok: false, why: 'the server answered ' + r.status };
      let b;
      if (f.lwm && r.body && r.body.getReader) {   // the ring follows the bytes as they come
        const rd = r.body.getReader(), parts = []; let n = 0;
        for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.byteLength; got = n; tell(); }
        const u = new Uint8Array(n); let o = 0; for (const p of parts) { u.set(p, o); o += p.byteLength; } b = u.buffer;
      } else b = await r.arrayBuffer();
      if (f.sha && await hex(b) !== f.sha) return { ok: false, why: 'its bytes do not match the catalogue' };
      try { await c.put(f.url, new Response(b, { headers: { 'content-type': f.type, 'content-length': String(b.byteLength), ...(f.sha ? { [SHA]: f.sha } : {}) } })); }
      catch (e) { return { ok: false, why: e && e.name === 'QuotaExceededError' ? 'this device is out of room for it' : String(e && e.message || e) }; }
      if (f.lwm) { got = total; tell(); }
    }
    const failed = [];   // the rungs open offline (a basis record already kept is not fetched again); 028 R-21: one not kept is said
    for (const u of basesOf(v)) if (!await keepData(u)) failed.push({ id: 'basis', url: u, why: 'the basis record could not be kept' });
    const storage = await asked.then(() => storageInfo()).catch(() => null);
    return { ok: !failed.length, id: molId, bytes: m.bytes || 0, failed, storage, why: failed.length ? 'a basis record could not be kept — press again online' : '' };
  })().catch((e) => ({ ok: false, why: String(e && e.message || e) })).finally(() => { runningOne.delete(key); changed(volId, 'molecule', molId); });
  runningOne.set(key, job);
  return job;
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
export async function picture(volId, molId, style = null) {   // iteration 014 B4: `style` (im · balls · sticks · esp) when the row names it in `thumbs`, else the one picture
  const { v, m } = await molecule(volId, molId), thumb = m.thumb || 't/' + m.id + '.webp';   // iteration 018 A3: a row the index does not name still has its t/<id>.webp (the next pack names it); a miss is the caller's onerror
  const url = inVolume(v, style && (m.thumbs || []).includes(style) ? thumb.replace(/\.webp$/, '.' + style + '.webp') : thumb), c = await store(volId), hit = c && await c.match(url).catch(() => null);
  return hit ? URL.createObjectURL(await hit.blob()) : url;
}
