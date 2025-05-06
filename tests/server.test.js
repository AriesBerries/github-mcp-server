const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mcp = require('../modules/mcp-protocol');
const githubAPI = require('../modules/github-api');

// Mock dependencies
jest.mock('../modules/github-api', () => ({
  verifyToken: jest.fn(),
  createRepository: jest.fn(),
  pushFiles: jest.fn(),
  createIssue: jest.fn(),
  createPullRequest: jest.fn(),
  handleWebhook: jest.fn()
}));

jest.mock('../modules/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  requestLogger: (req, res, next) => next()
}));

// Create an Express app for testing
const app = express();
app.use(bodyParser.json());

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

describe('MCP Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Status', () => {
    test('should return server status', async () => {
      const response = await request(app).get('/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'online');
      expect(response.body).toHaveProperty('name', 'GitHub MCP Server');
      expect(response.body).toHaveProperty('protocol', 'MCP/2.1');
    });
  });

  describe('MCP Connect', () => {
    test('should establish a connection and return sessionId', async () => {
      const response = await request(app).post('/mcp/connect');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('server', 'GitHub MCP Server');
      expect(response.body).toHaveProperty('protocol', 'MCP/2.1');
    });
  });

  describe('MCP Authenticate', () => {
    let sessionId;

    beforeEach(async () => {
      const connectResponse = await request(app).post('/mcp/connect');
      sessionId = connectResponse.body.sessionId;

      githubAPI.verifyToken.mockImplementation((token) => {
        if (token === 'valid_token') {
          return Promise.resolve({
            login: 'testuser',
            id: 123,
            name: 'Test User',
            token: 'valid_token'
          });
        } else {
          return Promise.reject(new Error('Invalid token'));
        }
      });
    });

    test('should authenticate with valid token', async () => {
      const response = await request(app)
        .post('/mcp/authenticate')
        .send({
          sessionId,
          token: 'valid_token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('user', 'testuser');
      expect(response.body).toHaveProperty('accessLevel', 'admin');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .post('/mcp/authenticate')
        .send({
          sessionId,
          token: 'invalid_token'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });

    test('should reject invalid sessionId', async () => {
      const response = await request(app)
        .post('/mcp/authenticate')
        .send({
          sessionId: 'invalid_session_id',
          token: 'valid_token'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('MCP Command', () => {
    let sessionId;

    beforeEach(async () => {
      const connectResponse = await request(app).post('/mcp/connect');
      sessionId = connectResponse.body.sessionId;

      githubAPI.verifyToken.mockResolvedValue({
        login: 'testuser',
        id: 123,
        name: 'Test User',
        token: 'valid_token'
      });

      // Authenticate the session
      await request(app)
        .post('/mcp/authenticate')
        .send({
          sessionId,
          token: 'valid_token'
        });

      // Mock repository creation
      githubAPI.createRepository.mockResolvedValue({
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        html_url: 'https://github.com/testuser/test-repo'
      });

      // Mock issue creation
      githubAPI.createIssue.mockResolvedValue({
        number: 1,
        html_url: 'https://github.com/testuser/test-repo/issues/1'
      });

      // Mock pull request creation
      githubAPI.createPullRequest.mockResolvedValue({
        number: 2,
        html_url: 'https://github.com/testuser/test-repo/pulls/2'
      });
    });

    test('should create a repository', async () => {
      const response = await request(app)
        .post('/mcp/command')
        .send({
          sessionId,
          command: 'CREATE_REPOSITORY',
          parameters: {
            name: 'test-repo',
            description: 'Test repository',
            private: false
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Repository created');
      expect(response.body.data).toHaveProperty('name', 'test-repo');
      expect(response.body.data).toHaveProperty('url', 'https://github.com/testuser/test-repo');
      expect(githubAPI.createRepository).toHaveBeenCalled();
    });

    test('should create an issue', async () => {
      const response = await request(app)
        .post('/mcp/command')
        .send({
          sessionId,
          command: 'CREATE_ISSUE',
          parameters: {
            owner: 'testuser',
            repo: 'test-repo',
            title: 'Test Issue',
            body: 'This is a test issue',
            labels: ['bug']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Issue created');
      expect(response.body.data).toHaveProperty('number', 1);
      expect(response.body.data).toHaveProperty('url', 'https://github.com/testuser/test-repo/issues/1');
      expect(githubAPI.createIssue).toHaveBeenCalled();
    });

    test('should create a pull request', async () => {
      const response = await request(app)
        .post('/mcp/command')
        .send({
          sessionId,
          command: 'CREATE_PULL_REQUEST',
          parameters: {
            owner: 'testuser',
            repo: 'test-repo',
            title: 'Test PR',
            body: 'This is a test pull request',
            head: 'feature-branch',
            base: 'main'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Pull request created');
      expect(response.body.data).toHaveProperty('number', 2);
      expect(response.body.data).toHaveProperty('url', 'https://github.com/testuser/test-repo/pulls/2');
      expect(githubAPI.createPullRequest).toHaveBeenCalled();
    });

    test('should reject unknown command', async () => {
      const response = await request(app)
        .post('/mcp/command')
        .send({
          sessionId,
          command: 'UNKNOWN_COMMAND',
          parameters: {}
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('Unknown command');
    });

    test('should reject unauthenticated session', async () => {
      // Create a new session without authenticating
      const newConnectResponse = await request(app).post('/mcp/connect');
      const unauthenticatedSessionId = newConnectResponse.body.sessionId;

      const response = await request(app)
        .post('/mcp/command')
        .send({
          sessionId: unauthenticatedSessionId,
          command: 'CREATE_REPOSITORY',
          parameters: {
            name: 'test-repo'
          }
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body.message).toContain('not authenticated');
    });
  });

  describe('MCP Disconnect', () => {
    test('should disconnect an active session', async () => {
      const connectResponse = await request(app).post('/mcp/connect');
      const sessionId = connectResponse.body.sessionId;

      const response = await request(app)
        .post('/mcp/disconnect')
        .send({ sessionId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Disconnected');

      // Verify the session is no longer valid
      const cmdResponse = await request(app)
        .post('/mcp/command')
        .send({
          sessionId,
          command: 'CREATE_REPOSITORY',
          parameters: { name: 'test-repo' }
        });

      expect(cmdResponse.status).toBe(401);
    });

    test('should handle disconnect for non-existent session', async () => {
      const response = await request(app)
        .post('/mcp/disconnect')
        .send({ sessionId: 'non-existent-session' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
    });
  });
});