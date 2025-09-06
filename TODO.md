# Initiative Create from backlog, spec - update, create, delete
Add specification concept to initiative. Specification can be added to initiative in two ways. First way: create initiative by specifying backlog ID to create from. If backlog already has specification, copy it from backlog. When creating initiative from backlog, delete the backlog afterwards. Second way: if initiative was created without backlog or backlog had no specification, add specification by updating initiative. Update tool should optionally support specification content as Markdown text and save it to corresponding file. If empty value is explicitly passed (empty string or null), delete specification file from filesystem. Distinguish between cases when specification is not passed during update versus when it's passed as empty string or null - empty string or null means delete specification file.

 - extend create tool // bakclog item delete after create initative
 - extend update tool // update initiative spec data or delete it
 - List should also return spec flag (yes/no)
 - Single initiative resource template should return full initiative data in MD - id, name, status, overview and spec

## Folder structure
- root
	- initiatives
		- [initiative-id] // user-auth
			- spec.md [optional]


-----------------------

 - prompt for initiative brainstorming with create spec as result ***

-----------------------

# Tasks

## MCP
 -

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
