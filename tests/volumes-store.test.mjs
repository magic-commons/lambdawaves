/* tests/volumes-store.test.mjs — lab/volumes.js' store over a fake Cache Storage and a fake network (028 CHAIN C).
 * R-07: a file kept under an older edition's sha (same volume id, a re-edition) is NOT KEPT on each read road — installStatus, kept,
 * install re-fetches it, the .lwv file road re-slices it — and a stale index.json of equal length is replaced by the file road.
 * R-21: installMolecule is not ok while a basis record it needs was not kept, and says which. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const enc = (s) => new TextEncoder().encode(s);

/* ── the fakes: Cache Storage (url → bytes + headers), the network (url → bytes), the page's location ── */
class FakeCache {
  constructor() { this.m = new Map(); }
  async put(q, r) { this.m.set(typeof q === 'string' ? q : q.url, { body: await r.arrayBuffer(), headers: [...r.headers] }); }
  async match(q) { const e = this.m.get(typeof q === 'string' ? q : q.url); return e ? new Response(e.body.slice(0), { headers: e.headers }) : undefined; }
  async keys() { return [...this.m.keys()].map((url) => ({ url })); }
  async delete(q) { return this.m.delete(typeof q === 'string' ? q : q.url); }
}
const stores = new Map();
globalThis.caches = {
  has: async (n) => stores.has(n),
  open: async (n) => { if (!stores.has(n)) stores.set(n, new FakeCache()); return stores.get(n); },
  keys: async () => [...stores.keys()],
  delete: async (n) => stores.delete(n),
};
const LAB = new URL('../lab/', import.meta.url).href;
globalThis.location = { href: LAB + 'index.html' };
const net = new Map(), fetched = [];
let basisDown = false;
globalThis.fetch = async (u) => {
  const url = String(u); fetched.push(url);
  if (url.includes('/vendor/bse/')) return basisDown ? new Response('', { status: 500 }) : new Response('{}');
  return net.has(url) ? new Response(net.get(url).slice(0)) : new Response('', { status: 404 });
};

const V = await import('../lab/volumes.js');
const BASE = LAB + 'volumes/';

/* ── two editions of one molecule `a` (equal length, other bytes) and one unchanged molecule `b` ── */
const a1 = enc('LWM1 edition one ·· a'), a2 = enc('LWM1 edition two ·· a'), b2 = enc('LWM1 the same ····· b'), tA = enc('webp-a'), tB = enc('webp-b');
const catalogue = (id, aBytes) => enc(JSON.stringify({ schema: 1, id, numeral: 'T', molecules: [
  { id: 'a', name: 'a', file: 'm/a.lwm', bytes: aBytes.length, sha256: sha(aBytes), thumb: 't/a.webp' },
  { id: 'b', name: 'b', file: 'm/b.lwm', bytes: b2.length, sha256: sha(b2), thumb: 't/b.webp' }] }));
const ix1 = catalogue('vol-t', a1), ix2 = catalogue('vol-t', a2), fx1 = catalogue('vol-f', a1), fx2 = catalogue('vol-f', a2), hx = catalogue('vol-3', a2);
assert.equal(fx1.length, fx2.length, 'the fixture: the stale catalogue is the same length as the new one');
net.set(BASE + 'volumes.json', enc(JSON.stringify({ schema: 1, volumes: [
  { id: 'vol-t', numeral: 'T', title: 'fetch', index: 'vol-t/index.json', indexSha256: sha(ix2), count: 2 },
  { id: 'vol-f', numeral: 'F', title: 'file', archive: { name: 'vol-f.lwv' }, indexSha256: sha(fx2), count: 2 },
  { id: 'vol-3', numeral: 'III', title: 'held', index: 'vol-3/index.json', indexSha256: sha(hx), count: 2 }],
  addons: [{ id: 'vol-9', numeral: 'IX', store: 'steam://store/123' }, { id: 'vol-8', numeral: 'VIII', store: 'https://example.org/' }, { id: 'vol-3', numeral: 'III', store: null }, { id: 'vol-t', numeral: 'T' }, { id: '../x', numeral: 'X' }] })));
