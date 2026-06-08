# Configuration Reference

> Complete reference for all configurable options in the zero-trust agent framework.

---

## Agent Configuration

The core configuration for any agent. This is the source of truth for what an agent can and cannot do.

```yaml
agent:
  id: "agent-unique-id"                    # Unique identifier (lowercase, hyphens)
  name: "Human-Readable Agent Name"        # Display name
  version: "1.0.0"                         # Configuration version
  tier: T1                                 # T0 | T1 | T2 | T3
  owner: "team-or-person"                  # Responsible party
  description: "One-sentence purpose"      # What this agent does
  created: "2026-06-07"                    # Deploy date
  last_reviewed: "2026-06-07"              # Last audit review
```

---

## Permissions

```yaml
permissions:
  read:                                     # Data sources the agent can read
    - system_name_1
    - system_name_2
  
  draft:                                    # Output types the agent can generate
    - output_type_1                         # e.g., email, slack_message, pr
    - output_type_2
  
  execute:                                  # Actions the agent can auto-execute (T2+)
    - action_type_1                         # e.g., merge_pr, deploy_staging
    - action_type_2
```

### Permission Scoping

Permissions can be scoped with conditions:

```yaml
permissions:
  execute:
    - type: send_email
      conditions:
        template: [acknowledgment, status_update]   # only these templates
        confidence_min: 0.90                          # only if confidence ≥ 90%
        recipients: ["@company.com"]                  # only internal
    
    - type: merge_pr
      conditions:
        all_checks: pass
        human_review: approved
        branch: main
```

---

## Approval Workflows

### T1: Per-Item Approval

```yaml
approval:
  mode: per_item                            # every draft needs human sign-off
  reviewers:                                # who can approve
    - user_id_1
    - user_id_2
    - role: engineering_lead                # or by role
  notify_via:                               # how to notify reviewers
    - slack:
        channel: "#agent-approvals"
        mention: reviewers
    - email:
        to: reviewers
  timeout: 24h                              # time before auto-action
  on_timeout: auto_reject                   # auto_reject | escalate | remind
  require_reason_on_reject: true            # reviewer must explain rejections
```

### T2: Class-Based Approval

```yaml
approval:
  mode: class_based
  auto_approve:                             # these action classes execute without approval
    - action: send_status_email
      conditions:
        template: status_update
        confidence_min: 0.92
    - action: merge_pr
      conditions:
        all_checks: pass
        human_review: approved
    - action: deploy_staging
      conditions:
        branch: main
        tests: pass
  escalate_all_others: true                 # anything not in auto_approve → human review
  escalation_reviewers: [engineering_lead]
```

### T3: Post-Hoc Audit

```yaml
approval:
  mode: autonomous
  audit:
    frequency: daily                        # how often logs are reviewed
    reviewer: agent_owner
    report_channel: slack
  anomaly_detection:
    enabled: true
    triggers:
      - action_volume_spike: "3x baseline"
      - new_target_contacted: true
      - error_rate_above: 0.05
      - spend_above_daily: 1000
    on_anomaly: suspend_and_alert
```

---

## Guardrails

### Blocklists

```yaml
guardrails:
  blocklist:
    emails:                                 # never contact these
      - "ceo@competitor.com"
      - "*@blocked-domain.com"
    domains:
      - "competitor.com"
    users:
      - "user_id_to_avoid"
    file_paths:                             # never read/write these
      - "/secrets/*"
      - "*.env"
```

### Rate Limits

```yaml
guardrails:
  rate_limits:
    global: 200/hour                        # max total actions per hour
    per_type:
      email: 50/hour
      slack_message: 100/hour
      api_call: 500/hour
    per_target:
      email_per_recipient: 3/day            # max emails to same recipient
    burst:
      max: 20                               # max actions in any 1-minute window
      cooldown: 300                         # seconds to wait after burst limit hit
```

### Value Thresholds

```yaml
guardrails:
  thresholds:
    financial:
      auto_execute_below: 100               # USD — T2+ can auto-execute under this
      require_approval_above: 100           # USD — always require human above this
      require_mfa_above: 1000              # USD — approver must re-authenticate
      daily_cap: 5000                       # USD — daily maximum across all actions
    
    risk:
      confidence_min: 0.85                  # below this, escalate instead of acting
      max_files_changed: 100                # for code agents — large changes need extra review
      max_recipients: 50                    # for email agents — bulk sends need approval
```

### Time Windows

