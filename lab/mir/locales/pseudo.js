/* MIR · locales/pseudo.js — the pseudo-language, generated from the English so it can never go stale.
 *
 * `qps` and `qps-rtl` (the same strings; core/i18n.js gives the second dir="rtl"):
 *   · every ASCII letter becomes an accented one, case kept, one to one — so a string the kit forgot to route
 *     through t() is the one that still reads as plain English;
 *   · about 40 % longer, counting the brackets — the room a French or Russian label will want;
 *   · wrapped in [ ], so a clipped string shows a missing bracket;
 *   · `<m>…</m>` maths runs and `{name}` placeholders and `{:LABEL}` references pass through untouched, as do digits and punctuation.
 * unpseudo() reverses it exactly (tests/i18n.node.mjs proves that over the whole catalogue). */
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const B = [...'ÁƁÇÐÉƑĜĤÍĴĶĹṀÑÖÞǪŔŠŢÛṼŴẊÝŽáƀçðéƒĝĥíĵķĺɱñöþǫŕšţûṽŵẋýž'];
const TO = new Map(), FROM = new Map();
[...A].forEach((c, i) => { TO.set(c, B[i]); FROM.set(B[i], c); });
const KEEP = /(<m>[\s\S]*?<\/m>|\{:?[^{}]+\})/;   // maths, {vars} and {:LABEL} references pass through
/** the filler a source of `n` characters gets, beyond its two brackets: tildes, broken by a space every six so a
 *  long sentence can still wrap where its translation would */
const pad = (n) => { const k = Math.max(0, Math.round(0.4 * n) - 2); let f = ''; for (let i = 0; i < k; i++) f += k >= 6 && i % 6 === 0 ? ' ' : '~'; return f; };
const memo = new Map();

export function pseudo(s) {
  let out = memo.get(s);
  if (out === undefined) {
    const body = s.split(KEEP).map((part, i) => (i % 2 ? part : [...part].map((c) => TO.get(c) || c).join(''))).join('');
    out = '[' + body + pad([...s].length) + ']';
    if (memo.size < 8192) memo.set(s, out);
  }
  return out;
}

/** the English a pseudo string was made from, or null if it is not one */
export function unpseudo(p) {
  if (typeof p !== 'string' || p[0] !== '[' || p[p.length - 1] !== ']') return null;
  const inner = [...p.slice(1, -1)];
  for (let n = inner.length; n >= 0; n--) {
    const k = pad(n);
    if (n + k.length !== inner.length) continue;
    if (inner.slice(n).join('') !== k) return null;
    return inner.slice(0, n).join('').split(KEEP).map((part, i) => (i % 2 ? part : [...part].map((c) => FROM.get(c) || c).join(''))).join('');
  }
  return null;
}
