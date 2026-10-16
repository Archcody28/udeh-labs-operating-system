# Role / Surface Matrix — Phase 3
Date 2026-10-16. Roles from org-arch-doc IAM + dev-portal workforce. UNRESOLVED where evidence weak.

| Actor | Identity | Org/Workspace | Commercial | Engineering | AI/Agents | Operations | Data/Intel | Admin |
|---|---|---|---|---|---|---|---|---|
| User (unauthenticated) | SCR-001/002 | — | — | — | — | — | — | — |
| Owner | full | full | approve | view | approve | view | view | full+billing |
| Admin | manage members | configure | view | view | approve | view | view | configure |
| Manager | view | view | view | manage tasks | request | view | view | — |
| Developer | self profile | member | — | implement/review | invoke bounded | view deploys | consume context | — |
| Designer | self | member | — | UI tasks | — | — | — | design system UNRESOLVED |
| Client | invitation | restricted | request/approve | view progress | — | — | — | — |
| Support | step-up | troubleshoot | view | view | — | view incidents | — | — |
| AI agent (principal per A.33) | scoped identity | org/project scope | — | tool-scoped | policy-bound | tool-scoped | governed retrieval | — |
| Auditor | — | — | view contracts | view evidence | view audit | view audit | view lineage | read-only audit |

Notes: org-scoped RBAC/ABAC per org-arch-doc; AI treated as first-class principal per A.33; SSO/MFA mechanism UNRESOLVED.
