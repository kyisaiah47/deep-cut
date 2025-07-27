"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import FloatingBackground from "./FloatingBackground";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tips = [
	"Kiro knows when you're lying.",
	"Someone in this room will betray you.",
	"Only the worthy can press Start.",
];

const icons = ["😈", "👻", "🤡", "😎", "🧠", "🎩"];

export default function Lobby({
	groupCode,
	playerName,
	selectedTheme,
	onReady,
}: {
	groupCode: string;
	playerName: string;
	selectedTheme?: string;
	onReady: (players: string[]) => void;
}) {
	const [players, setPlayers] = useState<string[]>([]);
	const [tip, setTip] = useState<string>("");
	const [copied, setCopied] = useState(false);
	const [theme, setTheme] = useState<string>(selectedTheme || "");

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(groupCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Copy failed silently
		}
	};

	useEffect(() => {
		setTip(tips[Math.floor(Math.random() * tips.length)]);
		const interval = setInterval(() => {
			setTip(tips[Math.floor(Math.random() * tips.length)]);
		}, 7000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		// Update theme when selectedTheme prop changes
		if (selectedTheme && selectedTheme !== theme) {
			setTheme(selectedTheme);
		}
	}, [selectedTheme, theme]);

	useEffect(() => {
		// Fetch room theme from database
		const fetchRoomTheme = async () => {
			const { data } = await supabase
				.from("rooms")
				.select("theme")
				.eq("code", groupCode)
				.maybeSingle();

			if (data?.theme && data.theme !== theme) {
				setTheme(data.theme);
			}
		};

		fetchRoomTheme();
	}, [groupCode, theme]);

	useEffect(() => {
		const upsertPlayer = async () => {
			await supabase
				.from("players")
				.upsert(
					{ name: playerName, room_code: groupCode },
					{ onConflict: "room_code,name" }
				);
		};

		const fetchPlayers = async () => {
			const { data } = await supabase
				.from("players")
				.select("*")
				.eq("room_code", groupCode);

			if (data) {
				const playerNames = data.map((p) => p.name);
				setPlayers(playerNames);
			}
		};

		const timeout = setTimeout(() => {
			fetchPlayers();
		}, 500);

		const subscribe = supabase
			.channel(`room-players-${groupCode}`)
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "players" },
				(payload) => {
					if (payload?.new?.room_code === groupCode) {
						fetchPlayers();
					}
				}
			)
			.on(
				"postgres_changes",
				{ event: "DELETE", schema: "public", table: "players" },
				(payload) => {
					if (payload?.old?.room_code === groupCode) {
						fetchPlayers();
					}
				}
			)
			.on(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "players" },
				(payload) => {
					if (
						payload?.new?.room_code === groupCode ||
						payload?.old?.room_code === groupCode
					) {
						fetchPlayers();
					}
				}
			)
			.subscribe();

		upsertPlayer();

		const removePlayer = async () => {
			await supabase
				.from("players")
				.delete()
				.eq("room_code", groupCode)
				.eq("name", playerName);
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
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			<FloatingBackground />

			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800/90 backdrop-blur-md max-w-md w-full border border-zinc-700 relative z-10"
			>
				<h2 className="text-2xl font-semibold mb-2 drop-shadow animate-pulse">
					Waiting Room
				</h2>
				<p className="text-zinc-400 text-sm mb-4">
					Group Code:{" "}
					<button
						onClick={handleCopyCode}
						className="text-pink-500 font-mono cursor-pointer hover:text-pink-200 hover:bg-zinc-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500 px-2 py-1 rounded transition-all duration-200 relative"
						title="Click to copy"
					>
						{groupCode}
						{copied && (
							<span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-green-400 bg-zinc-800 px-2 py-1 rounded">
								Copied!
							</span>
						)}
					</button>
				</p>

				{/* Theme Display */}
				<div className="mb-4 p-3 bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30 rounded-lg">
					<div className="flex items-center gap-2 mb-1">
						<span className="text-pink-400 text-lg">🎭</span>
						<span className="text-sm font-medium text-pink-300">
							Current Theme
						</span>
					</div>
					<p className="text-white font-semibold">
						{theme || (
							<span className="text-zinc-400 italic">Loading theme...</span>
						)}
					</p>
				</div>

				<div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 border border-zinc-700 rounded-md p-2 mb-4">
					<div className="flex justify-between items-center mb-2 px-1">
						<span className="text-xs text-zinc-400">
							Players ({players.length})
						</span>
						{players.length < 3 && (
							<span className="text-xs text-yellow-400 animate-pulse">
								Need 3+ to start
							</span>
						)}
					</div>
					<ul className="text-zinc-200 space-y-1 text-left">
						{players.map((p, i) => (
							<motion.li
								key={`${p}-${i}`}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2, delay: i * 0.05 }}
								className="flex items-center gap-2 p-1 rounded hover:bg-zinc-700/30 transition-colors"
							>
								<span className="text-lg">{icons[i % icons.length]}</span>
								<span
									className={
										p === playerName ? "text-pink-400 font-medium" : ""
									}
								>
									{p}
								</span>
								{p === playerName && (
									<span className="text-xs text-pink-500">(you)</span>
								)}
							</motion.li>
						))}
						{players.length === 0 && (
							<li className="text-center text-zinc-500 py-4">
								Waiting for players to join...
							</li>
						)}
					</ul>
				</div>

				{players.length < 3 ? (
					<div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
						<p className="text-sm text-yellow-200 flex items-center gap-2">
							<span className="text-lg">⚠️</span>
							<span>Need at least 3 players to start the game</span>
						</p>
						<p className="text-xs text-yellow-400 mt-1">
							Share the room code with friends to get started!
						</p>
					</div>
				) : (
					<div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
						<p className="text-sm text-green-200 flex items-center gap-2">
							<span className="text-lg">✅</span>
							<span>Ready to start! Everyone&apos;s here</span>
						</p>
					</div>
				)}

				<p className="text-sm italic text-zinc-500 mb-4">{tip}</p>

				<Button
					onClick={() => onReady(players)}
					disabled={players.length < 3}
					className={
						"w-full py-3 text-base font-medium transition-all duration-300 ease-in-out " +
						(players.length >= 3
							? "text-white bg-red-900 border border-red-700 rounded-lg hover:bg-zinc-900 hover:text-red-200 shadow-[0_0_20px_rgba(185,28,28,0.7)] hover:shadow-[inset_0_0_0_1px_#991b1b,0_0_10px_rgba(185,28,28,0.5)] shadow-lg shadow-pink-400/40"
							: "text-zinc-500 bg-zinc-800 border border-zinc-600 rounded-lg cursor-not-allowed opacity-50")
					}
				>
					{players.length < 3
						? `Need ${3 - players.length} more player${
								3 - players.length === 1 ? "" : "s"
						  }`
						: "Start Game"}
				</Button>
			</motion.div>
		</main>
	);
}
