| module | row → file | lines | backward | forward | shared lets (bare) | app.state (another scope's) | **fwd + shared** | bare writes to another scope's let | hinge |
|---|---|---|---|---|---|---|---|---|---|
| boot (stays) | — → `lab/rack.js` | 283 | 0 | 56 | 0 (+1 boot-kept) | 11 | **67** | 0 | exempt |
| loop (stays) | — → `lab/rack.js` | 487 | 41 | 49 | 0 | 27 (+4 own) | **76** | 0 | exempt |
| settings | R3a → `lab/shell/settings.js` | 144 | 7 | 13 | 0 | 2 (+2 own) | **15** | 0 | ok |
| controller | R1 → `lab/shell/controller.js` | 345 | 12 | 10 | 0 | 2 (+29 own) | **12** | 0 | ok |
| material | R2c → `lab/windows/material.js` | 131 | 11 | 0 | 0 | 1 (+4 own) | **1** | 0 | ok |
| settings-card | R2c → `lab/windows/settings.js` | 178 | 21 | 1 | 0 | 4 | **5** | 0 | ok |
| film | R2c → `lab/windows/film.js` | 21 | 5 | 3 | 0 | 3 | **6** | 0 | ok |
| state | R2a → `lab/windows/state.js` | 170 | 13 | 6 | 0 | 2 | **8** | 0 | ok |
| spectrum | R2a → `lab/windows/spectrum.js` | 253 | 18 | 15 | 0 | 9 | **24** | 0 | ok |
| readouts | R2b → `lab/windows/readouts.js` | 141 | 14 | 4 | 0 | 3 (+1 own) | **7** | 0 | ok |
| molecules | R2d → `lab/windows/molecules.js` | 97 | 18 | 3 | 0 | 5 (+6 own) | **8** | 0 | ok |
| stage-words | R2d → `lab/shell/stage-words.js` | 123 | 4 | 2 | 0 | 2 (+1 own) | **4** | 0 | ok |
| modulation | R2d → `lab/shell/modulation.js` | 247 | 19 | 1 | 0 | 9 | **10** | 0 | ok |
| transport | R3b → `lab/shell/transport.js` | 229 | 15 | 0 | 0 | 4 | **4** | 0 | ok |
| kepler | R2b → `lab/windows/kepler.js` | 294 | 15 | 1 | 0 | 3 (+7 own) | **4** | 0 | ok |
| ink | R2d → `lab/shell/ink.js` | 60 | 6 | 1 | 0 | 3 | **4** | 0 | ok |
| rack-wiring | R3b → `lab/shell/rack-wiring.js` | 327 | 39 | 0 | 0 | 4 | **4** | 0 | ok |
| notebook | R3b → `lab/shell/notebook.js` | 389 | 28 | 10 | 0 | 11 | **21** | 0 | ok |
| keys | R3b → `lab/shell/keys.js` | 202 | 32 | 1 | 0 | 12 | **13** | 0 | ok |
| persist | R3a → `lab/shell/persist.js` | 294 | 49 | 0 | 0 | 13 (+1 own) | **13** | 0 | ok |
| links | R3a → `lab/shell/links.js` | 78 | 5 | 0 | 0 | 3 (+1 own) | **3** | 0 | ok |
| history | R3a → `lab/shell/history.js` | 158 | 11 | 0 | 0 | 4 (+1 own) | **4** | 0 | ok |
| facade | R5 → `lab/shell/facade.js` | 255 | 121 | 1 | 0 | 21 | **22** | 0 | ok |

THE HINGE (G-G): bare writes across scopes 0; the largest moving module spectrum at 24 (limit 25) → HOLDS
