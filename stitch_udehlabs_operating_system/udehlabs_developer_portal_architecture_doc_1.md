# Developer Portal & Workforce Architecture

## Overview
The UdehLabs Developer Portal is the professional command center for the human engineering workforce. It manages the lifecycle of developers, from onboarding and skills verification to project assignment and workload monitoring.

## Domain Entities
- **DeveloperProfile**: Extends the base `User` with engineering-specific metadata (title, bio, specialization).
- **Skill**: A normalized catalog of technical capabilities (e.g., TypeScript, Rust, PyTorch).
- **DeveloperSkill**: Junction entity mapping developers to skills with `proficiency` levels and `yearsOfExperience`.
- **DeveloperAvailability**: Real-time status (Available, Busy, etc.) and capacity constraints.
- **DeveloperAssignment**: Links developers to `Projects` or `Tasks` with specific `workloadAllocation`.
- **PortfolioItem**: Historical record of project outcomes and technical contributions.
- **Certification**: Verified technical credentials from external authorities.

## Workforce Governance
- **Isolation**: Profiles and assignments are scoped to the `organizationId`.
- **Proficiency Model**: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT.
- **Availability States**: AVAILABLE | BUSY | ON_LEAVE | UNAVAILABLE.

## AI Readiness
- The structured `DeveloperSkill` and `DeveloperAvailability` models are designed to be consumed by the **Resource Matching Engine** (Phase B) to suggest optimal squad compositions based on project requirements.

## Key Workflows
1. **Onboarding**: Multi-step initialization of professional identity and technical stack.
2. **Skill Management**: Continuous update and eventual verification of developer capabilities.
3. **Availability Tracking**: Maintaining accurate capacity data for platform-level resource planning.
4. **Project Visibility**: Providing developers with a high-fidelity view of their current workload and deadlines.

## API & Server Actions
- `updateDeveloperProfile()`: Manages core identity and bio.
- `syncDeveloperSkills()`: Batch updates technical stack and proficiency.
- `setAvailabilityStatus()`: Updates real-time presence and workload capacity.
- `addPortfolioItem()`: Enriches the professional history.
