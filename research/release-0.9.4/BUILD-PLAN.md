# 0.9.4 "Separable" — THE BUILD PLAN (Claude Sos / Fable 5.1, drafted 2026-10-16 ≈11:39 while 0.9.1 H2 builds; base and cap filled at the 0.9.3 cut)

Josh, 2026-10-16: "Let's keep going all the way to 0.9.4. Then we shall begin iterative work till 1.0.0" and the dial "don't over verify and bloat the code with
tests. Just build to the best of your abilities and a light visual/functional check". The row is the engine plan's gated SEPARABLE module (`../release-0.6.0/PLAN.md`
l.300; 0.8.2's deferred list "the SEPARABLE module (cube, 2-D and anisotropic oscillators)"). Base: `yan-c` at the commit carrying the briefs after the v0.9.3-alpha
cut (**TO FILL**); lines (**TO FILL**); cap × 1.01. Two rows, two Opus builders IN SEQUENCE (S2 extends S1's kernel branch and module); the integrator merges, THE
LOCK ×2 (this cut edits `lab/field.js` — the one cut since 0.7.0 that does), a light visual check, cuts `v0.9.4-alpha` "Separable" — the last feature cut before the
iterative road to 1.0.0.

## The shape (the law of this cut)
**A SYSTEM THAT IS NOT CENTRAL.** Every Hamiltonian the register plays today is spherical: the 91 labels are (n, l, m) and the kernel evaluates radial × Y_lm (spaces
0–3, 6). The separable systems — the anisotropic oscillator V = ½(ω_x²x² + ω_y²y² + ω_z²z²) and the cube (a box of side L with hard walls) — have Cartesian product
eigenstates ψ = f_{n_x}(x) f_{n_y}(y) f_{n_z}(z), so they need ONE new kernel branch, **space 7 CARTESIAN**, in `lab/field.js`' mode loop: f = c · ∏ᵢ h(nᵢ, aᵢxᵢ) ·
exp(−½Σaᵢ²xᵢ²) for the oscillator (h = the physicists' Hermite polynomial by its three-term recurrence in WGSL, aᵢ = √ωᵢ, the norm on the CPU) and f = c · ∏ᵢ sin(nᵢπ(xᵢ/L
+ ½)) inside |xᵢ| < L/2, 0 outside, for the cube (S2). The record is the same 7-vec4 `Mode`: `nlm = (n_x, n_y, n_z, 0)`, `c = (re, im, norm, form)`, `lag0 = (a_x, a_y, a_z,
L)`; `Params` unchanged. THE LABELS: the register's 91 slots carry the 56 triples with N = n_x + n_y + n_z ≤ 5 (the cube: nᵢ ≥ 1, the 56 lowest by n_x² + n_y² + n_z²),
ordered by energy then lexicographically; slots 57–91 are "unused here" exactly as CENTRAL's unbound rows are (energy NaN, a zero record, the lane reads it) — the
precedent is `lab/central.js`' BOUND law. Energies are closed forms: Σωᵢ(nᵢ + ½) and π²Σnᵢ²/(2L²). `spectrum.levels` are the distinct energies (grouped to 1e-9), each
with its degeneracy in the label — ISOTROPIC folds to the oscillator's six shells, 2-D (ω_z = 4) to its own ladder, ANISOTROPIC (1, 1.5, 2.25) to 56 lines, the cube
to the famous (1,1,2)-threefold and (1,2,3)-sixfold. **THE WINDOW `separable`** (eyebrow SEPARABLE) of CENTRAL's kind, closed by default, opened by the picker's new row:
a FORM stepper ISOTROPIC · 2-D · ANISOTROPIC (· CUBE in S2), knobs ω_x ω_y ω_z (0.5…4; S2: L 4…30 a₀), a readout "E₀ = 1.5 ħω · 6 levels of 56 labels · lowest shell 1 · 35
unused here". No worker op: nothing is solved. **THE STAND-DOWNS** (the tree's law: cull the observation, never the state): `hydrogenTheorems: false` culls what it
culls today; the new flag `separable: true` stands down, each with one sentence, the readers of `H.radial` — the slap (`kick.js`), CALCULUS's radial tiles
(`calculus.js`/`calculusview.js`: stats, breath, ellipsoid, the force tiles), RADIATION (`radiation.js`) — and `noMomentum: true` forces position space; the ray tile and
PLANE keep working through `psiAt`'s CPU twin. Momentum space (self-dual per axis), Stark (a displaced oscillator) and a 2-D box are deferred, named.

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **S1 THE CARTESIAN KERNEL + THE OSCILLATORS** (Opus) | `lab/field.js`: the space-7 branch in the mode loop (≤ 14 WGSL lines: the Hermite recurrence as a small fn, the product, the envelope; the cube's sine form behind `c.w` so S2 adds two lines) + the record upload reading `nlm`/`lag` as the oscillator's does (the existing packer l.787 already copies six `lag` floats — a Cartesian table fills `lag[0..3]`); every existing branch byte-identical. `lab/separable.js` (new, ≤ 80): `LABELS` (the 56 triples by energy), `FORMS` ISOTROPIC · 2-D · ANISOTROPIC with their ω, `configure(form, ω)`, `energy(a)`, `labelOf` "n_x n_y n_z = 1 0 2", `tableFor` (the Cartesian record: norm = ∏(ωᵢ/π)^{1/4}/√(2^{nᵢ} nᵢ!)), `psiAt` (the CPU twin by the same recurrence), `domainFor` (max over populated of √(2(nᵢ + ½)/ωᵢ) + 3), `spectrum` (levels grouped, degeneracy in the label, `levelKey`), the entry `SEPARABLE` with `kernelSpace: { x: 7, p: 7 }, stark: false, hydrogenTheorems: false, noMomentum: true, separable: true`, and `createSeparable(host, api)` the card (CENTRAL's shape without the solve). `lab/hamiltonian.js`: the import and `HAMILTONIANS.separable`. `lab/windows/readouts.js`: the device beside CENTRAL's (closed; `devopen` → prepare). `lab/windows/spectrum.js`: `'separable'` in `SYS` (opens the window as CENTRAL does). `tools/catalogue-table.mjs` → `lab/catalogue.js` regenerated (the row reads from HAMILTONIANS; `--check` in step). The stand-downs: one guard each in `kick.js` (the slap refuses), `calculusview.js` (the radial tiles say "a separable system: its radial tiles stand down"), `radiation.js`. PROJECT `instruments.separable` { form, wx, wy, wz } default-absent on CENTRAL's persist seats; `docs/STATE-SCOPES.md` one row. | `lab/field.js`, `lab/separable.js`, `lab/hamiltonian.js`, `lab/windows/readouts.js`, `lab/windows/spectrum.js`, `lab/catalogue.js` (generated), `lab/kick.js`, `lab/calculusview.js`, `lab/radiation.js`, `lab/shell/persist.js`, `docs/STATE-SCOPES.md` | **≤ +130** |
| **S2 THE CUBE** (Opus, after S1 merges) | `lab/field.js`: the sine form behind `c.w = 1` (two lines: the product of sines, zero outside the box); `lab/separable.js`: FORM CUBE with knob L (4…30 a₀), labels nᵢ ≥ 1 — the 56 lowest by n_x² + n_y² + n_z², energies π²Σnᵢ²/(2L²), norm (2/L)^{3/2}, `psiAt`'s sine twin, `domainFor` = 0.525 L, the degeneracy readout naming (1,1,2) ×3 and (1,2,3) ×6; the PROJECT key gains `L`. The box's own gas (SPECTRUM's GAS row) is the spherical well's — it stands down here with a sentence (deferred, named). | `lab/field.js`, `lab/separable.js`, `docs/STATE-SCOPES.md` | **≤ +40** |

## Laws for the two builders
- Your own worktree, your own branch (`s1-cartesian`, `s2-cube`) from the base commit (S2 from S1's merge); NO push; never edit `lab/mir/**` or `lab/fonts/**`;
  `lab/field.js` is edited ONLY inside the new branch and the record packer, every existing shader string byte-identical (diff the WGSL before and after your
  change outside your branch: zero lines); after any `lab/` edit `node tests/pwa.test.mjs --write` then `./test.sh node`; `node tools/rack-deps.mjs --classes
  --no-write` (a new window registers its slot as CENTRAL does; the `app` literal gains no key — `lab/separable.js` exports its one handle as `bloch.js` exports `BL`),
  `node tools/new-project.mjs --check`, `node tools/serialize-bytes.mjs`, `node tools/catalogue-table.mjs --check` green before you report. **NO NEW TEST FILES, NO
  GATE SCRIPTS** (Josh's dial): the closed forms are checked ONCE in a `.tmp/` throwaway (the CPU twin against the kernel's texels at ten points for |1 0 2⟩ — the
  tree's `tests/field-molecule.browser-test.mjs` shows how a texel is read back — and the norm ∫|ψ|² = 1 by a 64³ sum), numbers into the build note; the window
  prints E₀ and the degeneracies, which is the permanent check.
- THE LOCK is the law of this cut: the integrator runs it ×2 at each merge with `--query gastab=0` on BOTH runs; a red lock is a stop — the branch is not
  merged until the diff names the texel and the fix. SEPARABLE never in force at boot; the first-run project is byte-identical (`new-project --check`).
- Line budgets are the table's; count `find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l` (the regenerated `lab/catalogue.js` counts). One build note
  each: `research/release-0.9.4/S<n>-BUILD.md`. ONE browser check each (`tests/keyboard-window.browser-test.mjs` once for S1 — the + list changes — plus a
  screenshot of |1 0 2⟩ under ANISOTROPIC; S2 a screenshot of the cube's (1,2,3)); never `pkill -f`; ports 9241, 9261, 9443, 8721/8741, 8731/8735 are taken; S1
  9631/5731, S2 9641/5741.

## Gates (existing only) · the cut · deferred
Node gate 0; the line law; `catalogue-table --check`; THE LOCK ×2 at each merge; a light visual check on 9261 (SPECTRUM › SYSTEM › SEPARABLE, ANISOTROPIC |1 0 2⟩
with its three nodal planes; CUBE (1,2,3)); the local cut `v0.9.4-alpha` "Separable", CHANGELOG, snapshot. NO push, NO deploy, NO gh release. Deferred by name:
momentum space of the separable oscillator (self-dual per axis — one phase per axis), a displaced oscillator (Stark on it), the 2-D box and a cylinder, the gas in
the cube (the well's packet road is spherical), the slap on a separable system (its radial integrals are spherical), the Cartesian labels in the SPECTRUM grid's
own geometry (the lanes are by level today).
