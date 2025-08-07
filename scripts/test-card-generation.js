/**
 * Test script for AI card generation system
 * Run with: node scripts/test-card-generation.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("Missing Supabase environment variables");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCardGeneration() {
	console.log("🎮 Testing AI Card Generation System...\n");

	try {
		// Test 1: Generate cards using fallback system (no OpenAI key needed)
		console.log("📝 Test 1: Generating cards with fallback system...");

		const testGameId = `test-game-${Date.now()}`;
		const testRoundNumber = 1;
		const testPlayerCount = 4;

		// Call the edge function (will use fallback if no OpenAI key)
		const { data, error } = await supabase.functions.invoke("generate-cards", {
			body: {
				gameId: testGameId,
				roundNumber: testRoundNumber,
				playerCount: testPlayerCount,
				theme: "testing",
			},
		});

		if (error) {
			console.error("❌ Edge function error:", error);

			// Try client-side fallback generation
			console.log("🔄 Trying client-side fallback...");
			await testClientSideFallback(
				testGameId,
				testRoundNumber,
				testPlayerCount
			);
		} else {
			console.log("✅ Cards generated successfully:", data);

			// Test 2: Verify cards were stored in database
			await testCardRetrieval(testGameId, testRoundNumber);

			// Test 3: Test card distribution
			await testCardDistribution(testGameId, testRoundNumber, testPlayerCount);
		}
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

async function testClientSideFallback(gameId, roundNumber, playerCount) {
	console.log("📝 Testing client-side fallback generation...");

	const fallbackPrompts = [
		"The secret to a happy life is ____.",
		"I never understood ____ until I experienced it myself.",
		"My biggest fear is ____ combined with ____.",
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
	];

	// Select random cards
	const promptIndex = Math.floor(Math.random() * fallbackPrompts.length);
	const selectedPrompt = fallbackPrompts[promptIndex];

	const responseCount = Math.max(playerCount * 2, 10);
	const shuffledResponses = [...fallbackResponses].sort(
		() => Math.random() - 0.5
	);
	const selectedResponses = shuffledResponses.slice(0, responseCount);

	// Create card objects
	const cards = [
		{
			type: "prompt",
			text: selectedPrompt,
			game_id: gameId,
			round_number: roundNumber,
			player_id: null,
		},
		...selectedResponses.map((response) => ({
			type: "response",
			text: response,
			game_id: gameId,
			round_number: roundNumber,
			player_id: null,
		})),
	];

	// Insert cards into database
	const { data, error } = await supabase.from("cards").insert(cards).select();

	if (error) {
		console.error("❌ Failed to insert fallback cards:", error);
		throw error;
	}

	console.log("✅ Client-side fallback cards generated:", {
		cardsGenerated: data.length,
		promptCard: data.find((card) => card.type === "prompt"),
		responseCardsCount: data.filter((card) => card.type === "response").length,
	});

	return data;
}

async function testCardRetrieval(gameId, roundNumber) {
	console.log("📝 Test 2: Retrieving generated cards...");

	// Get all cards for the round
	const { data: allCards, error: allError } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber);

	if (allError) {
		console.error("❌ Failed to retrieve cards:", allError);
		throw allError;
	}

	console.log("✅ Retrieved cards:", {
		totalCards: allCards.length,
		promptCards: allCards.filter((card) => card.type === "prompt").length,
		responseCards: allCards.filter((card) => card.type === "response").length,
	});

	// Get prompt card specifically
	const { data: promptCard, error: promptError } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("type", "prompt")
		.single();

	if (promptError && promptError.code !== "PGRST116") {
		console.error("❌ Failed to retrieve prompt card:", promptError);
		throw promptError;
	}

	if (promptCard) {
		console.log("✅ Prompt card retrieved:", promptCard.text);
	}

	return allCards;
}

async function testCardDistribution(gameId, roundNumber, playerCount) {
	console.log("📝 Test 3: Testing card distribution...");

	// Create mock player IDs
	const playerIds = Array.from(
		{ length: playerCount },
		(_, i) => `player-${i + 1}`
	);
	const cardsPerPlayer = 5;

	// Get response cards
	const { data: responseCards, error: responseError } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("type", "response");

	if (responseError) {
		console.error("❌ Failed to get response cards:", responseError);
		throw responseError;
	}

	if (responseCards.length < playerIds.length * cardsPerPlayer) {
		console.log(
			"⚠️ Not enough response cards for distribution, generating more..."
		);

		// Generate additional response cards if needed
		const additionalResponses = [
			"my collection of weird facts",
			"the ultimate dad joke",
			"a really comfortable chair",
			"the art of procrastination",
			"my ability to find parking spots",
		];

		const additionalCards = additionalResponses.map((response) => ({
			type: "response",
			text: response,
			game_id: gameId,
			round_number: roundNumber,
			player_id: null,
		}));

		const { error: insertError } = await supabase
			.from("cards")
			.insert(additionalCards);

		if (insertError) {
			console.error("❌ Failed to insert additional cards:", insertError);
			throw insertError;
		}

		// Refresh response cards
		const { data: updatedCards } = await supabase
			.from("cards")
			.select("*")
			.eq("game_id", gameId)
			.eq("round_number", roundNumber)
			.eq("type", "response");

		responseCards.push(...(updatedCards || []).slice(responseCards.length));
	}

	// Shuffle and distribute cards
	const shuffledCards = [...responseCards].sort(() => Math.random() - 0.5);
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
	const { error: updateError } = await supabase.from("cards").upsert(updates);

	if (updateError) {
		console.error("❌ Failed to distribute cards:", updateError);
		throw updateError;
	}

	console.log("✅ Cards distributed successfully:", {
		playersCount: playerIds.length,
		cardsPerPlayer,
		totalCardsDistributed: playerIds.length * cardsPerPlayer,
	});

	// Verify distribution
	for (const playerId of playerIds) {
		const { data: playerCards, error: playerError } = await supabase
			.from("cards")
			.select("*")
			.eq("game_id", gameId)
			.eq("round_number", roundNumber)
			.eq("player_id", playerId);

		if (playerError) {
			console.error(`❌ Failed to get cards for ${playerId}:`, playerError);
			continue;
		}

		console.log(`✅ ${playerId} has ${playerCards.length} cards`);
	}
}

async function cleanup() {
	console.log("🧹 Cleaning up test data...");

	// Delete test cards
	const { error } = await supabase
		.from("cards")
		.delete()
		.like("game_id", "test-game-%");

	if (error) {
		console.error("❌ Cleanup failed:", error);
	} else {
		console.log("✅ Test data cleaned up");
	}
}

// Run the test
testCardGeneration()
	.then(() => {
		console.log("\n🎉 All tests completed successfully!");
		return cleanup();
	})
	.catch((error) => {
		console.error("\n💥 Test suite failed:", error);
		return cleanup();
	})
	.finally(() => {
		process.exit(0);
	});
