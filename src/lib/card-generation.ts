import { supabase } from "./supabase";
import { Database } from "./database.types";

type Card = Database["public"]["Tables"]["cards"]["Row"];

export interface GenerateCardsOptions {
	gameId: string;
	roundNumber: number;
	playerCount: number;
	theme?: string;
}

export interface GeneratedCardsResult {
	success: boolean;
	cardsGenerated: number;
	promptCard?: Card;
	responseCardsCount: number;
	error?: string;
	fallbackUsed?: boolean;
}

export interface CardCache {
	[key: string]: {
		cards: Card[];
		timestamp: number;
		expiresAt: number;
	};
}

// Cache for generated cards (5 minute expiry)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cardCache: CardCache = {};

/**
 * Generate cards for a game round using AI or fallback system
 */
export async function generateCards(
	options: GenerateCardsOptions
): Promise<GeneratedCardsResult> {
	try {
		// Check cache first
		const cacheKey = getCacheKey(options);
		const cachedResult = getCachedCards(cacheKey);

		if (cachedResult) {
			console.log("Using cached cards for", cacheKey);
			return {
				success: true,
				cardsGenerated: cachedResult.length,
				promptCard: cachedResult.find((card) => card.type === "prompt"),
				responseCardsCount: cachedResult.filter(
					(card) => card.type === "response"
				).length,
			};
		}

		// Call Supabase Edge Function
		const { data, error } = await supabase.functions.invoke("generate-cards", {
			body: options,
		});

		if (error) {
			console.error("Edge function error:", error);
			throw new Error(`Failed to generate cards: ${error.message}`);
		}

		if (!data.success) {
			throw new Error(data.error || "Unknown error generating cards");
		}

		// Cache the generated cards
		const generatedCards = await getCardsForRound(
			options.gameId,
			options.roundNumber
		);
		setCachedCards(cacheKey, generatedCards);

		return data;
	} catch (error) {
		console.error("Card generation error:", error);

		// Try fallback generation on client side
		try {
			const fallbackCards = await generateFallbackCardsClientSide(options);
			return {
				success: true,
				cardsGenerated: fallbackCards.length,
				promptCard: fallbackCards.find((card) => card.type === "prompt"),
				responseCardsCount: fallbackCards.filter(
					(card) => card.type === "response"
				).length,
			};
		} catch (fallbackError) {
			console.error("Fallback generation failed:", fallbackError);
			return {
				success: false,
				cardsGenerated: 0,
				responseCardsCount: 0,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

/**
 * Get cards for a specific game round
 */
export async function getCardsForRound(
	gameId: string,
	roundNumber: number
): Promise<Card[]> {
	const { data, error } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error fetching cards:", error);
		throw new Error(`Failed to fetch cards: ${error.message}`);
	}

	return data || [];
}

/**
 * Get prompt card for a specific round
 */
export async function getPromptCard(
	gameId: string,
	roundNumber: number
): Promise<Card | null> {
	const { data, error } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("type", "prompt")
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			// No rows returned
			return null;
		}
		console.error("Error fetching prompt card:", error);
		throw new Error(`Failed to fetch prompt card: ${error.message}`);
	}

	return data;
}

/**
 * Get response cards for a specific round
 */
export async function getResponseCards(
	gameId: string,
	roundNumber: number
): Promise<Card[]> {
	const { data, error } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("type", "response")
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error fetching response cards:", error);
		throw new Error(`Failed to fetch response cards: ${error.message}`);
	}

	return data || [];
}

/**
 * Distribute response cards to players
 */
export async function distributeCardsToPlayers(
	gameId: string,
	roundNumber: number,
	playerIds: string[],
	cardsPerPlayer: number = 5
): Promise<void> {
	const responseCards = await getResponseCards(gameId, roundNumber);

	if (responseCards.length < playerIds.length * cardsPerPlayer) {
		throw new Error("Not enough response cards for all players");
	}

	// Shuffle cards for random distribution
	const shuffledCards = [...responseCards].sort(() => Math.random() - 0.5);

	// Distribute cards to players
	const updates = [];
	for (let i = 0; i < playerIds.length; i++) {
		const playerCards = shuffledCards.slice(
			i * cardsPerPlayer,
			(i + 1) * cardsPerPlayer
		);

		for (const card of playerCards) {
			updates.push({
				id: card.id,
				player_id: playerIds[i],
			});
		}
	}

	// Update cards with player assignments
	const { error } = await supabase.from("cards").upsert(updates);

	if (error) {
		console.error("Error distributing cards:", error);
		throw new Error(`Failed to distribute cards: ${error.message}`);
	}
}

/**
 * Get cards assigned to a specific player
 */
export async function getPlayerCards(
	gameId: string,
	roundNumber: number,
	playerId: string
): Promise<Card[]> {
	const { data, error } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("player_id", playerId)
		.eq("type", "response")
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error fetching player cards:", error);
		throw new Error(`Failed to fetch player cards: ${error.message}`);
	}

	return data || [];
}

