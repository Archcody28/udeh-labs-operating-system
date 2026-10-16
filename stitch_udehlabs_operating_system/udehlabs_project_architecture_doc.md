# Project & Engineering Workspace Architecture

## Overview
The Project system is the orchestration layer of UdehLabs, connecting Client Requirements to Developer Workloads. It acts as the central security and data boundary for active engineering engagements.

## Domain Entities
- **Project**: The central tenant-aware record. Supports multi-tenant relationships (Owner Org vs. Client Org).
- **ProjectMember**: Links Developers/Users to Projects with specific `ProjectRole` and `WorkloadAllocation`.
- **Milestone**: High-level project markers with deadlines and linked requirements.
- **ProjectRequirement**: Specialized requirement tracking, extending the Client Request requirements into technical specifications.
- **ProjectBrief**: The authoritative document defining problem space, solution architecture, and success criteria.

## Security & Isolation
- **Dual-Tenant Support**: Projects explicitly track both the `udehLabsOrgId` and the `clientOrgId`.
- **Privacy Boundaries**: Internal engineering notes and private developer data are strictly excluded from client-visible views.
- **IAM Integration**: Leverages the UdehLabs RBAC/ABAC system for granular project-level permissions (e.g., `PROJECT_MANAGE_TEAM`, `PROJECT_VIEW_INTERNAL`).

## Lifecycle & Health
- **States**: DRAFT | DISCOVERY | PLANNING | ACTIVE | ON_HOLD | IN_REVIEW | COMPLETED | ARCHIVED.
- **Health Model**: Calculated based on milestone adherence, task velocity, and team capacity.

## AI Readiness
- **Structured Context**: Providers (`IProjectContextProvider`, `IProjectActivityProvider`) are established to supply future AI agents with the full project state for analysis and task generation.

## API & Server Actions
- `createProject()`: Initializes the project and primary workspace.
- `assignDeveloper()`: Manages team composition and workload.
- `updateMilestone()`: Tracks high-level progress.
- `syncRequirements()`: Connects client requests to technical matrices.
