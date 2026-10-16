---
name: Cyber-Enterprise High-Density System
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c4c6cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8e9197'
  outline-variant: '#44474c'
  surface-tint: '#b7c8e1'
  primary: '#b7c8e1'
  on-primary: '#213146'
  primary-container: '#031427'
  on-primary-container: '#6f7f97'
  inverse-primary: '#505f76'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#001522'
  on-tertiary-container: '#0086bf'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e4fe'
  primary-fixed-dim: '#b7c8e1'
  on-primary-fixed: '#0b1c30'
  on-primary-fixed-variant: '#38485d'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
  status-available: '#10B981'
  status-busy: '#F59E0B'
  status-unavailable: '#EF4444'
  status-pending: '#64748B'
  surface-elevation-1: '#0A1F35'
  surface-elevation-2: '#0F2944'
  border-muted: '#1E293B'
  engineering-accent: '#8B5CF6'
typography:
  display-command:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-margin: 2rem
  grid-gutter: 1rem
  engineering-density: 0.5rem
  client-density: 1.5rem
  stack-gap: 1.25rem
---

## Brand & Style

The design system is engineered for high-performance engineering environments where data density and technical clarity are paramount. The brand personality is **Technical, Authoritative, and Precise**, catering to a dual audience: internal engineering squads requiring deep-focus workspaces and clients needing high-level strategic overviews.

The visual style is a hybrid of **Minimalism** and **Corporate Modern**, utilizing a "dark mode by default" strategy to reduce eye strain during long engineering sessions. It prioritizes functionality over decoration, using sharp lines, disciplined spacing, and a restricted color palette to create a "Command Center" aesthetic. A strict separation of concerns is maintained through visual "scoping"—client-facing views use more generous whitespace and higher-level abstractions, while engineering views maximize information density and technical detail.

## Colors

The palette is anchored by the **Deep Navy (#031427)**, serving as the foundational surface color to create a low-light, high-focus environment. The **Electric Violet (#7C3AED)** is the primary action color, used sparingly for critical interactions and branding. 

**Semantic Logic:**
- **Primary/Secondary:** Reserved for navigational cues and primary call-to-actions.
- **Tertiary:** Used for technical progress visualizations and engineering-specific indicators.
- **Status Colors:** Strictly mapped to the lifecycle states (Available, Busy, Unavailable, Pending). 
- **Internal vs. External:** Internal engineering views utilize a broader range of the blue-violet spectrum for data visualization, while client-facing views are restricted to a more "executive" monochromatic look with single-point violet accents.

## Typography

Typography is used to distinguish between "Content" and "Data." 

- **Hanken Grotesk** is the voice of the system, used for headers and organizational context to provide a modern, sharp professional feel.
- **Inter** provides high legibility for body text and long-form descriptions.
- **JetBrains Mono** is used for all technical entities, metadata, and status labels. This serves as a psychological cue that the information is "system-generated" or "technical."

On mobile, display sizes scale down aggressively to maintain the layout's structural integrity. All labels are uppercase with increased letter-spacing to ensure readability at small sizes in dense grid layouts.

## Layout & Spacing

The system employs a **Fluid Grid** model with two distinct density profiles:

1.  **Engineering Workspace (High-Density):** Uses an 8px (0.5rem) baseline rhythm. Gutters are tightened to 16px to allow for massive data visualization. Sidebars are collapsible to maximize the "Canvas" area.
2.  **Client Dashboard (Standard):** Uses a 24px (1.5rem) rhythm to provide a more approachable, "Premium" feel.

**Breakpoints:**
- **Mobile (<768px):** Single column, stacked cards, hidden sidebar.
- **Tablet (768px - 1280px):** 12-column grid, compact sidebar.
- **Desktop (>1280px):** 12-column grid, full sidebar, multi-pane "Command Center" layout.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than traditional shadows, ensuring the UI remains crisp and "technical."

- **Level 0 (Background):** `#031427` (The void).
- **Level 1 (Cards/Sidebar):** `#0A1F35` (Surface tier 1).
- **Level 2 (Modals/Popovers):** `#0F2944` (Surface tier 2).

**Borders & Outlines:**
Low-contrast outlines (`#1E293B`) are used to define containers. Active or focused states utilize a subtle inner glow of the **Electric Violet** primary color. Glassmorphism is reserved exclusively for the sidebar and top navigation to provide a sense of depth and context persistence as the user scrolls content.

## Shapes

The system uses **Soft (0.25rem)** roundedness to maintain a precise, engineering-focused look. 

- **Standard Buttons & Inputs:** 0.25rem (4px).
- **Entity Cards:** 0.5rem (8px).
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

This subtle rounding prevents the UI from feeling "sharp" or hostile while avoiding the playfulness of more rounded systems.

## Components

- **Buttons:** Primary buttons are solid `#7C3AED` with white text. Secondary buttons use the "Ghost" style with a `#1E293B` border and no fill.
- **Technical Progress Bars:** Multi-segment bars using `#0EA5E9` for progress and `#1E293B` for the track. Segments should be visually separated by 1px gaps to indicate "Milestones."
- **Status Chips:** Small, mono-spaced text inside pill containers. Backgrounds use a 15% opacity of the status color (e.g., green for available) with a solid 1px border.
- **Input Fields:** Dark background (`#0A1F35`) with bottom-only border focus transitions. Labels are always positioned above the field in `label-caps` typography.
- **Engineering Cards:** High-density containers with no padding on headers. Use a vertical "Status Accent Bar" on the left edge to denote the health of the project or resource.
- **Context Switcher:** A prominent, high-elevation component in the sidebar allowing users to jump between Organizations. It must include the Org's unique brand color or icon for immediate recognition.