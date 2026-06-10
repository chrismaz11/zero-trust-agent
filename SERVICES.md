# ZTA Cloud & Professional Services

> The Zero-Trust Agent Framework and CLI are **free and open source** (MIT License).
> We offer ZTA Cloud (SaaS control plane) for production operations and compliance, alongside hands-on consulting services.

---

## ZTA Cloud (SaaS Platform)

Deploying agents into production introduces complexity around monitoring, alerting, immutable audit trails, and multi-user approvals. ZTA Cloud handles this for you out-of-the-box.

### 1. ZTA Developer (OSS) — $0/mo
*Best for local development and prototyping.*
- Local CLI onboarding tool (`npx zta`)
- Local file-based audit trails (`zta-config.yaml`)
- Local command-line manual approval prompt workflows
- Standard file-appended logging

### 2. ZTA Cloud Team — $49/mo per agent
*Best for production teams deploying client-facing or infrastructure agents.*
- **Centralized Secure Ledger:** Cryptographically signed logs streamed directly to our hosted, immutable log database.
- **Active Approval Routing:** Approve or reject Tier 1 Drafter proposals directly via a Slack, MS Teams, or Email webhook. No local CLI review required.
- **Web Console Dashboard:** Live operational dashboard to view active agents, update permission maps in real-time, inspect audit logs, and configure limits.
- **Active Heartbeat Alerts:** Automated agent health checks with SMS/PagerDuty pager alerts if your agent goes offline or crashes.
- **Compliance Exporting:** One-click SOC 2 Type II and GDPR ready compliance audit logs.

### 3. ZTA Enterprise — Custom Pricing
*Best for organizations deploying multiple agents at scale in regulated environments.*
- Everything in Cloud Team
- Single Sign-On (SSO / SAML) integration
- Role-Based Access Control (RBAC) approval chains (e.g. multiple approvers required for high-value actions)
- Custom log sinks (stream directly to Splunk, Datadog, AWS CloudWatch, or a private Postgres instance)
- Threat-model anomaly detection scanning and instant policy violation locks
- 24/7 technical support with defined SLAs

*To get started with ZTA Cloud, run `npx zta` in your project and select "ZTA Cloud Team Central Control Plane" during setup.*

---

## Professional Services

If you want hands-on help implementing the framework or auditing your setup:

### Agent Audit — $1,500+

**One-time assessment · Delivered in 5 business days**

We review your current agent deployment and deliver a written report covering:

- Permission gap analysis — what your agents can access vs. what they should
- Risk assessment — where uncontrolled agent actions could cause harm
- Audit trail evaluation — can you answer "what happened?" after an incident
- Remediation roadmap — prioritized steps to reach governed deployment

Best for: Teams that have agents in production (or heading there) and want an expert review before something goes wrong.

---

## Full Deployment — $5,000+

**4–6 week engagement**

We implement the framework end-to-end in your environment:

- Everything in the Audit
- Permission tier configuration (T0–T3) for each agent
- Approval workflow integration with your existing tools (Slack, Teams, email)
- Cryptographic audit logging with your storage backend
- Kill switch and monitoring setup
- Incident response runbook customized to your org
- Team training session (recorded)

Best for: Teams deploying 2+ agents that need governance from day one, or teams with compliance requirements (SOC 2, HIPAA, FedRAMP).

---

## Managed Governance — $500/month

**Ongoing support**

We monitor and maintain your agent governance layer:

- Monthly governance review and report
- Incident response support (4-hour SLA)
- Permission tuning as your agents evolve
- Agent health monitoring and alerting
- Quarterly compliance-ready reports

Best for: Teams that want a governance expert on retainer without hiring one.

---

## Enterprise & Custom

For organizations deploying 10+ agents, needing custom integrations, or operating in highly regulated environments — [reach out directly](mailto:christopher@trustsignal.dev).

---

## Get Started

1. **Self-serve:** Clone the repo, follow the [Getting Started guide](docs/getting-started.md), deploy governed agents for free.
2. **Need help?** Email [christopher@trustsignal.dev](mailto:christopher@trustsignal.dev) — we'll scope the right engagement.

