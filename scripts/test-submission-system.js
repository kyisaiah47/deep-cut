#!/usr/bin/env node

/**
 * Test script for the card submission system
 * Tests submission validation, API endpoints, and real-time updates
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test data
const testGameData = {
	roomCode: "TEST01",
	phase: "submission",
	currentRound: 1,
	submissionTimer: 60,
	maxPlayers: 4,
};

const testPlayers = [
	{ name: "Alice", id: null },
	{ name: "Bob", id: null },
	{ name: "Charlie", id: null },
];

let testGameId = null;
let testCards = [];

async function cleanup() {
	console.log("\n🧹 Cleaning up test data...");

	if (testGameId) {
		// Delete game (cascade will handle players, cards, submissions)
		await supabase.from("games").delete().eq("id", testGameId);
		console.log("✅ Test game deleted");
	}
}

async function createTestGame() {
	console.log("🎮 Creating test game...");

	// Create game
	const { data: game, error: gameError } = await supabase
		.from("games")
		.insert({
			room_code: testGameData.roomCode,
			phase: testGameData.phase,
			current_round: testGameData.currentRound,
			submission_timer: testGameData.submissionTimer,
			max_players: testGameData.maxPlayers,
		})
		.select()
		.single();

	if (gameError) {
		throw new Error(`Failed to create game: ${gameError.message}`);
	}

	testGameId = game.id;
	console.log(`✅ Game created with ID: ${testGameId}`);

	// Create players
	for (const playerData of testPlayers) {
		const { data: player, error: playerError } = await supabase
			.from("players")
			.insert({
				game_id: testGameId,
				name: playerData.name,
				is_connected: true,
			})
			.select()
			.single();

		if (playerError) {
			throw new Error(
				`Failed to create player ${playerData.name}: ${playerError.message}`
			);
		}

		playerData.id = player.id;
		console.log(`✅ Player ${playerData.name} created with ID: ${player.id}`);
	}

	// Set first player as host
	await supabase
		.from("games")
		.update({ host_id: testPlayers[0].id })
		.eq("id", testGameId);

	return { gameId: testGameId, players: testPlayers };
}

async function createTestCards() {
	console.log("🃏 Creating test cards...");

	// Create one prompt card (shared)
	const { data: promptCard, error: promptError } = await supabase
		.from("cards")
		.insert({
			game_id: testGameId,
			round_number: testGameData.currentRound,
			type: "prompt",
			text: "The best thing about being an adult is ___.",
		})
		.select()
		.single();

	if (promptError) {
		throw new Error(`Failed to create prompt card: ${promptError.message}`);
	}

	testCards.push(promptCard);
	console.log("✅ Prompt card created");

	// Create response cards for each player
	const responseTexts = [
		"Paying taxes",
		"Staying up late",
		"Eating ice cream for breakfast",
		"Having no idea what you're doing",
		"Nap time",
		"Credit card debt",
	];

	for (let i = 0; i < testPlayers.length; i++) {
		const player = testPlayers[i];

		// Give each player 2 response cards
		for (let j = 0; j < 2; j++) {
			const cardIndex = i * 2 + j;
			const { data: responseCard, error: responseError } = await supabase
				.from("cards")
				.insert({
					game_id: testGameId,
					round_number: testGameData.currentRound,
					type: "response",
					text: responseTexts[cardIndex] || `Response card ${cardIndex + 1}`,
					player_id: player.id,
				})
				.select()
				.single();

			if (responseError) {
				throw new Error(
					`Failed to create response card: ${responseError.message}`
				);
			}

			testCards.push(responseCard);
		}

		console.log(`✅ Response cards created for ${player.name}`);
	}

	return testCards;
}

async function testSubmissionValidation() {
	console.log("\n🔍 Testing submission validation...");

	const player = testPlayers[0];
	const promptCard = testCards.find((card) => card.type === "prompt");
	const playerResponseCards = testCards.filter(
		(card) => card.type === "response" && card.player_id === player.id
	);

	// Test valid submission
	console.log("Testing valid submission...");
	const validSubmission = {
		gameId: testGameId,
		playerId: player.id,
		promptCardId: promptCard.id,
		responseCardIds: [playerResponseCards[0].id],
	};

	const response = await fetch("http://localhost:3000/api/submissions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(validSubmission),
	});

	const result = await response.json();

	if (response.ok) {
		console.log("✅ Valid submission accepted");
		console.log(`   Submission ID: ${result.submission.id}`);
	} else {
		console.log("❌ Valid submission rejected:", result.error);
	}

	// Test duplicate submission
	console.log("Testing duplicate submission...");
	const duplicateResponse = await fetch(
		"http://localhost:3000/api/submissions",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validSubmission),
		}
	);

	const duplicateResult = await duplicateResponse.json();

	if (!duplicateResponse.ok) {
		console.log(
			"✅ Duplicate submission correctly rejected:",
			duplicateResult.error
		);
	} else {
		console.log("❌ Duplicate submission incorrectly accepted");
	}

	// Test invalid response card
	console.log("Testing invalid response card...");
	const invalidSubmission = {
		gameId: testGameId,
		playerId: player.id,
		promptCardId: promptCard.id,
		responseCardIds: ["invalid-card-id"],
	};

	const invalidResponse = await fetch("http://localhost:3000/api/submissions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(invalidSubmission),
	});

	const invalidResult = await invalidResponse.json();

	if (!invalidResponse.ok) {
		console.log(
			"✅ Invalid card submission correctly rejected:",
			invalidResult.error
		);
	} else {
		console.log("❌ Invalid card submission incorrectly accepted");
	}
}

async function testSubmissionFlow() {
	console.log("\n🔄 Testing complete submission flow...");

	// Submit cards for remaining players
	const promptCard = testCards.find((card) => card.type === "prompt");

	for (let i = 1; i < testPlayers.length; i++) {
		const player = testPlayers[i];
		const playerResponseCards = testCards.filter(
			(card) => card.type === "response" && card.player_id === player.id
		);

		console.log(`Submitting cards for ${player.name}...`);

		const submission = {
			gameId: testGameId,
			playerId: player.id,
			promptCardId: promptCard.id,
			responseCardIds: [playerResponseCards[0].id],
		};

		const response = await fetch("http://localhost:3000/api/submissions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(submission),
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ ${player.name} submitted successfully`);

			// Check if this was the last submission
			if (result.allSubmitted) {
				console.log(
					"🎉 All players have submitted! Game should transition to voting phase."
				);
			}
		} else {
			console.log(`❌ ${player.name} submission failed:`, result.error);
		}
	}
}

async function testSubmissionRetrieval() {
	console.log("\n📥 Testing submission retrieval...");

	// Get all submissions for the game
	const response = await fetch(
		`http://localhost:3000/api/submissions?gameId=${testGameId}&roundNumber=${testGameData.currentRound}`
	);
	const result = await response.json();

	if (response.ok) {
		console.log(`✅ Retrieved ${result.submissions.length} submissions`);

		result.submissions.forEach((submission, index) => {
			console.log(
				`   ${index + 1}. Player: ${submission.player.name}, Cards: ${
					submission.response_cards.length
				}, Votes: ${submission.votes}`
			);
		});
	} else {
		console.log("❌ Failed to retrieve submissions:", result.error);
	}
}

async function testGamePhaseTransition() {
	console.log("\n🔄 Testing game phase transition...");

	// Check if game transitioned to voting phase
	const { data: game, error } = await supabase
		.from("games")
		.select("phase")
		.eq("id", testGameId)
		.single();

	if (error) {
		console.log("❌ Failed to check game phase:", error.message);
		return;
	}

	if (game.phase === "voting") {
		console.log("✅ Game correctly transitioned to voting phase");
	} else {
		console.log(`❌ Game is still in ${game.phase} phase, expected voting`);
	}
}

async function runTests() {
	console.log("🧪 Starting Card Submission System Tests\n");

	try {
		// Setup
		const { gameId, players } = await createTestGame();
		await createTestCards();

		// Run tests
		await testSubmissionValidation();
		await testSubmissionFlow();
		await testSubmissionRetrieval();
		await testGamePhaseTransition();

		console.log("\n✅ All tests completed successfully!");
	} catch (error) {
		console.error("\n❌ Test failed:", error.message);
		console.error(error.stack);
	} finally {
		await cleanup();
	}
}

// Handle cleanup on exit
process.on("SIGINT", async () => {
	console.log("\n\n🛑 Test interrupted, cleaning up...");
	await cleanup();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("\n\n🛑 Test terminated, cleaning up...");
	await cleanup();
	process.exit(0);
});

// Run tests
runTests().catch(console.error);
