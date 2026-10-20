// iteration 012 M1 · the four photographs (1920×1080, a fresh profile):
//   DISPLAY=:0 LW_PORT=9601 node research/iteration-012/m-shots/shot.mjs research/iteration-012/m-shots/m1-scenes.mjs
// PRE=before- names the shots m1-before-*.png (the base, for the BUILD note).
const P = process.env.PRE || '';
const closeAll = `document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); await __w(300);`;
export default { query: '&starter=home&menu=0', scenes: [
  { name: P + 'm1-a-keyboard', js: `__LW.keys && 0; document.querySelector('.mb-btn') ; window.__LW.layout ? 0 : 0;
    const kb = document.querySelector('[data-key-action="help"]'); (window.__LW.keymap || null);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', code: 'Slash', shiftKey: true, bubbles: true })); await __w(900);
    const r = [...document.querySelectorAll('.km-action-row')].find((x) => /switch the mode/.test(x.textContent)); if (r) r.scrollIntoView({ block: 'center' }); await __w(300);
    return [...document.querySelectorAll('.km-action-row')].filter((x) => /switch the mode|nuclei and bonds|RENDER card|CURVES card/.test(x.textContent)).map((x) => x.textContent.slice(0, 60)); ` },
  { name: null, js: closeAll + ` window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); await __w(400); return 'closed'; ` },
  { name: P + 'm1-b-window-menu', js: `document.getElementById('lwTitle') && 0; const b = [...document.querySelectorAll('.mb-btn')].find((x) => x.dataset.menu === 'WINDOW');
    const t = document.getElementById('title'); if (b.closest('[hidden]') && t) { t.click(); await __w(300); }
    b.click(); await __w(500); return [...b.parentElement.querySelectorAll('.mb-item')].slice(0, 6).map((i) => i.textContent); ` },
  { name: null, js: closeAll + ` return 'closed'; ` },
  { name: P + 'm1-b-add-list', js: `document.getElementById('rackAdd').click(); await __w(500);
    return [...document.querySelectorAll('#rackAddList .mb-item')].map((i) => i.textContent).join(' · '); ` },
  { name: null, js: closeAll + ` return 'closed'; ` },
  { name: P + 'm1-c-folders', js: `__LW.projects.show(); await __w(1400);
    const r = document.getElementById('folders'); return r ? [...r.querySelectorAll('.sv-crumb, .sv-name, .sv-folder-name')].map((x) => x.textContent).join(' | ') : 'no folders'; ` },
  { name: null, js: `__LW.projects.folders.close(); await __w(500); return 'closed'; ` },
  { name: P + 'm1-d-about-menu', js: `__LW.layout.raise('settings'); await __w(300); { const d = document.querySelector('.dev[data-id="settings"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); } await __w(600); const b = [...document.querySelectorAll('.mb-btn')].find((x) => x.dataset.menu === 'ABOUT');
    const t = document.getElementById('title'); if (b.closest('[hidden]') && t) { t.click(); await __w(300); }
    b.click(); await __w(500);     return [...b.parentElement.querySelectorAll('.mb-item')].map((i) => i.textContent); ` },
]};
