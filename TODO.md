# Backlog management

## Backlog item
	- id (used for folder creation) // dashboard-redesign
	- name // Dashboard redesign
	- description // Overview
	- effort [optional] // S/M/X/XL/XXL etc

## File structure
root
	backlog
		 dashboard-redesign
			data.json (name, description effort)
			spec.md
		 item2
			...

# Storage
	- based on folder structure and file structure
	- no duplication - data.json collaborate with file system
		- if spec.md exist - thats mean - item was speced

# MCP
	- resource for List - return short content (id, name, desciption, effort, spec exist (yes/no))
	- resource for single item - get full content (id, name, effort, desciption, spec content) in markdown format
	- backlog_management - create/update/delete
		- create
			- id
			- name
			- description
			- effort [optional]
			- spec markdown content [optional]
		- update (by id)
			- name [optional]
			- description [optional]
			- effort [optional]
			- spec markdown content [optional]
		- delete (by id)
