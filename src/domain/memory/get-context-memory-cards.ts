import { splitText } from "../../utils/text-splitter.js";
import type { MemoryCard } from "./memory-card-schema.js";
import { searchMemoryCardsWithExcerpts } from "./memory-card-search.js";
import type { MemoryCardSearchResult } from "./memory-card-search-schema.js";
import {
	loadGlobalMemoryCards,
	loadInitiativeMemoryCards,
} from "./memory-cards.js";

/**
 * Aggregate and deduplicate semantic search results from multiple queries
 */
async function aggregateSemanticMemoryCards(
	semanticQueries: string[],
	alwaysCards: MemoryCard[],
	scope: string,
): Promise<MemoryCard[]> {
	const alwaysCardNames = new Set(alwaysCards.map((card) => card.name));
	const foundCards = new Map<string, MemoryCardSearchResult>();

	// Search global scope
	for (const query of semanticQueries) {
		// Split query into chunks if needed
		const queryChunks = await splitText(query);

		for (const chunk of queryChunks) {
			try {
				const results = await searchMemoryCardsWithExcerpts(scope, chunk, 10);

				for (const result of results) {
					const card = result.parentCard;
					// Skip cards with "always" policy (already included)
					if (
						card.contextIncludingPolicy === "always" ||
						alwaysCardNames.has(card.name)
					) {
						continue;
					}

					// Create search result with relevance score
					const cardWithScore: MemoryCardSearchResult = {
						...card,
						relevanceScore: result.relevanceScore,
					};

					// Use card name as key for deduplication, keep highest score
					const existingCard = foundCards.get(card.name);
					if (
						!existingCard ||
						existingCard.relevanceScore < result.relevanceScore
					) {
						foundCards.set(card.name, cardWithScore);
					}
				}
			} catch (error) {
				console.error(`Semantic search failed for query "${chunk}":`, error);
				// Continue with other queries
			}
		}
	}

	// Return cards sorted by relevance score (convert back to MemoryCard for consistent interface)
	return Array.from(foundCards.values())
		.sort((a, b) => b.relevanceScore - a.relevanceScore)
		.map(({ relevanceScore, ...card }) => card);
}

export async function getContextMemoryCards(
	scope: string,
	options?: {
		includeAllMemoryCards?: boolean;
		semanticQueries?: string[];
	},
) {
	const allMemoryCards =
		scope === "global"
			? await loadGlobalMemoryCards()
			: await loadInitiativeMemoryCards(scope);

	// Start with "always" cards or all cards if includeAllMemoryCards is true
	let contextMemoryCards = allMemoryCards.filter(
		(card) =>
			card.contextIncludingPolicy === "always" ||
			options?.includeAllMemoryCards === true,
	);

	// Add semantically relevant cards if semantic queries provided
	if (options?.semanticQueries && options.semanticQueries.length > 0) {
		const semanticCards = await aggregateSemanticMemoryCards(
			options.semanticQueries,
			contextMemoryCards,
			"global",
		);
		contextMemoryCards = [...contextMemoryCards, ...semanticCards];
	}
	return contextMemoryCards;
}
