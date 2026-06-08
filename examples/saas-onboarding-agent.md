# Example: SaaS Customer Onboarding Agent

> A T1 agent that guides new customers through product setup, monitors onboarding progress, and escalates stalled accounts.

---

## Agent Scope

| Field | Value |
|-------|-------|
| **Agent ID** | `onboarding-assistant-prod` |
| **Tier** | T1 (Drafter) — all outbound communications require human approval |
| **Purpose** | Guide new customers through onboarding, answer setup questions, detect stalled onboardings, and draft follow-up communications |
| **Owner** | Customer Success Team Lead |

## What This Agent Does

1. **Greets new signups** — Drafts a personalized welcome email based on the customer's plan and stated use case
2. **Answers setup questions** — Uses RAG over product documentation to answer technical questions in-app or via chat
3. **Tracks milestones** — Monitors whether each customer completes key onboarding steps (account setup, first integration, first workflow, team invite)
4. **Detects stalls** — If a customer hasn't completed the next milestone within 48 hours, drafts a check-in message
5. **Escalates risk** — If a customer is stalled for 5+ days, alerts the account manager with context

## Permissions

```yaml
permissions:
  read:
    - customer_db           # account info, plan, signup date
    - onboarding_events     # milestone completion events
    - knowledge_base        # product docs, FAQs, setup guides
    - support_tickets       # open tickets for this customer
  draft:
    - email                 # welcome, check-in, milestone emails
    - slack_message         # internal alerts to CS team
    - in_app_message        # in-product chat responses
  execute: []               # T1 — nothing executes without approval
```

## Guardrails

```yaml
guardrails:
  blocklist:
    - enterprise_customers   # enterprise accounts handled by dedicated CSMs
  rate_limits:
    email: 3/day/customer    # max 3 emails per customer per day
    in_app: 10/day/customer  # max 10 in-app messages per customer per day
  content_rules:
    - no_pricing_changes     # never quote custom pricing
    - no_contract_terms      # never discuss contract modifications
    - escalate_billing       # any billing question → human immediately
  operating_hours: "08:00-20:00 customer_timezone"
```

## Proactive Watchers

```yaml
watchers:
  - name: stall_detector
    data_source: onboarding_events
    detection:
      rule: "next_milestone NOT completed within 48h of previous"
    recommendation: "Draft check-in email with specific guidance for the stalled step"
    delivery: draft_email  # queued for CS team approval
    
  - name: churn_risk
    data_source: onboarding_events
    detection:
      rule: "no_activity for 5+ days AND onboarding < 50% complete"
    recommendation: "Alert account manager with full onboarding context"
    delivery: slack_alert  # immediate alert to #cs-alerts
    priority: P1
```

## Approval Workflow

All outbound communications (email, in-app message) are posted to the `#onboarding-drafts` Slack channel with approve/reject buttons. The CS team reviews before anything reaches the customer.

## Kill Switch

```
Endpoint: POST /api/agents/onboarding-assistant-prod/kill
Trigger: Manual (CS team lead) or automatic (3+ rejected drafts in 1 hour)
Action: Suspend agent, cancel pending drafts, alert CS lead
```

## Why T1 and Not T2

Customer-facing communication during onboarding directly impacts retention. A bad first impression is expensive. Human review of every outbound message is worth the cost until the agent has proven reliable over 50+ successful onboardings with <3% rejection rate.

**Promotion path to T2:** After 30 days at T1 with <3% rejection rate, promote to T2 with auto-approved action classes for: milestone completion emails (templated), FAQ responses with >0.95 confidence, and internal Slack alerts. Keep check-in emails and escalation alerts at per-item approval.
