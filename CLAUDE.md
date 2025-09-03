# Code style
 - Tab indentation
 - `npm run lint` - check code style
 - `npm run lint:fix` - format code and fix lint errors

# Typescript
 - `npm run typecheck` - check type errors
 - Use ES Modules

# Architecture
 - Follow DRY and KISS
 - Prefer functional programming
 - Use asynchronous programming with async/await

# MCP Server
 - Use high level APIs - McpServer
 - Add tool metadata annotations explicitly
 - Use separate files for each tool, resource, prompt

### Zod
 - Use `describe` function in `Zod` schema
 	- Add example of usage for complex tools to describe text
 - CamelCase for property names
