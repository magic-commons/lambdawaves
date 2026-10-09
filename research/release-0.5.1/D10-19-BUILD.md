# D10-19 · THE FLASH GUARD, the limiter half — build record (0.5.1 "Informational Update", Sonnet builder)

Worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a80a622aba3ff2186`, branch `worktree-agent-a80a622aba3ff2186`,
reset to the integrator's `27eb96a` (the 0.5.0-alpha cut). Never pushed, merged or tagged. Ports 8983 / 5453.

**This row is PARTIAL, and says so.** The limiter sees exactly four parameters (`material.exposure`, `material.gamma`, `material.stage`,
`material.knee`). A fast LFO on the register's morph (`reg.morph`), a kick (`chem.kick`) or the camera can still flash a large area, and
only THE FIELD JUDGE (a 64² luminance readback per frame; a frame-path row with the lock and the pair; 0.5.x) sees that.

## 1 · The calibration (U8) — `tools/flash-calibrate.mjs`, run before any lab line was written

The kit's limiter counts swings of `delta × span` in a route's own units (`flash-guard.js:43,62,68`), `delta` = 0.1 (WCAG). So
`ranges[route] = [0, step / 0.1]` makes `delta × span` exactly the step below, in the map's own space (ln for a log route).
**The rule (the brief's, for all four):** the parameter step that moves a pixel's relative luminance L by 10 % of itself, taken where
that is also ≈ the WCAG delta (0.1 of the maximum), i.e. at the pixel/state where L is highest for that route. The shader's output `o`
stands for L (the canvas's sRGB curve is not modelled; the field judge, which reads pixels, is the exact one).

| route | map | default | step (guard space) | `ranges` | derivation from `lab/field.js` / `lab/rack.js` |
|---|---|---|---|---|---|
| `material.exposure` | log | 1 | **0.0953** = ln 1.1 | `[0, 0.953]` | `sigma = 24·exposure`, `a = 1 − exp(−wEff·sigma·stepN·4)`: optical depth τ ∝ exposure, so a thin cloud's radiance is linear in exposure and every thicker one is sub-linear. ×1.1 is the most a 10 % step can give. Checked: over τ from 1e-6 to 40 the largest relative change of ×1.1 is **10.0 %** (the thin limit) |
| `material.gamma` | linear | 1 | **0.1319** | `[0, 1.319]` | `o = pow(col + bg·bgBlend, 1/gamma)`. At mid-grey 0.5, gamma 1: 0.5 → 0.45 (10 % darker) needs γ = ln 0.5 / ln 0.45 = 0.868, Δγ = 0.1319; the lighter side (0.55) needs +0.1594, so the smaller is taken. Checked: ±Δγ moves o by −10.0 % / +8.4 % |
| `material.stage` | linear | 0.04 | **0.1131** | `[0, 1.131]` | `setStageMix`: `bg = ground + (custom − ground)·mix` (only while FOLLOW THEME is off: it is a bypass otherwise, and the default is follow ON). `Y(custom) − Y(ground)` = −0.8089 on the light ground (L 0.9152 at mix 0.04), so 10 % of L is Δmix = 0.0915/0.8089 = 0.1131: **ΔL = 0.0915 absolute**. The dark ground's whole range is ΔL = 0.10 (10 % of its own L is 0.004), so it can never be a flash and does not set the step. `bg·(0.82..1.25)` scales L and dL alike |
| `material.knee` | log | 0.6 | **0.2595** | `[0, 2.595]` | `wEff = w/(1 + knee·w)`, w ≤ 1. `dln wEff / dln knee = −knee·w/(1+knee·w)`, largest at w = 1: a 10 % change of wEff there is knee 0.6 → 0.7778 (ln 0.2595) or → 0.4545 (ln 0.2776); the smaller is taken. A thin ray's L ∝ ∫wEff, so this bounds every ray. Checked on a 160-step Gaussian ray (exposure 0.08–12, soft 0.5–1.5, peak 1–0.05): the largest relative change is **3.8 %**, so the step over-guards by about 2.7× in L and never under-guards |

Not guessed: every number above is printed by `node tools/flash-calibrate.mjs` (`steps()`), and `tests/flash-routes.test.mjs` holds the
lab's constants to `steps()`.

Notes on the conventions, for the integrator:
- WCAG's delta is ABSOLUTE (0.1 of the maximum, darker state below 0.8). The brief's "10 % of the pixel's own L" equals it at L ≈ 1 (exposure,
  the light stage) and is twice as strict at mid-grey (gamma); the sRGB curve (o is already encoded, linear L ≈ o^2.4) makes the proxy
  within a factor of about 2 of the exact measure in the bright range. "About 10 %" is what U8 asked for; the exact one is the field judge's.
- `material.stage` is inert in the default state (FOLLOW THEME on); the guard still wraps it, and it matters once the ground is chosen.

## 2 · (the wrapping, the test, the counts — filled in by commits 2 and 3)
