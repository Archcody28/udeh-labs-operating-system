---
name: Cyber-Fleet Data Governance
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
  on-surface-variant: '#c6c5d3'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#8f909d'
  outline-variant: '#454651'
  surface-tint: '#bac3ff'
  primary: '#bac3ff'
  on-primary: '#15267b'
  primary-container: '#5c6bc0'
  on-primary-container: '#f8f6ff'
  inverse-primary: '#4858ab'
  secondary: '#d4bbff'
  on-secondary: '#3f0f81'
  secondary-container: '#572e99'
  on-secondary-container: '#c6a5ff'
  tertiary: '#f6bd58'
  on-tertiary: '#432c00'
  tertiary-container: '#976900'
  on-tertiary-container: '#fff6ee'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#bac3ff'
  on-primary-fixed: '#00105b'
  on-primary-fixed-variant: '#2f3f92'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d4bbff'
  on-secondary-fixed: '#260058'
  on-secondary-fixed-variant: '#572e99'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#f6bd58'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
  classification-public: '#4caf50'
  classification-internal: '#ffc107'
  classification-confidential: '#ff9800'
  classification-restricted: '#f44336'
  classification-highly-restricted: '#b71c1c'
  lifecycle-active: '#00bcd4'
  lifecycle-archived: '#607d8b'
  lifecycle-retention: '#9c27b0'
  lifecycle-legal-hold: '#e91e63'
  lifecycle-deleted: '#424242'
  access-development: '#03a9f4'
  access-support: '#8bc34a'
  access-security: '#ff5722'
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
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px
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
  base: 4px
  compact: 8px
  comfortable: 16px
  loose: 24px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is a specialized extension of the Cyber-Fleet ecosystem, pivoting from operational command to **Structured Data Authority**. It adopts a **Corporate / Modern** style infused with **High-Contrast Digitalism**, creating an environment that feels clinical, secure, and impenetrable. 

The personality is defined by four pillars:
1.  **Authoritative:** The UI acts as the final word on data compliance.
2.  **Secure:** Visual density and dark surfaces suggest a "hardened" interface.
3.  **Transparent:** Every byte of data has a visible lineage and classification.
4.  **Structured:** A rigid adherence to grids and categorization ensures complex governance remains navigable.

The aesthetic utilizes a "Command Center" approach where data is not just displayed but managed through high-contrast semantic signaling and a dual-font strategy that separates human narrative from system metadata.

## Colors

This design system utilizes a **Deep Obsidian** foundation to minimize visual noise and emphasize semantic status. 

- **Primary Accents:** Indigo (#5c6bc0) and Electric Violet (#7e57c2) are used for navigation, primary actions, and brand identification.
- **Classification System:** A high-visibility "stoplight" progression—from Emerald (Public) to Deep Red (Highly Restricted)—is mandatory for all data containers.
- **Lifecycle States:** Uses a distinct cool-toned palette (Cyan, Slate, Violet) to differentiate the temporal state of data from its security classification.
- **Access Purpose:** Specific hues are reserved for access-control contexts (Development, Support, Security) to provide immediate environmental awareness for users.
- **Surface Strategy:** Backgrounds utilize `#0c141e`. Surfaces for interactive components use a slightly lifted `#18202b` to provide contrast without relying on traditional shadows.

## Typography

The typography system is split between **Hanken Grotesk** for interface chrome and **JetBrains Mono** for technical data.

- **Hanken Grotesk:** Chosen for its contemporary, geometric clarity. It should be used for all instructional text, headers, and UI controls.
- **JetBrains Mono:** Reserved exclusively for machine-readable or system-generated content. This includes UUIDs, timestamps, raw logs, and all Status/Classification labels.
- **Formatting:** Labels and classification tags must always be rendered in `label-caps` (All-caps, heavy weight, increased letter spacing) to ensure they are perceived as metadata rather than prose.
- **Data Densitiy:** For data-heavy tables, use `data-mono` for numeric values and system IDs to maintain vertical alignment and professional rigor.

## Layout & Spacing

The design system employs a **Fluid Grid** model based on a 4px baseline rhythm.

- **Grid System:** A 12-column grid is used for desktop views. Governance dashboards should prioritize a "Master-Detail" layout where the master list (e.g., data assets) occupies 4 columns and the detail/compliance view occupies 8 columns.
- **Density:** High-density layouts are preferred. Use `compact` (8px) spacing for sidebar navigation and table rows to maximize information density. Use `comfortable` (16px) for card padding and general section spacing.
- **Responsive Behavior:** 
  - **Desktop (1440px+):** 12 columns, 32px margins.
  - **Tablet (768px - 1439px):** 8 columns, 24px margins.
  - **Mobile (Below 768px):** 4 columns, 16px margins. Complex data tables should reflow into expandable card stacks.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than physical shadows. This preserves a flat, technical aesthetic.

- **Level 0 (Background):** `#0c141e` (Deep Obsidian).
- **Level 1 (Containers):** `#141c27`. Used for primary content areas and sidebars.
- **Level 2 (Cards/Modals):** `#18202b`. Elevated elements must use a 1px border (`#44474c`) to define their boundaries.
- **Interaction:** Hover states are indicated by increasing the border brightness or adding a subtle Indigo glow, never by adding shadow depth.
- **Glassmorphism:** Reserved exclusively for global overlays (like command palettes) using a 12px backdrop blur and 40% opacity on the surface color.

## Shapes

The shape language is **Soft (Level 1)**, prioritizing a surgical, precise appearance over playfulness.

- **Standard Radius:** 0.25rem (4px) for buttons, input fields, and tags.
- **Large Radius:** 0.5rem (8px) for cards and main content containers.
- **Contextual Sharpness:** In data-heavy "Terminal" views, components may revert to 0px (Sharp) to emphasize the raw nature of the information.
- **Accents:** Classification indicators should use a 4px vertical bar on the left edge of cards or table rows, utilizing the semantic color palette.

## Components

### Buttons & Actions
- **Primary:** Solid Indigo background with white text.
- **Secondary:** Transparent background with an Indigo 1px border.
- **Semantic:** For critical governance actions (e.g., Purge), use the `classification-restricted` color.

### Classification Chips
- **Style:** Small, `label-caps` typography, 4px roundedness.
- **Visuals:** High-contrast background using the classification color with high-contrast text. For "Highly Restricted," use a subtle pulse animation on the border.

### Data Lifecycle Lists
- **Structure:** Use 1px `outline-variant` borders between items.
- **State Indicators:** A 12px circle using the Lifecycle State colors (Cyan for Active, etc.) should precede the record ID.

### Input Fields
- **Design:** Deep Obsidian background with a 1px `outline` border.
- **Focus:** Border transitions to Electric Violet with a 2px outer glow (no blur).

### Governance Cards
- **Header:** Must include the classification chip in the top right.
- **Body:** Uses `body-md` for descriptions and `data-mono` for metadata like "Last Audited" or "Retention Date."

### Compliance Progress Bars
- **Style:** Segmented bars rather than smooth gradients to represent discrete stages of the data lifecycle. Use Slate for background and the appropriate Lifecycle color for the progress fill.