# AI Codebase Intelligence & Software Understanding Architecture

## Overview
Phase A.14 introduces the **Autonomous Codebase Intelligence Engine**, the "nervous system" of UdehLabs. It provides a deep, continuously updated, and evidence-based understanding of the actual repository, enabling all other AI layers (Planning, Execution, Architecture) to reason from a verified source of truth.

## Core Components

### 1. Codebase Intelligence Service (`ICodebaseIntelligenceService`)
- **Incremental Indexing**: Discovers and indexes repositories, files, and symbols without full rebuilds using hash-based change detection.
- **Symbol Extraction**: Performs structural analysis (not just text search) to extract Functions, Classes, React Components, Prisma Models, and API Handlers.
- **Classification**: Automatically categorizes code areas by sensitivity (Security, Tenant, Billing, AI) and purpose (Source, Test, Infrastructure).

### 2. Software Knowledge Graphs
- **Dependency & Call Graphs**: Maps relationships from high-level Module -> Module down to Symbol -> Symbol calls, grounded in actual imports and static analysis.
- **Discovery Engines**:
    - **API Discovery**: Automatically maps Route Handlers, Server Actions, and Webhooks.
    - **Database Discovery**: Maps Prisma usage, migrations, and model-to-code relationships.
    - **Test Intelligence**: Maps test suites to the source symbols and requirements they validate.

### 3. Impact & Traceability Engine
- **Surgical Impact Analysis**: Calculates the "ripple effect" of changing a symbol, database model, or API, distinguishing between direct and indirect dependents.
- **Bidirectional Traceability**: Links Requirements (A.12) and Architecture Decisions (A.13) directly to the implementing code files and symbols.

### 4. Code Health & Governance
- **Evidence-Based Health**: Identifies circular dependencies, dead code, and architecture violations with specific pointers to the source logic.
- **Secret & Sensitivity Guard**: Proactively redacts secrets and identifies "Security Sensitive" code paths (Auth, IAM, Payments) for mandatory human review.

## Data Models
- **CodebaseIndex**: Snapshot-aware root for repository intelligence.
- **CodeFile & CodeSymbol**: Structured representations of the codebase hierarchy.
- **CodeRelationship**: Typed edges (IMPORTS, CALLS, TESTS, IMPLEMENTS) connecting code, architecture, and requirements.
- **CodeFinding**: Evidence-based observations on complexity, health, and drift.

## Security & Isolation
- **Tenant-Scoped Intelligence**: All code intelligence artifacts (indexes, symbols, graphs) are strictly isolated by `organizationId` and `projectId`.
- **Source-as-Data**: Treating repository content strictly as data to prevent prompt injection via code comments or configuration files.
- **Redaction Policy**: Hardcoded secrets and credentials are never persisted in the intelligence database.

## Vertical Integration
- **A.12 Integration**: Provides the "Actual" baseline for engineering plans.
- **A.13 Integration**: Detects "Architecture Drift" by comparing ADRs against actual call graphs and imports.
- **A.9/A.8 Integration**: Supplies specialized agents with targeted context packets (A.10) enriched with verified symbol definitions.