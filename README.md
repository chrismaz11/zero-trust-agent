<p align="center">
  <h1 align="center">🛡️ Zero-Trust Agent Framework</h1>
  <p align="center">
    <strong>Ship autonomous AI agents with built-in governance, audit trails, and kill switches.</strong>
  </p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> · <a href="docs/getting-started.md">Docs</a> · <a href="architecture/">Architecture</a> · <a href="SERVICES.md">Services</a> · <a href="#why-this-exists">Why</a> · <a href="CONTRIBUTING.md">Contribute</a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
    <img src="https://img.shields.io/badge/framework-v1.0-orange.svg" alt="Framework v1.0">
  </p>
</p>

---

> **Building AI agents is easy. Governing them in production is the hard part.**

Most agent frameworks help you *build*. This one helps you *trust*.

Zero-Trust Agent Framework is a complete methodology and reference architecture for deploying autonomous AI agents with strict permission boundaries, cryptographic audit trails, human-in-the-loop approval workflows, and automated incident response — so you can ship agents that your team, your clients, and your compliance officers can actually trust.

---

## The Problem

You've built an AI agent. It works in dev. Now what?

- **Who approved that action?** No audit trail.
- **What can this agent actually do?** No permission model.
- **Something went wrong — what happened?** No structured logs.
- **The agent is doing something unexpected — how do I stop it?** No kill switch.
- **My client wants to deploy this — how do I prove it's safe?** No governance story.

Every team deploying agents hits these walls. Most duct-tape a solution together. This framework gives you the architecture from day one.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌───────────┐  ┌───────────┐  ┌────────────────────┐ │
│   │  Agent A   │  │  Agent B   │  │     Agent C        │ │
│   │  (T1)      │  │  (T2)      │  │     (T0)           │ │
│   │  Drafter   │  │  Executor  │  │     Observer       │ │
│   └─────┬─────┘  └─────┬─────┘  └──────────┬─────────┘ │
│         │              │                    │           │
│   ┌─────▼──────────────▼────────────────────▼─────────┐ │
│   │           ZERO-TRUST GOVERNANCE LAYER             │ │
│   ├───────────────────────────────────────────────────┤ │
│   │  Permission    Approval     Audit      Kill       │ │
│   │  Engine        Workflows    Logger     Switch     │ │
│   ├───────────────────────────────────────────────────┤ │
│   │  Heartbeat     Proactive    Incident   Scope      │ │
│   │  Monitor       Watchers     Response   Enforcer   │ │
│   └───────────────────────────────────────────────────┘ │
│                                                         │
│   ┌───────────────────────────────────────────────────┐ │
│   │              INTEGRATION LAYER                    │ │
│   │  APIs · Databases · External Services · LLMs      │ │
│   └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

The framework sits *between* your agents and the outside world. Every action, every data access, every external call passes through the governance layer — logged, permissioned, and auditable.

---

## Core Principles

| # | Principle | What It Means |
|---|-----------|---------------|
| 1 | **Zero trust by default** | Every agent starts with no permissions. Capabilities are earned through explicit, auditable grants. |
| 2 | **Draft → Approve → Execute** | No agent sends, publishes, commits, or spends without passing through the approval pipeline. |
| 3 | **Everything is logged** | Every read, draft, send, and error — timestamped, structured, cryptographically signed, immutable. |
| 4 | **Guardrails are code** | Blocklists, permission boundaries, and escalation triggers are enforced programmatically, not by convention. |
| 5 | **Fail loud, fail safe** | When something goes wrong, the agent stops, logs, and alerts. It never improvises past its boundaries. |

→ Deep dive: [`framework/01-core-principles.md`](framework/01-core-principles.md)

---

## Permission Tiers

Every agent operates at one of four trust levels. Promotion is explicit and documented.

