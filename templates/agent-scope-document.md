# Agent Scope Document

> Copy this template for each agent deployment. Fill in all `[PLACEHOLDER]` fields.
> Store as `agents/[AGENT_NAME]_scope.md` in your project.

---

```yaml
agent_name: [AGENT_NAME]
version: 1.0
owner: [HUMAN_OWNER_NAME]
created: [YYYY-MM-DD]
last_reviewed: [YYYY-MM-DD]
next_review: [YYYY-MM-DD]
status: draft | active | paused | deprecated
tier: T0 | T1 | T2 | T3
```

## Identity

- **Name:** [AGENT_NAME]
- **Purpose:** [ONE_SENTENCE — what does this agent do?]
- **Operating environment:** [Platform / tool / infrastructure]
- **Access tier:** [T0 Observer | T1 Drafter | T2 Executor | T3 Autonomous]
- **Owner:** [Name — the human accountable for this agent]
- **Backup owner:** [Name — who takes over if the owner is unavailable]

## Integrations

List every integration this agent accesses. If it's not listed here, the agent doesn't have access.

| Integration | Permission | Scope | Justification |
|-------------|-----------|-------|---------------|
| [e.g., Slack] | read + draft | [#channel-1, #channel-2] | [Why the agent needs this] |
| [e.g., GitHub] | read | [org/repo] | [Why the agent needs this] |
| [e.g., Gmail] | draft only | [account@domain.com] | [Why the agent needs this] |
| [e.g., Database] | read | [table_1, table_2] | [Why the agent needs this] |

## Guardrails

### Blocklist — NEVER Contact
<!-- Names, domains, or entities this agent must never interact with -->
- [NAME_1]
- [NAME_2]

### Forbidden Actions — NEVER Do
<!-- Actions this agent is explicitly prohibited from taking -->
- [ACTION_1]
- [ACTION_2]

### Prohibited Claims — NEVER Assert
<!-- Statements this agent must never make -->
- [CLAIM_1 — e.g., "We have X customers" unless verified]
- [CLAIM_2]

### Required Approvals — ALWAYS Get Permission
<!-- Actions that always require human approval, regardless of tier -->
- [ACTION_1 — e.g., any external communication]
- [ACTION_2 — e.g., any financial commitment]

### Escalation Triggers — ALWAYS Alert Owner
<!-- Conditions that trigger immediate escalation -->
- [CONDITION_1 — e.g., encountering PII in unexpected context]
- [CONDITION_2 — e.g., conflicting instructions from multiple sources]

## Knowledge Base

| Context File | Path | Purpose | Staleness Threshold |
|-------------|------|---------|-------------------|
| Company context | [/path/to/company.md] | [Core company information] | 30 days |
| Brand rules | [/path/to/brand.md] | [Tone, language, visual standards] | 60 days |
| Domain knowledge | [/path/to/domain.md] | [Industry-specific context] | 30 days |

## Output Rules

- **Default format:** [Slack message | Email draft | PR | PDF | Markdown]
- **Tone:** [Professional and direct | Friendly and casual | Technical and precise]
- **Delivery method:** [Slack DM to owner | Channel thread | Email | Dashboard]
- **Review cadence:** [Every output | Daily digest | Weekly review]

## Approval Workflow

- **Channel:** [Where drafts surface for review — e.g., Slack DM, #review-queue]
- **Approval method:** [Reaction emoji | Button click | PR review | Reply]
- **Timeout:** [Hours before unapproved items escalate — e.g., 48 hours]
- **Bulk approval:** [Allowed for routine items at T2+ | Not allowed]

## Monitoring

- **Heartbeat frequency:** [Daily | Twice daily | Continuous]
- **Alert channel:** [Where health alerts are sent]
- **Error rate threshold:** [Percentage that triggers auto-pause — default 5%]
- **Kill switch:** [How to immediately disable — e.g., pause cron, revoke key]

## Promotion History

| Date | From | To | Justification | Approved By |
|------|------|----|--------------|-------------|
| [YYYY-MM-DD] | — | T1 | Initial deployment | [OWNER] |

## Incident History

| Date | Severity | Summary | Resolution |
|------|----------|---------|------------|
| — | — | No incidents recorded | — |

---

*Last updated: [YYYY-MM-DD] by [NAME]*
