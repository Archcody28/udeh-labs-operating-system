# Canonical Design Direction — Phase 3
Date 2026-10-16. Source: 40 DESIGN.md files + code.html survey (Tailwind CDN, Inter+JetBrains Mono, Material Symbols).

## Explicit tokens (repeated)
- Dark mission-control surfaces: `#081425` bg, `#101c2d/#152031` containers, `#d7e3fb` text (Nexus SRE DESIGN.md).
- Typography: Inter (UI) + JetBrains/Geist Mono (data/logs) + Material Symbols icons — repeated in login code.html + DESIGN.md.
- Radius 4px structural / pill status; 4px base grid; sidebar 240px rail; 12-col bento grid; tonal layering + glow alerts (not drop shadows).
- Status semantics: healthy #10b981 / warning #f59e0b / critical #ef4444.

## Repeated conventions
Dark-first, high-density, mono data, caps labels, sticky table headers, glass/backdrop panels.

## Conflicting conventions
Theme-named dirs (cyber/kinetic/obsidian/nexus/surgical/synthetic) carry own palettes but have no arch counterpart — excluded from canonical (HD-08).

## Unresolved
Light mode, canonical accent (blue #3492f6 vs violet #6001d1), motion system — HUMAN DECISION REQUIRED. No CSS/component library built.
