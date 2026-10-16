# ADR 0010 — Repeated Dashboards / Interfaces

- **Status:** Partially accepted (Phase 3: families canonical per screen inventory SCR-011/024/030/035/050-055; command-vs-dashboard-vs-workspace semantics RESOLVED; per-family iteration pick + SRE consolidation REMAIN Proposed → HD-06narrow. No dashboard deleted.)
- **Date:** 2026-10-16

## Conflicting artifacts (top-level concept directories surveyed 2026-10-16)

- Project overview ×3: `udehlabs_project_overview_1/`, `_2/`, `_3/`
- Developer dashboard ×4: `udehlabs_developer_dashboard/`,
  `udehlabs_developer_dashboard_overview_1/`, `_2/`, `_3/`
- Organization dashboard ×3: `udehlabs_organization_dashboard_1/`,
  `_2/`, `_3/`
- Client dashboard ×2: `udehlabs_client_dashboard_1/`, `_2/`
- SRE / platform health ×7+: `nexus_sre_command_1/`, `_2/`, `_3/`,
  `udehlabs_sre_command_center_platform_health_1/`, `_2/`,
  `udehlabs_reliability_center_sre_dashboard/`,
  `udehlabs_observability_center_reliability_dashboard/`, plus
  `udehlabs_sre_incident_workspace_rca/`, `udehlabs_sre_performance/`
- AI workforce command center ×2: `udehlabs_ai_workforce_command_center_1/`, `_2/`
- Engineering surfaces: `udehlabs_engineering_dashboard/`,
  `udehlabs_engineering_intelligence_dashboard/`,
  `udehlabs_executive_intelligence_dashboard/`,
  `udehlabs_ai_governance_dashboard/`,
  `udehlabs_ai_security_observability_dashboard/`,
  `udehlabs_billing_usage_dashboard/`

Each directory ships its own `code.html` + PNG; counts above are exact per
the 2026-10-16 directory survey.

## Evidence

Directory-name survey only. Screen-level diffing (layout, widgets, data
contracts) was out of scope for Phase 1.

## Similarities

Repeated numeric suffixes (`_1`, `_2`, `_3`) strongly suggest iterative
Stitch generations of the same screen rather than distinct products.

## Differences (to be verified)

Unknown which iteration is newest, which (if any) reflects stakeholder
sign-off, and whether similarly named dashboards (e.g. SRE command center
vs reliability center vs observability center) are one surface or three.

## Unresolved questions

1. Canonical version per dashboard family?
2. One SRE surface or several? One developer home or four?
3. Data contracts behind each dashboard (all currently static mockups).
4. Retirement plan for superseded iterations.

## Proposed decision

None. A later phase must diff each family screen-by-screen, select the
canonical iteration with stakeholder sign-off, and retire the rest. No
dashboard is canonical merely because it "looks better".

## Decision status

PROPOSED. Screen-level audit required.
