# Integration Guide

> How to integrate the zero-trust framework into your existing agent stack — regardless of what LLM, orchestration tool, or cloud provider you use.

---

## The Framework Is Methodology, Not a Library

This isn't an SDK you install. It's a set of patterns you implement in your own stack. The framework works with:

- **Any LLM** — OpenAI, Anthropic, Google, open-source models, fine-tuned models
- **Any orchestration** — LangChain, CrewAI, AutoGen, custom code, no framework at all
- **Any cloud** — AWS, GCP, Azure, self-hosted
- **Any language** — Python, TypeScript, Go, Rust — the patterns are language-agnostic

---

## Integration Points

There are six places where the framework touches your code:

### 1. Agent Registration

When you deploy a new agent, register it with the governance layer:

```python
# Pseudocode — adapt to your stack
agent = governance.register_agent(
    agent_id="support-bot-v2",
    tier="T1",
    scope={
        "read": ["ticket_db", "knowledge_base", "customer_crm"],
        "draft": ["email_response", "ticket_update"],
        "execute": [],
    },
    guardrails={
        "blocklist": ["vip-customers.csv"],
        "rate_limit": "100 actions/hour",
        "operating_hours": "06:00-22:00 UTC",
    },
    owner="engineering-team",
    kill_switch_url="/api/agents/support-bot-v2/kill",
)
```

### 2. Pre-Action Check

Before every action with external consequences, call the governance layer:

```python
# Your agent wants to send an email
proposed_action = {
    "type": "send_email",
    "target": "customer@example.com",
    "payload": {"subject": "...", "body": "..."},
    "confidence": 0.93,
}

# Governance check — runs through all 4 gates
decision = await governance.check(agent_id, proposed_action)

if decision.approved:
    result = await send_email(proposed_action["payload"])
    await governance.log_execution(agent_id, proposed_action, result)
elif decision.needs_approval:
    await governance.submit_for_review(agent_id, proposed_action)
elif decision.blocked:
    await governance.log_block(agent_id, proposed_action, decision.reason)
```

### 3. Audit Logging

Wrap every action — read, draft, execute, error — in a structured log entry:

```python
await audit.log({
    "agent_id": "support-bot-v2",
    "tier": "T1",
    "action_type": "email.drafted",
    "target": "customer@example.com",
    "payload_hash": sha256(payload),
    "outcome": "pending_approval",
    "context": {"trigger": "ticket_456"},
})
```

### 4. Approval Pipeline

Implement the approval flow that matches each tier:

```
T0: No actions to approve (read-only)
T1: Queue → Notify reviewer → Wait for approval → Execute or reject
T2: Check action class → Auto-approve if matched → Escalate if not
T3: Execute → Log → Anomaly check (post-hoc)
```

For T1/T2, you need a review interface. Options:
- Slack bot with approve/reject buttons
- Dashboard UI with action queue
- Email with signed approval links
- API endpoint for programmatic approval

### 5. Heartbeat Monitor

Run a periodic health check on every active agent:

```yaml
# cron: every 5 minutes
heartbeat:
  check:
    - agent_responding: true
    - error_rate_below: 0.05
    - last_action_within: 1h  # for active agents
    - audit_log_writing: true
  on_failure:
    - alert: [slack, pagerduty]
    - if_consecutive_failures: 3
      action: suspend_agent
```

### 6. Kill Switch

Every agent must have a kill switch — a mechanism to immediately cease all operations:

```python
# Kill switch endpoint
@app.post("/api/agents/{agent_id}/kill")
async def kill_agent(agent_id: str, reason: str):
    agent = await governance.get_agent(agent_id)
    
    # Immediately suspend
    agent.tier = "T0"  # demote to read-only
    agent.status = "suspended"
    
    # Cancel all pending actions
    await governance.cancel_pending_actions(agent_id)
    
    # Log the kill event
    await audit.log({
        "agent_id": agent_id,
        "action_type": "kill_switch.triggered",
        "reason": reason,
        "outcome": "agent_suspended",
        "pending_actions_cancelled": True,
    })
    
    # Alert
    await notify.send(
        channel="pagerduty",
        message=f"Kill switch triggered for {agent_id}: {reason}",
        priority="P0",
    )
```

---

## Implementation Checklist

Use this when integrating the framework into an existing project:

- [ ] Agent registration — every agent has an ID, tier, scope, and owner
- [ ] Pre-action governance check — 4-gate pipeline before external actions
- [ ] Audit logging — structured, signed, append-only
- [ ] Approval pipeline — per-item (T1), class-based (T2), or post-hoc (T3)
- [ ] Heartbeat monitoring — periodic health checks with alerting
- [ ] Kill switch — tested and working before production deployment
- [ ] Guardrails — blocklists, rate limits, thresholds enforced in code
- [ ] Tier management — promotion/demotion process documented
- [ ] Incident response — playbook written and reviewed
- [ ] Data isolation — if multi-tenant, verified at all storage layers

---

## Common Patterns

### Pattern: Slack-Based Approval for T1 Agents

The simplest approval workflow for small teams:

```
Agent drafts action → Posts to #agent-approvals Slack channel
                      with action details + ✅/❌ buttons
                      → Human clicks ✅ → Action executes
                      → Human clicks ❌ → Action rejected, reason logged
                      → 24h timeout → Auto-rejected
```

### Pattern: GitHub PR-Based Governance for Code Agents

For agents that write or modify code:

```
Agent creates branch → Opens PR with changes
                       → CI runs tests + security scans
                       → Human reviews code
                       → Merge = approval → Deploy pipeline triggers
                       → Close = rejection → Agent notified
```

### Pattern: Dashboard Queue for High-Volume Agents

For T2 agents generating many actions that need occasional escalation:

```
Agent auto-executes approved action classes → Logged to dashboard
Agent encounters non-standard action → Queued in dashboard
                                       → Admin reviews queue daily
                                       → Approve/reject with notes
                                       → Agent learns from feedback
```

---

→ Back to: [Deployment Checklist](03-deployment-checklist.md) · [Monitoring Protocol](04-monitoring-protocol.md)
