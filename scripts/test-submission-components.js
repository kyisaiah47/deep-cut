#!/usr/bin/env node

/**
 * Test script for submission system components
 * Tests component logic and validation functions
 */

// Mock the submission validation functions
const GAME_PHASES = {
	LOBBY: "lobby",
	DISTRIBUTION: "distribution",
	SUBMISSION: "submission",
	VOTING: "voting",
	RESULTS: "results",
};

const CARD_TYPES = {
	PROMPT: "prompt",
	RESPONSE: "response",
};

// Test data
const mockGameState = {
	id: "test-game-1",
	phase: GAME_PHASES.SUBMISSION,
	current_round: 1,
	submission_timer: 60,
};

const mockPlayers = [
	{ id: "player-1", name: "Alice", is_connected: true },
	{ id: "player-2", name: "Bob", is_connected: true },
	{ id: "player-3", name: "Charlie", is_connected: false },
];

const mockCards = [
	{
		id: "prompt-1",
		type: CARD_TYPES.PROMPT,
		text: "The best thing about being an adult is ___.",
		game_id: "test-game-1",
		round_number: 1,
		player_id: null,
	},
	{
		id: "response-1",
		type: CARD_TYPES.RESPONSE,
		text: "Paying taxes",
		game_id: "test-game-1",
		round_number: 1,
		player_id: "player-1",
	},
	{
		id: "response-2",
		type: CARD_TYPES.RESPONSE,
		text: "Staying up late",
		game_id: "test-game-1",
		round_number: 1,
		player_id: "player-1",
	},
	{
		id: "response-3",
		type: CARD_TYPES.RESPONSE,
		text: "Eating ice cream for breakfast",
		game_id: "test-game-1",
		round_number: 1,
		player_id: "player-2",
	},
];

const mockSubmissions = [];

