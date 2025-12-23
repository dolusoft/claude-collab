# Claude Collab

Real-time team collaboration between Claude Code terminals via MCP (Model Context Protocol).

[![npm version](https://badge.fury.io/js/@dolusoft%2Fclaude-collab.svg)](https://www.npmjs.com/package/@dolusoft/claude-collab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Claude Collab enables multiple Claude Code terminals to communicate with each other in real-time. Perfect for teams where frontend and backend developers need their Claude Code instances to share context, ask questions, and coordinate on complex debugging sessions.

```
┌─────────────────┐         ┌─────────────────┐
│  Frontend       │◄───────►│  Backend        │
│  Claude Code    │   Hub   │  Claude Code    │
│  Terminal       │         │  Terminal       │
└─────────────────┘         └─────────────────┘
```

## Features

- **Real-time Communication**: Instant message exchange between Claude Code terminals
- **Team Channels**: Organize communication by team (frontend, backend, devops, etc.)
- **Question & Answer**: Ask questions to other teams and receive responses
- **Markdown Support**: Share code snippets and formatted text
- **Auto-Hub**: Hub server starts automatically when needed
- **Zero Config**: Works out of the box with sensible defaults

## Installation

No cloning required! Install directly via npx:

```bash
# Start the hub server
npx @dolusoft/claude-collab hub start

# Or add to Claude Code with auto-hub
claude mcp add claude-collab -- npx @dolusoft/claude-collab client --team frontend --auto-hub
```

## Quick Start

### 1. Start the Hub (one-time setup)

```bash
npx @dolusoft/claude-collab hub start
```

The hub runs on `localhost:9999` by default.

### 2. Add to Claude Code

**Frontend Terminal:**
```bash
claude mcp add claude-collab -- npx @dolusoft/claude-collab client --team frontend
```

**Backend Terminal:**
```bash
claude mcp add claude-collab -- npx @dolusoft/claude-collab client --team backend
```

### 3. Start Collaborating

In your Claude Code session, you can now use these tools:

```
# Join a team
> Ask Claude to join the frontend team

# Ask a question to another team
> "Ask the backend team: What's the response format for the /users endpoint?"

# Check incoming questions
> "Check my inbox for questions from other teams"

# Reply to a question
> "Reply to question q_123: The endpoint returns JSON with id, name, email fields"
```

## MCP Tools

| Tool | Description | Example |
|------|-------------|---------|
| `join` | Join a team channel | `join("frontend")` |
| `ask` | Ask a question (waits 30s for response) | `ask("backend", "API format?")` |
| `inbox` | List incoming questions | `inbox()` |
| `reply` | Reply to a question | `reply("q_123", "Here's the answer...")` |

## Use Cases

### Bug Coordination

```
Frontend: "Backend team, we're seeing duplicate SignalR messages.
          Can you check if OnConnectedAsync is being called multiple times?"

Backend:  "Found it! Logs show 2 connection IDs for the same user:
          conn_abc123 - 10:00:01
          conn_xyz789 - 10:00:01
          Looks like React StrictMode is causing double connections."
```

### API Design Sync

```
Frontend: "What should the request payload look like for the new checkout flow?"

Backend:  "Here's the schema:
          ```json
          {
            \"items\": [{\"id\": string, \"quantity\": number}],
            \"paymentMethod\": \"card\" | \"paypal\"
          }
          ```"
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_COLLAB_PORT` | `9999` | Hub server port |
| `CLAUDE_COLLAB_HOST` | `localhost` | Hub server host |

### CLI Options

```bash
# Hub server
npx @dolusoft/claude-collab hub start --port 9999 --host localhost

# Client
npx @dolusoft/claude-collab client --team frontend --port 9999 --host localhost --auto-hub
```

## Architecture

Claude Collab uses a hub-and-spoke architecture:

```
                    ┌─────────────────────────────────┐
                    │           HUB SERVER            │
                    │     (WebSocket, port 9999)      │
                    │                                 │
                    │  ┌─────────┐  ┌─────────────┐   │
                    │  │ Teams   │  │  Questions  │   │
                    │  │ Members │  │  Answers    │   │
                    │  └─────────┘  └─────────────┘   │
                    └──────────┬──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌──────────┐     ┌──────────┐     ┌──────────┐
       │   MCP    │     │   MCP    │     │   MCP    │
       │ Client 1 │     │ Client 2 │     │ Client N │
       │(frontend)│     │(backend) │     │ (devops) │
       └──────────┘     └──────────┘     └──────────┘
              │                │                │
              ▼                ▼                ▼
       ┌──────────┐     ┌──────────┐     ┌──────────┐
       │  Claude  │     │  Claude  │     │  Claude  │
       │   Code   │     │   Code   │     │   Code   │
       │Terminal 1│     │Terminal 2│     │Terminal N│
       └──────────┘     └──────────┘     └──────────┘
```

### Domain-Driven Design

The codebase follows DDD principles with 4 layers:

```
src/
├── domain/          # Entities, Value Objects, Domain Events
├── application/     # Use Cases, DTOs
├── infrastructure/  # WebSocket, Repositories
└── presentation/    # MCP Tools, CLI
```

## Development

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Setup

```bash
git clone https://github.com/dolusoft/claude-collab.git
cd claude-collab
pnpm install
```

### Commands

```bash
pnpm build        # Build the project
pnpm dev          # Watch mode
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm format       # Format code
```

### Testing

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- Inspired by the need for better AI-assisted team collaboration
- Created by [Dolusoft](https://github.com/dolusoft)

---

**Note:** This project is in active development. Features may change.
