# 0.6.2 H2 — THE DRIVE'S PITCH + H₂'S HIDDEN CORRELATION (build report)

Branch `h2-pitch-correlation` off `1a9c3d8` (yan-c). Two feature commits and this report. Not pushed.

## What landed
- **H2a THE DRIVE'S PITCH** (`f4f2703`). While the drive is on, STATES' DRIVE sub-line ends with the nearest bright stick and its detuning in Eh, the carrier's pitch f = ω·RATE/2π in Hz tagged with the ladder's basis, and, while the worker lags, "the drive runs at 1/x of real time" (x = RATE ÷ the a.u. the drive actually moved per wall second between two replies).
  Seats: `lab/statesview.js` 172 (`ladder.basis = q.basis` on the landing), 346–348 (`land()` measures `drive.speed`), 443–448 (`refreshDrive`, the one place `roDrive` is written); `lab/windows/molecules.js` 96 (`rate: () => clock.rate` on the register's api, same line).
- **H2b H₂'S HIDDEN CORRELATION** (`1209aa7`). On MOLECULES · H₂ in STO-3G, one note in `.mol-more` under the spectra: a|σg²⟩ ± b|σu²⟩ share one density and one current (Slater–Condon: the two determinants differ by two orbitals); their ⟨H⟩ differ by 4|ab|K. a, b come from `sto3gH2(R).ciVector` (σg², σu²) and K = `gMO[5]` = (σgσu|σgσu), the numbers h2ci.js already returned, so h2ci.js is unchanged. R comes from the row's atoms. The note is written once per solve (`dataset.k = sol.key`) and hidden for any other molecule or basis, or when no solve is held.
  Seats: `lab/chemview.js` 29 (import), 237 (the note), 585–592 (`refresh()`).

## The numbers (node, `sto3gH2`)
| R (bohr) | a | b | K | 4\|ab\|K (Eh) | E_FCI | E_FCI + 4\|ab\|K |
|---|---|---|---|---|---|---|
| 1.4003 (the row, 0.741 Å) | 0.9936 | −0.1127 | 0.1813 | **0.0812** | −1.137274 | −1.056047 |
| 1.4000 | 0.99363 | −0.11272 | 0.18126 | 0.0812 | −1.137276 | −1.056074 |
| 5.67 (3.0 Å) | 0.7331 | −0.6801 | 0.2992 | 0.5968 | −0.933631 | −0.336860 |

**Round 2's 0.0725 Eh does not hold at the row's R.** The integrals match Szabo–Ostlund (K₁₂ = 0.1813, c = −0.1128 at 1.4 bohr), and with them 4|ab|K is 0.0812. 0.0725 is what it comes to near R = 1.3 bohr (0.0727). The note prints the computed value. At 3.0 Å |b| → a (0.68 against 0.73), as expected.

Pitch, measured in the browser at RATE 3000 on benzene: ω = 0.3903 gives "nearest S₄x, −0.0000 Eh off · 186 Hz · STO-3G · the drive runs at 1/149.6 of real time" (0.3903 · 3000 / 2π = 186.4). With ω tuned to the BEAT lane (0.8108) it reads 387 Hz and 1/68.3 on the headless rig.

## Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 28,371 → 28,385 (+14; budget +20). H2a +7, H2b +7.

## Commands run
- `git reset --hard 1a9c3d8`: done. `git log -1` = 1a9c3d8.
- `node tests/pwa.test.mjs --write` after each feature: PASS (sw.js manifest refreshed).
- `./test.sh node` after each feature: exit 0, 225 PASS both times.
- Gate server `python3 tools/gate/server.py <wt> 9281` (pid 593540), stopped by pid.
- `LW_PORT=9281 GD_PORT=5381 node tests/register.browser-test.mjs`: RED, 1 failing of 22 (R13, the eight ORBITAL presets on C₆₀). Rerun alone: still RED R13. **The same R13 is RED on the base files** (lab edits checked out from 1a9c3d8, run, then restored), so it predates this row and is not from it. The other 21 checks are GREEN, R7 (the drive) among them.
- One CDP smoke (a throwaway script in `.tmp/`, deleted afterwards): H₂ shows the note with the numbers above, water hides it, and the benzene drive at RATE 3000 shows the pitch line. 3/3 GREEN.

## Not done
- No test was added: no pinned law changed, and h2ci.js is untouched.
- The "−0.0000 Eh off" sign of a rounded zero is left as it prints.
- The 1/x ratio uses RATE as the requested a.u./s, including while paused. It shows only while `r.lag` ≠ 0 and the measured speed is below RATE, so a paused catch-up blinks it at most briefly.
