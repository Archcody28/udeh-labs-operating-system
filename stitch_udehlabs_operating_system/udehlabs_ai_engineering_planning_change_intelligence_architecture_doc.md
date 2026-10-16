# Autonomous Software Engineering Planning & Change Intelligence Architecture

## Overview
Phase A.15 introduces the **Autonomous Engineering Planner**, the strategic reasoning layer of UdehLabs. It transforms abstract requirements into technically grounded, risk-aware, and sequence-optimized implementation blueprints. By integrating A.14 Codebase Intelligence, the planner moves from "template-based" tasks to "evidence-based" engineering plans.

## Core Components

### 1. Change Intelligence Service (`IChangeIntelligenceService`)
- **Impact Discovery**: Uses the A.14 Code Graph and Symbol Index to identify the exact "blast radius" of a proposed change.
- **Risk Assessment**: Calculates a multi-dimensional risk score (Security, Data, API, Tenant) based on the sensitivity and complexity of affected code.
- **Breaking Change Detector**: Statically analyzes the impact on public exports, API contracts, and database schemas to flag potential regressions before they occur.

### 2. Strategic Planner (`IEngineeringPlanner`)
- **Strategy Selection**: Recommends the optimal approach (e.g., Feature Flag, Strangler Pattern, Direct Refactor) based on the risk profile.
- **Task Decomposition**: Breaks plans into atomic, typed tasks (Architecture, DB, API, UI, etc.) with specific file/symbol targets.
- **Dependency DAG**: Generates a Directed Acyclic Graph of tasks, identifying the **Critical Path** and parallelization opportunities while enforcing sequential safety (e.g., DB Schema -> API logic).

### 3. Planning Governance & Safety
- **Architecture Integrity**: Cross-references every task against A.13 rules. If a task violates a boundary (e.g., Domain -> Infrastructure), the plan is blocked for ADR review.
- **Security-First Planning**: Automatically injects mandatory security tasks (Auth, IAM, Validation) for any change touching sensitive trust zones.
- **Approval Gates**: Enforces human-in-the-loop sign-off for HIGH/CRITICAL risk plans (Security, Payments, Data Migrations).

### 4. Plan Lifecycle & Traceability
- **Snapshot Validation**: Plans are versioned and anchored to a specific repository revision. If the codebase changes during planning, the plan is marked `STALE` for re-verification.
- **Bidirectional Traceability**: Links Requirement -> Change Request -> Engineering Plan -> Agent Tasks -> Verified Code.

## Data Models
- **ChangeRequest**: The root intent for a modification.
- **EngineeringPlan**: The versioned, immutable implementation strategy.
- **EngineeringTask**: Granular work items mapped to specialized A.9 agents.
- **PlanRisk**: Evidence-backed assessment of technical and operational impact.

## Security & Isolation
- **Tenant-Scoped Planning**: All impact analysis and plans are strictly isolated by `organizationId`.
- **Secret Redaction**: The Context Builder ensures no credentials enter the planning prompt, treating repository configuration strictly as data.
- **Policy Over Instruction**: The planning engine's security policies (e.g., "MFA changes require human approval") cannot be overridden by user instructions.

## Vertical Integration
- **A.14 Integration**: Consumes the symbol graph and dependency map for surgical impact analysis.
- **A.13 Integration**: Uses the ADR registry and rule engine to ensure structural consistency.
- **A.9/A.8 Integration**: Supplies orchestrated agents with hyper-targeted context packets and a validated execution sequence.
