"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GameProvider } from "@/contexts/GameContext";
import { supabase } from "@/lib/supabase";

interface GamePageProps {
	params: Promise<{ roomCode: string }>;
}

export default function GamePage({ params }: GamePageProps) {
	const searchParams = useSearchParams();
	const [roomCode, setRoomCode] = useState<string>("");
	const [playerId, setPlayerId] = useState<string>("");
	const [gameId, setGameId] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		const resolveParams = async () => {
			const resolvedParams = await params;
			setRoomCode(resolvedParams.roomCode);
		};
		resolveParams();
	}, [params]);

	useEffect(() => {
		const playerIdFromUrl = searchParams.get("playerId");
		if (playerIdFromUrl) {
			setPlayerId(playerIdFromUrl);
		}
	}, [searchParams]);

	// Fetch game ID from room code
	useEffect(() => {
		const fetchGameId = async () => {
			if (!roomCode) return;

			try {
				const { data: game, error: gameError } = await supabase
					.from("games")
					.select("id")
					.eq("room_code", roomCode)
					.single();

				if (gameError || !game) {
					setError("Game not found");
					return;
				}

				setGameId(game.id);
			} catch (err) {
				console.error("Error fetching game:", err);
				setError("Failed to load game");
			} finally {
				setLoading(false);
			}
		};

		fetchGameId();
	}, [roomCode]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
				<div className="text-white text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
					<p>Loading game...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
				<div className="text-white text-center">
					<h1 className="text-2xl font-bold mb-4">Error</h1>
					<p className="text-red-400 mb-4">{error}</p>
					<a
						href="/lobby"
						className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
					>
						Back to Lobby
					</a>
				</div>
			</div>
		);
	}

	if (!gameId || !playerId) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
				<div className="text-white text-center">
					<h1 className="text-2xl font-bold mb-4">Invalid Game</h1>
					<p className="text-white/80 mb-4">
						Missing game or player information
					</p>
					<a
						href="/lobby"
						className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
					>
						Back to Lobby
					</a>
				</div>
			</div>
		);
	}

	return (
		<GameProvider
			gameId={gameId}
			playerId={playerId}
		>
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
				<div className="text-white text-center">
					<h1 className="text-4xl font-bold mb-4">Game Room: {roomCode}</h1>
					<p className="text-xl mb-2">Player ID: {playerId}</p>
					<p className="text-white/80">
						Game room functionality coming soon...
					</p>
				</div>
			</div>
		</GameProvider>
	);
}
