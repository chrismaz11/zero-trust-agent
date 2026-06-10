import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

/**
 * Helper to get the current date formatted as YYYY-MM-DD
 */
function getFormattedDate() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Normalizes user and AI configs to prevent runtime crashes on empty or incomplete data.
 */
export function normalizeConfig(config = {}) {
  const name = config.name || config.agentName || 'UnnamedAgent';
  const tier = config.tier || 'T1';
  const owner = config.owner || 'Security-Ops';
  const purpose = config.purpose || 'No purpose defined';
  const rationale = config.rationale || 'No rationale provided';
  
  const readPermissions = Array.isArray(config.readPermissions) 
    ? config.readPermissions 
    : (typeof config.readPermissions === 'string' ? config.readPermissions.split(',').map(s => s.trim()).filter(Boolean) : []);
    
  const writePermissions = Array.isArray(config.writePermissions) 
    ? config.writePermissions 
    : (typeof config.writePermissions === 'string' ? config.writePermissions.split(',').map(s => s.trim()).filter(Boolean) : []);
    
  const executePermissions = Array.isArray(config.executePermissions) 
    ? config.executePermissions 
    : (typeof config.executePermissions === 'string' ? config.executePermissions.split(',').map(s => s.trim()).filter(Boolean) : []);
    
  const forbiddenActions = Array.isArray(config.forbiddenActions) 
    ? config.forbiddenActions 
    : (typeof config.forbiddenActions === 'string' ? config.forbiddenActions.split(',').map(s => s.trim()).filter(Boolean) : []);
    
  const guardrails = Array.isArray(config.guardrails) 
    ? config.guardrails 
    : (typeof config.guardrails === 'string' ? config.guardrails.split(',').map(s => s.trim()).filter(Boolean) : []);

  const failureMode = config.failureMode || 'Stop execution and alert the owner.';
  const killSwitchTrigger = config.killSwitchTrigger || 'CLI environment flag ACTIVE=false';

  return {
    name,
    tier,
    owner,
    purpose,
    rationale,
    readPermissions,
    writePermissions,
    executePermissions,
    forbiddenActions,
    guardrails,
    failureMode,
    killSwitchTrigger,
    cloudEnabled: !!config.cloudEnabled,
    cloudToken: config.cloudToken || '',
    cloudUrl: config.cloudUrl || ''
  };
}

/**
 * Generate zta-config.yaml file content
 */
export function generateYamlConfig(config) {
  const norm = normalizeConfig(config);
  const yamlObj = {
    agent: {
      name: norm.name,
      tier: norm.tier,
      owner: norm.owner,
      version: '1.0.0'
    },
    permissions: {
      read: norm.readPermissions,
      draft: norm.writePermissions,
      execute: norm.tier === 'T2' || norm.tier === 'T3' ? norm.executePermissions : []
    },
    approval: {
      mode: norm.tier === 'T0' ? 'none' : (norm.tier === 'T1' ? 'per_item' : 'rule_based'),
      notify: norm.cloudEnabled ? ['slack', 'email', 'zta_dashboard'] : ['local_terminal'],
      timeout_hours: 24
    },
    audit: {
      log_reads: true,
      log_drafts: true,
      log_approvals: true,
      retention_days: norm.cloudEnabled ? 365 : 30,
      signature: norm.cloudEnabled ? 'sha256-signed-ledger' : 'local-hmac',
      destination: norm.cloudEnabled ? 'zta_cloud_secure_ledger' : 'local_file_jsonl'
    },
    monitoring: {
      heartbeat_interval: 300,
      alert_on_silence: norm.cloudEnabled,
      health_checks: ['response_time', 'error_rate', 'rejection_rate']
    },
    kill_switch: {
      enabled: true,
      trigger: ['manual', 'error_threshold', 'anomaly_detection'],
      action: 'suspend_and_alert',
      mechanism: norm.killSwitchTrigger
    }
  };

  if (norm.cloudEnabled) {
    yamlObj.zta_cloud = {
      enabled: true,
      connection_token: norm.cloudToken,
      control_plane_url: 'https://api.zta.dev/v1',
      dashboard_url: `https://zta.dev/dashboard/agent/${norm.cloudToken.substring(10)}`
    };
  } else {
    yamlObj.zta_cloud = {
      enabled: false
    };
  }

  return YAML.stringify(yamlObj);
}

/**
 * Generate zta-scope.md file content
 */
