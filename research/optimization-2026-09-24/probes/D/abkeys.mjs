/* abkeys.mjs — is the ABOUT face's remembered size (abW/abH, written by nbSaveSize) carried by saveSettings()?
 *   LW_PORT=8721 GD_PORT=5234 node research/optimization-2026-09-24/probes/D/abkeys.mjs */
import { open } from '../../../../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || '8721'}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 900 });
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  console.log(JSON.stringify(await g.ev(`
    __LW.notebook.open('about'); __LW.layout.notebookResize(520, 600);
    const afterResize = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
    __LW.setTheme('dark');                                   /* any preference change: saveSettings() rebuilds the key */
    const afterTheme = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}');
    __LW.notebook.close(); __LW.notebook.open('about');
    return { afterResize: { abW: afterResize.abW, abH: afterResize.abH }, afterTheme: { abW: afterTheme.abW, abH: afterTheme.abH },
      reopenedSize: document.getElementById('notebook').style.width + ' × ' + document.getElementById('notebook').style.height };`)));
} finally { await g.close(); }
