/* MIR · shell/language.js — the LANGUAGE menu, and the first-run choice.
 *
 * THE LAWS IT KEEPS
 *   · Each language is written in its own name (中文, العربية, Русский …), never translated, in every language.
 *   · The current one is marked; a pack no native reader has checked yet says DRAFT beside its name.
 *   · The pseudo-languages (qps, qps-rtl) appear only when asked: languageMenu({ dev: true }).
 *   · The choice is remembered in localStorage `mir.lang`.  On first run the browser's own languages
 *     (navigator.languages) choose, when one of them has a pack; otherwise English.
 *
 * languageMenu({ languages, dev, storageKey }) → the entries function createMenubar({ menus }) takes:
 *     createMenubar({ menus: { FILE, EDIT, VIEW, WINDOW, ABOUT, LANGUAGE: languageMenu() } })
 * startLanguage({ languages, storageKey }) → Promise<tag>: the remembered language, else the browser's, else English.
 * pickLanguage(prefs, languages) → tag | null: the pure choice startLanguage makes (exported for tests). */
import { t, setLanguage, language, languages as known } from '../core/i18n.js';

const KEY = 'mir.lang';
const WORDS = { hint: 'a draft translation: no native reader has checked it yet' };   // a hint: control-help.js translates it
const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* private mode: the choice lasts the visit */ } };

export function languageMenu({ languages = known(), dev = false, storageKey = KEY } = {}) {
  const list = dev ? [...languages, ...known({ dev: true }).filter((l) => l.dev && !languages.some((x) => x.tag === l.tag))] : languages.filter((l) => !l.dev);
  return () => list.map((l) => {
    const now = l.tag === language();
    const key = (now ? '✓' : '') + (!l.reviewed ? (now ? ' · ' : '') + t('DRAFT') : '');
    return [l.name + (key ? '\t' + key : ''), () => { write(storageKey, l.tag); setLanguage(l.tag); }, false,
      l.reviewed ? null : WORDS.hint, { raw: true, current: now }];
  });
}

/** the first tag in `prefs` (navigator.languages) that a pack answers: an exact tag first, then its language alone */
export function pickLanguage(prefs = [], languages = known()) {
  const tags = languages.map((l) => l.tag), lower = tags.map((x) => x.toLowerCase());
  for (const p of prefs) {
    const want = String(p).toLowerCase();
    let i = lower.indexOf(want);
    if (i < 0) i = lower.findIndex((x) => x.split('-')[0] === want.split('-')[0]);
    if (i >= 0) return tags[i];
  }
  return null;
}

export async function startLanguage({ languages = known(), storageKey = KEY } = {}) {
  const kept = read(storageKey);
  const all = known({ dev: true });
  const tag = (kept && all.some((l) => l.tag === kept) && kept)
    || pickLanguage(typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [], languages) || 'en';
  await setLanguage(tag);
  return tag;
}
