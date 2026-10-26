# tools/mir-manifest.py (once .tmp/manifest.py, iteration 014) — the trickle-down rule's manifest: re-hash the adopted files, name the kit's version, pin the manifest's sha in the test
import json, hashlib, os, re
m = json.load(open('MIR-MANIFEST.json'))
ver = re.search(r"MIR_VERSION = '([^']+)'", open('lab/mir/version.js').read()).group(1)
files = {}
for top in ('lab/mir', 'lab/fonts'):
    for d, _, fs in os.walk(top):
        for f in fs:
            p = os.path.join(d, f)
            files[p] = hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]
m['version'] = ver
m['files'] = {k: files[k] for k in sorted(files)}
txt = json.dumps(m, indent=2, ensure_ascii=False) + '\n'
open('MIR-MANIFEST.json', 'w').write(txt)
sha = hashlib.sha256(txt.encode()).hexdigest()
t = open('tests/mir-manifest.test.mjs').read()
if "'" + ver + "':" in t:
    t = re.sub(r"'" + re.escape(ver) + r"': '[0-9a-f]{64}'", "'" + ver + "': '" + sha + "'", t)
else:
    t = t.replace("const ACCEPTED = { ", "const ACCEPTED = { '" + ver + "': '" + sha + "',   // iteration 014: the trickle-down rule (λWAVES edits the kit; docs/FOR-MIR.md)\n  ", 1)
open('tests/mir-manifest.test.mjs', 'w').write(t)
print(ver, sha[:12])
