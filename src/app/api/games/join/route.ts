import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generatePlayerId, isValidRoomCode } from "@/lib/game-utils";
import { GAME_LIMITS } from "@/lib/constants";

interface JoinGameRequest {
	playerName: string;
	roomCode: string;
}

export async function POST(request: NextRequest) {
	try {
		const body: JoinGameRequest = await request.json();

		// Validate request body
		if (!body.playerName || typeof body.playerName !== "string") {
			return NextResponse.json(
				{ error: "Player name is required" },
				{ status: 400 }
			);
		}

		if (!body.roomCode || typeof body.roomCode !== "string") {
			return NextResponse.json(
				{ error: "Room code is required" },
				{ status: 400 }
			);
		}

		const playerName = body.playerName.trim();
		const roomCode = body.roomCode.toUpperCase().trim();

		// Validate player name
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

		// Validate room code format
		if (!isValidRoomCode(roomCode)) {
			return NextResponse.json(
				{ error: "Invalid room code format" },
				{ status: 400 }
			);
		}

		// Find the game
		const { data: game, error: gameError } = await supabase
			.from("games")
			.select("*")
			.eq("room_code", roomCode)
			.single();

		if (gameError || !game) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Check if game is in lobby phase (can only join during lobby)
		if (game.phase !== "lobby") {
			return NextResponse.json(
				{ error: "Cannot join game in progress" },
				{ status: 400 }
			);
		}

		// Get current players to check capacity and name conflicts
		const { data: currentPlayers, error: playersError } = await supabase
			.from("players")
			.select("*")
			.eq("game_id", game.id)
			.eq("is_connected", true);

		if (playersError) {
			console.error("Error fetching players:", playersError);
			return NextResponse.json(
				{ error: "Failed to check game status" },
				{ status: 500 }
			);
		}

		// Check if game is full
		if (currentPlayers.length >= game.max_players) {
			return NextResponse.json({ error: "Game is full" }, { status: 400 });
		}

		// Check if player name is already taken
		const nameExists = currentPlayers.some(
			(player) => player.name.toLowerCase() === playerName.toLowerCase()
		);

		if (nameExists) {
			return NextResponse.json(
				{ error: "Player name is already taken in this game" },
				{ status: 400 }
			);
		}

		// Generate player ID
		const playerId = generatePlayerId();

		// Add player to game
		const { error: playerError } = await supabase.from("players").insert({
			id: playerId,
			game_id: game.id,
			name: playerName,
			score: 0,
			is_connected: true,
		});

		if (playerError) {
			console.error("Error adding player:", playerError);
			return NextResponse.json(
				{ error: "Failed to join game" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			roomCode,
			playerId,
			gameId: game.id,
			isHost: false,
		});
	} catch (error) {
		console.error("Error in join game API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
