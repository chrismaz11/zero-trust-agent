# Incident Response

> When an agent breaks, every minute of confusion costs trust. This is the playbook for handling incidents — from detection to resolution to post-mortem.

---

## Severity Matrix

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| **P0** | Critical | Agent causing active harm, data breach, or uncontrolled execution | Immediate | Sending unauthorized messages, accessing wrong tenant's data, financial actions without approval, kill switch failure |
| **P1** | High | Agent malfunctioning but impact is contained | 15 minutes | Elevated error rate, repeated incorrect outputs, approval pipeline bypass, anomaly detection triggered |
| **P2** | Medium | Degraded performance, no active harm | 1 hour | Slow response times, intermittent errors, rising rejection rate, stale knowledge base |
| **P3** | Low | Minor issue, no user impact | Next business day | Cosmetic output issues, non-critical log gaps, documentation out of date |

---

## Response Procedures

### P0 — Critical

```
MINUTE 0: DETECT
  → Kill switch triggered (automatic or manual)
  → Agent suspended at T0 (read-only)
  → All pending actions cancelled

MINUTE 0-5: CONTAIN
  → Verify kill switch took effect
  → Check: are unauthorized actions still executing?
  → If yes: escalate to infrastructure (kill the process/container)
  → Notify: agent owner + engineering lead + affected stakeholders

MINUTE 5-30: ASSESS
  → Pull audit logs for the incident window
  → Identify: what actions were taken, what data was accessed
  → Identify: root cause (prompt issue? permission config? integration failure?)
  → Determine: is there customer/user impact requiring notification?

MINUTE 30-120: REMEDIATE
  → Fix the root cause (config change, prompt update, integration fix)
  → Test the fix in staging
  → If customer impact: draft and send notification
  → Document the incident

POST-RESOLUTION:
  → Agent remains suspended until fix is verified
  → Post-mortem within 48 hours (use templates/incident-postmortem.md)
  → Update guardrails/scope to prevent recurrence
  → Consider tier demotion
```

### P1 — High

```
MINUTE 0: DETECT
  → Alert fires (monitoring, anomaly detection, or human report)
  → Agent optionally suspended (judgment call by responder)

MINUTE 0-15: ASSESS
  → Review audit logs for the flagged behavior
  → Determine: is the agent still producing bad outputs?
  → Determine: what's the blast radius?

MINUTE 15-60: REMEDIATE
  → Apply fix (prompt adjustment, config change, integration fix)
  → If agent was suspended: re-deploy with fix, monitor closely
  → If agent was not suspended: monitor for improvement

POST-RESOLUTION:
  → Post-mortem within 48 hours for repeated P1s
  → Update monitoring to catch this pattern earlier
```

### P2 — Medium

```
HOUR 0-1: ASSESS
  → Review metrics and logs
  → Determine: is this trending toward P1?

HOUR 1-4: REMEDIATE
  → Apply fix
  → Monitor for improvement

POST-RESOLUTION:
  → Log the issue and fix
  → Update monitoring thresholds if needed
```

### P3 — Low

```
→ Log the issue
→ Add to backlog
→ Fix in next maintenance window
```

---

## Incident Communication

### Internal

| Audience | Channel | When |
|----------|---------|------|
| Agent owner | Slack DM + PagerDuty (P0/P1) | Immediately on detection |
| Engineering team | #agent-incidents | P0: immediately, P1: within 15 min |
| Leadership | Email summary | P0: within 1 hour, P1: daily digest |

### External (if customer-facing agent)

| Severity | Communication |
|----------|---------------|
| P0 with customer impact | Proactive notification within 2 hours. Honest, specific, include timeline for resolution. |
| P1 with customer impact | Notification if impact lasted > 30 minutes. |
| P2/P3 | No external communication needed unless asked. |

**Template for customer notification:**

```
Subject: [Agent Name] Service Incident — [Date]

We identified an issue with [agent name] that affected [specific impact].

Timeline:
- [Time]: Issue detected
- [Time]: Agent suspended / issue contained
- [Time]: Fix applied
- [Time]: Service restored

What happened: [Brief, honest description]

What we're doing: [Prevention measures]

We apologize for the disruption. If you have questions, contact [support channel].
```

---

## Post-Mortem Template

Use [`templates/incident-postmortem.md`](../templates/incident-postmortem.md) for all P0 and P1 incidents. Key sections:

1. **Summary** — What happened, in two sentences
2. **Timeline** — Minute-by-minute from detection to resolution
3. **Root Cause** — The actual cause, not symptoms
4. **Impact** — What was affected, for how long, how many users/actions
5. **What Went Well** — What worked in the response
6. **What Went Wrong** — Where the response fell short
7. **Action Items** — Specific, assigned, with deadlines

### Post-Mortem Rules

- **No blame.** Post-mortems are about systems, not people.
- **Be specific.** "Improve monitoring" is not an action item. "Add alert for error rate > 5% on deploy-bot by June 15" is.
- **Follow up.** Action items without owners and deadlines don't get done.
- **Share learnings.** Consider contributing the anonymized pattern to this repo.

---

## Automatic Response Rules

These fire without human intervention:

| Trigger | Automatic Response |
|---------|-------------------|
| Kill switch triggered | Agent demoted to T0, pending actions cancelled, P0 alert |
| 5 consecutive errors | Agent suspended, alert owner |
| Anomaly score > 0.8 | Agent suspended, alert owner |
| Rejection rate > 20% (2h window) | Agent suspended, alert owner |
| Heartbeat failure × 3 consecutive | Agent suspended, alert owner |
| Cross-tenant data access attempt | Agent killed, security alert, P0 |

---

## Recovery Checklist

Before restarting a suspended agent:

- [ ] Root cause identified
- [ ] Fix applied and tested in staging
- [ ] Audit logs reviewed for the incident period
- [ ] No ongoing impact
- [ ] Agent restarted at current or lower tier (never promoted during recovery)
- [ ] Enhanced monitoring active for 48 hours post-restart
- [ ] Post-mortem scheduled (P0/P1) or issue logged (P2/P3)

---

→ Back to: [Deployment Checklist](03-deployment-checklist.md) · [Monitoring Protocol](04-monitoring-protocol.md)
