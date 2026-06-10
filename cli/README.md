# ZTA Onboarding CLI 🛡️

`zta` is the interactive command-line onboarding tool for the **Zero-Trust Agent Framework**. It uses active AI reasoning in your terminal session to audit your agent's risk profile, recommend appropriate permission tiers, draft safety guardrails, and generate standard compliance configurations.

---

## Features

- 🧠 **Active AI Session Auditor:** Analyzes your agent's description and external system access to recommend the safest possible configuration.
- 🚦 **Security Tier Recommendations:** Automatically profiles your agent's risk level to select the correct governance tier (**T0–T3**).
- 💡 **Best Responses Guidance:** Suggests optimal responses and implementation actions based on security levels.
- 🛡️ **No-Code Security Wrapping (`zta wrap`):** Intercepts standard stdin/stdout Model Context Protocol (MCP) servers to log requests, block unauthorized tools, screen injections, and enforce kill-switches.
- ⚡ **ZTA Cloud Integration:** Connects your local configuration to a hosted dashboard for cryptographically signed logs and Slack-based approval workflows.
- 📝 **Automatic File Generation:** Generates `zta-config.yaml`, `zta-scope.md`, and `zta-system-prompt.txt` automatically.

---

## Installation

You can run the CLI directly via `npx` or install it globally:

```bash
# Run directly without installation
npx zta

# Or install globally
npm install -g zta
```

*(Note: For local development within this repository, see the Development section below.)*

---

## Quick Start

### 1. Initialize Configuration
Run the onboarding wizard in your agent project directory to generate your zero-trust scopes and system prompts:

```bash
# Start wizard (runs 'zta init' by default)
npx zta
```

This generates `zta-config.yaml`, `zta-scope.md`, and `zta-system-prompt.txt`.

### 2. Wrap and Run MCP Server (No-Code Security)
Instead of rewriting your code, wrap any standard Model Context Protocol (MCP) server command with the `zta wrap` proxy. This instantly applies your configurations to the tool stream:

```bash
# Wrap postgres database MCP tool server
npx zta wrap --mcp "npx @modelcontextprotocol/server-postgres"
```

The proxy wrapper will:
* **Check permissions** in real-time, blocking unauthorized database mutations (e.g. T0 observer trying to edit data).
* **Scan inputs** via the local **Injection Shield**, blocking malicious arguments.
* **Audit Tool Calls** into a local tamper-proof **Cryptographic Ledger** (`zta-audit.signed.jsonl`).
* **Enforce Kill-Switch:** Instantly block all calls if `zta-kill.flag` exists in your directory.

---

## Active AI Configurations

To use the AI-powered recommendations, the CLI detects your LLM API keys. 

We support the following environment variables:
- `GEMINI_API_KEY` (Recommended)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

If no API key is found, the CLI activates the **ZTA Onboarding Gateway** (a high-fidelity offline rule-based heuristic parser) to provide secure zero-trust recommendations instantly.

---

## ZTA Cloud SaaS Integration (Monetization)

The ZTA core framework and CLI are 100% open source under the MIT license. For teams deploying production agents that require compliance guarantees and operational tools, the CLI offers a direct path to link to **ZTA Cloud**:

| Tier | Price | Best For | Features |
|---|---|---|---|
| **ZTA Developer (OSS)** | `$0/mo` | Prototyping & local dev | Local CLI tool, Local JSONL audit logs, Terminal-based manual approval loops. |
| **ZTA Cloud Team** | `$49/mo` per agent | Production teams | Remote immutable signed log store, real-time Slack/Teams/Email approval buttons, web monitoring dashboard, SMS status alerts. |
| **ZTA Enterprise** | `Custom` | Regulated industries | Multi-tenant SSO, custom DB log adapters (Postgres, Splunk, Datadog), dedicated 24/7 SLA support, compliance reporting. |

During setup, selecting **ZTA Cloud Team** generates a unique bridge link (e.g. `https://zta.dev/register?token=cli_trial_...`) allowing you to instantly claim your agent on the SaaS dashboard.

---

## Local Development & Testing

To run the CLI locally from within this repository:

1. Navigate to the `cli/` directory:
   ```bash
   cd cli
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the CLI tool:
   ```bash
   npm start
   ```
4. Or link it globally to test the `zta` command:
   ```bash
   npm link
   # Now you can run 'zta' from any folder
   ```
