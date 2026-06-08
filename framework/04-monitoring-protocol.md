# Monitoring Protocol

> How to monitor agent health, detect problems early, and ensure governance is working.

---

## Heartbeat Monitoring

Every production agent runs a periodic health check. The heartbeat verifies the agent is alive, logging, and operating within expected parameters.

### Heartbeat Configuration

```yaml
# See templates/heartbeat-config.yaml for the full template
heartbeat:
  interval: 300                    # seconds (5 minutes)
  
  checks:
    - name: agent_alive
      test: "Agent process is responsive"
      method: ping | health_endpoint | process_check
      
    - name: audit_log_active
      test: "Agent has written a log entry in the last interval"
      method: query_last_log_timestamp
      
    - name: error_rate
      test: "Error rate is below threshold"
      method: count_errors_in_window
      threshold: 0.05              # 5%
      window: 3600                 # 1 hour
      
    - name: action_rate
      test: "Action rate is within expected range"
      method: count_actions_in_window
      min: 0                       # 0 = agent may be idle (okay for some agents)
      max: 500                     # suspiciously high = possible loop
      window: 3600
      
    - name: rejection_rate
      test: "Approval rejection rate is below threshold"
      method: count_rejections / count_drafts
      threshold: 0.15              # 15% — rising rejections indicate quality drop
      window: 86400                # 24 hours
```

### Health Scoring

Each heartbeat produces a health score:

| Score | Status | Meaning | Action |
|-------|--------|---------|--------|
| 100 | 🟢 Healthy | All checks passing | None |
| 75–99 | 🟡 Degraded | 1–2 non-critical checks failing | Investigate within 1 hour |
| 50–74 | 🟠 Warning | Critical check failing or multiple non-critical | Alert owner, investigate immediately |
| 0–49 | 🔴 Critical | Agent unresponsive or severe anomaly | Auto-suspend, page on-call |

### Alerting

```yaml
alerting:
  channels:
    - slack: "#agent-health"              # all health updates
    - pagerduty: "agent-incidents"        # P0/P1 only
    - email: "agent-owner@company.com"    # daily digest
  
  rules:
    - condition: health_score < 75
      action: alert_slack
      
    - condition: health_score < 50
      action: [alert_slack, page_oncall]
      
    - condition: consecutive_failures >= 3
      action: [suspend_agent, alert_all]
      
    - condition: agent_unresponsive > 600   # 10 minutes
      action: [suspend_agent, page_oncall]
```

---

## Key Metrics to Track

### Operational Metrics

| Metric | What It Tells You | Alert Threshold |
|--------|------------------|-----------------|
| **Action count** (by type) | How busy the agent is | Spike > 3x baseline |
| **Error rate** | How often actions fail | > 5% |
| **Response time** | How fast the agent processes requests | > 2x baseline |
| **Queue depth** | How many pending actions are waiting | Growing over time |
| **Uptime** | Agent availability | < 99.5% over 7 days |

### Governance Metrics

| Metric | What It Tells You | Alert Threshold |
|--------|------------------|-----------------|
| **Approval rate** | How often drafts are approved | < 85% (investigate quality) |
| **Rejection rate** | How often drafts are rejected | > 15% (quality degradation) |
| **Time-to-approval** | How long drafts wait for review | > 4 hours (reviewer bottleneck) |
| **Escalation rate** | How often the agent escalates to humans | Rising trend (scope may need adjustment) |
| **Guardrail trigger rate** | How often blocklists/limits are hit | Any spike (investigate cause) |

### Proactive Engine Metrics (if using watchers)

| Metric | What It Tells You | Alert Threshold |
|--------|------------------|-----------------|
| **Alert volume** | How many proactive events fired | Spike > 3x baseline (noisy watchers) |
| **Alert action rate** | How often alerts are acted on | < 30% (alerts may not be useful) |
| **Alert dismiss rate** | How often alerts are dismissed | > 70% (watcher thresholds too sensitive) |
| **False positive rate** | Alerts that turned out to be nothing | > 50% (detection logic needs tuning) |

---

## Dashboard Setup

Recommended dashboard layout:

```
┌─────────────────────────────────────────────────────────┐
│  AGENT HEALTH OVERVIEW                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│  │ Agent A  │ │ Agent B  │ │ Agent C  │ │ Agent D  │     │
│  │ 🟢 100   │ │ 🟡 82    │ │ 🟢 97    │ │ 🔴 23    │     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
├─────────────────────────────────────────────────────────┤
│  ACTION VOLUME (24h)          │  ERROR RATE (24h)       │
│  ▁▂▃▅▇▅▃▂▁▂▃▅▇▅▃            │  ▁▁▁▁▂▁▁▁▁▁▁▁▁▁▁▁      │
├───────────────────────────────┼─────────────────────────┤
│  APPROVAL RATE (7d)           │  ESCALATION RATE (7d)   │
│  ████████████░░ 87%           │  ██░░░░░░░░░░░░ 12%     │
├─────────────────────────────────────────────────────────┤
│  RECENT EVENTS                                          │
│  10:15  Agent B  email.drafted       pending_approval   │
│  10:12  Agent A  deploy.triggered    success             │
│  10:08  Agent C  anomaly.detected    escalated           │
│  10:01  Agent D  kill_switch         suspended            │
└─────────────────────────────────────────────────────────┘
```

---

## Monitoring Cadence

| Frequency | What to Check |
|-----------|---------------|
| **Real-time** | Heartbeat status, kill switch alerts, P0 incidents |
| **Hourly** | Error rate, action volume, queue depth |
| **Daily** | Approval/rejection rates, escalation patterns, audit log review |
| **Weekly** | Trend analysis, watcher effectiveness, governance metrics |
| **Monthly** | Tier review, scope document currency, incident retrospective |

---

→ Next: [Incident Response](05-incident-response.md)