// Cache management functions
function getCacheKey(options: GenerateCardsOptions): string {
	return `${options.gameId}-${options.roundNumber}-${options.playerCount}-${
		options.theme || "default"
	}`;
}

function getCachedCards(cacheKey: string): Card[] | null {
	const cached = cardCache[cacheKey];
	if (!cached) return null;

	if (Date.now() > cached.expiresAt) {
		delete cardCache[cacheKey];
		return null;
	}

	return cached.cards;
}

function setCachedCards(cacheKey: string, cards: Card[]): void {
	const now = Date.now();
	cardCache[cacheKey] = {
		cards,
		timestamp: now,
		expiresAt: now + CACHE_DURATION,
	};
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
	const now = Date.now();
	Object.keys(cardCache).forEach((key) => {
		if (cardCache[key].expiresAt < now) {
			delete cardCache[key];
		}
	});
}

/**
 * Client-side fallback card generation
 */
async function generateFallbackCardsClientSide(
	options: GenerateCardsOptions
): Promise<Card[]> {
	const fallbackPrompts = [
		"The secret to a happy life is ____.",
		"I never understood ____ until I experienced it myself.",
		"My biggest fear is ____ combined with ____.",
		"The best part about growing up is ____.",
		"If I could have any superpower, it would be ____.",
		"The worst advice I ever received was ____.",
		"My ideal day would involve ____.",
		"The most embarrassing moment of my life was ____.",
		"If aliens visited Earth, they would be confused by ____.",
		"The key to happiness is ____ and ____.",
		"I wish I could go back in time and ____.",
		"The most overrated thing in the world is ____.",
		"My guilty pleasure is ____.",
		"If I ruled the world, I would ____.",
		"The strangest thing I've ever eaten was ____.",
	];

	const fallbackResponses = [
		"a really good sandwich",
		"my collection of rubber ducks",
		"the ability to speak to houseplants",
		"wearing socks with sandals",
		"my secret talent for interpretive dance",
		"a lifetime supply of bubble wrap",
		"the wisdom of fortune cookies",
		"my fear of butterflies",
		"an unhealthy obsession with organizing",
		"the power of positive thinking",
		"my grandmother's secret recipe",
		"a really comfortable chair",
		"the art of procrastination",
		"my ability to find parking spots",
		"a good cup of coffee",
		"the magic of friendship",
		"my collection of funny hats",
		"the perfect playlist",
		"a really good book",
		"the joy of small victories",
		"my pet goldfish's wisdom",
		"the mystery of missing socks",
		"my superhero alter ego",
		"the perfect nap",
		"my secret stash of chocolate",
		"the art of avoiding responsibilities",
		"my imaginary friend",
		"the perfect excuse",
		"my collection of weird facts",
		"the ultimate dad joke",
	];

	// Select random prompt
	const promptIndex = Math.floor(Math.random() * fallbackPrompts.length);
	const selectedPrompt = fallbackPrompts[promptIndex];

	// Select random responses (ensure enough for distribution)
	const responseCount = Math.max(options.playerCount * 6, 20);
	const shuffledResponses = [...fallbackResponses].sort(
		() => Math.random() - 0.5
	);
	const selectedResponses = shuffledResponses.slice(0, responseCount);

	// Create card objects (these would need to be inserted into the database)
	const cards: Omit<Card, "id" | "created_at">[] = [
		{
			type: "prompt",
			text: selectedPrompt,
			game_id: options.gameId,
			round_number: options.roundNumber,
			player_id: null,
		},
		...selectedResponses.map((response) => ({
			type: "response" as const,
			text: response,
			game_id: options.gameId,
			round_number: options.roundNumber,
			player_id: null,
		})),
	];

	// Insert fallback cards into database
	const { data, error } = await supabase.from("cards").insert(cards).select();

	if (error) {
		console.error("Error inserting fallback cards:", error);
		throw new Error(`Failed to insert fallback cards: ${error.message}`);
	}

	return data || [];
}

/**
 * Content moderation for client-side filtering
 */
export function moderateContent(text: string): string {
	// Basic content filtering
	const inappropriateWords = [
		"explicit",
		"inappropriate",
		"offensive",
		"vulgar",
	];

	let moderatedText = text;

	inappropriateWords.forEach((word) => {
		const regex = new RegExp(word, "gi");
		moderatedText = moderatedText.replace(regex, "[FILTERED]");
	});

	return moderatedText;
}

/**
 * Validate card content
 */
export function validateCardContent(text: string): {
	isValid: boolean;
	reason?: string;
} {
	if (!text || text.trim().length === 0) {
		return { isValid: false, reason: "Card text cannot be empty" };
	}

	if (text.length > 200) {
		return {
			isValid: false,
			reason: "Card text is too long (max 200 characters)",
		};
	}

	if (text.includes("[FILTERED]")) {
		return { isValid: false, reason: "Card contains inappropriate content" };
	}

	return { isValid: true };
}
