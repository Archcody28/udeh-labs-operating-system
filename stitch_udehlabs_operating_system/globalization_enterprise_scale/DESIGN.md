---
name: Globalization & Enterprise Scale
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
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#c3c0ff'
  on-tertiary: '#1f00a4'
  tertiary-container: '#6a63f2'
  on-tertiary-container: '#020026'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c3c0ff'
  on-tertiary-fixed: '#100069'
  on-tertiary-fixed-variant: '#372abf'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
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
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style
The design system focuses on "Intelligence-First Globalization." It bridges the gap between high-performance technical tools and enterprise-grade reliability. The aesthetic is rooted in **Corporate Modernism** with a heavy emphasis on **Minimalism** to manage the density of multi-region data.

The UI must evoke a sense of "quiet power"—stable, predictive, and globally aware. The interface prioritizes clarity and information density, using subtle kinetic feedback to signal system intelligence. It is designed to feel expansive yet controlled, supporting the transition from a single-product tool to a multi-national enterprise platform.

## Colors
The palette utilizes a deep **Navy (#0f172a)** foundation to anchor the enterprise experience. **Indigo (#6366f1)** serves as the primary action color, providing a high-visibility focal point against the dark background. 

**Cyan (#0ea5e9)** is reserved for "Intelligence Signals"—AI suggestions, data-sync status, and active localization shifts. **Navy-Deep (#4338ca)** provides tonal layering for container backgrounds. For status signals, use a semantic overlay: 
- **Success:** Emerald 500
- **Warning:** Amber 500
- **Error:** Rose 500
- **Regional/Global:** Cyan 500

## Typography
This design system employs **Hanken Grotesk** across all roles to ensure a sharp, contemporary, and technical feel. To account for localization expansion (e.g., German or French translations), all containers must support a **20% text expansion buffer**.

Use `label-sm` in uppercase for technical metadata and currency codes (e.g., USD, EUR). For multi-region status signals, typography should be paired with consistent iconography to ensure legibility across language barriers.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure for desktop and a 4-column structure for mobile. To accommodate enterprise data density, the spacing rhythm is based on a **4px baseline grid**.

- **Localization Safe Zones:** Always use `lg` (24px) padding in horizontal containers to allow for varying word lengths in different languages.
- **Data Tables:** Use compact `sm` (8px) vertical padding for list items to maximize information density on enterprise dashboards.
- **Breakpoints:** Mobile (<600px), Tablet (600px-1024px), Desktop (>1024px).

## Elevation & Depth
Depth is conveyed through **Tonal Layering** rather than traditional shadows to maintain a sleek, modern aesthetic.

1. **Base:** The primary background (`#0f172a`).
2. **Surface:** Container backgrounds using a subtle tint of the primary color (`#1e293b`).
3. **Overlay:** Tooltips and modals use a slightly lighter elevation with a 1px border of `Primary/20` to define edges.
4. **Active State:** Elements currently in focus utilize a Cyan inner-glow (0px 0px 8px) to represent "Intelligence Connectivity."

## Shapes
In alignment with the "Round Four" requirement, the system uses a **0.5rem (8px)** base radius. This provides a balance between the precision of a technical tool and the approachability of a modern SaaS product.

- **Standard Buttons/Inputs:** 0.5rem (8px)
- **Large Cards:** 1rem (16px)
- **Status Pills/Tags:** 1.5rem (24px)

## Components
- **Buttons:** Primary buttons use a solid Indigo fill. Secondary buttons use a Navy-Deep background with a subtle Cyan border.
- **Localization Indicators:** Small, rounded-xl chips displaying the ISO country code (e.g., "EN-US") paired with a 4px "Live" dot indicating region status.
- **Currency Inputs:** Grouped fields where the currency symbol is displayed in a fixed-width `label-sm` prefix container, ensuring the numeric alignment remains consistent across different symbols.
- **Status Signals:** Use a vertical bar on the left edge of cards or list items. Green for operational, Amber for latency in region, Red for outage.
- **Multi-Region Chips:** Compact chips with `label-sm` text used to filter global views. When inactive, they have a transparent background with a 1px Navy-Deep border.