| Tier | Name | What It Can Do | Human Involvement |
|------|------|---------------|-------------------|
| **T0** | Observer | Read data, analyze, surface findings | None required (read-only) |
| **T1** | Drafter | Read + generate drafts/proposals | Per-item human approval before execution |
| **T2** | Executor | Read + draft + execute approved action classes | Blanket approval for defined actions; exceptions escalate |
| **T3** | Autonomous | Full authority within scoped boundaries | Post-hoc audit; anomaly-triggered alerts |

```
New agent deployed → Always starts at T0
                     │
                     ▼
              Promote to T1 (requires: scope doc + system prompt + approval config)
                     │
                     ▼
              Promote to T2 (requires: 2+ weeks at T1, <2% rejection rate, audit review)
                     │
                     ▼
              Promote to T3 (requires: 30+ days at T2, incident response plan, kill switch tested)
```

**Default:** All new agents start at T0 or T1. There is no fast track.

→ Full tier specification: [`framework/02-permission-tiers.md`](framework/02-permission-tiers.md)

---

## What's Inside

```
zero-trust-agent/
│
├── README.md                              ← You are here
│
├── framework/                             ← The methodology
│   ├── 01-core-principles.md              ← Philosophy and mental model
│   ├── 02-permission-tiers.md             ← T0–T3 trust model specification
│   ├── 03-deployment-checklist.md         ← 8-step go-live checklist
│   ├── 04-monitoring-protocol.md          ← Heartbeat checks, health scoring, alerting
│   ├── 05-incident-response.md            ← P0–P3 severity matrix and post-mortems
│   └── 06-integration-guide.md            ← Integrating the framework into your stack
│
├── architecture/                          ← Reference architecture (from production)
│   ├── platform-overview.md               ← Multi-tenant agent platform design
│   ├── proactive-engine.md                ← Configurable watcher/trigger system
│   └── security-model.md                  ← Auth, isolation, financial action gates
│
├── templates/                             ← Copy-paste starter configs
│   ├── agent-scope-document.md            ← Scope template for any new agent
│   ├── system-prompt-skeleton.md          ← Production system prompt scaffold
│   ├── audit-log-schema.json              ← Structured log format (JSON)
│   ├── heartbeat-config.yaml              ← Monitoring config template
│   ├── incident-postmortem.md             ← Post-incident report template
│   └── watcher-config.yaml                ← Proactive engine watcher template
│
├── examples/                              ← Real-world agent configurations
│   ├── saas-onboarding-agent.md           ← SaaS customer onboarding agent
│   ├── ci-cd-agent.md                     ← CI/CD pipeline automation agent
│   ├── customer-support-agent.md          ← Support agent with escalation rules
│   └── data-pipeline-agent.md             ← ETL/data processing agent
│
├── docs/                                  ← Extended documentation
│   ├── getting-started.md                 ← Step-by-step setup guide
│   └── configuration-reference.md         ← All config options explained
│
├── CONTRIBUTING.md                        ← How to contribute
└── LICENSE                                ← MIT
```

---

## Quick Start

### 1. Scope your agent

Copy [`templates/agent-scope-document.md`](templates/agent-scope-document.md) and define:
- **What** the agent does (one sentence)
- **What** integrations it touches (and at what permission level)
- **What** it is explicitly forbidden from doing
- **How** outputs get reviewed

### 2. Write the system prompt

Use [`templates/system-prompt-skeleton.md`](templates/system-prompt-skeleton.md). The key sections:
- Identity and purpose
- Permission tier and access rules
- Guardrails (blocklists, prohibited actions, escalation triggers)
- Failure modes (what to do when things break)

### 3. Configure the governance layer

Set up the approval workflow, audit logging, and monitoring:

