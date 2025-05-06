#!/usr/bin/env node

/**
 * MCP Command Line Interface
 * A tool to interact with the MCP server
 */

const readline = require('readline');
const axios = require('axios');
const chalk = require('chalk');

// Default server configuration
let serverConfig = {
  url: 'http://localhost:3000',
  sessionId: null,
  authenticated: false,
  username: null
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'MCP> '
});

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('='.repeat(60)));
  console.log(chalk.blue.bold('MCP Command Line Interface'));
  console.log(chalk.blue('='.repeat(60)));
  console.log('Type ' + chalk.green('help') + ' to see available commands');
  
  // Try to connect to the server
  await connectToServer();
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (input === '') {
      rl.prompt();
      return;
    }
    
    // Parse command and arguments
    const [command, ...args] = input.split(' ');
    
    try {
      switch (command.toLowerCase()) {
        case 'help':
          showHelp();
          break;
          
        case 'connect':
          await connectToServer(args[0]);
          break;
          
        case 'auth':
        case 'login':
          await authenticate(args[0]);
          break;
          
        case 'status':
          showStatus();
          break;
          
        case 'create-repo':
          await createRepository(args.join(' '));
          break;
          
        case 'create-issue':
          await createIssue(args.join(' '));
          break;
          
        case 'create-pr':
          await createPullRequest(args.join(' '));
          break;
          
        case 'exit':
        case 'quit':
          await disconnect();
          rl.close();
          return;
          
        default:
          console.log(chalk.red(`Unknown command: ${command}`));
          console.log('Type ' + chalk.green('help') + ' to see available commands');
      }
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
    }
    
    rl.prompt();
  });
  
  rl.on('close', async () => {
    await disconnect();
    console.log(chalk.blue('\nGoodbye!'));
    process.exit(0);
  });
}

/**
 * Display help information
 */
function showHelp() {
  console.log(chalk.yellow('\nAvailable Commands:\n'));
  console.log(chalk.green('connect [url]') + ' - Connect to MCP server');
  console.log(chalk.green('auth [token]') + ' - Authenticate with GitHub token');
  console.log(chalk.green('status') + ' - Show current connection status');
  console.log(chalk.green('create-repo [name]') + ' - Create a new repository');
  console.log(chalk.green('create-issue [owner/repo] [title]') + ' - Create a new issue');
  console.log(chalk.green('create-pr [owner/repo] [title] [head] [base]') + ' - Create a pull request');
  console.log(chalk.green('exit') + ' - Exit the MCP CLI');
  console.log('');
}

/**
 * Connect to MCP server
 */
async function connectToServer(url) {
  if (url) {
    serverConfig.url = url;
  }
  
  try {
    console.log(chalk.yellow(`Connecting to MCP server at ${serverConfig.url}...`));
    
    const response = await axios.post(`${serverConfig.url}/mcp/connect`, {});
    
    if (response.data.status === 'success') {
      serverConfig.sessionId = response.data.sessionId;
      console.log(chalk.green(`Connected to ${response.data.server} (${response.data.protocol})`));
      console.log(chalk.green(`Session ID: ${serverConfig.sessionId}`));
      console.log(chalk.yellow(response.data.message));
    } else {
      console.log(chalk.red(`Connection failed: ${response.data.message}`));
    }
  } catch (err) {
    console.error(chalk.red(`Failed to connect: ${err.message}`));
    throw new Error('Server connection failed');
  }
}

/**
 * Authenticate with the server
 */
async function authenticate(token) {
  if (!serverConfig.sessionId) {
    throw new Error('Not connected to server. Use connect first.');
  }
  
  if (!token) {
    // Prompt for token if not provided
    token = await new Promise((resolve) => {
      rl.question(chalk.yellow('Enter GitHub token: '), (answer) => {
        resolve(answer.trim());
      });
    });
  }
  
  try {
    console.log(chalk.yellow('Authenticating...'));
    
    const response = await axios.post(`${serverConfig.url}/mcp/authenticate`, {
      sessionId: serverConfig.sessionId,
      token: token
    });
    
    if (response.data.status === 'success') {
      serverConfig.authenticated = true;
      serverConfig.username = response.data.user;
      console.log(chalk.green(`Authentication successful. Logged in as ${response.data.user}`));
      console.log(chalk.green(`Access level: ${response.data.accessLevel}`));
    } else {
      console.log(chalk.red(`Authentication failed: ${response.data.message}`));
    }
  } catch (err) {
    console.error(chalk.red(`Authentication failed: ${err.message}`));
    throw new Error('Authentication failed');
  }
}

/**
 * Show current connection status
 */
