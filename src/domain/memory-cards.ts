// ABOUTME: Domain module for managing memory cards with CRUD operations

import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { baseKnowledgePath } from "./base-knowledge.js";
import {
	getInitiativeMemoryCardPath,
	getInitiativeMemoryCardsPath,
} from "./initiative/paths.js";
import { type MemoryCard, MemoryCardSchema } from "./memory-card-schema.js";

// Global memory cards paths
export const globalMemoryCardsPath = path.join(
	baseKnowledgePath,
	"memory-cards",
);

// Helper function to get global memory card file path
export function getGlobalMemoryCardPath(name: string): string {
	return path.join(globalMemoryCardsPath, `${name}.md`);
}

// Load memory cards from a directory
async function loadMemoryCardsFromPath(dirPath: string): Promise<MemoryCard[]> {
	try {
		await mkdir(dirPath, { recursive: true });
		const files = await readdir(dirPath);
		const memoryCards: MemoryCard[] = [];

		for (const file of files) {
			if (file.endsWith(".md")) {
				const name = path.basename(file, ".md");
				const filePath = path.join(dirPath, file);

				try {
					const fileContent = await readFile(filePath, "utf-8");
					const { data, content } = matter(fileContent);

					const memoryCard = MemoryCardSchema.parse({
						name,
						title: data.title,
						content,
						contextIncludingPolicy: data.contextIncludingPolicy || "auto",
						tags: data.tags || [],
					});

					memoryCards.push(memoryCard);
				} catch (error) {
					console.error(`Error parsing memory card ${file}:`, error);
					// Skip invalid files
				}
			}
		}

		return memoryCards;
	} catch (_error) {
		// Directory doesn't exist or other error
		return [];
	}
}

// Save a memory card to file using gray-matter
async function saveMemoryCardToPath(
	memoryCard: MemoryCard,
	filePath: string,
): Promise<void> {
	const dirPath = path.dirname(filePath);
	await mkdir(dirPath, { recursive: true });

	const frontmatter = {
		title: memoryCard.title,
		contextIncludingPolicy: memoryCard.contextIncludingPolicy,
		tags: memoryCard.tags,
	};

	const fileContent = matter.stringify(memoryCard.content, frontmatter);
	await writeFile(filePath, fileContent, "utf-8");
}

// Global memory cards functions
export async function loadGlobalMemoryCards(): Promise<MemoryCard[]> {
	return loadMemoryCardsFromPath(globalMemoryCardsPath);
}

export async function loadGlobalMemoryCard(
	name: string,
): Promise<MemoryCard | null> {
	try {
		const filePath = getGlobalMemoryCardPath(name);
		const fileContent = await readFile(filePath, "utf-8");
		const { data, content } = matter(fileContent);

		return MemoryCardSchema.parse({
			name,
			title: data.title,
			content,
			contextIncludingPolicy: data.contextIncludingPolicy || "auto",
			tags: data.tags || [],
		});
	} catch (_error) {
		// File doesn't exist or parsing error
		return null;
	}
}

export async function saveGlobalMemoryCard(
	memoryCard: MemoryCard,
): Promise<void> {
	const filePath = getGlobalMemoryCardPath(memoryCard.name);
	await saveMemoryCardToPath(memoryCard, filePath);
}

export async function removeGlobalMemoryCard(name: string): Promise<boolean> {
	try {
		const filePath = getGlobalMemoryCardPath(name);
		await unlink(filePath);
		return true;
	} catch (_error) {
		// File doesn't exist
		return false;
	}
}

export async function getGlobalMemoryCardNames(): Promise<string[]> {
	try {
		await mkdir(globalMemoryCardsPath, { recursive: true });
		const files = await readdir(globalMemoryCardsPath);
		return files
			.filter((file) => file.endsWith(".md"))
			.map((file) => path.basename(file, ".md"));
	} catch (_error) {
		return [];
	}
}

// Initiative memory cards functions
export async function loadInitiativeMemoryCards(
	initiativeId: string,
): Promise<MemoryCard[]> {
	const dirPath = getInitiativeMemoryCardsPath(initiativeId);
	return loadMemoryCardsFromPath(dirPath);
}

export async function loadInitiativeMemoryCard(
	initiativeId: string,
	name: string,
): Promise<MemoryCard | null> {
	try {
		const filePath = getInitiativeMemoryCardPath(initiativeId, name);
		const fileContent = await readFile(filePath, "utf-8");
		const { data, content } = matter(fileContent);

		return MemoryCardSchema.parse({
			name,
			title: data.title,
			content,
			contextIncludingPolicy: data.contextIncludingPolicy || "auto",
			tags: data.tags || [],
		});
	} catch (_error) {
		// File doesn't exist or parsing error
		return null;
	}
}

export async function saveInitiativeMemoryCard(
	initiativeId: string,
	memoryCard: MemoryCard,
): Promise<void> {
	const filePath = getInitiativeMemoryCardPath(initiativeId, memoryCard.name);
	await saveMemoryCardToPath(memoryCard, filePath);
}

export async function removeInitiativeMemoryCard(
	initiativeId: string,
	name: string,
): Promise<boolean> {
	try {
		const filePath = getInitiativeMemoryCardPath(initiativeId, name);
		await unlink(filePath);
		return true;
	} catch (_error) {
		// File doesn't exist
		return false;
	}
}

export async function getInitiativeMemoryCardNames(
	initiativeId: string,
): Promise<string[]> {
	try {
		const dirPath = getInitiativeMemoryCardsPath(initiativeId);
		await mkdir(dirPath, { recursive: true });
		const files = await readdir(dirPath);
		return files
			.filter((file) => file.endsWith(".md"))
			.map((file) => path.basename(file, ".md"));
	} catch (_error) {
		return [];
	}
}
