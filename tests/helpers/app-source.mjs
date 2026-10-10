/* tests/helpers/app-source.mjs — THE APP'S SOURCE, for the laws that read it as text (0.5.2 G-S).
 *
 * 0.5.2 dissolves lab/rack.js into modules born in lab/windows/ and lab/shell/, so a law that reads "rack.js" for a line of the app
 * (auto-scale's controlStep slice, first-run's wiring, ink's THEMES, project-formats' projectKey, access's setBase wire, the boot
 * suite's B108 / B112 / B136) reads the APP instead: rack.js and every module under those two folders, concatenated in a fixed order
 * (rack.js first, then each folder's files sorted).  A moved block keeps its text, so the law does not move with it.
 *   appFiles()   the files, relative to lab/ — the boot suite fetches exactly these from the page's own server
 *   appSource()  their text, joined by a newline (node)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const LAB = new URL('../../lab/', import.meta.url);
export const APP_FOLDERS = ['windows', 'shell'];

export function appFiles() {
  const out = ['rack.js'];
  for (const dir of APP_FOLDERS) {
    const at = new URL(dir + '/', LAB);
    if (!existsSync(at)) continue;
    for (const f of readdirSync(at, { recursive: true }).map(String).filter((f) => f.endsWith('.js')).sort()) out.push(dir + '/' + f.split('\\').join('/'));
  }
  return out;
}

export function appSource() {
  return appFiles().map((f) => readFileSync(new URL(f, LAB), 'utf8')).join('\n');
}
