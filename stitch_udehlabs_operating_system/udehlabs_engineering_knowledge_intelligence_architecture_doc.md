# Engineering Knowledge Graph & Organizational Memory Architecture

## Overview
Phase A.20 introduces the **Engineering Knowledge Graph**, the definitive intelligence layer of UdehLabs. It transforms fragmented data across requirements, code, deployments, and incidents into a connected, traceable, and queryable organizational memory.

## Core Components

### 1. Knowledge Graph Service (`IKnowledgeGraphService`)
- **Semantic Relationships**: Maps nodes (Project, Symbol, ADR, Incident) with typed edges (`IMPLEMENTS`, `CAUSED_BY`, `DEPENDS_ON`).
- **Provenance Tracking**: Every node and relationship is anchored to a verified source (Commit hash, Task ID, Postmortem doc).
- **Tenant Isolation**: Strictly enforces `organizationId` boundaries at the graph traversal level.

### 2. Engineering Memory (`IEngineeringMemoryService`)
- **Organizational Memory**: Captures long-term engineering standards, architectural principles, and lessons learned from past incidents.
- **Project Memory**: Accumulates a persistent context for specific engineering engagements (Decisions, Requirements, Success Criteria).
- **Context Retrieval**: Provides AI agents with hyper-targeted 'Context Packets' containing only authorized and relevant knowledge.

### 3. Architecture Decision Registry (ADR)
- **Living Decisions**: Formalizes the technical decision lifecycle, linking every ADR to affected code symbols and requirements.
- **Drift Detection**: Automatically identifies conflicts between 'Decentralized Decisions' and 'Actual Code Implementation' (A.14 integration).

### 4. Impact Intelligence (`IImpactAnalysisService`)
- **Surgical Blast Radius**: Calculates the direct and indirect impact of changing a symbol, API contract, or database model.
- **Cross-Domain Correlation**: Links operational failures (Incidents) to technical changes (Deployments) and strategic intent (Requirements).

## Data Models
- **KnowledgeItem**: The atomic unit of intelligence with confidence and freshness metrics.
- **KnowledgeNode / KnowledgeEdge**: Graph primitives for complex relationship mapping.
- **ArchitectureDecisionRecord**: Formalized records of technical pivots and tradeoffs.
- **KnowledgeContextPacket**: Scoped, permission-aware context for AI reasoning.

## Security & Governance
- **Factual Sovereignty**: Distinguishes between 'Verified Facts' (Code/Telemetry) and 'Inferred Knowledge' (AI Observations).
- **Conflict Management**: Detects and exposes contradictory information (e.g., Stale documentation vs. Fresh code).
- **Privacy Boundaries**: Ensures internal engineering 'Memory' is never exposed to restricted client views.

## Vertical Integration
- **A.19 Integration**: Correlates incidents with historical postmortems and known architecture risks.
- **A.15 Integration**: Grounds engineering plans in previous decisions and organizational standards.
- **A.14 Integration**: Consumes the symbol index as the foundational 'Source of Truth' for the graph.