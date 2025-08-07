import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	try {
		const { playerId, gameId, connected } = await request.json();

		if (!playerId || !gameId) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Update player connection status
		const { error } = await supabase
			.from("players")
			.update({
				is_connected: connected,
			})
			.eq("id", playerId)
			.eq("game_id", gameId);

		if (error) {
			console.error("Failed to update player connection:", error);
			return NextResponse.json(
				{ error: "Failed to update connection status" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Player disconnect API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
