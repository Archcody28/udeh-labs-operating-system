/**
 * Deterministic scripted notification provider for local + CI testing
 * (Phase 14). Never requires real credentials. Behavior is fully scripted so
 * integration tests can force success, retryable failure, terminal failure,
 * and idempotent replay without any network or clock nondeterminism.
 */
import {
  NotificationProvider, NotifyProviderError, NotifyRequest, NotifyResult,
} from "../notificationProvider.ts";
import { NotificationChannel } from "../notificationChannels.ts";

export type ScriptedOutcome =
  | { kind: "succeed" }
  | { kind: "fail"; failure: NotifyProviderError["failure"]; retryable: boolean }
  | { kind: "succeed_with_idempotent_replay" };

export class ScriptedProvider implements NotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;
  /** Queue of outcomes; the last outcome repeats when the queue drains. */
  private script: ScriptedOutcome[] = [];
  private fallback: ScriptedOutcome = { kind: "succeed" };
  /** Every accepted idempotency key, in order — proves replay safety. */
  readonly acceptedKeys: string[] = [];
  readonly calls: NotifyRequest[] = [];

  constructor(name: string, channel: NotificationChannel = "in_app") {
    this.name = name;
    this.channel = channel;
  }

  /** Enqueue outcomes consumed one per call; last one sticks. */
  script_outcomes(...outcomes: ScriptedOutcome[]): this {
    this.script = [...outcomes];
    const last = outcomes[outcomes.length - 1];
    if (last) this.fallback = last;
    return this;
  }

  reset(): void {
    this.script = [];
    this.fallback = { kind: "succeed" };
    this.acceptedKeys.length = 0;
    this.calls.length = 0;
  }

  async send(req: NotifyRequest): Promise<NotifyResult> {
    this.calls.push(req);
    const outcome = this.script.shift() ?? this.fallback;
    if (outcome.kind === "fail") {
      throw new NotifyProviderError({
        provider: this.name, failure: outcome.failure,
        message: `scripted ${outcome.failure}`, retryable: outcome.retryable,
      });
    }
    // Idempotent replay: if this key was already accepted, return the same
    // message id without treating it as a new logical send.
    const replay = this.acceptedKeys.includes(req.idempotencyKey);
    if (!replay) this.acceptedKeys.push(req.idempotencyKey);
    return {
      providerMessageId: `${this.name}:${req.idempotencyKey}`,
      accepted: true,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
