import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import YAML from 'yaml';
import { appendAuditLog } from './crypto-ledger.js';
import { inspectInput } from './injection-shield.js';

/**
 * Sends a standard JSON-RPC 2.0 error block response back to the client.
 */
function sendJsonRpcError(id, code, message) {
  const errResponse = {
    jsonrpc: '2.0',
    id: id !== undefined ? id : null,
    error: {
      code,
      message
    }
  };
  process.stdout.write(JSON.stringify(errResponse) + '\n');
}

/**
 * Spawns the child MCP server process, intercepts stdin/stdout, and applies zero-trust rules.
 */
export function runMcpProxy(commandString, configPath = 'zta-config.yaml') {
  // 1. Read ZTA Configuration
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = YAML.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.error(`[ZTA Proxy Error] Failed to parse config at ${configPath}: ${e.message}`);
    }
  }

  // 2. Parse command
  // Using regex split to handle quoted arguments (e.g. node "path to script")
  const parts = commandString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const cmd = parts[0].replace(/"/g, '');
  const args = parts.slice(1).map(arg => arg.replace(/"/g, ''));

  // 3. Spawn target MCP server
  const child = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: false
  });

  // 4. Interface readers
  const parentRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const childRl = readline.createInterface({
    input: child.stdout,
    terminal: false
  });

  // Handle parent requests (LLM client calling tools)
  parentRl.on('line', async (line) => {
    if (!line.trim()) return;

    try {
      const message = JSON.parse(line);

      if (message.jsonrpc === '2.0' && message.method) {
        
        // A. Kill Switch Check
        if (config.kill_switch?.enabled) {
          // Frictionless: Check if kill switch flag file is present
          if (fs.existsSync('zta-kill.flag') || fs.existsSync('../zta-kill.flag')) {
            sendJsonRpcError(message.id, -32000, 'ZTA Kill Switch Active: Tool execution suspended.');
            appendAuditLog({
              event: 'kill_switch_blocked',
              method: message.method,
              outcome: 'blocked',
              reason: 'Kill switch flag file active'
            });
            return;
          }
        }

        // B. Tool Call Gate
        if (message.method === 'tools/call') {
          const toolName = message.params?.name;
          const toolArguments = message.params?.arguments || {};
          
          const readPerms = config.permissions?.read || [];
          const draftPerms = config.permissions?.draft || [];
          const executePerms = config.permissions?.execute || [];
          const tier = config.agent?.tier || 'T1';

          let allowed = true;
          let reason = '';

          // DevOps check: Check if it is a blocklisted action class
          const forbiddenList = config.permissions?.forbidden || [];
          if (forbiddenList.includes(toolName)) {
            allowed = false;
            reason = `Access Denied: Tool '${toolName}' is explicitly blacklisted under Forbidden Actions.`;
          }
          // T0 (Observer) check: Strict read-only tools allowed. No draft or write.
          else if (tier === 'T0') {
            if (!readPerms.includes(toolName)) {
              allowed = false;
              reason = `Access Denied: Agent is Tier T0 (Observer) and cannot invoke mutating tool '${toolName}'.`;
            }
          } 
          // T1 (Drafter) check: Allowed read and draft tools.
          else if (tier === 'T1') {
            if (!readPerms.includes(toolName) && !draftPerms.includes(toolName)) {
              allowed = false;
              reason = `Access Denied: Tool '${toolName}' is not authorized under T1 read/draft permissions.`;
            }
          }
          // General bounds fallback
          else {
            const allAllowed = [...readPerms, ...draftPerms, ...executePerms];
            if (!allAllowed.includes(toolName)) {
              allowed = false;
              reason = `Access Denied: Tool '${toolName}' is not registered in authorized scopes.`;
            }
          }

          if (!allowed) {
            sendJsonRpcError(message.id, -32602, reason);
            appendAuditLog({
              event: 'permission_blocked',
              tool: toolName,
              outcome: 'blocked',
              reason
            });
            return;
          }

          // C. Injection Shield Scanning
          const argumentString = JSON.stringify(toolArguments);
          const shieldCheck = inspectInput(argumentString);
          if (shieldCheck.blocked) {
            sendJsonRpcError(message.id, -32001, `ZTA Security Shield: Request blocked due to potential injection attack.`);
            appendAuditLog({
              event: 'injection_blocked',
              tool: toolName,
              outcome: 'blocked',
              reason: shieldCheck.reason
            });
            return;
          }

          // Log allowed tool execution
          appendAuditLog({
            event: 'tool_call',
            tool: toolName,
            outcome: 'allowed'
          });
        }
      }

      // Forward request to actual MCP server stdin
      child.stdin.write(line + '\n');
    } catch (err) {
      // Forward raw line if not valid JSON-RPC to avoid breaking non-standard protocols
      child.stdin.write(line + '\n');
    }
  });

  // Handle child responses (MCP tool output back to agent client)
  childRl.on('line', (line) => {
    if (!line.trim()) return;

    try {
      const message = JSON.parse(line);
      if (message.jsonrpc === '2.0') {
        appendAuditLog({
          event: 'tool_response',
          id: message.id,
          outcome: message.error ? 'failed' : 'success'
        });
      }
    } catch (e) {}

    // Forward tool response stdout back to client stdout
    process.stdout.write(line + '\n');
  });

  // Error handling
  child.on('error', (err) => {
    console.error(`[ZTA Proxy Error] Failed to start child process: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
