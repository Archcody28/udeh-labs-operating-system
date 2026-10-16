---
name: Phase P.09 Intelligence
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
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#ffb2b7'
  on-secondary: '#67001b'
  secondary-container: '#b50036'
  on-secondary-container: '#ffc2c4'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#586076'
  on-tertiary-container: '#d4dbf5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style
The design system for Phase P.09 embodies "AI-Native Intelligence"—a philosophy where the interface is not just a container for data, but a visual manifestation of a reasoning process. The aesthetic prioritizes high-density information environments, transparency, and logical flow.

The style is a hybrid of **Minimalism** and **Glassmorphism**, specifically tuned for technical sophistication. It utilizes translucent data layers to represent the depth of agentic reasoning, where lower layers represent raw data processing and top layers represent finalized autonomous decisions. The emotional response is one of absolute control, precision, and trust in complex automated systems.

## Colors
This design system operates exclusively in a high-contrast dark mode to simulate a terminal-plus environment. 

- **Intelligence Indigo (#4F46E5):** Used for primary actions, active agent states, and successful tool execution.
- **Reasoning Rose (#F43F5E):** Reserved for "System Logic," bottlenecks, decision pivots, and high-priority interrupts.
- **Neural Navy (#0F172A):** The foundational surface color, providing a deep, stable base for translucent overlays.
- **Data Accents:** Use varying opacities of White (5% to 20%) for "Neural Network" patterns and grid lines to establish depth without visual noise.

## Typography
The typography strategy leverages **Geist** for its clinical, neo-grotesque precision in headers and UI controls. To reinforce the technical nature of "Reasoning Visualization," **JetBrains Mono** is introduced for all data outputs, tool logs, and confidence indicators.

- Use **Uppercase Monospace** for all status labels (e.g., "EXECUTING", "THINKING").
- Tighten letter spacing on large displays to maintain a "dense" professional feel.
- Body text should maintain high line-height (1.5x) to ensure readability in data-heavy sidebars.

## Layout & Spacing
The layout follows a **Fixed 12-Column Grid** for core dashboards, but allows for **Fluid Sidebars** (Agent Orchestration panels). 

- **Density:** Use a 4px base unit. Component padding should be tight (8px or 12px) to maximize information density.
- **Panels:** The interface is divided into "Functional Zones." The left zone is for Orchestration (Control), the center for Reasoning (Visualizer), and the right for Logs (Validation).
- **Responsive Behavior:** On mobile, panels collapse into a tabbed "Agent Stack," prioritising the Reasoning Visualizer as the primary view.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layers** and **Backdrop Blurs** rather than traditional shadows.

- **Base Layer:** Neural Navy (#0F172A).
- **Surface Layer:** 4% White overlay on base.
- **Active Overlay:** 8% White overlay with a 12px backdrop blur. This is used for modals and tool-execution popovers to simulate "floating logic."
- **Borders:** Use 1px "Ghost Borders" (#FFFFFF at 10% opacity) to define elements. Avoid drop shadows entirely to maintain the flat, technical aesthetic.

## Shapes
The shape language is "Technical-Soft." It uses a **Soft (0.25rem)** radius for standard UI elements like buttons and inputs to maintain a modern feel, but keeps a "sharp" logical structure for the overall grid.

- **Status Nodes:** Use full-circle (pill) shapes for agent status indicators.
- **Logic Connectors:** Use 2px wide paths with 4px corner radii for the lines connecting reasoning steps.

## Components

### Autonomy Levels & Confidence Indicators
- **Autonomy Switcher:** A segmented control using Intelligence Indigo for the active state. Levels range from "Manual" to "Full Agentic."
- **Confidence Bar:** A thin (2px) progress bar placed directly under headers or data points. Color shifts from Reasoning Rose (<40%) to Intelligence Indigo (>80%).

### Tool Execution States
- **Tool Chips:** Rectangular with a mono-label and a leading icon. 
- **State Pulse:** While a tool is "Thinking," the chip border should pulse with a 1px Indigo glow.
- **Execution Log:** A monospaced block with a 5% White background, using syntax highlighting for JSON or Code snippets.

### Buttons & Inputs
- **Primary Button:** Solid Intelligence Indigo with White text. No gradient.
- **Ghost Button:** 1px Indigo border, transparent background.
- **Input Fields:** Bottom-border only (2px Intelligence Indigo when focused) to minimize visual clutter in dense forms.

### Reasoning Cards
- **Structure:** Cards use a 1px border. The header contains the "Step Number" in a Reasoning Rose mono-label.
- **Content:** Uses a "Neural Pattern" background (subtle dot grid) to distinguish reasoning steps from general UI.