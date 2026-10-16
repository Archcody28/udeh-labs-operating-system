# apps/web — Future Web Application Boundary (Phase 1)

**Status:** Boundary placeholder. There is NO executable web application yet.

## Purpose

`apps/web/` reserves the location of the future UdehLabs production web
application. It is created in Phase 1 solely to establish a stable boundary
so later phases have a known home for web work.

## What lives here today

- This `README.md` (boundary definition).
- Nothing else. No framework, no routing, no state management, no business logic.

## Existing Stitch prototype export (preserved, NOT moved)

The Phase 0 Stitch export remains exactly where it was, untouched, at:

```
stitch_udehlabs_operating_system/
```

- ~212 static HTML mockups (`code.html` per concept directory)
- ~209 PNG assets/screenshots
- ~101 Markdown + ~17 TXT specification documents
- ~252 concept directories

**These files were deliberately NOT moved, rewritten, converted, or
re-routed in Phase 1.** Moving 500+ prototype artifacts risks breaking
relative asset references and destroys the Phase 0 baseline. The export is
the current repository evidence and stays addressable at its original path
until a later phase explicitly designs the migration (see
`docs/adr/0010-repeated-dashboards-interfaces.md` and related conflict ADRs).

## Rules for this boundary (binding until superseded by ADR)

1. No framework may be scaffolded here until an ADR selects it.
2. No prototype file may be edited in place to "productionize" it.
3. Any future migration MUST preserve the original export and record the
   mapping (old path -> new route/component) in an ADR.
4. `stitch_udehlabs_operating_system/` is read-only reference material.

## Related records

- `docs/adr/0001-phase-1-monorepo-boundary.md` — why this boundary exists.
