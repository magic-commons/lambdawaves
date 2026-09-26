/* S3 · WHY THE MOLECULES OWNER SWITCH IS NOT A ONE-ROW SCENE: switch MOLECULES on and read the edit scope every 250 ms.
 * The switch itself moves mat.view and instruments.chem.on; within the first 250 ms the solution lands and the instrument FILLS
 * derived defaults — chem.orbital null → 5, the MO-REGISTRY default selection, the STATES ground lane — with no note, so the fill
 * rides into whatever row commits next.  Then 5 s of play in the chem scene: no diff, no row.  Output: chem-fill.json.
 *   LW_PORT=8737 GD_PORT=5237 node research/release-0.3.1/probes/S3/ev.mjs research/release-0.3.1/probes/S3/chem-fill.js */
const w = (n) => new Promise((r) => setTimeout(r, n));
const L = __LW, H = L.history, out = {};
const S = () => L.serialize({ scope: 'edit' });
const diff = (a, b, p = '', o = []) => { if (o.length > 40) return o; if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + '.' + k, o); } else if (JSON.stringify(a) !== JSON.stringify(b)) o.push(p + ': ' + JSON.stringify(a)?.slice(0, 60) + ' → ' + JSON.stringify(b)?.slice(0, 60)); return o; };
H.flush();
const s0 = S();
const chemSw = [...document.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl')?.textContent || '').trim() === 'MOLECULES ON');
L.chem.setOn(true);
const s1 = S(); out.immediate = diff(s0, s1);
const snaps = []; for (let i = 0; i < 12; i++) { await w(250); snaps.push(S()); }
out.over3s = snaps.map((s, i) => [i, diff(i ? snaps[i - 1] : s1, s)]).filter((x) => x[1].length);
out.rows = H.entries().map((e) => e.label);
/* play 5 s in chem */
H.flush(); const n0 = H.entries().length; const p0 = S(); L.play(); await w(5000); L.pause(); await w(600);
out.playDiff = diff(p0, S()); out.playRows = H.entries().length - n0;
out.errs = __e.slice();
return out;
