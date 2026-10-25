#!/bin/bash
# THE NIGHT RUN, c8 (Claude Yan, 2026-10-25; Josh: "there was other solving that needed to be done besides more molecules … start them anyways"):
# the live-tree runs that waited behind the solvers, in FOR-JOSH 2026-10-24's order — the potential pass over raw/ → isomers + bonds and the
# shape words on the live catalogue → the pack with THE CUT and VOL. II · WIP on the shelf → the volume's missing pictures and its five looks
# → the pack again (it names the pictures and carries every grid that landed) → when the potential pass is done, a last pack.
# Zero tokens. Log: babysit/night-c8.log. Marker: babysit/DONE-c8. One run at a time (flock). Stop: kill $(cat babysit/night-c8.pid), then
# kill -TERM $(cat babysit/esp-c8-1.pid) $(cat babysit/esp-c8-2.pid); never pkill. Nothing is committed; nothing in lab/ is touched.
V=$HOME/Documents/LAMBDAWAVES-VOLUMES; R=/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24
PY=$HOME/.local/share/lw-volumes/venv/bin/python; L=$V/babysit/night-c8.log; CAT=$V/catalogue/vol-1.candidates.json
if [ -z "$NIGHT_C8" ]; then NIGHT_C8=1 setsid nohup bash "$0" "$@" >/dev/null 2>&1 & echo "night-c8 detached"; exit 0; fi
cd "$R" || exit 1; exec >> "$L" 2>&1; exec 9>"$V/babysit/night-c8.lock"; flock -n 9 || { echo "$(date -Is) another night-c8 holds the lock"; exit 1; }
echo $$ > $V/babysit/night-c8.pid; echo "$(date -Is) NIGHT c8 begins (pid $$)"
for p in solver solver-gpu solver-gpu2; do f=$V/raw/$p.pid; [ -f $f ] && kill -0 $(cat $f) 2>/dev/null && { echo "$(date -Is) $p still alive — the night run does not start"; exit 1; }; done
export OMP_NUM_THREADS=4

# 1. THE POTENTIAL PASS over the live raw/, two shards of the ids, four threads each, nice 19 (hours; each molecule skipped once its esp.npz names its top rung)
ls $V/raw | grep -v "\.pid$\|\.log$\|\.json$\|\.md$" > $V/babysit/esp-c8-ids.txt
n=$(wc -l < $V/babysit/esp-c8-ids.txt); h=$(( (n + 1) / 2 ))
head -n $h $V/babysit/esp-c8-ids.txt | paste -sd, > $V/babysit/esp-c8-1.ids; tail -n +$((h + 1)) $V/babysit/esp-c8-ids.txt | paste -sd, > $V/babysit/esp-c8-2.ids
nice -n 19 $PY -I tools/volumes/esp-pass.py --threads 4 --only "$(cat $V/babysit/esp-c8-1.ids)" > $V/babysit/esp-c8-1.log 2>&1 & echo $! > $V/babysit/esp-c8-1.pid
nice -n 19 $PY -I tools/volumes/esp-pass.py --threads 4 --only "$(cat $V/babysit/esp-c8-2.ids)" > $V/babysit/esp-c8-2.log 2>&1 & echo $! > $V/babysit/esp-c8-2.pid
echo "$(date -Is) potential pass started on $n raw ids in two shards (pids $(cat $V/babysit/esp-c8-1.pid) $(cat $V/babysit/esp-c8-2.pid))"

# 2. THE CATALOGUE: isomers + bonds (RDKit, no network) in place, then the shape words adopted from the Haiku proposals; a backup first
cp "$CAT" $V/catalogue/vol-1.candidates.before-c8.json
echo "$(date -Is) isomers + bonds"; nice -n 19 $PY -I tools/volumes/catalogue/isomers.py "$CAT" | tail -n 5
echo "$(date -Is) shape words"; nice -n 19 $PY -I tools/volumes/catalogue/structure_tags.py --adopt research/iteration-014/c-data/tags.proposed.json --candidates "$CAT" --report $V/babysit/tags-adopted-c8.json | cut -c1-400

