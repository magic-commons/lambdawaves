#!/usr/bin/env python3
"""Every number, every display equation and every reference line of the source manuscript must survive the pass.
Usage: numbers_check.py OLD.md NEW.md"""
import re, sys
old, new = [open(p, encoding='utf-8').read() for p in sys.argv[1:3]]
num = re.compile(r'(?<![\w\\])[-+]?\d+(?:[.,]\d+)*(?:\s*[×x]\s*10\s*\^?\s*\{?[-−+]?\d+\}?|e[-+]?\d+)?')
def nums(s):
    return {m.group(0).strip().replace('−', '-') for m in num.finditer(s)}
missing = sorted(n for n in nums(old) - nums(new) if not re.fullmatch(r'\d{1,2}', n))
disp = re.compile(r'\$\$(.*?)\$\$', re.S)
def norm(e): return re.sub(r'\s+', '', e)
eq_old = [norm(e) for e in disp.findall(old)]; eq_new = {norm(e) for e in disp.findall(new)}
eq_missing = [e[:80] for e in eq_old if e not in eq_new]
refs_old = [l for l in old.split('## References')[1].split('## Credits')[0].splitlines() if l.startswith('- ')]
refs_new = new.split('## References')[1].split('## Credits')[0] if '## References' in new else ''
ref_missing = [r[:70] for r in refs_old if r.strip() not in refs_new]
print(f'numbers in old: {len(nums(old))}  missing from new (3+ digits or decimals): {len(missing)}')
for n in missing: print('  ', n)
print(f'display equations in old: {len(eq_old)}  missing from new: {len(eq_missing)}')
for e in eq_missing: print('  ', e)
print(f'reference lines in old: {len(refs_old)}  missing from new: {len(ref_missing)}')
for r in ref_missing: print('  ', r)
sys.exit(1 if (missing or eq_missing or ref_missing) else 0)
