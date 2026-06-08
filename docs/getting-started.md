# Getting Started

> Go from zero to a governed agent deployment in 30 minutes. This guide walks through every step.

---

## Prerequisites

- An AI agent you want to deploy (or are building)
- A place for audit logs (database, cloud logging, or even a file for prototyping)
- A review channel (Slack, email, or dashboard) for approval workflows

That's it. The framework is methodology — not a library install.

---

## Step 1: Define the Agent's Scope (10 minutes)

Copy [`templates/agent-scope-document.md`](../templates/agent-scope-document.md) and fill it out. This is the most important document in the framework — it defines what your agent is and isn't allowed to do.

**Key decisions:**

| Question | Your Answer |
|----------|-------------|
| What does this agent do? (one sentence) | |
| What systems can it read? | |
| What can it draft/propose? | |
| What can it execute without approval? | |
| What is it explicitly forbidden from doing? | |
| Who owns this agent? | |
| How do you shut it down? | |

**Start narrow.** It's always easier to expand permissions than to recover from an overpermissioned agent causing damage.

→ See [`examples/`](../examples/) for completed scope documents.

---

## Step 2: Write the System Prompt (5 minutes)

Use [`templates/system-prompt-skeleton.md`](../templates/system-prompt-skeleton.md) as your scaffold. The system prompt translates your scope document into instructions the LLM follows.

**The four sections that matter most:**

### Identity
```
You are [agent name], a [tier] agent that [one-sentence purpose].
You are owned by [team/person].
```

### Permissions
```
You CAN:
- Read: [list of systems]
- Draft: [list of output types]
- Execute: [list of auto-approved actions, if T2+]

You CANNOT:
- [Explicit list of forbidden actions]
- [Explicit list of forbidden targets]
```

### Guardrails
```
HARD RULES (never override):
- [Blocklist items]
- [Rate limits]
- [Value thresholds]
- [Escalation triggers]
```

### Failure Mode
```
When uncertain: STOP and escalate. Never guess.
When an error occurs: Log the full context and alert [owner].
When you encounter a situation not covered here: STOP and escalate.
```

---

## Step 3: Set Up Audit Logging (5 minutes)

Use [`templates/audit-log-schema.json`](../templates/audit-log-schema.json) as your log format. At minimum, every log entry needs:

```json
{
  "event_id": "unique-id",
  "timestamp_utc": "ISO-8601",
  "agent_id": "your-agent-id",
  "action_type": "what.happened",
  "outcome": "success | failed | pending_approval | blocked",
  "context": {}
}
```

**For prototyping:** Write to a JSON Lines file. One line per event, append-only.

**For production:** Use a database table with no DELETE permission, or a cloud log sink (CloudWatch, Datadog, etc.).

The key rule: **logs are append-only and signed.** If you can modify or delete a log entry, your audit trail is meaningless.

---

## Step 4: Configure Approval Workflow (5 minutes)

For your first deployment, use T1 (Drafter) — every action requires human approval.

**Simplest setup: Slack-based approval**

```
Agent drafts an action
    → Posts to a Slack channel with details
    → Includes ✅ Approve and ❌ Reject buttons
    → Human clicks one
    → Agent executes (approved) or logs rejection (rejected)
    → 24-hour timeout → auto-reject
```

**Why start at T1:** You need to see what your agent actually does before trusting it to act alone. T1 gives you a live feed of every proposed action. After 2+ weeks of reviewing, you'll know which actions are safe to auto-approve (T2) and which should stay at per-item review.

---

## Step 5: Set Up the Kill Switch (2 minutes)

Before deploying, you need a way to immediately stop the agent. This can be:

- An API endpoint that sets the agent's status to "suspended"
- A Slack command (`/kill-agent support-bot`)
- A feature flag in your config system
- A manual process (documented and tested)

**The kill switch must:**
1. Be reachable by the agent's owner and their backup
2. Take effect in under 60 seconds
3. Cancel all pending actions
4. Log the kill event
5. Alert the team

**Test it before you deploy.** A kill switch you've never tested is not a kill switch.

---

## Step 6: Run the Deployment Checklist (3 minutes)

Walk through [`framework/03-deployment-checklist.md`](../framework/03-deployment-checklist.md):

- [ ] Scope document completed and reviewed
- [ ] System prompt written with guardrails
- [ ] Audit logging operational (test: write a log entry, verify it's there)
- [ ] Approval workflow configured (test: submit a draft, approve it, verify execution)
- [ ] Kill switch configured and tested
- [ ] Monitoring/heartbeat set up
- [ ] Incident response plan documented (who gets called at 3 AM?)
- [ ] Agent deployed at T0 or T1 (never higher for first deploy)

---

## Step 7: Deploy and Observe

Deploy your agent at T1. For the first week:

- **Review every draft.** Read what the agent proposes. Approve good drafts. Reject bad ones with a reason (the reason helps you tune the prompt and guardrails).
- **Watch the audit logs.** Look for patterns: what triggers the agent, how confident it is, what errors occur.
- **Check the heartbeat.** Is the agent responding? Is it logging? Is it within its action limits?

After the first week, you'll have data to decide:
- Is the agent ready for T1 long-term? (Most agents live here permanently.)
- Are there specific action classes safe to auto-approve? (Path to T2.)
- Does the scope need adjustment? (Common — update the scope doc and system prompt.)

---

## What's Next

| Goal | Read |
|------|------|
| Understand the permission model deeply | [`framework/02-permission-tiers.md`](../framework/02-permission-tiers.md) |
| Set up proactive monitoring | [`architecture/proactive-engine.md`](../architecture/proactive-engine.md) |
| See real-world agent configurations | [`examples/`](../examples/) |
| Integrate into a multi-tenant platform | [`architecture/platform-overview.md`](../architecture/platform-overview.md) |
| Prepare for when things go wrong | [`framework/05-incident-response.md`](../framework/05-incident-response.md) |

---

## Common Mistakes

| Mistake | Why It's Dangerous | Fix |
|---------|-------------------|-----|
| Starting at T2 or T3 | You don't know what the agent will do yet | Always start at T0 or T1 |
| No kill switch | You can't stop a runaway agent | Configure and test before deploy |
| Audit logs are optional | No accountability, no debugging | Make logs non-negotiable from day one |
| Vague scope document | "Help with customer stuff" gives the agent too much latitude | Be specific: list every system, every action, every forbidden item |
| No incident response plan | First incident becomes a scramble | Write the plan before you need it |
