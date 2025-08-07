import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
	generateRoomCode,
	generatePlayerId,
	DEFAULT_GAME_SETTINGS,
} from "@/lib/game-utils";
import { GAME_LIMITS } from "@/lib/constants";

interface CreateGameRequest {
	playerName: string;
	gameSettings?: {
		maxPlayers?: number;
		targetScore?: number;
		submissionTimer?: number;
		votingTimer?: number;
	};
}

export async function POST(request: NextRequest) {
	try {
		const body: CreateGameRequest = await request.json();

		// Validate request body
		if (!body.playerName || typeof body.playerName !== "string") {
			return NextResponse.json(
				{ error: "Player name is required" },
				{ status: 400 }
			);
		}

		const playerName = body.playerName.trim();
		if (playerName.length === 0) {
			return NextResponse.json(
				{ error: "Player name cannot be empty" },
				{ status: 400 }
			);
		}

		if (playerName.length > GAME_LIMITS.MAX_PLAYER_NAME_LENGTH) {
			return NextResponse.json(
				{
					error: `Player name must be ${GAME_LIMITS.MAX_PLAYER_NAME_LENGTH} characters or less`,
				},
				{ status: 400 }
			);
		}

		// Validate game settings
		const gameSettings = {
			maxPlayers:
				body.gameSettings?.maxPlayers ?? DEFAULT_GAME_SETTINGS.maxPlayers,
			targetScore:
				body.gameSettings?.targetScore ?? DEFAULT_GAME_SETTINGS.targetScore,
			submissionTimer:
				body.gameSettings?.submissionTimer ??
				DEFAULT_GAME_SETTINGS.submissionTimer,
			votingTimer:
				body.gameSettings?.votingTimer ?? DEFAULT_GAME_SETTINGS.votingTimer,
		};

		// Validate settings ranges
		if (
			gameSettings.maxPlayers < GAME_LIMITS.MIN_PLAYERS ||
			gameSettings.maxPlayers > GAME_LIMITS.MAX_PLAYERS
		) {
			return NextResponse.json(
				{
					error: `Max players must be between ${GAME_LIMITS.MIN_PLAYERS} and ${GAME_LIMITS.MAX_PLAYERS}`,
				},
				{ status: 400 }
			);
		}

		if (
			gameSettings.targetScore < GAME_LIMITS.MIN_TARGET_SCORE ||
			gameSettings.targetScore > GAME_LIMITS.MAX_TARGET_SCORE
		) {
			return NextResponse.json(
				{
					error: `Target score must be between ${GAME_LIMITS.MIN_TARGET_SCORE} and ${GAME_LIMITS.MAX_TARGET_SCORE}`,
				},
				{ status: 400 }
			);
		}

		if (
			gameSettings.submissionTimer < 30 ||
			gameSettings.submissionTimer > 300
		) {
			return NextResponse.json(
				{ error: "Submission timer must be between 30 and 300 seconds" },
				{ status: 400 }
			);
		}

		if (gameSettings.votingTimer < 15 || gameSettings.votingTimer > 120) {
			return NextResponse.json(
				{ error: "Voting timer must be between 15 and 120 seconds" },
				{ status: 400 }
			);
		}

		// Generate unique room code (with retry logic)
		let roomCode: string;
		let attempts = 0;
		const maxAttempts = 10;

		do {
			roomCode = generateRoomCode();
			attempts++;

			// Check if room code already exists
			const { data: existingGame } = await supabase
				.from("games")
				.select("id")
				.eq("room_code", roomCode)
				.single();

			if (!existingGame) {
				break; // Room code is unique
			}

			if (attempts >= maxAttempts) {
				return NextResponse.json(
					{ error: "Unable to generate unique room code. Please try again." },
					{ status: 500 }
				);
			}
		} while (attempts < maxAttempts);

		// Generate player ID
		const playerId = generatePlayerId();

		// Create game in database
		const { data: game, error: gameError } = await supabase
			.from("games")
			.insert({
				room_code: roomCode,
				phase: "lobby",
				current_round: 1,
				target_score: gameSettings.targetScore,
				max_players: gameSettings.maxPlayers,
				submission_timer: gameSettings.submissionTimer,
				voting_timer: gameSettings.votingTimer,
				host_id: playerId,
			})
			.select()
			.single();

		if (gameError) {
			console.error("Error creating game:", gameError);
			return NextResponse.json(
				{ error: "Failed to create game" },
				{ status: 500 }
			);
		}

		// Add host as first player
		const { error: playerError } = await supabase.from("players").insert({
			id: playerId,
			game_id: game.id,
			name: playerName,
			score: 0,
			is_connected: true,
		});

		if (playerError) {
			console.error("Error adding host player:", playerError);

			// Clean up the game if player creation failed
			await supabase.from("games").delete().eq("id", game.id);

			return NextResponse.json(
				{ error: "Failed to create game" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			roomCode,
			playerId,
			gameId: game.id,
			isHost: true,
		});
	} catch (error) {
		console.error("Error in create game API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
