"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Lobby({
	groupCode,
	playerName,
	onReady,
}: {
	groupCode: string;
	playerName: string;
	onReady: (players: string[]) => void;
}) {
	const [players, setPlayers] = useState<string[]>([]);

	useEffect(() => {
		const upsertPlayer = async () => {
			const { error } = await supabase
				.from("players")
				.upsert(
					{ name: playerName, room_code: groupCode },
					{ onConflict: "room_code,name" }
				);
			if (error) {
				// Handle error silently
			}
		};

		const fetchPlayers = async () => {
			const { data, error } = await supabase
				.from("players")
				.select("*")
				.eq("room_code", groupCode);

			if (data) {
				const playerNames = data.map((p) => p.name);
				setPlayers(playerNames);
			}
			if (error) {
				// Handle error silently
			}
		};

		const timeout = setTimeout(() => {
			fetchPlayers();
		}, 500);

		const subscribe = supabase
			.channel("room-players")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "players",
				},
				(payload) => {
					if (payload?.new?.room_code === groupCode) {
						fetchPlayers();
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "players",
				},
				(payload) => {
					if (payload?.old?.room_code === groupCode) {
						fetchPlayers();
					}
				}
			)
			.subscribe();

		upsertPlayer();

		const removePlayer = async () => {
			const { error } = await supabase
				.from("players")
				.delete()
				.eq("room_code", groupCode)
				.eq("name", playerName);
			if (error) {
				// Handle error silently
			}
		};

		window.addEventListener("beforeunload", removePlayer);

		return () => {
			clearTimeout(timeout);
			supabase.removeChannel(subscribe);
			window.removeEventListener("beforeunload", removePlayer);
			removePlayer();
		};
	}, [groupCode, playerName]);

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800 max-w-md w-full"
			>
				<h2 className="text-2xl font-semibold mb-2">Waiting Room</h2>
				<p className="text-zinc-400 text-sm mb-4">
					Group Code:{" "}
					<span className="text-yellow-300 font-mono">{groupCode}</span>
				</p>

				<div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 border border-zinc-700 rounded-md p-2 mb-6">
					<ul className="text-zinc-200 space-y-1 text-left">
						{players.map((p, i) => (
							<li key={i}>👤 {p}</li>
						))}
					</ul>
				</div>

				<Button
					onClick={() => onReady(players)}
					disabled={players.length < 2}
					className="w-full"
				>
					Start Game
				</Button>
			</motion.div>
		</main>
	);
}
