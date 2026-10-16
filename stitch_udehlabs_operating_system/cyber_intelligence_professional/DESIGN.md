---
name: Cyber-Intelligence Professional
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
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#b9c8de'
  on-secondary: '#233143'
  secondary-container: '#3c4a5c'
  on-secondary-container: '#abb9cf'
  tertiary: '#c3c0ff'
  on-tertiary: '#1d00a5'
  tertiary-container: '#554cf1'
  on-tertiary-container: '#e6e3ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#d5e4fa'
  secondary-fixed-dim: '#b9c8de'
  on-secondary-fixed: '#0e1c2d'
  on-secondary-fixed-variant: '#3a485a'
  tertiary-fixed: '#e2dfff'
  tertiary-fixed-dim: '#c3c0ff'
  on-tertiary-fixed: '#0f0069'
  on-tertiary-fixed-variant: '#321ed2'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
  surface-deep: '#051424'
  surface-elevated: '#0f172a'
  electric-violet: '#7c3aed'
  status-success: '#10b981'
  status-pending: '#f59e0b'
  text-primary: '#f8fafc'
  text-secondary: '#94a3b8'
typography:
  headline-xl:
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
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
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
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for high-stakes commercial environments where data integrity and professional trust are paramount. The aesthetic is a fusion of **Corporate Modern** and **Cyber-Intelligence**, utilizing a deep-space palette to reduce cognitive load while highlighting critical action paths with high-energy accents.

The visual narrative focuses on "Precision over Decoration." It targets enterprise clients and decision-makers who require clarity in complex contract cycles. The interface should feel authoritative, secure, and technologically advanced, drawing inspiration from high-end fintech and security monitoring platforms.

## Colors

The palette is anchored by **Surface Deep (#051424)**, creating a sophisticated dark environment that minimizes glare during long-form proposal reviews. 

- **Primary Action:** Electric Violet (#7c3aed) is reserved for primary calls to action and active states, providing a high-contrast focal point against the navy background.
- **Supportive Accents:** A secondary indigo (#635BFF) is used for data visualization and secondary interactive elements.
- **Hierarchy:** Slate greys define the content structure, with #f8fafc for headers to ensure maximum legibility and #94a3b8 for metadata and captions.
- **Status Indicators:** Vibrant, high-saturation greens and ambers provide immediate visual feedback for pipeline stages (e.g., "Signed," "Under Review").

## Typography

**Hanken Grotesk** is the sole typeface, chosen for its exceptional clarity and modern, geometric construction. 

- **Weight Strategy:** Use Bold (700) for primary headers to establish authority. SemiBold (600) is utilized for interactive elements and sub-headers to maintain a sharp, technical feel.
- **Editorial Layout:** For proposals and long-form contracts, `body-lg` is preferred for readability. 
- **Micro-copy:** Labels and status tags utilize `label-md` with slight letter-spacing to mimic the look of technical readouts and dashboards.

## Layout & Spacing

The design system utilizes a **12-column fixed grid** for desktop to ensure proposals and dashboards maintain a consistent, structured appearance. 

- **Rhythm:** An 8px base unit governs all dimensions.
- **Density:** Elements in the sales pipeline dashboard should use tighter vertical spacing (12px - 16px) to maximize data density, while proposal documents should use generous padding (48px+) to evoke a premium, "white-glove" feel.
- **Breakpoints:** Mobile transitions occur at 768px, shifting to a single-column layout with increased touch targets (minimum 44px height).

## Elevation & Depth

Depth is established through **Tonal Layering** rather than traditional shadows, reinforcing the sleek, technical aesthetic.

- **Level 0 (Base):** Deep Navy (#051424) for the main application background.
- **Level 1 (Cards/Surface):** Slate Navy (#0f172a) with a subtle 1px border in #1e293b.
- **Level 2 (Modals/Popovers):** Slate Navy with a soft, indigo-tinted ambient shadow (0px 8px 24px rgba(0, 0, 0, 0.5)) to create separation.
- **Interactive States:** Use "Electric Violet" inner glows or subtle outer glows for active input fields or primary buttons to simulate a "lit" digital interface.

## Shapes

The shape language is **Soft (0.25rem)**. This slight rounding provides a sophisticated edge that feels precise without being overly aggressive. 

- **Inputs & Buttons:** Use a consistent 4px radius. 
- **Status Chips:** May use a full pill-shape (rounded-full) to distinguish them from interactive buttons.
- **Data Containers:** Large containers and cards follow the standard 8px (rounded-lg) radius to ground the layout.

## Components

- **Primary Buttons:** Solid Electric Violet with white text. High-contrast, no gradients, 4px border radius. 
- **E-Signature Interface:** A crisp, white background for the actual signature pad to mimic physical paper, housed within a Slate Navy container. Clear "Clear" and "Adopt" actions in the footer.
- **Pipeline Status Indicators:** Circular dots with accompanying `label-sm` text. Use high-chroma colors (Emerald for "Closed," Amber for "Negotiating," Violet for "New").
- **Input Fields:** Dark background (#0f172a) with a subtle Slate border. On focus, the border transitions to Electric Violet with a 1px solid stroke.
- **Contract Cards:** Use a structured header with the client name in `headline-md` and a metadata row below using `label-sm` for date, value, and owner.
- **Proposals:** Use large horizontal dividers (1px, Slate) to separate sections, ensuring the Hanken Grotesk typography remains the centerpiece of the experience.