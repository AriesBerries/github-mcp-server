# Installation Guide

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- A GitHub account with API access

## Basic Installation

1. Clone the repository:

```bash
git clone https://github.com/AriesBerries/github-mcp-server.git
cd github-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Create a configuration file by copying the example:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your GitHub credentials and configuration.

5. Start the server:

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

## Docker Installation

Alternatively, you can run the MCP server using Docker:

1. Build the Docker image:

```bash
docker build -t github-mcp-server .
```

2. Run the container:

```bash
docker run -p 3000:3000 --env-file .env -d github-mcp-server
```

## GitHub Token Setup

To use the GitHub MCP Server, you'll need a GitHub personal access token with the following scopes:

- `repo` (Full control of private repositories)
- `workflow` (Update GitHub Action workflows)
- `admin:org` (Organization administration)

To create a token:

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token"
3. Give your token a descriptive name
4. Select the required scopes
5. Click "Generate token"
6. Copy the token and add it to your `.env` file

## Configuration Options

The following options can be set in the `.env` file:

| Option | Description | Default |
|--------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `GITHUB_APP_ID` | GitHub App ID (if using GitHub App) | - |
| `GITHUB_PRIVATE_KEY` | GitHub App private key | - |
| `GITHUB_WEBHOOK_SECRET` | Secret for GitHub webhooks | - |
| `JWT_SECRET` | Secret for JWT tokens | - |
| `LOG_LEVEL` | Logging level | info |

## Webhook Setup

To receive GitHub webhooks:

1. In your GitHub repository or organization settings, go to Webhooks
2. Add a new webhook with the URL: `http://your-server/webhooks/github`
3. Set the content type to `application/json`
4. Enter your webhook secret from the `.env` file
5. Choose which events to receive (recommended: pushes, pull requests, issues)
6. Save the webhook

## Running as a Service

To run the MCP server as a system service on Linux:

1. Create a systemd service file:

```bash
sudo nano /etc/systemd/system/github-mcp.service
```

2. Add the following content:

```
[Unit]
Description=GitHub MCP Server
After=network.target

[Service]
Type=simple
User=<your-user>
WorkingDirectory=/path/to/github-mcp-server
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl enable github-mcp
sudo systemctl start github-mcp
```

4. Check the status:

```bash
sudo systemctl status github-mcp
```