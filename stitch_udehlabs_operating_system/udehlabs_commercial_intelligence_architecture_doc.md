# Phase A.27: Client Acquisition, Discovery, Proposal & Contract Intelligence Architecture

## Overview
Phase A.27 establishes the **Commercial Operating Layer** for UdehLabs. It transforms the platform from a project management tool into a comprehensive software business operating system. This layer manages the lifecycle of a client engagement from initial lead through discovery, solution design, estimation, and formal contracting, ending with the automated initialization of delivery projects.

## Core Components

### 1. Lead & Inquiry Management (`ICommercialInquiryService`)
- **Intelligence-Driven Intake**: Captures prospects from various sources, utilizing AI to categorize business needs, urgency, and technical fit.
- **Qualification Workflow**: Evaluates leads against company capabilities, security standards, and resource availability retrieved from the Knowledge Graph (A.20).

### 2. AI-Assisted Discovery & Analysis (`IDiscoveryOrchestrator`)
- **Structured Discovery Sessions**: Facilitates interactive Q&A between prospects and the 'Discovery Agent' to uncover functional, non-functional, and technical constraints.
- **Requirement Extraction**: Automatically converts discovery notes into structured `EngineeringRequirements` (A.22), identifying gaps and contradictions early in the sales cycle.

### 3. Solution Design & Estimation (`ISolutionArchitectureService`)
- **Evidence-Based Estimation**: Generates effort and risk profiles by correlating proposed requirements with historical project data and team proficiency (A.24).
- **Architecture Proposals**: Leverages the Architecture Engine (A.13) to propose high-level system designs, technology stacks, and integration patterns as part of the commercial proposal.

### 4. Proposal & Contract Governance (`IProposalManagementService`)
- **Versioned Proposal Engine**: Manages the lifecycle of professional proposals (Draft, Sent, Negotiating, Approved), ensuring full traceability of scope and pricing changes.
- **Contract Intelligence**: Generates legally-grounded contract drafts from approved proposals, integrating with e-signature abstractions for final execution.

### 5. Commercial-to-Delivery Handoff (`IProjectConversionService`)
- **Automated Project Initialization**: Upon contract activation, seamlessly creates the `Project` (A.2), initializes the `Engineering Factory` (A.22) with approved requirements, and configures `Billing` (A.1).
- **Traceability Linkage**: Maintains an unbroken chain from the initial Lead ID to the final Deployed Artifact hash.

## Data Models
- **CommercialLead**: The root entry for a prospect or new inquiry.
- **DiscoverySession**: A versioned record of the exploration phase.
- **Proposal / ProposalVersion**: Structured commercial offers including scope, timeline, and pricing.
- **CommercialContract**: The binding agreement anchored to a proposal and project.
- **CommercialChangeRequest**: Manages post-contract scope or timeline modifications.

## Security & Governance
- **Commercial Confidentiality**: Proposals and contracts are strictly isolated by `organizationId` and require high-level IAM permissions (`ADMIN` or `OWNER`).
- **Policy-Bounded AI**: Agents are forbidden from making binding commercial commitments or inventing pricing without human-in-the-loop approval.
- **Audit Integrity**: Every pricing change, scope adjustment, and approval action is recorded in the immutable audit trail.

## Vertical Integration
- **A.20/A.22 Integration**: Consumes the Knowledge Graph for estimation and feeds the Engineering Factory upon project conversion.
- **A.23 Integration**: Surfaces the commercial journey (Proposal Review, Signing) to the Client Portal.
- **A.24 Integration**: Informs the Developer Portal of upcoming workloads and required skill sets.