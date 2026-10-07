# λWAVES 0.4.0 · S4 THE LIBRARY a / b / c — BRIEFS for three builders (and two verifiers)

**Written by Claude Sos (the fallback Major Agent), 2026-10-07, from `PLAN.md` the way Yan wrote the S0/S1 briefs.**
The contract is `research/release-0.4.0/PLAN.md` §3 **B2** (LIBRARY, the fourth storage class, and the data cache), §4
**F5** (THE LIBRARY as expansions), the §6 row **S4**, and **§10's numbers, which are the sizing** — read §10 before
anything else here: N1 (the AO wall opens: the 3070 grants a 32 KiB workgroup), N2 (records GATE, they do not merely
accelerate; **the 52-record starter is NOT shipped**; the live cap stays benzene; `COST` is refit), N3 (R-L2 = YES:
C₆₀'s HOMO/LUMO in 0.4.0 through the orbital-only path with shell screening). The method and the record are the names
plan, `research/molecular-orbitals-2026-10-01/NAMES-AND-CACHE-PLAN.md` §4 (the record) and §6 (the cache), and Sol's
booster plan (`~/Documents/LAMBDAWAVES/research/molecular-orbitals-2026-09-29/PLAN.md`, `CACHE-BUDGET.md`,
`DISTRIBUTION.md` — untracked in Josh's root checkout; read them by absolute path, never copy or commit them).

**Order.** S4a first (the proof and the store; a verifier: worker + storage). Then **S4b ∥ S4c** in their own worktrees
from the S4a-merged tree (disjoint files: S4b owns `chemview.js`'s picker, `lab/library/**`, `tools/orbital-library.mjs`'s
entries; S4c owns `field.js`, `gpu-boot.js`, the kernel and VALENCE). S4c ends in a verifier (the kernel). Every stage
starts from a tree where S1 NAMES is merged: a record carries its names.

## 0 · Laws (all three)

Never edit `lab/mir/**` or `lab/fonts/**`. After any `lab/` edit `node tests/pwa.test.mjs --write`, then the suites
(`lab/sw.js`'s list is generated; its §2 code is edited deliberately, once, and said in REPORT). Subtract, don't add:
count `lab/*.js` lines before and after. **Diagnostics in `tools/`, never `lab/`.** The glass is Josh's. Three scopes +
LIBRARY (S4a writes the row). Never `pkill -f`. Git only in your worktree; never push. One browser suite at a time; the
digest lock is re-run ALONE before a red is believed (the RTX 3070's one-ulp P5 fault). **Never a second solve road;
never a record that fails validation; never a disabled row where a download would do** (PLAN F5). Ports: **S4a
8753/5221 · its verifier 8755/5223 · S4b 8757/5225 · S4c 8759/5227 · its verifier 8761/5229.** REPORT.md waves under
`## <date> · 0.4.0 S4<a|b|c> — …`.

---

## S4a · THE PROOF AND THE STORE

**The scope (B2).** Installed records are device content, content-addressed, never in a project, a link or a history row.
A project holds `{ id, hash, nameKey }`: PROJECT, one history row per change of molecule. `docs/STATE-SCOPES.md` gains
the LIBRARY row; `tests/new-project.test.mjs`'s scope sets learn it.

**Where records live.** `lab/library/<sha>.json` plus the section manifests: deployed, **NOT precached**. `sw.js` routes
`library/` cache-first into `lw-data-v1`; the names are content hashes, so a new build never clears it.
`tests/pwa.test.mjs` exempts exactly `library/**` and asserts every manifest row's file exists with its hash. Write the
exemption as ONE rule the 0.5.0 kit-file policy can extend ("precache what a root reaches", PLAN §10 N4) — do not build
the kit policy now.

**The record path.** A worker op `chem.open(record)` (`lab/mathworker.js`, beside `ensureSolve` l.212) fills the solve
cache from the record and replies with `ensureSolve`'s own `ground` shape, so no window downstream changes. Each record
states `caps { orbitals, states, rpa, tdhf }`: ORBITAL needs ε and C; STATES needs the stored CIS states; RPA sticks are
stored; TDHF needs the live ERI and past the cap is refused with a sentence. A project or link that names an
uninstalled record fetches it on open, progress and failure said in the row; offline, the open restores the rest and
names the part that refused. The schema is versioned (`schema: 1`); readers ignore unknown members.

**The benzene-cap law** (`lab/molecules.js` l.25–28). A record past the live cap opens only from its record; absent, its
row says DOWNLOAD, not DISABLED; a basis or charge change on it is refused with a sentence, not a solve.

**The iPad law.** `navigator.storage.persist()` is asked on the user's first INSTALL press, never at boot (Firefox
prompts); the quota and the persisted answer are shown; an evicted record degrades to "not installed", never a broken
preset. In a Safari tab, KEEP ON THIS DEVICE is NOT offered until the M5 measures persist granted (M5 pending: write the
one command for Josh into REPORT and `measure/MEASURE.md`).

**`COST` refit (N2).** Refit `COST` (`molecules.js` l.382, `predictMs` l.414) from the measured rows in
`research/release-0.4.0/measure/` (benzene, C₂H₄/6-31+G*, naphthalene); move the "~9.6 s" text that
`tests/chem.browser-test.mjs` pins and `chemview.js` l.9 states. The live cap stays benzene (`CAP_MS`, l.467–470).

**The generator is the app.** `tools/orbital-library.mjs` runs the shipped solver in node and writes the record;
`--check` is byte-exact (the `tools/new-project.mjs` pattern). **Benzene's record is the proof**: Sol's native booster
record + S1's names + the STEM fields + its page (`moleculeLatex`). Before S4c touches the kernel: **benzene and one
64-AO fixture join the digest lock on the base tree** (its only molecular fixture today is water, tier 0), so "the ≤ 64
tiers are untouched" becomes provable.

**Acceptance.** Cached = fresh on energies, occupations, signed fields, canonical subspaces and names; **zero solver calls
on open** (count them); `library/**` the one precache exemption; benzene + the 64-AO fixture in the lock; the LIBRARY
scope row; DOWNLOAD (never DISABLED) on an absent record; offline open names what refused; `node tools/new-project.mjs
--check`. Browser on 8753/5221: `chem`, `molecular-names`, `register`, `history`, `new-project`, `offer`, and a new
`library` suite (install → open offline → evict → "not installed"). Then **a fresh verifier** (worker + storage) on
8755/5223 with this section as its contract.

---

## S4b · THE SECTIONS AS CONTENT, BEHIND THE GATE

**The picker.** A page turner `‹ SECTION ›` above the existing `<select>` in MOLECULES (`lab/chemview.js`), which then
holds one section (about 25 rows); search is 0.5.0's FLY-TO. **The expansion seat** is each section's header row: name,
record count, bytes, an installed lamp, INSTALL / REMOVE. No new tab (the fourth named exception to "nothing new in the
interface": Josh asked for expansions by name).

**The sections, diverse rather than variants** (Josh: *"Don't try to go for too many variations of the same molecule, try
to be as diverse as possible."*; R-L1 first option): DIATOMICS · HYDRIDES · ORGANIC · **BIO** (the twenty amino acids as a
family — sixteen ≤ 64 AO now, Phe, Arg, Tyr, Trp after S4c; the five nucleobases 44–60; Gly-Gly 57; N-methylacetamide,
imidazole, indole, phosphoric acid, ribose) · **LATTICE** (finite clusters only, the solver has no k-points: LiH/LiF/MgO
cubes, Na₂Cl₂, the ice hexamer and cube, cubane, neopentane, naphthalene, Si₅H₁₂; Na₄Cl₄ after S4c) · **HEAVY** (KrF₂, SeO₂,
KBr, GeCl₄, TiCl₄; the d-block "try it and let the stability probe decide"; R-L6 first option: **if the vendored BSE
record (`lab/vendor/bse/`) carries STO-3G to Z = 54**, widen to HI, CH₃I, XeF₂, XeF₄, I₂, labelled MODEL — all-electron
minimal basis, no relativity; if it does not, say so and stop at Kr).

**The diversity gate with a FAMILY allowance**, enforced mechanically by `tools/orbital-library.mjs --check`: an entry
passes if its formula is unique AND it adds a new element, a new point group, or a tag from the fixed motif list (ring
size, peptide bond, d-block, cluster, cage, nucleobase) — OR it belongs to a declared family (the amino acids, the
nucleobases). Leu and Ile share a formula; the family keeps both and the record says so.

**The STEM fields per record** (R-L4 first option): formula, point group and frame, mass, charge and multiplicity, dipole,
HOMO–LUMO gap, geometry source, InChIKey and PubChem CID (open; not CAS), a two-line blurb, the curated IEs (where they
exist; NIST CCCBDB = SRD 101 — the legal reading against `LEGAL-PROVENANCE` precedes any store build, say so in
REPORT), and the sources. Bases: STO-3G, plus 6-31+G* for the anchors only; the name is the join key.

**Sizing first.** Every entry needs a stated geometry source and a PySCF oracle energy (`~/bin/scipython`, PySCF 2.14, on
the vendored decimals — `tools/symmetry/pyscf-symm-oracle.py` shows the pinned-basis road). **Build three end to end
first — alanine, Li₄F₄, TiCl₄ — time them (generator ms, record bytes, open ms), put the table in REPORT, then size the
sections from it.** Records past 64 AO are generated now and draw after S4c's tier lands.

**Acceptance.** The three timed; every shipped record passes the gate and `--check`; the page turner + the headers;
INSTALL / REMOVE / DOWNLOAD behave per S4a's laws; total library bytes and per-section bytes in REPORT. Browser on
8757/5225: `chem`, `molecular-names`, `library`, `menubar`, `new-project`. No verifier (content behind a verified road).

---

## S4c · THE ENGINE UPGRADES

**(i) The density wall.** The χ tile lives in workgroup memory: cap × 64 × 4 B = 16 KiB at cap 64 (`lab/field.js`
`MOL_CAPS = [16, 40, MAX_MOL_AO]` l.677, `MAX_MOL_AO = 64` l.672 — "the shader's var<function> array<f32, 64>"). Add one
tier, **cap 128**. N1: `lab/gpu-boot.js` `requestGpu()` (l.25–41) asks only for texture dimensions in `want`; add
`maxComputeWorkgroupStorageSize: 32768` where the adapter reports ≥ 32768, and where it is refused (the M5 is the assumed
case until measured) build that tier with a **workgroup of 32**. Records then reconstruct Phe–Trp (71–87), adamantane,
Na₄Cl₄, B₁₂H₁₂²⁻, caffeine, DMT, the base pairs (99–106), C₂₀H₂₀ (120), the carbonyls and ferrocene. The dense ERI (458 MB
at 87 AO) is the generator's, never a live solve's.

**(ii) The orbital-only path, no tile** (N3, R-L2 = YES). An orbital is Σ c_μ χ_μ, O(nAO), accumulated shell by shell
with shells screened at 1e-10 and a small reduction — the ORBITAL kind at any AO count (`field.js` ~l.1472 already sizes
`orbital` as `n`, not `n²`). **C₆₀'s HOMO and LUMO draw in 0.4.0 from a PySCF coefficient record** (300 AO; N3 measured
12.0 ms plain, 3.2–3.6 ms screened at 96³ — the reconstruct runs once per change, never per frame). The density, the
I_h names and the grid-record road are 0.4.1 BUCKYBALL. `tools/perf/orbital-dispatch.mjs` is the measuring harness to
reuse.

**(iii) VALENCE** = `D − 2 Σ_core C_c C_cᵀ`, formed in f64 and drawn by the existing density kind, as a **switch on
DENSITY** (not a fourth VIEW segment: the row is at the hand law's width), the core count from S1's `coreCount(atoms)`,
so the heavy-atom core no longer drowns the valence.

**Also:** the `field.js` comment that says Firefox's timestamp queries are zeroed is stale (MEASURE.md: they are real
now) — fix the comment. The live cap moves only if the refit `COST` says a ≤ 64-AO solve now fits the cap (it should not;
§10 N2).

**Acceptance.** An 87-AO and a 120-AO record reconstruct (against the generator's f64 density at sampled voxels, to the
rgba16float precision); VALENCE; C₆₀'s HOMO and LUMO draw from the record (screenshot + a sampled-voxel check against
PySCF's orbital at the same points); **the 1004-value lock green** (the ≤ 64 tiers byte-identical, on the fixtures S4a
added); the device report (`tools/perf/device-report.js`, 30 s scene) within the governor's tier on the 3070 (M5
pending). Browser on 8759/5227: `chem`, `molecular-names`, `render-regressions`, `current`, `export3d`. Then **a fresh
verifier** (the kernel) on 8761/5229.

---

## Hand-off (each builder)

`research/release-0.4.0/S4<a|b|c>-BUILD.md`: the commits, the gates with counts, the numbers (bytes, ms, the lock runs),
`lab/*.js` lines before and after, open items, and the KIT BRIEF notes for S5 (S4b: the section header and the cells
filter — brief 4; S4c: nothing for the kit, the engine is λWAVES'). Kill your gate server by pid. Final message: ten
lines + worktree path + branch.

## Harness

Compound shell with variables, loops, heredocs or backticks may be refused: plain commands, scripts as files under
`.tmp/`. If a command is refused, reshape it; never retry verbatim. Commit after each piece; a session may end mid-wave
and the next agent picks up from your branch.
