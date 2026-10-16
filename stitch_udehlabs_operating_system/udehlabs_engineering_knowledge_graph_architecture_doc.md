# Engineering Knowledge Graph & Persistent Project Memory Architecture

## Overview
Phase A.11 introduces the **Engineering Knowledge Graph**, the long-term memory of UdehLabs. It provides a persistent, structured understanding of a project's evolution, preventing the AI from repeatedly rediscovering the same facts and enabling complex reasoning across requirements, architecture, and code.

## Core Components

### 1. Engineering Knowledge Graph (`IEngineeringKnowledgeGraph`)
- **Semantic Mapping**: Represents relationships between Organization, Project, Repository, Symbol, Requirement, and Architecture Decision.
- **Relationship Types**: `DEPENDS_ON`, `IMPORTS`, `IMPLEMENTS`, `CONSTRAINS`, `VERIFIED_BY`, `SUPERSEDES`.
- **Confidence Model**: Tracks evidence and verification status for every knowledge node and edge.

### 2. Project Memory Service (`IProjectMemoryService`)
- **Scoped Retrieval**: Retrieves relevant memories based on the current agent role, task, and project context.
- **Memory Decay & Staleness**: Detects outdated facts and triggers re-verification based on technical debt metrics or time-to-live (TTL).
- **Sanitization**: Prevents secrets, PII, and credentials from entering persistent memory through the `IKnowledgeSanitizer`.

### 3. Engineering Charter & Governance
- **Project Engineering Charter**: A declarative policy document defining architecture principles, coding standards, and AI behavior constraints.
- **Decision Governance**: Formalizes the lifecycle of `ArchitectureDecision` items (PROPOSED -> APPROVED -> SUPERSEDED).
- **Conflict Detection**: Identifies contradictory facts or decisions (e.g., conflicting API contracts or architectural rules).

### 4. Project Timeline & Traceability
- **Historical View**: Provides a chronological record of requirement changes, architectural pivots, and implementation milestones.
- **Audit Chain**:Requirement -> Decision -> Task -> Execution -> Verified Change.

## Knowledge Lifecycle
`DISCOVERED` (AI Observation) -> `PROPOSED` (Awaiting Review) -> `VERIFIED` (Evidence Found) -> `APPROVED` (Human Approval) -> `ACTIVE` -> `SUPERSEDED` / `EXPIRED`.

## Security & Isolation
- **Tenant-Scoped Graph**: Knowledge nodes and edges are strictly isolated by `organizationId` and `projectId`.
- **Fact-Based Reasoning**: Evidence (repository revisions, document links) is required for facts to be promoted to "Verified" status.
- **Prompt Injection Defense**: Memory is treated as untrusted data and cannot override system-level security policies or IAM.

## Key Workflows
1. **Knowledge Discovery**: AI agents propose new facts based on codebase analysis.
2. **Conflict Resolution**: Humans resolve contradictory architectural or requirement findings.
3. **Context Construction**: A.10 Intelligence Layer consumes A.11 Memory to build hyper-targeted context packets for A.9 Agents.