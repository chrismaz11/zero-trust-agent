# Deployment Checklist

Complete every item before an agent goes live. This checklist is the minimum standard — not a suggestion list. Skip a step and you're shipping ungoverned automation.

---

## 01 — Define the Agent's Scope Document

Fill out the [Agent Scope Document template](../templates/agent-scope-document.md). This is the agent's constitution — everything it can and cannot do is here.

**Verify:**
- [ ] Agent name and one-sentence purpose are clear and specific
- [ ] Operating environment is defined (platform, tools, infrastructure)
- [ ] Access tier is set (default: T1 — Drafter)
- [ ] Owner is named (the human accountable for this agent)
- [ ] Status is set to `draft` until deployment is complete

---

## 02 — Enumerate Integrations and Permission Boundaries

List every integration the agent touches. For each integration, document:
- What data it can read
- What actions it can propose (at T1) or execute (at T2+)
- What is explicitly forbidden

**Verify:**
- [ ] Every integration is listed with explicit scope
- [ ] Read vs. write permissions are distinguished
- [ ] Forbidden actions are documented (not just allowed ones)
- [ ] No implicit access — if it's not listed, it's denied
- [ ] Integration credentials are managed securely (no hardcoded keys)

---

## 03 — Write the System Prompt with Guardrails

Use the [System Prompt Skeleton](../templates/system-prompt-skeleton.md) as your scaffold. The system prompt is the agent's operating manual.

**Verify:**
- [ ] Purpose section is specific (not "be helpful")
- [ ] Access permissions match the scope document exactly
- [ ] Blocklist is populated (names, domains, resources the agent must never touch)
- [ ] Prohibited claims are defined (what the agent must never assert)
- [ ] Escalation triggers are specific and actionable
- [ ] Failure modes are defined (what happens when things go wrong)
- [ ] Brand language rules are included if the agent produces external-facing content
- [ ] System prompt has been tested with adversarial inputs

---

## 04 — Build the Knowledge Base

Assemble the context files the agent needs. Version-control everything. The agent's quality ceiling is the quality of its context.

**Verify:**
- [ ] Company context document exists and is current
- [ ] Brand rules are documented (if applicable)
- [ ] Domain-specific knowledge is structured and accessible
- [ ] Context files are version-controlled
- [ ] Stale context detection is configured (flag files not updated in >30 days)
- [ ] No sensitive information in context files that shouldn't be in the agent's scope

---

## 05 — Configure Approval Workflow

Define how drafts surface for human review. The approval step is the critical control point — make it frictionless or it won't get used.

**Options:**
- Slack thread with approve/reject reactions or buttons
- GitHub PR review workflow
- Email digest with action links
- Custom dashboard with approval queue

**Verify:**
- [ ] Approval channel is defined and accessible to the owner
- [ ] Approve, reject, and edit flows are tested
- [ ] Approval timeout is set (what happens if no one reviews within X hours)
- [ ] Bulk approval is available for routine items (at T2+)
- [ ] Rejection triggers feedback to the agent (for learning)

---

## 06 — Set Up Logging and Audit Trail

Every agent action must be logged. See [Audit Log Schema](../templates/audit-log-schema.json) for the format.

**Verify:**
- [ ] Log pipeline is configured and tested
- [ ] Every action type is captured (read, draft, send, error, approval)
- [ ] Logs include timestamp, agent ID, action type, input summary, output summary, approval status
- [ ] Logs are immutable (append-only storage)
- [ ] Retention period matches compliance requirements
- [ ] Log query capability exists (you can search and filter historical actions)
- [ ] Sensitive data is redacted from logs (PII, credentials)

---

## 07 — Run a Dry-Run Period

Operate the agent in draft-only mode for a minimum of 7 days. Review every output.

**Verify:**
- [ ] Agent is set to T1 (Drafter) regardless of target tier
- [ ] Every output is reviewed by the owner during dry run
- [ ] Accuracy is tracked (% of outputs that are correct and useful)
- [ ] False positives are documented (agent flagged something incorrectly)
- [ ] Hallucinations are documented (agent fabricated information)
- [ ] Edge cases are documented and guardrails updated
- [ ] Dry-run report is written with go/no-go recommendation
- [ ] Minimum 7 days completed with no P0 or P1 issues

---

## 08 — Document the Kill Switch

Define how to immediately disable the agent. This must be a single action.

**Options:**
- Pause the cron schedule
- Revoke the API key
- Disable the integration
- Set agent status to `paused` in scope document

**Verify:**
- [ ] Kill switch is documented in the scope document
- [ ] Kill switch is a single action (not a multi-step process)
- [ ] Kill switch has been tested (actually triggered and confirmed working)
- [ ] Kill switch is accessible to the owner at any time (not behind auth that might fail)
- [ ] Recovery procedure is documented (how to safely restart after kill switch)

---

## Go-Live Checklist

Before promoting from dry run to live:

- [ ] All 8 sections above are complete
- [ ] Scope document is finalized and version-controlled
- [ ] Dry-run report shows acceptable performance
- [ ] Owner has signed off on go-live
- [ ] First review date is scheduled (7 days post-launch)
- [ ] Scope document status changed from `draft` to `active`