# 3. THE PACK with THE CUT, VOL. II · WIP on the shelf
pack() { node tools/volumes/pack.mjs --candidates "$CAT" --volume vol-1 --numeral I --title 'All the Molecules' --sole --max-gb 5.25 --wip --next II --incremental; }
echo "$(date -Is) pack 1"; pack | tail -n 14

# 4. THE PICTURES over a gate server: the volume's missing plain pictures, then its five looks into a scratch folder, carried into t/
python3 tools/gate/server.py . 9651 >/dev/null 2>&1 & GP=$!; sleep 3
missing=$(python3 - <<'PYX'
import json,os; V=os.path.expanduser('~/Documents/LAMBDAWAVES-VOLUMES/dist/vol-1')
idx=json.load(open(V+'/index.json')); rows=idx['molecules'] if isinstance(idx,dict) and 'molecules' in idx else idx
ids=[r['id'] if isinstance(r,dict) else r for r in rows]
print(','.join(i for i in ids if not os.path.exists(f'{V}/t/{i}.webp')))
PYX
)
if [ -n "$missing" ]; then echo "$(date -Is) missing plain pictures: $(echo $missing | tr ',' '\n' | wc -l)"; GD_PORT=5651 LW_PORT=9651 timeout 40h node tools/menu-thumbs.mjs --volume vol-1 --only "$missing" | tail -n 8; else echo "$(date -Is) no plain picture missing"; fi
mkdir -p $V/babysit/variants-c8
echo "$(date -Is) the five looks (im, balls, sticks, esp, phase) of VOL. I into babysit/variants-c8/"
GD_PORT=5651 LW_PORT=9651 timeout 60h node tools/menu-thumbs.mjs --volume vol-1 --style im,balls,sticks,esp,phase --out $V/babysit/variants-c8/ | tail -n 10
nv=$(ls $V/babysit/variants-c8 | grep -c "\.webp$"); echo "$(date -Is) $nv variant pictures rendered; carried into dist/vol-1/t/"
cp -n $V/babysit/variants-c8/*.webp $V/dist/vol-1/t/ 2>/dev/null
kill $GP 2>/dev/null; pgrep -a geckodriver | grep " 5651" | cut -d' ' -f1 | xargs -r kill 2>/dev/null
echo "$(date -Is) pack 2 (the index names the pictures; the grids that landed so far ride along)"; pack | tail -n 8

# 5. the potential pass finishes, then the last pack
while kill -0 $(cat $V/babysit/esp-c8-1.pid) 2>/dev/null || kill -0 $(cat $V/babysit/esp-c8-2.pid) 2>/dev/null; do sleep 600; done
echo "$(date -Is) potential pass done: $(ls $V/raw/*/esp.npz 2>/dev/null | wc -l) grids"
echo "$(date -Is) pack 3 (every grid)"; pack | tail -n 8
N=$(ls $V/dist/vol-1/t | grep -c "^[^.]*\.webp$"); M=$(python3 -c "import json;d=json.load(open('$V/dist/vol-1/index.json'));r=d['molecules'] if isinstance(d,dict) and 'molecules' in d else d;print(len(r))")
echo "$(date -Is) NIGHT c8 done: VOL. I $M molecules, $N plain pictures, $(ls $V/dist/vol-1/t | grep -c '\..*\.webp$') variant pictures, $(ls $V/raw/*/esp.npz 2>/dev/null | wc -l) grids; shelf: $(python3 -c "import json;s=json.load(open('$V/dist/volumes.json'));print([(v.get('id'),v.get('count'),v.get('wip')) for v in (s['volumes'] if isinstance(s,dict) else s)])")"
touch $V/babysit/DONE-c8
