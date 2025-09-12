# Tasks execution prompt
Create an MCP Server Prompt that orchestrates task execution within an initiative. The prompt receives a task list as input - either a single task identifier, comma-separated task list, or task range specified with hyphens. Validate the format and verify all tasks exist, are not already completed, and are executable. Check that there are no unfinished predecessors for these tasks, focusing on external predecessors outside the specified task range. If three interconnected tasks are all included in execution, their internal dependencies can be ignored since they'll execute in proper order naturally. Only external predecessors outside the task list that aren't completed and would block execution matter. Load Project Context similar to other prompts, including initiative context with its decisions, solutions, patterns, overview, specification, and full task list as Markdown table. During execution, track emerging solutions, patterns, problems, and solutions found, saving them for the initiative using Tool Initiative Update for potential future consolidation into project knowledge. Mark all completed tasks as finished after successful execution using Initiative Update Tool to update state.

### Validation
 - Validate task range
   - t001
   - t001,t002
   - t003-t005
 - Task(s) should not be started or completted
 - Validate that group of task don't have not completted predessors
### Context
 - load project context
 - load initiative context 
   - decisions, solutions, patterns, 
   - overview, 
   - spec 
   - full task list - generateTasksMarkdownReport 

### Task Execution
**Work on task using:**
- Relevant decisions from knowledge base
- Architecture constraints
- Similar solutions
- Established patterns

**Track(initiative update tool) in current session:**
- Decisions made (key: value format)
- Problems solved (problem → solution)
- Patterns applied

### Code Quality Checks
- Follow existing patterns
- Maintain consistency
- Update documentation

### Update State
After execution:
- Update task status to completted(done) - initiative update tool




- prompt for tasks execution with create tasks based on context
    - global context
        - decisions, solutions, patterns (filter by tags)
        - arhitecture.md
        - codebase.md
    - initative context
        - overview.md

---
# Collect knowledge
- prompt for knowledge collection within initiative

---
# Initiative issue review
- prompt for initiative review with merge knowledge from initative context and global context

---
# Initiative completion
- prompt for initiative completion with merge knowledge from initative context and global context

---


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



