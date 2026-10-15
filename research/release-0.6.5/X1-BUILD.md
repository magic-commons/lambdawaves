# X1 THE POTENTIAL — build note (Opus 5.5 builder, 2026-10-15)

Branch `x1-potential` from `fdc3b49` (the 0.6.4 cut tip). `lab/` lines **28,711 → 28,790 (+79, budget +85)**. No test file, no gate code;
`lab/sw.js` is `pwa --write`'s.

## Seats (line numbers at the commit)
- `lab/md.js` 241 — V's atom loop is now one line calling `hermiteR` (250), the Hermite contraction Σ E_t E_u E_v R⁰_tuv, moved out
  verbatim, so V's arithmetic and order are unchanged. 259 `export function rinvMatrix(basis, C)` = ⟨p|1/|r−C||q⟩, Z = 1 (PySCF
  `int1e_rinv` at `set_rinv_origin(C)`), through the same `hermiteR`; E-tables per primitive pair, so it is for a handful of points.
- `lab/mathworker.js` 14 (the op list), 154 (dispatch, `phi` transferred), 512 `probe` on every `chem.ground` / `chem.open` /
  fallback reply (cached on the solve), 516 `probeOf`, 522 `fft` (radix-2, 9 lines), 531 `fft3`, 537 `espG` (Ĝ cached per N, h),
  538 `chemEsp`.
