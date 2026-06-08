# Example: CI/CD Pipeline Automation Agent

> A T2 agent that manages deployment pipelines, auto-merges green PRs, monitors deploy health, and triggers rollbacks when failure patterns are detected.

---

## Agent Scope

| Field | Value |
|-------|-------|
| **Agent ID** | `deploy-bot-prod` |
| **Tier** | T2 (Executor) — auto-executes approved action classes, escalates exceptions |
| **Purpose** | Automate CI/CD pipeline operations: merge approved PRs, trigger deployments, monitor deploy health, rollback on failure patterns |
| **Owner** | Platform Engineering Lead |

## What This Agent Does

1. **Auto-merges PRs** — When a PR passes all CI checks AND has human code review approval, the agent merges it (no additional approval needed)
2. **Triggers deployments** — On merge to main, triggers the staging deployment pipeline. Production deployments require explicit human approval.
3. **Monitors deploy health** — Watches error rates, latency, and health check endpoints for 15 minutes post-deploy
4. **Triggers rollback** — If error rate exceeds 5% within the monitoring window, drafts a rollback action and alerts the on-call engineer
5. **Reports status** — Posts deploy summaries to `#deployments` Slack channel

## Permissions

```yaml
permissions:
  read:
    - github_api           # PRs, branches, CI status, code review status
    - deploy_pipeline      # pipeline status, logs, metrics
    - monitoring           # error rates, latency, health checks
    - on_call_schedule     # who to alert
  draft:
    - slack_message        # deploy summaries, alerts
    - rollback_action      # rollback proposals (for production)
  execute:
    - pr_merge             # auto-merge green, reviewed PRs
    - deploy_staging       # auto-deploy to staging
    - slack_notification   # auto-post deploy summaries
```

## Tier Justification: Why T2

This agent auto-executes three well-defined action classes:
- **PR merge**: Only when ALL CI checks pass AND at least one human has approved the code review. The agent never overrides a failing check or skips review.
- **Staging deploy**: Automatically triggered on merge to main. Staging is a safe environment — worst case is a broken staging deploy, which is low-impact.
- **Slack notifications**: Informational messages to `#deployments`. Low risk.

Everything else — production deployments, rollbacks, infrastructure changes — requires human approval.

## Guardrails

```yaml
guardrails:
  pr_merge_rules:
    - all_ci_checks: pass            # every check must be green
    - human_review: approved         # at least 1 human approval
    - no_force_merge: true           # never force-merge
    - max_files_changed: 100         # large PRs flagged for extra review
    - blocked_paths:                 # changes to these paths require 2 reviewers
        - "infrastructure/"
        - "security/"
        - ".github/workflows/"
  
  deploy_rules:
    - staging: auto                  # auto-deploy to staging
    - production: requires_approval  # always human-approved
    - deploy_window: "09:00-16:00 UTC Mon-Thu"  # no Friday deploys
    - max_deploys_per_day: 10        # circuit breaker
  
  rollback_rules:
    - error_rate_threshold: 0.05     # 5% error rate triggers rollback draft
    - monitoring_window: 900         # 15 minutes post-deploy
    - auto_rollback: false           # rollbacks always require human approval
```

## Proactive Watchers

```yaml
watchers:
  - name: deploy_health
    data_source: monitoring
    poll_interval: 30  # seconds — tight loop during deploy window
    detection:
      - metric: error_rate
        threshold: 0.05
        window: 900
      - metric: p99_latency
        threshold: "2x baseline"
      - metric: health_check
        condition: "any_failing"
    recommendation:
      if_error_rate_high: "Draft rollback to previous version"
      if_latency_spike: "Alert on-call, suggest investigation"
      if_health_failing: "Alert on-call, suggest rollback"
    delivery: slack_alert + draft_rollback
    priority: P0

  - name: stale_pr_detector
    data_source: github_api
    schedule: "0 9 * * 1-5"  # weekday mornings
    detection:
      rule: "PR open > 5 days with no activity"
    recommendation: "Notify PR author and reviewers"
    delivery: slack_message
    priority: P3
```

## Kill Switch

```
Endpoint: POST /api/agents/deploy-bot-prod/kill
Triggers:
  - Manual: Platform engineering lead
  - Automatic: 2 consecutive failed deployments
  - Automatic: Rollback triggered (agent suspends pending review)
Action: Cancel all pending merges/deploys, alert team, await manual restart
```

## Promotion Path

This agent was promoted from T1 after:
- 3 weeks operating at T1 with 100% merge accuracy
- 0 incidents during T1 period
- Kill switch tested (confirmed working)
- Deployment to staging dry-run verified
- Platform engineering lead sign-off

**Not eligible for T3** because production deployments and rollbacks should always have a human in the loop. The cost of a bad production deploy outweighs the time saved by automating the approval.
