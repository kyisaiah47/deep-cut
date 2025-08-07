#!/usr/bin/env node

/**
 * Integration test for AI Cards Game database
 * This script tests the complete database functionality
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase environment variables");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteGameFlow() {
	console.log("🎮 Testing complete game flow...\n");

	let gameId, player1Id, player2Id, cardId, submissionId;

	try {
		// 1. Test room code generation
		console.log("1. Testing room code generation...");
		const { data: roomCode, error: roomError } = await supabase.rpc(
			"generate_room_code"
		);
		if (roomError) throw roomError;
		console.log(`   ✅ Generated room code: ${roomCode}`);

		// 2. Create a game
		console.log("2. Creating game...");
		const { data: gameData, error: gameError } = await supabase
			.from("games")
			.insert({
				room_code: roomCode,
				phase: "lobby",
				target_score: 3,
			})
			.select()
			.single();

		if (gameError) throw gameError;
		gameId = gameData.id;
		console.log(`   ✅ Game created with ID: ${gameId}`);

		// 3. Add first player (should become host)
		console.log("3. Adding first player...");
		const { data: player1Data, error: player1Error } = await supabase
			.from("players")
			.insert({
				game_id: gameId,
				name: "Player 1",
			})
			.select()
			.single();

		if (player1Error) throw player1Error;
		player1Id = player1Data.id;
		console.log(`   ✅ Player 1 added with ID: ${player1Id}`);

		// 4. Verify first player became host
		console.log("4. Verifying host assignment...");
		const { data: updatedGame, error: hostError } = await supabase
			.from("games")
			.select("host_id")
			.eq("id", gameId)
			.single();

		if (hostError) throw hostError;
		if (updatedGame.host_id !== player1Id) {
			throw new Error("First player did not become host");
		}
		console.log("   ✅ First player correctly assigned as host");

		// 5. Add second player
		console.log("5. Adding second player...");
		const { data: player2Data, error: player2Error } = await supabase
			.from("players")
			.insert({
				game_id: gameId,
				name: "Player 2",
			})
			.select()
			.single();

		if (player2Error) throw player2Error;
		player2Id = player2Data.id;
		console.log(`   ✅ Player 2 added with ID: ${player2Id}`);

		// 6. Add cards for the game
		console.log("6. Adding game cards...");
		const { data: cardData, error: cardError } = await supabase
			.from("cards")
			.insert([
				{
					game_id: gameId,
					round_number: 1,
					type: "prompt",
					text: "What makes me happy? _____.",
				},
				{
					game_id: gameId,
					round_number: 1,
					type: "response",
					text: "A warm hug",
					player_id: player1Id,
				},
				{
					game_id: gameId,
					round_number: 1,
					type: "response",
					text: "Pizza on Friday",
					player_id: player2Id,
				},
			])
			.select();

		if (cardError) throw cardError;
		cardId = cardData.find((c) => c.type === "prompt").id;
		console.log(`   ✅ Cards added successfully`);

		// 7. Test submissions
		console.log("7. Testing card submissions...");
		const { data: submissionData, error: submissionError } = await supabase
			.from("submissions")
			.insert({
				game_id: gameId,
				player_id: player1Id,
				round_number: 1,
				prompt_card_id: cardId,
				response_cards: { cards: ["A warm hug"] },
			})
			.select()
			.single();

		if (submissionError) throw submissionError;
		submissionId = submissionData.id;
		console.log(`   ✅ Submission created with ID: ${submissionId}`);

		// 8. Test voting
		console.log("8. Testing voting system...");
		const { data: voteData, error: voteError } = await supabase
			.from("votes")
			.insert({
				game_id: gameId,
				player_id: player2Id,
				submission_id: submissionId,
				round_number: 1,
			})
			.select()
			.single();

		if (voteError) throw voteError;
		console.log(`   ✅ Vote cast successfully`);

		// 9. Verify vote count updated
		console.log("9. Verifying vote count update...");
		const { data: updatedSubmission, error: voteCountError } = await supabase
			.from("submissions")
			.select("votes")
			.eq("id", submissionId)
			.single();

		if (voteCountError) throw voteCountError;
		if (updatedSubmission.votes !== 1) {
			throw new Error(`Expected 1 vote, got ${updatedSubmission.votes}`);
		}
		console.log("   ✅ Vote count correctly updated");

		// 10. Test helper functions
		console.log("10. Testing helper functions...");

		// Test check_all_players_submitted
		const { data: allSubmitted, error: submittedError } = await supabase.rpc(
			"check_all_players_submitted",
			{ game_uuid: gameId, round_num: 1 }
		);
		if (submittedError) throw submittedError;
		console.log(`   ✅ check_all_players_submitted: ${allSubmitted}`);

		// Test get_round_winners
		const { data: winners, error: winnersError } = await supabase.rpc(
			"get_round_winners",
			{ game_uuid: gameId, round_num: 1 }
		);
		if (winnersError) throw winnersError;
		console.log(`   ✅ get_round_winners returned ${winners.length} winner(s)`);

		console.log("\n🎉 All tests passed! Database is working correctly.");
		return true;
	} catch (error) {
		console.error(`\n❌ Test failed: ${error.message}`);
		return false;
	} finally {
		// Cleanup test data
		if (gameId) {
			console.log("\n🧹 Cleaning up test data...");
			await supabase.from("games").delete().eq("id", gameId);
			console.log("   ✅ Test data cleaned up");
		}
	}
}

async function main() {
	console.log("🔍 AI Cards Game Database Integration Test\n");

	const success = await testCompleteGameFlow();

	if (success) {
		console.log("\n✅ Integration test completed successfully!");
		process.exit(0);
	} else {
		console.log("\n❌ Integration test failed!");
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("Integration test error:", err);
	process.exit(1);
});
