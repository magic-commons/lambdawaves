
### Headed Firefox (WebRender on the RTX 3070 — Josh's compositor)

| scene | before fps | after fps | Δ | loop ms before → after |
|---|---|---|---|---|
| default · refractive · frost ALWAYS · blur 22 · light · 96³ | 80.5 | 87.7 | +9 % | 0.18 → 0.20 |
| UI hidden (H) | 119.1 | 115.0 | -3 % | 0.18 → 0.24 |
| UI shown again | 88.0 | 86.2 | -2 % | 0.52 → 0.22 |
| frost OFF · refractive | 113.2 | 114.6 | +1 % | 0.24 → 0.20 |
| frost ALWAYS · tinted | 82.4 | 96.4 | +17 % | 0.20 → 0.22 |
| frost OFF · tinted | 117.7 | 95.7 | -19 % | 0.18 → 0.24 |
| refractive · frost ALWAYS · disconnected | 83.5 | 94.8 | +14 % | 0.20 → 0.20 |
| connected · dark theme | 93.9 | 104.4 | +11 % | 0.24 → 0.16 |
| light · FRAME lattice | 89.0 | 85.6 | -4 % | 0.20 → 0.20 |
| FRAME off | 87.4 | 78.8 | -10 % | 0.48 → 0.22 |
| FRAME box · modulation window open | 76.8 | 70.6 | -8 % | 0.16 → 0.24 |
| modulation closed · all windows open | 72.9 | 60.8 | -17 % | 1.74 → 0.28 |
| all windows open · UI hidden | 117.5 | 118.9 | +1 % | 0.12 → 0.20 |
| 128³ · sim-ladder · default windows · UI shown | 93.3 | 96.5 | +3 % | 0.18 → 0.22 |
| 128³ · UI hidden | 119.1 | 118.0 | -1 % | 0.12 → 0.18 |
| 128³ · axial gas · UI shown | 8.3 | 16.9 | +104 % | 0.34 → 0.36 |

boot readyMs 1055 → 913 (-13 %)
gpu gpu 128³ axial gas: frame 125.15 → 58.39 ms · reconstruct 118.33 → 50.05 · present 8.35 → 8.35 (n 12/12)

### Electron 44 / Chromium 152 (the other compositor)

| scene | before fps | after fps | Δ | loop ms before → after |
|---|---|---|---|---|
| default · refractive · frost ALWAYS · blur 22 · light | 92.2 | 116.4 | +26 % | 0.20 → 0.20 |
| UI hidden (H) | 113.4 | 116.0 | +2 % | 0.20 → 0.10 |
| UI shown again | 104.4 | 116.8 | +12 % | 0.30 → 0.30 |
| rack hidden (B), transport visible | 115.9 | 116.0 | +0 % | 0.20 → 0.20 |
| rack shown | 74.6 | 117.7 | +58 % | 0.40 → 0.20 |
| frost OFF · refractive | 109.6 | 119.5 | +9 % | 0.60 → 0.20 |
| frost STILL (holds while playing) · refractive | 113.7 | 119.1 | +5 % | 0.30 → 0.20 |
| frost ALWAYS · blur 8 | 83.0 | 114.4 | +38 % | 0.20 → 0.20 |
| frost ALWAYS · blur 22 · tinted | 107.6 | 119.3 | +11 % | 0.10 → 0.30 |
| frost OFF · tinted | 113.6 | 116.9 | +3 % | 0.60 → 0.20 |
| frost ALWAYS · refractive · disconnected | 91.3 | 115.0 | +26 % | 0.30 → 0.20 |
| connected again | 117.4 | 119.4 | +2 % | 0.20 → 0.20 |
| dark theme · refractive · frost ALWAYS | 115.1 | 117.9 | +2 % | 0.30 → 0.30 |
| light theme again | 113.1 | 115.6 | +2 % | 0.10 → 0.30 |
| FRAME lattice | 118.4 | 116.3 | -2 % | 0.10 → 0.30 |
| FRAME dots | 115.7 | 115.4 | -0 % | 0.20 → 0.30 |
| FRAME off | 103.7 | 114.7 | +11 % | 0.20 → 0.20 |
| FRAME box again | 113.7 | 119.3 | +5 % | 0.10 → 0.20 |
| modulation window open | 83.3 | 118.3 | +42 % | 0.20 → 0.30 |
| modulation window closed | 94.7 | 113.7 | +20 % | 0.10 → 0.20 |
| notebook open | 114.7 | 117.7 | +3 % | 0.20 → 0.20 |
| notebook closed | 101.0 | 114.0 | +13 % | 0.30 → 0.30 |
| all rack windows open (every card) | 102.4 | 99.1 | -3 % | 0.20 → 0.30 |
| all rack windows open · UI hidden | 116.0 | 118.3 | +2 % | 0.10 → 0.20 |
| 128³ · axial gas · UI shown | 6.7 | 30.3 | +352 % | 0.30 → 0.30 |
| 128³ · axial gas · UI hidden | 6.6 | 31.8 | +382 % | 0.10 → 0.20 |
| 128³ · axial gas · UI shown · frost OFF | 6.9 | 31.1 | +351 % | 0.30 → 0.30 |

boot readyMs 844 → 788 (-7 %)

### Headless Firefox (boot, projects, the loop)

| boot | before | after | Δ |
|---|---|---|---|
| readyMs | 975 | 794 | -19 % |
| domContentLoaded | 394 | 504 | +28 % |
| lastResourceEnd | 865 | 521 | -40 % |
| js | 104 | 104 | +0 % |
| jsBytes | 2985775 | 3025982 | +1 % |
| allBytes | 3770684 | 3810891 | +1 % |

