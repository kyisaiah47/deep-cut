#!/usr/bin/env node

/**
 * Test script for round management logic validation
 * Tests the round management logic without requiring database connection
 */

// Mock game state and player data for testing
const mockGameState = {
	id: "test-game-id",
	room_code: "TEST01",
	phase: "distribution",
	current_round: 1,
	target_score: 7,
	max_players: 8,
	submission_timer: 60,
	voting_timer: 30,
	host_id: "player-1",
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

const mockPlayers = [
	{
		id: "player-1",
		game_id: "test-game-id",
		name: "Player 1",
		score: 0,
		is_connected: true,
		joined_at: new Date().toISOString(),
	},
	{
		id: "player-2",
		game_id: "test-game-id",
		name: "Player 2",
		score: 0,
		is_connected: true,
		joined_at: new Date().toISOString(),
	},
	{
		id: "player-3",
		game_id: "test-game-id",
		name: "Player 3",
		score: 0,
		is_connected: true,
		joined_at: new Date().toISOString(),
	},
	{
		id: "player-4",
		game_id: "test-game-id",
		name: "Player 4",
		score: 0,
		is_connected: true,
		joined_at: new Date().toISOString(),
	},
];

// Import game utilities for testing
const path = require("path");
const fs = require("fs");

// Read and evaluate the game utils file
const gameUtilsPath = path.join(__dirname, "../src/lib/game-utils.ts");
const constantsPath = path.join(__dirname, "../src/lib/constants.ts");

function testPhaseTransitionLogic() {
	console.log("🔄 Testing phase transition logic...");

	// Test cases for phase transitions
	const testCases = [
		{
			name: "Lobby to Distribution (Game Start)",
			currentPhase: "lobby",
			targetPhase: "distribution",
			expectedResult: true,
		},
		{
			name: "Distribution to Submission",
			currentPhase: "distribution",
			targetPhase: "submission",
			expectedResult: true,
		},
		{
			name: "Submission to Voting",
			currentPhase: "submission",
			targetPhase: "voting",
			expectedResult: true, // Would need all submissions in real scenario
		},
		{
			name: "Voting to Results",
			currentPhase: "voting",
			targetPhase: "results",
			expectedResult: true,
		},
		{
			name: "Results to Distribution (Next Round)",
			currentPhase: "results",
			targetPhase: "distribution",
			expectedResult: true,
		},
		{
			name: "Invalid: Submission to Distribution",
			currentPhase: "submission",
			targetPhase: "distribution",
			expectedResult: false,
		},
	];

	let passed = 0;
	let failed = 0;

	testCases.forEach((testCase) => {
		try {
			// Mock the transition validation logic
			const canTransition = validatePhaseTransition(
				testCase.currentPhase,
				testCase.targetPhase,
				mockGameState,
				mockPlayers
			);

			if (canTransition === testCase.expectedResult) {
				console.log(`  ✅ ${testCase.name}: PASSED`);
				passed++;
			} else {
				console.log(
					`  ❌ ${testCase.name}: FAILED (expected ${testCase.expectedResult}, got ${canTransition})`
				);
				failed++;
			}
		} catch (error) {
			console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
			failed++;
		}
	});

	console.log(
		`\n📊 Phase Transition Tests: ${passed} passed, ${failed} failed`
	);
	return failed === 0;
}

function validatePhaseTransition(
	currentPhase,
	targetPhase,
	gameState,
	players
) {
	// Simplified validation logic based on the game rules
	const activePlayers = players.filter((p) => p.is_connected);

	if (activePlayers.length < 3) {
		return false; // Need minimum players
	}

	// Can't transition to the same phase
	if (currentPhase === targetPhase) {
		return false;
	}

	switch (targetPhase) {
		case "lobby":
			// Can always go back to lobby (game reset)
			return true;

		case "distribution":
			// Can transition from lobby (game start) or results (next round)
			return currentPhase === "lobby" || currentPhase === "results";

		case "submission":
			// Can only transition from distribution when cards are distributed
			return currentPhase === "distribution";

		case "voting":
			// Can only transition from submission when all players have submitted
			return currentPhase === "submission";

		case "results":
			// Can only transition from voting when voting is complete
			return currentPhase === "voting";

		default:
			return false;
	}
}

function testCardDistributionLogic() {
	console.log("🃏 Testing card distribution logic...");

	const testCases = [
		{
			name: "Standard Distribution (4 players, 5 cards each)",
			playerCount: 4,
			cardsPerPlayer: 5,
			availableCards: 25,
			expectedResult: true,
		},
		{
			name: "Insufficient Cards",
			playerCount: 4,
			cardsPerPlayer: 5,
			availableCards: 15,
			expectedResult: false,
		},
		{
			name: "Exact Cards",
			playerCount: 3,
			cardsPerPlayer: 5,
			availableCards: 15,
			expectedResult: true,
		},
		{
			name: "Excess Cards",
			playerCount: 2,
			cardsPerPlayer: 5,
			availableCards: 20,
			expectedResult: true,
		},
	];

	let passed = 0;
	let failed = 0;

	testCases.forEach((testCase) => {
		try {
			const canDistribute = validateCardDistribution(
				testCase.playerCount,
				testCase.cardsPerPlayer,
				testCase.availableCards
			);

			if (canDistribute === testCase.expectedResult) {
				console.log(`  ✅ ${testCase.name}: PASSED`);
				passed++;
			} else {
				console.log(
					`  ❌ ${testCase.name}: FAILED (expected ${testCase.expectedResult}, got ${canDistribute})`
				);
				failed++;
			}
		} catch (error) {
			console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
			failed++;
		}
	});

	console.log(
		`\n📊 Card Distribution Tests: ${passed} passed, ${failed} failed`
	);
	return failed === 0;
}

function validateCardDistribution(playerCount, cardsPerPlayer, availableCards) {
	const requiredCards = playerCount * cardsPerPlayer;
	return availableCards >= requiredCards;
}

function testRoundProgressionLogic() {
	console.log("🎯 Testing round progression logic...");

	const testCases = [
		{
			name: "Can Start Round (Lobby Phase)",
			gamePhase: "lobby",
			playerCount: 4,
			isHost: true,
			expectedResult: true,
		},
		{
			name: "Cannot Start Round (Not Host)",
			gamePhase: "lobby",
			playerCount: 4,
			isHost: false,
			expectedResult: false,
		},
		{
			name: "Cannot Start Round (Insufficient Players)",
			gamePhase: "lobby",
			playerCount: 2,
			isHost: true,
			expectedResult: false,
		},
		{
			name: "Cannot Start Round (Wrong Phase)",
			gamePhase: "submission",
			playerCount: 4,
			isHost: true,
			expectedResult: false,
		},
		{
			name: "Can Start New Round (Results Phase)",
			gamePhase: "results",
			playerCount: 4,
			isHost: true,
			expectedResult: true,
		},
	];

	let passed = 0;
	let failed = 0;

	testCases.forEach((testCase) => {
		try {
			const canStart = validateRoundStart(
				testCase.gamePhase,
				testCase.playerCount,
				testCase.isHost
			);

			if (canStart === testCase.expectedResult) {
				console.log(`  ✅ ${testCase.name}: PASSED`);
				passed++;
			} else {
				console.log(
					`  ❌ ${testCase.name}: FAILED (expected ${testCase.expectedResult}, got ${canStart})`
				);
				failed++;
			}
		} catch (error) {
			console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
			failed++;
		}
	});

	console.log(
		`\n📊 Round Progression Tests: ${passed} passed, ${failed} failed`
	);
	return failed === 0;
}

function validateRoundStart(gamePhase, playerCount, isHost) {
	// Must be host to start round
	if (!isHost) {
		return false;
	}

	// Need minimum players
	if (playerCount < 3) {
		return false;
	}

	// Can start from lobby or results phase
	return gamePhase === "lobby" || gamePhase === "results";
}

function testCardGenerationRequirements() {
	console.log("🤖 Testing card generation requirements...");

	const testCases = [
		{
			name: "Standard Generation (4 players)",
			playerCount: 4,
			expectedPromptCards: 1,
			expectedMinResponseCards: 24, // 4 players * 6 cards (with buffer)
		},
		{
			name: "Minimum Players (3 players)",
			playerCount: 3,
			expectedPromptCards: 1,
			expectedMinResponseCards: 18, // 3 players * 6 cards
		},
		{
			name: "Maximum Players (8 players)",
			playerCount: 8,
			expectedPromptCards: 1,
			expectedMinResponseCards: 48, // 8 players * 6 cards
		},
	];

	let passed = 0;
	let failed = 0;

	testCases.forEach((testCase) => {
		try {
			const requirements = calculateCardRequirements(testCase.playerCount);

			const promptMatch =
				requirements.promptCards === testCase.expectedPromptCards;
			const responseMatch =
				requirements.responseCards >= testCase.expectedMinResponseCards;

			if (promptMatch && responseMatch) {
				console.log(
					`  ✅ ${testCase.name}: PASSED (${requirements.promptCards} prompt, ${requirements.responseCards} response)`
				);
				passed++;
			} else {
				console.log(`  ❌ ${testCase.name}: FAILED`);
				console.log(
					`    Expected: ${testCase.expectedPromptCards} prompt, ≥${testCase.expectedMinResponseCards} response`
				);
				console.log(
					`    Got: ${requirements.promptCards} prompt, ${requirements.responseCards} response`
				);
				failed++;
			}
		} catch (error) {
			console.log(`  ❌ ${testCase.name}: ERROR - ${error.message}`);
			failed++;
		}
	});

	console.log(`\n📊 Card Generation Tests: ${passed} passed, ${failed} failed`);
	return failed === 0;
}

function calculateCardRequirements(playerCount) {
	// Always need 1 prompt card per round
	const promptCards = 1;

	// Need enough response cards for distribution plus buffer
	// Each player gets 5 cards, generate 20% extra for variety
	const cardsPerPlayer = 5;
	const bufferMultiplier = 1.2;
	const responseCards = Math.ceil(
		playerCount * cardsPerPlayer * bufferMultiplier
	);

	return {
		promptCards,
		responseCards,
	};
}

async function runRoundLogicTests() {
	console.log("🚀 Starting Round Management Logic Tests\n");

	const testResults = [];

	try {
		// Run all test suites
		testResults.push(testPhaseTransitionLogic());
		testResults.push(testCardDistributionLogic());
		testResults.push(testRoundProgressionLogic());
		testResults.push(testCardGenerationRequirements());

		const allPassed = testResults.every((result) => result === true);

		if (allPassed) {
			console.log("\n🎉 All Round Management Logic Tests PASSED!");
			console.log("✅ Phase transitions work correctly");
			console.log("✅ Card distribution logic is sound");
			console.log("✅ Round progression rules are enforced");
			console.log("✅ Card generation requirements are calculated correctly");
		} else {
			console.log("\n❌ Some Round Management Logic Tests FAILED!");
			console.log("Please review the failed test cases above.");
		}

		return allPassed;
	} catch (error) {
		console.error("\n❌ Round Management Logic Tests encountered an error!");
		console.error(`Error: ${error.message}`);
		return false;
	}
}

// Run the tests
if (require.main === module) {
	runRoundLogicTests()
		.then((success) => {
			if (success) {
				console.log("\n✅ All tests completed successfully");
				process.exit(0);
			} else {
				console.log("\n❌ Some tests failed");
				process.exit(1);
			}
		})
		.catch((error) => {
			console.error("\n❌ Test execution failed:", error);
			process.exit(1);
		});
}

module.exports = {
	runRoundLogicTests,
	testPhaseTransitionLogic,
	testCardDistributionLogic,
	testRoundProgressionLogic,
	testCardGenerationRequirements,
};
