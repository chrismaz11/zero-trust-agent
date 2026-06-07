# Permission Tiers

Every agent operates at exactly one tier. The tier defines what the agent can do, what approval is required, and what monitoring is in place.

## The Four Tiers

### T0 — Observer

**Capability:** Read integrations, analyze data, surface findings.

**Approval:** None required. The agent only reads — it cannot modify, send, or create anything.

**Monitoring:** Standard heartbeat. Log all read operations for audit trail.

**Use cases:**
- Monitoring channels for activity patterns
- Analyzing data and generating internal reports
- Research and competitive intelligence gathering
- Compliance scanning and risk detection

**Promotion criteria:** N/A — T0 is not a stepping stone. Some agents should stay at T0 permanently. A monitoring agent that escalates findings to humans is doing its job at T0.

---

### T1 — Drafter

**Capability:** Read + generate drafts (emails, messages, PRs, documents, reports).

**Approval:** Per-item human approval before any output leaves the system.

**Monitoring:** Standard heartbeat + approval queue tracking. Alert if pending drafts exceed 48 hours.

**Use cases:**
- Outreach email drafting
- Content generation (blog posts, social media, documentation)
- Code review comments and PR descriptions
- Report generation and data summaries
- Meeting prep and briefing documents

**This is the default tier.** All new agents start here. T1 is not a limitation — it's the correct operating mode for most agent deployments. The value of an agent that drafts well and surfaces the right information at the right time is enormous. Do not rush past T1.

**Promotion criteria:** 30 days of clean operation with:
- Zero P0 or P1 incidents
- Documented approval history (>90% approval rate)
- Owner attestation that the agent's judgment is reliable for specific action classes
- Defined rollback procedure for each action class being promoted

---

### T2 — Executor

**Capability:** Read + draft + execute pre-approved action classes.

**Approval:** Blanket approval for defined action classes. Anything outside those classes still requires per-item approval. Exceptions always escalate.

**Monitoring:** Enhanced heartbeat + anomaly detection. Real-time alerts for actions outside approved classes. Weekly review of all executed actions.

**Use cases:**
- Scheduled report delivery (same format, same recipients, same cadence)
- Routine code commits (formatting, dependency updates, generated files)
- Status update messages to defined channels
- Data pipeline operations with known input/output patterns

**Action class definition:** An action class is a specific, bounded category of action with predictable inputs and outputs. Examples:
- "Send daily standup summary to #engineering at 9 AM CT"
- "Commit dependency update PRs for non-breaking version bumps"
- "Post weekly metrics digest to #leadership"

Each action class must be documented with:
- What triggers it
- What the expected output looks like
- What constitutes an anomaly (and triggers escalation)
- How to roll it back if something goes wrong

**Promotion criteria:** 60 days of clean T2 operation with:
- Zero incidents across all action classes
- Automated rollback capability tested and documented
- Real-time monitoring with sub-5-minute anomaly detection
- Owner acceptance of full autonomous operation risk

---

### T3 — Autonomous

**Capability:** Full operational authority within scoped boundaries.

**Approval:** Post-hoc audit. Real-time alerts on anomalies.

**Monitoring:** Continuous monitoring with automated anomaly detection. Every action logged and scored. Weekly audit review. Monthly scope reassessment.

**Use cases:**
- High-frequency, well-tested workflows with established patterns
- Time-sensitive operations where human approval would create unacceptable delay
- Operations with complete automated rollback capability

**⚠️ T3 is rare.** Most agents should never reach T3. The bar is intentionally high because the risk of autonomous operation is real. A T3 agent that makes a mistake doesn't have a human catching it in real-time.

**Requirements for T3:**
- Automated rollback for every action the agent can take
- Real-time anomaly detection with automatic pause capability
- Complete audit trail with automated compliance checking
- Quarterly scope review with owner sign-off
- Defined demotion criteria (what causes automatic drop to T2)

---

## Tier Movement

### Promotion
1. Owner initiates promotion request with justification
2. Review last 30/60 days of operation logs
3. Verify zero qualifying incidents in the review period
4. Document the specific capabilities being promoted
5. Define rollback procedures for new capabilities
6. Update scope document with new tier and effective date
7. Set review date (30 days for T1→T2, 60 days for T2→T3)

### Demotion
Demotion is immediate when triggered. No review period required.

**Automatic demotion triggers:**
- Any P0 incident → Immediate drop to T0 (paused)
- Any P1 incident → Drop to T1 (draft-only)
- Owner request → Immediate, any tier
- Scope document expiry → Drop to T1 until renewal

### Lateral Movement
An agent's tier applies to its entire scope. You cannot have a T2 agent that's T3 for one integration and T1 for another. If you need different tiers for different workflows, deploy separate agents.