| projects | before | after | Δ |
|---|---|---|---|
| serializeMs | 0.39 | 0.40 | +3 % |
| bytes | 9936.00 | 9936.00 | +0 % |
| saveMs | 1.90 | 2.10 | +11 % |
| dirtyMs | 0.43 | 0.38 | -12 % |
| openMs | 489.78 | 68.86 | -86 % |
| restoreMs | 463.20 | 43.30 | -91 % |
| lsBytes | 1596.00 | 1596.00 | +0 % |

| loop scene | fps before → after | loop median ms before → after (before = last frame, not a median) |
|---|---|---|
| sim-ladder · 96³ · UI shown (default windows) | 14.7 → 17.3 | 1.36 → 0.34 |
| sim-ladder · 96³ · UI hidden | 52.7 → 59.0 | 0.16 → 0.20 |
| sim-ladder · 96³ · UI shown again | 13.9 → 13.3 | 0.28 → 0.38 |
| sim-ladder · 96³ · METERS + DYNAMICS + VORTEX + ORBIT + SLICE open | 13.3 → 12.7 | 0.24 → 0.34 |
| sim-ladder · 96³ · particles on (160) + vortex locate | 13.7 → 13.6 | 3.06 → 2.84 |
| BOX axial gas · 128³ · UI shown | 7.7 → 10.7 | 0.48 → 0.40 |
| BOX axial gas · 128³ · UI hidden | 8.7 → 18.3 | 0.26 → 0.32 |

| gpu (Firefox completion-tick caveat: sub-ms values are ticks) | frame ms before → after | reconstruct | present |
|---|---|---|---|
| 1s+2pz · 64³ | 1.78 → 1.75 | 0.25 → 0.25 | 1.52 → 1.00 |
| 1s+2pz · 96³ | 3.76 → 2.53 | 0.28 → 0.26 | 3.76 → 2.32 |
| 1s+2pz · 128³ | 5.55 → 3.49 | 0.25 → 0.25 | 5.51 → 3.28 |
| rydberg · 64³ | 1.76 → 1.01 | 0.26 → 0.26 | 1.50 → 1.03 |
| rydberg · 96³ | 3.75 → 2.50 | 0.25 → 0.25 | 3.51 → 2.26 |
| rydberg · 128³ | 5.75 → 3.50 | 0.25 → 0.25 | 5.27 → 3.28 |
| sim-ladder · 64³ | 1.76 → 1.00 | 0.25 → 0.25 | 1.51 → 1.00 |
| sim-ladder · 96³ | 3.75 → 2.26 | 0.25 → 0.25 | 3.76 → 2.26 |
| sim-ladder · 128³ | 5.75 → 3.50 | 0.25 → 0.25 | 5.53 → 3.26 |
| 91 modes · 64³ | 2.26 → 1.51 | 0.75 → 0.75 | 1.50 → 1.00 |
| 91 modes · 96³ | 5.51 → 3.75 | 2.00 → 1.50 | 3.76 → 2.25 |
| 91 modes · 128³ | 9.76 → 6.76 | 4.26 → 3.52 | 5.51 → 3.26 |
| 91 modes · 96³ · style cloud | 5.52 → 4.01 | 2.00 → 2.03 | 4.01 → 2.52 |
| 91 modes · 96³ · style solid | 6.49 → 5.99 | 2.00 → 1.50 | 4.51 → 4.51 |
| 91 modes · 96³ · style grain | 6.00 → 6.00 | 2.01 → 2.01 | 4.52 → 3.02 |
| 91 modes · 96³ · style signed | 6.02 → 5.97 | 2.01 → 2.00 | 4.51 → 4.51 |
| 91 modes · 96³ · style dust | 6.50 → 6.07 | 2.01 → 2.01 | 4.51 → 3.02 |
| 91 modes · 96³ · style glass | 13.03 → 13.02 | 2.01 → 1.50 | 11.02 → 11.51 |
| 91 modes · 96³ · style additive | 5.50 → 5.02 | 2.01 → 1.51 | 3.51 → 3.51 |
| 91 modes · 96³ · style bands | 6.04 → 6.00 | 2.02 → 1.50 | 4.51 → 2.50 |
| 91 modes · 96³ · view density | 5.50 → 4.06 | 2.01 → 2.01 | 4.01 → 2.51 |
| 91 modes · 96³ · view phase | 7.02 → 6.49 | 2.01 → 1.51 | 5.01 → 3.53 |
| 91 modes · 96³ · view real | 5.50 → 5.49 | 2.01 → 2.01 | 3.51 → 2.00 |
| 91 modes · 96³ · view diff | 6.02 → 5.50 | 2.01 → 1.50 | 4.01 → 3.51 |
| BOX packet (91 labels) · 64³ | 2.70 → 2.25 | 1.37 → 0.66 | 2.01 → 1.34 |
| BOX packet (91 labels) · 96³ | 6.65 → 3.98 | 2.67 → 1.34 | 4.01 → 2.67 |
| BOX packet (91 labels) · 128³ | 11.32 → 5.98 | 6.01 → 3.34 | 5.34 → 3.34 |
| BOX axial gas (256 modes) · 64³ | 16.61 → 9.94 | 16.71 → 10.02 | 3.35 → 3.35 |
| BOX axial gas (256 modes) · 96³ | 53.28 → 23.23 | 50.06 → 23.36 | 6.68 → 3.35 |
| BOX axial gas (256 modes) · 128³ | 116.62 → 49.72 | 116.84 → 50.07 | 8.37 → 8.36 |