// Import validation functions (simplified versions)
function validateSubmission(
	submissionData,
	gameState,
	players,
	cards,
	existingSubmissions
) {
	const errors = [];
	const warnings = [];

	const { promptCardId, responseCardIds, playerId, gameId } = submissionData;

	// Check if game is in submission phase
	if (gameState.phase !== GAME_PHASES.SUBMISSION) {
		errors.push("Game is not in submission phase");
	}

	// Check if player exists and is connected
	const player = players.find((p) => p.id === playerId);
	if (!player) {
		errors.push("Player not found in game");
	} else if (!player.is_connected) {
		warnings.push("Player appears to be disconnected");
	}

	// Check if player has already submitted
	const existingSubmission = existingSubmissions.find(
		(sub) =>
			sub.player_id === playerId && sub.round_number === gameState.current_round
	);

	if (existingSubmission) {
		errors.push("Player has already submitted for this round");
	}

	// Validate prompt card
	const promptCard = cards.find((card) => card.id === promptCardId);
	if (!promptCard) {
		errors.push("Prompt card not found");
	} else {
		if (promptCard.type !== CARD_TYPES.PROMPT) {
			errors.push("Invalid prompt card type");
		}
		if (promptCard.game_id !== gameId) {
			errors.push("Prompt card does not belong to this game");
		}
		if (promptCard.round_number !== gameState.current_round) {
			errors.push("Prompt card is not for the current round");
		}
	}

	// Validate response cards
	if (!Array.isArray(responseCardIds) || responseCardIds.length === 0) {
		errors.push("At least one response card must be selected");
	} else {
		const responseCards = cards.filter((card) =>
			responseCardIds.includes(card.id)
		);

		if (responseCards.length !== responseCardIds.length) {
			errors.push("Some response cards were not found");
		}

		responseCards.forEach((card, index) => {
			if (card.type !== CARD_TYPES.RESPONSE) {
				errors.push(`Response card ${index + 1} has invalid type`);
			}
			if (card.game_id !== gameId) {
				errors.push(`Response card ${index + 1} does not belong to this game`);
			}
			if (card.round_number !== gameState.current_round) {
				errors.push(`Response card ${index + 1} is not for the current round`);
			}
			if (card.player_id !== playerId) {
				errors.push(
					`Response card ${index + 1} does not belong to this player`
				);
			}
		});

		// Check for duplicate response cards
		const uniqueCardIds = new Set(responseCardIds);
		if (uniqueCardIds.size !== responseCardIds.length) {
			errors.push("Duplicate response cards are not allowed");
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

function getSubmissionStats(gameState, players, submissions) {
	const currentRoundSubmissions = submissions.filter(
		(sub) => sub.round_number === gameState.current_round
	);

	const totalPlayers = players.length;
	const submittedCount = currentRoundSubmissions.length;
	const pendingCount = totalPlayers - submittedCount;
	const completionPercentage =
		totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0;

	const submittedPlayerIds = new Set(
		currentRoundSubmissions.map((sub) => sub.player_id)
	);

	const playersSubmitted = players.filter((player) =>
		submittedPlayerIds.has(player.id)
	);
	const playersPending = players.filter(
		(player) => !submittedPlayerIds.has(player.id)
	);

	return {
		total: totalPlayers,
		submitted: submittedCount,
		pending: pendingCount,
		completionPercentage,
		allSubmitted: submittedCount >= totalPlayers,
		playersSubmitted,
		playersPending,
		submissions: currentRoundSubmissions,
	};
}

// Test functions
function testValidSubmission() {
	console.log("🔍 Testing valid submission...");

	const submissionData = {
		gameId: "test-game-1",
		playerId: "player-1",
		promptCardId: "prompt-1",
		responseCardIds: ["response-1"],
	};

	const result = validateSubmission(
		submissionData,
		mockGameState,
		mockPlayers,
		mockCards,
		mockSubmissions
	);

	if (result.isValid) {
		console.log("✅ Valid submission passed validation");
		if (result.warnings.length > 0) {
			console.log("⚠️  Warnings:", result.warnings);
		}
	} else {
		console.log("❌ Valid submission failed validation:", result.errors);
	}

	return result.isValid;
}

function testInvalidSubmissions() {
	console.log("\n🔍 Testing invalid submissions...");

	const testCases = [
		{
			name: "Wrong game phase",
			data: {
				gameId: "test-game-1",
				playerId: "player-1",
				promptCardId: "prompt-1",
				responseCardIds: ["response-1"],
			},
			gameState: { ...mockGameState, phase: GAME_PHASES.VOTING },
			expectedError: "Game is not in submission phase",
		},
		{
			name: "Non-existent player",
			data: {
				gameId: "test-game-1",
				playerId: "non-existent-player",
				promptCardId: "prompt-1",
				responseCardIds: ["response-1"],
			},
			gameState: mockGameState,
			expectedError: "Player not found in game",
		},
		{
			name: "No response cards",
			data: {
				gameId: "test-game-1",
				playerId: "player-1",
				promptCardId: "prompt-1",
				responseCardIds: [],
			},
			gameState: mockGameState,
			expectedError: "At least one response card must be selected",
		},
		{
			name: "Wrong player response card",
			data: {
				gameId: "test-game-1",
				playerId: "player-1",
				promptCardId: "prompt-1",
				responseCardIds: ["response-3"], // This belongs to player-2
			},
			gameState: mockGameState,
			expectedError: "Response card 1 does not belong to this player",
		},
	];

	let passedTests = 0;

	testCases.forEach((testCase) => {
		const result = validateSubmission(
			testCase.data,
			testCase.gameState,
			mockPlayers,
			mockCards,
			mockSubmissions
		);

		const hasExpectedError = result.errors.some((error) =>
			error.includes(testCase.expectedError)
		);

		if (!result.isValid && hasExpectedError) {
			console.log(`✅ ${testCase.name}: Correctly rejected`);
			passedTests++;
		} else {
			console.log(
				`❌ ${testCase.name}: Should have been rejected with "${testCase.expectedError}"`
			);
			console.log(`   Got errors: ${result.errors.join(", ")}`);
		}
	});

	return passedTests === testCases.length;
}

function testSubmissionStats() {
	console.log("\n📊 Testing submission statistics...");

	// Test with no submissions
	let stats = getSubmissionStats(mockGameState, mockPlayers, []);

	if (
		stats.total === 3 &&
		stats.submitted === 0 &&
		stats.pending === 3 &&
		stats.completionPercentage === 0
	) {
		console.log("✅ Empty submission stats correct");
	} else {
		console.log("❌ Empty submission stats incorrect:", stats);
		return false;
	}

	// Test with partial submissions
	const partialSubmissions = [
		{
			id: "sub-1",
			player_id: "player-1",
			round_number: 1,
			submitted_at: new Date().toISOString(),
		},
	];

	stats = getSubmissionStats(mockGameState, mockPlayers, partialSubmissions);

	if (
		stats.total === 3 &&
		stats.submitted === 1 &&
		stats.pending === 2 &&
		Math.round(stats.completionPercentage) === 33
	) {
		console.log("✅ Partial submission stats correct");
	} else {
		console.log("❌ Partial submission stats incorrect:", stats);
		return false;
	}

	// Test with all submissions
	const allSubmissions = [
		{ id: "sub-1", player_id: "player-1", round_number: 1 },
		{ id: "sub-2", player_id: "player-2", round_number: 1 },
		{ id: "sub-3", player_id: "player-3", round_number: 1 },
	];

	stats = getSubmissionStats(mockGameState, mockPlayers, allSubmissions);

	if (
		stats.total === 3 &&
		stats.submitted === 3 &&
		stats.pending === 0 &&
		stats.completionPercentage === 100 &&
		stats.allSubmitted
	) {
		console.log("✅ Complete submission stats correct");
	} else {
		console.log("❌ Complete submission stats incorrect:", stats);
		return false;
	}

	return true;
}

function testDuplicateSubmission() {
	console.log("\n🔍 Testing duplicate submission prevention...");

	const submissionData = {
		gameId: "test-game-1",
		playerId: "player-1",
		promptCardId: "prompt-1",
		responseCardIds: ["response-1"],
	};

	// Add existing submission
	const existingSubmissions = [
		{
			id: "existing-sub",
			player_id: "player-1",
			round_number: 1,
			submitted_at: new Date().toISOString(),
		},
	];

	const result = validateSubmission(
		submissionData,
		mockGameState,
		mockPlayers,
		mockCards,
		existingSubmissions
	);

	if (
		!result.isValid &&
		result.errors.includes("Player has already submitted for this round")
	) {
		console.log("✅ Duplicate submission correctly prevented");
		return true;
	} else {
		console.log("❌ Duplicate submission not prevented:", result.errors);
		return false;
	}
}

function testDisconnectedPlayerWarning() {
	console.log("\n⚠️  Testing disconnected player warning...");

	const submissionData = {
		gameId: "test-game-1",
		playerId: "player-3", // This player is disconnected
		promptCardId: "prompt-1",
		responseCardIds: ["response-1"],
	};

	const result = validateSubmission(
		submissionData,
		mockGameState,
		mockPlayers,
		mockCards,
		mockSubmissions
	);

	// Should have warnings but still be valid (assuming they have valid cards)
	const hasDisconnectedWarning = result.warnings.some((warning) =>
		warning.includes("disconnected")
	);

	if (hasDisconnectedWarning) {
		console.log("✅ Disconnected player warning correctly shown");
		return true;
	} else {
		console.log("❌ Disconnected player warning not shown:", result.warnings);
		return false;
	}
}

async function runTests() {
	console.log("🧪 Starting Submission System Component Tests\n");

	const testResults = [];

	// Run all tests
	testResults.push(testValidSubmission());
	testResults.push(testInvalidSubmissions());
	testResults.push(testSubmissionStats());
	testResults.push(testDuplicateSubmission());
	testResults.push(testDisconnectedPlayerWarning());

	// Summary
	const passedTests = testResults.filter((result) => result).length;
	const totalTests = testResults.length;

	console.log(`\n📋 Test Summary: ${passedTests}/${totalTests} tests passed`);

	if (passedTests === totalTests) {
		console.log("✅ All submission system tests passed!");
		return true;
	} else {
		console.log("❌ Some tests failed. Please check the implementation.");
		return false;
	}
}

// Run tests
runTests().catch(console.error);
