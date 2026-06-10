import { GoogleGenerativeAI } from '@google/generative-ai';
import pc from 'picocolors';

/**
 * Fallback local heuristic analysis when no API key is available or offline.
 * Provides a high-quality zero-trust assessment based on keywords.
 */
/**
 * Helper to match keywords using regex word boundaries to avoid false substring matches
 * (e.g., 'reporting' matching 'repo', or 'invoicing' matching 'ci').
 */
function matchAny(query, keywords) {
  return keywords.some(kw => {
    if (['ci', 'cd', 'git', 'repo', 'db', 'sql', 'etl'].includes(kw)) {
      return new RegExp(`\\b${kw}\\b`, 'i').test(query);
    }
    return new RegExp(`\\b${kw}`, 'i').test(query);
  });
}

function getLocalHeuristics(purpose, systems = '') {
  const query = (purpose + ' ' + systems).toLowerCase();
  
  if (matchAny(query, ['support', 'customer', 'email', 'ticket', 'zendesk', 'faq'])) {
    return {
      tier: 'T1',
      rationale: 'Customer support agents interact directly with external users and core databases. Since drafts require human approval before sending (T1), this prevents the agent from sending incorrect, hallucinated, or unapproved replies directly to clients.',
      readPermissions: ['crm_database', 'support_tickets', 'knowledge_base_articles'],
      writePermissions: ['customer_email_drafts', 'ticket_status_updates'],
      forbiddenActions: ['delete_customer_records', 'change_billing_plans', 'export_user_list_csv'],
      guardrails: [
        'Never disclose internal database IDs or PII of other customers',
        'Escalate to Tier 2 human supervisor if customer requests refunds or billing changes',
        'Filter out replies containing code blocks or unexpected configuration details'
      ],
      failureMode: 'On error or model confusion, write draft state as FAILED, append the stack trace to logs, and alert the customer operations team.',
      killSwitchTrigger: 'Slack command `/kill-support-agent` or setting `ACTIVE=false` in the ZTA config database.'
    };
  }

  if (matchAny(query, ['deploy', 'ci', 'cd', 'git', 'code', 'repo', 'github', 'gitlab', 'jenkins'])) {
    return {
      tier: 'T1',
      rationale: 'Code deployment and repository modification touch critical infrastructure. A T1 Drafter role ensures that no production pipelines are triggered or code merged without a human reviewing the exact patch. T0 can be used for passive status reporting.',
      readPermissions: ['git_repository_read', 'ci_build_logs', 'pull_request_metadata'],
      writePermissions: ['pull_request_comments_draft', 'hotfix_patch_proposals'],
      forbiddenActions: ['force_push_to_main', 'delete_production_environment', 'bypass_required_pr_reviews'],
      guardrails: [
        'Limit PR draft proposals to a maximum of 5 per hour',
        'Halt immediately and alert security oncall if a PR draft introduces changes to configuration secrets',
        'Verify all recommended commits comply with static analysis (linting) rules'
      ],
      failureMode: 'Immediately stop execution of the build script, fail the CI stage, log the exact event cryptographically, and page the devops team.',
      killSwitchTrigger: 'GitHub action cancellation or deleting the agent webhook endpoint.'
    };
  }

  if (matchAny(query, ['finance', 'billing', 'stripe', 'payment', 'invoice', 'refund', 'card', 'ledger', 'cash'])) {
    return {
      tier: 'T1',
      rationale: 'Financial and billing agents process sensitive transactions, invoice creation, and payment updates. A T1 Drafter role is required to prevent unauthorized fund transfers, credit notes, or refund transactions without human-in-the-loop audit and explicit authorization.',
      readPermissions: ['stripe_payouts', 'ledger_balances', 'subscription_records', 'invoice_history'],
      writePermissions: ['refund_proposals', 'invoice_drafts', 'subscription_update_requests'],
      forbiddenActions: ['transfer_funds_external', 'bypass_payout_limits', 'delete_billing_history', 'modify_merchant_accounts'],
      guardrails: [
        'Never authorize payouts or refunds above $500 without Tier 3 officer sign-off',
        'Reject any proposal to change target bank account details or routing numbers',
        'Mask all credit card numbers, bank routing numbers, and PII in output recommendations'
      ],
      failureMode: 'Halt all billing draft proposals, suspend session, flag the transaction, and alert the financial controller immediately.',
      killSwitchTrigger: 'Setting the environment variable BILLING_ACTIVE=false or triggering the central gateway payout lock switch.'
    };
  }

  if (matchAny(query, ['data', 'etl', 'pipeline', 'database', 'sql', 'query', 'postgres', 'mysql', 'db'])) {
    return {
      tier: 'T0',
      rationale: 'Data analytics and processing agents deal with large quantities of records. Starting as a T0 Observer (Read-Only) is highly recommended until query safety is proven. If writing back is necessary, keep it at T1 to prevent bulk data deletion.',
      readPermissions: ['analytics_database_read', 'data_pipeline_health_status', 'schema_metadata_catalog'],
      writePermissions: ['query_optimization_proposals', 'pipeline_restart_proposals'],
      forbiddenActions: ['drop_table', 'truncate_table', 'alter_schema_ddl', 'insert_unvalidated_user_data'],
      guardrails: [
        'Reject any query proposal containing data manipulation commands (DROP, TRUNCATE, UPDATE)',
        'Enforce a query execution scan limit of 50GB per transaction',
        'Encrypt or mask all PII data fields in output recommendations'
      ],
      failureMode: 'Log the query attempt, suspend current session, and flag the event to the data governance lead.',
      killSwitchTrigger: 'Setting the database read-only flag or stopping the listener container.'
    };
  }

  // General fallback
  return {
    tier: 'T1',
    rationale: 'Under zero-trust principles, any agent that can modify state or recommend actions should default to T1 (Drafter). This allows the team to verify prompt alignment, assess risk, and log outcomes before granting direct execution capabilities.',
    readPermissions: ['local_files_read', 'internal_documentation_wiki'],
    writePermissions: ['action_proposals_draft'],
    forbiddenActions: ['execute_terminal_commands', 'outbound_http_requests'],
    guardrails: [
      'Stop execution if the LLM confidence score for the action is below 85%',
      'Do not output raw system directories or paths'
    ],
    failureMode: 'Cease execution, write error code and inputs to local audit log, and return a clean failure state.',
    killSwitchTrigger: 'Terminate the executing process via SIGTERM or clear the API token.'
  };
}

