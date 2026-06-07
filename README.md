# Zero-Trust Agent Playbook

A battle-tested framework for deploying autonomous AI agents with strict guardrails, approval workflows, and audit-grade governance.

> **The ability to write code is commoditized. The ability to govern autonomous agents is not.**

---

## Why This Exists

AI agents are powerful. Ungoverned AI agents are dangerous.

Most teams deploying AI agents skip the hard parts: permission boundaries, approval workflows, audit trails, incident response. They ship a system prompt and pray.

This playbook is the alternative. It's a complete operational framework for deploying agents that **draft everything, send nothing without approval, and log every action**.

Built from real production experience running autonomous agents across GTM operations, codebase engineering, content generation, and data analysis.

## What's Inside

```
├── README.md                          ← You are here
├── framework/
│   ├── 01-core-principles.md          ← Zero-trust philosophy & mental model
│   ├── 02-permission-tiers.md         ← T0 Observer → T3 Autonomous model
│   ├── 03-deployment-checklist.md     ← 8-step go-live checklist
│   ├── 04-monitoring-protocol.md      ← Heartbeat checks & health scoring
│   ├── 05-incident-response.md        ← P0–P3 severity matrix & post-mortems
│   └── 06-client-deployment.md        ← 4-phase week-by-week playbook
├── templates/
│   ├── agent-scope-document.md        ← Fill-in-the-blanks scoping template
│   ├── system-prompt-skeleton.md      ← Production system prompt scaffold
│   ├── audit-log-schema.json          ← Structured log format
│   ├── heartbeat-config.yaml          ← Monitoring configuration template
│   └── incident-postmortem.md         ← Post-incident report template
├── examples/
│   ├── gtm-agent-scope.md             ← Example: GTM operations agent
│   ├── code-review-agent-scope.md     ← Example: Code review agent
│   └── content-agent-scope.md         ← Example: Content generation agent
└── LICENSE
```

## Core Principles

1. **Zero trust by default.** Every agent starts with no permissions. Capabilities are earned through explicit, auditable grants.
2. **The agent drafts. The human decides.** No agent sends, publishes, commits, or spends without human approval.
3. **Everything is logged.** Every read, draft, send, and error — timestamped, structured, and immutable.
4. **Guardrails are code, not suggestions.** Blocklists, permission boundaries, and escalation triggers are enforced, not recommended.
5. **Fail loud, fail safe.** When something goes wrong, the agent stops, logs, and alerts. It does not improvise.

## Permission Tiers

| Tier | Name | Capability | Approval |
|------|------|-----------|----------|
| T0 | Observer | Read data, analyze, surface findings | None (read-only) |
| T1 | Drafter | Read + generate drafts | Per-item human approval |
| T2 | Executor | Read + draft + execute approved action classes | Blanket approval; exceptions escalate |
| T3 | Autonomous | Full authority within scoped boundaries | Post-hoc audit; anomaly alerts |

**Default:** All new agents start at T1. Promotion requires documented justification.

→ Full details in [`framework/02-permission-tiers.md`](framework/02-permission-tiers.md)

## Quick Start

### 1. Scope Your Agent

Copy [`templates/agent-scope-document.md`](templates/agent-scope-document.md) and fill in:
- What the agent does (one sentence)
- What integrations it accesses (and at what permission level)
- What it's explicitly forbidden from doing
- How outputs get reviewed and approved

### 2. Write the System Prompt

Use [`templates/system-prompt-skeleton.md`](templates/system-prompt-skeleton.md) as your scaffold. The key sections:
- Purpose and identity
- Access permissions (mapped from scope doc)
- Operating rules (the non-negotiables)
- Guardrails (blocklists, prohibited actions, escalation triggers)
- Failure modes (what happens when things go wrong)

### 3. Run the Deployment Checklist

Walk through every item in [`framework/03-deployment-checklist.md`](framework/03-deployment-checklist.md):
1. Define scope → 2. Map integrations → 3. Write system prompt → 4. Build knowledge base → 5. Configure approvals → 6. Set up logging → 7. Dry run → 8. Document kill switch

### 4. Monitor and Iterate

Set up heartbeat monitoring ([`framework/04-monitoring-protocol.md`](framework/04-monitoring-protocol.md)) and know your incident response plan ([`framework/05-incident-response.md`](framework/05-incident-response.md)) before you need it.

## Who This Is For

- **Startup founders** deploying AI agents for operations, outreach, or engineering
- **Engineering teams** building agent-powered features that need governance
- **Compliance teams** evaluating AI agent deployments for regulatory requirements
- **Consultants** implementing AI automation for clients

## Contributing

This is a living document. If you've deployed agents in production and learned something the hard way, contributions are welcome.

1. Fork the repo
2. Create a branch (`feat/your-improvement`)
3. Submit a PR with context on what you learned and why it matters

## License

MIT — use it, fork it, adapt it. Attribution appreciated but not required.

---

Built by [Christopher Marziani](https://github.com/chrismaz11) from real production deployments. Not theory — practice.