```yaml
# Example: T1 Drafter agent config
agent:
  name: "support-assistant"
  tier: T1
  
permissions:
  read: [crm, knowledge_base, ticket_system]
  draft: [email_responses, ticket_updates]
  execute: []  # T1 cannot execute — all drafts require approval

approval:
  mode: per_item          # every draft needs human sign-off
  notify: [slack, email]
  timeout_hours: 24       # escalate if no response in 24h

audit:
  log_reads: true
  log_drafts: true
  log_approvals: true
  retention_days: 365
  signature: hmac-sha256

monitoring:
  heartbeat_interval: 300  # seconds
  alert_on_silence: true
  health_checks: [response_time, error_rate, rejection_rate]

kill_switch:
  enabled: true
  trigger: [manual, error_threshold, anomaly_detection]
  action: suspend_and_alert
```

### 4. Deploy and monitor

Run the [`framework/03-deployment-checklist.md`](framework/03-deployment-checklist.md) before go-live. Set up heartbeat monitoring ([`framework/04-monitoring-protocol.md`](framework/04-monitoring-protocol.md)). Know your incident playbook ([`framework/05-incident-response.md`](framework/05-incident-response.md)).

→ Full walkthrough: [`docs/getting-started.md`](docs/getting-started.md)

---

## Reference Architecture

The `architecture/` directory contains a complete, production-tested reference design for building a multi-agent platform on zero-trust principles. It covers:

| Document | What It Covers |
|----------|---------------|
| [`platform-overview.md`](architecture/platform-overview.md) | Multi-tenant architecture, intent engine, memory management, conversation FSM, business logic layer |
| [`proactive-engine.md`](architecture/proactive-engine.md) | Developer-configurable watcher system — background processes that monitor data and surface actionable recommendations |
| [`security-model.md`](architecture/security-model.md) | RBAC, JWT auth, data isolation (schema + vector + vault), 4-gate approval model, financial action security |

This isn't theory. It's extracted from a production agent platform handling real business operations.

---

## Who This Is For

- **Developers** building AI agents that need to operate safely in production
- **Engineering teams** adding agent capabilities to existing products
- **AI/automation agencies** deploying agents for clients who need governance guarantees
- **Dev tool builders** creating agent platforms, orchestrators, or SDKs
- **Security & compliance teams** evaluating agent deployments

---

## Design Philosophy

### Agents are employees, not tools.

You wouldn't give a new employee admin access on day one. You'd start them with limited access, review their work, expand their permissions over time, and have a plan for when things go wrong.

The zero-trust framework applies the same logic to AI agents:

- **Onboarding** → Scope document + system prompt + T0 deployment
- **Supervised work** → T1 drafting with human review
- **Earned autonomy** → T2/T3 promotion after proven reliability
- **Accountability** → Immutable audit logs for every action
- **Incident response** → Documented procedures for when things break

### Open core, not vendor lock-in.

The framework is methodology-first. It works with any LLM, any cloud, any orchestration tool. The patterns are the product — not a proprietary SDK you can't escape.

---


---

## Professional Services

The framework is free and open source. If you want hands-on help:

| Service | Starting At | What You Get |
|---------|------------|--------------|
| **Agent Audit** | $1,500 | Permission gap analysis, risk assessment, remediation roadmap |
| **Full Deployment** | $5,000 | End-to-end implementation, training, monitoring setup |
| **Managed Governance** | $500/mo | Ongoing monitoring, incident response, quarterly reports |

→ Details: [`SERVICES.md`](SERVICES.md) · Email: [christopher@trustsignal.dev](mailto:christopher@trustsignal.dev)


## Contributing

This framework improves every time someone deploys agents in production and shares what they learned. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

**Good contributions:**
- Production war stories (what broke and how you fixed it)
- New agent scope examples
- Improvements to templates based on real usage
- Security model extensions
- Translations

---

## License

[MIT](LICENSE) — use it, fork it, build products on top of it. Attribution appreciated.

---

<p align="center">
  Built by <a href="https://github.com/chrismaz11">Christopher Marziani</a> from production agent deployments.<br>
  Not theory — practice.
</p>
