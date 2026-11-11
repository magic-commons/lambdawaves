/* lab/search-index.js — 042 Q · THE SEARCH KNOWS THE WHOLE APP: the index and its ranking, the old-fashioned way.  Pure: the documents are handed in.
 *   doc { id: 'kind:key', kind, title, alias?, exact?: [formula · symbol], keys?, body?, prior? (0…1), off? (greyed: last in its tier) }
 *   createIndex(docs, { frecency }) → { search(query, { kinds }) → [{ doc, tier, score }], byId } · createFrecency(store, now?) · scope · tokens · marks
 * THE TIERS (a higher always beats a lower): 1 the whole title or an exact field · 2 their prefix · 3 every term a word's prefix, in order, in the
 * title or an alias · 4 in any order, anywhere · 5 the initials ("ep") · 6 a typo (Damerau–Levenshtein ≤ 1 at 4–7 letters, ≤ 2 at 8+, never into a
 * word under 4; candidates from trigrams) · 7 the letters in order ("tmln") · 8 no doc holds every term: the docs holding the most.  Inside one:
 * BM25 over the fields (title 4 · alias 3 · keys 2 · body 1; a term's best field, the others a tenth — the exact field, 5, is matched whole),
 * proximity, an earlier word, the prior, frecency.  A doc picked for a query this one begins is LEARNED: it joins tier 1, first there. */

/** what people type, folded into the docs: [words, …targets] — a target with ':' a doc id, a bare word every doc whose title holds it */
const SYNONYMS = [
  ['screenshot snapshot photo image', 'action:export.picture'],
  ['fullscreen maximise maximize', 'action:fullscreen'], ['tl', 'window:timeline'], ['lfo envelope automation macro', 'window:modulation'],
  ['shortcuts hotkeys keybindings', 'action:help'], ['prefs preferences options', 'window:settings', 'action:gui'],
  ['dark light night', 'action:theme'], ['start stop pause', 'action:transport.play'], ['periodic elements table', 'page:atomic'],
  ['library volumes', 'page:library'], ['videos clips learn help', 'page:tutorial'], ['home lab', 'page:face'],
  ['colour color', 'colour', 'color'], ['centre center', 'centre', 'center'], ['grey gray', 'grey', 'gray'],
  ['normalise normalize', 'normalize'], ['undo redo', 'action:history'], ['lsd', 'lysergic'], ['quark charm cornell', 'system:cornell'],
];
/** the words a window is found by besides its name (the FINDER's too; 039 F2: "colour" marks PALETTE first) */
export const WINDOW_WORDS = { nodes: 'effects fx grain film vignette curves look blur glow bloom',
  render: 'film video movie mp4 export record',
  light: 'lighting sun shadow lamp', stage: 'background colour color gamma axes frame', palette: 'colours colors gradient hue', observer: 'style look cloud',
  camera: 'view zoom rotate orbit fov', clip: 'cut plane slice section', chem: 'molecule chemistry benzene water orbitals', spectrum: 'states hydrogen orbitals levels',
  projects: 'save open files projects', history: 'undo redo', widgets: 'clock text', equalizer: 'audio sound music', informational: 'labels words captions text',
  settings: 'quality performance theme' };
const SIGNS = { '>': ['action'], '@': ['window'], '#': ['molecule', 'element'], ':': ['state'] };
const STOP = new Set(['a', 'an', 'the', 'of', 'to', 'and', 'or', 'on', 'in', 'it', 'its', 'for', 'by', 'as', 'at', 'with', 'from', 'one']);
const W = [4, 3, 5, 2, 1], NF = 5, K1 = 1.2, B = 0.75, HALF = 14 * 864e5, CAP = 200;
const GREEK = new Map();
for (const w of 'αalpha βbeta γgamma δdelta εepsilon ζzeta ηeta θtheta κkappa λlambda μmu νnu ξxi πpi ρrho σsigma ςsigma τtau φphi χchi ψpsi ωomega'.split(' ')) {
  GREEK.set(w[0], w.slice(1)); GREEK.set(w[0].toUpperCase(), w[1].toUpperCase() + w.slice(2)); }
