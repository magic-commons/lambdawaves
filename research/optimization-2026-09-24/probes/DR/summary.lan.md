## λWAVES device reports (1)

| device | at | adapter | dpr (cap) | display Hz start→end | grid/steps/scale | card · frost | GPU frame/recon/present ms | scene rAF fps | backdrops | dom | restored |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Linux-Firefox | 2026-09-25 15:32:04 | adapter (no info) | 1.00 (2.0) | 58.5→58.5 | 64³/160/1 · auto | refractive · always | current 3.45/0.11/3.95 · 64³ 1.88/0.11/1.23 · 96³ 3.36/0.11/3.77 · 128³ 5.56/0.19/5.55 | as found 17 · card edge 18 · frost edge 18 · autoscale edge 17 · style edge 17 · view edge 17 · UI hidden 57 · hide edge 40 · frost OFF 20 · card tinted 16 · mod open 11 | 26 (67.5 %) | 4450 | identical |

### Linux-Firefox · 2026-09-25T15:32:04.491Z

`research/device-reports/2026-09-25T15-34-11.304Z-Linux-Firefox.json` · build 0.3.0-alpha · the optimization pass · 2026-09-25 · Mozilla/5.0 (X11; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0

- screen 1366×768 · viewport 1600×914 · dpr 1 (cap 2) · canvas 1600×914 · desktop · touch false · pointer none · reduced motion false · timer 0.02 ms
- display (nothing playing) · start 58.5 Hz (p95 50.2 ms), UI hidden 58.6 Hz · end 58.5 Hz, UI hidden 58.5 Hz
- adapter adapter (no info) · bgra8unorm · f16 true · timestamp-query true · tier1 false · WGSL 3 features
- settings · 64³/160/1 · auto · autoScale 1 · field 64³ · card refractive (default) · frost always · blur 22px · light · disconnected · governor nominal · phase/cloud · hydrogen 1s+2pz · 8 windows
- boot · 80 ms after ready · canvas 1600×914 · autoScale 1 · stepCap Infinity · no-badges no-captions frost disconnected window-info-off rack-l
- backdrops as found · 26 layers (0 pseudo, 6 off-screen) over 67.5 % · .dev×8 .dev-head×8 #rackToggle×1 #rackAdd×1 #rackFav×1 #transport×1 #devb-shadow×1 #devb-spectrum×1 #devb-palette×1 #devb-observer×1 #devb-camera×1 #devb-clip×1
- held settings writes 10 · restored identical · wall 127 s

**GPU** (`field.throughput`, batches ≥ 1500 ms; empty completion wait 30.3 ms · hydrogen)

| row | canvas | steps | frame ms | reconstruct ms | present ms | n frame/recon/present | ≈ GPU-bound fps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| current | 1600×914 | 160 | 3.446 | 0.107 | 3.954 | 554/14594/431 | 290 |
| 64³ | 1200×686 | 110 | 1.877 | 0.106 | 1.226 | 977/14862/1473 | 533 |
| 96³ | 1600×914 | 160 | 3.361 | 0.112 | 3.771 | 537/16082/532 | 297 |
| 128³ | 1600×914 | 240 | 5.558 | 0.185 | 5.552 | 308/8311/307 | 180 |

128³ axial gas: not in the axial gas — entering the box rewrites the register and the undo ring, so it is not done for you; open OPERATOR → BOX with the AXIAL basis and run the report again to measure it

**Scenes** (rAF over the play; loop = LW.perf.loopMedian; gap = the worst rAF interval)

| scene | rAF fps | app fps | loop ms | median / p95 / max gap ms | frames > 2× median | backdrops | min autoScale | governor | presents / reconstructs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| as found (UI shown) | 17.3 | 17.6 | 0.66 | 66.3 / 83.3 / 83.5 | 0 | 26 | 0.8 | nominal (1 changes) | 53 / 53 |
| card edge (3 s → tinted → 3 s → refractive → 4 s) | 17.5 | 17.6 | 0.40 | 66.3 / 67.3 / 83.4 | 0 | 26 | 0.35 | stepped-2 (4 changes) | 176 / 176 |
| frost edge (3 s → off → 3 s → always → 4 s) | 18.3 | 18.4 | 0.50 | 50.3 / 67.4 / 116.6 | 1 | 26 | 0.35 | stepped-2 (4 changes) | 184 / 184 |
| autoscale edge (3 s → AUTO SCALE off → 3 s → on → 4 s) | 17.2 | 17.3 | 0.42 | 66.3 / 83.4 / 133.3 | 1 | 26 | 0.7 | stepped-2 (4 changes) | 173 / 173 |
| style edge (3 s → grain → 3 s → cloud → 4 s) | 17.2 | 17.3 | 0.50 | 66.3 / 67.3 / 132.6 | 0 | 26 | 0.35 | stepped-2 (4 changes) | 174 / 174 |
| view edge (3 s → density → 3 s → phase → 4 s) | 17.0 | 17.1 | 0.52 | 66.3 / 67.4 / 165.9 | 1 | 26 | 0.35 | stepped-2 (4 changes) | 171 / 171 |
| UI hidden (H) | 57.3 | 57.6 | 0.24 | 17.1 / 17.1 / 100.0 | 2 | 0 | 1 | nominal (1 changes) | 173 / 173 |
| hide edge (3 s shown → H → 4 s) | 39.8 | 40.0 | 0.24 | 17.1 / 82.4 / 100.4 | 44 | 26 | 0.8 | nominal (2 changes) | 280 / 280 |
| frost OFF | 19.8 | 20.1 | 0.44 | 50.3 / 83.5 / 132.8 | 1 | 8 | 0.8 | nominal (2 changes) | 61 / 61 |
| card tinted | 16.2 | 16.5 | 0.56 | 66.4 / 100.5 / 132.7 | 0 | 18 | 0.8 | nominal (1 changes) | 50 / 50 |
| modulation window open | 10.8 | 11.2 | 1.32 | 99.6 / 100.6 / 100.9 | 0 | 35 | 0.9 | nominal (1 changes) | 34 / 34 |

**Series** (fps per 250 ms bin; ▌ marks a change; then what moved between bins)

- as found (UI shown): `20 24 16 16 16 16 16 16 16 16 20 20`
  - 1.00 s: canvas 1600×914→1440×823, autoScale 1→0.9
  - 1.75 s: stepCap Infinity→112
  - 2.50 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
- card edge (3 s → tinted → 3 s → refractive → 4 s): `24 20 20 20 16 20 20 20 16 20 16 16 ▌card tinted [data-card]▌ 16 16 12 16 16 16 12 16 16 20 12 16 ▌card refractive [data-card]▌ 16 16 24 16 20 16 16 16 16 20 16 20 20 16 20 24`
  - 0.50 s: stepCap Infinity→112
  - 1.25 s: canvas 1600×914→1440×823, autoScale 1→0.9
  - 2.00 s: stepCap 112→80
  - 2.50 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
  - 3.75 s: governor nominal→stepped-1
  - 4.00 s: canvas 1280×731→1120×640, autoScale 0.8→0.7
  - 5.50 s: canvas 1120×640→960×548, autoScale 0.7→0.6
  - 5.75 s: governor stepped-1→stepped-2
  - 7.00 s: canvas 960×548→800×457, autoScale 0.6→0.5
  - 8.25 s: autoScale 0.5→0.4
  - 8.50 s: canvas 800×457→640×366
  - 9.75 s: canvas 640×366→560×320, autoScale 0.4→0.35
- frost edge (3 s → off → 3 s → always → 4 s): `24 16 16 16 16 16 16 20 20 20 16 16 ▌frost off [setFrost]▌ 20 20 20 20 20 20 20 20 20 20 20 20 ▌frost always [setFrost]▌ 16 16 16 16 20 16 16 16 20 20 16 20 16 20 20 20`
  - 0.75 s: stepCap Infinity→112
  - 1.25 s: autoScale 1→0.9
  - 1.50 s: canvas 1600×914→1440×823
  - 2.50 s: stepCap 112→80
  - 2.75 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
  - 3.25 s: class −frost
  - 4.00 s: canvas 1280×731→1120×640, autoScale 0.8→0.7, governor nominal→stepped-1
  - 5.25 s: canvas 1120×640→960×548, autoScale 0.7→0.6
  - 5.50 s: governor stepped-1→stepped-2
  - 6.25 s: class +frost
  - 6.50 s: canvas 960×548→800×457, autoScale 0.6→0.5
  - 7.75 s: autoScale 0.5→0.4
  - 8.00 s: canvas 800×457→640×366
  - 9.25 s: canvas 640×366→560×320, autoScale 0.4→0.35
- autoscale edge (3 s → AUTO SCALE off → 3 s → on → 4 s): `20 16 16 16 16 16 16 12 16 16 16 16 ▌AUTO SCALE off [switch]▌ 16 16 16 16 24 12 20 16 16 16 20 16 ▌AUTO SCALE on [switch]▌ 24 16 16 20 16 16 20 20 16 20 16 20 20 16 20 20`
  - 0.50 s: stepCap Infinity→112
  - 1.50 s: canvas 1600×914→1440×823, autoScale 1→0.9
  - 2.50 s: stepCap 112→80
  - 3.00 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
  - 3.25 s: canvas 1280×731→1600×914, autoScale 0.8→1, auto true→false
  - 4.25 s: governor nominal→stepped-1
  - 6.00 s: governor stepped-1→stepped-2
  - 6.25 s: auto false→true
  - 7.00 s: autoScale 1→0.9
  - 7.25 s: canvas 1600×914→1440×823
  - 8.50 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
  - 9.75 s: canvas 1280×731→1120×640, autoScale 0.8→0.7
- style edge (3 s → grain → 3 s → cloud → 4 s): `16 20 20 16 16 16 20 16 16 16 20 16 ▌style grain [setStyle]▌ 16 16 16 20 16 16 16 16 16 20 16 16 ▌style cloud [setStyle]▌ 16 20 16 16 16 16 16 20 16 16 20 16 20 20 16 28`
  - 1.00 s: stepCap Infinity→112
  - 1.25 s: autoScale 1→0.9
  - 1.50 s: canvas 1600×914→1440×823
  - 2.75 s: canvas 1440×823→1280×731, autoScale 0.9→0.8, stepCap 112→80
  - 4.25 s: canvas 1280×731→1120×640, autoScale 0.8→0.7
  - 4.50 s: governor nominal→stepped-1
  - 5.50 s: autoScale 0.7→0.6
  - 5.75 s: canvas 1120×640→960×548
  - 6.25 s: governor stepped-1→stepped-2
  - 7.00 s: canvas 960×548→800×457, autoScale 0.6→0.5
  - 8.50 s: canvas 800×457→640×366, autoScale 0.5→0.4
  - 9.75 s: canvas 640×366→560×320, autoScale 0.4→0.35
- view edge (3 s → density → 3 s → phase → 4 s): `16 20 12 20 20 16 16 20 16 20 16 16 ▌view density [setView]▌ 16 16 16 20 16 16 16 16 16 20 16 16 ▌view phase [setView]▌ 12 16 16 20 16 16 16 16 20 16 20 16 16 16 20 24`
  - 1.25 s: autoScale 1→0.9, stepCap Infinity→112
  - 1.50 s: canvas 1600×914→1440×823
  - 2.75 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
  - 3.00 s: stepCap 112→80
  - 4.25 s: canvas 1280×731→1120×640, autoScale 0.8→0.7
  - 4.75 s: governor nominal→stepped-1
  - 5.50 s: autoScale 0.7→0.6
  - 5.75 s: canvas 1120×640→960×548
  - 6.00 s: gap 100.1 ms, 3 presents
  - 6.75 s: governor stepped-1→stepped-2
  - 7.00 s: autoScale 0.6→0.5
  - 7.25 s: canvas 960×548→800×457
  - 8.50 s: canvas 800×457→640×366, autoScale 0.5→0.4
- UI hidden (H): `28 60 60 60 60 60 60 60 60 60 60 64`
  - 0.75 s: stepCap Infinity→112
- hide edge (3 s shown → H → 4 s): `24 16 16 16 16 12 16 16 12 12 12 12 ▌H (UI hidden) [toggleUI]▌ 36 60 60 60 60 60 60 60 60 60 60 60 60 60 60 64`
  - 1.25 s: autoScale 1→0.9
  - 1.50 s: canvas 1600×914→1440×823
  - 2.25 s: gap 100.4 ms, 3 presents
  - 2.50 s: stepCap Infinity→112
  - 3.25 s: canvas 1440×823→1280×731, autoScale 0.9→0.8, class +ui-hidden
  - 4.00 s: canvas 1280×731→1360×777, autoScale 0.8→0.85
  - 4.50 s: canvas 1360×777→1440×823, autoScale 0.85→0.9
  - 4.75 s: canvas 1440×823→1520×868, autoScale 0.9→0.95
  - 5.25 s: canvas 1520×868→1600×914, autoScale 0.95→1
- frost OFF: `20 20 24 20 16 20 20 20 20 20 20 24`
  - 1.25 s: canvas 1600×914→1440×823, autoScale 1→0.9
  - 1.50 s: stepCap Infinity→112
  - 2.50 s: canvas 1440×823→1280×731, autoScale 0.9→0.8
- card tinted: `20 12 20 16 12 12 16 12 20 16 20 24`
  - 1.50 s: canvas 1600×914→1440×823, autoScale 1→0.9
  - 1.75 s: stepCap Infinity→112
  - 2.25 s: gap 100.5 ms, 4 presents
  - 2.50 s: gap 100.5 ms, 5 presents
- modulation window open: `16 12 12 12 12 8 12 8 12 8 12 12`
  - 0.50 s: stepCap Infinity→112
  - 0.75 s: gap 100.1 ms, 3 presents
  - 1.00 s: gap 100.6 ms, 3 presents
  - 1.25 s: gap 100.6 ms, 2 presents
  - 1.50 s: gap 100.6 ms, 3 presents
  - 1.75 s: gap 100.5 ms, 2 presents
  - 2.00 s: canvas 1600×914→1440×823, autoScale 1→0.9, gap 100.5 ms, 3 presents
  - 2.25 s: gap 100.6 ms, 2 presents
  - 2.50 s: gap 100.5 ms, 3 presents
  - 2.75 s: gap 100.9 ms, 3 presents
