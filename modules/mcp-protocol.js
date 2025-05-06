/**
 * MCP Protocol Handler
 * Implements Master Control Program (MCP) protocol version 2.1
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');
const githubAPI = require('./github-api');

// Active MCP sessions
const sessions = new Map();

/**
 * Handle MCP connect request
 */
function handleConnect(req, res) {
  const sessionId = generateSessionId();
  
  sessions.set(sessionId, {
    id: sessionId,
    status: 'connected',
    connectedAt: new Date(),
    authenticated: false,
    client: req.headers['user-agent'] || 'Unknown'
  });
  
  logger.info(`MCP connection established: ${sessionId}`);
  
  res.json({
    status: 'success',
    sessionId: sessionId,
    server: 'GitHub MCP Server',
    protocol: 'MCP/2.1',
    message: 'Connection established. Authentication required.'
  });
}

/**
 * Handle MCP authentication request
 */
function handleAuthenticate(req, res) {
  const { sessionId, token } = req.body;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid session ID'
    });
  }
  
  const session = sessions.get(sessionId);
  
  // Verify GitHub token
  githubAPI.verifyToken(token)
    .then(userData => {
      session.authenticated = true;
      session.user = userData;
      
      logger.info(`MCP session authenticated: ${sessionId} (${userData.login})`);
      
      res.json({
        status: 'success',
        message: 'Authentication successful',
        user: userData.login,
        accessLevel: 'admin'
      });
    })
    .catch(err => {
      logger.error(`Authentication failed for session ${sessionId}: ${err.message}`);
      
      res.status(401).json({
        status: 'error',
        message: 'Authentication failed'
      });
    });
}

/**
 * Handle MCP command request
 */
function handleCommand(req, res) {
  const { sessionId, command, parameters } = req.body;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid session ID'
    });
  }
  
  const session = sessions.get(sessionId);
  
  if (!session.authenticated) {
    return res.status(403).json({
      status: 'error',
      message: 'Session not authenticated'
    });
  }
  
  logger.info(`MCP command received: ${command}`);
  
  // Handle different MCP commands
  switch (command) {
    case 'CREATE_REPOSITORY':
      return handleCreateRepository(session, parameters, res);
    
    case 'PUSH_FILES':
      return handlePushFiles(session, parameters, res);
    
    case 'CREATE_ISSUE':
      return handleCreateIssue(session, parameters, res);
    
    case 'CREATE_PULL_REQUEST':
      return handleCreatePullRequest(session, parameters, res);
    
    default:
      return res.status(400).json({
        status: 'error',
        message: `Unknown command: ${command}`
      });
  }
}

/**
 * Handle MCP disconnect request
 */
function handleDisconnect(req, res) {
  const { sessionId } = req.body;
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    logger.info(`MCP session disconnected: ${sessionId}`);
  }
  
  res.json({
    status: 'success',
    message: 'Disconnected'
  });
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return 'mcp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Handle repository creation command
 */
function handleCreateRepository(session, parameters, res) {
  const { name, description, private } = parameters;
  
  githubAPI.createRepository(session.user.token, { name, description, private })
    .then(repo => {
      res.json({
        status: 'success',
        message: 'Repository created',
        data: {
          name: repo.name,
          url: repo.html_url
        }
      });
    })
    .catch(err => {
      logger.error(`Failed to create repository: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to create repository',
        error: err.message
      });
    });
}

/**
 * Handle file push command
 */
function handlePushFiles(session, parameters, res) {
  const { owner, repo, branch, files, message } = parameters;
  
  githubAPI.pushFiles(session.user.token, { owner, repo, branch, files, message })
    .then(() => {
      res.json({
        status: 'success',
        message: 'Files pushed successfully'
      });
    })
    .catch(err => {
      logger.error(`Failed to push files: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to push files',
        error: err.message
      });
    });
}

/**
 * Handle issue creation command
 */
function handleCreateIssue(session, parameters, res) {
  const { owner, repo, title, body, labels } = parameters;
  
  githubAPI.createIssue(session.user.token, { owner, repo, title, body, labels })
    .then(issue => {
      res.json({
        status: 'success',
        message: 'Issue created',
        data: {
          number: issue.number,
          url: issue.html_url
        }
      });
    })
    .catch(err => {
      logger.error(`Failed to create issue: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to create issue',
        error: err.message
      });
    });
}

/**
 * Handle pull request creation command
 */
function handleCreatePullRequest(session, parameters, res) {
  const { owner, repo, title, body, head, base } = parameters;
  
  githubAPI.createPullRequest(session.user.token, { owner, repo, title, body, head, base })
    .then(pr => {
      res.json({
        status: 'success',
        message: 'Pull request created',
        data: {
          number: pr.number,
          url: pr.html_url
        }
      });
    })
    .catch(err => {
      logger.error(`Failed to create pull request: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to create pull request',
        error: err.message
      });
    });
}

module.exports = {
  handleConnect,
  handleAuthenticate,
  handleCommand,
  handleDisconnect
};