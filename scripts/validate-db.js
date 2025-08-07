#!/usr/bin/env node

/**
 * Database validation script for AI Cards Game
 * This script validates that the database schema matches expectations
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase environment variables");
	console.error(
		"Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
	);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateTables() {
	console.log("Validating database tables...");

	const expectedTables = ["games", "players", "cards", "submissions", "votes"];
	const results = {};

	for (const table of expectedTables) {
		try {
			const { data, error } = await supabase.from(table).select("*").limit(1);

			if (error) {
				results[table] = { exists: false, error: error.message };
			} else {
				results[table] = { exists: true, error: null };
			}
		} catch (err) {
			results[table] = { exists: false, error: err.message };
		}
	}

	console.log("\nTable validation results:");
	expectedTables.forEach((table) => {
		const status = results[table].exists ? "✅" : "❌";
		console.log(`  ${status} ${table}`);
		if (results[table].error) {
			console.log(`      Error: ${results[table].error}`);
		}
	});

	return expectedTables.every((table) => results[table].exists);
}

async function validateFunctions() {
	console.log("\nValidating database functions...");

	const expectedFunctions = [
		"generate_room_code",
		"check_all_players_submitted",
		"check_all_players_voted",
		"get_round_winners",
		"update_player_scores",
		"check_game_end",
	];

	// Test function existence by trying to call them with dummy data
	const results = {};

	for (const func of expectedFunctions) {
		try {
			// Most functions require parameters, so we'll just check if they exist
			// by looking at the error message when calling without proper params
			const { error } = await supabase.rpc(func);

			if (
				error &&
				error.message.includes("function") &&
				error.message.includes("does not exist")
			) {
				results[func] = { exists: false, error: "Function does not exist" };
			} else {
				// Function exists (even if it errors due to missing/invalid params)
				results[func] = { exists: true, error: null };
			}
		} catch (err) {
			results[func] = { exists: false, error: err.message };
		}
	}

	console.log("Function validation results:");
	expectedFunctions.forEach((func) => {
		const status = results[func].exists ? "✅" : "❌";
		console.log(`  ${status} ${func}()`);
		if (results[func].error && !results[func].exists) {
			console.log(`      Error: ${results[func].error}`);
		}
	});

	return expectedFunctions.every((func) => results[func].exists);
}

async function testBasicOperations() {
	console.log("\nTesting basic database operations...");

	try {
		// Test creating a game
		const { data: gameData, error: gameError } = await supabase
			.from("games")
			.insert({
				room_code: "TEST99",
				phase: "lobby",
			})
			.select()
			.single();

		if (gameError) {
			console.log("❌ Game creation failed:", gameError.message);
			return false;
		}

		console.log("✅ Game creation successful");

		// Test creating a player
		const { data: playerData, error: playerError } = await supabase
			.from("players")
			.insert({
				game_id: gameData.id,
				name: "Test Player",
			})
			.select()
			.single();

		if (playerError) {
			console.log("❌ Player creation failed:", playerError.message);
			return false;
		}

		console.log("✅ Player creation successful");

		// Clean up test data
		await supabase.from("games").delete().eq("id", gameData.id);
		console.log("✅ Test data cleanup successful");

		return true;
	} catch (err) {
		console.log("❌ Basic operations test failed:", err.message);
		return false;
	}
}

async function main() {
	console.log("🔍 AI Cards Game Database Validation\n");

	const tablesValid = await validateTables();
	const functionsValid = await validateFunctions();
	const operationsValid = await testBasicOperations();

	console.log("\n📊 Validation Summary:");
	console.log(`  Tables: ${tablesValid ? "✅ Valid" : "❌ Invalid"}`);
	console.log(`  Functions: ${functionsValid ? "✅ Valid" : "❌ Invalid"}`);
	console.log(`  Operations: ${operationsValid ? "✅ Valid" : "❌ Invalid"}`);

	if (tablesValid && functionsValid && operationsValid) {
		console.log(
			"\n🎉 Database validation passed! Your database is ready for the AI Cards Game."
		);
		process.exit(0);
	} else {
		console.log(
			"\n⚠️  Database validation failed. Please check the setup and try again."
		);
		console.log("   Run the setup script: npm run db:setup");
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("Validation script error:", err);
	process.exit(1);
});
