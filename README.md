# Dev Flow MCP Server

A Model Context Protocol server for development workflow assistance, built with TypeScript and the official MCP SDK.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Development

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run watch` - Watch for changes and rebuild automatically
- `npm run start` - Run the built server
- `npm run dev` - Build and run the server
- `npm run clean` - Remove build artifacts

### Project Structure

```
src/
├── index.ts          # Main server entry point
├── tools/            # Tool implementations
├── resources/        # Resource handlers
└── prompts/          # Prompt templates
```

## Usage

### Running the Server

The server uses stdio transport for communication:

```bash
npm run dev
```

Or run the built executable directly:

```bash
./build/index.js
```

### Integration with MCP Clients

This server can be integrated with any MCP-compatible client. Configure your client to use this server with stdio transport.

## Requirements

- Node.js ≥22.0.0
- TypeScript ≥5.3.3

## License

MIT
