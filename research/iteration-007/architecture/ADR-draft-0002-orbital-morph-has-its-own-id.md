---
status: proposed
---
# The ORBITAL register's A ↔ B is its own target; `reg.morph` stays the STATES register's

MO-REGISTRY has two registers, ORBITAL and STATES, and each has a MORPH from store A to store B. Only the STATES register's position is a target today: `reg.morph` (`lab/shell/modulation.js:129-131`). Its hint says "the STATES register", and saved projects address it. Josh's rework makes the ORBITAL register's A ↔ B (`lab/orbitalsview.js:116`) modulatable and automatable on the TIMELINE. It gets a new id under the `reg` root (the name is for Josh, e.g. `reg.omorph`), and `reg.morph` is left alone. A route that follows "whichever pane is showing" was rejected: a saved route would silently change meaning when the pane changes. Because the ORBITAL register's `save()` (`orbitalsview.js:595`) does not persist its stores or its position today, this decision brings with it saving `A`, `B`, `morph` and `morphOn` the way the STATES register already does (`lab/statesview.js:757-767`). Without that, a reopened project's lane would drive a MORPH that has no stores.
