---
name: Kinetic Infrastructure
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
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
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
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
typography:
  display:
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
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
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
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for UdehLabs as a high-density, production-grade interface that emphasizes infrastructure sovereignty. The aesthetic is **Technical Modernism**—a blend of high-contrast utility and industrial engineering.

The UI must evoke the feeling of a mission control center: unwavering reliability, real-time visibility, and extreme performance. Visuals leverage a dark-mode foundation with surgical precision, utilizing subtle grid overlays and light-emissive accents to denote active processes and system health. The interface prioritizes data density without sacrificing clarity, using structured hierarchy to manage complex deployment environments.

## Colors
The palette is built on a deep "Navy Stealth" foundation to reduce eye strain during long production shifts.

*   **Primary (Violet):** Used for primary actions, system-critical highlights, and "sovereign" brand elements.
*   **Secondary (Cyan):** Reserved for data visualization, active telemetry, and "live" deployment status.
*   **Tertiary (Emerald):** Denotes healthy states, successful deployments, and stable nodes.
*   **Surface & Neutral:** The `#0c141e` Navy acts as the primary container color. A darker `#05080b` is used for the base background to create depth.
*   **Accents:** Use low-opacity glows (15-20%) of the primary and secondary colors to indicate focus or active states.

## Typography
This design system utilizes **Hanken Grotesk** for its clean, geometric legibility across all functional tiers. To reinforce the technical nature of UdehLabs, **JetBrains Mono** is introduced as a secondary functional font for labels, IDs, and code snippets.

All headlines should use tighter letter-spacing to maintain a "dense" professional feel. Body text defaults to a slightly increased line-height to ensure readability in data-heavy tables and logs. Labels are always uppercase when using the Mono variant to distinguish them as technical metadata.

## Layout & Spacing
The layout follows a **Rigid Grid** philosophy based on a 4px baseline. Components are packed with high density to ensure maximum information is visible on a single screen.

*   **Grid:** A 12-column fluid grid for main dashboards; 8-column for side-panels.
*   **Density:** Use "Compact" spacing for data tables and logs (8px vertical padding).
*   **Margins:** 24px outer margins for desktop; 16px for mobile.
*   **Breakpoints:** 
    *   Mobile: < 768px (Single column, hidden sidebars).
    *   Tablet: 768px - 1280px (Collapsible navigation).
    *   Desktop: > 1280px (Permanent monitoring rails).

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Luminescent Outlines** rather than traditional shadows. 

1.  **Base:** The deepest layer (#05080b).
2.  **Surface:** Primary containers (#0c141e) with a 1px border (#1e293b).
3.  **Overlay:** Modals and tooltips use the same surface color but add a subtle 10% Primary color glow (blur: 20px) behind them to simulate a "floating screen" effect.
4.  **Active State:** Components in an active or "running" state receive a Secondary (Cyan) inner-border glow to indicate live telemetry.

## Shapes
The shape language is **Industrial & Structured**. A "Soft" rounding (4px/0.25rem) is applied to maintain a modern feel without leaning into consumer-centric "playfulness." 

Buttons and input fields use a consistent 4px radius. Status indicators (dots) and specific toggle switches are the only elements allowed to be fully circular (pill-shaped) to clearly distinguish them as interactive binary states.

## Components
*   **Buttons:** Primary buttons are solid Violet (#7c3aed) with white text. Secondary buttons are outlined with Cyan (#00f2ff) text and 10% Cyan fill on hover.
*   **Data Logs:** Use a dark-mono theme. Background: #05080b; Text: #94a3b8 (Slate). Error lines highlight the entire row in a low-opacity red tint.
*   **Status Chips:** Small, rectangular with a 1px border. Use "Cyan" for Running, "Emerald" for Healthy, "Amber" for Warning, and "Red" for Critical. Include a 4px pulsing dot icon.
*   **Input Fields:** Ghost-style inputs. Transparent background, 1px Slate border. On focus, the border turns Primary (Violet) with a 2px outer glow.
*   **Cards:** Rigid 1px borders. Use a subtle linear-gradient (Top-Left to Bottom-Right) from #0c141e to #111b27. Headers should be separated by a 1px horizontal rule.
*   **Infrastructure Nodes:** Visual representations of servers/clusters should use hexagonal icons or heavy-stroke square icons to reinforce the "Engineering" aesthetic.