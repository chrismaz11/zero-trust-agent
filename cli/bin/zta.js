#!/usr/bin/env node

import { runWizard } from '../src/index.js';
import { runMcpProxy } from '../src/mcp-proxy.js';

const args = process.argv.slice(2);

if (args[0] === 'wrap') {
  let cmdToRun = '';
  const mcpIndex = args.indexOf('--mcp');
  
  if (mcpIndex !== -1 && args[mcpIndex + 1]) {
    cmdToRun = args[mcpIndex + 1];
  } else {
    cmdToRun = args.slice(1).join(' ');
  }

  if (!cmdToRun.trim()) {
    console.error('Error: Please specify the command to wrap. Example: zta wrap --mcp "node server.js"');
    process.exit(1);
  }

  runMcpProxy(cmdToRun);
} else {
  runWizard().catch(err => {
    console.error('An unexpected error occurred in ZTA setup:', err);
    process.exit(1);
  });
}