/**
 * Query Gemini model for security recommendations
 */
async function queryGemini(apiKey, purpose, systems) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemInstruction = `You are the Zero-Trust Agent Security Auditor. Your job is to help developers configure safe, governed AI agents. You analyze their agent's purpose and system access, and you recommend the safest possible trust tier (T0 to T3), read/write/forbidden scopes, and security guardrails based on zero-trust principles. Always emphasize starting narrow (e.g. T1 Drafter) and implementing strict boundaries.

Analyze the developer's agent description and systems, and return a JSON object with this exact structure:
{
  "tier": "T0" | "T1" | "T2" | "T3",
  "rationale": "Clear detailed explanation of why this tier is recommended based on the agent's risk profile.",
  "readPermissions": ["system1", "system2"],
  "writePermissions": ["system1", "system2"],
  "forbiddenActions": ["action1", "action2"],
  "guardrails": ["rule1", "rule2"],
  "failureMode": "Description of what the agent should do when an error occurs or boundaries are breached.",
  "killSwitchTrigger": "Recommended manual or automatic triggers for the kill switch."
}

Do not include any formatting other than the JSON object. Do not include markdown code fences like \`\`\`json.`;

  const prompt = `Agent Purpose: ${purpose}\nSystems It Connects To: ${systems}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n\n' + prompt }] }]
  });

  const response = await result.response;
  let text = response.text().trim();
  
  // Clean markdown code blocks if the model still outputs them
  if (text.startsWith('```json')) {
    text = text.substring(7);
  }
  if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  return JSON.parse(text);
}

/**
 * Main AI analysis entrypoint.
 * Handles both the live Gemini API query and the heuristic fallback.
 */
export async function analyzeAgent(purpose, systems) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      return await queryGemini(apiKey, purpose, systems);
    } catch (err) {
      // Quietly fallback to heuristics if API call fails
      return getLocalHeuristics(purpose, systems);
    }
  } else {
    // Return local heuristics if no key is configured
    return getLocalHeuristics(purpose, systems);
  }
}
