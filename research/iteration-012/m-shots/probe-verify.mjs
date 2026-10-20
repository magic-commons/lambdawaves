// iteration 012 M1 · the acts behind the photographs: the new rows run, WINDOW's icons are tagged, WARNING lives in ABOUT, FOLDERS
// lands on DEMOS and goes after an OPEN
const row = `async (menu, label) => { const t = document.getElementById('title'); const b = [...document.querySelectorAll('.mb-btn')].find((x) => x.dataset.menu === menu);
  if (b.closest('[hidden]')) { t.click(); await __w(200); } b.click(); await __w(200);
  const it = [...b.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.startsWith(label)); const tagged = [...b.parentElement.querySelectorAll('.mb-item[data-icon]')].map((i) => i.dataset.icon + ':' + i.textContent);
  if (it) it.click(); else b.click(); await __w(300); return { found: !!it, tagged }; }`;
export default { query: '&starter=home&menu=0', scenes: [
  { name: null, js: `window.__row = ${row};
    const R = {};
    R.settingsWarning = [...document.querySelectorAll('.dev[data-id="settings"] .trig')].map((t) => t.textContent).filter((t) => /WARNING/.test(t));
    R.window = await __row('WINDOW', 'PICKER'); await __w(600); R.pickerOpen = !!(app => 0) && document.body.classList.contains('menu-open');
    const pk = document.querySelector('#lwMenu'); R.picker = pk ? !pk.hidden : null; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', bubbles: true })); await __w(600);
    R.foldersRows = (await (async () => { const b = [...document.querySelectorAll('.mb-btn')].find((x) => x.dataset.menu === 'WINDOW'); const t = document.getElementById('title'); if (b.closest('[hidden]')) { t.click(); await __w(200); } b.click(); await __w(200);
      const n = [...b.parentElement.querySelectorAll('.mb-lbl')].filter((l) => /FOLDERS/.test(l.textContent)).map((l) => l.textContent); b.click(); await __w(200); return n; })());
    const sk0 = __LW.layout && document.querySelector('[data-key-action]') ? 0 : 0;
    const before = !!(window.__LW.chem && __LW.chem.on);
    __LW.keys.actions.find((a) => a.id === 'mode').run(1); await __w(2500); R.mode = [before, !!__LW.chem.on];
    R.windowMol = (await __row('WINDOW', 'ZZZ')).tagged;
    const sw = document.querySelector('.dev[data-id="informational"]');
    const skBefore = JSON.parse(localStorage.getItem('lambdawaves.q0.info') || '{}').skeleton;
    __LW.keys.actions.find((a) => a.id === 'ballStick').run(1); await __w(500);
    R.ballStick = [skBefore, JSON.parse(localStorage.getItem('lambdawaves.q0.info') || '{}').skeleton];
    __LW.keys.actions.find((a) => a.id === 'ballStick').run(1); await __w(300);
    __LW.keys.actions.find((a) => a.id === 'mode').run(1); await __w(1500);
    __LW.keys.actions.find((a) => a.id === 'render').run(1); await __w(400); R.render = !document.querySelector('.dev[data-id="render"]').classList.contains('closed');
    __LW.keys.actions.find((a) => a.id === 'curves').run(1); await __w(400); R.curves = !document.querySelector('.dev[data-id="curves"]').classList.contains('closed');
    await __row('ABOUT', 'PHOTOSENSITIVITY WARNING'); await __w(800); R.warningOpen = __LW.warning.open; __LW.warning.dismiss(); await __w(800);
    __LW.projects.show(); await __w(1200); R.foldersAt = __LW.projects.folders.gallery.folder();
    const tile = document.querySelector('#folders .sv-card .sv-shot'); R.tile = !!tile;
    if (tile) { tile.click(); await __w(300); tile.click(); await __w(500); const ask = [...document.querySelectorAll('#folders .sv-context .trig, #folders .sv-context button')].find((b) => /WITHOUT/.test(b.textContent)); R.ask = ask ? ask.textContent : null; if (ask) ask.click(); await __w(2500); }
    R.foldersOpenAfter = __LW.projects.folders.isOpen(); R.status = __LW.projects.status; R.current = __LW.projects.current;
    return R; ` },
]};
