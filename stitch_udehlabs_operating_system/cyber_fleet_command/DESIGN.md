---
name: Cyber-Fleet Command
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#ffffff'
  on-tertiary: '#003824'
  tertiary-container: '#6ffbbe'
  on-tertiary-container: '#00734e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
  surface-main: '#0c141e'
  surface-card: '#0d1b2a'
  terminal-black: '#091017'
  electric-violet: '#7c3aed'
  indigo-accent: '#1C85E8'
  status-risk: '#f59e0b'
  status-critical: '#ef4444'
  border-muted: '#1e293b'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  streaming-text:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  compact: 8px
  comfortable: 16px
  gutter: 16px
  margin: 24px
  sidebar: 260px
---

## Brand & Style
The brand personality is authoritative, technical, and high-stakes. It is designed for engineers and AI orchestrators who manage complex, multi-agent systems from a central mission control. The aesthetic is a fusion of **Terminal-Core and Industrial Minimalism**, prioritizing information density and operational status over decorative elements.

The UI should evoke a sense of "system readiness" and high-precision automation. It uses a high-density layout where every pixel serves a functional purpose, mirroring the complex logic of the AI agents it controls. The visual tone is "Deep Cyber-Enterprise"—dark, focused, and occasionally punctuated by high-energy violet signals that indicate active intelligence.

## Colors
The palette is engineered for prolonged monitoring and high-contrast readability. The foundation is a "Deep Space" indigo-black, providing a stable, low-strain backdrop for luminous technical data.

- **Primary (White/Sky):** Reserved for core data values and high-priority headlines to ensure instant recognition.
- **Electric Violet (Secondary):** The color of intelligence. It marks AI execution paths, tool activations, and primary interactive states.
- **Terminal Semantic:** High-saturation emerald, amber, and red are used strictly for system health and authorization logic.
- **Surface Layering:** Uses tonal shifts rather than opacity for depth. The `terminal-black` is the deepest tier, used for streaming AI logs and code execution blocks to create a "recessed screen" effect.

## Typography
The system employs a dual-font strategy to differentiate between human-readable interfaces and machine-generated data.

- **Hanken Grotesk (Humanist):** Used for navigation, layout headers, and settings. It provides the necessary "enterprise" polish and legibility.
- **JetBrains Mono (Technical):** Used for all AI-native elements. Streaming messages use `streaming-text` to emphasize the iterative nature of LLM outputs. 
- **Hierarchy:** Monospaced labels should always be in `label-caps` to distinguish metadata from content.
- **Readability:** Code snippets and logs require `data-mono` with ample line-height to ensure complex characters (brackets, operators) are instantly distinguishable.

## Layout & Spacing
The layout uses a **Bento Grid** architecture within a fixed-sidebar frame. This allows for high-density "cards" that aggregate streaming logs, orchestration graphs, and input controls.

- **Orchestration Canvas:** The main workspace is a fluid fluid canvas. Multi-agent graphs should utilize the full width, with a 24px safe area margin.
- **Density:** Spacing is tight. Use `compact` (8px) for internal module elements and `comfortable` (16px) for the gap between logical blocks.
- **Tooling Panels:** Side-drawers or contextual panels (like source citations or log inspectors) should maintain a fixed 320px width to preserve the readability of the main AI stream.

## Elevation & Depth
Depth is communicated through **Surface Tiering and High-Contrast Outlines** rather than physical shadows.

- **Tonal Layers:** The background is the lowest tier. Functional modules (cards) are elevated one step via `surface-card`. Interactive inputs and terminal zones are "cut out" using `terminal-black`.
- **Glow Accents:** High-intensity elements (like the central Architect node or active AI agents) use a subtle 4px blur of `electric-violet` at 20% opacity to simulate a CRT-style light bleed.
- **Borders:** All containers are defined by 1px solid borders (`border-muted`). Active states switch this border to `electric-violet` or `primary` white.

## Shapes
The shape language is strictly **Industrial**. 

- **Hard Edges:** 2px (Soft) is the maximum radius allowed. This ensures that the interface feels "built" rather than "grown," aligning with the mechanical nature of enterprise AI.
- **Functional Geometry:** Square corners are preferred for checkboxes, terminal blocks, and data-grids.
- **Execution Badges:** Status indicators use the same 2px radius. Avoid full-round pills; the geometry must remain rigid to support the high-density grid.

## Components
- **Streaming Messages:** AI responses should appear on a `terminal-black` surface. Use a blinking 2px cursor block in `electric-violet` at the end of the stream.
- **Cited Source Badges:** Small, square-edged badges with a 1px border. On-hover, they expand to show a snippet in `body-sm`.
- **Tool Execution Logs:** Collapsible monospaced blocks. Success states are marked with a vertical `tertiary` (green) bar; failures with a red bar.
- **HITL (Human-in-the-Loop) Requests:** These cards use a 2px `status-risk` (amber) border and a high-contrast background to disrupt the flow and demand immediate attention.
- **Orchestration Nodes:** Square containers for agents. Active agents pulse with a violet outer glow. Connection lines between agents are 1px solid, with "data packets" (dots) animating along the path during active tasks.
- **Buttons:** Primary buttons are `electric-violet` with sharp corners. Secondary buttons use a ghost style with white borders.