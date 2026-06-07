# Core Principles

The zero-trust agent framework is built on five non-negotiable principles. Every decision — from system prompt design to incident response — flows from these.

## 1. Zero Trust by Default

Every agent starts with **no permissions**. Access is granted explicitly, documented in the scope document, and auditable at any time.

This is the opposite of how most teams deploy agents. The default approach is "give the agent access to everything and hope the system prompt keeps it in line." That works until it doesn't — and when it doesn't, you have no idea what the agent accessed, modified, or sent.

**In practice:**
- New agents begin at T0 (Observer) or T1 (Drafter)
- Each integration is granted individually with explicit scope
- If an integration isn't listed in the scope document, the agent doesn't have access
- Permission escalation requires documented justification and owner approval

## 2. The Agent Drafts. The Human Decides.

No agent sends an email, publishes content, commits code, or spends money without human approval. Period.

This isn't a philosophical stance — it's a risk management decision. AI agents hallucinate. They misread context. They confidently produce wrong answers. The approval step is the firewall between "the agent thinks this is right" and "this goes to a real person."

**In practice:**
- Every output surfaces in an approval queue (Slack thread, PR review, email digest, dashboard)
- The human can approve, reject, or edit before anything goes live
- Approved actions are logged with the approver's identity and timestamp
- The agent never interprets silence as approval

## 3. Everything Is Logged

Every agent action — read, draft, send, error — is logged with:
- Timestamp (ISO 8601, UTC)
- Action type (what the agent did)
- Input summary (what triggered the action)
- Output summary (what the agent produced)
- Approval status (pending, approved, rejected, auto)
- Approver identity (who approved it)

Logs are immutable. They are not edited, deleted, or overwritten. They are retained for the compliance window defined in the scope document.

**Why this matters:**
- Post-incident investigation requires a complete timeline
- Client engagements need demonstrable audit trails
- Compliance frameworks (SOC 2, HIPAA, GDPR) require evidence of access control
- Trust is built on transparency, not promises

## 4. Guardrails Are Code, Not Suggestions

A guardrail that lives only in a system prompt is a suggestion. A guardrail that's enforced at the integration layer is a boundary.

Both matter. System prompt guardrails handle nuance (tone, brand language, judgment calls). Integration-layer guardrails handle hard limits (blocklisted contacts, forbidden actions, data access boundaries).

**In practice:**
- Blocklists are explicit: names, domains, resources that the agent cannot touch
- Permission boundaries are enforced: the agent physically cannot access systems not in its scope
- Escalation triggers fire automatically: if the agent encounters a condition it can't handle, it stops and alerts
- Kill switches exist and are tested: a single action disables the agent immediately

## 5. Fail Loud, Fail Safe

When an agent encounters an error, ambiguity, or edge case it wasn't designed for, it does three things:
1. **Stops** — does not attempt to improvise or work around the problem
2. **Logs** — records exactly what happened, what it was trying to do, and what went wrong
3. **Alerts** — notifies the human owner through the defined escalation channel

The agent never:
- Guesses when it doesn't know
- Fabricates data to fill gaps
- Retries failed actions without human review
- Assumes the problem will fix itself

**Why "fail loud" matters more than "fail gracefully":**
A graceful failure that goes unnoticed is worse than a loud failure that gets immediate attention. In agent operations, silent failures compound. A hallucinated data point that goes unnoticed becomes the basis for a decision. A misread context that goes uncorrected shapes every subsequent action. Loud failures get fixed. Silent ones metastasize.
