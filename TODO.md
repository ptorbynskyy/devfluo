# Tasks

## MCP
 - extend update tool // should get tasks CUD operations and handling them to create/update/delete tasks, like desitions or solutions or backlog items
 - extend single initiative resource template and add task list informations with phases and statuses to it MD result

## tasks data
	- id // t001
	- name // Create test
	- description // Create test for user auth
	- effort // S/M/L/XL/XXL/ etc
	- status // new/done
	- order // number for sorting
	- phase // Phase 1 - string that group tasks in a phase

## Folder structure
- root
	- initiatives
		- [initiative-id] // user-auth
			- tasks.json [optional] // list of tasks

# Initiative knowledge
## MCP
### Tools
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



# Issues management

# Copmlete Initiative


-----------------------
# Initiative brainstorming
 - prompt for initiative brainstorming with create spec as result ***
