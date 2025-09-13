# Initiative completion
- prompt for initiative completion with merge knowledge from initative context and global context
  
Create a prompt for MCP server that completes initiative execution. It should load global project context and current initiative context. Verify all initiative tasks are completed. Then start knowledge collection process. Knowledge is based on completed tasks and git log history from the initiative (usually separate branch with commits). Analyze all decisions, solutions, and patterns from this initiative to determine if they should be merged with project knowledge base. Validate each decision, solution, and pattern, then decide whether to merge based on criteria. After collecting merge candidates, update project knowledge base using Update knowledge tool. Analyze how initiative changes affected main project knowledge artifacts like Architecture Markdown and Codebase Markdown documents. Update these documents if necessary, carefully considering changes since they impact the entire project and codebase.

### Stage 1: Validation Check
- All tasks done?

### Stage 2: Knowledge Extraction

**Key Achievements:**
 - From completed tasks
 - From git log major changes
 - From decisions architectural choices

### Stage 3: Promote to Knowledge Base

**Quality Filtering Process:**

```python
# Evaluate each decision/solution for promotion
def should_promote(item, type):
    if type == "decision":
        # Promote if:
        # - Applies to multiple features/modules
        # - Sets architectural precedent
        # - Solves recurring problem
        # - Has tag "**" (important marker)
        return (
            item.get("scope", "local") != "local" or
            "**" in item.get("key", "") or
            item.get("reusable", False)
        )
    elif type == "solution":
        # Promote if:
        # - Used 3+ times
        # - Tagged as "structured" and "validated"
        # - Has clear file references
        # - Not a trivial fix (>50 chars description)
        return (
            item.get("usage_count", 1) >= 3 or
            "structured" in item.get("tags", []) or
            len(item.get("solution", "")) > 50
        )
```

**Best Decisions → project knowledge decisions:**
#### Only add decisions that pass quality filter:
- Apply beyond this initiative (scope: "global")
- Solve fundamental problems (tagged with "**")
- Set precedents (marked as "reusable": true)
- Have been validated in practice

**Reusable Solutions → project knowledge solutions:**
#### Only add solutions that pass quality filter:
- Fixed non-trivial problems (>50 char description)
- Can apply to other areas (tagged "reusable")
- Have clear file references
- Used multiple times or tagged "validated"


**Patterns → project knowledge patterns:**
 - Only add patterns used 3+ times:




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