/** fold(s) — compatibility forms (H₂O = H2O), no marks, − and – as '-', Greek as its names (λWAVES = lambdaWAVES); the case kept */
const fold = (s) => String(s ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[−–]/g, '-').replace(/[Ͱ-Ͽ]/g, (c) => GREEK.get(c) ?? c);
const WORD = /(?<![0-9])-[0-9]+|[0-9]+|\p{Lu}+(?!\p{Ll})|\p{Lu}?\p{Ll}+|[\p{L}\p{N}]+/gu, ASCII = /(?<![0-9])-[0-9]+|[0-9]+|[A-Z]+(?![a-z])|[A-Z]?[a-z]+/g, PLAIN = /^[\x00-\x7f]*$/;
/** tokens(s) — the words, lower case, split on punctuation, camelCase and the digit/letter edges; a minus before a number kept ("4f-2") */
export const tokens = (s) => { if (!s) return []; s = String(s); const m = PLAIN.test(s) ? s.match(ASCII) : fold(s).match(WORD); return m ? m.map((t) => t.toLowerCase()) : []; };
/** flat(s) — tokens(s).join(''), by two replaces: H₂O = h2o, 4f₋₂ = 4f-2 */
const flat = (s) => (PLAIN.test(s = String(s ?? '')) ? s : fold(s)).toLowerCase().replace(/[^\p{L}\p{N}-]+/gu, '').replace(/-(?![0-9])|(?<=[0-9])-/g, '');
/** scope(query) — a leading sign: > actions · @ windows · # molecules and elements · : states */
export function scope(query) {
  const s = String(query || '').trimStart(), k = SIGNS[s[0]];
  return k ? { kinds: k, q: s.slice(1).trim() } : { kinds: null, q: s.trim() };
}
/* Damerau–Levenshtein (the optimal string alignment), on three reused rows */
const R0 = new Int32Array(64), R1 = new Int32Array(64), R2 = new Int32Array(64);
function dl(a, b, max) {
  const n = a.length, m = b.length; if (Math.abs(n - m) > max || m > 62) return max + 1;
  let pp = R0, p = R1, c = R2; for (let j = 0; j <= m; j++) p[j] = j;
  for (let i = 1; i <= n; i++) {
    c[0] = i; let low = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1; let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
      c[j] = v; if (v < low) low = v;
    }
    if (low > max) return max + 1;
    const t = pp; pp = p; p = c; c = t;
  }
  return p[m];
}
const tri = (t) => { const s = '$' + t + '$', out = []; for (let i = 0; i + 3 <= s.length; i++) out.push(s.slice(i, i + 3)); return out; };
/** the terms in one field's words, in order: { first, near } | null */
function inOrder(words, terms) {
  let at = -1, first = -1, near = 0;
  for (const q of terms) { let i = at + 1; while (i < words.length && !words[i].startsWith(q)) i++; if (i >= words.length) return null; if (first < 0) first = i; else if (i === at + 1) near++; at = i; }
  return { first, near };
}
/** the shortest run of `w` (the words run together) with q's letters in order, from a word's start; 0 when none */
function span(words, w, q) {
  let best = 0, s = 0;
  for (const x of words) { if (x[0] === q[0]) { let j = s, k = 0; for (; j < w.length && k < q.length; j++) if (w[j] === q[k]) k++; if (k === q.length && (!best || j - s < best)) best = j - s; } s += x.length; }
  return best;
}
const sub = (w, q) => { let k = 0; for (let j = 0; j < w.length && k < q.length; j++) if (w[j] === q[k]) k++; return k === q.length; };
/** the initials of the words that are not small ones nor numbers ("EXPORT a PICTURE of the stage (×2)" → eps) */
const initialsOf = (words) => { let o = ''; for (const w of words) if (!STOP.has(w) && !(w[0] >= '0' && w[0] <= '9') && w[0] !== '-') o += w[0]; return o; };

