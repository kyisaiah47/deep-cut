import { NextRequest, NextResponse } from "next/server";
import { distributeCardsToPlayers } from "../../../../lib/card-generation";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { gameId, roundNumber, playerIds, cardsPerPlayer = 5 } = body;

		// Validate required parameters
		if (!gameId || !roundNumber || !playerIds) {
			return NextResponse.json(
				{
					error: "Missing required parameters: gameId, roundNumber, playerIds",
				},
				{ status: 400 }
			);
		}

		// Validate parameter types and ranges
		if (typeof gameId !== "string" || gameId.trim().length === 0) {
			return NextResponse.json(
				{ error: "gameId must be a non-empty string" },
				{ status: 400 }
			);
		}

		if (!Number.isInteger(roundNumber) || roundNumber < 1) {
			return NextResponse.json(
				{ error: "roundNumber must be a positive integer" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(playerIds) || playerIds.length === 0) {
			return NextResponse.json(
				{ error: "playerIds must be a non-empty array" },
				{ status: 400 }
			);
		}

		if (
			playerIds.some((id) => typeof id !== "string" || id.trim().length === 0)
		) {
			return NextResponse.json(
				{ error: "All playerIds must be non-empty strings" },
				{ status: 400 }
			);
		}

		if (
			!Number.isInteger(cardsPerPlayer) ||
			cardsPerPlayer < 1 ||
			cardsPerPlayer > 10
		) {
			return NextResponse.json(
				{ error: "cardsPerPlayer must be between 1 and 10" },
				{ status: 400 }
			);
		}

		// Distribute cards to players
		await distributeCardsToPlayers(
			gameId.trim(),
			roundNumber,
			playerIds.map((id) => id.trim()),
			cardsPerPlayer
		);

		return NextResponse.json({
			success: true,
			message: `Cards distributed to ${playerIds.length} players`,
			playersCount: playerIds.length,
			cardsPerPlayer,
			totalCardsDistributed: playerIds.length * cardsPerPlayer,
		});
	} catch (error) {
		console.error("Card distribution API error:", error);

		return NextResponse.json(
			{
				error: "Failed to distribute cards",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json(
		{ error: "Method not allowed. Use POST to distribute cards." },
		{ status: 405 }
	);
}
