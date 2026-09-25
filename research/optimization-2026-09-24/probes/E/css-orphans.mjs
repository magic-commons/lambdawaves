/* css-orphans.mjs — which selectors in lab/lab.css and lab/skin.css match NOTHING in a fully-opened boot.
 * Opens every window (closed ones included — querySelector sees hidden DOM), floats one, docks the transport,
 * opens modulation (with an LFO, an ENV, an AUDIO device and its SET sheet, a macro and a route so the ring and
 * the pop-over exist), the notebook on all three faces with a saved project, the keymap, every menubar list, the
 * + and ☆ lists and the tempo panel. Then, per selector:
 *   MATCH    matches as written
 *   STATE    matches only once state qualifiers are stripped (pseudo-classes/elements, body/html/:root classes and
 *            attributes) — a transient-state rule, not an orphan
 *   ORPHAN   matches nothing even stripped; its class/id tokens are then grepped in lab/**.js + index.html:
 *            tokens found nowhere in source ⇒ STRONG orphan; all tokens found ⇒ "transient" candidate.
 *   LW_PORT=8721 GD_PORT=5235 node research/optimization-2026-09-24/probes/E/css-orphans.mjs
 */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs'; import path from 'node:path';
const PORT = process.env.LW_PORT || '8721';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1920, height: 1080, script: 180000 });
let result;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  const steps = await g.ev(`
    const L = __LW, log = [];
    const tryit = async (name, fn) => { try { await fn(); log.push(name + ' ok'); } catch (e) { log.push(name + ' FAIL ' + e.message); } };
    await tryit('open all windows', () => { for (const d of document.querySelectorAll('.dev')) L.layout.reopen(d.dataset.id); });
    await tryit('unhide legacy molecule', () => { const d = document.querySelector('.dev[data-id="molecule"]'); d.hidden = false; });
    await tryit('float + compact one', () => { L.layout.popOut('wigner'); L.layout.setCompact('wigner', true); });
    await tryit('dock transport', () => { if (!L.layout.docked) L.layout.dockTransport(); });
    await tryit('modulation open', () => L.mod.expand());
    await tryit('mod devices + macro + route', () => { L.mod.addSource('audio'); const m = L.mod.addMacro(); L.mod.route(m, 'material.exposure', 0, 0.5); L.mod.paint(); });
    await tryit('mod pop', () => { L.mod.view.pop('material.exposure', 200, 200); });
    await tryit('audio SET sheet', () => { const b = [...document.querySelectorAll('#modwin .m2dev')].map((d) => d.querySelector('.m2audset, [class*="set"]')).find(Boolean); if (b) b.click(); });
    await tryit('notebook projects', () => { L.notebook.open('projects'); L.projects.save('probe/one'); L.notebook.open('projects'); });
    await tryit('notebook about', () => L.notebook.open('about'));
    await tryit('notebook notes view', () => { L.notebook.open('notes'); L.notebook.text = '# h\\n$x$'; L.notebook.setMode('view'); });
    await tryit('keymap', () => L.layout.keymap.open());
    await tryit('menubar lists', () => { L.layout.menu.open(); for (const b of document.querySelectorAll('#menubar .mb-btn')) b.click(); });
    await tryit('rack add list', () => L.layout.addMenu.open());
    await tryit('fav list', () => { L.layout.saveLayout(1); L.layout.favMenu.open(); });
    await tryit('tempo panel', () => { const e = document.querySelector('#transport .tempo-expand'); if (e) e.click(); });
    await tryit('shadow + export details', () => { for (const s of ['.shadow-details-toggle', '.camera-export-toggle']) { const b = document.querySelector(s); if (b) b.click(); } });
    await tryit('settings pages', () => { for (const b of document.querySelectorAll('.dev[data-id="settings"] .seg-b')) b.click(); });
    await tryit('warning pane', () => L.warning.show());
    await tryit('banner', () => { document.getElementById('banner').hidden = false; });
    await new Promise((r) => setTimeout(r, 400));
    return log;`);
  result = await g.ev(`
    const want = (href) => /\\/lab\\/(lab|skin)\\.css$/.test(href || '');
    const out = [];
    const STATE_PSEUDO = /::?(hover|focus-visible|focus-within|focus|active|checked|disabled|enabled|popover-open|placeholder-shown|placeholder|before|after|backdrop|selection|marker|first-line|first-letter|-webkit-[\\w-]+|-moz-[\\w-]+|visited|link|target|indeterminate|invalid|valid|open|modal|fullscreen)(\\([^)]*\\))?/g;
    const stripState = (s) => s.replace(STATE_PSEUDO, '')
      .replace(/\\b(html|body)((\\.[\\w-]+)|(\\[[^\\]]+\\])|(:not\\([^)]*\\)))+/g, '$1')
      .replace(/:root((\\.[\\w-]+)|(\\[[^\\]]+\\])|(:not\\([^)]*\\)))+/g, ':root')
      .replace(/:not\\(\\s*\\)/g, '').replace(/\\s+/g, ' ').trim();
    const splitTop = (sel) => { const parts = []; let depth = 0, cur = ''; for (const ch of sel) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) parts.push(cur.trim()); return parts; };
    const q = (s) => { try { return !!document.querySelector(s || '*'); } catch (e) { return null; } };
    const walk = (rules, file, media) => { for (const r of rules) {
      if (r.selectorText !== undefined) { for (const sel of splitTop(r.selectorText)) {
        const direct = q(sel.replace(/::?(before|after|backdrop|selection|marker|placeholder|-webkit-[\\w-]+|-moz-[\\w-]+)(\\([^)]*\\))?/g, ''));
        let verdict = direct ? 'MATCH' : null;
        if (!verdict) { const st = stripState(sel); const m2 = q(st); verdict = m2 ? 'STATE' : (m2 === null ? 'INVALID' : 'ORPHAN'); }
        out.push({ file, media, sel, verdict, bytes: r.cssText.length }); } }
      else if (r.cssRules) walk(r.cssRules, file, (media ? media + ' ' : '') + (r.conditionText || r.media && r.media.mediaText || r.name || '@'));
    } };
    for (const sh of document.styleSheets) if (want(sh.href)) walk(sh.cssRules, sh.href.split('/').pop(), '');
    return { steps: null, nodes: document.querySelectorAll('*').length, rows: out };`);
  result.steps = steps;
} finally { await g.close(); }
/* token grep */
const srcFiles = [];
(function ls(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/vendor|fonts|demos|img/.test(e.name)) ls(p); } else if (/\.(js|html)$/.test(p)) srcFiles.push(p); } })('lab');
const SRC = srcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const tokensOf = (sel) => [...new Set([...sel.matchAll(/[.#]([A-Za-z_][\w-]*)/g)].map((m) => m[1]))];
const inSrc = (t) => new RegExp('(?<![\\w-])' + t.replace(/[-]/g, '\\-') + '(?![\\w-])').test(SRC);
const orphans = result.rows.filter((r) => r.verdict === 'ORPHAN').map((r) => { const toks = tokensOf(r.sel); const missing = toks.filter((t) => !inSrc(t)); return { ...r, missing, strong: missing.length > 0 }; });
const tally = {}; for (const r of result.rows) { const k = r.file + ' ' + r.verdict; tally[k] = (tally[k] || 0) + 1; }
const strongBytes = {}; for (const o of orphans.filter((o) => o.strong)) strongBytes[o.file] = (strongBytes[o.file] || 0) + o.bytes;
const out = { at: new Date().toISOString(), nodes: result.nodes, steps: result.steps, tally, strongBytes, strong: orphans.filter((o) => o.strong), transient: orphans.filter((o) => !o.strong), invalid: result.rows.filter((r) => r.verdict === 'INVALID') };
fs.writeFileSync('research/optimization-2026-09-24/probes/E/css-orphans.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ nodes: out.nodes, steps: out.steps, tally, strongBytes, strongCount: out.strong.length, transientCount: out.transient.length, invalid: out.invalid.length }, null, 1));
for (const o of out.strong) console.log('STRONG', o.file, '|', o.media || '-', '|', o.sel, '| missing:', o.missing.join(' '));
for (const o of out.transient) console.log('TRANS ', o.file, '|', o.media || '-', '|', o.sel);
