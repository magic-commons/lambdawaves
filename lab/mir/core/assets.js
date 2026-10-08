/* core/assets.js — THE ASSET STORE: a dropped file's bytes by content hash, its analysis beside them, never in JSON
 * (harvested from BASINS app/audio-assets.js, 2026-10-05).  A project names an asset by its id; the bytes and the
 * heavy analysis (peaks, envelopes) live here, in the browser's own IndexedDB, so a project stays small and two
 * clips of one file share one asset.  Without IndexedDB (node, a locked-down browser, a private window that refuses
 * it) the same API answers from memory for the session.
 *
 *   const id = await assetId(bytes);                       // the first 128 bits of SHA-256, 32 hex digits
 *   await assets.put({ id, name, type, seconds, … }, bytes);   // meta is any JSON-able object with an `id`; typed arrays ride as they are
 *   assets.meta(id)  → the cached meta or null (sync, for a paint)      await assets.load(id) → meta | null
 *   await assets.bytes(id) → Uint8Array | null         await assets.list() → [id]        await assets.delete(id)
 *
 * ONE SHARED STORE, NAMED BY THE APP.  `assets` is the kit's own store (database `mir-assets`).  An app that already
 * keeps its files in a database of its own names it once, before the first use: `useAssets(createAssetStore({ name:
 * 'basins-assets' }))` — the two object stores keep BASINS' names (`audio`, `audio-bytes`, version 1), so the files a
 * user already has are found.  `createAssetStore({ name, indexedDB })` makes another (a test passes its own).
 *
 * THE LAWS.  The id is the content: the same bytes are the same asset wherever they came from, and an import trusts an
 * id only after the bytes hash to it (folders/zip.js).  Out of a secure context (no crypto.subtle) the id is a two-lane
 * FNV-1a over the bytes: still content-addressed, 128 bits wide, not collision-hard.  The bytes are copied in: the
 * caller's buffer is never held.  Nothing here throws on a store failure: a write that fails keeps the bytes in memory
 * and says so by returning, a read that fails answers null.  No DOM, no timers. */

const META = 'audio', BYTES = 'audio-bytes';

export function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromBase64(text) { const s = atob(text), out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }

/** assetId(bytes) → the content hash: SHA-256's first 128 bits where the context is secure, a two-lane FNV-1a where it is not */
export async function assetId(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (globalThis.crypto?.subtle) {
    const d = new Uint8Array(await crypto.subtle.digest('SHA-256', view));
    return [...d.subarray(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let a = 0x811c9dc5, b = 0x01000193 ^ view.length;
  for (let i = 0; i < view.length; i++) { a = Math.imul(a ^ view[i], 0x01000193); b = Math.imul(b ^ view[view.length - 1 - i], 0x01000193); }
  return ((a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0')).repeat(2);
}

const ask = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

export function createAssetStore({ name = 'mir-assets', indexedDB: idb = globalThis.indexedDB } = {}) {
  const metas = new Map(), memory = new Map();
  let opening = null;
  const db = () => {
    if (!idb) return Promise.resolve(null);
    return opening ||= new Promise((resolve) => {
      let r; try { r = idb.open(name, 1); } catch (_) { resolve(null); return; }
      r.onupgradeneeded = () => { for (const s of [META, BYTES]) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
      r.onsuccess = () => resolve(r.result); r.onerror = () => resolve(null); r.onblocked = () => resolve(null);
    });
  };
  async function run(stores, mode, fn) {
    const d = await db(); if (!d) return undefined;
    return new Promise((resolve, reject) => {
      const t = d.transaction(stores, mode); let out;
      Promise.resolve(fn(t)).then((v) => { out = v; }, reject);
      t.oncomplete = () => resolve(out); t.onerror = t.onabort = () => reject(t.error || new Error('Asset store failed'));
    });
  }
  return {
    name,
    id: assetId,
    /** put(meta, bytes) → id.  meta: { id, … } (peaks: [{ rate, data: Int8Array }], envelopes: { band: base64 } for audio) */
    async put(meta, bytes) {
      const copy = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes);
      metas.set(meta.id, meta);
      const stored = await run([META, BYTES], 'readwrite', (t) => { t.objectStore(META).put(meta, meta.id); t.objectStore(BYTES).put(copy.buffer, meta.id); return true; }).catch(() => undefined);
      if (stored === undefined) memory.set(meta.id, copy);
      return meta.id;
    },
    /** meta(id) — what is cached now (a paint reads this), or null: load(id) asks the database */
    meta: (id) => metas.get(id) || null,
    async load(id) {
      if (metas.has(id)) return metas.get(id);
      const meta = await run([META], 'readonly', (t) => ask(t.objectStore(META).get(id))).catch(() => undefined);
      if (meta) metas.set(id, meta);
      return meta || null;
    },
    async bytes(id) {
      if (memory.has(id)) return memory.get(id);
      const buffer = await run([BYTES], 'readonly', (t) => ask(t.objectStore(BYTES).get(id))).catch(() => undefined);
      return buffer ? new Uint8Array(buffer) : null;
    },
    async list() {
      const keys = await run([META], 'readonly', (t) => ask(t.objectStore(META).getAllKeys())).catch(() => undefined);
      return [...new Set([...(keys || []), ...memory.keys()])];
    },
    async delete(id) {
      metas.delete(id); memory.delete(id);
      await run([META, BYTES], 'readwrite', (t) => { t.objectStore(META).delete(id); t.objectStore(BYTES).delete(id); }).catch(() => undefined);
    },
  };
}

/* THE SHARED STORE.  `assets` never changes identity; useAssets(store) points it elsewhere (before first use). */
let current = createAssetStore();
export const assets = {
  get name() { return current.name; },
  id: (bytes) => assetId(bytes),
  put: (meta, bytes) => current.put(meta, bytes), meta: (id) => current.meta(id), load: (id) => current.load(id),
  bytes: (id) => current.bytes(id), list: () => current.list(), delete: (id) => current.delete(id),
};
export function useAssets(store) { if (store && typeof store.put === 'function') current = store; return assets; }
