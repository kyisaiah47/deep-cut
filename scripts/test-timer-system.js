#!/usr/bin/env node

/**
 * Test script for the timer synchronization system
 * This script tests the timer management functionality
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

async function testTimerFunctions() {
	console.log("Testing timer synchronization functions...");

	try {
		// Test get_server_time function
		console.log("\n1. Testing get_server_time function:");
		const { data: serverTime, error: timeError } = await supabase.rpc(
			"get_server_time"
		);

		if (timeError) {
			console.error("❌ get_server_time failed:", timeError);
		} else {
			console.log("✅ Server time:", new Date(serverTime).toISOString());
		}

		// Test game_timers table structure
		console.log("\n2. Testing game_timers table structure:");
		const { data: tableInfo, error: tableError } = await supabase
			.from("game_timers")
			.select("*")
			.limit(1);

		if (tableError) {
			console.error("❌ game_timers table access failed:", tableError);
		} else {
			console.log("✅ game_timers table accessible");
		}

		// Test timer creation (requires a test game)
		console.log("\n3. Testing timer creation:");

		// First, check if we have any test games
		const { data: games, error: gamesError } = await supabase
			.from("games")
			.select("id, room_code")
			.limit(1);

		if (gamesError) {
			console.error("❌ Failed to fetch games:", gamesError);
			return;
		}

		if (games.length === 0) {
			console.log(
				"⚠️  No test games found. Create a game first to test timers."
			);
			return;
		}

		const testGame = games[0];
		console.log(`Using test game: ${testGame.room_code} (${testGame.id})`);

		// Create a test timer
		const { data: timerData, error: timerError } = await supabase
			.from("game_timers")
			.upsert({
				game_id: testGame.id,
				phase: "submission",
				duration: 60,
				started_at: new Date().toISOString(),
				is_active: true,
				is_paused: false,
			})
			.select()
			.single();

		if (timerError) {
			console.error("❌ Timer creation failed:", timerError);
		} else {
			console.log("✅ Timer created successfully:", {
				id: timerData.id,
				phase: timerData.phase,
				duration: timerData.duration,
				is_active: timerData.is_active,
			});

			// Test get_timer_remaining function
			console.log("\n4. Testing get_timer_remaining function:");
			const { data: remainingTime, error: remainingError } = await supabase.rpc(
				"get_timer_remaining",
				{
					p_game_id: testGame.id,
					p_phase: "submission",
				}
			);

			if (remainingError) {
				console.error("❌ get_timer_remaining failed:", remainingError);
			} else {
				console.log("✅ Remaining time:", remainingTime, "seconds");
			}

			// Clean up test timer
			await supabase.from("game_timers").delete().eq("id", timerData.id);
			console.log("✅ Test timer cleaned up");
		}

		console.log("\n✅ Timer system tests completed!");
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

async function main() {
	console.log("AI Cards Game - Timer System Test");
	console.log("=".repeat(40));

	await testTimerFunctions();
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testTimerFunctions };
