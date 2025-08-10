import { NextRequest, NextResponse } from "next/server";
import {
	generateCards,
	GenerateCardsOptions,
} from "../../../../lib/card-generation";
import { withRateLimit, RATE_LIMITS, abuseDetector } from "@/lib/rate-limiting";

async function generateCardsHandler(request: NextRequest) {
	try {
		const body = await request.json();
		const { gameId, roundNumber, playerCount, theme } = body;

		// Validate required parameters
		if (!gameId || !roundNumber || !playerCount) {
			return NextResponse.json(
				{
					error:
						"Missing required parameters: gameId, roundNumber, playerCount",
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

		if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 10) {
			return NextResponse.json(
				{ error: "playerCount must be between 2 and 10" },
				{ status: 400 }
			);
		}

		if (theme && (typeof theme !== "string" || theme.trim().length === 0)) {
			return NextResponse.json(
				{ error: "theme must be a non-empty string if provided" },
				{ status: 400 }
			);
		}

		const options: GenerateCardsOptions = {
			gameId: gameId.trim(),
			roundNumber,
			playerCount,
			theme: theme?.trim(),
		};

		// Generate cards
		const result = await generateCards(options);

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error || "Failed to generate cards" },
				{ status: 500 }
			);
		}

		return NextResponse.json(result);
	} catch (error) {
		console.error("Card generation API error:", error);

		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// Apply rate limiting to the POST handler
export const POST = withRateLimit(
	generateCardsHandler,
	RATE_LIMITS.CARD_GENERATION,
	(req) => {
		// Use game ID for rate limiting card generation
		const body = req.body;
		const gameId = body?.gameId || "unknown";

		// Record card generation event for abuse detection
		abuseDetector.recordEvent({
			type: "card_generation",
			timestamp: Date.now(),
			identifier: gameId,
			metadata: {
				playerCount: body?.playerCount,
				roundNumber: body?.roundNumber,
			},
		});

		return gameId;
	}
);

export async function GET() {
	return NextResponse.json(
		{ error: "Method not allowed. Use POST to generate cards." },
		{ status: 405 }
	);
}
