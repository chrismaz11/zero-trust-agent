# Incident Post-Mortem

> Complete this template for every P0 and P1 incident.
> Store at `incidents/[YYYY-MM-DD]_[AGENT]_[BRIEF_SUMMARY].md`

---

## Incident Summary

| Field | Value |
|-------|-------|
| **Date** | [YYYY-MM-DD] |
| **Time detected** | [HH:MM UTC] |
| **Agent** | [AGENT_NAME] |
| **Severity** | [P0 / P1] |
| **Status** | [Investigating / Mitigated / Resolved / Closed] |
| **Owner** | [WHO_WROTE_THIS_POSTMORTEM] |

### One-Line Summary
[What happened, in one sentence. E.g., "Viktor drafted an outreach email to a blocklisted contact due to a missing entry in the guardrails file."]

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| [HH:MM] | [First indication something was wrong] |
| [HH:MM] | [Detection — how and by whom] |
| [HH:MM] | [Initial response — what was done immediately] |
| [HH:MM] | [Containment — agent paused / kill switch triggered] |
| [HH:MM] | [Investigation started] |
| [HH:MM] | [Root cause identified] |
| [HH:MM] | [Fix implemented] |
| [HH:MM] | [Agent restarted (if applicable)] |
| [HH:MM] | [Post-mortem completed] |

---

## Impact

### What happened?
[Detailed description of the incident. What did the agent do? What was the output?]

### Who was affected?
[Internal team? External contacts? Clients? No one (caught before send)?]

### What was the actual damage?
[Be honest. "No external impact — caught in draft review" is a valid answer. "Email was sent to a blocklisted contact and we had to send a follow-up apology" is also a valid answer.]

---

## Root Cause

### Surface cause
[What directly caused the incident? E.g., "The agent hallucinated a statistic."]

### Underlying cause
[Why did the surface cause happen? E.g., "The knowledge base didn't include the data the agent needed, so it fabricated a number to fill the gap."]

### Contributing factors
- [Factor 1 — e.g., "System prompt didn't explicitly instruct the agent to say 'I don't have this data' instead of estimating"]
- [Factor 2 — e.g., "The relevant context file hadn't been updated in 45 days"]
- [Factor 3 — if applicable]

---

## What Was Missed?

### Could monitoring have caught this earlier?
[Yes/No. If yes, what check would have detected it? If no, what new check would?]

### Could the approval workflow have caught this?
[Yes/No. If yes, why didn't it? If no, what review step would?]

### Were there earlier warning signs?
[Any P2/P3 issues that hinted at this? Any pattern in recent outputs?]

---

## Remediation

### Immediate fixes (already implemented)
- [ ] [Fix 1 — e.g., "Added [NAME] to the blocklist in the scope document"]
- [ ] [Fix 2 — e.g., "Updated system prompt to explicitly prohibit estimation of unverified metrics"]

### Guardrail updates
- [ ] [Update 1 — e.g., "Added a guardrail requiring citation for any numerical claim"]
- [ ] [Update 2]

### Knowledge base updates
- [ ] [Update 1 — e.g., "Updated company metrics file with current verified numbers"]
- [ ] [Update 2]

### Process changes
- [ ] [Change 1 — e.g., "Added weekly knowledge base freshness check to review cadence"]
- [ ] [Change 2]

---

## Validation

### How were fixes tested?
[Describe how you verified the fixes work. E.g., "Ran 10 test prompts designed to trigger the original failure mode. All produced correct behavior."]

### Dry-run period
[Was the agent put back through a dry-run period? How long? Results?]

---

## Lessons Learned

### What went well?
- [E.g., "Detection was fast — caught within 10 minutes"]
- [E.g., "Kill switch worked as documented"]

### What didn't go well?
- [E.g., "Root cause took 3 hours to identify because logs lacked sufficient detail"]
- [E.g., "The blocklist hadn't been reviewed in 60 days"]

### What will we do differently?
- [E.g., "Monthly blocklist audit is now scheduled"]
- [E.g., "Audit log now includes the specific data sources the agent referenced"]

---

*Post-mortem completed: [YYYY-MM-DD] by [NAME]*
*Reviewed by: [REVIEWER_NAME] on [YYYY-MM-DD]*
