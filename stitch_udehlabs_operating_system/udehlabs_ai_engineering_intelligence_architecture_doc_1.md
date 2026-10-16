# AI Engineering Intelligence Layer Architecture

## Overview
Phase A.10 introduces the **AI Engineering Intelligence Layer**, the cognitive foundation of UdehLabs. It transforms raw repository data into a structured "Project Understanding" that enables AI agents to reason about code, architecture, and requirements with high confidence and precision.

## Core Components

### 1. Codebase Intelligence (`ICodebaseIntelligenceService`)
- **Repository Indexer**: Scans the repository to build a structured map of files, modules, symbols (classes, functions, types), and their relationships.
- **Code Graph (`ICodeGraphService`)**: A directed graph representing the network of imports, calls, and dependencies across the codebase.
- **Symbol Tracker**: Maintains a searchable registry of all high-level code entities for targeted context retrieval.

### 2. Architecture & Rule Engine
- **Architecture Intelligence**: Understands UdehLabs' domain boundaries, layer isolation rules, and security trust zones.
- **Architecture Rule Engine (`IArchitectureRuleEngine`)**: A declarative system for enforcing engineering policies (e.g., "Domain cannot depend on Infrastructure").
- **Violation Detector**: Scans proposed changes for architectural drift or boundary violations before they reach human review.

### 3. Requirement & Project Intelligence
- **Requirement Intelligence**: Analyzes natural language input to identify objectives, constraints, and acceptance criteria.
- **Ambiguity Detection**: Proactively flags underspecified requirements and generates clarifying questions for the user.
- **Impact Analyzer (`IChangeImpactAnalyzer`)**: Calculates the ripple effect of a change across files, database schemas, APIs, and tests.

### 4. Context Retrieval & Semantic Search
- **Engineering Context Retriever**: A ranked retrieval engine that gathers only the "Targeted Context" relevant to a specific task, respecting token budgets.
- **Embedding Abstraction**: Provides a vendor-agnostic interface for vectorizing code and documentation for semantic search.
- **Knowledge Governance**: Distinguishes between verified **Facts**, human **Decisions**, and AI **Assumptions**.

## Intelligence Pipeline
`User Input` -> `Requirement Classification` -> `Impact Analysis` -> `Targeted Context Retrieval` -> `Engineering Insight Generation` -> `Task Planning`.

## Security & Isolation
- **Tenant-Scoped Indexing**: Every intelligence artifact (embeddings, index nodes) is strictly scoped by `organizationId` and `projectId`.
- **Prompt Injection Defense**: Treating retrieved code/docs as untrusted data, ensuring system instructions remain sovereign.
- **PII Scrubbing**: Context packets are sanitized of secrets and environment variables before being processed by AI providers.

## Key Insights
- **Technical Debt Analyzer**: Identifies circular dependencies, complex modules, and missing tests.
- **API/Database Intelligence**: Understands schemas and contracts to prevent breaking changes.
- **Test Intelligence**: Recommends which tests to run or create based on the change impact map.