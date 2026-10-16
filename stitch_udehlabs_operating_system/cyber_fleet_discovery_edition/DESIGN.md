---
name: 'Cyber-Fleet: Discovery Edition'
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
  secondary: '#c3c0ff'
  on-secondary: '#1d00a5'
  secondary-container: '#3626ce'
  on-secondary-container: '#b3b1ff'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#7645e0'
  on-tertiary-container: '#ece1ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
  intelligence-indigo: '#4f46e5'
  clarification-violet: '#8b5cf6'
  confidence-high: '#10b981'
  confidence-medium: '#f59e0b'
  confidence-low: '#ef4444'
  ai-shimmer: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)'
typography:
  display-xl:
    fontFamily: Hanken Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.03em
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
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-caps-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
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
  margin-discovery: 40px
  density-engineer: 8px
  density-client: 24px
---

## Brand & Style

This design system extends the core technical authority of its predecessor into the realm of **High-Stakes Strategic Discovery**. It transitions from pure execution to a "Predictive Intelligence" aesthetic, blending **Minimalism** with **Glassmorphism**. The personality is that of a senior advisor—calm, data-backed, and highly organized.

The narrative shifts from "Monitoring" to "Uncovering." It uses a refined **Cyber-Enterprise** approach where heavy data density for engineers is balanced by elegant, multi-step orchestration for clients. The emotional goal is to provide a sense of "Computational Certainty" through the use of sophisticated gradients, progress visualization, and clear AI-assistance signifiers.

## Colors

The palette expands the "Execution Violet" into a functional gradient of intelligence. 

- **Intelligence Indigo & Clarification Violet:** These serve as the primary drivers for the discovery intake process. Use Indigo for structural navigation and Violet for interactive "Deep-Dive" actions.
- **Confidence Scoring:** A dedicated semantic tier for AI outputs. High confidence is represented by a tempered emerald, medium by a muted amber, and low by a sharp crimson.
- **AI Assistance Indicators:** Features a unique "Shimmer" gradient. This is reserved exclusively for elements where AI is actively suggesting, refining, or scoring data.
- **Neutrality:** Maintains the "Space Obsidian" base to ensure seamless integration with the existing command infrastructure.

## Typography

The dual-font strategy is maintained but scaled for discovery. **Hanken Grotesk** handles the narrative and conversational aspects of the intake wizards, while **JetBrains Mono** remains the source of truth for technical scores and system metadata.

For "Confidence Scoring" and "AI Certainty," use `data-mono-lg` to give the numbers a physical, measured feel. Display styles use tighter letter-spacing to appear authoritative in the large whitespace of client-facing discovery steps.

## Layout & Spacing

This design system utilizes a **Dual-Density Grid Model** to cater to two distinct user profiles:

- **Engineering Review (High-Density):** Uses an 8px spacing rhythm with tight gutters. Content is packed into Bento-style cards to allow for maximum data visibility without scrolling.
- **Client Discovery (Low-Density):** Uses a 24px spacing rhythm. Multi-step wizards are centered with generous `margin-discovery` (40px+) to focus attention on a single decision at a time.

**Breakpoints:**
- **Desktop (1280px+):** 12-column grid. Sidebars are fixed for engineers, hidden for clients.
- **Tablet (768px - 1279px):** 8-column grid. Discovery steps become full-width cards.
- **Mobile (<767px):** 4-column grid. Data tables convert to stacked "Insight Cards" with expanded touch targets.

## Elevation & Depth

In the discovery context, depth is used to indicate "Focus" and "Intelligence Layers."

- **Discovery Glassmorphism:** Intake modals and AI suggestion panels use a backdrop blur (20px) with a 5% opacity `clarification-violet` tint. This suggests a "layer of thought" above the primary data.
- **Confidence Stacking:** Elements with higher confidence scores are elevated visually using a soft, tinted ambient shadow (0px 8px 24px) using the `intelligence-indigo` hex at 15% opacity.
- **Engineering Flatness:** Review screens remain strictly tonal, using `surface-container-high` to distinguish between different data modules without the use of shadows.

## Shapes

The "Precision-Soft" language is evolved to be slightly more approachable for discovery. 

- **Interactive Elements:** Buttons and input fields use `rounded-lg` (1rem) to feel more inviting during the discovery process.
- **Progress Tracking:** Linear progress bars use a `full` (pill) radius to soften the technical edge of the interface.
- **AI Indicators:** Circular avatars and "Spark" icons always use the `full` radius, creating a visual distinction from the rectangular, "human-input" data fields.

## Components

- **Discovery Wizards:** Feature a "Step Indicator" at the top using `intelligence-indigo`. Active steps use a pulsing outer ring; completed steps use a solid checkmark.
- **Confidence Score Gauges:** Semi-circular or linear gauges using the semantic color tier (High/Med/Low). Use a subtle "glow" effect when the score is generated by AI.
- **AI Suggestion Cards:** Styled with a 1px `ai-shimmer` border and a faint violet backdrop blur. Include a "Accept Insight" button that uses the `clarification-violet` fill.
- **Engineering Data Tables:** High-density rows (32px height) with `data-mono` type. Hover states must highlight the entire row in `surface-container-highest` for precision tracking.
- **Progress Visualization:** Use a multi-segment bar where segments are color-coded by the "Completeness" or "Certainty" of that discovery phase.
- **Input Fields (Discovery):** Larger than standard (48px height) with `body-lg` text to facilitate comfortable client intake.