# W1 THE KNOBS FOLLOW THE STYLE — built (chain W, 2026-10-24)

## What changed (`lab/windows/material.js`, `lab/shell/persist.js` one line)
- **A `STYLE_READS` table** lists, for each WAVE control, the styles that read it. `styleSync()` (once `atomDrawSync`; `ui.styleSync`, which
  persist.js' restore calls) sets `hidden` on each control's seat, and the rows re-flow. A THREE VIEWS row with nothing shown hides too.
  `setDisabled` is gone from WAVE.
- **The table is RENDER_WGSL's own reads, not the brief's list.** I read each branch, and two of the brief's rows were wrong:
  - **SOFT** is the power w = ρ^SOFT. SOLID, SIGNED, SHELL and SHELL ± overwrite w, so they never read it (CLAUDE.md already says
    "neither reads it" for SHELL / SHELL ±). SOFT shows on CLOUD · BANDS · DUST · ADD. The brief had it backwards.
  - **ISO**: CLOUD's transfer never reads `p3.y`. ISO shows on SOLID · SIGNED · BANDS · SHELL · SHELL ±, and on ESP only under its ISO surface.
  - **KNEE** is the transmittance T_q. It shows on CLOUD · SOLID · SIGNED · BANDS · DUST · SHELL · SHELL ±. ADD accumulates without it, and
    the atom styles never march.
  - The other rows:
    - GRAIN: DUST.
    - EXPOSURE, HUE: every style.
    - SIZE: BALLS.
    - RADIUS: STICKS · ESP.
    - PROBE: ESP on SAS | SES.
    - RANGE · ISO | SAS | SES · LIVE: ESP.
- styleSync runs at build (the boot's style shows only its controls), on a STYLE press, `LW.setStyle`, the seg's `set`, an ESP surface
  change, PALETTE ON/OFF (the bar) and a restore.
- FINISH stays as it was (native-ui.js still disables GLASS on 9–11).

## Tests
- Shot `w-shots/W1-wave-styles.jpg`, WAVE under four styles (the controls each shows):
  - CLOUD: EXPOSURE · SOFT · HUE · KNEE.
  - DUST: + GRAIN.
  - STICKS: EXPOSURE · HUE · RADIUS.
  - ESP: EXPOSURE · HUE · ISO · RADIUS · RANGE · ISO | SAS | SES · LIVE.
- Restore: history.browser-test at the chain's end.

## CLAUDE.md sentence
"THE KNOBS FOLLOW THE STYLE (iteration 015 W1): material.js `STYLE_READS` shows a WAVE control only while the drawn style reads it (the shader's own
reads: SOFT on CLOUD · BANDS · DUST · ADD, ISO on SOLID · SIGNED · BANDS · SHELL · SHELL ± and ESP's ISO surface, KNEE on the marched styles but ADD,
GRAIN on DUST, SIZE on BALLS, RADIUS on STICKS · ESP, PROBE on ESP's SAS | SES, RANGE · surface · LIVE on ESP; EXPOSURE and HUE always); `ui.styleSync`
(once atomDrawSync) applies it, a restore too."

## Calls for Josh
- A modulated knob that its style hides keeps running, unseen (the route is untouched). Say if a hidden routed knob should show a mark.
