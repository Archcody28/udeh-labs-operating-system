/** Lifecycle constants mirroring docs/architecture/lifecycle-state-models.md + entity-catalog.md. */
import { StateTransitionError, ValidationError } from "./errors.js";

export const OrganizationStatus = ["provisioning", "active", "suspended"] as const;
export const WorkspaceStatus = ["active", "archived"] as const;
export const ProjectStatus = ["active", "archived"] as const; // UNRESOLVED per catalog; archive path enforced
export const InvitationStatus = ["sent", "accepted", "expired", "revoked"] as const;
export const MembershipStatus = ["active", "suspended", "removed"] as const;
export const ClientRequestStatus = ["submitted", "elaborated", "closed"] as const;
export const RequirementStatus = ["draft", "accepted"] as const;
export const ProposalStatus = ["draft", "in_review", "sent", "approved", "rejected"] as const;
export const ProposalVersionStatus = ["draft", "sent", "superseded", "approved"] as const;
export const ContractStatus = ["ready", "signed", "active"] as const;
export const ApprovalStatus = ["requested", "approved", "denied"] as const;
export const EngineeringTaskStatus = ["planned", "in_progress", "in_review", "done"] as const;
export const ExecutionTaskStatus = ["queued", "running", "verified", "failed"] as const;
export const CodePatchStatus = ["proposed", "approved", "applied", "superseded"] as const;
export const ReviewStatus = ["requested", "approved", "changes_requested"] as const;
// PROPOSED labels preserved, not finalized:
export const DeploymentStatus = ["triggered", "running", "succeeded", "failed", "rolled_back"] as const;
export const OrchestrationSessionStatus = ["open", "closed", "escalated"] as const;
export const AgentStatus = ["defined", "provisioned", "retired"] as const;
export const AgentVersionStatus = ["pinned", "superseded"] as const;
export const AgentRunStatus = ["planning", "waiting_approval", "executing", "succeeded", "failed", "halted"] as const;
export const AgentPlanStatus = ["proposed", "approved", "denied", "superseded"] as const;
export const AgentPolicyStatus = ["active", "revoked"] as const;
export const AgentResultStatus = ["produced", "verified", "rejected"] as const;
export const AgentDelegationStatus = ["requested", "accepted", "completed"] as const;
// UNRESOLVED / PROPOSED preserved as constants:
export const AgentMemoryStatus = ["active", "governed", "purged"] as const; // UNRESOLVED
export const WorkflowStatus = ["defined", "active", "disabled"] as const;
export const IncidentStatus = ["detected", "triaged", "investigating", "remediated", "resolved"] as const; // PROPOSED
export const ReleaseStatus = ["staged", "gated", "released", "rejected"] as const; // PROPOSED
export const EnvironmentStatus = ["active", "decommissioned"] as const; // UNRESOLVED
export const VerificationRunStatus = ["queued", "running", "passed", "failed"] as const;
export const DatasetStatus = ["cataloged", "governed", "deprecated"] as const; // UNRESOLVED
export const QualityContractStatus = ["active", "violated"] as const; // UNRESOLVED
export const DataPolicyStatus = ["active", "revoked"] as const;
export const DecisionStatus = ["recorded", "superseded"] as const; // UNRESOLVED
export const DeveloperAvailability = ["active", "assigned", "unavailable"] as const; // UNRESOLVED
export const ApiCredentialStatus = ["issued", "active", "revoked"] as const;
export const IntegrationStatus = ["configured", "disabled"] as const; // UNRESOLVED

const TRANSITIONS: Record<string, Record<string, string[]>> = {
  organization: { provisioning: ["active"], active: ["suspended", "active"], suspended: ["active"] },
  workspace: { active: ["archived"], archived: [] },
  project: { active: ["archived"], archived: [] },
  invitation: { sent: ["accepted", "expired", "revoked"], accepted: [], expired: [], revoked: [] },
  membership: { active: ["suspended", "removed"], suspended: ["active", "removed"], removed: [] },
  client_request: { submitted: ["elaborated"], elaborated: ["closed"], closed: [] },
  requirement: { draft: ["accepted"], accepted: [] },
  proposal_version: { draft: ["sent"], sent: ["approved", "superseded"], approved: [], superseded: [] },
  proposal: { draft: ["in_review", "sent"], in_review: ["sent", "draft"], sent: ["approved", "rejected"], approved: [], rejected: [] },
  contract: { ready: ["signed"], signed: ["active"], active: [] },
  approval: { requested: ["approved", "denied"], approved: [], denied: [] },
  engineering_task: { planned: ["in_progress"], in_progress: ["in_review"], in_review: ["done", "in_progress"], done: [] },
  execution_task: { queued: ["running"], running: ["verified", "failed"], verified: [], failed: [] },
  agent_run: {
    planning: ["waiting_approval", "executing", "halted"],
    waiting_approval: ["executing", "halted"],
    executing: ["succeeded", "failed", "halted"],
    succeeded: [], failed: [], halted: []
  },
  incident: { detected: ["triaged"], triaged: ["investigating"], investigating: ["remediated"], remediated: ["resolved"], resolved: [] },
  release: { staged: ["gated"], gated: ["released", "rejected"], released: [], rejected: [] },
  verification_run: { queued: ["running"], running: ["passed", "failed"], passed: [], failed: [] }
};

export function assertTransition(machine: string, from: string, to: string): void {
  const allowed = TRANSITIONS[machine]?.[from];
  if (!allowed) return; // machines without finalized transitions: DB CHECK still constrains values
  if (!allowed.includes(to)) throw new StateTransitionError(from, allowed);
}

export function validateName(name: string, field = "name"): void {
  if (!name || !name.trim() || name.trim().length > 200) {
    throw new ValidationError(`invalid ${field}`, [{ field, issue: "must be 1..200 chars" }]);
  }
}
