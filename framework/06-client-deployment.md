# Client Deployment Playbook

When deploying this framework for a client engagement, follow this 4-phase sequence. Each phase has clear deliverables and gate criteria before advancing.

---

## Phase 1 — Discovery & Scoping (Week 1–2)

### Objective
Understand the client's workflows, identify automation candidates, and produce scope documents for each proposed agent.

### Activities
1. **Workflow audit** — Map the client's current operational workflows end-to-end. Interview team members. Observe actual work (not just described work).
2. **Integration inventory** — Document every tool, platform, and data source in play. Note access requirements and existing API connections.
3. **Automation candidate identification** — Identify 3–5 workflows that are:
   - Repetitive (happen daily/weekly with similar patterns)
   - Time-consuming (>2 hours/week of human effort)
   - Structured enough for an agent to handle with guardrails
   - Low-risk enough to start with (not mission-critical on day one)
4. **Scope document drafting** — Write a scope document for each proposed agent using the [template](../templates/agent-scope-document.md).
5. **Approval workflow design** — Determine how the client prefers to review and approve agent output (Slack, email, dashboard, etc.).

### Deliverables
- [ ] Workflow audit document
- [ ] Integration inventory
- [ ] 3–5 agent scope documents (draft)
- [ ] Recommended priority order for deployment
- [ ] Approval workflow specification

### Gate Criteria
- Client has reviewed and approved scope documents
- Priority order is agreed upon
- Integration access has been granted (or timeline for access is confirmed)

---

## Phase 2 — Build & Configure (Week 3–4)

### Objective
Build the knowledge base, write system prompts, configure integrations, and set up the operational infrastructure.

### Activities
1. **Knowledge base construction** — Build the Cortex: company context, brand rules, domain knowledge, workflow-specific data. Version-control everything.
2. **System prompt engineering** — Write production system prompts using the [skeleton template](../templates/system-prompt-skeleton.md). Include all guardrails from the scope document.
3. **Integration configuration** — Connect each integration with the minimum required permissions. Read-only first, always.
4. **Logging infrastructure** — Set up the audit trail using the [log schema](../templates/audit-log-schema.json). Verify that every action type is captured.
5. **Approval surface build** — Build the approval workflow the client chose in Phase 1. Make it dead simple — one click to approve, one click to reject, easy to edit.
6. **Monitoring setup** — Configure heartbeat checks using the [monitoring protocol](04-monitoring-protocol.md). Set alert channels and escalation paths.

### Deliverables
- [ ] Knowledge base (version-controlled)
- [ ] System prompts (reviewed by client)
- [ ] Integration connections (tested, read-only)
- [ ] Logging pipeline (tested with sample data)
- [ ] Approval workflow (tested with sample drafts)
- [ ] Monitoring configuration (heartbeat running)

### Gate Criteria
- All integrations respond to health checks
- Logging captures a complete test action
- Approval workflow has been walked through by the client
- Kill switch is documented and tested

---

## Phase 3 — Dry Run & Validation (Week 5–6)

### Objective
Run agents in draft-only mode. Review every output. Build confidence that the agent produces reliable, accurate, on-brand results.

### Activities
1. **Draft-only operation** — All agents run at T1 (Drafter). Every output surfaces for review. Nothing goes live automatically.
2. **Daily review sessions** — Client reviews all agent outputs daily. Track:
   - Accuracy (is the content factually correct?)
   - Relevance (did the agent prioritize the right information?)
   - Tone (does the output match brand/communication standards?)
   - Completeness (did the agent miss anything important?)
3. **Edge case testing** — Deliberately test boundary conditions:
   - What happens with incomplete data?
   - What happens with conflicting information?
   - What happens when the agent encounters a blocklisted entity?
   - What happens during integration downtime?
4. **Guardrail iteration** — Update system prompts and guardrails based on review findings. Each update is versioned and documented.
5. **Performance scoring** — Track approval rate, edit rate, and rejection rate. Target: >85% approval rate by end of dry run.

### Deliverables
- [ ] Dry-run report (accuracy, relevance, tone scores)
- [ ] Updated system prompts (with version history)
- [ ] Edge case documentation
- [ ] Performance scorecard
- [ ] Go/no-go recommendation

### Gate Criteria
- Minimum 7 days of draft-only operation completed
- Approval rate >85%
- Zero P0 or P1 incidents during dry run
- Client sign-off on go-live

---

## Phase 4 — Launch & Operate (Week 7+)

### Objective
Promote agents to their target tier. Establish ongoing monitoring and review cadence. Transition from implementation to operations.

### Activities
1. **Tier promotion** — Promote agents from T1 to their target tier based on dry-run performance. Document the promotion with justification.
2. **Monitoring activation** — Full heartbeat monitoring active at tier-appropriate frequency.
3. **Review cadence** — Establish ongoing review schedule:
   - Weekly: review agent output quality, approval queue, error rate
   - Monthly: guardrail audit, knowledge base freshness check, scope review
   - Quarterly: full scope reassessment, tier review, client satisfaction check
4. **Knowledge base maintenance** — Schedule regular updates to keep context current. Set staleness alerts.
5. **Expansion planning** — Identify additional workflows for automation based on Phase 1 audit. Repeat the cycle for new agents.

### Deliverables
- [ ] Promotion documentation for each agent
- [ ] Ongoing monitoring dashboard (or report)
- [ ] Review cadence calendar
- [ ] Knowledge base maintenance schedule
- [ ] Expansion roadmap (optional)

### Ongoing SLAs (Managed Operations)
If providing managed operations:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agent uptime | >99% | Monthly |
| P0 response time | <1 hour | Per incident |
| P1 response time | <4 hours | Per incident |
| Knowledge base freshness | <30 days | Weekly check |
| Client review turnaround | <24 hours | Weekly |

---

## Engagement Pricing Reference

| Phase | Typical Duration | Price Range |
|-------|-----------------|-------------|
| Discovery & Scoping | 1–2 weeks | Included in deployment or $5K standalone |
| Build & Configure | 2 weeks | $15K–$40K |
| Dry Run & Validation | 1–2 weeks | Included in deployment |
| Launch & Operate | Ongoing | $3K–$10K/month |
| **Full Deployment (Phases 1–4)** | **6–8 weeks** | **$25K–$75K** |
| **Standalone Audit** | **2 weeks** | **$5K–$15K** |

Pricing scales with:
- Number of agents deployed
- Complexity of integrations
- Compliance requirements (regulated industries command premium)
- Managed operations scope (number of agents, SLA tier)
