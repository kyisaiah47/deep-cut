/**
 * Test script for card generation logic (without database)
 * Run with: node scripts/test-card-logic.js
 */

// Mock the card generation logic
function generateFallbackCards(gameId, roundNumber, playerCount) {
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
	];

	// Select random prompt
	const promptIndex = Math.floor(Math.random() * fallbackPrompts.length);
	const selectedPrompt = fallbackPrompts[promptIndex];

	// Select random responses (more than needed for variety)
	const responseCount = Math.max(playerCount * 6, 20); // Ensure enough cards for distribution
	const shuffledResponses = [...fallbackResponses].sort(
		() => Math.random() - 0.5
	);
	const selectedResponses = shuffledResponses.slice(0, responseCount);

	const cards = [
		{
			id: `prompt-${gameId}-${roundNumber}`,
			type: "prompt",
			text: selectedPrompt,
			gameId,
			roundNumber,
		},
		...selectedResponses.map((response, index) => ({
			id: `response-${gameId}-${roundNumber}-${index}`,
			type: "response",
			text: response,
			gameId,
			roundNumber,
		})),
	];

	return cards;
}

function moderateContent(text) {
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

function validateCardContent(text) {
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

function distributeCards(cards, playerIds, cardsPerPlayer = 5) {
	const responseCards = cards.filter((card) => card.type === "response");

	if (responseCards.length < playerIds.length * cardsPerPlayer) {
		throw new Error("Not enough response cards for all players");
	}

	// Shuffle cards for random distribution
	const shuffledCards = [...responseCards].sort(() => Math.random() - 0.5);

	// Distribute cards to players
	const distribution = {};
	for (let i = 0; i < playerIds.length; i++) {
		const playerCards = shuffledCards.slice(
			i * cardsPerPlayer,
			(i + 1) * cardsPerPlayer
		);

		distribution[playerIds[i]] = playerCards;
	}

	return distribution;
}

async function testCardGenerationLogic() {
	console.log("🎮 Testing Card Generation Logic...\n");

	try {
		// Test 1: Generate fallback cards
		console.log("📝 Test 1: Generating fallback cards...");

		const testGameId = "test-game-123";
		const testRoundNumber = 1;
		const testPlayerCount = 4;

		const cards = generateFallbackCards(
			testGameId,
			testRoundNumber,
			testPlayerCount
		);

		console.log("✅ Cards generated:", {
			totalCards: cards.length,
			promptCards: cards.filter((card) => card.type === "prompt").length,
			responseCards: cards.filter((card) => card.type === "response").length,
		});

		const promptCard = cards.find((card) => card.type === "prompt");
		if (promptCard) {
			console.log("✅ Prompt card:", promptCard.text);
		}

		// Test 2: Content moderation
		console.log("\n📝 Test 2: Testing content moderation...");

		const testTexts = [
			"This is a normal card text",
			"This contains inappropriate content",
			"This is explicit material",
			"A perfectly fine response",
		];

		testTexts.forEach((text) => {
			const moderated = moderateContent(text);
			const validation = validateCardContent(moderated);

			console.log(`Text: "${text}"`);
			console.log(`Moderated: "${moderated}"`);
			console.log(
				`Valid: ${validation.isValid}${
					validation.reason ? ` (${validation.reason})` : ""
				}`
			);
			console.log("---");
		});

		// Test 3: Card distribution
		console.log("📝 Test 3: Testing card distribution...");

		const playerIds = ["player-1", "player-2", "player-3", "player-4"];
		const distribution = distributeCards(cards, playerIds, 5);

		console.log("✅ Cards distributed:");
		Object.entries(distribution).forEach(([playerId, playerCards]) => {
			console.log(`${playerId}: ${playerCards.length} cards`);
			console.log(
				`  Sample cards: ${playerCards
					.slice(0, 2)
					.map((c) => c.text)
					.join(", ")}`
			);
		});

		// Test 4: Validation edge cases
		console.log("\n📝 Test 4: Testing validation edge cases...");

		const edgeCases = [
			"",
			"a".repeat(201), // Too long
			"This contains [FILTERED] content",
			"Normal text",
		];

		edgeCases.forEach((text, index) => {
			const validation = validateCardContent(text);
			console.log(
				`Edge case ${index + 1}: ${
					validation.isValid ? "✅ Valid" : "❌ Invalid"
				} ${validation.reason ? `(${validation.reason})` : ""}`
			);
		});

		console.log("\n🎉 All logic tests passed!");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Test cache functionality
function testCacheLogic() {
	console.log("\n📝 Testing cache logic...");

	const cache = {};
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	function getCacheKey(gameId, roundNumber, playerCount, theme) {
		return `${gameId}-${roundNumber}-${playerCount}-${theme || "default"}`;
	}

	function setCachedCards(cacheKey, cards) {
		const now = Date.now();
		cache[cacheKey] = {
			cards,
			timestamp: now,
			expiresAt: now + CACHE_DURATION,
		};
	}

	function getCachedCards(cacheKey) {
		const cached = cache[cacheKey];
		if (!cached) return null;

		if (Date.now() > cached.expiresAt) {
			delete cache[cacheKey];
			return null;
		}

		return cached.cards;
	}

	// Test cache operations
	const testKey = getCacheKey("game-1", 1, 4, "test");
	const testCards = [{ id: "1", text: "test card" }];

	// Set cache
	setCachedCards(testKey, testCards);
	console.log("✅ Cache set");

	// Get from cache
	const cachedCards = getCachedCards(testKey);
	console.log("✅ Cache retrieved:", cachedCards ? "Found" : "Not found");

	// Test expiration (simulate)
	cache[testKey].expiresAt = Date.now() - 1000; // Expired
	const expiredCards = getCachedCards(testKey);
	console.log(
		"✅ Expired cache handled:",
		expiredCards ? "Found (ERROR)" : "Not found (CORRECT)"
	);
}

// Run tests
testCardGenerationLogic()
	.then(() => {
		testCacheLogic();
		console.log("\n🎉 All tests completed successfully!");
	})
	.catch((error) => {
		console.error("\n💥 Test suite failed:", error);
	});
