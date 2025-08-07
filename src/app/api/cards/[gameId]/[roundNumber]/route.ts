import { NextRequest, NextResponse } from "next/server";
import {
	getCardsForRound,
	getPromptCard,
	getResponseCards,
	getPlayerCards,
} from "../../../../../lib/card-generation";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ gameId: string; roundNumber: string }> }
) {
	try {
		const { gameId, roundNumber } = await params;
		const { searchParams } = new URL(request.url);
		const playerId = searchParams.get("playerId");
		const type = searchParams.get("type"); // 'all', 'prompt', 'response', 'player'

		// Validate parameters
		if (!gameId || gameId.trim().length === 0) {
			return NextResponse.json(
				{ error: "gameId must be a non-empty string" },
				{ status: 400 }
			);
		}

		const roundNum = parseInt(roundNumber);
		if (isNaN(roundNum) || roundNum < 1) {
			return NextResponse.json(
				{ error: "roundNumber must be a positive integer" },
				{ status: 400 }
			);
		}

		if (type === "player" && (!playerId || playerId.trim().length === 0)) {
			return NextResponse.json(
				{ error: 'playerId is required when type is "player"' },
				{ status: 400 }
			);
		}

		let result;

		switch (type) {
			case "prompt":
				result = await getPromptCard(gameId.trim(), roundNum);
				break;

			case "response":
				result = await getResponseCards(gameId.trim(), roundNum);
				break;

			case "player":
				if (!playerId) {
					return NextResponse.json(
						{ error: "playerId is required for player cards" },
						{ status: 400 }
					);
				}
				result = await getPlayerCards(gameId.trim(), roundNum, playerId.trim());
				break;

			case "all":
			default:
				result = await getCardsForRound(gameId.trim(), roundNum);
				break;
		}

		return NextResponse.json({
			success: true,
			gameId: gameId.trim(),
			roundNumber: roundNum,
			type: type || "all",
			playerId: playerId?.trim(),
			cards: result,
			count: Array.isArray(result) ? result.length : result ? 1 : 0,
		});
	} catch (error) {
		console.error("Cards fetch API error:", error);

		return NextResponse.json(
			{
				error: "Failed to fetch cards",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ gameId: string; roundNumber: string }> }
) {
	try {
		const { gameId, roundNumber } = await params;

		// Validate parameters
		if (!gameId || gameId.trim().length === 0) {
			return NextResponse.json(
				{ error: "gameId must be a non-empty string" },
				{ status: 400 }
			);
		}

		const roundNum = parseInt(roundNumber);
		if (isNaN(roundNum) || roundNum < 1) {
			return NextResponse.json(
				{ error: "roundNumber must be a positive integer" },
				{ status: 400 }
			);
		}

		// Import supabase here to avoid circular dependencies
		const { supabase } = await import("../../../../../lib/supabase");

		// Delete all cards for the specified game and round
		const { error } = await supabase
			.from("cards")
			.delete()
			.eq("game_id", gameId.trim())
			.eq("round_number", roundNum);

		if (error) {
			console.error("Error deleting cards:", error);
			return NextResponse.json(
				{ error: "Failed to delete cards" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: `All cards deleted for game ${gameId} round ${roundNum}`,
			gameId: gameId.trim(),
			roundNumber: roundNum,
		});
	} catch (error) {
		console.error("Cards delete API error:", error);

		return NextResponse.json(
			{
				error: "Failed to delete cards",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