```yaml
guardrails:
  schedule:
    operating_hours: "08:00-20:00"          # agent timezone
    timezone: "America/Chicago"
    quiet_hours: "22:00-07:00"              # suppress non-critical actions
    blackout_dates:                         # no actions on these dates
      - "2026-12-25"
      - "2027-01-01"
    deploy_window: "09:00-16:00 Mon-Thu"    # for CI/CD agents
```

### Content Filters

```yaml
guardrails:
  content:
    forbidden_phrases:
      - "guaranteed"
      - "100% uptime"
      - any_pii_pattern                     # SSN, credit card, etc.
    required_elements:
      - disclaimer_footer                   # for customer-facing emails
      - unsubscribe_link                    # for marketing content
    max_length:
      email_body: 5000                      # characters
      slack_message: 2000
    tone: "professional"                    # used in prompt construction
```

---

## Monitoring & Heartbeat

```yaml
monitoring:
  heartbeat:
    interval: 300                           # seconds between health checks
    checks:
      - agent_responding: true              # agent process is alive
      - audit_log_writing: true             # logs are being written
      - error_rate_below: 0.05              # <5% error rate
      - last_action_within: 3600            # seconds — for active agents
    on_failure:
      alert: [slack, pagerduty]
      consecutive_failures_to_suspend: 3    # auto-suspend after 3 consecutive failures
  
  metrics:
    track:
      - action_count_by_type
      - approval_rate
      - rejection_rate
      - average_confidence
      - error_rate
      - response_time
    dashboard: grafana                      # or datadog, cloudwatch, etc.
    retention: 90d                          # metric retention period
```

---

## Kill Switch

```yaml
kill_switch:
  enabled: true                             # always true for T2+
  endpoint: "/api/agents/{id}/kill"         # API endpoint
  authorized:                               # who can trigger it
    - agent_owner
    - platform_admin
    - on_call_engineer
  automatic_triggers:
    - consecutive_errors: 5
    - anomaly_score_above: 0.8
    - kill_switch_requested: true           # from monitoring system
  on_trigger:
    - set_tier: T0                          # demote to read-only
    - cancel_pending_actions: true
    - alert:
        channels: [slack, pagerduty, email]
        message: "Kill switch triggered for {agent_id}: {reason}"
        priority: P0
    - log_final_state: true                 # capture agent state at time of kill
```

---

## Proactive Watchers

```yaml
watchers:
  - name: "watcher-name"
    description: "What this watcher monitors and why"
    enabled: true
    
    # Data source
    data_source:
      type: database | api | metrics | logs | events
      target: "connection string or endpoint"
      poll_interval: 300                    # seconds (for polling-based)
      trigger: "event.name"                 # for event-driven watchers
    
    # Detection rules
    detection:
      rules:
        - type: threshold | anomaly | pattern | schedule | comparative
          metric: "metric_name"
          operator: "> | < | == | != | between"
          value: 100
          window: 3600                      # lookback window in seconds
    
    # What to recommend
    recommendation:
      template: "Markdown template with {{variables}}"
      actions:
        - type: "action_type"
          condition: "when to recommend this"
    
    # How to deliver
    delivery:
      channels: [slack, email, dashboard, webhook]
      recipients: [user_id | role | on_call]
      priority: P0 | P1 | P2 | P3
      quiet_hours: "22:00-07:00"            # suppress non-P0 during these hours
    
    # Governance
    tier: T1                                # watcher inherits this tier for actions
```

---

## Incident Response

```yaml
incident_response:
  severity_levels:
    P0:
      description: "Agent causing active harm or data breach"
      response_time: "immediate"
      actions: [kill_switch, page_on_call, executive_notification]
    P1:
      description: "Agent malfunctioning but contained"
      response_time: "15 minutes"
      actions: [suspend_agent, alert_owner, investigate]
    P2:
      description: "Degraded performance or elevated error rate"
      response_time: "1 hour"
      actions: [alert_owner, investigate, monitor]
    P3:
      description: "Minor issue, no user impact"
      response_time: "next business day"
      actions: [log_issue, investigate_when_available]
  
  escalation:
    primary: agent_owner
    secondary: engineering_lead
    tertiary: platform_admin
    escalate_after: 15m                     # if primary doesn't respond
  
  postmortem:
    required_for: [P0, P1]
    template: "templates/incident-postmortem.md"
    due_within: "48 hours of resolution"
```

---

## Full Example

See the [`examples/`](../examples/) directory for complete agent configurations using these options in real-world scenarios.
