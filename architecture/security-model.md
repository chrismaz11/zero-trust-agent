# Security Model

> Authentication, authorization, data isolation, and financial action security for agent platforms. This is the governance layer that makes zero-trust enforceable.

---

## Authentication & Access Control

### Role-Based Access Control (RBAC)

The platform implements four user roles, each with a scoped permission set enforced at the API gateway layer — not just in application code.

| Role | Who | Permissions |
|------|-----|------------|
| **PLATFORM_ADMIN** | Platform operators | Full access to all tenants. Provisioning, billing, global config. MFA required. |
| **TENANT_ADMIN** | Agent owner / deployer | Full access to their tenant. Configure agents, approve actions, view all logs. MFA required. |
| **AGENT_OPERATOR** | Team members | Interact with agents, view dashboards, limited config. No financial actions, no scope changes. |
| **EXTERNAL_USER** | End users / API consumers | Interact with the agent only. No access to configuration, logs, or other tenant data. |

### Authentication Flow

All API requests require a signed JWT token with:
- Tenant ID
- User ID
- Role
- Expiry (15 min for operator sessions, 1 hour for external user sessions)
- Agent ID (if the request is from an agent)

```
Request → TLS → JWT Verification → Role Check → Tenant Scope Check → Action
                    │                    │                │
                    ▼                    ▼                ▼
              Token expired?      Role sufficient?    Correct tenant?
              → 401 Reject        → 403 Reject        → 403 Reject
```

### MFA Enforcement

- All TENANT_ADMIN and PLATFORM_ADMIN accounts require TOTP for login
- Any session that triggers a financial action above threshold re-prompts for TOTP
- Agent-to-agent authentication uses signed service tokens (no TOTP — agents authenticate via cryptographic identity)

---

## Data Isolation

**The highest-priority architectural requirement.** A bug, misconfiguration, or prompt injection must never allow Tenant A to access Tenant B's data.

Isolation is enforced at three independent layers — any single layer failure is caught by the others:

### Layer 1: Database Schema Isolation

Every tenant has a dedicated PostgreSQL schema (e.g., `tenant_001.*`). Application queries always include a `tenant_id` WHERE clause enforced by database middleware — not just application code.

```sql
-- Row-level security policy (defense in depth)
CREATE POLICY tenant_isolation ON actions
  USING (tenant_id = current_setting('app.current_tenant'));
  
-- Application middleware sets tenant context on every request
SET app.current_tenant = 'tenant_001';
```

### Layer 2: Vector Store Namespace Isolation

Each tenant's knowledge base embeddings live in a dedicated namespace. All similarity searches are scoped to the tenant's namespace — the search engine physically cannot return another tenant's documents.

```python
# Every RAG query is namespace-scoped
results = vector_db.query(
    embedding=query_vector,
    namespace=f"tenant_{tenant_id}",  # isolation boundary
    top_k=5
)
```

### Layer 3: Secrets Vault Isolation

API keys, credentials, and tokens for third-party integrations are stored per-tenant with path-based access control:

```
vault/
├── tenant_001/
│   ├── openai_key
│   ├── stripe_key
│   └── github_token
├── tenant_002/
│   ├── openai_key
│   └── slack_webhook
└── platform/
    ├── database_url
    └── signing_key
```

Applications can only read secrets from their own tenant path. Cross-tenant access is denied at the vault policy level.

### Encryption

| Scope | Method |
|-------|--------|
| Data at rest | AES-256 (database, file store, backups) |
| Data in transit | TLS 1.3 (all connections) |
| PII fields | Tokenized — application stores token, vault stores actual value |
| Backups | Encrypted before writing to storage |
| Audit logs | Signed with HMAC-SHA256 to detect tampering |

---

## The 4-Gate Approval Model

Actions with external consequences (API calls, messages, deployments, financial transactions) pass through a four-gate pipeline. Each gate must pass before the action proceeds.

