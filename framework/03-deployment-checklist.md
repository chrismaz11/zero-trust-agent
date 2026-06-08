# Deployment Checklist

> Walk through every item before deploying an agent to production. No shortcuts.

---

## Pre-Deployment (8 Steps)

### Step 1: Define Scope ✎

- [ ] Agent scope document completed ([`templates/agent-scope-document.md`](../templates/agent-scope-document.md))
- [ ] Single-sentence purpose defined
- [ ] All integrations listed with specific permission levels (read/draft/execute)
- [ ] Explicit list of forbidden actions
- [ ] Agent owner identified and confirmed
- [ ] Review cadence agreed (weekly? bi-weekly?)

### Step 2: Map Integrations 🔗

- [ ] Every external system the agent touches is documented
- [ ] API credentials provisioned with minimum necessary scopes
- [ ] Credentials stored in vault (never in code, never in environment files committed to git)
- [ ] Rate limits understood for each external API
- [ ] Fallback behavior defined for each integration (what happens if the API is down?)

### Step 3: Write System Prompt 📝

- [ ] System prompt written using [`templates/system-prompt-skeleton.md`](../templates/system-prompt-skeleton.md)
- [ ] Identity section matches scope document
- [ ] Permission section explicitly states what the agent can and cannot do
- [ ] Guardrails section includes blocklists, rate limits, escalation triggers
- [ ] Failure mode section defines behavior for errors, low confidence, and unknown situations
- [ ] System prompt reviewed by someone other than the author

### Step 4: Build Knowledge Base 📚

- [ ] Agent has access to all reference material it needs (docs, FAQs, policies)
- [ ] Knowledge base is scoped — agent can only access documents relevant to its task
- [ ] If using RAG: embeddings generated, retrieval tested with sample queries
- [ ] Knowledge base update process defined (who updates? how often?)

### Step 5: Configure Approval Workflow ✅

- [ ] Approval mode matches the agent's tier (per-item for T1, class-based for T2)
- [ ] Reviewers identified and notified of their responsibility
- [ ] Notification channel configured (Slack, email, dashboard)
- [ ] Timeout behavior defined (auto-reject? escalate? remind?)
- [ ] Rejection workflow defined (reviewer provides reason, agent logs it)
- [ ] Test: submit a mock draft, verify the approval flow end-to-end

### Step 6: Set Up Audit Logging 📋

- [ ] Log schema matches [`templates/audit-log-schema.json`](../templates/audit-log-schema.json)
- [ ] Logs are append-only (no UPDATE or DELETE permissions)
- [ ] Log entries are cryptographically signed
- [ ] Test: write a log entry, verify it's readable and complete
- [ ] Dual storage configured (primary DB + backup log sink)
- [ ] Log retention policy set (minimum 365 days)

### Step 7: Dry Run 🧪

- [ ] Agent deployed in staging/sandbox environment
- [ ] Run at least 20 representative scenarios
- [ ] Verify: correct intents identified
- [ ] Verify: correct actions proposed
- [ ] Verify: guardrails triggered when they should be (test edge cases)
- [ ] Verify: audit logs capture full decision chain
- [ ] Verify: approval workflow functions correctly
- [ ] Review all draft outputs for quality, tone, and accuracy

### Step 8: Kill Switch 🔴

- [ ] Kill switch endpoint/mechanism configured
- [ ] Kill switch tested (trigger it, verify agent stops, verify pending actions cancelled)
- [ ] Kill switch is accessible to agent owner AND a backup person
- [ ] Automatic kill triggers configured (consecutive errors, anomaly detection)
- [ ] Kill switch fires in under 60 seconds
- [ ] Kill event is logged

---

## Go-Live

- [ ] Agent deployed at T0 or T1 (never higher for first production deployment)
- [ ] Heartbeat monitoring active ([`framework/04-monitoring-protocol.md`](04-monitoring-protocol.md))
- [ ] Incident response plan written and reviewed ([`framework/05-incident-response.md`](05-incident-response.md))
- [ ] On-call person identified for the first 7 days
- [ ] First-week review scheduled (review logs, approval history, and performance)

---

## Post-Launch (First Week)

- [ ] Review all audit logs daily
- [ ] Track rejection rate (target: understand why rejections happen)
- [ ] Verify heartbeat has been clean (no missed checks)
- [ ] Check for any guardrail triggers (were they appropriate?)
- [ ] Gather feedback from reviewers (is the approval workflow working?)
- [ ] Document any scope adjustments needed
- [ ] Schedule tier promotion review (if applicable) for day 14+

---

## Tier Promotion Checklist (T1 → T2)

Only after 2+ weeks at T1:

- [ ] Rejection rate < 5% over last 100 drafts
- [ ] Zero P0/P1 incidents during T1 period
- [ ] Audit log reviewed and clean
- [ ] Specific auto-approved action classes identified and documented
- [ ] Kill switch re-tested
- [ ] Anomaly detection configured for T2 operation
- [ ] Promotion approved by agent owner
- [ ] Promotion event logged in audit trail

---

→ Next: [Monitoring Protocol](04-monitoring-protocol.md)
