# Phase A.23: Client Experience & Project Intake Architecture

## Overview
Phase A.23 establishes the **Client Experience Layer**, the primary interface for external organizations to interact with UdehLabs. It transforms the internal Engineering Factory (A.22) into a customer-facing product, providing transparency, collaboration, and governed control over the software delivery lifecycle.

## Core Components

### 1. Client Portal (`IClientPortalService`)
- **Dual-Tenant Gateway**: Provides a secure window into UdehLabs engineering without exposing internal implementation secrets or cross-tenant data.
- **Intake Engine**: Converts business needs into structured `EngineeringRequests` using AI-assisted clarification and scoping.
- **Approval Gateway**: Manages legally and technically binding approvals for Requirements, Architecture, and Releases.

### 2. Project Workspace (`IClientProjectService`)
- **Delivery Transparency**: Exposes real-time progress, milestones, and health metrics derived from the A.22 Engineering Factory.
- **Deliverable Management**: A central repository for client-facing artifacts, designs, reports, and release notes.
- **Team Visibility**: Introduces the assigned UdehLabs engineering squad to the client, fostering trust and collaboration.

### 3. Client AI Assistant (`IClientAIAssistant`)
- **Bounded Knowledge Retrieval**: Answers client questions using the A.20 Knowledge Graph, strictly filtered for client-authorized scopes.
- **Intake Assistant**: Helps clients refine their ideas and identify missing information during the project request phase.

## Data Models
- **ClientOrganization**: Extends the base Organization with client-specific metadata (branding, contacts).
- **ClientProjectView**: A virtualized project record that filters internal engineering tasks for client consumption.
- **ClientApproval**: An immutable record of client sign-off on requirements, architecture, or releases.
- **ClientSupportRequest**: Integrated support ticketing linked to project context.

## Security & Governance
- **Server-Side Visibility Policy**: Hardcoded rules determining which engineering events, tasks, and artifacts are visible to clients.
- **IAM Mapping**: Maps client roles (Owner, Admin, Member) to specific portal permissions.
- **Redaction by Design**: Automatically strips internal agent reasoning, internal prompts, and infrastructure secrets from client views.

## Vertical Integration
- **A.22 Integration**: Submits requests directly to the Engineering Factory and tracks their lifecycle.
- **A.20/A.21 Integration**: Powers the Client AI Assistant with bounded memory and the Agent Runtime.
- **A.18/A.19 Integration**: Exposes deployment status and service health to clients in a simplified dashboard.