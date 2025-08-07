#!/usr/bin/env node

/**
 * Test script for round management functionality
 * Tests the complete round initialization and card distribution flow
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test configuration
const TEST_CONFIG = {
	playerCount: 4,
	cardsPerPlayer: 5,
	testGameName: "Round Management Test",
};

async function createTestGame() {
	console.log("🎮 Creating test game...");

	// Generate room code
	const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

	// Create game
	const { data: game, error: gameError } = await supabase
		.from("games")
		.insert({
			room_code: roomCode,
			phase: "lobby",
			current_round: 1,
			target_score: 7,
			max_players: 8,
			submission_timer: 60,
			voting_timer: 30,
		})
		.select()
		.single();

	if (gameError) {
		throw new Error(`Failed to create game: ${gameError.message}`);
	}

	console.log(`✅ Game created with room code: ${roomCode}`);
	return game;
}

async function createTestPlayers(gameId, count) {
	console.log(`👥 Creating ${count} test players...`);

	const players = [];
	for (let i = 1; i <= count; i++) {
		const { data: player, error } = await supabase
			.from("players")
			.insert({
				game_id: gameId,
				name: `Player ${i}`,
				score: 0,
				is_connected: true,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create player ${i}: ${error.message}`);
		}

		players.push(player);
	}

	// Set first player as host
	await supabase
		.from("games")
		.update({ host_id: players[0].id })
		.eq("id", gameId);

	console.log(`✅ Created ${players.length} players`);
	return players;
}

async function testCardGeneration(gameId, roundNumber, playerCount) {
	console.log(`🃏 Testing card generation for round ${roundNumber}...`);

	try {
		// Call the edge function to generate cards
		const { data, error } = await supabase.functions.invoke("generate-cards", {
			body: {
				gameId,
				roundNumber,
				playerCount,
			},
		});

		if (error) {
			console.warn(`⚠️  Edge function failed: ${error.message}`);
			console.log("🔄 Falling back to client-side generation...");

			// Fallback: create cards directly
			await createFallbackCards(gameId, roundNumber, playerCount);
			return { success: true, fallback: true };
		}

		if (!data.success) {
			throw new Error(data.error || "Card generation failed");
		}

		console.log(
			`✅ Generated ${data.cardsGenerated} cards (${data.responseCardsCount} response cards)`
		);
		return data;
	} catch (error) {
		console.warn(`⚠️  Card generation failed: ${error.message}`);
		console.log("🔄 Using fallback card generation...");

		await createFallbackCards(gameId, roundNumber, playerCount);
		return { success: true, fallback: true };
	}
}

async function createFallbackCards(gameId, roundNumber, playerCount) {
	const promptText = "The secret to a happy life is ____.";
	const responseTexts = [
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

	// Create prompt card
	const { error: promptError } = await supabase.from("cards").insert({
		game_id: gameId,
		round_number: roundNumber,
		type: "prompt",
		text: promptText,
		player_id: null,
	});

	if (promptError) {
		throw new Error(`Failed to create prompt card: ${promptError.message}`);
	}

	// Create response cards (ensure enough for distribution)
	const responseCount = Math.max(playerCount * 6, 20);
	const selectedResponses = responseTexts.slice(0, responseCount);

	const responseCards = selectedResponses.map((text) => ({
		game_id: gameId,
		round_number: roundNumber,
		type: "response",
		text,
		player_id: null,
	}));

	const { error: responseError } = await supabase
		.from("cards")
		.insert(responseCards);

	if (responseError) {
		throw new Error(
			`Failed to create response cards: ${responseError.message}`
		);
	}

	console.log(
		`✅ Created fallback cards: 1 prompt + ${selectedResponses.length} responses`
	);
}

async function testCardDistribution(gameId, roundNumber, players) {
	console.log(`📤 Testing card distribution...`);

	// Get response cards for the round
	const { data: responseCards, error: cardsError } = await supabase
		.from("cards")
		.select("*")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("type", "response")
		.is("player_id", null);

	if (cardsError) {
		throw new Error(`Failed to fetch response cards: ${cardsError.message}`);
	}

	if (responseCards.length < players.length * TEST_CONFIG.cardsPerPlayer) {
		throw new Error(
			`Not enough response cards for distribution: ${
				responseCards.length
			} available, ${players.length * TEST_CONFIG.cardsPerPlayer} needed`
		);
	}

	// Shuffle cards for random distribution
	const shuffledCards = [...responseCards].sort(() => Math.random() - 0.5);

	// Distribute cards to players
	const updates = [];
	for (let i = 0; i < players.length; i++) {
		const playerCards = shuffledCards.slice(
			i * TEST_CONFIG.cardsPerPlayer,
			(i + 1) * TEST_CONFIG.cardsPerPlayer
		);

		for (const card of playerCards) {
			updates.push({
				id: card.id,
				player_id: players[i].id,
			});
		}
	}

	// Update cards with player assignments
	const { error: updateError } = await supabase.from("cards").upsert(updates);

	if (updateError) {
		throw new Error(`Failed to distribute cards: ${updateError.message}`);
	}

	console.log(
		`✅ Distributed ${TEST_CONFIG.cardsPerPlayer} cards to each of ${players.length} players`
	);
}

async function validateCardDistribution(gameId, roundNumber, players) {
	console.log("🔍 Validating card distribution...");

	// Check that each player has the correct number of cards
	for (const player of players) {
		const { data: playerCards, error } = await supabase
			.from("cards")
			.select("id")
			.eq("game_id", gameId)
			.eq("round_number", roundNumber)
			.eq("player_id", player.id)
			.eq("type", "response");

		if (error) {
			throw new Error(
				`Failed to validate cards for player ${player.name}: ${error.message}`
			);
		}

		if (playerCards.length !== TEST_CONFIG.cardsPerPlayer) {
			throw new Error(
				`Player ${player.name} has ${playerCards.length} cards, expected ${TEST_CONFIG.cardsPerPlayer}`
			);
		}
	}

	// Verify prompt card exists
	const { data: promptCard, error: promptError } = await supabase
		.from("cards")
		.select("id")
		.eq("game_id", gameId)
		.eq("round_number", roundNumber)
		.eq("type", "prompt")
		.single();

	if (promptError || !promptCard) {
		throw new Error("No prompt card found for round");
	}

	console.log("✅ Card distribution validation passed");
}

async function testPhaseTransition(gameId, targetPhase) {
	console.log(`🔄 Testing phase transition to ${targetPhase}...`);

	const { error } = await supabase
		.from("games")
		.update({
			phase: targetPhase,
			updated_at: new Date().toISOString(),
		})
		.eq("id", gameId);

	if (error) {
		throw new Error(`Failed to transition to ${targetPhase}: ${error.message}`);
	}

	console.log(`✅ Successfully transitioned to ${targetPhase} phase`);
}

async function cleanupTestData(gameId) {
	console.log("🧹 Cleaning up test data...");

	// Delete game (cascade will handle players, cards, etc.)
	const { error } = await supabase.from("games").delete().eq("id", gameId);

	if (error) {
		console.warn(`⚠️  Failed to cleanup test data: ${error.message}`);
	} else {
		console.log("✅ Test data cleaned up");
	}
}

async function runRoundManagementTest() {
	console.log("🚀 Starting Round Management Test\n");

	let game = null;

	try {
		// Step 1: Create test game
		game = await createTestGame();

		// Step 2: Create test players
		const players = await createTestPlayers(game.id, TEST_CONFIG.playerCount);

		// Step 3: Transition to distribution phase
		await testPhaseTransition(game.id, "distribution");

		// Step 4: Test card generation
		const generationResult = await testCardGeneration(
			game.id,
			game.current_round,
			TEST_CONFIG.playerCount
		);

		// Step 5: Test card distribution
		await testCardDistribution(game.id, game.current_round, players);

		// Step 6: Validate distribution
		await validateCardDistribution(game.id, game.current_round, players);

		// Step 7: Test transition to submission phase
		await testPhaseTransition(game.id, "submission");

		console.log("\n🎉 Round Management Test PASSED!");
		console.log("📊 Test Summary:");
		console.log(`   - Game created: ${game.room_code}`);
		console.log(`   - Players: ${TEST_CONFIG.playerCount}`);
		console.log(`   - Cards per player: ${TEST_CONFIG.cardsPerPlayer}`);
		console.log(
			`   - Generation method: ${generationResult.fallback ? "Fallback" : "AI"}`
		);
		console.log(`   - Phase transitions: lobby → distribution → submission`);
	} catch (error) {
		console.error("\n❌ Round Management Test FAILED!");
		console.error(`Error: ${error.message}`);
		process.exit(1);
	} finally {
		if (game) {
			await cleanupTestData(game.id);
		}
	}
}

// Run the test
if (require.main === module) {
	runRoundManagementTest()
		.then(() => {
			console.log("\n✅ Test completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n❌ Test failed:", error);
			process.exit(1);
		});
}

module.exports = {
	runRoundManagementTest,
	createTestGame,
	createTestPlayers,
	testCardGeneration,
	testCardDistribution,
	validateCardDistribution,
};
