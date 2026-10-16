---
name: UdehLabs Cyber-Enterprise
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#89ceff'
  on-tertiary: '#00344d'
  tertiary-container: '#006693'
  on-tertiary-container: '#b8e0ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
  surface-panel: rgba(30, 41, 59, 0.7)
  outline-muted: '#464555'
  error-accent: '#ffb4ab'
  ai-glow: rgba(139, 92, 246, 0.15)
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  status-tiny:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar: 260px
  header-height: 64px
---

## Brand & Style
UdehLabs is a high-performance developer platform that blends enterprise reliability with a "Cyber-Technical" aesthetic. The brand personality is precise, intelligent, and authoritative. 

The visual style is a sophisticated mix of **Modern Corporate** and **Glassmorphism**. It utilizes a deep-space color palette with translucent "glass" panels to create a sense of depth without traditional heavy shadows. Subtle "AI Glows" (violet/blue soft shadows) are used sparingly to highlight intelligent features, while the overall layout remains grounded in a rigid, technical grid. The interface should feel like a high-end terminal—utilitarian but refined through modern transparency and sharp typography.

## Colors
The palette is built on a "Deep Sea" foundation. The **Primary** (#4f46e5) is a vivid indigo used for brand identity and primary actions. **Secondary** (#8b5cf6) serves as the "AI" accent color, used for status indicators and copilot-related elements. **Tertiary** (#0ea5e9) is reserved for infrastructure and health indicators (Staging, healthy states).

The background is a solid `#031427`. Surfaces are constructed using container levels that vary by lightness, with the core "Glass Panel" utilizing a semi-transparent slate (`rgba(30, 41, 59, 0.7)`) for a layered, futuristic feel.

## Typography
The system uses a dual-font approach. **Inter** handles all UI and content roles, providing a clean, neutral, and highly readable foundation. **JetBrains Mono** is employed for technical data, version numbers, and logs to emphasize the developer-centric nature of the platform.

Headlines use semi-bold weights with slight negative letter-spacing to appear compact and modern. Captions and metadata labels use "Label Caps" (all-caps Inter with increased tracking) to create clear sections. For mobile devices, `display` fonts should scale down to `headline-lg` proportions to maintain readability.

## Layout & Spacing
The layout uses a **fixed sidebar + fluid content area** model. The sidebar is fixed at 260px. The main workspace utilizes a standard 12-column grid for dashboard widgets.

A strict 4px/8px baseline grid is used for all internal component spacing. Section headers are separated by `lg` (24px) spacing, while individual list items and related cards use `md` (16px). On mobile screens, the sidebar collapses into a bottom navigation bar or a hidden drawer, and horizontal padding reduces from 24px to 16px.

## Elevation & Depth
Depth is expressed through **Glassmorphism** and **Tonal Layering** rather than traditional shadows. 
- **Base Level:** Solid `#031427` background.
- **Mid Level:** Semi-transparent `glass-panel` surfaces with a 12px backdrop blur and 1px white/5% border to catch the light.
- **High Level:** Hover states and active items use `surface-container-highest` or subtle glows (`ai-glow`) to appear closer to the user.
- **Contrast Outlines:** Low-opacity borders (`#464555`) define boundaries on dark surfaces without adding visual bulk.

## Shapes
The shape language is "Soft-Technical." Elements use small, precise radii to maintain a structured feel. 
- **Default (4px):** Standard buttons, list items, and checkboxes.
- **Large (8px):** Cards and primary project panels.
- **Extra Large (12px):** Glass panels and complex dashboard widgets.
- **Full:** Search bars and user avatars for organic differentiation.

## Components
- **Buttons:** Primary buttons are solid `primary-container` with bold white text. Secondary buttons use a `surface-container-high` background with a 1px border. All buttons should have a 150ms "active:scale-95" interaction.
- **Chips/Badges:** Use low-opacity container fills (e.g., `error-container/30`) with high-contrast text for status. AI-specific chips should feature the `ai-glow` box shadow.
- **Cards:** Defined by the `glass-panel` style. They must include a subtle top border highlight (1px white at 5% opacity) to simulate edge lighting.
- **Checkboxes:** Custom squares with 2px borders. On selection, they transition to a solid primary color with a check icon.
- **Input Fields:** Search bars should be pill-shaped with background `surface-container-high` and no border, using subtle `focus:ring-1` for accessibility.
- **Task Items:** Interactive rows that use a line-through and 50% opacity state when "checked."