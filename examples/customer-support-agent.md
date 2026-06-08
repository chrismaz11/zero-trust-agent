# Example: Customer Support Agent

> A T1 agent that handles inbound support tickets — classifies intent, retrieves relevant documentation, drafts responses, and escalates complex issues to human agents.

---

## Agent Scope

| Field | Value |
|-------|-------|
| **Agent ID** | `support-agent-prod` |
| **Tier** | T1 (Drafter) — all customer-facing responses require human approval |
| **Purpose** | Triage inbound support tickets, draft responses using product knowledge base, and escalate issues that require human expertise |
| **Owner** | Head of Support |

## What This Agent Does

1. **Classifies incoming tickets** — Categorizes by intent (bug report, how-to, billing, feature request, account issue) and priority
2. **Retrieves context** — Pulls customer account info, recent interactions, and relevant docs via RAG
3. **Drafts responses** — Generates a response using product documentation and conversation history
4. **Routes complex issues** — Escalates to the right human agent based on category and severity
5. **Detects patterns** — Monitors for ticket volume spikes that might indicate a product incident

## Permissions

```yaml
permissions:
  read:
    - ticket_system        # incoming tickets, history, status
    - customer_db          # account info, plan, usage
    - knowledge_base       # product docs, FAQs, troubleshooting guides
    - incident_log         # active incidents (to avoid duplicate responses)
  draft:
    - ticket_response      # customer-facing replies
    - internal_note        # notes for human agents on escalated tickets
    - slack_alert          # alerts for ticket volume spikes
  execute: []              # T1 — everything needs human approval
```

## Guardrails

```yaml
guardrails:
  content_rules:
    - never_promise_timeline      # "I'll check with the team" not "this will be fixed by Friday"
    - never_share_internal_info   # no roadmap, no internal tools, no other customer data
    - never_process_refunds       # all billing actions → human
    - never_modify_accounts       # no plan changes, no password resets
    - escalate_legal              # any legal threat or compliance mention → human immediately
    - escalate_security           # any security concern → human immediately
  
  confidence_thresholds:
    respond: 0.85                 # below this, escalate instead of drafting
    escalate: 0.50                # below this, flag as "unable to classify"
  
  rate_limits:
    responses: 5/hour/customer    # prevent response flooding
    escalations: 20/hour          # if exceeding this, something is wrong — alert
  
  tone:
    style: "professional, empathetic, concise"
    forbidden: ["unfortunately", "as per our policy", "please be advised"]
    required: ["thank you for reaching out", customer_first_name]
```

## Conversation Flow

```
TICKET RECEIVED
    │
    ▼
CLASSIFY (intent + priority + confidence)
    │
    ├── Confidence ≥ 0.85 → DRAFT RESPONSE
    │                           │
    │                           ▼
    │                    SUBMIT FOR APPROVAL
    │                           │
    │                    ┌──────┴──────┐
    │                    ▼             ▼
    │               APPROVED       REJECTED
    │                    │             │
    │                    ▼             ▼
    │              SEND TO         LEARN FROM
    │              CUSTOMER        REJECTION
    │
    ├── Confidence 0.50–0.84 → DRAFT + FLAG FOR REVIEW
    │                          (lower confidence = higher priority review)
    │
    └── Confidence < 0.50 → ESCALATE TO HUMAN
                             (with all collected context)
```

## Proactive Watchers

```yaml
watchers:
  - name: volume_spike
    data_source: ticket_system
    poll_interval: 300  # 5 minutes
    detection:
      rule: "ticket_volume > 2x average for this hour of day"
    recommendation: "Possible product incident — alert engineering"
    delivery: slack_alert
    channel: "#support-alerts"
    priority: P1

  - name: response_quality
    data_source: ticket_system
    schedule: "0 9 * * 1"  # weekly Monday morning
    detection:
      rule: "Compile rejection rate, common rejection reasons, CSAT scores"
    recommendation: "Weekly quality report with improvement suggestions"
    delivery: slack_message
    channel: "#support-team"
    priority: P3
```

## Kill Switch

```
Endpoint: POST /api/agents/support-agent-prod/kill
Triggers:
  - Manual: Head of Support
  - Automatic: Rejection rate > 20% over 2 hours
  - Automatic: Customer complaint about AI response
Action: Suspend drafting, route all tickets to human queue, alert support lead
```

## Why T1 Is the Right Tier

Customer support is high-stakes communication. A single bad response can lose a customer or create a PR issue. The cost of human review (~30 seconds per response) is negligible compared to the risk of an unsupervised bad response.

**Promotion path to T2:** After 60 days at T1 with:
- Rejection rate < 3%
- CSAT score maintained or improved
- Zero escalated complaints about AI responses
- Support lead approval

Auto-approved action classes at T2 would be limited to: FAQ responses with >0.95 confidence matching a known article, ticket acknowledgment messages, and internal routing notes.
