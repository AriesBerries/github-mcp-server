# Contributing to GitHub MCP Server

Thank you for your interest in contributing to the GitHub MCP Server project! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We strive to foster an inclusive and welcoming community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear and descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Any relevant logs or error messages
- Your environment (OS, Node.js version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

- A clear and descriptive title
- A detailed description of the proposed feature
- Any relevant use cases or examples
- Potential implementation ideas (optional)

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Write or update tests as needed
5. Ensure all tests pass
6. Submit a pull request

#### Pull Request Guidelines

- Follow the existing code style and conventions
- Include tests for new features or bug fixes
- Update documentation as needed
- Keep PRs focused on a single change/feature
- Provide a clear description of the changes in your PR

## Development Setup

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git

### Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/github-mcp-server.git
   cd github-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a development configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your development settings
   ```

4. Run tests:
   ```bash
   npm test
   ```

5. Start the server in development mode:
   ```bash
   npm run dev
   ```

## Testing

Please ensure all tests pass before submitting a PR:

```bash
npm test
```

Write new tests for new features or bug fixes.

## Code Style

We use ESLint to maintain code quality. Run the linter before submitting PRs:

```bash
npm run lint
```

## Documentation

Update documentation to reflect any changes you make to the code. This includes:

- README.md
- API docs
- Code comments
- Any other relevant documentation

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.

## Questions

If you have any questions, feel free to create an issue for discussion.

Thank you for your contributions!