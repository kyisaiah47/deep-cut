// Simple test script for the API routes
const BASE_URL = "http://localhost:3000";

async function testCreateGame() {
	console.log("Testing create game API...");

	try {
		const response = await fetch(`${BASE_URL}/api/games/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				playerName: "Test Player",
				gameSettings: {
					maxPlayers: 6,
					targetScore: 5,
					submissionTimer: 90,
					votingTimer: 45,
				},
			}),
		});

		const data = await response.json();

		if (response.ok) {
			console.log("✅ Create game successful:", data);
			return data;
		} else {
			console.log("❌ Create game failed:", data);
			return null;
		}
	} catch (error) {
		console.log("❌ Create game error:", error.message);
		return null;
	}
}

async function testJoinGame(roomCode) {
	console.log(`Testing join game API with room code: ${roomCode}...`);

	try {
		const response = await fetch(`${BASE_URL}/api/games/join`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				playerName: "Test Player 2",
				roomCode: roomCode,
			}),
		});

		const data = await response.json();

		if (response.ok) {
			console.log("✅ Join game successful:", data);
			return data;
		} else {
			console.log("❌ Join game failed:", data);
			return null;
		}
	} catch (error) {
		console.log("❌ Join game error:", error.message);
		return null;
	}
}

async function runTests() {
	console.log("Starting API tests...\n");

	// Test create game
	const createResult = await testCreateGame();

	if (createResult && createResult.roomCode) {
		console.log("\n");
		// Test join game with the created room code
		await testJoinGame(createResult.roomCode);
	}

	console.log("\nAPI tests completed.");
}

// Run tests if this script is executed directly
if (require.main === module) {
	runTests();
}

module.exports = { testCreateGame, testJoinGame };
