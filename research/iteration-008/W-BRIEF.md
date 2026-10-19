# W · THE WAVE AND CLIP CARDS (iteration 008, branch `it008-wave`, gate server 9621 / GD 5621)

Josh (JOSH-PROMPT.md): "Other things that needs a rework or needs to be cut out is delta p AND Re+Im in 'wave' window (Where is this
different from the other viewpoints other than color?) … Remove dithering row from wave and move it to quality in settings. Rename
'Volume' in the clip window to 'Full' or 'OFF/ON' with a light indicator."

Read first: CLAUDE.md (DOMAIN AUTO / palette paragraph: "WAVE density uses palette θ=0; Δρ uses the same ±π/2 pair as Re/Im; palette OFF
retains the old colors", THE LOCK paragraph, the scopes paragraph), `lab/windows/material.js` (WAVE: SPACE · OBSERVABLE · DRAW; the
DITHER seg at :54; CLIP's `sliceModeSeg` VOLUME | CLIP | SLAB at :69), `lab/field.js` `VIEW = { density, phase, real, imag, diff, reim }`
(:20) and the shader's mode 5 (REIM superposes REAL orange/blue and IMAG green/violet — two pictures in one), `lab/windows/settings-card.js`
(QUALITY beside GOVERNOR), `lab/settings-store.js`, `docs/STATE-SCOPES.md`, `tests/official-defaults-palette.browser-test.mjs`,
`research/release-0.4.0/measure/digest-lock-s4a.json` (THE LOCK's 1004-value fixture names `reim`).

## Build
1. **VIEW loses REIM and Δρ.** WAVE's OBSERVABLE seg reads DENSITY · PHASE · RE · IM. The shader keeps `diff` (MOLECULES' kick uses it as a
   Δ switch — row U) and may keep `reim`'s code path dead or delete it; `VIEW` indices stay stable for saved projects: a saved `reim` opens as
   PHASE, a saved `diff` opens as DENSITY (and says so once in STATE's status), `view` verbs and `lw:view=` accept the old names and map
   them. The V key cycles the four. `tools/status-probe.mjs` and `lab/status.js`' per-VIEW lines follow.
2. **DITHER → SETTINGS › QUALITY.** The seg leaves WAVE and seats under QUALITY beside GOVERNOR / PERFORMANCE. Scope: if `dither` is a
   PROJECT key today it becomes PREFERENCE — read once from a project that carries it, never written into one again (`docs/STATE-SCOPES.md`
   row moved, `tools/settings-probe.mjs` green, `serialize({ scope: 'edit' })` bytes checked by `tools/serialize-bytes.mjs`); if it is
   already PREFERENCE, only the seat moves.
3. **CLIP.** VOLUME | CLIP | SLAB becomes a switch with a lamp, CLIP (off = the full volume), and beside it the kind seg CLIP | SLAB shown
   while on; `mat.slice.mode` keeps its 0 · 1 · 2 meaning, the `material.slice.*` targets and the `slice` / `clip` ids unchanged; a saved mode
   opens right.
4. **THE LOCK.** `lab/field.js` moves, so THE LOCK ×2 on your gate server (`--query gastab=0` for the 1004 fixture, as its header says); the
   fixture enumerates views and names `reim` — re-capture with the tool's `--write` ONLY for the rows that vanish by design, and say the
   diff in the build note (the hydrogen digests of the four kept views must not change by one bit).

## Light check
Screenshots of WAVE and CLIP; the V key through the four views; a 0.5.x project saved on REIM opens on PHASE with the status line; DITHER
under QUALITY changes the picture and survives a project open; CLIP's lamp. `./test.sh node`, rack-deps, `official-defaults-palette`,
`field-law`, THE LOCK ×2, settings-probe. Report: worktree · branch · commits · tests · blockers · next.
