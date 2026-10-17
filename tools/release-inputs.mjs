// Reject accidental local files before assembling public assets. This is a
// packaging guard, not a comprehensive secret scanner or a substitute for review.
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/* `devLinks`: top-level names that may be a symbolic link and are then SKIPPED — never dereferenced, never shipped (iteration 004
   V1: lab/volumes, the git-ignored dev link to the volumes' dist, gigabytes of DATA that ship on their own road).  A link anywhere
   else, or under any other name, is still refused. */
export function assertPublicTree(root, { devLinks = [] } = {}) {
  const visit = (file, relative) => {
    const stat = lstatSync(file);
    if (stat.isSymbolicLink() && devLinks.includes(relative)) return;
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) {
      throw new Error(`Unsafe release input: ${relative} (link or special file)`);
    }
    const name = path.basename(file);
    if (relative && (name.startsWith('.') ||
        /(?:\.(?:pem|key|p12|pfx|bak|orig|swp|swo)|~)$/i.test(name) ||
        /^(?:node_modules|__pycache__)$/i.test(name))) {
      throw new Error(`Unsafe release input: ${relative} (local or credential file)`);
    }
    if (stat.isDirectory()) {
      for (const child of readdirSync(file).sort()) {
        visit(path.join(file, child), relative ? `${relative}/${child}` : child);
      }
    } else if (/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/.test(readFileSync(file).toString('utf8'))) {
      // Report only the filename, never the credential bytes.
      throw new Error(`Unsafe release input: ${relative} (private key material)`);
    }
  };
  visit(root, '');
}
