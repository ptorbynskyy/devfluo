# Initiative knowledge
## MCP
### Tools
 - extend update initative tool with correspondent operations
### Resources

## Folder structure
- root
	- initiatives
		- [initiative-id] // user-auth
			- decisions [optional]
				decisions.json // same as global decistions but produced by the initiative
			- solutions [optional]
				- solutions.json // same as global solutions but were born within initative
			- patterns [optional]
				- patterns.json // same as global patterns but were born within initative
				- [some-pattern-snipet]

# Prompt to complete initiative
 - check
 - get knoaladge ??
 - update state

# Issues management

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
