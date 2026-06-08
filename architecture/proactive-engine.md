# Proactive Intelligence Engine

> Most agents are reactive — they wait for instructions. The Proactive Engine turns agents into active monitors that watch data streams, detect anomalies, and surface actionable recommendations before problems escalate.

---

## Reactive vs. Proactive

| Reactive Agent | Proactive Agent |
|---------------|----------------|
| Answers when asked | Comes to you with insights |
| "How many deploys failed this week?" | "3 deploys failed in the last 6 hours — all from the same service. Here's the common error. Want me to open a rollback PR?" |
| Waits for instructions | Surfaces recommendations |
| Value = response quality | Value = response quality + problems caught early |

The Proactive Engine is the capability that separates a chatbot from an operations partner.

---

## Architecture: Observer + Trigger

The engine runs as a set of background **Watchers** — continuous processes that monitor defined data sources on configured schedules or event-driven triggers. When a Watcher detects an anomaly or opportunity, it generates a **Proactive Event** and routes it through the standard approval pipeline.

```
┌──────────────────────────────────────────────────┐
│                DATA SOURCES                       │
│  Databases · APIs · Metrics · Logs · Queues       │
└────────────────────┬─────────────────────────────┘
                     │ (continuous monitoring)
┌────────────────────▼─────────────────────────────┐
│                WATCHER LAYER                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Watcher  │ │ Watcher  │ │ Watcher  │  ...    │
│  │    A     │ │    B     │ │    C     │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘         │
└───────┼─────────────┼───────────┼────────────────┘
        │ (anomaly / opportunity detected)
┌───────▼─────────────▼───────────▼────────────────┐
│              AI REASONING LAYER                   │
│  Context Assembly → Recommendation Generation     │
│  → Confidence Scoring → Recipient Routing         │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              DELIVERY & APPROVAL                  │
│  Slack Alert · Email · Dashboard Flag · API Hook  │
│  → Approval Pipeline (same as all agent actions)  │
└──────────────────────────────────────────────────┘
```

**Critical rule:** Proactive events follow the same governance model as all other agent actions. A Watcher at T1 drafts recommendations for human review. A Watcher at T2 can auto-execute for approved action classes. The Proactive Engine never bypasses the permission tier system.

---

## Watcher Specification

A Watcher is a configurable background process with four components:

### 1. Data Source

What the Watcher monitors. Can be any data the agent has read access to:
- Database tables/views
- API endpoints (polled on schedule)
- Metric streams (Prometheus, Datadog, CloudWatch)
- Log streams (structured logs, error logs)
- Event queues (Kafka topics, SQS queues)
- External feeds (RSS, webhook payloads)

### 2. Detection Logic

The rules that determine when something is worth surfacing:
- **Threshold-based** — metric above/below a configured value
- **Anomaly-based** — statistical deviation from historical baseline
- **Pattern-based** — specific event sequences (e.g., 3 errors from same service in 1 hour)
- **Schedule-based** — periodic checks regardless of events (daily reconciliation, weekly summary)
- **Comparative** — cross-referencing two data sources (demand vs. capacity, scheduled vs. actual)

### 3. Recommendation Generator

When detection fires, the Watcher assembles context and generates a specific, actionable recommendation:
- What was detected (the data)
- Why it matters (the analysis)
- What the Watcher recommends (the proposed action)
- Confidence level (how certain the Watcher is)

### 4. Delivery Configuration

How and where the recommendation is delivered:
- Channel: Slack, email, SMS, dashboard, webhook, API callback
- Recipient: specific user, role-based routing, on-call schedule
- Priority: P0 (immediate) through P3 (informational)
- Quiet hours: suppress non-critical alerts during configured windows

---

## Watcher Configuration

