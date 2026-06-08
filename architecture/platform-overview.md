# Platform Architecture Overview

> Reference architecture for a multi-tenant agent platform built on zero-trust principles. Extracted from a production deployment — adapt to your stack.

---

## Architecture Layers

A zero-trust agent platform has five layers. Each layer has a single responsibility and communicates with adjacent layers through defined interfaces.

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHANNEL LAYER                              │
│   API Endpoints · Webhooks · Chat · CLI · Scheduled Triggers    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      GATEWAY LAYER                              │
│   Auth (JWT) · Rate Limiting · Tenant Router · TLS Termination  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      AI CORE LAYER                              │
│   Intent Engine · Context Manager · Conversation FSM            │
│   Business Rules Engine · Permission Enforcer                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      ACTION LAYER                               │
│   Developer-Configured Action Modules · Approval Pipeline       │
│   External API Integrations · Webhook Dispatch                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      DATA & STORAGE LAYER                       │
│   Tenant DB (schema-isolated) · Vector Store · Audit Log        │
│   Secrets Vault · File Store                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Details

### 1. Channel Layer

The entry point for all agent interactions. Channels are pluggable — the platform doesn't care *how* a request arrives, only that it reaches the Gateway in a standardized format.

**Common channels for developer platforms:**
- REST API endpoints (programmatic agent invocation)
- Webhook receivers (GitHub events, Stripe webhooks, monitoring alerts)
- Chat integrations (Slack, Discord, Teams)
- CLI tools (developer-facing command line interface)
- Scheduled triggers (cron-based periodic tasks)
- Event streams (Kafka, SQS, pub/sub)

**Design principle:** Channels are stateless. They accept input, normalize it into a standard request envelope, and pass it to the Gateway. No business logic lives in the channel layer.

### 2. Gateway Layer

Authentication, authorization, rate limiting, and routing. Every request passes through here before reaching the AI core.

**Key responsibilities:**
- **JWT validation** — Verify signed tokens, extract tenant ID, user ID, and role
- **Rate limiting** — Per-tenant, per-agent, and per-action-type quotas
- **Tenant routing** — Direct the request to the correct tenant's isolated context
- **TLS termination** — All traffic encrypted in transit
- **Kill switch check** — Before routing, verify the target agent is not suspended

```
Request → [TLS] → [JWT Verify] → [Rate Limit] → [Kill Switch Check] → [Tenant Route] → AI Core
```

### 3. AI Core Layer

The brain of the agent. This layer determines intent, manages context, enforces business rules, and decides what action (if any) to take.

**Components:**

| Component | Purpose |
|-----------|---------|
| **Intent Engine** | Classifies incoming messages/events into defined action categories |
| **Context Manager** | Assembles the agent's working context from session memory, persistent memory, and retrieved knowledge |
| **Conversation FSM** | Manages conversation state transitions: greeting → intent resolution → slot filling → confirmation → execution → resolution |
| **Business Rules Engine** | Validates proposed actions against tenant-configured rules (limits, schedules, approved targets) |
| **Permission Enforcer** | Checks the agent's tier and scope before allowing any action to proceed |

**Intent Engine pipeline:**

```
Raw Input
    │
    ▼
Input Normalization (clean, standardize)
    │
    ▼
Intent Classification (LLM-powered, confidence scored)
    │
    ▼
Entity Extraction (structured data slots)
    │
    ▼
Confidence Check
    ├── ≥ 0.85 → Route to action handler
    ├── 0.50–0.84 → Ask clarifying question
    └── < 0.50 → Escalate to human
```

**Context assembly (per request):**

```
1. Platform-level rules        (safety, escalation, universal guardrails)
2. Agent configuration         (identity, tier, permissions, scope)
3. Action permissions          (which modules are enabled for this agent)
4. Retrieved knowledge         (RAG — semantic search over the agent's knowledge base)
5. Session history             (recent conversation turns)
6. Current task context        (extracted entities, pending confirmations)
```

### 4. Action Layer

