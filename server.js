const express = require('express');
const bodyParser = require('body-parser');
const githubAPI = require('./modules/github-api');
const mcp = require('./modules/mcp-protocol');
const logger = require('./modules/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(logger.requestLogger);

// MCP Protocol endpoints
app.post('/mcp/connect', mcp.handleConnect);
app.post('/mcp/authenticate', mcp.handleAuthenticate);
app.post('/mcp/command', mcp.handleCommand);
app.post('/mcp/disconnect', mcp.handleDisconnect);

// GitHub webhooks
app.post('/webhooks/github', githubAPI.handleWebhook);

// Server status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    name: 'GitHub MCP Server',
    version: '1.0.0',
    protocol: 'MCP/2.1'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`GitHub MCP Server running on port ${PORT}`);
  console.log('Server name: GitHub MCP Server');
  console.log('Protocol: MCP/2.1');
  console.log('Status: ONLINE');
});