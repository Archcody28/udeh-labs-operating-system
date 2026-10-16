# Organization & Workspace Management Architecture

## Overview
UdehLabs implements a robust multi-tenant architecture where **Organizations** serve as the primary security and administrative boundary. A **Workspace** is a technical environment belonging to an organization, containing specific projects and AI configurations.

## Tenancy & Security Model
- **Isolation**: Every database record is scoped by `organizationId`.
- **Validation**: All server-side operations verify the `authenticatedUser -> organizationMembership` relationship.
- **Context**: The `currentOrganization` context is resolved on the server per request, never trusted from client-side state alone.

## Domain Entities
- **Organization**: The tenant. Owns members, billing, and workspaces.
- **Workspace**: A technical scope within an organization.
- **Member**: A user's association with an organization, defined by a `Role` and `Status`.
- **Invitation**: A secure mechanism for onboarding new members.

## IAM & Roles
Leverages the existing RBAC/ABAC system:
- `OWNER`: Full control, billing, and deletion.
- `ADMIN`: High-level management, inviting, and configuration.
- `MANAGER`: Team and project management.
- `DEVELOPER`: Core engineering and AI interaction.
- `DESIGNER`: UI/UX work and design system management.
- `CLIENT`: Restricted access for project stakeholders.
- `SUPPORT`: Troubleshooting and platform assistance.

## Lifecycles
### Organization
`Created` -> `Active` -> `Suspended` -> `Soft Deleted`

### Membership
`Pending (Invited)` -> `Active` -> `Suspended` -> `Removed`

### Invitation
`Sent` -> `Accepted` | `Rejected` | `Expired` | `Revoked`

## Key Workflows
1. **Creation**: User creates an Org -> Becomes OWNER -> Primary Workspace automatically provisioned.
2. **Onboarding**: Admin sends Invitation -> Token-based link -> User joins -> Audit event logged.
3. **Ownership Transfer**: Critical multi-step transaction ensuring continuity.
4. **Switching**: Secure server-side context update for users in multiple Orgs.
