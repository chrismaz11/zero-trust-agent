# Permission Tiers

> The four-tier model defines what an agent can do at each trust level and the requirements for promotion between tiers.

---

## The Four Tiers

### T0 — Observer

**Read-only access.** The agent can ingest data, run analysis, and surface findings — but cannot create drafts, trigger actions, or communicate externally.

**Use cases:** Data monitoring, anomaly detection, reporting dashboards, internal analytics.

```yaml
tier: T0
permissions:
  read: [database, api, logs, metrics]
  draft: []
  execute: []
human_involvement: none_required  # read-only is safe
```

**Promotion criteria to T1:**
- Scope document completed and reviewed
- System prompt written with guardrails section
- Approval workflow configured
- Audit logging confirmed operational

---

### T1 — Drafter

**Read + draft.** The agent generates proposed actions (emails, messages, code changes, orders) but every output requires per-item human approval before execution.

**Use cases:** Email drafting, PR descriptions, outreach messages, report generation, content creation.

```yaml
tier: T1
permissions:
  read: [crm, email, calendar, codebase]
  draft: [email, slack_message, pull_request]
  execute: []  # everything requires human approval
  
approval:
  mode: per_item
  reviewers: [lead_dev, product_manager]
  notify_via: [slack, email]
  auto_reject_after: 48h  # stale drafts expire
```

**Promotion criteria to T2:**
- Minimum 2 weeks operating at T1
- Rejection rate below 5% (measured over last 100 drafts)
- Zero P0/P1 incidents
- Audit log reviewed by designated owner
- Tier promotion documented with justification

---

### T2 — Executor

**Read + draft + execute approved action classes.** The agent can autonomously execute a pre-defined set of actions without per-item approval. Actions outside the approved set still require human review.

**Use cases:** Automated CI/CD workflows, routine customer responses matching approved templates, scheduled report distribution, standard data pipeline operations.

```yaml
tier: T2
permissions:
  read: [crm, email, calendar, codebase, metrics]
  draft: [email, slack_message, pull_request, report]
  execute:
    - type: email_response
      conditions:
        template: [acknowledgment, status_update, scheduling]
        confidence_min: 0.90
    - type: pr_merge
      conditions:
        all_checks_pass: true
        approved_by_human: true  # code review still required
    - type: deploy_staging
      conditions:
        branch: main
        tests_pass: true

approval:
  mode: class_based          # approved action classes execute automatically
  escalate_on: [new_action_type, low_confidence, threshold_exceeded]
  reviewers: [lead_dev]
```

**Promotion criteria to T3:**
- Minimum 30 days operating at T2
- Zero P0/P1 incidents during T2 period
- Incident response plan documented and tested
- Kill switch tested (verified working)
- Anomaly detection configured and validated
- Business owner sign-off on scope expansion

---

### T3 — Autonomous

**Full authority within scoped boundaries.** The agent operates independently. Oversight shifts from pre-approval to post-hoc audit and anomaly-triggered alerts.

**Use cases:** Production operations agents, fully automated customer communication pipelines, autonomous DevOps agents managing infrastructure.

```yaml
tier: T3
permissions:
  read: [all_scoped_systems]
  draft: [all_scoped_outputs]
  execute: [all_scoped_actions]

oversight:
  mode: post_hoc_audit
  audit_frequency: daily
  anomaly_detection:
    enabled: true
    triggers:
      - action_volume_spike: 3x_baseline
      - new_target_contacted: true
      - error_rate_above: 0.05
      - spend_above_daily: 1000
  alert_on_anomaly: [slack, pagerduty]
  
kill_switch:
  enabled: true  # always true for T3
  manual_trigger: /api/agents/{id}/kill
  automatic_triggers:
    - consecutive_errors: 5
    - anomaly_score_above: 0.8
```

**T3 is not a goal — it's a tool.** Most agents should operate at T1 or T2. T3 is reserved for well-understood, highly repetitive workflows where the cost of human review exceeds the risk of autonomous execution.

---

## Tier Promotion Process

```
Step 1: Document the promotion request
        - Current tier and requested tier
        - Duration at current tier
        - Performance metrics (rejection rate, error rate, incident count)
        - Justification for expanded permissions

Step 2: Review audit logs
        - Verify claimed metrics against actual logs
        - Check for any suppressed or ignored alerts
        - Confirm zero unresolved incidents

Step 3: Test guardrails at new tier
        - Dry run with new permissions in staging
        - Verify kill switch works
        - Verify escalation rules fire correctly

Step 4: Approve and log
        - Promotion approved by designated owner
        - New tier configuration deployed
        - Promotion event written to audit log with full context
```

### Demotion

Tier demotions are immediate and do not require a review process:
- Any P0 incident → automatic demotion to T0 (suspended)
- Any P1 incident → demotion to T1 pending review
- Rejection rate above 15% for 7 consecutive days → demotion to prior tier
- Kill switch triggered → T0 until manual review complete

---

## Quick Reference

| | T0 Observer | T1 Drafter | T2 Executor | T3 Autonomous |
|---|---|---|---|---|
| Read data | ✅ | ✅ | ✅ | ✅ |
| Generate drafts | ❌ | ✅ | ✅ | ✅ |
| Execute (with approval) | ❌ | ✅ | ✅ | ✅ |
| Execute (autonomous) | ❌ | ❌ | ✅ (defined classes) | ✅ (full scope) |
| Human review | N/A | Per item | Per exception | Post-hoc audit |
| Kill switch required | No | No | Yes | Yes |
| Anomaly detection | Optional | Optional | Recommended | Required |
| Minimum time before promotion | — | 2 weeks | 30 days | — |

---

→ Next: [Deployment Checklist](03-deployment-checklist.md)
