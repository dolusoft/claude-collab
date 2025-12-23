# Architecture Documentation

This document describes the architecture of Claude Collab, a real-time collaboration system for Claude Code terminals.

## Overview

Claude Collab uses a **hub-and-spoke architecture** where:
- A central **Hub Server** manages all team communications
- Multiple **MCP Clients** connect to the hub and integrate with Claude Code terminals
- Communication happens via **WebSocket** for real-time message delivery

```
                    ┌─────────────────────────────────────┐
                    │           HUB SERVER                │
                    │     (WebSocket, port 9999)          │
                    │                                     │
                    │  ┌───────────┐  ┌──────────────┐    │
                    │  │  Teams    │  │  Questions   │    │
                    │  │  Members  │  │  Answers     │    │
                    │  └───────────┘  └──────────────┘    │
                    └──────────────┬──────────────────────┘
                                   │ WebSocket
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
       │  MCP Client  │     │  MCP Client  │     │  MCP Client  │
       │  (frontend)  │     │  (backend)   │     │   (devops)   │
       └──────────────┘     └──────────────┘     └──────────────┘
              │ stdio             │ stdio             │ stdio
              ▼                   ▼                   ▼
       ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
       │ Claude Code  │     │ Claude Code  │     │ Claude Code  │
       │  Terminal 1  │     │  Terminal 2  │     │  Terminal N  │
       └──────────────┘     └──────────────┘     └──────────────┘
```

## Domain-Driven Design (DDD)

The codebase follows Domain-Driven Design principles with 4 distinct layers:

```
src/
├── domain/           # Core business logic (no external dependencies)
├── application/      # Use cases and orchestration
├── infrastructure/   # Technical implementations (WebSocket, repositories)
└── presentation/     # MCP tools and CLI interface
```

### Domain Layer (`src/domain/`)

Contains the core business entities and rules. This layer has **no external dependencies**.

#### Entities

- **Member**: Represents a Claude Code terminal connected to a team
  - Properties: id, teamId, displayName, status, lastActivity
  - States: ONLINE, IDLE, OFFLINE

- **Team**: Represents a group of members (e.g., "frontend", "backend")
  - Properties: id, name, memberIds
  - Methods: addMember, removeMember, getOtherMemberIds

- **Question**: A question sent from one team to another
  - Properties: id, fromMemberId, toTeamId, content, status, createdAt
  - States: PENDING, ANSWERED, TIMEOUT, CANCELLED

- **Answer**: A response to a question
  - Properties: id, questionId, fromMemberId, content, createdAt

#### Value Objects

- **MessageContent**: Immutable container for message text and format
  - Supports `plain` and `markdown` formats
  - Max length: 50,000 characters
  - Provides `preview` method for truncated display

#### Domain Events

- `MemberJoinedEvent`: Fired when a member joins a team
- `MemberLeftEvent`: Fired when a member leaves
- `QuestionAskedEvent`: Fired when a question is sent
- `QuestionAnsweredEvent`: Fired when a question receives an answer

### Application Layer (`src/application/`)

Contains use cases that orchestrate domain logic.

#### Use Cases

- **JoinTeamUseCase**: Handles team membership
  - Creates or gets team
  - Creates member and adds to team
  - Fires MemberJoinedEvent

- **AskQuestionUseCase**: Sends questions between teams
  - Validates sender is in a team
  - Creates and stores question
  - Fires QuestionAskedEvent

- **GetInboxUseCase**: Lists pending questions
  - Returns questions for a team
  - Includes status and age information

- **ReplyQuestionUseCase**: Handles question responses
  - Validates question can be answered
  - Creates answer and updates question status
  - Fires QuestionAnsweredEvent

### Infrastructure Layer (`src/infrastructure/`)

Implements technical concerns.

#### WebSocket

- **HubServer**: Central WebSocket server
  - Manages client connections
  - Routes messages between teams
  - Handles heartbeat and timeout