Where agents interface with the outside world. Every external action — API call, message send, database write, deployment trigger — passes through the action layer.

**Key design decisions:**

- **Actions are developer-configured modules.** The framework doesn't ship with hard-coded actions. Developers define their own action types and register them with the governance layer.
- **Every action passes through the approval pipeline** before execution (the pipeline behavior depends on the agent's tier).
- **Action results are always logged** — success, failure, partial completion, timeout.

**Action module structure:**

```python
# Developer defines an action module
class SendEmailAction(ActionModule):
    name = "send_email"
    tier_required = "T1"  # minimum tier to use this action
    
    # What the agent needs to provide
    required_entities = ["recipient", "subject", "body"]
    
    # Guardrails
    blocklist = ["ceo@competitor.com", "legal@*"]
    rate_limit = "50/hour"
    
    # Approval configuration
    approval_mode = "per_item"  # for T1; overridden by tier-level config
    
    async def validate(self, payload):
        """Pre-execution validation. Return errors if payload is invalid."""
        ...
    
    async def execute(self, payload, approval):
        """Execute the action. Only called after approval."""
        ...
    
    async def rollback(self, execution_result):
        """Undo the action if possible. Called on errors or manual reversal."""
        ...
```

### 5. Data & Storage Layer

Tenant-isolated data storage. The critical principle: **a configuration error or application bug must never allow Tenant A to access Tenant B's data.**

| Store | Purpose | Isolation Method |
|-------|---------|-----------------|
| **Tenant DB** (PostgreSQL) | Agent config, conversation history, CRM data, job records | Schema-level isolation + row-level security |
| **Vector Store** (Pinecone/Weaviate) | Knowledge base embeddings for RAG | Namespace isolation per tenant |
| **Audit Log** | Immutable action log | Append-only table, no DELETE permission |
| **Secrets Vault** (HashiCorp/AWS) | API keys, credentials | Path-isolated: `secret/{tenant_id}/{key}` |
| **File Store** (S3-compatible) | Documents, uploads, exports | Prefix-isolated: `{tenant_id}/` |

---

## Memory Architecture

Agents need memory at three levels:

| Tier | Name | Scope | Storage | TTL |
|------|------|-------|---------|-----|
| 1 | **Session Memory** | Current conversation/task | Redis (fast access) | Session duration |
| 2 | **Persistent Memory** | Per-user or per-entity history | PostgreSQL | Indefinite |
| 3 | **Knowledge Base** | Business docs, FAQs, product catalogs | Vector DB (RAG) | Until updated |

**Session memory** provides immediate context — the last N turns of conversation, current task state, extracted entities. Stored in Redis for sub-millisecond access. Automatically trimmed to fit the model's context window using a sliding window strategy.

**Persistent memory** stores cross-session information — user profiles, past interactions, learned preferences, historical decisions. Fetched on session start when the user/entity is identified.

**Knowledge base** is the agent's reference library — documentation, policies, product catalogs, technical specs. Embedded as vectors and retrieved via semantic search (RAG) to inject relevant context without stuffing the entire corpus into the prompt.

---

## Deployment Model

All services run containerized behind a managed API gateway. Recommended stack:

```
Container Orchestration:  Kubernetes / ECS / Cloud Run
Database:                 Managed PostgreSQL (RDS / Cloud SQL / Supabase)
Cache:                    Redis (ElastiCache / Upstash)
Vector DB:                Pinecone / Weaviate / Qdrant
Secrets:                  HashiCorp Vault / AWS Secrets Manager
Queue:                    Celery + Redis / SQS / Cloud Tasks
CI/CD:                    GitHub Actions / GitLab CI
Monitoring:               Prometheus + Grafana / Datadog
```

**Environment isolation:**
- `development` — local, mocked integrations
- `staging` — real infrastructure, test data, sandbox API keys
- `production` — real everything, full monitoring, kill switches armed

Secrets are injected at runtime via environment variables — never committed to code, never logged, never visible in application output.

---

→ Next: [Proactive Engine](proactive-engine.md) · [Security Model](security-model.md)
