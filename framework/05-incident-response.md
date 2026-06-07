# Incident Response

When an agent produces harmful, inaccurate, or off-scope output, follow this protocol. Speed matters — especially at P0 and P1.

## Severity Matrix

### P0 — Critical

**Definition:** Agent sent unauthorized external communication, exposed PII, leaked credentials, or made false public claims.

**Examples:**
- Agent emailed a client without approval
- Agent committed code containing API keys to a public repo
- Agent posted false revenue numbers in a public channel
- Agent contacted a blocklisted entity

**Response:**
1. **Immediately** trigger the kill switch (< 5 minutes)
2. Assess blast radius — what was sent, to whom, what data was exposed
3. Notify affected parties within 1 hour
4. Preserve all logs (do not modify or delete anything)
5. Begin post-mortem within 4 hours

**Timeline:** 0–1 hour for containment. 4 hours for post-mortem start. 24 hours for full report.

---

### P1 — High

**Definition:** Agent hallucinated data in a draft, contacted a restricted entity (caught before send), violated brand rules, or produced output that would have caused harm if approved.

**Examples:**
- Agent fabricated statistics in a report draft
- Agent drafted an email to a blocklisted contact (caught in review)
- Agent used prohibited language or made prohibited claims in a draft
- Agent accessed an integration outside its scope

**Response:**
1. **Pause** the agent (within 30 minutes)
2. Review last 48 hours of output — check if similar issues went undetected
3. Identify root cause (stale context, missing guardrail, edge case)
4. Update guardrails to prevent recurrence
5. Run targeted dry run on updated guardrails before restart

**Timeline:** 0–4 hours for pause and review. 24 hours for guardrail update. Restart after validation.

---

### P2 — Medium

**Definition:** Agent produced low-quality output, missed relevant context, generated redundant work, or showed degraded judgment.

**Examples:**
- Agent drafted an email that was factually correct but tonally wrong
- Agent generated a report missing key data that was available
- Agent produced duplicate work (re-drafted something already handled)
- Agent's output quality noticeably declined over a period

**Response:**
1. Log the issue with specific examples
2. Update knowledge base or context files to address the gap
3. Continue operating with enhanced monitoring
4. Review at next scheduled check-in

**Timeline:** 24 hours for logging and context update. No immediate pause needed.

---

### P3 — Low

**Definition:** Minor formatting, tone, or timing issues. Cosmetic problems. Slightly suboptimal but not harmful output.

**Examples:**
- Agent used a slightly wrong formatting template
- Agent sent a heartbeat report 10 minutes late
- Agent's draft was acceptable but could be improved
- Agent missed a non-critical context detail

**Response:**
1. Log for next review cycle
2. No immediate action required
3. Batch with similar P3 issues for periodic guardrail refinement

**Timeline:** Next scheduled review.

---

## Post-Mortem Template

Every P0 and P1 incident generates a post-mortem. Store at `/incidents/[YYYY-MM-DD]_[AGENT]_[SUMMARY].md`.

Use the [Incident Post-Mortem Template](../templates/incident-postmortem.md).

**Post-mortem must include:**
1. **Timeline** — minute-by-minute of what happened
2. **Root cause** — not "the agent hallucinated" but WHY it hallucinated (stale context? missing guardrail? adversarial input? ambiguous instruction?)
3. **What was missed** — what monitoring or review step should have caught this earlier?
4. **Impact** — what was the actual damage? Who was affected?
5. **Remediation** — what specific changes were made to prevent recurrence?
6. **Validation** — how were the changes tested before the agent was restarted?

## Incident Tracking

Maintain a running incident log:

```markdown
| Date | Agent | Severity | Summary | Root Cause | Status |
|------|-------|----------|---------|------------|--------|
| 2026-06-01 | Viktor | P2 | Missed context in daily brief | Stale channel data | Resolved |
| 2026-05-28 | ContentBot | P1 | Hallucinated competitor pricing | No source data available | Resolved |
```

Review this log monthly. Look for patterns:
- Is one agent responsible for most incidents?
- Is one integration causing repeated failures?
- Are incidents concentrated in a specific action class?
- Is the overall incident rate trending up or down?

## Communication During Incidents

### P0 — External Communication Required
- Notify affected external parties within 1 hour
- Use factual, non-defensive language
- Explain what happened, what you're doing about it, and when you'll follow up
- Do not blame the AI — you deployed it, you're responsible

### P1 — Internal Communication Required
- Notify the team within 4 hours
- Share the root cause and remediation plan
- No external communication needed unless the draft was nearly sent

### P2/P3 — Log Only
- Document in the incident log
- Discuss at next team review if pattern emerges
