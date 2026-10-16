# Interface Contract — Organization & Workspace (SCR-010..014)
## Actor: owner/admin/member/multi-org user.
## Inputs: org name, workspace config, switch target.
## Outputs: Organization Active + auto primary Workspace; currentOrganization context.
## Actions: create org, create workspace, switch org, configure settings.
## Preconditions: authenticated identity; membership for switch.
## Permissions: any user may create org→becomes Owner; admin configures.
## States: loading, empty (no orgs), populated, error, success, forbidden, processing.
## Transitions: create→dashboard; switch→server context update (never client-trusted).
## Data: Organization, Workspace, Member (conceptual).
## Audit: creation, ownership transfer, switch logged.