```
┌─────────────────────────────────────────────────┐
│  Gate 1: Intent Verification                    │
│  Agent confidence ≥ 0.85 for action intent      │
│  All required entities extracted and validated   │
│  Below threshold → escalate to human             │
├─────────────────────────────────────────────────┤
│  Gate 2: Business Rules Check                    │
│  Action complies with configured rules:          │
│  - Approved targets/recipients                   │
│  - Within daily/monthly limits                   │
│  - Within operating hours                        │
│  - Not on blocklist                              │
│  Violation → block + log + notify admin          │
├─────────────────────────────────────────────────┤
│  Gate 3: Tier-Based Approval                     │
│  T0: Action blocked (read-only)                  │
│  T1: Held for per-item human approval            │
│  T2: Auto-approved if in approved action class   │
│  T3: Auto-approved within scoped boundaries      │
│  Unrecognized action → escalate regardless       │
├─────────────────────────────────────────────────┤
│  Gate 4: Execution & Audit Write                 │
│  Action executes                                 │
│  Result logged to immutable audit trail:          │
│  - Approver ID, timestamp, payload               │
│  - API response, cryptographic signature          │
│  - Full decision chain (trigger → approval)      │
│  Record cannot be modified or deleted             │
└─────────────────────────────────────────────────┘
```

### Gate 3 Detail: Approval Workflows

```yaml
# T1 agent — every action needs human sign-off
approval:
  mode: per_item
  reviewers: [admin_user_1, admin_user_2]
  notify_via: slack
  timeout: 24h
  on_timeout: auto_reject  # stale actions expire, never auto-approve

# T2 agent — approved classes execute, rest escalate
approval:
  mode: class_based
  auto_approve:
    - action: send_status_email
      conditions: {template: status_update, confidence_min: 0.92}
    - action: merge_pr
      conditions: {all_checks_pass: true, human_review: approved}
  escalate_all_others: true

# T3 agent — post-hoc audit, anomaly alerts
approval:
  mode: autonomous
  audit_frequency: daily
  anomaly_triggers:
    - action_volume: "> 3x baseline"
    - new_target: true
    - error_rate: "> 5%"
```

---

## Financial Action Security

Actions involving money — payments, orders, subscriptions, refunds — have elevated security regardless of the agent's tier:

1. **No stored payment credentials in application code.** Payment processing uses tokenized vaults (Stripe Payment Intents, etc.).
2. **Dollar thresholds trigger mandatory human approval** even for T2/T3 agents.
3. **Daily spend caps** — configurable per-agent maximum. Once hit, all financial actions are held regardless of individual amount.
4. **Dual confirmation** — financial actions above a high threshold require TOTP re-authentication from the approver.

```yaml
financial_security:
  auto_execute_below: 100        # USD — below this, T2+ agents can auto-execute
  require_approval_above: 100    # USD — above this, always require human approval
  require_mfa_above: 1000        # USD — above this, approver must re-authenticate
  daily_spend_cap: 5000          # USD — daily maximum across all actions
  approved_vendors: [stripe, aws, github]  # only these payment targets are permitted
```

---

## Audit Logging

Every action — not just financial ones — is written to an append-only audit log.

### Log Schema

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp_utc": "2026-06-07T22:15:00Z",
  "tenant_id": "tenant_001",
  "agent_id": "deploy-bot-prod",
  "agent_tier": "T2",
  "actor": "agent",
  "action_type": "deploy.triggered",
  "target": "api-service-v2.4.1",
  "payload_hash": "sha256:a1b2c3d4...",
  "outcome": "success",
  "approval": {
    "mode": "class_based",
    "auto_approved": true,
    "matched_rule": "deploy_staging_on_green_checks"
  },
  "context": {
    "trigger": "pr_merge_789",
    "commit": "abc123f",
    "confidence": 0.97
  },
  "signature": "hmac-sha256:e5f6g7h8..."
}
```

### Non-Negotiable Rules

- Append-only — no UPDATE or DELETE permissions on the audit table
- Every entry signed with HMAC-SHA256 (detects tampering)
- Dual storage — primary database + cloud log sink (CloudWatch, Datadog, etc.)
- Tenant-exportable — tenants can export their own logs via API/dashboard
- Retention minimum: 365 days (configurable upward, never downward)

---

## Incident Response Integration

The security model feeds directly into the incident response framework ([`framework/05-incident-response.md`](../framework/05-incident-response.md)):

| Security Event | Severity | Automatic Response |
|---------------|----------|-------------------|
| Unauthorized cross-tenant data access attempt | P0 | Kill switch, full audit, security review |
| Agent action rejected by all 4 gates | P2 | Log, investigate pattern |
| MFA bypass attempt | P0 | Account lock, security alert |
| Daily spend cap reached | P1 | All financial actions suspended, admin notified |
| Anomaly detection threshold exceeded | P1 | Agent suspended pending review |
| Kill switch triggered | P0 | Immediate cease all operations, log final state |

---

→ Back to: [Platform Overview](platform-overview.md) · [Proactive Engine](proactive-engine.md)
