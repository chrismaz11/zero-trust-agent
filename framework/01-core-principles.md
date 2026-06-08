# Core Principles

> The zero-trust agent framework is built on five non-negotiable principles. Every template, checklist, and architecture decision in this repo traces back to these.

---

## Principle 1: Zero Trust by Default

**Every agent starts with no permissions.**

Trust is not assumed — it is earned incrementally through demonstrated reliability, explicitly granted through auditable configuration, and continuously verified through monitoring.

In practice:
- New agents deploy at T0 (Observer) or T1 (Drafter)
- Permission grants are documented in the agent's scope document
- Each integration, API, and data source requires an explicit access grant
- "The agent needs it" is not a sufficient justification — "the agent needs it for [specific task], reviewed by [person], on [date]" is

### Why This Matters for Developers

When you're building fast, it's tempting to give your agent broad permissions to reduce friction. But overpermissioned agents are the #1 source of production incidents. A T1 agent that can only draft emails is a manageable risk. A T3 agent with write access to your production database is a single prompt injection away from catastrophe.

---

## Principle 2: Draft → Approve → Execute

**No agent sends, publishes, commits, or spends without passing through the approval pipeline.**

The approval pipeline is the core mechanism that separates safe agents from dangerous ones. Every action with external consequences follows a three-stage lifecycle:

```
DRAFT                    APPROVE                  EXECUTE
Agent generates          Human (or automated       Approved action
the proposed action      rule) reviews and         is executed with
with full context        approves or rejects       full audit trail
```

At T1, every draft requires per-item human approval. At T2, defined action classes are pre-approved (e.g., "send emails matching this template" or "merge PRs that pass all checks"). At T3, the agent executes within its scoped boundaries with post-hoc audit review.

### Implementation Pattern

```python
# Pseudocode — framework-agnostic
action = agent.draft_action(
    type="send_email",
    payload={"to": "customer@example.com", "body": draft_body},
    context={"trigger": "support_ticket_123", "confidence": 0.92}
)

# T1: requires explicit approval
approval = await approval_pipeline.submit(action)

if approval.status == "approved":
    result = await action.execute()
    audit_log.write(action, approval, result)
elif approval.status == "rejected":
    audit_log.write(action, approval, rejection_reason=approval.reason)
    agent.learn_from_rejection(action, approval.reason)
```

---

## Principle 3: Everything Is Logged

**Every read, draft, approval, execution, and error — timestamped, structured, cryptographically signed, and immutable.**

Audit logs are not optional. They serve three purposes:
1. **Accountability** — Who approved what, when, and why
2. **Debugging** — When something goes wrong, reconstruct exactly what happened
3. **Trust-building** — Show clients, compliance teams, and stakeholders that your agent is governed

### Log Schema

Every event follows the structured format in [`templates/audit-log-schema.json`](../templates/audit-log-schema.json):

```json
{
  "event_id": "uuid-v4",
  "timestamp_utc": "2026-06-07T15:30:00Z",
  "agent_id": "support-assistant-prod",
  "tier": "T1",
  "action_type": "email.drafted",
  "actor": "agent",
  "target": "customer@example.com",
  "payload_hash": "sha256:abc123...",
  "outcome": "pending_approval",
  "context": {
    "trigger": "ticket_456",
    "confidence": 0.94
  },
  "signature": "hmac-sha256:def456..."
}
```

### Non-Negotiable Rules
- Logs are **append-only** — no updates, no deletes
- Every log entry is **cryptographically signed** to detect tampering
- Logs include the **full decision chain**: trigger → draft → approval/rejection → execution → result
- Log retention is configurable per deployment but defaults to **365 days minimum**

---

## Principle 4: Guardrails Are Code, Not Suggestions

**Blocklists, permission boundaries, and escalation triggers are enforced programmatically.**

Documentation says "don't do X." Code *prevents* X. The difference matters when your agent is running at 3 AM and nobody is watching.

### Types of Guardrails

| Guardrail | Implementation | Example |
|-----------|---------------|---------|
| **Blocklists** | Hard-coded denial lists checked before every action | Never contact these emails/domains |
| **Rate limits** | Action frequency caps per agent per time window | Max 50 emails per hour |
| **Value thresholds** | Dollar/impact limits that trigger escalation | Orders over $500 require approval |
| **Scope boundaries** | Permitted integration/action sets per agent | This agent can read Slack but not post |
| **Content filters** | Output validation before delivery | No PII in external communications |
| **Time windows** | Permitted operating hours | No customer-facing actions between 10PM–7AM |

### Enforcement Priority

```
1. Kill switch    — Is this agent suspended? → Block everything
2. Blocklist      — Is the target on a deny list? → Block + log
3. Tier check     — Does the agent's tier permit this action type? → Block + log
4. Rate limit     — Has the agent exceeded its action quota? → Block + log + alert
5. Threshold      — Does this action exceed configured limits? → Escalate for approval
6. Scope check    — Is this action within the agent's defined scope? → Block + log
7. Execute        — All checks passed → Execute + log
```

---

## Principle 5: Fail Loud, Fail Safe

**When something goes wrong, the agent stops, logs, and alerts. It never improvises past its boundaries.**

Agents should never attempt to recover from errors by expanding their own authority. An agent that can't complete a task should:

1. **Stop** the current action
2. **Log** the failure with full context
3. **Alert** the designated human or system
4. **Wait** for instructions (or fall back to a safe default state)

### Failure Modes

| Failure Type | Agent Response | Alert Level |
|-------------|---------------|-------------|
| API error / timeout | Retry with backoff (max 3), then stop and alert | P2 |
| Permission denied | Log and alert — never retry with elevated permissions | P1 |
| Confidence below threshold | Pause and escalate to human | P2 |
| Unexpected output format | Stop action, log raw output, alert | P2 |
| Kill switch triggered | Immediately cease all operations, log final state | P0 |
| Anomaly detected (by watchers) | Suspend affected actions, alert, await instructions | P1 |

### The Golden Rule

> If an agent encounters a situation not covered by its scope document, the correct action is **always** to stop and escalate — never to guess.

---

## How These Principles Connect

```
Zero Trust by Default
        │
        ▼
  Agent starts with minimal permissions
        │
        ▼
Draft → Approve → Execute
        │
        ▼
  Every action passes through governance
        │
        ▼
Everything Is Logged
        │
        ▼
  Complete audit trail for every decision
        │
        ▼
Guardrails Are Code
        │
        ▼
  Boundaries enforced programmatically
        │
        ▼
Fail Loud, Fail Safe
        │
        ▼
  When boundaries are hit, the agent stops — never improvises
```

These five principles form a closed loop. Remove any one of them and the system has a gap that will eventually produce an incident.

---

→ Next: [Permission Tiers](02-permission-tiers.md)
