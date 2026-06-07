# Monitoring Protocol

Every active agent runs scheduled health checks. Monitoring is not optional — an unmonitored agent is an ungoverned agent.

## Heartbeat Schedule

| Agent Tier | Minimum Frequency | Alert Channel |
|-----------|-------------------|---------------|
| T0 — Observer | Daily | Log only |
| T1 — Drafter | Daily | Owner DM |
| T2 — Executor | Twice daily | Owner DM + team channel |
| T3 — Autonomous | Continuous (5-min intervals) | Owner DM + team channel + PagerDuty |

## Health Check Matrix

Each heartbeat verifies the following:

### 1. Integration Connectivity

**What it checks:** All granted integrations respond within acceptable latency.

**Pass criteria:** Every integration returns a valid response within 10 seconds.

**Failure action:**
- Alert the owner with specific integration(s) that failed
- Pause workflows that depend on the failed integration
- Retry once after 5 minutes
- If retry fails, escalate and remain paused

### 2. Knowledge Base Freshness

**What it checks:** Context files have been updated within the defined staleness window.

**Pass criteria:** No context file older than the configured threshold (default: 30 days).

**Failure action:**
- Flag stale files in the heartbeat report
- Continue operating but mark outputs as "stale context" risk
- Request owner to review and update context files

### 3. Approval Queue Depth

**What it checks:** No pending drafts older than the configured timeout.

**Pass criteria:** All pending items are younger than 48 hours (configurable).

**Failure action:**
- Alert owner about aging items
- If items exceed 72 hours, escalate to backup approver (if configured)
- Do not auto-approve. Ever.

### 4. Error Rate

**What it checks:** Percentage of failed actions over the last 24 hours.

**Pass criteria:** Error rate below configured threshold (default: 5%).

**Failure action:**
- If error rate exceeds threshold, auto-pause the agent
- Alert owner with error summary and most common failure types
- Require manual restart after root cause review

### 5. Output Quality Spot Check

**What it checks:** Random sample of recent outputs against quality criteria.

**Pass criteria:** Sampled outputs meet accuracy, relevance, and tone standards.

**Failure action:**
- Flag anomalous outputs for manual review
- If pattern detected, update guardrails or knowledge base
- Document findings in the agent's operation log

## Heartbeat Report Format

```yaml
# Heartbeat Report
agent: [AGENT_NAME]
timestamp: 2026-06-06T14:00:00Z
tier: T1

checks:
  integration_connectivity:
    status: pass | fail | degraded
    details:
      - integration: slack
        status: pass
        latency_ms: 120
      - integration: github
        status: pass
        latency_ms: 340

  knowledge_freshness:
    status: pass | warn | fail
    stale_files: []
    oldest_file:
      path: /context/company.md
      last_updated: 2026-05-28T10:00:00Z
      age_days: 9

  approval_queue:
    status: pass | warn | fail
    pending_count: 2
    oldest_pending:
      age_hours: 4
      summary: "Draft email to [RECIPIENT]"

  error_rate:
    status: pass | warn | fail
    rate_24h: 1.2%
    total_actions: 84
    failures: 1

  quality_check:
    status: pass | warn | review_needed
    sample_size: 5
    flagged: 0

overall: healthy | degraded | critical | paused
next_check: 2026-06-07T14:00:00Z
```

## Alert Escalation

| Condition | First Alert | Escalation (if unresolved 1h) | Auto-Action |
|-----------|------------|-------------------------------|-------------|
| Integration down | Owner DM | Team channel | Pause affected workflows |
| Error rate >5% | Owner DM | Team channel | Auto-pause agent |
| Error rate >15% | Owner DM + team | Immediate escalation | Kill switch |
| Approval queue >48h | Owner DM | Backup approver | None (never auto-approve) |
| Stale context >30d | Owner DM | None | Flag outputs as "stale context" |
| Quality anomaly | Owner DM | None | Flag for manual review |

## Dashboard Recommendations

If operating more than 3 agents, build a monitoring dashboard that shows:

1. **Agent status grid** — all agents, current tier, current health status
2. **Approval queue** — pending items across all agents, sorted by age
3. **Error timeline** — error rate over time per agent
4. **Action volume** — actions per day per agent (spot trend changes)
5. **Incident log** — recent P0–P3 incidents with resolution status
