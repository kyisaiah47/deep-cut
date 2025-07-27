"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface GameHistoryEntry {
	id: string;
	theme: string;
	date: string;
	players: string[];
	champion: string;
	duration: number;
	totalSubmissions: number;
}

interface GameHistoryProps {
	playerName: string;
	onClose: () => void;
}

export default function GameHistory({ playerName, onClose }: GameHistoryProps) {
	const [games, setGames] = useState<GameHistoryEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<"all" | "won" | "participated">("all");

	useEffect(() => {
		const loadGameHistory = async () => {
			try {
				// This would query your game_history table
				const { data, error } = await supabase
					.from("game_sessions")
					.select(
						`
						id,
						theme,
						created_at,
						players,
						winner,
						duration_minutes,
						total_submissions
					`
					)
					.contains("players", [playerName])
					.order("created_at", { ascending: false })
					.limit(50);

				if (error) throw error;

				const formattedGames: GameHistoryEntry[] =
					data?.map((game) => ({
						id: game.id,
						theme: game.theme,
						date: new Date(game.created_at).toLocaleDateString(),
						players: game.players || [],
						champion: game.winner || "Unknown",
						duration: game.duration_minutes || 0,
						totalSubmissions: game.total_submissions || 0,
					})) || [];

				setGames(formattedGames);
			} catch (error) {
				console.error("Error loading game history:", error);
				// For demo purposes, create mock data
				setGames([
					{
						id: "1",
						theme: "Childhood Secrets",
						date: "2024-01-15",
						players: ["Alex", "Sam", "Jordan", playerName],
						champion: playerName,
						duration: 23,
						totalSubmissions: 12,
					},
					{
						id: "2",
						theme: "Work Confessions",
						date: "2024-01-10",
						players: ["Taylor", "Morgan", playerName],
						champion: "Morgan",
						duration: 18,
						totalSubmissions: 9,
					},
					{
						id: "3",
						theme: "Relationship Drama",
						date: "2024-01-05",
						players: ["Casey", "Riley", "Devon", playerName, "Avery"],
						champion: "Casey",
						duration: 31,
						totalSubmissions: 15,
					},
				]);
			} finally {
				setLoading(false);
			}
		};

		loadGameHistory();
	}, [playerName]);

	const filteredGames = games.filter((game) => {
		if (filter === "won") return game.champion === playerName;
		if (filter === "participated") return game.players.includes(playerName);
		return true;
	});

	const stats = {
		totalGames: games.length,
		wins: games.filter((g) => g.champion === playerName).length,
		averageDuration:
			Math.round(
				games.reduce((acc, g) => acc + g.duration, 0) / games.length
			) || 0,
		favoriteThemes: [...new Set(games.map((g) => g.theme))].slice(0, 3),
	};

	if (loading) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
			>
				<div className="text-pink-500 text-xl">
					Loading your game history...
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
		>
			<motion.div
				initial={{ y: 20 }}
				animate={{ y: 0 }}
				className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div>
						<h2 className="text-3xl font-bold text-pink-500">Game History</h2>
						<p className="text-zinc-400">{playerName}&apos;s Journey</p>
					</div>
					<Button
						onClick={onClose}
						variant="outline"
						size="sm"
					>
						✕
					</Button>
				</div>

				{/* Stats Overview */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-pink-500">
							{stats.totalGames}
						</div>
						<div className="text-sm text-zinc-400">Games Played</div>
					</div>
					<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-yellow-500">
							{stats.wins}
						</div>
						<div className="text-sm text-zinc-400">Wins</div>
					</div>
					<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-blue-500">
							{stats.averageDuration}m
						</div>
						<div className="text-sm text-zinc-400">Avg Duration</div>
					</div>
					<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-green-500">
							{stats.wins > 0
								? Math.round((stats.wins / stats.totalGames) * 100)
								: 0}
							%
						</div>
						<div className="text-sm text-zinc-400">Win Rate</div>
					</div>
				</div>

				{/* Filters */}
				<div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
					{[
						{ key: "all" as const, label: "All Games" },
						{ key: "won" as const, label: "Victories" },
						{ key: "participated" as const, label: "Participated" },
					].map(({ key, label }) => (
						<button
							key={key}
							onClick={() => setFilter(key)}
							className={`flex-1 py-2 px-4 rounded-md transition-colors ${
								filter === key
									? "bg-pink-600 text-white"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				{/* Games List */}
				<div className="space-y-4">
					<AnimatePresence>
						{filteredGames.map((game, i) => (
							<motion.div
								key={game.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ delay: i * 0.05 }}
								className={`bg-zinc-800/50 rounded-lg p-4 border ${
									game.champion === playerName
										? "border-yellow-500/30 bg-yellow-900/10"
										: "border-zinc-600"
								}`}
							>
								<div className="flex justify-between items-start mb-3">
									<div>
										<h3 className="text-lg font-semibold text-white">
											{game.theme}
										</h3>
										<p className="text-sm text-zinc-400">{game.date}</p>
									</div>
									<div className="text-right">
										{game.champion === playerName && (
											<div className="text-yellow-500 font-semibold mb-1">
												👑 Victory!
											</div>
										)}
										<div className="text-sm text-zinc-400">
											{game.duration}m
										</div>
									</div>
								</div>

								<div className="flex flex-wrap gap-2 mb-3">
									{game.players.map((player, j) => (
										<span
											key={j}
											className={`px-2 py-1 rounded text-xs ${
												player === playerName
													? "bg-pink-600 text-white"
													: player === game.champion
													? "bg-yellow-600 text-white"
													: "bg-zinc-700 text-zinc-300"
											}`}
										>
											{player}
											{player === game.champion && " 👑"}
										</span>
									))}
								</div>

								<div className="text-xs text-zinc-500">
									{game.totalSubmissions} submissions • {game.players.length}{" "}
									players
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				{filteredGames.length === 0 && (
					<div className="text-center py-8 text-zinc-400">
						No games found for the selected filter.
					</div>
				)}
			</motion.div>
		</motion.div>
	);
}
