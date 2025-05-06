# MCP Command Line Interface

## Overview

The MCP CLI provides a command-line interface for interacting with the GitHub MCP Server. It allows you to connect to the server, authenticate, and execute MCP commands directly from your terminal.

## Installation

### Global Installation

To install the MCP CLI globally, run:

```bash
npm install -g github-mcp-server
```

This will make the `mcp-cli` command available in your terminal.

### Local Usage

If you don't want to install globally, you can run the CLI directly from the repository:

```bash
node mcp-cli.js
```

## Usage

### Starting the CLI

To start the MCP CLI, simply run:

```bash
mcp-cli
```

By default, the CLI will attempt to connect to an MCP server running at `http://localhost:3000`. You can specify a different server URL when connecting.

### Available Commands

#### connect [url]

Connect to an MCP server. If no URL is provided, it will use the default URL.

```
MCP> connect http://mcp-server.example.com
```

#### auth [token]

Authenticate with a GitHub token. If no token is provided, you will be prompted to enter one.

```
MCP> auth ghp_xxxxxxxxxxxxxxxx
```

#### status

Display the current connection status.

```
MCP> status
```

#### create-repo [name]

Create a new GitHub repository. If called without arguments, you will be prompted for the details.

```
MCP> create-repo my-new-repo
```

#### create-issue [owner/repo] [title]

Create a new issue in a GitHub repository. If called without arguments, you will be prompted for the details.

```
MCP> create-issue username/repo "Bug: Application crashes on startup"
```

#### create-pr [owner/repo] [title] [head] [base]

Create a new pull request in a GitHub repository. If called without arguments, you will be prompted for the details.

```
MCP> create-pr username/repo "Add new feature" feature-branch main
```

#### exit

Disconnect from the server and exit the CLI.

```
MCP> exit
```

## Examples

### Creating a Repository

```
MCP> connect
Connecting to MCP server at http://localhost:3000...
Connected to GitHub MCP Server (MCP/2.1)
Session ID: mcp-1620487921234-aef3d
Connection established. Authentication required.

MCP> auth
Enter GitHub token: [your-token-here]
Authenticating...
Authentication successful. Logged in as username
Access level: admin

MCP> create-repo
Repository name: example-project
Description (optional): An example project created with MCP
Private repository? (y/N): n
Creating repository: example-project...
Repository created: example-project
URL: https://github.com/username/example-project
```

### Creating an Issue

```
MCP> create-issue username/example-project "Add documentation"
Creating issue in username/example-project...
Issue created: #1
URL: https://github.com/username/example-project/issues/1
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the MCP server:

1. Make sure the server is running
2. Check that the URL is correct
3. Verify there are no network issues or firewalls blocking the connection

### Authentication Issues

If authentication fails:

1. Make sure your GitHub token is valid
2. Check that the token has the necessary permissions
3. Verify the token hasn't expired