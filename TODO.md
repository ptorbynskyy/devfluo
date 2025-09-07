# Issues management
### Goal
Track and manage issues that arise during initiative development, analyze them to determine appropriate resolution strategies, and accumulate experience for future use.

### Domain
- Issue: Problems encountered during initiative development including bugs, blockers, performance issues, or additional work requirements
- Resolution strategies: Different approaches to handle issues based on their impact and severity

### Architecture
- File system storage structure
    - Root directory
    - Initiatives folder // initiatives
    - Specific initiative folder (named by initiative) // user-auth
    - Issues subfolder // issues
    - Individual issue folder (named by issue) // oauth-google-redirect-wrong
    - JSON data files within issue folders - data.json

### Data
- Issue structure:
    - id (unique identifier, folder name)
    - Name (required)
    - Description (required)
    - Recommended strategy (optional, appears after updates) // "embed" | "replan" | "defer" | "cancelInitiative"
    - Effort assessment (optional) // S/M/L/XL/XXL etc
    - tags (string[])
    - status (string) // "open" | "closed"


### MCP tool
- Issue management - create, update, delete
  - Issue creation: Triggered when user reports a problem during or after task implementation
  - Issue update - Strategy assignment: Determines resolution approach based on issue analysis, close issue
#### MCP resource
Create two MCP resources to manage issues within initiatives.

- List issues resource: returns all issues for a specific initiative
    - Template parameter: initiative identifier
    - Returns: JSON with list of issues

- Get issue resource: returns specific issue information
    - Template parameters: initiative identifier, issue identifier
    - Returns: JSON with issue details

- Initiative identifier: required for both resources
- Issue identifier: required for specific issue retrieval
- JSON format: output format for both resources 

### Domain
- Resolution strategies:
    - Embed: Add tasks to current initiative plan for simple problems
    - Replan: Substantial rescheduling with task replacement and new task additions for serious problems
    - Defer: Create backlog item for non-critical issues that don't affect main workflow
    - Cancel initiative: Terminate entire initiative when problem makes it unnecessary
    - Cancel issue: Mark issue as insignificant or reject without action
- Knowledge base: Accumulate decisions, solutions, and patterns from issues for future reference and project-wide learning


# Get initiative context (for task(s) - phase)
  	- global context
   		- decisions, solutions, patterns (filter by tags)
	    - arhitecture.md
	    - codebase.md
    - initative context
    	- overview.md
    	- name
    	- spec.md
        - desitions, solutions, patterns (filter by tags)
    - tasks


# Prompt to complete initiative
 - check
 - get knoaladge ??
 - update state


# Copmlete Initiative
 - prompt ....

-----------------------
# Initiative brainstorming
 - prompt for initiative brainstorming with create spec as result ***

# Initiative planning
  - prompt for initiative planning with create tasks based on context
  	- global context
   		- decisions, solutions, patterns (filter by tags)
	    - arhitecture.md
	    - codebase.md
    - initative context
    	- overview.md
    	- name
    	- spec.md

## Checks
 - Must have empty task list

## Output
 - Created tasks list -> update_initiative

---
# Session end - collect knowledge
