// ABOUTME: Project resource handlers for the MCP server

export interface ProjectResource {
	uri: string;
	name: string;
	description: string;
	mimeType: string;
}

export const PROJECT_RESOURCES: ProjectResource[] = [
	{
		uri: "project://info",
		name: "Project Information",
		description: "General information about the current project",
		mimeType: "text/plain",
	},
];

export function getProjectInfo(): string {
	return "This is a Model Context Protocol server for development workflow assistance.";
}

export function handleProjectResource(uri: string): {
	uri: string;
	mimeType: string;
	text: string;
} {
	switch (uri) {
		case "project://info":
			return {
				uri,
				mimeType: "text/plain",
				text: getProjectInfo(),
			};
		default:
			throw new Error(`Unknown project resource: ${uri}`);
	}
}
