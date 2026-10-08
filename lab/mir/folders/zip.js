/* MIR · folders/zip.js — THE PROJECT ZIP: FL's "Save project as zip" (harvested from BASINS app/audio-assets.js projectZip /
 * readProjectZip and its SAVE AS ZIP / OPEN ZIP, 2026-10-05).  PURE but for the asset store it is handed: node runs it.
 *
 *   projectZip(project, { store, ids }) → Promise<Blob>           project.json + the assets the project names
 *   readProjectZip(blob) → Promise<{ project, assets, rejected }>  READS ONLY: CRC checked, nothing written anywhere
 *   restoreAssets(read, { store }) → Promise<{ restored, skipped, written }>   writes them; a failure rolls back what it wrote
 *   rollbackAssets(written, { store })     deletes assets this open added (never one that was already there)
 *   projectAssetIds(project) → [id]        the ids a project names: its `assets` part's manifest and its timeline's audio curves
 *   zipProject({ entry, parts, capture, untitled }) → Promise<{ name, project }>   what SAVE AS ZIP writes (below)
 *
 * THE ZIP (docs/FORMAT.md): `project.json` (the project's data, plus `name`) · `assets/audio/<id>.<ext>` (the file's own
 * bytes, stored not deflated) · `assets/audio/<id>.json` (its analysis: peaks as base64).  The same layout BASINS made, so a
 * zip from one opens in the other.  OPENING never trusts the file: every entry passes its CRC (core/zip.js), an asset is
 * restored only when its bytes hash to its own id, an id already in the store is left alone (skipped, not rewritten), and
 * names are matched, never used as paths (a hostile `../` entry names nothing).  The caller (FOLDERS) validates the
 * project BEFORE anything is written, writes the assets, then saves the project under its name (a clash is numbered by the
 * library, never an overwrite); if that fails, the assets this open wrote are rolled back. */
import { StoredZip, readStoredZip } from '../core/zip.js';
import { assets as shared, toBase64, fromBase64, assetId } from '../core/assets.js';

const enc = new TextEncoder(), dec = new TextDecoder();
const HEX = /^[a-f0-9]{32}$/;
const ext = (meta) => (/\.([a-z0-9]{1,5})$/i.exec(meta.name || '')?.[1] || (meta.type || '').split('/')[1] || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';

/** the asset ids a project names: the `assets` part's manifest, and every audio curve of a timeline (the kit's part, or BASINS' own shape) */
export function projectAssetIds(project) {
  const ids = new Set(), take = (v) => { if (typeof v === 'string' && HEX.test(v)) ids.add(v); };
  const timelines = [project?.parts?.timeline, project?.timeline];
  for (const tl of timelines) for (const c of Array.isArray(tl?.curves) ? tl.curves : []) if (c && c.kind === 'audio') take(c.assetId);
  for (const m of [project?.parts?.assets, project?.assets]) for (const a of Array.isArray(m?.audio) ? m.audio : []) take(a && a.id);
  return [...ids];
}

/** zipProject({ entry, parts, capture, untitled }) — what SAVE AS ZIP writes: the LIVE project, named after the entry the gallery
 *  shows (selected or open), else `untitled` (BASINS' UNTITLED; never the name field's proposal, which is the app's default name,
 *  BASINS' FRACTAL).  The project's data is `parts()` when the app hands its project parts (FOLDERS `zip: { parts }`: BASINS'
 *  session, read with no engine up), else `capture().payload` (the adapter's capture, which may need the engine for its thumbnail). */
export async function zipProject({ entry = null, parts = null, capture, untitled = 'UNTITLED' } = {}) {
  const data = typeof parts === 'function' ? await parts() : (await capture()).payload;
  const name = entry && entry.name ? entry.name : untitled;
  return { name, project: { ...(data && typeof data === 'object' && !Array.isArray(data) ? data : {}), name } };
}

/** projectZip(project, { store, ids }) — project.json plus every asset the project names (those the store lacks are left out) */
export async function projectZip(project, { store = shared, ids = projectAssetIds(project) } = {}) {
  const zip = new StoredZip();
  zip.add('project.json', enc.encode(JSON.stringify(project)));
  for (const id of ids) {
    const meta = await store.load(id), bytes = await store.bytes(id);
    if (!meta || !bytes) continue;
    const json = { ...meta, peaks: (meta.peaks || []).map((p) => ({ rate: p.rate, data: toBase64(new Uint8Array(p.data.buffer, p.data.byteOffset, p.data.byteLength)) })) };
    zip.add(`assets/audio/${id}.json`, enc.encode(JSON.stringify(json)));
    zip.add(`assets/audio/${id}.${ext(meta)}`, bytes);
  }
  return zip.finish();
}

/** readProjectZip(blob) — { project (parsed, or null with no project.json), assets: [{ id, meta, bytes }] (each hashed to its id),
 *  rejected: [id] (an entry whose bytes do not hash to its name) }.  Throws on a damaged ZIP, a failed CRC, bad JSON. */
export async function readProjectZip(blob) {
  const files = readStoredZip(new Uint8Array(await blob.arrayBuffer()));
  const project = files.has('project.json') ? JSON.parse(dec.decode(files.get('project.json'))) : null;
  const found = [], rejected = [];
  for (const [name, bytes] of files) {
    const m = /^assets\/audio\/([a-f0-9]{32})\.json$/.exec(name); if (!m) continue;
    const json = JSON.parse(dec.decode(bytes)), body = [...files].find(([n]) => n.startsWith(`assets/audio/${m[1]}.`) && !n.endsWith('.json'))?.[1];
    if (!body || json.id !== m[1] || await assetId(body) !== m[1]) { rejected.push(m[1]); continue; }
    found.push({ id: m[1], meta: { ...json, peaks: (json.peaks || []).map((p) => ({ rate: p.rate, data: new Int8Array(fromBase64(p.data).buffer) })) }, bytes: body });
  }
  return { project, assets: found, rejected };
}

/** restoreAssets(read, { store }) — write every asset the store lacks.  { restored: every id the project can now find, skipped: those
 *  already there (left alone), written: those THIS call added }.  A write that fails rolls back what the call wrote and throws. */
export async function restoreAssets(read, { store = shared } = {}) {
  const restored = [], skipped = [], written = [];
  try {
    for (const a of read.assets) {
      if (await store.bytes(a.id)) { skipped.push(a.id); restored.push(a.id); continue; }
      await store.put(a.meta, a.bytes); written.push(a.id); restored.push(a.id);
    }
  } catch (e) { await rollbackAssets(written, { store }); throw e; }
  return { restored, skipped, written };
}
export async function rollbackAssets(written, { store = shared } = {}) { for (const id of written) { try { await store.delete(id); } catch (_) { /* gone */ } } }
