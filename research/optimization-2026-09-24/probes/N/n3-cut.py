#!/usr/bin/env python3
"""n3-cut.py — lane N · N3: delete the orphan selectors from lab/lab.css and lab/skin.css.
   The list: AUDIT-E's css-orphans.json `strong` array MINUS its three false positives (.nb-view .katex-display,
   .hist-future, .hist-future .hist-lbl) = the filtered 124, plus the five second-tier selectors REFUTE-C proved
   neutral on the live CSSOM, plus every `.palette-seam …` rule (the node is removed at boot, before any paint).
   NEVER .orbit-row/-band/-id, .orbit-c.drive, .dyn-row (live: REFUTE-C, 28 elements changed).
   A selector is removed from its rule's comma list; a rule left with no selector is deleted with its line.
   Matching is by (file, innermost @media text, selector), normalised exactly as probes/C/refute/fe4-cssom.mjs does.
     python3 research/optimization-2026-09-24/probes/N/n3-cut.py [--dry]"""
import json, re, sys

DRY = '--dry' in sys.argv
E = json.load(open('research/optimization-2026-09-24/probes/E/css-orphans.json', encoding='utf-8'))
FALSE_POS = {'.nb-view .katex-display', '.hist-future', '.hist-future .hist-lbl'}
LIVE = {'.orbit-row', '.orbit-band', '.orbit-id', '.orbit-c.drive', '.dyn-row'}
want = [(s['file'], s.get('media') or '', s['sel']) for s in E['strong'] if s['sel'] not in FALSE_POS]
assert len(want) == 124, len(want)
want += [('lab.css', '', '.keys-list'), ('skin.css', '', '.dev .keys-list'), ('skin.css', '', '.native-clean .grp .grp'),
         ('skin.css', '', '.native-clean[data-id="observer"] .grp'), ('skin.css', '', '.native-clean[data-id="camera"] .camera-motion .sw')]
assert not any(w[2] in LIVE for w in want)

def norm(s):
    s = re.sub(r'\s*([>+~,])\s*', r'\1', s); s = re.sub(r'\s+', ' ', s).replace("'", '"'); return s.strip()
def mnorm(s): return re.sub(r'\s+', '', s).lower()

W = {}
for f, m, sel in want: W.setdefault(f, set()).add((mnorm(m), norm(sel)))
SEAM = re.compile(r'\.palette-seam\b')

def skip_ws_comments(s, i, end):
    while i < end:
        if s[i].isspace(): i += 1
        elif s.startswith('/*', i): j = s.find('*/', i + 2); assert j >= 0; i = j + 2
        else: break
    return i

def scan_to(s, i, end, stops):
    """index of the first char in `stops` at depth 0, outside strings/comments/parens/brackets"""
    depth = 0
    while i < end:
        c = s[i]
        if s.startswith('/*', i): j = s.find('*/', i + 2); i = j + 2; continue
        if c in '"\'':
            j = i + 1
            while s[j] != c: j += 2 if s[j] == '\\' else 1
            i = j + 1; continue
        if c in '([': depth += 1
        elif c in ')]': depth -= 1
        elif depth == 0 and c in stops: return i
        i += 1
    return end

def block_end(s, i):
    """s[i] == '{' → index just past the matching '}'"""
    depth = 0
    while True:
        if s.startswith('/*', i): i = s.find('*/', i + 2) + 2; continue
        c = s[i]
        if c in '"\'':
            j = i + 1
            while s[j] != c: j += 2 if s[j] == '\\' else 1
            i = j + 1; continue
        if c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return i + 1
        i += 1

def split_sel(prelude):
    parts, depth, cur = [], 0, ''
    for c in prelude:
        if c in '([': depth += 1
        elif c in ')]': depth -= 1
        if c == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += c
    parts.append(cur); return parts

def walk(s, i, end, media, file, edits, log):
    while True:
        i = skip_ws_comments(s, i, end)
        if i >= end: return
        if s[i] == '@':
            k = scan_to(s, i, end, '{;')
            if s[k] == ';': i = k + 1; continue
            prelude = s[i:k].strip(); b = block_end(s, k)
            if prelude.lower().startswith('@media'): walk(s, k + 1, b - 1, prelude[6:].strip(), file, edits, log)
            elif prelude.lower().startswith(('@supports', '@layer', '@container')): walk(s, k + 1, b - 1, media, file, edits, log)
            i = b; continue
        k = scan_to(s, i, end, '{'); b = block_end(s, k)
        prelude = s[i:k]
        parts = split_sel(prelude)
        keep, cut = [], []
        for p in parts:
            n = norm(re.sub(r'/\*.*?\*/', '', p, flags=re.S))
            if (mnorm(media), n) in W.get(file, ()) or SEAM.search(n): cut.append(n)
            else: keep.append(p)
        if cut:
            log.append((file, media, [c for c in cut], len(keep)))
            if keep: edits.append((i, k, ', '.join(x.strip() for x in keep) + ' '))
            else: edits.append(('rule', i, b))
        i = b

def apply(file):
    path = 'lab/' + file
    s = open(path, encoding='utf-8').read()
    edits, log = [], []
    walk(s, 0, len(s), '', file, edits, log)
    out = s
    for e in sorted(edits, key=lambda e: -(e[1] if e[0] == 'rule' else e[0])):
        if e[0] == 'rule':
            _, a, b = e
            ls = out.rfind('\n', 0, a) + 1; le = out.find('\n', b); le = len(out) if le < 0 else le
            before, after = out[ls:a], out[b:le]
            if before.strip() == '' and (after.strip() == '' or after.strip().startswith('/*') and after.strip().endswith('*/')):
                out = out[:ls] + out[le + 1:]                     # the rule (and a trailing comment about it) had the line(s) to itself
            else:
                t = b
                while t < len(out) and out[t] in ' \t': t += 1
                out = out[:a] + out[t:]
        else:
            a, k, txt = e
            out = out[:a] + txt + out[k:]
    return s, out, log

total = 0
for file in ('lab.css', 'skin.css'):
    s, out, log = apply(file)
    n = sum(len(c) for _, _, c, _ in log); total += n
    print(f'{file}: {n} selectors cut in {len(log)} rules ({sum(1 for *_, k in log if k == 0)} rules deleted whole) · {len(s)} → {len(out)} bytes')
    for f, m, c, k in log: print('   ', ('[' + m[:40] + '] ') if m else '', ' | '.join(c), '' if k == 0 else f'  (rule kept: {k} selector(s) left)')
    if not DRY: open('lab/' + file, 'w', encoding='utf-8').write(out)
print('total selectors cut', total)
