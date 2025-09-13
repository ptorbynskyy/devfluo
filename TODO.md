1. prompt to report initiative issue
2. Create issue
    - uderstand changes
    - impact analyses
    - Options Analysis
    - Update recomend strattegy
    - Show user the result

## MCP Server Prompt for Initiative Scope Change Management

Create an MCP server that handles initiative scope change situations. The core business entity is an **issue** in the initiative's issue bank.

### Issue Entity Management

When encountering a problem, capture it as an issue entity in the knowledge base with:
- Status
- Name
- Description
- Identifier

### Analysis Process

**Step 1: Change Analysis**
- Analyze existing changes related to the initiative
- Analyze current changes in the session, recent git logs
- Use agent guidelines to conduct impact analysis

**Step 2: Solution Options Analysis**

After understanding changes and impact, analyze recommended options:

#### Option 1: Embedding
- For small problems that can be integrated into the current task plan
- Slightly modify existing plan to solve the issue within current initiative
- Pros: unified deliverable
- Cons: timeline extension
- Effort estimate


#### Option 2: Complete Replanning
- For serious changes and larger, more important issues
- Replan remaining work scope
- May require returning to and reworking previous tasks
- Update task list to reflect new reality
- Still execute within current initiative but requires replanning

#### Option 3: Defer
- For non-critical issues that don't block initiative completion
- Move to backlog for future planning as separate initiative

#### Option 4: Cancel Initiative
- For fatal issues that completely question initiative continuation
- Results in canceling entire initiative execution

#### Option 5: Close as Non-Issue
- Determine issue is not actually a problem
- Designed behavior, not a defect
- Close issue without action

### Final Steps

1. Update recommended strategy in issue entity using Initiative Update Tool
2. Output analysis results to user
3. Show selected option with explanation of why other options were rejected

Important to note that we don't apply any of the strategies, we only recommend them. We calculate and save our recommendation using Iniciative Update tool

---
1. prompt to handle issue
2. Show user the options and the recomendation, ask about the choice
3. Depend on the choice process the issue
    - Embed: Add tasks to current initiative plan for simple problems (initiative_update)
    - Replan: Substantial rescheduling with task replacement and new task additions for serious problems
      - update the tasks list according to new plan (initiative_update)
    - Defer: Create backlog item for non-critical issues that don't affect main workflow
      - create the backlog item based on the issue (backlog_management tool)
    - Cancel initiative: Terminate entire initiative when problem makes it unnecessary
    - Cancel issue: Mark issue as insignificant or reject without action
4. Update issue result, status and summary to reflect the choice (initiative_update)



---
use issues context while collect khoaldge on initiative complete

---
# Collect knowledge
- prompt for knowledge collection within initiative

---
# Initiative issue review
- prompt for initiative review with merge knowledge from initative context and global context

---


### Domain
- Resolution strategies:
    - Embed: Add tasks to current initiative plan for simple problems
    - Replan: Substantial rescheduling with task replacement and new task additions for serious problems
    - Defer: Create backlog item for non-critical issues that don't affect main workflow
    - Cancel initiative: Terminate entire initiative when problem makes it unnecessary
    - Cancel issue: Mark issue as insignificant or reject without action
- Knowledge base: Accumulate decisions, solutions, and patterns from issues for future reference and project-wide learning




