# Human Decisions Required — Phase 3 register
Date 2026-10-16. Resolved items moved to ADRs; retained items narrowed.
## RESOLVED in Phase 3 (do not re-ask)
- HD-02 Org vs workspace → RESOLVED (org-arch-doc: Org tenant → Workspace scope → Project; organizationId; primary workspace auto). ADR 0009 partial.
- HD-03 Duplicates → RESOLVED/DUPLICATE (pairs content-identical incl. Compare-Object empty for org-intel; `_1` pointer, `_2.md` for org-intel; sources preserved). ADRs 0002/3/5/6/7.
- HD-04 Portal fork → VARIANT/MERGED (Developer Workforce vs Engineering Workspace A.24). ADR 0008.
- HD-05 Orchestration → VARIANT/layered (A.9 coordination over A.21 runtime). ADR 0004.
## Retained (narrowed)
- HD-01narrow Identity mechanism: Q: credentials/SSO/MFA/session + onboarding unification? Insufficient: no auth-flow doc, only dirs+zero-trust policy. Affects auth phase. Options: password+MFA / SSO-first / hybrid. Risk: blocks auth only.
- HD-06narrow Dashboard iteration+SRE: Q: which _1/_2/_3 per family; one SRE surface or pattern? Needs screen diff + sign-off. Blocks UI build only.
- HD-07narrow Shell composition: Q: full global shell beyond switcher+240px rail? Needs IA spike. Blocks nav build only.
- HD-08 Themes: Q: retire cyber/kinetic/obsidian/nexus/surgical/synthetic or promote? Evidence: no arch counterpart. Recommend retire from canonical; preserve sources. Blocks theme build.
- HD-01 Identity model (ADR 0009): one authN/Z + onboarding flow or separate client/dev/org? Options: unify / keep separate / hybrid. Recommend audit screens first.
- HD-02 Org vs workspace (ADR 0009-adjacent): define boundary + ownership. Options: org>workspace>project / org=workspace / workspace-only.
- HD-03 Duplicate filenames (ADR 0002/0003/0005/0007 + 0006 txt-vs-md): content identical -> keep _1 or _2? Recommend keep _1, record supersede; verify 0006 bytes first.
- HD-04 Developer portal fork (ADR 0008): workforce mgmt vs engineering workspace — two contexts or one supersedes? Recommend rename to Developer Workforce + Engineering Workspace.
- HD-05 Orchestration fork (ADR 0004): A.9 vs A.21 coexist (coordination vs runtime) or A.21 supersedes? L5 ban carryover? Recommend layered reading, confirm with architect.
- HD-06 Dashboard canon (ADR 0010): canonical iteration per family; one SRE surface or three; command-center count. Recommend screen diff + stakeholder sign-off.
- HD-07 Admin/global nav: consolidate admin IA + define shell nav. Recommend defer to Phase 3 IA spike.
- HD-08 Theme dirs: retire cyber/kinetic/obsidian/nexus/surgical/synthetic or promote? Recommend retire (no arch counterpart).