export function createIndex(docs, { frecency = null } = {}) {
  const N = docs.length, byId = new Map(docs.map((d, i) => [d.id, i])), extra = docs.map(() => []), titleW = docs.map((d) => tokens(d.title)), bare = new Map();
  for (const [words, ...to] of SYNONYMS) for (const t of to) {
    if (t.includes(':')) { const i = byId.get(t); if (i !== undefined) extra[i].push(words); } else bare.set(t, (bare.get(t) || []).concat(words));
  }
  titleW.forEach((ws, i) => { for (const w of ws) if (bare.has(w)) extra[i].push(...bare.get(w)); });
  const vocab = new Map(), words = [], pt = [], pc = [], lens = new Float32Array(N * NF), avg = new Float64Array(NF);
  const aliasW = [], bodyW = [], titleJ = [], exactJ = [];
  for (let i = 0; i < N; i++) {
    const d = docs[i], fields = [titleW[i], tokens(extra[i].length ? [d.alias, ...extra[i]].join(' ') : d.alias), null, tokens(d.keys), tokens(d.body)];
    for (let k = 0; k < NF; k++) {   // the exact field (2) is matched whole, never word by word
      const ws = fields[k]; if (!ws) continue; lens[i * NF + k] = ws.length; avg[k] += ws.length;
      for (let pos = 0; pos < ws.length; pos++) { const w = ws[pos]; let t = vocab.get(w); if (t === undefined) { t = words.length; vocab.set(w, t); words.push(w); } pt.push(t); pc.push(i * 256 + k * 32 + Math.min(pos, 31)); }
    }
    aliasW.push(fields[1]);
    const tw = titleW[i], lead = tw.length && STOP.has(tw[0]) ? tw.findIndex((w) => !STOP.has(w)) : 0, body = lead > 0 ? tw.slice(lead) : tw;
    bodyW.push(body); titleJ.push(body.join('')); exactJ.push(d.exact ? [].concat(d.exact).map(flat).filter(Boolean) : []);
  }
  for (let k = 0; k < NF; k++) avg[k] = N ? avg[k] / N : 0;
  /* the postings in word order: word t's are post[off[t] … off[t + 1]), each doc · 256 + field · 32 + place */
  const off = new Int32Array(words.length + 1), post = new Int32Array(pc.length);
  for (const t of pt) off[t + 1]++; for (let t = 0; t < words.length; t++) off[t + 1] += off[t];
  { const fill = off.slice(0, -1); for (let j = 0; j < pt.length; j++) post[fill[pt[j]]++] = pc[j]; }
  const sorted = words.map((w, t) => t).sort((a, b) => (words[a] < words[b] ? -1 : words[a] > words[b] ? 1 : 0)), sw = sorted.map((t) => words[t]);
  const grams = new Map(); words.forEach((w, t) => { if (w.length >= 4) for (const g of tri(w)) { let l = grams.get(g); if (!l) grams.set(g, (l = [])); l.push(t); } });
  const lower = (q) => { let lo = 0, hi = sw.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sw[m] < q) lo = m + 1; else hi = m; } return lo; };
  /* the score arrays, reused at every keystroke */
  const maskP = new Uint32Array(N), maskT = new Uint32Array(N), maskA = new Uint32Array(N), score = new Float64Array(N), tf = new Float64Array(N), top = new Float64Array(N), hit = new Uint8Array(N);
  const typoOf = (q) => {
    const max = q.length >= 8 ? 2 : 1, seen = new Set(), out = [];
    for (const g of tri(q)) for (const t of grams.get(g) || []) { if (seen.has(t)) continue; seen.add(t); const w = words[t];
      if (w.startsWith(q)) continue;
      if (dl(q, w, max) <= max || (w.length > q.length && dl(q, w.slice(0, q.length), max) <= max)) out.push(t); }
    return out;
  };

  function search(query, { kinds = null } = {}) {
    const terms = tokens(query).slice(0, 8), qj = terms.join(''), K = terms.length, full = (1 << K) - 1;
    const ok = (i) => !kinds || kinds.includes(docs[i].kind);
    if (!qj) return kinds ? docs.map((doc, i) => ({ doc, tier: 9, score: doc.prior || 0, i })).filter((r) => ok(r.i)).sort((a, b) => b.score - a.score || a.i - b.i) : [];
    const touched = [];
    const touch = (i) => { if (!hit[i]) { hit[i] = 1; touched.push(i); } };
    terms.forEach((q, n) => {
      const list = [], bit = 1 << n;
      const take = (t, cover) => { for (let j = off[t]; j < off[t + 1]; j++) { const p = post[j], i = p >> 8, k = (p >> 5) & 7; if (!ok(i)) continue;
        const c = W[k] * cover / (1 - B + B * lens[i * NF + k] / (avg[k] || 1)) + 1e-9; if (!tf[i]) list.push(i); tf[i] += c; if (c > top[i]) top[i] = c;
        if (cover > 0.4) { maskP[i] |= bit; if (k < 2) maskA[i] |= bit; } else maskT[i] |= bit; touch(i); } };
      for (let j = lower(q); j < sw.length && sw[j].startsWith(q); j++) take(sorted[j], sw[j] === q ? 1 : 0.5 + 0.5 * q.length / sw[j].length);
      if (q.length >= 4) for (const t of typoOf(q)) take(t, 0.4);
      const idf = Math.log(1 + (N - list.length + 0.5) / (list.length + 0.5));
      for (const i of list) { const t = top[i] + 0.1 * (tf[i] - top[i]); score[i] += idf * t * (K1 + 1) / (t + K1); tf[i] = top[i] = 0; }   // the best field, the others a tenth (DisMax)
    });
    const learned = frecency && frecency.learned(qj), global = frecency && frecency.global();
    const out = [];
    const letters = K === 1 && /^[a-z]{2,8}$/.test(qj);
    for (let i = 0; i < N; i++) {
      if (!ok(i)) continue;
      const d = docs[i], tj = titleJ[i], ex = exactJ[i]; let tier = 0, s = hit[i] ? score[i] : 0, ini;
      if (tj === qj || ex.includes(qj)) tier = 1;
      else if (tj.startsWith(qj) || ex.some((e) => e.startsWith(qj))) tier = 2;
      else if (maskP[i] === full) { const o = maskA[i] === full && (inOrder(titleW[i], terms) || inOrder(aliasW[i], terms)); tier = o ? 3 : 4; if (o) s += o.near + 0.5 / (1 + o.first); }
      else if (letters && bodyW[i].length > 1 && (ini = initialsOf(bodyW[i]))[0] === qj[0] && sub(ini, qj)) { tier = 5; s += ini === qj ? 1 : ini.startsWith(qj) ? 0.5 : 0; }
      else if ((maskP[i] | maskT[i]) === full) tier = 6;
      else { const n = qj.length >= 2 ? span(bodyW[i], tj, qj) : 0; if (n) { tier = 7; s += qj.length / n; } }
      if (!tier && K > 1 && (maskP[i] | maskT[i])) tier = 8;
      if (!tier) continue;
      if (tier <= 2) { const o = inOrder(titleW[i], terms); if (o) s += 0.5 / (1 + o.first); }
      s += d.prior || 0;
      const lw = learned && learned.get(d.id), g = global && global.get(d.id);
      if (lw) { tier = 1; s += 10 + lw; }
      if (g) s += 0.25 * Math.log2(1 + g);
      if (d.off) s -= 100;
      out.push({ doc: d, tier, score: s, i, held: bits(maskP[i] | maskT[i]) });
    }
    for (const i of touched) { hit[i] = 0; maskP[i] = maskT[i] = maskA[i] = 0; score[i] = 0; }
    const most = out.some((r) => r.tier < 8) ? K + 1 : Math.max(0, ...out.map((r) => r.held));   // no doc holds every term: the docs holding the most
    return out.filter((r) => r.tier < 8 || r.held === most).sort((a, b) => a.tier - b.tier || b.score - a.score || a.i - b.i);
  }
  return { search, byId: (id) => docs[byId.get(id)] || null };
}
const bits = (m) => { let n = 0; for (; m; m &= m - 1) n++; return n; };