- **HubClient**: Client that connects to hub
  - Provides `join`, `ask`, `getInbox`, `reply` methods
  - Handles reconnection automatically
  - Supports event callbacks

- **MessageProtocol**: Type-safe message definitions
  - Client → Hub: JOIN, ASK, REPLY, GET_INBOX, PING
  - Hub → Client: JOINED, QUESTION, ANSWER, INBOX, ERROR

#### Repositories

In-memory implementations:
- `InMemoryMemberRepository`
- `InMemoryTeamRepository`
- `InMemoryQuestionRepository`
- `InMemoryAnswerRepository`

### Presentation Layer (`src/presentation/`)

Exposes functionality to Claude Code.

#### MCP Tools

- **join**: Join a team channel
  ```typescript
  join({ team: "frontend", displayName: "Frontend Claude" })
  ```

- **ask**: Ask a question to another team (blocks until answer or timeout)
  ```typescript
  ask({ team: "backend", question: "What's the API format?", timeout: 30000 })
  ```

- **inbox**: List pending questions for your team
  ```typescript
  inbox()
  ```

- **reply**: Reply to a pending question
  ```typescript
  reply({ questionId: "q_123", answer: "Here's the response..." })
  ```

## Message Flow

### Asking a Question

```
┌──────────────┐        ┌────────────┐        ┌──────────────┐
│   Frontend   │        │    Hub     │        │   Backend    │
│    Client    │        │   Server   │        │    Client    │
└──────┬───────┘        └─────┬──────┘        └──────┬───────┘
       │                      │                      │
       │ ASK{toTeam:backend}  │                      │
       │─────────────────────►│                      │
       │                      │                      │
       │   QUESTION_SENT      │                      │
       │◄─────────────────────│                      │
       │                      │                      │
       │                      │  QUESTION{from:frontend}
       │                      │─────────────────────►│
       │                      │                      │
       │                      │      REPLY{answer}   │
       │                      │◄─────────────────────│
       │                      │                      │
       │    ANSWER{content}   │                      │
       │◄─────────────────────│                      │
       │                      │                      │
```

### Question States

```
                     ┌─────────────┐
        ask()        │             │
     ───────────────►│   PENDING   │
                     │             │
                     └──────┬──────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ ANSWERED │    │ TIMEOUT  │    │CANCELLED │
     └──────────┘    └──────────┘    └──────────┘
        reply()      30s elapsed     cancel()
```

## Configuration

Default configuration in `src/config/index.ts`:

```typescript
{
  hub: {
    port: 9999,
    host: 'localhost',
    heartbeatInterval: 30000,  // 30 seconds
    clientTimeout: 60000       // 60 seconds
  },
  communication: {
    defaultTimeout: 30000,     // 30 seconds for question timeout
    maxMessageLength: 50000
  },
  autoStart: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000
  }
}
```

## Type Safety

The project uses **branded types** for type-safe IDs:

```typescript
type MemberId = string & { readonly __brand: 'MemberId' };
type TeamId = string & { readonly __brand: 'TeamId' };
type QuestionId = string & { readonly __brand: 'QuestionId' };
type AnswerId = string & { readonly __brand: 'AnswerId' };
```

This prevents accidental mixing of ID types at compile time.

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Domain entities and value objects
- Use cases with mock repositories

### E2E Tests (`tests/e2e/`)
- Two-terminal communication
- Timeout scenarios
- Reconnection behavior

## Extensibility

### Adding New Teams
Teams are created on-demand when the first member joins. No configuration needed.

### Adding New Message Types
1. Add message type to `MessageProtocol`
2. Add handler in `HubServer`
3. Add client method in `HubClient`
4. Create MCP tool in `presentation/mcp/tools/`

### Custom Repository Implementations
Implement the repository interfaces in `domain/repositories/` to add persistence:
- Redis for distributed caching
- PostgreSQL for long-term storage
- Any other storage backend
