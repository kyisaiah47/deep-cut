import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GameError, GameStateError } from "@/lib/error-handling";
import { canPlayerPerformAction } from "@/lib/game-utils";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { gameId, playerId, promptCardId, responseCardIds } = body;

		// Validate required fields
		if (!gameId || !playerId || !promptCardId || !responseCardIds) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(responseCardIds) || responseCardIds.length === 0) {
			return NextResponse.json(
				{ error: "Response cards must be a non-empty array" },
				{ status: 400 }
			);
		}

		// Get game state
		const { data: gameState, error: gameError } = await supabase
			.from("games")
			.select("*")
			.eq("id", gameId)
			.single();

		if (gameError || !gameState) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Get players
		const { data: players, error: playersError } = await supabase
			.from("players")
			.select("*")
			.eq("game_id", gameId);

		if (playersError) {
			return NextResponse.json(
				{ error: "Failed to fetch players" },
				{ status: 500 }
			);
		}

		// Get existing submissions for this round
		const { data: existingSubmissions, error: submissionsError } =
			await supabase
				.from("submissions")
				.select("*")
				.eq("game_id", gameId)
				.eq("round_number", gameState.current_round);

		if (submissionsError) {
			return NextResponse.json(
				{ error: "Failed to check existing submissions" },
				{ status: 500 }
			);
		}

		// Check if player can submit
		const actionCheck = canPlayerPerformAction(
			"submit",
			playerId,
			gameState,
			players || [],
			existingSubmissions || []
		);

		if (!actionCheck.canPerform) {
			return NextResponse.json(
				{ error: actionCheck.reason || "Cannot submit cards" },
				{ status: 403 }
			);
		}

		// Verify prompt card exists and belongs to the game/round
		const { data: promptCard, error: promptError } = await supabase
			.from("cards")
			.select("*")
			.eq("id", promptCardId)
			.eq("game_id", gameId)
			.eq("round_number", gameState.current_round)
			.eq("type", "prompt")
			.single();

		if (promptError || !promptCard) {
			return NextResponse.json(
				{ error: "Invalid prompt card" },
				{ status: 400 }
			);
		}

		// Verify response cards exist and belong to the player
		const { data: responseCards, error: responseError } = await supabase
			.from("cards")
			.select("*")
			.in("id", responseCardIds)
			.eq("game_id", gameId)
			.eq("round_number", gameState.current_round)
			.eq("type", "response")
			.eq("player_id", playerId);

		if (
			responseError ||
			!responseCards ||
			responseCards.length !== responseCardIds.length
		) {
			return NextResponse.json(
				{ error: "Invalid response cards" },
				{ status: 400 }
			);
		}

		// Create submission
		const { data: submission, error: submissionError } = await supabase
			.from("submissions")
			.insert({
				game_id: gameId,
				player_id: playerId,
				round_number: gameState.current_round,
				prompt_card_id: promptCardId,
				response_cards: responseCards,
				votes: 0,
			})
			.select()
			.single();

		if (submissionError) {
			return NextResponse.json(
				{ error: "Failed to create submission" },
				{ status: 500 }
			);
		}

		// Check if all players have submitted
		const totalSubmissions = (existingSubmissions?.length || 0) + 1;
		const totalPlayers = players?.length || 0;

		// If all players have submitted, transition to voting phase
		if (totalSubmissions >= totalPlayers) {
			const { error: phaseError } = await supabase
				.from("games")
				.update({
					phase: "voting",
					updated_at: new Date().toISOString(),
				})
				.eq("id", gameId);

			if (phaseError) {
				console.error("Failed to transition to voting phase:", phaseError);
			}
		}

		return NextResponse.json({
			success: true,
			submission,
			allSubmitted: totalSubmissions >= totalPlayers,
		});
	} catch (error) {
		console.error("Submission API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const gameId = searchParams.get("gameId");
		const roundNumber = searchParams.get("roundNumber");

		if (!gameId) {
			return NextResponse.json(
				{ error: "Game ID is required" },
				{ status: 400 }
			);
		}

		// Build query
		let query = supabase
			.from("submissions")
			.select(
				`
				*,
				player:players(id, name)
			`
			)
			.eq("game_id", gameId);

		if (roundNumber) {
			query = query.eq("round_number", parseInt(roundNumber));
		}

		const { data: submissions, error } = await query.order("submitted_at", {
			ascending: true,
		});

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch submissions" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ submissions });
	} catch (error) {
		console.error("Get submissions API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