/** marks(title, query) → the [from, to) runs of the title's own characters the terms begin (else their letters, in order) */
export function marks(title, query) {
  const src = [], at = []; let f = '';
  for (let i = 0; i < title.length; i++) { const c = fold(title[i]); for (let k = 0; k < c.length; k++) at.push(i); f += c; }
  at.push(title.length);
  const ws = [...f.matchAll(WORD)].map((m) => ({ s: m.index, w: m[0].toLowerCase() })), used = new Set();
  for (const q of tokens(query)) {
    const w = ws.find((x) => !used.has(x) && x.w.startsWith(q));
    if (w) { used.add(w); src.push([at[w.s], at[w.s + q.length - 1] + 1]); continue; }
    const low = f.toLowerCase(); let k = 0; for (let i = 0; i < low.length && k < q.length; i++) if (low[i] === q[k]) { src.push([at[i], at[i] + 1]); k++; }
  }
  return src.sort((a, b) => a[0] - b[0]).reduce((o, r) => { const l = o[o.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else o.push(r); return o; }, []);
}

/** createFrecency(store, now) — { v: 1, picks: [[query, id, count, time]] }, newest first, 200 at most; a pick's weight halves in 14 days.
 *  learned(q): the docs picked for a query q begins; global(): every doc's weight; recent(n): the last n picked */
export function createFrecency(store, now = () => Date.now()) {
  let picks = [];
  try { const o = store.get(); if (o && Array.isArray(o.picks)) picks = o.picks.filter((p) => Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string' && p[2] > 0 && p[3] > 0); } catch (_) {}
  const w = (p) => p[2] * Math.pow(0.5, (now() - p[3]) / HALF);
  const sum = (list) => { const m = new Map(); for (const p of list) m.set(p[1], (m.get(p[1]) || 0) + w(p)); return m; };
  return {
    pick(query, id) {
      const q = flat(query).slice(0, 24), e = picks.find((p) => p[0] === q && p[1] === id);
      if (e) { e[2]++; e[3] = now(); } else picks.push([q, id, 1, now()]);
      picks.sort((a, b) => b[3] - a[3]); picks.length = Math.min(picks.length, CAP);
      try { store.set({ v: 1, picks }); } catch (_) {}
    },
    learned: (q) => (q ? sum(picks.filter((p) => p[0].startsWith(q))) : null),
    global: () => sum(picks),
    recent: (n = 6) => [...new Set(picks.map((p) => p[1]))].slice(0, n),
  };
}