```yaml
# Example: Deploy health watcher for a CI/CD agent
watchers:
  - name: deploy_health
    description: "Monitors deployment success rates and alerts on failure patterns"
    
    # What to monitor
    data_source:
      type: metrics_api
      endpoint: /api/v1/deployments
      poll_interval: 300  # seconds
    
    # When to fire
    detection:
      rules:
        - type: threshold
          metric: failure_rate_1h
          operator: ">"
          value: 0.15  # more than 15% failure rate
          
        - type: pattern
          event: deploy.failed
          count: 3
          window: 3600  # 3 failures in 1 hour
          group_by: service_name
          
        - type: anomaly
          metric: deploy_duration
          deviation: 2.5  # standard deviations from mean
    
    # What to recommend
    recommendation:
      template: |
        **Deploy Alert: {{service_name}}**
        
        {{failure_count}} deployments failed in the last {{window}}.
        Common error: {{most_common_error}}
        
        Recommended action: {{recommended_action}}
      
      actions:
        - type: rollback_deploy
          condition: "failure_count >= 3 AND same_error"
        - type: pause_pipeline
          condition: "failure_rate > 0.30"
        - type: notify_team
          condition: "always"
    
    # How to deliver
    delivery:
      channel: [slack, pagerduty]
      priority_map:
        failure_rate > 0.30: P0
        failure_rate > 0.15: P1
        anomaly_detected: P2
      quiet_hours: null  # deploy alerts are never suppressed
      
    # Governance
    tier: T1  # drafts recommendations, human approves actions
```

---

## Example Watcher Patterns

### For DevOps / Infrastructure Agents

| Watcher | Monitors | Detects | Recommends |
|---------|----------|---------|------------|
| **Deploy Health** | CI/CD pipeline metrics | Failure rate spikes, duration anomalies | Rollback, pipeline pause, team alert |
| **Cost Anomaly** | Cloud spend (AWS/GCP billing API) | Unexpected spend increases | Resource right-sizing, orphaned resource cleanup |
| **Dependency Monitor** | Package registries, CVE feeds | New vulnerabilities in dependencies | PR with version bump, severity-based prioritization |
| **SLA Tracker** | Uptime metrics, response times | SLA threshold approaching | Scale-up, traffic routing, customer communication |

### For Data / Analytics Agents

| Watcher | Monitors | Detects | Recommends |
|---------|----------|---------|------------|
| **Pipeline Health** | ETL job status, data freshness | Stale data, failed transformations | Re-run pipeline, alert data consumers |
| **Data Quality** | Row counts, null rates, distribution shifts | Schema drift, data anomalies | Quarantine bad data, notify upstream owners |
| **Capacity Planner** | Storage usage, query performance | Approaching limits, degrading performance | Archive old data, add indexes, scale storage |

### For Customer-Facing Agents

| Watcher | Monitors | Detects | Recommends |
|---------|----------|---------|------------|
| **Satisfaction Tracker** | Support ticket sentiment, NPS scores | Negative trend across accounts | Proactive outreach, escalation to account manager |
| **Churn Risk** | Usage metrics, engagement signals | Drop in product usage, missed renewals | Retention playbook trigger, executive alert |
| **Onboarding Progress** | New user milestones, time-to-value | Stalled onboarding, missed milestones | Check-in email, guided walkthrough, human follow-up |

---

## Learning Loops

The Proactive Engine improves over time through two feedback mechanisms:

### Short-Term: Per-Alert Feedback

Every time a recommendation is acted on or dismissed, the outcome is logged:
- Was the recommendation useful?
- Did the human approve or reject the proposed action?
- Was the alert timing appropriate?

Over time, detection thresholds auto-tune: alerts that are consistently dismissed become less sensitive; alerts that are consistently acted upon may be promoted to auto-execute (at T2+).

### Long-Term: Pattern Memory

The engine builds a statistical model of normal behavior:
- Which days/hours have higher error rates (deploy on Friday → higher alert threshold)
- Seasonal patterns (traffic spikes, quarterly close, holiday periods)
- Per-service baselines (Service A deploys 5x/day, Service B deploys 1x/week)

These baselines inform anomaly detection — the engine distinguishes between "this is unusual" and "this is unusual *for this system at this time*."

---

## Governance Integration

The Proactive Engine is powerful, but ungoverned proactive actions are more dangerous than ungoverned reactive ones — because the agent initiates them without a human prompt.

**Rules:**
1. Proactive events always pass through the approval pipeline
2. Watchers inherit the agent's permission tier
3. Auto-execute is only available at T2+ and only for pre-approved action classes
4. All proactive events are logged with the same audit schema as direct actions
5. Watcher configurations are version-controlled and require review to change

---

→ Next: [Security Model](security-model.md) · [Back to Platform Overview](platform-overview.md)
