# Devfluo

A sophisticated Model Context Protocol (MCP) server that provides comprehensive development workflow management with a multi-level knowledge base system. This server enables AI assistants to manage project initiatives, track decisions, maintain code patterns, and provide structured development guidance through persistent knowledge storage.

## Purpose

Devfluo is designed to maintain consistency and continuity across development sessions by providing:

- **Multi-level Memory System**: Persistent storage of project knowledge, decisions, patterns, and solutions
- **Initiative Management**: Structured approach to managing development projects with tasks, specifications, and progress tracking  
- **Knowledge Base**: Centralized repository for architecture documentation, codebase understanding, and development patterns
- **AI-Driven Prompts (commands)**: Specialized prompts for different phases of development workflow
- **Structured Development**: Enforces consistent practices through schemas and validation

## Architecture

The server implements a comprehensive knowledge management system with several key components:

### Knowledge Layers
- **Base Knowledge**: Core project architecture and codebase documentation
- **Initiatives**: Individual development projects with specifications, tasks, and progress tracking
- **Decisions**: Architecture and design decisions with rationale and context
- **Patterns**: Reusable code patterns and best practices
- **Solutions**: Problem-solution pairs for common development challenges
- **Backlog**: Prioritized list of future development items

## Installation

### Prerequisites
- Node.js ≥22.0.0
- npm or equivalent package manager

### Quick Setup

1. Clone and install dependencies:
```bash
git clone <repository-url>
cd devfluo
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run the server:
```bash
npm run start
```

## Usage

For detailed usage instructions, MCP client integration, workflow examples, and configuration details, see the [Workflow Guide](./Workflow.md).

### Quick Start

1. Configure your MCP client to use this server with stdio transport
2. Set the `PROJECT_ROOT` environment variable to your knowledge base directory
3. Initialize your project with the `project_init` tool
4. Create initiatives and manage your development workflow

## Development

### Available Scripts
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Build and run in development mode
- `npm run inspector` - Run with MCP inspector for debugging
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Check code style with Biome

### Code Style
- Tab indentation, ESM modules, Zod validation, functional programming patterns

## Contributing

Follow existing code patterns, add tests for new features, update documentation, and ensure TypeScript compliance. See development section for specific guidelines.

## License

MIT License - see LICENSE file for details.