export function generateScopeMarkdown(config) {
  const norm = normalizeConfig(config);
  const dateStr = getFormattedDate();
  
  // Format tables
  const readRows = norm.readPermissions.map(sys => `| ${sys} | Read agent data access | Scoped by security context |`).join('\n');
  const draftRows = norm.writePermissions.map(act => `| ${act} | Create drafts for review | Requires human approval |`).join('\n');
  const executeRows = norm.tier === 'T2' || norm.tier === 'T3' 
    ? norm.executePermissions.map(act => `| ${act} | Automatic execution | Under defined guardrails |`).join('\n')
    : '| None | N/A (Tier is Draft-only) | N/A |';
  const forbiddenRows = norm.forbiddenActions.map(act => `- [ ] Never ${act}`).join('\n');
  const guardrailRows = norm.guardrails.map(g => `- ${g}`).join('\n');

  return `# Agent Scope Document — ${norm.name}

> Auto-generated by ZTA CLI Onboarding Assistant on ${dateStr}.

---

## Agent Identity

| Field | Value |
|-------|-------|
| **Agent ID** | \`${norm.name.toLowerCase().replace(/\s+/g, '-')}-agent\` |
| **Agent Name** | ${norm.name} |
| **Version** | 1.0.0 |
| **Owner** | ${norm.owner} |
| **Created** | ${dateStr} |
| **Last Reviewed** | ${dateStr} |

## Purpose

${norm.purpose}

## Permission Tier

| Current Tier | Justification |
|-------------|---------------|
| **${norm.tier}** | ${norm.rationale} |

## Integrations

### Read Access

| System | What the Agent Reads | Why |
|--------|---------------------|-----|
${readRows || '| None | No read access defined | N/A |'}

### Draft Access

| Output Type | What the Agent Drafts | Approval Method |
|-------------|----------------------|-----------------|
${draftRows || '| None | No drafting access defined | N/A |'}

### Execute Access (T2+ only)

| Action Type | Conditions for Auto-Execution | Guardrails |
|-------------|------------------------------|------------|
${executeRows || '| None | No execution access defined | N/A |'}

## Forbidden Actions

${forbiddenRows || '- [ ] No forbidden actions defined (Caution)'}

## Guardrails

### Blocklists & Rules
${guardrailRows || '- No specific guardrails defined'}

### Escalation Rules

| Condition | Action |
|-----------|--------|
| Confidence below threshold | Escalate to ${norm.owner} |
| Guardrail triggered | Log + alert ${norm.owner} |
| Unknown situation | Stop + escalate to ${norm.owner} |
| Error | Log + alert ${norm.owner} |

## Kill Switch

| Field | Value |
|-------|-------|
| **Endpoint/Mechanism** | ${norm.killSwitchTrigger} |
| **Authorized Triggers** | Manual: ${norm.owner}. Automatic: error_threshold |
| **Effect** | Demote to T0, cancel pending drafts, alert owner |
| **Last Tested** | ${dateStr} (Pending manual validation) |

## Review Schedule

| Review Type | Frequency | Reviewer |
|-------------|-----------|----------|
| Audit log review | Weekly | ${norm.owner} |
| Scope document review | Monthly | ${norm.owner} |
`;
}

/**
 * Generate zta-system-prompt.txt file content
 */
export function generateSystemPromptText(config) {
  const norm = normalizeConfig(config);
  const dateStr = getFormattedDate();
  
  const readList = norm.readPermissions.map(p => `- Read: ${p}`).join('\n');
  const draftList = norm.writePermissions.map(p => `- Draft: ${p}`).join('\n');
  const executeList = norm.tier === 'T2' || norm.tier === 'T3'
    ? norm.executePermissions.map(p => `- Execute: ${p}`).join('\n')
    : '- Execute: NONE (You are a draft-only agent. You must never execute actions directly.)';
    
  const forbiddenList = norm.forbiddenActions.map(p => `- Never attempt to: ${p}`).join('\n');
  const guardrailList = norm.guardrails.map((g, idx) => `${idx + 1}. ${g}`).join('\n');

  return `# ═══════════════════════════════════════════════════════════
# SYSTEM PROMPT — ${norm.name.toUpperCase()}
# Tier: ${norm.tier}
# Owner: ${norm.owner}
# Last Updated: ${dateStr}
# ═══════════════════════════════════════════════════════════

## Identity

You are ${norm.name}, a ${norm.tier} AI agent that ${norm.purpose}.
You are operated by ${norm.owner}.

## Permissions

### You CAN:
${readList || '- No read access defined'}
${draftList || '- No draft access defined'}
${executeList}

### You CANNOT:
${forbiddenList || '- No explicit forbidden actions list defined'}
- Access any system not listed above
- Exceed your defined scope for any reason
- Grant yourself additional permissions
- Interact with environment variables or credentials directly

## Operating Rules

1. You must log every action, query, or proposal to the zero-trust audit trail with full parameters.
2. All draft outputs must be written to the pending queue for review before any external systems are invoked.
3. You must check the rate limits before submitting new draft requests.
4. Always cite specific sources or tickets when recommending actions.

## Guardrails

### Rules & Blocklist
${guardrailList || '1. General zero-trust boundaries apply.'}

### Thresholds
- Actions involving major state changes: escalate for human approval.
- Confidence below 0.85: ask a clarifying question instead of proposing a draft.
- Confidence below 0.70: stop execution and escalate to human immediately.

## Failure Modes

### When you encounter an error:
1. Stop the current action.
2. Log the error details (context, inputs, system message) cryptographically.
3. Alert ${norm.owner}.
4. ${norm.failureMode}

### When confidence is low:
- Below 0.85: prompt the user for clarification.
- Below 0.70: stop and escalate to ${norm.owner}. Never guess.

### Kill switch:
If you receive a kill command or the active flag is set to false:
1. Immediately stop all current actions.
2. Cancel all pending drafts.
3. Log your final shutdown state.
`;
}

/**
 * Writes the configuration files to the target directory.
 */
export function writeConfigFiles(config, outputDir = '.') {
  const yamlContent = generateYamlConfig(config);
  const scopeContent = generateScopeMarkdown(config);
  const promptContent = generateSystemPromptText(config);

  fs.mkdirSync(outputDir, { recursive: true });

  const yamlPath = path.join(outputDir, 'zta-config.yaml');
  const scopePath = path.join(outputDir, 'zta-scope.md');
  const promptPath = path.join(outputDir, 'zta-system-prompt.txt');

  fs.writeFileSync(yamlPath, yamlContent, 'utf-8');
  fs.writeFileSync(scopePath, scopeContent, 'utf-8');
  fs.writeFileSync(promptPath, promptContent, 'utf-8');

  return {
    yamlPath,
    scopePath,
    promptPath
  };
}
