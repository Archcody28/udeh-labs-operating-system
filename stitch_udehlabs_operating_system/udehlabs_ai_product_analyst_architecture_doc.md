# AI Product Analyst & Requirements Intelligence Architecture

## Overview
Phase A.4 introduces the first intelligent reasoning layer to UdehLabs. The **AI Product Analyst** is a vendor-agnostic engine designed to analyze structured project data and provide engineering intelligence while maintaining strict human-in-the-loop control.

## Core Components
### 1. AI Context Engine
- **IAIProjectContextBuilder**: Resolves authorized project data (Requirements, Brief, Team) into a deterministic context for the LLM.
- **Provenance Tracking**: Every analysis records the source entity IDs and context hashes for auditable traceability.
- **Tenant Isolation**: Context builders enforce `organizationId` boundaries at the repository level.

### 2. Reasoning Layer (Application Services)
- **RequirementQualityAnalyzer**: Checks for ambiguity, clarity, and testability.
- **AnomalyDetector**: Identifies semantic contradictions and duplicates across requirements.
- **Risk & Dependency Engine**: Infers technical risks and infrastructure dependencies from project descriptions.

### 3. Human-in-the-Loop Workflow
- **AI Findings**: Structured observations (Risk, Ambiguity, etc.) that require developer review.
- **AI Suggestions**: Proposed mutations (e.g., improved Requirement text) that must be explicitly accepted/rejected.
- **Status Lifecycle**: `OPEN` -> `REVIEWED` -> `ACCEPTED` | `REJECTED`.

## AI Infrastructure (Vendor-Agnostic)
- **IAIProvider**: Abstraction layer for Gemini, OpenAI, and Anthropic.
- **Structured Output**: Uses Zod schemas to parse and validate raw LLM responses before persistence.
- **Prompt Architecture**: Versioned prompts stored outside business logic to allow independent tuning.

## Data Models
- **AIAnalysis**: Tracks job status, token usage, and model metadata.
- **AIFinding**: Individual observations with severity and source traceability.
- **AISuggestion**: Proposed content improvements with approval tracking.

## Security & Safety
- **Prompt Injection Defense**: Project data is treated as untrusted input and separated from system instructions.
- **PII Scrubbing**: Context builders remove sensitive credentials before sending data to external providers.
- **Non-Destructive**: AI can never modify production requirements directly.
