import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GAME_LIMITS } from "@/lib/constants";
import { canPlayerPerformAction } from "@/lib/game-utils";

interface UpdateSettingsRequest {
	gameId: string;
	playerId: string;
	settings: {
		maxPlayers?: number;
		targetScore?: number;
		submissionTimer?: number;
		votingTimer?: number;
	};
}

export async function PUT(request: NextRequest) {
	try {
		const body: UpdateSettingsRequest = await request.json();

		if (!body.gameId || !body.playerId || !body.settings) {
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

		// Check if player can change settings
		const canChange = canPlayerPerformAction(
			"change_settings",
			body.playerId,
			gameData,
			playersData || []
		);

		if (!canChange.canPerform) {
			return NextResponse.json(
				{ error: canChange.reason || "Cannot change settings" },
				{ status: 403 }
			);
		}

		// Validate settings
		const updates: Record<string, string | number> = {};

		if (body.settings.maxPlayers !== undefined) {
			if (
				body.settings.maxPlayers < GAME_LIMITS.MIN_PLAYERS ||
				body.settings.maxPlayers > GAME_LIMITS.MAX_PLAYERS
			) {
				return NextResponse.json(
					{
						error: `Max players must be between ${GAME_LIMITS.MIN_PLAYERS} and ${GAME_LIMITS.MAX_PLAYERS}`,
					},
					{ status: 400 }
				);
			}

			// Check if reducing max players would kick existing players
			const currentPlayerCount = (playersData || []).length;
			if (body.settings.maxPlayers < currentPlayerCount) {
				return NextResponse.json(
					{
						error: `Cannot reduce max players below current player count (${currentPlayerCount})`,
					},
					{ status: 400 }
				);
			}

			updates.max_players = body.settings.maxPlayers;
		}

		if (body.settings.targetScore !== undefined) {
			if (
				body.settings.targetScore < GAME_LIMITS.MIN_TARGET_SCORE ||
				body.settings.targetScore > GAME_LIMITS.MAX_TARGET_SCORE
			) {
				return NextResponse.json(
					{
						error: `Target score must be between ${GAME_LIMITS.MIN_TARGET_SCORE} and ${GAME_LIMITS.MAX_TARGET_SCORE}`,
					},
					{ status: 400 }
				);
			}
			updates.target_score = body.settings.targetScore;
		}

		if (body.settings.submissionTimer !== undefined) {
			if (
				body.settings.submissionTimer < 30 ||
				body.settings.submissionTimer > 300
			) {
				return NextResponse.json(
					{ error: "Submission timer must be between 30 and 300 seconds" },
					{ status: 400 }
				);
			}
			updates.submission_timer = body.settings.submissionTimer;
		}

		if (body.settings.votingTimer !== undefined) {
			if (body.settings.votingTimer < 15 || body.settings.votingTimer > 120) {
				return NextResponse.json(
					{ error: "Voting timer must be between 15 and 120 seconds" },
					{ status: 400 }
				);
			}
			updates.voting_timer = body.settings.votingTimer;
		}

		// Update the game settings
		updates.updated_at = new Date().toISOString();

		const { data: updatedGame, error: updateError } = await supabase
			.from("games")
			.update(updates)
			.eq("id", body.gameId)
			.select()
			.single();

		if (updateError) {
			return NextResponse.json(
				{ error: "Failed to update game settings" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			game: updatedGame,
		});
	} catch (error) {
		console.error("Settings update error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
