# Traceability — Phase 2 (Surface -> Workflow -> Entity -> Arch doc -> UI; Strong/Moderate/Weak/Conflicting)
Date 2026-10-16.
- Commercial: W-04 -> Proposal/Contract -> A.43 pair -> proposal_*/contract_center_review dirs = Strong (content identical, chain explicit).
- Engineering delivery: W-06 -> Task/CodePatch -> A.8/A.9/A.14/A.16/A.17 -> execution_workspace/connect_repository/review dirs = Strong.
- Agent runtime: W-08 -> AgentRun/Plan/Policy -> A.21 vs A.9 -> agent_* dirs = Conflicting (fork, HD-05).
- Data: W-12 -> Dataset/Lineage -> A.64 pair -> data_* dirs = Strong (content identical).
- Org intelligence: W-12/briefing -> Decision/Outcome -> A.67 -> organizational_intelligence_hub_* = Strong-Moderate (txt-vs-md unverified, HD-03).
- Eng intelligence: A.10 pair -> engineering_intelligence_* dirs = Strong (identical pair).
- Developer portal: workforce entities vs workspace entities -> doc_1 vs doc_2 -> developer_* dirs = Conflicting (HD-04).
- Identity: User/Role -> A.51 -> login/onboarding/governance dirs = Moderate (dirs exist, model scattered, HD-01).
- SRE/dashboards: Incident/Release -> A.63/A.65 -> 20+ dashboard dirs = Weak/Conflicting (iterations, HD-06).
- Billing/monetization: Invoice -> enterprise_billing doc + P.03 -> billing_usage/pricing dirs = Weak (strategy only).
- Theme dirs (cyber/kinetic/obsidian/nexus): no arch doc -> Weak, excluded from canonical map (HD-08).

