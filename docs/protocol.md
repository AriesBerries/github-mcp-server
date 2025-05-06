# MCP Protocol Documentation

## Overview

The Master Control Program (MCP) protocol is a client-server protocol for interacting with remote systems. This implementation focuses on GitHub integration, allowing clients to manage GitHub repositories, issues, pull requests, and other GitHub resources through a standardized interface.

## Protocol Version

This server implements MCP protocol version 2.1.

## Connection Flow

1. Client connects to the server using the `/mcp/connect` endpoint
2. Server assigns a session ID and returns it to the client
3. Client authenticates using the `/mcp/authenticate` endpoint with a GitHub token
4. Server verifies the token and grants access if valid
5. Client can now execute commands using the `/mcp/command` endpoint
6. Client can disconnect using the `/mcp/disconnect` endpoint when done

## Endpoints

### /mcp/connect

**Request:**
```json
{}
```

**Response:**
```json
{
  "status": "success",
  "sessionId": "mcp-1620487921234-aef3d",
  "server": "GitHub MCP Server",
  "protocol": "MCP/2.1",
  "message": "Connection established. Authentication required."
}
```

### /mcp/authenticate

**Request:**
```json
{
  "sessionId": "mcp-1620487921234-aef3d",
  "token": "github_pat_xxxxx"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Authentication successful",
  "user": "username",
  "accessLevel": "admin"
}
```

### /mcp/command

**Request:**
```json
{
  "sessionId": "mcp-1620487921234-aef3d",
  "command": "CREATE_REPOSITORY",
  "parameters": {
    "name": "example-repo",
    "description": "An example repository",
    "private": false
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Repository created",
  "data": {
    "name": "example-repo",
    "url": "https://github.com/username/example-repo"
  }
}
```

### /mcp/disconnect

**Request:**
```json
{
  "sessionId": "mcp-1620487921234-aef3d"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Disconnected"
}
```

## Commands

The following commands are supported by the GitHub MCP Server:

### CREATE_REPOSITORY

Creates a new GitHub repository.

**Parameters:**
- `name`: Repository name (required)
- `description`: Repository description (optional)
- `private`: Whether the repository should be private (optional, default: false)

### PUSH_FILES

Pushes files to a GitHub repository.

**Parameters:**
- `owner`: Repository owner (required)
- `repo`: Repository name (required)
- `branch`: Branch name (required)
- `files`: Array of file objects with `path` and `content` properties (required)
- `message`: Commit message (required)

### CREATE_ISSUE

Creates a new issue in a GitHub repository.

**Parameters:**
- `owner`: Repository owner (required)
- `repo`: Repository name (required)
- `title`: Issue title (required)
- `body`: Issue body (optional)
- `labels`: Array of label names (optional)

### CREATE_PULL_REQUEST

Creates a new pull request in a GitHub repository.

**Parameters:**
- `owner`: Repository owner (required)
- `repo`: Repository name (required)
- `title`: Pull request title (required)
- `body`: Pull request body (optional)
- `head`: Head branch (required)
- `base`: Base branch (required)

## Error Handling

When an error occurs, the server returns a response with a `status` field set to `"error"` and a `message` field describing the error:

```json
{
  "status": "error",
  "message": "Authentication failed"
}
```

Common error scenarios include:
- Invalid session ID
- Authentication failure
- Invalid command
- Missing required parameters
- GitHub API errors

## Security Considerations

- All communication should be over HTTPS
- GitHub tokens should be kept secure
- Session IDs should be treated as sensitive information
- The server should validate all input to prevent injection attacks