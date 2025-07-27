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
		console.log(
			"🚀 Lobby: Mounting for groupCode:",
			groupCode,
			"and player:",
			playerName
		);

		const upsertPlayer = async () => {
			console.log(
				"👤 Lobby: Upserting player:",
				playerName,
				"to room:",
				groupCode
			);
			const { error, data } = await supabase
				.from("players")
				.upsert(
					{ name: playerName, room_code: groupCode },
					{ onConflict: "room_code,name" }
				);
			if (error) {
				console.error("❌ Lobby: Upsert error:", error.message);
			} else {
				console.log("✅ Lobby: Upserted player:", playerName, "result:", data);
			}
		};

		const fetchPlayers = async () => {
			console.log("📥 Lobby: Fetching players for room:", groupCode);
			const { data, error } = await supabase
				.from("players")
				.select("*")
				.eq("room_code", groupCode);

			if (data) {
				console.log("📥 Lobby: Fetched players data:", data);
				const playerNames = data.map((p) => p.name);
				console.log("👥 Lobby: Player names:", playerNames);
				setPlayers(playerNames);
			}
			if (error) {
				console.error("❌ Lobby: Fetch error:", error.message);
			}
		};

		const timeout = setTimeout(() => {
			console.log("⏰ Lobby: Running delayed fetchPlayers()");
			fetchPlayers();
		}, 500);

		console.log("🔗 Lobby: Setting up WebSocket subscription...");
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
					console.log("🔥 Lobby: INSERT event received:", payload);
					console.log("📡 Lobby: Full payload received:", payload);
					console.log("🔍 Lobby: Expected groupCode:", groupCode);
					console.log("📌 Lobby: Incoming room_code:", payload?.new?.room_code);
					console.log("👤 Lobby: Incoming player name:", payload?.new?.name);

					if (payload?.new?.room_code === groupCode) {
						console.log(
							"✅ Lobby: Payload matches group code, refetching players..."
						);
						fetchPlayers();
					} else {
						console.log(
							"❌ Lobby: Payload room_code mismatch or malformed:",
							payload?.new?.room_code,
							"expected:",
							groupCode
						);
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
					console.log("🗑️ Lobby: DELETE event received:", payload);
					console.log("📡 Lobby: Delete payload:", payload);
					console.log("🔍 Lobby: Expected groupCode:", groupCode);
					console.log(
						"📌 Lobby: Deleted from room_code:",
						payload?.old?.room_code
					);

					if (payload?.old?.room_code === groupCode) {
						console.log(
							"✅ Lobby: Delete matches group code, refetching players..."
						);
						fetchPlayers();
					} else {
						console.log(
							"❌ Lobby: Delete room_code mismatch:",
							payload?.old?.room_code,
							"expected:",
							groupCode
						);
					}
				}
			)
			.subscribe((status) => {
				console.log("🔗 Lobby: Channel subscription status:", status);
				if (status === "SUBSCRIBED") {
					console.log("✅ Lobby: Successfully subscribed to player changes");
				} else if (status === "CHANNEL_ERROR") {
					console.error("❌ Lobby: Channel subscription error");
				} else if (status === "CLOSED") {
					console.warn("⚠️ Lobby: Channel subscription closed");
				}
			});

		upsertPlayer();

		const removePlayer = async () => {
			console.log(
				"🗑️ Lobby: Removing player:",
				playerName,
				"from room:",
				groupCode
			);
			const { error } = await supabase
				.from("players")
				.delete()
				.eq("room_code", groupCode)
				.eq("name", playerName);
			if (error) {
				console.error("❌ Lobby: Error removing player:", error.message);
			} else {
				console.log("✅ Lobby: Successfully removed player:", playerName);
			}
		};

		console.log("🎯 Lobby: Adding beforeunload event listener");
		window.addEventListener("beforeunload", removePlayer);

		return () => {
			console.log("🧹 Lobby: Unmounting and cleaning up subscription");
			clearTimeout(timeout);
			supabase.removeChannel(subscribe);
			window.removeEventListener("beforeunload", removePlayer);
			removePlayer();
		};
	}, [groupCode, playerName]);

	useEffect(() => {
		console.log("Updated players list:", players);
	}, [players]);

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
