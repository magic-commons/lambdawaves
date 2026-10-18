---
status: proposed (only if Candidate B is picked)
---
# The stage words' preferences are one record of their own, not keys in the settings blob

INFORMATIONAL's options are hand-written keys in the one settings blob today: `molFormula`, `molFormulaSize`, `atomLabels`, `atomLabelsSize`, `infoPos`, `infoPad`. They are written in the literal at `lab/shell/settings.js:31` and applied at `:85-93`. That literal has lost a key four times (`settings.js:27-30`). Josh's rework adds about ten more options. They become one PREFERENCE family of their own, a kit `createPrefs` record over declarative rows (`lab/mir/core/prefs.js:19-36`), listed in `lab/settings-store.js` FAMILIES. This is the same shape as `mir.gui` (`lab/look.js`) and `lambdawaves.q0.curves`. The six old keys are read once, as a migration, and are never written again. Keeping the blob was rejected: every new toggle would cost a line in a literal that has already dropped keys.
