# opus1-build-audit — writes AUDIT-OPUS-1.md = DRAFT 1 verbatim + anchored AO1 edits (each anchor asserted unique) + AO1 sections.
import sys
SRC = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/research/release-0.6.0/PLAN-DRAFT-1.md'
OUT = '/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/plan-audit/AUDIT-OPUS-1.md'
EDITS = '/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/plan-audit/opus1-edits.txt'
TAIL = '/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/plan-audit/opus1-tail.md'
HEAD = '/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/plan-audit/opus1-head.md'
t = open(SRC, encoding='utf8').read()
# edits file: blocks separated by a line '@@@'; inside a block, OLD and NEW separated by a line '>>>'
blocks = open(EDITS, encoding='utf8').read().split('\n@@@\n')
bad = 0
for i, b in enumerate(blocks):
    if not b.strip(): continue
    old, new = b.split('\n>>>\n')
    old = old.strip('\n'); new = new.strip('\n')
    n = t.count(old)
    if n != 1:
        print(f'EDIT {i}: anchor found {n} times: {old[:90]!r}'); bad += 1; continue
    t = t.replace(old, new)
if bad: sys.exit(1)
open(OUT, 'w', encoding='utf8').write(open(HEAD, encoding='utf8').read() + t + '\n' + open(TAIL, encoding='utf8').read())
print('ok', len(t))
