---
name: Cyber-Fleet Trust & Compliance
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
  on-surface-variant: '#c4c5d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8e90a0'
  outline-variant: '#434655'
  surface-tint: '#b7c4ff'
  primary: '#b7c4ff'
  on-primary: '#002682'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#2151da'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#4648d4'
  on-tertiary-container: '#d1d1ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  status-healthy: '#10b981'
  status-warning: '#f59e0b'
  status-critical: '#e11d48'
  status-planned: '#94a3b8'
  surface-evidence: '#020617'
  border-security: '#1e293b'
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
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  evidence-hash:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  boundary-gap: 48px
---

## Brand & Style

The design system embodies an **Institutional, Verifiable, and Sovereign** personality. It is built for environments where compliance is not just a checkbox but a continuous, provable state of security. It evolves the high-density "Cyber-Enterprise" aesthetic into a more structured, authoritative framework suitable for audit and regulatory oversight.

The chosen style is **Modern Corporate with a Tactical Layer**. It utilizes high-density information layouts, deep indigo foundations, and sharp semantic signals. The visual narrative shifts from "Monitoring" to "Attestation," where every UI element feels like a permanent record of truth. This is achieved through a rigid adherence to grids, high-contrast status indicators, and a meticulous separation between human-readable narratives and machine-verifiable evidence.

## Colors

The palette is anchored by **Indigo-700** (`#1d4ed8`) as the primary brand driver, representing institutional stability. The background uses a deep **Slate-950** (`#020617`) to create a "Sovereign" space where data clarity is the priority.

**Semantic Trust Layer:**
- **Emerald-500 (Implemented/Healthy):** Used for controls that are fully verified and active.
- **Amber-500 (Under Review/Warning):** Used for items in transition or needing administrative attention.
- **Rose-600 (Critical Gap/Risk):** Reserved for non-compliance, failed audits, or active security threats.
- **Slate-400 (Planned/N/A):** Used for future-dated compliance goals or out-of-scope controls.

Surface colors utilize tonal layering to differentiate between "Standard UI" and "Evidence Vaults." Evidence hashes and technical logs always sit on the darkest `surface-evidence` to signify their immutable nature.

## Typography

This system employs a functional split between **Hanken Grotesk** and **JetBrains Mono**.

**Hanken Grotesk** handles the institutional narrative. It is used for all organizational headers, policy descriptions, and management interfaces. Its clean, sharp geometry provides a professional and modern feeling.

**JetBrains Mono** (Data-Mono) is reserved for the "Verifiable" layer. All Control IDs, evidence hashes, blockchain-backed metadata, and security findings must use this font. This creates a psychological distinction: Hanken is what the system *claims*, while the Monospaced font is what the system *proves*. Labels should frequently use All-Caps with expanded letter spacing to mimic official government or security classification markings.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid Grid**. Core dashboards conform to a 12-column grid to maintain institutional order, while evidence-heavy views use a fluid layout to accommodate long hashes and data strings.

**Security Boundaries:**
Large spatial gaps (`boundary-gap`) are used to visually separate different compliance tenants or security levels. This "visual fencing" reinforces the concept of L5 Tenant Isolation.

**Grid Adjustments:**
- **Desktop (1440px+):** 12 columns, 32px margins, 16px gutters.
- **Tablet (768px - 1439px):** 8 columns, 24px margins, 16px gutters.
- **Mobile (Up to 767px):** 4 columns, 16px margins, 12px gutters. Navigation moves to a persistent bottom-bar or a compact header menu.

## Elevation & Depth

Visual hierarchy is conveyed through **Tonal Layering and Low-Contrast Outlines** rather than soft shadows. This maintains a "Tactical" and flat aesthetic consistent with technical dashboards.

- **Level 0 (Background):** Base slate-950.
- **Level 1 (Card/Surface):** Slate-900 with a 1px border of `border-security`. 
- **Level 2 (Step-Up/Modal):** Indigo-950 background with a brighter indigo-700 border to signify elevated approval states or MFA prompts.
- **Evidence Surfaces:** Recessed (inset) surfaces using the darkest black to represent a "Vaulted" environment for sensitive audit data.

Shadows, if used at all, are highly compressed and dark, serving only to separate high-priority modals from the background, never for decorative "softness."

## Shapes

The shape language is precise and geometric. A **8px (0.5rem) roundedness** is the system standard, providing a "Professional" feel that isn't as aggressive as sharp corners nor as casual as pills.

- **Standard Elements:** 8px radius (Buttons, Input Fields, Cards).
- **Security Labels:** 4px (rounded-sm) for small data classification tags (e.g., "RESTRICTED").
- **Identity Avatars:** Always square with 8px rounding to distinguish them from consumer-grade circular avatars.
- **Status Indicators:** Small 8px squares (or circles only if representing "live" status) to indicate health.

## Components

**Buttons & Actions:**
Primary buttons use the Indigo-700 base. Success actions (e.g., "Approve Audit") use Emerald-500. Critical actions (e.g., "Revoke Access") use Rose-600 with a high-contrast label.

**Compliance Chips:**
Pill-shaped status indicators for "Healthy," "Risk," etc. These must include a 12px icon from the security set (Shield, Warning, etc.) to ensure accessibility and immediate recognition.

**Evidence Cards:**
Specialized card type with a `evidence-hash` header in JetBrains Mono. They feature a left-hand accent border color-coded to the compliance state (Emerald, Amber, or Rose).

**Input Fields:**
High-density inputs with internal labels. Focused states use a 2px Cyan-500 border to maintain the "Cyber" energy of the parent aesthetic.

**Audit Timeline:**
A vertical list component using a 2px Indigo-800 line connecting state-change nodes. Each node is a 12px square colored by the semantic trust layer.