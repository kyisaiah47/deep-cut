import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { canPlayerPerformAction } from "@/lib/game-utils";
import { GAME_PHASES } from "@/lib/constants";

interface GameControlRequest {
	gameId: string;
	playerId: string;
	action: "start" | "pause" | "reset";
}

export async function POST(request: NextRequest) {
	try {
		const body: GameControlRequest = await request.json();

		if (!body.gameId || !body.playerId || !body.action) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Get current game state and players
		const { data: gameData, error: gameError } = await supabase
			.from("games")
			.select("*")
			.eq("id", body.gameId)
			.single();

		if (gameError || !gameData) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		const { data: playersData, error: playersError } = await supabase
			.from("players")
			.select("*")
			.eq("game_id", body.gameId);

		if (playersError) {
			return NextResponse.json(
				{ error: "Failed to fetch players" },
				{ status: 500 }
			);
		}

		// Verify player is host
		if (gameData.host_id !== body.playerId) {
			return NextResponse.json(
				{ error: "Only the host can control the game" },
				{ status: 403 }
			);
		}

		const updates: Record<string, string | number> = {
			updated_at: new Date().toISOString(),
		};

		switch (body.action) {
			case "start":
				// Check if game can be started
				const canStart = canPlayerPerformAction(
					"start_game",
					body.playerId,
					gameData,
					playersData || []
				);

				if (!canStart.canPerform) {
					return NextResponse.json(
						{ error: canStart.reason || "Cannot start game" },
						{ status: 400 }
					);
				}

				updates.phase = GAME_PHASES.DISTRIBUTION;
				break;

			case "pause":
				// Can only pause during active gameplay phases
				if (
					gameData.phase === GAME_PHASES.LOBBY ||
					gameData.phase === GAME_PHASES.RESULTS
				) {
					return NextResponse.json(
						{ error: "Cannot pause game in current phase" },
						{ status: 400 }
					);
				}

				// For now, pausing just keeps the current phase but could be extended
				// to add a "paused" state to the database schema
				updates.updated_at = new Date().toISOString();
				break;

			case "reset":
				// Reset game to lobby state
				updates.phase = GAME_PHASES.LOBBY;
				updates.current_round = 1;

				// Reset all player scores
				const { error: resetScoresError } = await supabase
					.from("players")
					.update({ score: 0 })
					.eq("game_id", body.gameId);

				if (resetScoresError) {
					return NextResponse.json(
						{ error: "Failed to reset player scores" },
						{ status: 500 }
					);
				}

				// Clear game data (cards, submissions, votes) for fresh start
				await Promise.all([
					supabase.from("cards").delete().eq("game_id", body.gameId),
					supabase.from("submissions").delete().eq("game_id", body.gameId),
					supabase.from("votes").delete().eq("game_id", body.gameId),
				]);

				break;

			default:
				return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}

		// Update the game
		const { data: updatedGame, error: updateError } = await supabase
			.from("games")
			.update(updates)
			.eq("id", body.gameId)
			.select()
			.single();

		if (updateError) {
			return NextResponse.json(
				{ error: "Failed to update game" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			game: updatedGame,
			action: body.action,
		});
	} catch (error) {
		console.error("Game control error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