net.set(BASE + 'vol-3/index.json', hx);
const T = BASE + 'vol-t/';
for (const [k, b] of [['index.json', ix2], ['m/a.lwm', a2], ['m/b.lwm', b2], ['t/a.webp', tA], ['t/b.webp', tB]]) net.set(T + k, b);

/* the device as an older edition left it: a's .lwm kept under edition one's sha, b's under its own, the pictures, the new catalogue */
const seed = async (name, entries) => { const c = await caches.open(name); for (const [url, b, h] of entries) await c.put(url, new Response(b, { headers: { 'content-length': String(b.length), ...(h ? { 'x-lw-sha256': h } : {}) } })); };
await seed('lw-vol-vol-t', [[T + 'index.json', ix2, sha(ix2)], [T + 'm/a.lwm', a1, sha(a1)], [T + 'm/b.lwm', b2, sha(b2)], [T + 't/a.webp', tA], [T + 't/b.webp', tB]]);
const kept = async (name, url) => sha(new Uint8Array(await (await stores.get(name).match(url)).arrayBuffer()));

{ const s = await V.installStatus('vol-t');
  assert.deepEqual([s.state, s.n, s.N], ['partial', 1, 2], 'installStatus: a file kept under a stale sha is not kept (partial 1/2, not installed)'); }
{ const k = await V.kept('vol-t');
  assert.deepEqual([...k], ['b'], 'kept: the stale molecule is not among the kept'); }
{ fetched.length = 0;
  const r = await V.install('vol-t');
  assert.equal(r.ok, true, 'install: ok — ' + r.why);
  assert(fetched.includes(T + 'm/a.lwm') && !fetched.includes(T + 'm/b.lwm'), 'install: the stale .lwm is fetched again, the current one is skipped');
  assert.equal(await kept('lw-vol-vol-t', T + 'm/a.lwm'), sha(a2), 'install: the kept .lwm is the new edition');
  assert.equal((await V.installStatus('vol-t')).state, 'installed', 'install: installed afterwards'); }

/* the file road: a .lwv of edition two over a device holding edition one's catalogue and .lwm at their lengths */
const lwv = (files) => {
  const pad8 = (n) => (n + 7) & ~7, list = [], parts = [];
  let head = enc(JSON.stringify({ schema: 1, volume: { id: 'vol-f', numeral: 'F' }, files: files.map(([path, b]) => ({ path, sha256: sha(b), offset: 0, length: b.length })) }));
  let at = pad8(8 + head.length + 64 * files.length);   // room for the offsets' digits
  for (const [path, b] of files) { list.push({ path, sha256: sha(b), offset: at, length: b.length }); parts.push([at, b]); at = pad8(at + b.length); }
  head = enc(JSON.stringify({ schema: 1, volume: { id: 'vol-f', numeral: 'F' }, files: list }));
  const out = new Uint8Array(at); out.set(enc('LWV1')); new DataView(out.buffer).setUint32(4, head.length, true); out.set(head, 8);
  for (const [o, b] of parts) out.set(b, o);
  return out;
};
const F = BASE + 'vol-f/';
await seed('lw-vol-vol-f', [[F + 'index.json', fx1], [F + 'm/a.lwm', a1], [F + 'm/b.lwm', b2, sha(b2)], [F + 't/a.webp', tA, sha(tA)], [F + 't/b.webp', tB, sha(tB)]]);
{ const file = new File([lwv([['index.json', fx2], ['m/a.lwm', a2], ['m/b.lwm', b2], ['t/a.webp', tA], ['t/b.webp', tB]])], 'vol-f.lwv');
  const r = await V.installFile('vol-f', file);
  assert.equal(r.ok, true, 'installFile: ok — ' + r.why);
  assert.equal(await kept('lw-vol-vol-f', F + 'index.json'), sha(fx2), 'installFile: a stale index.json of equal length is replaced');
  assert.equal(await kept('lw-vol-vol-f', F + 'm/a.lwm'), sha(a2), 'installFile: a stale .lwm of equal length is re-sliced');
  assert.equal((await V.installStatus('vol-f')).state, 'installed', 'installFile: installed afterwards (the kept catalogue reads)'); }

