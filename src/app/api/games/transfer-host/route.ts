import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface TransferHostRequest {
	gameId: string;
	currentHostId: string;
	newHostId: string;
}

export async function PUT(request: NextRequest) {
	try {
		const body: TransferHostRequest = await request.json();

		if (!body.gameId || !body.currentHostId || !body.newHostId) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Get current game state
		const { data: gameData, error: gameError } = await supabase
			.from("games")
			.select("*")
			.eq("id", body.gameId)
			.single();

		if (gameError || !gameData) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Verify current user is the host
		if (gameData.host_id !== body.currentHostId) {
			return NextResponse.json(
				{ error: "Only the current host can transfer host privileges" },
				{ status: 403 }
			);
		}

		// Verify new host is a valid player in the game
		const { data: newHostPlayer, error: playerError } = await supabase
			.from("players")
			.select("*")
			.eq("id", body.newHostId)
			.eq("game_id", body.gameId)
			.single();

		if (playerError || !newHostPlayer) {
			return NextResponse.json(
				{ error: "New host must be a player in the game" },
				{ status: 400 }
			);
		}

		// Verify new host is connected
		if (!newHostPlayer.is_connected) {
			return NextResponse.json(
				{ error: "New host must be connected" },
				{ status: 400 }
			);
		}

		// Transfer host privileges
		const { data: updatedGame, error: updateError } = await supabase
			.from("games")
			.update({
				host_id: body.newHostId,
				updated_at: new Date().toISOString(),
			})
			.eq("id", body.gameId)
			.select()
			.single();

		if (updateError) {
			return NextResponse.json(
				{ error: "Failed to transfer host privileges" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			game: updatedGame,
			newHost: newHostPlayer,
		});
	} catch (error) {
		console.error("Host transfer error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
