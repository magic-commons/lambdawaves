// dist-hash.mjs — one identity for a dist/ tree: sha256 over the sorted "relpath sha256" lines.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
export function distHash(root) {
  const files = fs.readdirSync(root, { recursive: true, withFileTypes: true }).filter((d) => d.isFile())
    .map((d) => path.relative(root, path.join(d.parentPath, d.name)).split(path.sep).join('/')).sort();
  const lines = files.map((f) => f + ' ' + crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex'));
  return { distSha256: crypto.createHash('sha256').update(lines.join('\n') + '\n').digest('hex'), fileCount: files.length };
}
