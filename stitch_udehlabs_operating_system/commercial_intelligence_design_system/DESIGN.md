---
name: Commercial Intelligence Design System
colors:
  surface: '#0c141e'
  surface-dim: '#0c141e'
  surface-bright: '#323a45'
  surface-container-lowest: '#070f18'
  surface-container-low: '#141c26'
  surface-container: '#18202b'
  surface-container-high: '#232b35'
  surface-container-highest: '#2d3540'
  on-surface: '#dbe3f1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#82d3de'
  on-secondary: '#00363c'
  secondary-container: '#006b75'
  on-secondary-container: '#98e9f4'
  tertiary: '#c0d0e6'
  on-tertiary: '#233143'
  tertiary-container: '#a5b4ca'
  on-tertiary-container: '#384658'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#9ff0fb'
  secondary-fixed-dim: '#82d3de'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f56'
  tertiary-fixed: '#d4e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0d1c2d'
  on-tertiary-fixed-variant: '#39485a'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
  approval-gold: '#D4AF37'
  contract-teal: '#006D77'
  estimate-slate: '#94A3B8'
  surface-card: '#121C29'
  border-subtle: '#1E293B'
  status-positive: '#10B981'
  status-caution: '#F59E0B'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  summary-title:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  data-mono-sm:
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
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  component-gap-sm: 8px
  component-gap-md: 16px
  section-padding: 48px
---

## Brand & Style
This design system represents the "Commercial Operating Layer" of the orchestrator, evolving the existing cyber-infrastructure into a high-fidelity environment for financial and legal precision. The brand personality is **authoritative, transparent, and meticulous**, designed to instill trust in executive stakeholders while maintaining the high-performance DNA of the underlying platform.

The design style is **Corporate Modern with Tactile Precision**. It moves away from the raw "terminal" aesthetic toward a "Financial Instrument" feel. This is achieved through a mix of deep, sophisticated surfaces, crisp hairline borders, and a highly intentional information hierarchy. The interface prioritizes "Evidence-Based Design," where every data point is traceable and every high-value action is treated with the visual weight of a premium commercial asset.

## Colors
The palette is anchored in the existing dark surface architecture but introduces "Commercial Accents" to signal high-value business logic.

- **Primary (Approval Gold):** Reserved exclusively for high-value approvals, signature triggers, and "Convert to Project" actions. It represents the "Golden Thread" of commercial success.
- **Secondary (Deep Teal):** Used for legal and contract-related modules. It provides a calm, professional contrast to the darker UI, grounding the "Contract Intelligence" layer.
- **Tertiary (Clear Slate):** Applied to estimates, projections, and "Proposed" states. It implies neutrality and technical accuracy.
- **Neutral (Deep Obsidian):** The background remains consistent with the orchestrator’s core, using layered dark blues and grays to maintain focus and reduce fatigue during complex discovery sessions.

## Typography
Typography is split into two functional roles: **Executive Clarity** and **Numerical Readability**.

- **Hanken Grotesk** is the primary voice for human-centric content. It is used for summaries, executive discovery notes, and navigation. It should feel open and legible.
- **JetBrains Mono (Data-Mono)** is utilized for all "Hard Truths"—pricing, hours, confidence scores, and technical hashes. By switching to a monospaced font for numbers, the design system ensures that columns of financial data align perfectly, facilitating rapid scanning and comparison.
- **Styling Note:** Use `label-caps` for metadata tags (e.g., `INTERNAL`, `AUDIT_TRAIL`). Use `data-mono-lg` for the primary contract value or total estimate to emphasize precision.

## Layout & Spacing
The layout follows a **Rigid Fixed Grid** for desktop dashboards to ensure that "Traceability Linkages" and side-by-side comparisons (e.g., AI Draft vs. Human Approved) remain stable and predictable.

- **Grid:** A 12-column grid with a generous 24px gutter. 
- **Rhythm:** All spacing is derived from a 4px base unit. 
- **Modular Layout:** Use a "Bento" approach for the Discovery Operating Layer, where individual requirements are housed in atomic cards.
- **Handoff View:** A dual-pane layout is preferred for "Contract-to-Delivery" views, showing commercial terms on the left and engineering factory initialization on the right.

## Elevation & Depth
This design system uses a **Hybrid Elevation** model that combines tonal layers with subtle, high-quality shadows to mimic the feel of premium stationery or physical financial instruments.

- **Tonal Layers:** The base background is the darkest layer. Containers for active discovery sessions use a slightly lighter surface (`surface-card`).
- **Subtle Shadows:** Unlike the flat cyber-fleet base, this system uses "Ambient Plumb" shadows—very low opacity (#000000 at 25%), wide blur (12px-20px), and zero offset. This makes cards appear to "hover" slightly above the operating layer.
- **Crisp Outlines:** Every card and interactive element features a 1px hairline border. For neutral elements, use `border-subtle`. For focused or "Action-Required" elements, the border color should match the semantic accent (Gold or Teal).

## Shapes
The shape language is **Professional and Structured**. 

- **Roundedness:** We use a "Soft" (0.25rem) radius for most UI components. This provides a hint of modern approachability without losing the "Serious/Legal" tone of a commercial instrument.
- **Internal Elements:** Status badges and "Atomic Requirement" tags use a slightly more pronounced radius (0.5rem) to distinguish them from structural containers.
- **Interactive States:** Buttons and input fields use the same 0.25rem radius to maintain a cohesive, "machined" look across the discovery wizard.

## Components
- **Buttons:** 
    - *Primary (Approval):* Solid `approval-gold` with dark text. High-contrast, high-intent.
    - *Secondary (Contract):* `contract-teal` with a subtle inner glow.
    - *Tertiary:* Ghost style with `estimate-slate` borders.
- **Confidence Badges:** Small chips using `data-mono` font. Use color-coded backgrounds (Green/Amber/Red) at 15% opacity with 100% opacity text for the "Human-AI Validation Loop."
- **Commercial Cards:** These must include a "Traceability Header"—a small `label-caps` section at the top of the card indicating the `organizationId` and `versionHash`.
- **Pricing Inputs:** Use a "Unit-Prefix" pattern where the currency symbol is visually locked to the input field using a darker background tint, emphasizing the monospaced numerical entry.
- **Clarification Center Hub:** Use threaded views with "Internal" vs "External" markers. Internal notes should feature a diagonal "Redacted" watermark pattern in the background to prevent accidental client exposure.