/* R-21: a molecule kept while a ladder basis record could not be (keepData false: the record's fetch fails, lw-data-v1 empty) */
{ stores.delete('lw-data-v1'); basisDown = true;
  const r = await V.installMolecule('vol-t', 'b');
  basisDown = false;
  assert.equal(r.ok, false, 'installMolecule: not ok when a basis record it needs was not kept');
  assert(r.failed.length && r.failed.every((f) => f.id === 'basis') && /basis record/.test(r.why), 'installMolecule: the failed records and a why that says so'); }

/* 044 S3: a HELD volume (lab/volumes.js HELD) is not offered, its entry is still read, and a device that holds some of it sees it */
{ assert.deepEqual(V.HELD, ['vol-3'], 'HELD names VOL. III alone');
  const s = await V.shelf({ fresh: true });
  assert.deepEqual(s.volumes.map((v) => v.id), ['vol-t', 'vol-f'], 'shelf: a held volume is not offered');
  assert.deepEqual(s.all.map((v) => v.id), ['vol-t', 'vol-f', 'vol-3'], 'shelf: its entry is kept');
  assert.deepEqual(s.addons, [{ id: 'vol-9', numeral: 'IX', store: 'steam://store/123' }, { id: 'vol-8', numeral: 'VIII', store: null }], 'shelf: an add-on not installed is named with a steam://store/<digits> address or none; never a held volume, one on the shelf, or a bad id (044 S10)');
  assert.equal((await V.index('vol-3')).molecules.length, 2, 'index: a held volume still opens by its id');
  await seed('lw-vol-vol-3', [[BASE + 'vol-3/index.json', hx, sha(hx)]]);
  assert.deepEqual((await V.shelf({ fresh: true })).volumes.map((v) => v.id), ['vol-t', 'vol-f', 'vol-3'], 'shelf: a device that holds some of a held volume keeps it on its shelf'); }

/* 044 S8: on the desktop host a shelf volume with an index is served from the package's disk — installed as it stands, nothing copied */
{ globalThis.lwavesDesktop = {}; stores.delete('lw-vol-vol-t'); fetched.length = 0;
  const st = await V.installStatus('vol-t');
  assert.deepEqual([st.state, st.n, st.N, st.served], ['installed', 2, 2, true], 'served: installed without a cache');
  assert.deepEqual([...await V.kept('vol-t')].sort(), ['a', 'b'], 'served: every molecule is kept');
  assert.equal((await V.install('vol-t')).ok, true, 'served: install is ok'); assert.equal((await V.installMolecule('vol-t', 'a')).ok, true, 'served: installMolecule is ok');
  assert.equal(stores.has('lw-vol-vol-t'), false, 'served: nothing was copied into Cache Storage');
  assert.equal(sha(new Uint8Array(await V.file('vol-t', 'a', { network: false }))), sha(a2), 'served: a project re-open reads the file from the package');
  assert.equal(await V.remove('vol-t'), false, 'served: the card does not remove what Steam installed');
  delete globalThis.lwavesDesktop; }

console.log('PASS the volumes store: a file kept under a stale sha is not kept on installStatus, kept, install and the .lwv road; a stale index.json is replaced; installMolecule says a basis record it could not keep; a held volume is off the shelf, still opens by id, and stays where a device holds it; a volume the desktop serves is installed with nothing copied');
