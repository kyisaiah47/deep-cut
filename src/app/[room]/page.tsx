"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import PlayerForm from "@/components/PlayerForm";
import Lobby from "@/components/Lobby";
import GameRoom from "@/components/GameRoom";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RoomPage({ params }: { params: { room: string } }) {
	const groupCode = params.room.toUpperCase();
	const [phase, setPhase] = useState<
		"loading" | "error" | "name" | "lobby" | "game"
	>("loading");
	const [playerName, setPlayerName] = useState("");
	const [players, setPlayers] = useState<string[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		const verifyRoom = async () => {
			const { data, error } = await supabase
				.from("rooms")
				.select("code")
				.eq("code", groupCode)
				.maybeSingle();

			if (error || !data) {
				setError("Room not found.");
				setPhase("error");
			} else {
				const savedName = localStorage.getItem("playerName");
				if (savedName) {
					setPlayerName(savedName);
					setPhase("lobby"); // ✅ Skip name input
				} else {
					setPhase("name");
				}
			}
		};

		verifyRoom();
	}, [groupCode]);

	if (phase === "loading") {
		return (
			<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
				<p>Loading...</p>
			</main>
		);
	}

	if (phase === "error") {
		return (
			<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
				<p>{error}</p>
			</main>
		);
	}

	if (phase === "name") {
		return (
			<PlayerForm
				onSubmit={(name) => {
					setPlayerName(name);
					localStorage.setItem("playerName", name); // ✅ Save to localStorage
					setPhase("lobby");
				}}
			/>
		);
	}

	if (phase === "lobby" && playerName) {
		return (
			<Lobby
				groupCode={groupCode}
				playerName={playerName}
				onReady={(players) => {
					setPlayers(players);
					setPhase("game");
				}}
			/>
		);
	}

	if (phase === "game" && playerName) {
		return (
			<GameRoom
				groupCode={groupCode}
				playerName={playerName}
				players={players}
			/>
		);
	}

	return null;
}
