---
name: Cyber-Enterprise Operational Interface
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#007650'
  on-tertiary-container: '#76ffc2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
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
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-mono:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 12px
    letterSpacing: 0.08em
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
  stack-sm: 8px
  stack-md: 16px
  table-row-height: 40px
---

## Brand & Style
The design system is engineered for high-stakes infrastructure management. It prioritizes technical density, speed of recognition, and systemic reliability. The aesthetic blends **Modern Corporate** structure with **Cyber-Tech** accents, utilizing deep ocean tones and high-energy neon highlights to signify system vitality.

The visual language communicates authority and precision through:
- **High-Information Density:** Maximizing screen real estate for logs, metrics, and complex deployment pipelines.
- **Systemic Order:** Strict adherence to grid alignments and hierarchical layering to prevent cognitive overload.
- **Energetic State Indicators:** Using luminous accents against dark backgrounds to draw immediate attention to critical status changes.

## Colors
The palette is built on a "Deep Night" foundation to reduce eye strain during long-form monitoring sessions.

- **Primary (Electric Violet):** Reserved for high-level actions, the Production environment, and successful integrity checks.
- **Secondary (Indigo):** Used for primary navigation, the Staging environment, and active deployment processes.
- **Functional Accents:** Status colors are strictly enforced. `Active` uses a vibrant emerald, while `Failed` utilizes a high-contrast crimson to ensure instant visibility in high-density views.
- **Neutral Scale:** Utilizes dark navy slate tones to differentiate between surface levels and container backgrounds.

## Typography
This design system employs a dual-font strategy. **Hanken Grotesk** provides a sharp, modern geometric feel for headers and navigation, while **Inter** ensures maximum legibility for data-heavy tables and terminal logs.

- **Data Density:** Use `body-sm` for most table content to increase the amount of visible data points.
- **Micro-Labels:** Use `label-caps` for environment tags (DEV, STG, PROD) and artifact hash IDs to create clear visual anchors.
- **Monospace intent:** While Inter is used for body text, key hashes and deployment logs should utilize a tighter tracking to mimic a technical environment.

## Layout & Spacing
A **Fluid Grid** model is used with a 4px base unit to accommodate complex dashboard layouts.

- **Dashboard Layout:** 12-column grid on desktop. Sidebars are fixed at 240px, while the main content area expands to show multi-environment timelines.
- **Density Controls:** In "Operational View," padding is reduced by 50% to allow for more simultaneous data streams.
- **Breakpoints:**
  - Desktop: 1280px+ (12 columns)
  - Tablet: 768px - 1279px (8 columns)
  - Mobile: Under 767px (4 columns, sidebar collapses to bottom nav).

## Elevation & Depth
Depth is created through **Tonal Layering** rather than traditional shadows, maintaining a crisp, technical feel.

- **Level 0 (Background):** `#020617` (Deepest Navy) - The main canvas.
- **Level 1 (Card/Container):** `#0F172A` - Used for grouping logic (e.g., Environment clusters).
- **Level 2 (Active/Hover):** `#1E293B` - Used for interactive elements or focused logs.
- **Accents:** Use 1px inner borders with low opacity (`rgba(255,255,255,0.1)`) to define element edges without using shadows. Glassmorphism is reserved strictly for global overlays (modals or approval gates) to maintain high contrast behind them.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a balance between the precision of a technical tool and the modern friendliness of a SaaS product.

- **Status Badges:** Use `rounded-lg` (0.5rem) to differentiate them from square-ish buttons.
- **Input Fields:** Maintain sharp `rounded-sm` corners to reinforce the feeling of a precise instrument.
- **Progress Bars:** Use fully rounded ends (pill-shaped) for deployment timelines to indicate movement and flow.

## Components
Consistent implementation for the Deployment Center core components:

- **Deployment Timeline:** A horizontal track using secondary color gradients. Nodes signify "Approval Gates." Pulsing glow animations indicate an active "Deploying" state.
- **Environment Cards:** Large headers with the environment name (DEV/STG/PROD) using the designated environment color as a top-border accent. Must include health metrics (CPU/RAM) and current artifact version.
- **Status Chips:** Small, high-contrast badges. `FAILED` states should include an icon prefix (e.g., Warning Triangle) for accessibility.
- **Approval Gates:** High-visibility modals with two-factor authentication patterns. The "Approve" button uses the Primary Electric Violet, while "Reject" uses a ghost-button style with a red outline.
- **Artifact Integrity Indicators:** Small "Shield" icons next to build numbers. Green for "Verified," Amber for "Unsigned," and Red for "Checksum Mismatch."
- **Terminal View:** A dark, nested container using `#000000` background and `code-mono` typography for real-time log streaming.