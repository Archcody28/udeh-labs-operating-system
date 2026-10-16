---
name: UdehLabs Reliability
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
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#251400'
  on-tertiary-container: '#b47300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
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
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-data:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  mono-label:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
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
  unit: 4px
  container-padding: 24px
  gutter: 16px
  component-gap-xs: 4px
  component-gap-sm: 8px
  component-gap-md: 16px
---

## Brand & Style
The brand personality is authoritative, technical, and unflappable. This design system facilitates high-stakes decision-making during enterprise infrastructure crises. The visual style is **Cyber-Enterprise**: a fusion of professional corporate reliability with the high-density information aesthetics of a Network Operations Center (NOC).

The UI evokes a sense of "calm control" through dark-mode precision. It prioritizes data density and legibility over decorative white space, utilizing subtle glowing accents and technical borders to guide the eye through complex telemetry.

## Colors
The palette is engineered for high-contrast monitoring environments.

- **Surface (Primary):** Deep Indigo (#0F172A). Used for backgrounds to reduce eye strain during long-duration recovery operations.
- **Healthy (Secondary):** Electric Cyan (#22D3EE). Indicates optimal performance and "All Clear" states.
- **Warning (Tertiary):** Amber (#F59E0B). Used for degraded performance, latency spikes, or pending recovery actions.
- **Restoration (Specialized):** Recovery Violet (#8B5CF6). Specifically reserved for Disaster Recovery (DR) workflows, failovers, and restoration progress.
- **Data (Neutral):** Slate (#94A3B8). Used for non-critical telemetry and supporting text.

## Typography
The typographic hierarchy distinguishes between **Executive Status** (Hanken Grotesk) and **Technical Telemetry** (Geist Mono).

- **Hanken Grotesk:** Used for all interface chrome, section headers, and modal titles. It provides a modern, approachable feel to an otherwise rigid technical environment.
- **Geist Mono:** Used for all data-driven elements, including logs, health metrics, IP addresses, and recovery timestamps. It ensures that characters remain distinct and vertically aligned for quick scanning of numerical shifts.

## Layout & Spacing
This design system utilizes a **High-Density Fluid Grid** to maximize information per square inch. 

- **Desktop (1440px+):** 12-column grid with 16px gutters. Margins are fixed at 24px to push content to the edges.
- **Tablet (768px-1439px):** 8-column grid.
- **Mobile (Under 768px):** 4-column grid. Health cards reflow from multi-column grids to a single-column vertical stack.

Spacing follows a strict 4px base unit. Component internal padding is minimized (8px-12px) to support "at-a-glance" monitoring across large dashboards.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Technical Outlines** rather than traditional shadows.

- **Level 0 (Background):** Deep Indigo (#0F172A).
- **Level 1 (Cards/Panels):** Surface color shifted slightly lighter (#1E293B) with a 1px solid border (#334155).
- **Level 2 (Modals/Popovers):** Higher contrast background (#1E293B) with a subtle "Recovery Violet" outer glow (4px blur, 10% opacity) when restoration is active.
- **Interactive States:** Hovering over elements triggers a 1px inner border using the "Electric Cyan" primary accent to indicate focus.

## Shapes
The shape language is "Soft-Technical." Elements use a subtle **0.25rem (4px)** radius for standard components (cards, inputs, buttons) to maintain a precise, engineered appearance while avoiding the harshness of 0px corners.

- **Buttons/Inputs:** 4px radius.
- **Status Pills:** Fully rounded (pill) to distinguish them from interactive containers.
- **Dependency Nodes:** 4px radius with heavy 2px borders.

## Components
- **High-Density Health Cards:** Compact containers featuring a Geist Mono header for the service name, a sparkline for 24h uptime, and a large "Electric Cyan" or "Amber" status indicator.
- **Dependency Graphs:** Orthogonal connectors linking service nodes. Active paths glow in Cyan; broken dependencies pulse in Amber.
- **Recovery Progress Bars:** Segmented loaders using "Recovery Violet." Each segment represents a completed DR checkpoint (Check, Backup, Failover, Verify).
- **Audit-Ready Approval Dialogs:** High-contrast modals requiring dual-factor confirmation for destructive restoration actions. Action buttons are locked behind a 3-second hold to prevent accidental triggering.
- **Telemetry Chips:** Small, monospaced tags that display real-time latency (e.g., `42ms`) or region codes (e.g., `us-east-1`).
- **Audit Logs:** A vertically scrolling list using Geist Mono, with timestamp-first alignment and color-coded "Restoration" action markers.