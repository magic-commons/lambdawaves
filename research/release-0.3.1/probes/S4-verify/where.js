// S4 VERIFY: why the SETTINGS card's segments have no box at 1500×1000
const w = (n) => new Promise((r) => setTimeout(r, n));
const d = document.querySelector('.dev[data-id="settings"]');
const vis = () => getComputedStyle(d).visibility;
const v0 = vis(); __LW.layout.raise('settings'); await w(1500); const v1 = vis();
/* which stylesheet rule makes it hidden? */
const rules = [];
for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (_) { continue; } for (const r of rs) { if (r.style && /hidden/.test(r.style.visibility || '') && r.selectorText) { try { if (d.matches(r.selectorText)) rules.push((sh.href || 'inline').split('/').pop() + ' :: ' + r.selectorText); } catch (_) {} } } }
return { v0, v1, cls: d.className, inline: d.getAttribute('style'), rules, rect: [...Object.values(d.getBoundingClientRect().toJSON())].map(Math.round) };
