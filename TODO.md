# Prompt that creates spec for baglog item
### Goal
Add a prompt to the MCP server that provides a user flow for creating specifications for backlog items.

### Architecture
- MCP server with new prompt endpoint
- Backlog item validation component
- Context loading system
    - Knowledge base loader // load with knowledge MCP resources (dessions, solutions, patterns)
    - Architecture information loader // load with architecture MCP resource
    - Code base loader // load with codebase MCP resource
- Brainstorming mechanism // LLM conduct user interview
- Specification generator // LLM generates summary markdown document with detailed requirements
- Backlog update tool // Updates backlog item with specification content

### API
- New prompt endpoint: accepts backlog item ID as main argument
- Backlog item existence check: validates item exists
- Specification check: verifies no existing specification
- Context loading methods: retrieve project knowledge, decisions, solutions, patterns, architecture, and code base
- Backlog item information retrieval: gets name and description
- Brainstorming interface: conducts step-by-step questioning
- Specification creation: generates markdown document
- Backlog update tool: saves specification content to backlog item

### Code
- New prompt handler: processes backlog item specification creation flow
- Validation module: checks backlog item existence and specification absence
- Context loader: aggregates relevant project information
- Interview engine: manages iterative questioning process
- Markdown generator: creates specification document
- Integration module: connects to backlog update functionality

### Domain
- Backlog item: must exist and lack existing specification
- Specification: markdown document containing detailed requirements
- Knowledge base: includes decisions, solutions, patterns for project context
- Brainstorming process: iterative questioning to gather complete specification details

### Details
Process flow requires sequential validation before proceeding to specification creation. Context loading must complete before brainstorming begins. Interview process continues until all backlog item details are captured. Final specification must be saved using existing backlog update tool.


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
