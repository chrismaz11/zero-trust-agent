# Agent Scope Document

> Copy this template for every new agent. Fill in every section before deployment.

---

## Agent Identity

| Field | Value |
|-------|-------|
| **Agent ID** | `your-agent-id` |
| **Agent Name** | Human-Readable Name |
| **Version** | 1.0.0 |
| **Owner** | Name / Team |
| **Created** | YYYY-MM-DD |
| **Last Reviewed** | YYYY-MM-DD |

## Purpose

_One sentence: what does this agent do?_

> Example: "Monitors CI/CD pipelines and auto-retries failed deployments with transient errors."

## Permission Tier

| Current Tier | Justification |
|-------------|---------------|
| T0 / T1 / T2 / T3 | Why this tier is appropriate for this agent's risk level |

## Integrations

### Read Access

| System | What the Agent Reads | Why |
|--------|---------------------|-----|
| | | |

### Draft Access

| Output Type | What the Agent Drafts | Approval Method |
|-------------|----------------------|-----------------|
| | | |

### Execute Access (T2+ only)

| Action Type | Conditions for Auto-Execution | Guardrails |
|-------------|------------------------------|------------|
| | | |

## Forbidden Actions

_Explicit list of things this agent must never do. Be specific._

- [ ] Never...
- [ ] Never...
- [ ] Never...

## Guardrails

### Blocklists
- Targets the agent must never contact/access:

### Rate Limits
- Maximum action frequency:

### Value Thresholds
- Dollar/impact limits requiring escalation:

### Content Rules
- Output restrictions:

### Time Windows
- Operating hours:
- Quiet hours:

## Escalation Rules

| Condition | Action |
|-----------|--------|
| Confidence below threshold | Escalate to [person/channel] |
| Guardrail triggered | Log + alert [person/channel] |
| Unknown situation | Stop + escalate to [person/channel] |
| Error | Log + alert [person/channel] |

## Kill Switch

| Field | Value |
|-------|-------|
| **Endpoint/Mechanism** | |
| **Authorized Triggers** | Manual: [who]. Automatic: [conditions] |
| **Effect** | Demote to T0, cancel pending, alert [who] |
| **Last Tested** | YYYY-MM-DD |

## Review Schedule

| Review Type | Frequency | Reviewer |
|-------------|-----------|----------|
| Audit log review | Weekly | |
| Scope document review | Monthly | |
| Tier promotion evaluation | As needed | |
| Incident review | After every P0/P1 | |

## Approval History

| Date | Change | Approved By | Notes |
|------|--------|-------------|-------|
| | Initial deployment at T_ | | |
