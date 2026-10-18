---
status: proposed
---
# The ORBITAL dial is a stepped modulation target

Until now MOLECULES had two targets, and the orbital index was kept out on purpose (`lab/shell/modulation.js:115-119`). The reason given was that the index "changes WHICH quantity the volume means … a rebuild of the picture's subject rather than a value to sweep". Josh's 2026-10-18 rework turns that around. The ORBITAL dial becomes the target `chem.orbital`, and modulation and a TIMELINE automation lane move it over the dial's whole range. It uses the kit registry's `integer` map (`lab/mir/modulation/registry.js:160-165`), so every value a route or lane writes is a whole orbital. When a new molecule lands, the target is registered again with that molecule's range (hot re-registration keeps the base and the routes, `registry.js:252-256`).

## Considered options
- **Keep it out**, the old rule. Josh rejected this.
- **A continuous cross-fade between neighbouring orbitals.** This would be a new field product, not a target, and it stays open as a grilling question.
- **A normalised 0..1 target mapped onto the dial's span inside the setter.** This keeps a saved route meaningful when the molecule changes. The cost is that the number a lane shows is not an orbital number.

## Consequences
A saved project can now carry routes and clips on `chem.orbital`, so the id is permanent. The old comment at `modulation.js:115-119` has to be rewritten, or a later review will "fix" this back.
