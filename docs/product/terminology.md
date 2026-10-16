# Terminology — Phase 2 (repo evidence only; inconsistency recorded, not invented)
Date 2026-10-16.
- organization vs workspace: UNRESOLVED. create_organization + create_workspace both exist; A.67 tiers separate Org/Project/Team/Personal. No doc defines boundary (HD-02).
- project vs workspace: project = delivery unit (project_overview_*, milestones); workspace = scoped working context (engineering_execution_workspace_*). Overlap UNRESOLVED.
- developer vs engineer: used interchangeably in dirs/docs; dev-portal doc_1 formalizes DeveloperProfile. No role distinction evidenced.
- agent vs automation: agent = governed cognitive worker with Run/Plan/Policy (A.21); automation/workflow = repeatable orchestration (workflow_builder). Handoff between them UNRESOLVED.
- requirement vs task: Requirement = intake unit (A.42/A.43); Task = EngineeringTask/ExecutionTask (A.9). Chain Requirement->Task EXPLICIT.
- incident vs operational event: incident workspace RCA explicit; generic event only via A.63 telemetry refs. Severity model UNRESOLVED.
- deployment vs release: deployment = environment promotion (A.18, deployment_center); release = readiness-gated commercial/quality event (release_intelligence_readiness, quality_release_center). Promotion rule UNRESOLVED.
- command center vs dashboard vs workspace: command = operational control (recurring); dashboard = read-only view; workspace = interactive scoped context. Which surfaces are which UNRESOLVED HD-06.
- proposal vs contract: proposal = versioned offer; contract = signed authorization package (A.43 EXPLICIT).
- verification vs validation vs approval: verification = automated suite (A.17); approval = human sign-off (A.21/A.43); validation used loosely. Matrix UNRESOLVED.