function showStatus() {
  console.log(chalk.yellow('\nMCP Connection Status:\n'));
  console.log(`Server URL: ${chalk.blue(serverConfig.url)}`);
  console.log(`Connected: ${serverConfig.sessionId ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`Session ID: ${serverConfig.sessionId ? chalk.blue(serverConfig.sessionId) : chalk.red('None')}`);
  console.log(`Authenticated: ${serverConfig.authenticated ? chalk.green('Yes') : chalk.red('No')}`);
  
  if (serverConfig.authenticated) {
    console.log(`Username: ${chalk.blue(serverConfig.username)}`);
  }
  
  console.log('');
}

/**
 * Create a new repository
 */
async function createRepository(nameInput) {
  if (!serverConfig.authenticated) {
    throw new Error('Not authenticated. Use auth first.');
  }
  
  let name, description, isPrivate;
  
  if (!nameInput) {
    // Interactive mode
    name = await new Promise((resolve) => {
      rl.question(chalk.yellow('Repository name: '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    description = await new Promise((resolve) => {
      rl.question(chalk.yellow('Description (optional): '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    isPrivate = await new Promise((resolve) => {
      rl.question(chalk.yellow('Private repository? (y/N): '), (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
  } else {
    name = nameInput;
    description = '';
    isPrivate = false;
  }
  
  try {
    console.log(chalk.yellow(`Creating repository: ${name}...`));
    
    const response = await axios.post(`${serverConfig.url}/mcp/command`, {
      sessionId: serverConfig.sessionId,
      command: 'CREATE_REPOSITORY',
      parameters: {
        name,
        description,
        private: isPrivate
      }
    });
    
    if (response.data.status === 'success') {
      console.log(chalk.green(`Repository created: ${response.data.data.name}`));
      console.log(`URL: ${chalk.blue(response.data.data.url)}`);
    } else {
      console.log(chalk.red(`Repository creation failed: ${response.data.message}`));
    }
  } catch (err) {
    console.error(chalk.red(`Repository creation failed: ${err.message}`));
    throw new Error('Repository creation failed');
  }
}

/**
 * Create a new issue
 */
async function createIssue(input) {
  if (!serverConfig.authenticated) {
    throw new Error('Not authenticated. Use auth first.');
  }
  
  let owner, repo, title, body, labels;
  
  if (!input) {
    // Interactive mode
    const repoInfo = await new Promise((resolve) => {
      rl.question(chalk.yellow('Repository (owner/repo): '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    [owner, repo] = repoInfo.split('/');
    
    title = await new Promise((resolve) => {
      rl.question(chalk.yellow('Issue title: '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    body = await new Promise((resolve) => {
      rl.question(chalk.yellow('Issue body: '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    const labelsInput = await new Promise((resolve) => {
      rl.question(chalk.yellow('Labels (comma-separated, optional): '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    labels = labelsInput ? labelsInput.split(',').map(l => l.trim()) : [];
  } else {
    const parts = input.split(' ');
    const repoInfo = parts[0];
    [owner, repo] = repoInfo.split('/');
    
    title = parts.slice(1).join(' ');
    body = '';
    labels = [];
  }
  
  try {
    console.log(chalk.yellow(`Creating issue in ${owner}/${repo}...`));
    
    const response = await axios.post(`${serverConfig.url}/mcp/command`, {
      sessionId: serverConfig.sessionId,
      command: 'CREATE_ISSUE',
      parameters: {
        owner,
        repo,
        title,
        body,
        labels
      }
    });
    
    if (response.data.status === 'success') {
      console.log(chalk.green(`Issue created: #${response.data.data.number}`));
      console.log(`URL: ${chalk.blue(response.data.data.url)}`);
    } else {
      console.log(chalk.red(`Issue creation failed: ${response.data.message}`));
    }
  } catch (err) {
    console.error(chalk.red(`Issue creation failed: ${err.message}`));
    throw new Error('Issue creation failed');
  }
}

/**
 * Create a new pull request
 */
async function createPullRequest(input) {
  if (!serverConfig.authenticated) {
    throw new Error('Not authenticated. Use auth first.');
  }
  
  let owner, repo, title, body, head, base;
  
  if (!input) {
    // Interactive mode
    const repoInfo = await new Promise((resolve) => {
      rl.question(chalk.yellow('Repository (owner/repo): '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    [owner, repo] = repoInfo.split('/');
    
    title = await new Promise((resolve) => {
      rl.question(chalk.yellow('Pull request title: '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    body = await new Promise((resolve) => {
      rl.question(chalk.yellow('Pull request body: '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    head = await new Promise((resolve) => {
      rl.question(chalk.yellow('Head branch: '), (answer) => {
        resolve(answer.trim());
      });
    });
    
    base = await new Promise((resolve) => {
      rl.question(chalk.yellow('Base branch: '), (answer) => {
        resolve(answer.trim());
      });
    });
  } else {
    const parts = input.split(' ');
    const repoInfo = parts[0];
    [owner, repo] = repoInfo.split('/');
    
    title = parts[1];
    head = parts[2];
    base = parts[3] || 'main';
    body = '';
  }
  
  try {
    console.log(chalk.yellow(`Creating pull request in ${owner}/${repo}...`));
    
    const response = await axios.post(`${serverConfig.url}/mcp/command`, {
      sessionId: serverConfig.sessionId,
      command: 'CREATE_PULL_REQUEST',
      parameters: {
        owner,
        repo,
        title,
        body,
        head,
        base
      }
    });
    
    if (response.data.status === 'success') {
      console.log(chalk.green(`Pull request created: #${response.data.data.number}`));
      console.log(`URL: ${chalk.blue(response.data.data.url)}`);
    } else {
      console.log(chalk.red(`Pull request creation failed: ${response.data.message}`));
    }
  } catch (err) {
    console.error(chalk.red(`Pull request creation failed: ${err.message}`));
    throw new Error('Pull request creation failed');
  }
}

/**
 * Disconnect from the server
 */
async function disconnect() {
  if (serverConfig.sessionId) {
    try {
      await axios.post(`${serverConfig.url}/mcp/disconnect`, {
        sessionId: serverConfig.sessionId
      });
      
      console.log(chalk.green('Disconnected from MCP server'));
    } catch (err) {
      console.error(chalk.red(`Disconnect error: ${err.message}`));
    }
    
    serverConfig.sessionId = null;
    serverConfig.authenticated = false;
    serverConfig.username = null;
  }
}

// Start the CLI
main().catch(err => {
  console.error(chalk.red(`Fatal error: ${err.message}`));
  process.exit(1);
});