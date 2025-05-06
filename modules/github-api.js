/**
 * GitHub API Integration Module
 */

const { Octokit } = require('octokit');
const logger = require('./logger');

/**
 * Verify GitHub token and get user information
 */
async function verifyToken(token) {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();
    
    return {
      login: data.login,
      id: data.id,
      name: data.name,
      token: token
    };
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`);
    throw new Error('Invalid GitHub token');
  }
}

/**
 * Create a new GitHub repository
 */
async function createRepository(token, { name, description, private }) {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.createForAuthenticatedUser({
      name,
      description,
      private: !!private,
      auto_init: true
    });
    
    logger.info(`Repository created: ${data.full_name}`);
    return data;
  } catch (err) {
    logger.error(`Repository creation failed: ${err.message}`);
    throw err;
  }
}

/**
 * Push files to a GitHub repository
 */
async function pushFiles(token, { owner, repo, branch, files, message }) {
  try {
    const octokit = new Octokit({ auth: token });
    
    // Get reference to head
    const refResponse = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
    
    const currentCommitSha = refResponse.data.object.sha;
    
    // Get current commit
    const commitResponse = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha
    });
    
    const treeSha = commitResponse.data.tree.sha;
    
    // Create blobs for each file
    const blobPromises = files.map(file => {
      return octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      });
    });
    
    const blobs = await Promise.all(blobPromises);
    
    // Create tree with new files
    const treeItems = files.map((file, index) => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blobs[index].data.sha
    }));
    
    const newTree = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree: treeItems
    });
    
    // Create commit
    const newCommit = await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.data.sha,
      parents: [currentCommitSha]
    });
    
    // Update reference
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.data.sha
    });
    
    logger.info(`Files pushed to ${owner}/${repo}:${branch}`);
    return true;
  } catch (err) {
    logger.error(`File push failed: ${err.message}`);
    throw err;
  }
}

/**
 * Create a new issue
 */
async function createIssue(token, { owner, repo, title, body, labels }) {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels
    });
    
    logger.info(`Issue created: ${owner}/${repo}#${data.number}`);
    return data;
  } catch (err) {
    logger.error(`Issue creation failed: ${err.message}`);
    throw err;
  }
}

/**
 * Create a new pull request
 */
async function createPullRequest(token, { owner, repo, title, body, head, base }) {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base
    });
    
    logger.info(`Pull request created: ${owner}/${repo}#${data.number}`);
    return data;
  } catch (err) {
    logger.error(`Pull request creation failed: ${err.message}`);
    throw err;
  }
}

/**
 * Handle GitHub webhook events
 */
function handleWebhook(req, res) {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  
  logger.info(`GitHub webhook received: ${event}`);
  
  // Process different webhook events
  switch (event) {
    case 'push':
      processPushEvent(payload);
      break;
    
    case 'pull_request':
      processPullRequestEvent(payload);
      break;
    
    case 'issues':
      processIssueEvent(payload);
      break;
  }
  
  res.status(200).send('Webhook received');
}

/**
 * Process GitHub push event
 */
function processPushEvent(payload) {
  const { repository, commits, ref } = payload;
  logger.info(`Push to ${repository.full_name} (${ref}): ${commits.length} commits`);
  
  // Additional processing logic can be added here
}

/**
 * Process GitHub pull request event
 */
function processPullRequestEvent(payload) {
  const { action, pull_request, repository } = payload;
  logger.info(`Pull request ${action}: ${repository.full_name}#${pull_request.number}`);
  
  // Additional processing logic can be added here
}

/**
 * Process GitHub issue event
 */
function processIssueEvent(payload) {
  const { action, issue, repository } = payload;
  logger.info(`Issue ${action}: ${repository.full_name}#${issue.number}`);
  
  // Additional processing logic can be added here
}

module.exports = {
  verifyToken,
  createRepository,
  pushFiles,
  createIssue,
  createPullRequest,
  handleWebhook
};