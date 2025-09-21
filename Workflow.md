# Devfluo Workflow Guide

This document provides detailed instructions for using the Devfluo MCP server in your development workflow.

## Installation & Setup

### Prerequisites
- Node.js ≥22.0.0
- npm or equivalent package manager

### Installation Steps

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

3. Initialize for development:
```bash
npm run dev
```

## MCP Client Integration

### General MCP Client Configuration

Configure your MCP client to use this server with stdio transport:

```json
{
  "mcpServers": {
    "devfluo": {
      "command": "npx",
      "args": ["devfluo"],
      "env": {
        "PROJECT_ROOT": "/path/to/your/project/.knowledge-base"
      }
    }
  }
}
```

### Claude Code Integration

For Claude Code integration:
```bash
claude mcp add --scope project --env PROJECT_ROOT=$(pwd)/.knowledge-base -- npx devfluo
```

## Configuration

The server uses the `PROJECT_ROOT` environment variable to determine where to store the knowledge base. This should point to a dedicated directory (typically `.knowledge-base` in your project root).

### Directory Structure
```
PROJECT_ROOT/
├── base/
│   ├── architecture.md    # Project architecture documentation
│   └── codebase.md       # Codebase understanding and conventions
├── backlog/              # Backlog items
├── initiatives/          # Development initiatives
│   └── {initiative-id}/
│       ├── overview.md   # Initiative overview
│       ├── spec.md       # Detailed specification
│       ├── tasks.json    # Task definitions and progress
│       ├── decisions.json# Decisions made during initiative
│       ├── solutions.json# Solutions discovered
│       └── patterns.json # Patterns established
└── decisions.json        # Global project decisions
```

## Complete Development Workflow

### 1. Initialize Project
Use the `project_init` tool to create the base knowledge structure:
```
Tool: project_init
Purpose: Creates the foundational knowledge base directories and template files
Result: Sets up architecture.md and codebase.md templates
```

### 2. Create Initiative
Use `initiative_create` to start a new development project:
```
Tool: initiative_create
Required: id, name
Optional: overview, fromBacklogId
Purpose: Creates a new development initiative with structured folders
```

### 3. Plan Tasks
Use the `initiative-planning` prompt to break down work:
```
Prompt: initiative-planning
Purpose: Generates comprehensive task breakdown with dependencies
Input: Initiative context and requirements
Output: Structured task list with timelines and dependencies
```

### 4. Execute Development
Use `initiative-task-execution` prompt for guided implementation:
```
Prompt: initiative-task-execution
Purpose: Provides step-by-step guidance for task implementation
Input: Specific task and context
Output: Implementation plan with validation steps
```

### 5. Capture Knowledge
Use `initiative-knowledge-collection` to document learnings:
```
Prompt: initiative-knowledge-collection
Purpose: Captures decisions, patterns, and solutions discovered
Input: Implementation experience and outcomes
Output: Structured knowledge entries for future reference
```

## Available Tools

### Core Management Tools
- **project_init**: Initialize the knowledge base structure
- **initiative_create**: Create new development initiatives
- **initiative_update**: Update existing initiatives with tasks, decisions, patterns
- **initiative_delete**: Remove initiatives and cleanup
- **backlog_management**: Handle project backlog items
- **issue_management**: Track and resolve development issues
- **update_knowledge**: Maintain base knowledge documents

### Tool Usage Examples

#### Creating an Initiative
```json
{
  "id": "user-auth",
  "name": "User Authentication System", 
  "overview": "# User Authentication\n\nImplement OAuth-based authentication..."
}
```

#### Updating an Initiative with Tasks
```json
{
  "id": "user-auth",
  "tasks": {
    "create": [
      {
        "id": "setup-oauth",
        "name": "Setup OAuth Provider",
        "description": "Configure OAuth with Google and GitHub",
        "status": "pending",
        "effort": "M"
      }
    ]
  }
}
```

## Available Resources

### Knowledge Resources
- **knowledge**: Access to base project knowledge (architecture.md, codebase.md)
- **initiatives**: Initiative data and specifications  
- **decisions**: Architecture and design decisions with rationale
- **patterns**: Reusable code patterns and best practices
- **solutions**: Problem-solution pairs for common challenges
- **backlog**: Project backlog items with priorities

### Resource Access Examples

Query initiatives:
```
Resource: initiatives
Returns: List of all initiatives with metadata and content
```

Access specific knowledge:
```
Resource: knowledge  
Returns: Current architecture and codebase documentation
```

## Available Prompts

### Development Phase Prompts
- **project-initialization**: Guide initial project setup with templates
- **initiative-specification**: Create detailed initiative specifications  
- **initiative-planning**: Generate task breakdowns and timelines
- **initiative-task-execution**: Guide task implementation with validation
- **initiative-knowledge-collection**: Capture learnings post-implementation
- **initiative-scope-change**: Handle requirement changes systematically
- **initiative-completion**: Finalize initiatives and extract knowledge
- **issue-resolution**: Structured problem-solving approach
- **backlog-specification**: Define backlog item requirements
- **project-knowledge-validation**: Validate and update project knowledge

### Prompt Usage Patterns

Most prompts follow this pattern:
1. **Context Gathering**: Prompt analyzes current project state
2. **Template Application**: Uses ETA templates for consistent output  
3. **Structured Output**: Returns formatted guidance or documentation
4. **Knowledge Integration**: Updates relevant knowledge stores

## Advanced Workflows

### Initiative Lifecycle Management

1. **Conception**: Create initiative from backlog item
2. **Specification**: Use prompts to create detailed specs
3. **Planning**: Break down into executable tasks
4. **Execution**: Implement with guided prompts
5. **Knowledge Capture**: Document patterns and decisions
6. **Completion**: Finalize and extract reusable knowledge

### Cross-Initiative Knowledge Sharing

The system automatically shares knowledge between initiatives:
- **Decisions**: Available across all initiatives
- **Patterns**: Reusable in similar contexts
- **Solutions**: Applied to similar problems
- **Base Knowledge**: Updated based on all initiative learnings

### Debugging and Inspection

Use the MCP inspector for development:
```bash
npm run inspector
```

This provides a web interface to interact with all tools, resources, and prompts for testing and debugging.

## Best Practices

### Initiative Management
- Use descriptive, kebab-case IDs for initiatives
- Start with clear overview before detailed specification
- Break large initiatives into smaller, manageable tasks
- Regularly capture knowledge during implementation

### Knowledge Maintenance  
- Keep base knowledge documents current
- Document decisions with clear rationale
- Extract reusable patterns from implementations
- Validate knowledge accuracy periodically

### Development Workflow
- Initialize project knowledge base early
- Use prompts consistently for guided development
- Leverage existing patterns and solutions
- Maintain initiative state accurately

## Troubleshooting

### Common Issues

**Knowledge Base Not Found**:
- Ensure PROJECT_ROOT environment variable is set
- Run project_init tool to create base structure

**Initiative Creation Fails**:
- Check ID format (lowercase, hyphens only)
- Ensure unique initiative IDs
- Verify PROJECT_ROOT permissions

**Prompt Template Errors**:
- Check template file availability in templates/
- Verify ETA template syntax
- Ensure required context data is provided

**Resource Access Issues**:
- Verify knowledge base structure exists
- Check file permissions in PROJECT_ROOT
- Ensure JSON files are valid format