- `lab/chemview.js` 241 the PROBE line in `.mol-more` (after H2's note), 602–604 its text in `refresh()`, 529–539 `espPump()`
  beside H1's `feedFlow` (the consumer comment `// 0.6.5 X2: field.setCard(reply)` at 537), 801 `update()` pumps when
  `view === 'esp'`, 934 `__LW.chem.esp` (the last reply) and `__LW.chem.espPump()`.

## THE PROBE
Φ_el(R_A) = −Σ_pq D_pq rinv_pq(R_A), computed in the chem worker when the ground lands; null without D (a frontier record) or past
46 AOs (one `rinvMatrix` a nucleus: C₆₀'s 300 AOs measured 17.7 s, tryptophan's 87 0.64 s). `chem.esp` is offered only where the
probe exists. The line: water `Φ at nuclei · O −23.16 · H −5.83 · H −5.83 a.u. · exact`; three or more alike collapse to `×n`
(benzene `Φ at nuclei · C −24.33 ×6 · H −10.48 ×6 a.u. · exact`), so it stays one line. Its title says it is the electrons'
potential of the ground state. (The plan's example "H −1.00" is not the electrons' potential at H; −5.83 is. The total Φ at H
less its own nucleus would be −5.83 + 8/1.81 ≈ −1.4.)

**PySCF (2.x, the `sci` env, RHF STO-3G cart=True, same geometry, `einsum('pq,pq', D, int1e_rinv)`):** water O −23.161570 ·
H −5.828207 (ours −23.161571 · −5.828207; the last digit is the two SCFs' convergence, ΔE 2.4e-8); benzene C −24.327917 ·
H −10.478958 (ours identical to 6 decimals). Far point C = (3e4, 4e4, 1.2e5): Σ D rinv(C)·|C| = 10.0000048 (water; the residue
is the dipole/|C|), 41.99999999 (benzene).

V is byte-identical (old `md.js` vs new, `integrals().V` compared with `!==`) for H₂O, C₆H₆, NH₃ in STO-3G and 6-31+G*;
Σ_A −Z_A rinvMatrix(R_A) reproduces V to ≤ 1.4e-14.

## THE CARD'S VOLUME — `chem.esp { N, half, shells, D, atoms }` on the cards queue
The cards worker holds no solve (`chemSol` lives in the chem worker), so the message carries what H1's `flow.balance` carries:
the field shells and D (the run's Re D when RUN is live, else the ground's f64 D), plus `atoms` = the ground's probe (positions,
Z, sym, Φ_el), returned as `atNuclei`. Reply `{ N, half, phi: Float32Array(N³) x fastest, min, max, charge, atNuclei, ms }`.

1. ρ from `molecular-flow.js`' sampler (`createFlow(shells).at`), never a second one, as a CELL MEAN: a point sample at 64³ is
   not one. Measured on water (h = 0.232 bohr): point-sampled Σρh³ = **9.6017 e** (the O 1s, exponent pairs to 261, aliased);
   128³ 9.9721; 256³ 9.999997. So a cell within 3h of a nucleus with Z > 2 is the mean of its 5³ sub-cells, and every other cell
   is the point + h²/24 · ∇²ρ by the discrete 7-point Laplacian (the midpoint rule's own h² term — without it the sub-sampled
   charge still missed 0.02 e: the boundary flux of ∇ρ). The sub-cells' first moment is kept per nucleus as the dipole a cell
   centre cannot hold and added back as −p·(r−R)/max(|r−R|, 3h)³ (benzene's π face: 5e-3 → 5e-4 a.u.).
2. Φ_el = −G ⊛ ρh³ by a free-space FFT Poisson: zero-padded to (2N)³ (Hockney–Eastwood, no periodic image), G(d) = 1/|d| at
   cell offsets d ∈ [−N, N−1]h, Ĝ real (G even) and cached per (N, h).
   **The self cell:** G(0) = ⟨1/r⟩ over a cube of side h = (3 ln(2+√3) − π/2)/h = **2.3800774/h** (the potential at the centre
   of a uniformly charged unit cube; ∫_{[−½,½]³} dV/r = 3 ln(2+√3) − π/2).
3. Φ_nuc = Σ_A Z_A / max(|r−R_A|, h/2), analytic.

Memory at N = 64: two (128³) f64 arrays 32 MB + Ĝ 16 MB (+16 MB once, while Ĝ is built).

## Hand checks (`.tmp/esp.mjs`, `.tmp/pyscf_probe.py`, `.tmp/x1-browser.mjs` — throwaway, not committed)
| | water STO-3G, half 7.43, h 0.232 | benzene STO-3G, half 10.69, h 0.334 |
|---|---|---|
| charge Σρh³ | **10.00047** (Δ 4.7e-4) | **42.0026** (Δ 2.6e-3) |
| min / max | −0.1125 / 26.29 | −0.0168 / 15.07 |
| ms (node; browser worker) | 1086 cold (Ĝ built) ; 833 | 3035 ; 2515 |
| grid vs exact | lone-pair line, at cell centres: ≤ 1.8 % from 1.75 bohr behind O outward (2.00: 0.55 %, 2.25: 0.05 %, 3–5.75: ≤ 0.62 %); 1.0 / 1.25 / 1.5 bohr: +0.021 / +0.011 / +0.005 a.u. absolute (Φ crosses zero at ≈ 1.3 bohr, so a relative figure there is meaningless) | 20 points ≥ 1.5 bohr from every nucleus: worst \|Φ_grid − Φ_exact\| = **5.1e-4 a.u.** |
| minimum | grid −0.1125 at 1.935 bohr from O, on the lone-pair side (exact on the bisector: −0.1131 at 1.89 bohr) | grid −0.0168 above the ring at z −3.17 (exact there −0.0162; PySCF Φ(0, 0, ±2.9) −0.0161) |

The exact Φ is Σ Z_A/|r−R_A| − Σ D rinvMatrix(r), PySCF-confirmed at three points per molecule. The plan's "within 3 % along
the lone-pair line" holds from 1.75 bohr out, not inside 1.5 bohr, where the residual is the core's quadrupole on a 0.23-bohr
cell. Doubling N does not buy it: 128³ is 21.5 s for benzene and the error there is the same 2e-3 without the dipole term.

## Gates
- `node tests/pwa.test.mjs --write`, then `./test.sh node` → exit 0, every suite GREEN (md.test, rhf-molecules.test, chem-sweep pin V and the energies).
- Browser (server on 9331, `GD_PORT=4531`): `tests/chem.browser-test.mjs` **GREEN, 0 failing of 56**; `.tmp/x1-browser.mjs` 0 failing of 5
  (water's PROBE line exact text, a `chem.esp` reply 64³ with charge 10.0005, min −0.1125, 833 ms; benzene's grouped line,
  charge 42.0026, 2515 ms; no page errors).
- THE LOCK is the integrator's (nothing here runs in a frame; no locked state has a card).

## Deferred / for the integrator
- `field.setCard(reply)` at chemview.js 537 (X2's name); `view === 'esp'` in `update()` waits for X2's VIEW option.
- `atNuclei` is the ground's probe even while a RUN feeds the volume (the probe line says "the ground state's" in its title).
- Benzene's 2.5 s sits inside the cards queue's 8 s ceiling; a 46-AO molecule should be ≈ 4 s. Per-orbital ESP: not this cut.
