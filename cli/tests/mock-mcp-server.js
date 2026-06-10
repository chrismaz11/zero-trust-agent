import readline from 'readline';

/**
 * Simple mock MCP server. Reads JSON-RPC from stdin, writes JSON-RPC responses to stdout.
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;

  try {
    const message = JSON.parse(line);

    if (message.jsonrpc === '2.0' && message.method === 'tools/call') {
      const toolName = message.params?.name;
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Mock execution of tool '${toolName}' completed successfully.`
            }
          ]
        }
      };

      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    // Write standard JSON-RPC parse error
    const errResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error in mock MCP: ${err.message}`
      }
    };
    process.stdout.write(JSON.stringify(errResponse) + '\n');
  }
});
