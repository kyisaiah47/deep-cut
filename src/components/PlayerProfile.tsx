"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	rarity: "common" | "rare" | "epic" | "legendary";
	unlockedAt?: string;
}

interface PlayerStats {
	gamesPlayed: number;
	wins: number;
	totalSubmissions: number;
	averageVotes: number;
	favoriteThemes: string[];
	playTime: number; // in minutes
	firstGame: string;
	lastGame: string;
	winStreak: number;
	bestWinStreak: number;
}

interface PlayerProfileProps {
	isOpen: boolean;
	onClose: () => void;
	playerName: string;
}

export default function PlayerProfile({
	isOpen,
	onClose,
	playerName,
}: PlayerProfileProps) {
	const [activeTab, setActiveTab] = useState<
		"stats" | "achievements" | "settings"
	>("stats");
	const [stats, setStats] = useState<PlayerStats>({
		gamesPlayed: 0,
		wins: 0,
		totalSubmissions: 0,
		averageVotes: 0,
		favoriteThemes: [],
		playTime: 0,
		firstGame: "",
		lastGame: "",
		winStreak: 0,
		bestWinStreak: 0,
	});
	const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(
		new Set()
	);

	const allAchievements: Achievement[] = [
		{
			id: "first_game",
			name: "First Steps",
			description: "Play your first game of Deep Cut",
			icon: "🎭",
			rarity: "common",
		},
		{
			id: "first_win",
			name: "Taste of Victory",
			description: "Win your first game",
			icon: "👑",
			rarity: "common",
		},
		{
			id: "confession_master",
			name: "Confession Master",
			description: "Submit 50 confessions",
			icon: "🗣️",
			rarity: "rare",
		},
		{
			id: "win_streak_3",
			name: "Hot Streak",
			description: "Win 3 games in a row",
			icon: "🔥",
			rarity: "rare",
		},
		{
			id: "vote_magnet",
			name: "Vote Magnet",
			description: "Get 100 total votes on your submissions",
			icon: "🧲",
			rarity: "epic",
		},
		{
			id: "theme_explorer",
			name: "Theme Explorer",
			description: "Play games with 10 different themes",
			icon: "🗺️",
			rarity: "epic",
		},
		{
			id: "marathon_player",
			name: "Marathon Player",
			description: "Play for 10+ hours total",
			icon: "⏰",
			rarity: "epic",
		},
		{
			id: "legendary_winner",
			name: "Legendary Winner",
			description: "Win 25 games",
			icon: "🏆",
			rarity: "legendary",
		},
		{
			id: "kiro_favorite",
			name: "Kiro's Favorite",
			description: "Have Kiro mention you 50 times",
			icon: "👁️",
			rarity: "legendary",
		},
		{
			id: "confession_lord",
			name: "Confession Lord",
			description: "Submit 200 confessions",
			icon: "📜",
			rarity: "legendary",
		},
	];

	useEffect(() => {
		const loadPlayerData = () => {
			// Load from localStorage for demo
			const savedStats = localStorage.getItem(`deep-cut-stats-${playerName}`);
			const savedAchievements = localStorage.getItem(
				`deep-cut-achievements-${playerName}`
			);

			if (savedStats) {
				setStats(JSON.parse(savedStats));
			} else {
				// Generate some demo stats
				const demoStats: PlayerStats = {
					gamesPlayed: Math.floor(Math.random() * 20) + 5,
					wins: Math.floor(Math.random() * 8) + 2,
					totalSubmissions: Math.floor(Math.random() * 50) + 15,
					averageVotes: Math.random() * 3 + 1,
					favoriteThemes: [
						"Childhood Secrets",
						"Work Confessions",
						"Digital Shame",
					],
					playTime: Math.floor(Math.random() * 300) + 60,
					firstGame: "2024-01-01",
					lastGame: new Date().toLocaleDateString(),
					winStreak: Math.floor(Math.random() * 3),
					bestWinStreak: Math.floor(Math.random() * 5) + 1,
				};
				setStats(demoStats);
				localStorage.setItem(
					`deep-cut-stats-${playerName}`,
					JSON.stringify(demoStats)
				);
			}

			if (savedAchievements) {
				const unlocked = new Set<string>(JSON.parse(savedAchievements));
				setUnlockedAchievements(unlocked);
			} else {
				// Unlock some demo achievements
				const demoUnlocked = new Set(["first_game", "first_win"]);
				setUnlockedAchievements(demoUnlocked);
				localStorage.setItem(
					`deep-cut-achievements-${playerName}`,
					JSON.stringify([...demoUnlocked])
				);
			}
		};

		if (isOpen) {
			loadPlayerData();
		}
	}, [isOpen, playerName]);

	const getRarityColor = (rarity: Achievement["rarity"]) => {
		switch (rarity) {
			case "common":
				return "text-gray-400 border-gray-600";
			case "rare":
				return "text-blue-400 border-blue-600";
			case "epic":
				return "text-purple-400 border-purple-600";
			case "legendary":
				return "text-yellow-400 border-yellow-600";
		}
	};

	const getRarityGlow = (rarity: Achievement["rarity"]) => {
		switch (rarity) {
			case "common":
				return "shadow-gray-500/20";
			case "rare":
				return "shadow-blue-500/20";
			case "epic":
				return "shadow-purple-500/20";
			case "legendary":
				return "shadow-yellow-500/20";
		}
	};

	const winRate =
		stats.gamesPlayed > 0
			? ((stats.wins / stats.gamesPlayed) * 100).toFixed(1)
			: "0";
	const averageGameTime =
		stats.gamesPlayed > 0 ? Math.round(stats.playTime / stats.gamesPlayed) : 0;

	if (!isOpen) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
		>
			<motion.div
				initial={{ scale: 0.9, y: 20 }}
				animate={{ scale: 1, y: 0 }}
				exit={{ scale: 0.9, y: 20 }}
				className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 rounded-2xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
							{playerName.charAt(0).toUpperCase()}
						</div>
						<div>
							<h2 className="text-3xl font-bold text-white">{playerName}</h2>
							<p className="text-zinc-400">Deep Cut Player Profile</p>
						</div>
					</div>
					<Button
						onClick={onClose}
						variant="outline"
						size="sm"
					>
						✕
					</Button>
				</div>

				{/* Tabs */}
				<div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
					{[
						{ key: "stats" as const, label: "Statistics", icon: "📊" },
						{ key: "achievements" as const, label: "Achievements", icon: "🏆" },
						{ key: "settings" as const, label: "Settings", icon: "⚙️" },
					].map(({ key, label, icon }) => (
						<button
							key={key}
							onClick={() => setActiveTab(key)}
							className={`flex-1 py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
								activeTab === key
									? "bg-pink-600 text-white"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							<span>{icon}</span>
							<span className="hidden sm:inline">{label}</span>
						</button>
					))}
				</div>

				{/* Content */}
				<AnimatePresence mode="wait">
					{activeTab === "stats" && (
						<motion.div
							key="stats"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-6"
						>
							{/* Key Stats */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
									<div className="text-3xl font-bold text-pink-500">
										{stats.gamesPlayed}
									</div>
									<div className="text-sm text-zinc-400">Games Played</div>
								</div>
								<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
									<div className="text-3xl font-bold text-yellow-500">
										{stats.wins}
									</div>
									<div className="text-sm text-zinc-400">Wins</div>
								</div>
								<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
									<div className="text-3xl font-bold text-blue-500">
										{winRate}%
									</div>
									<div className="text-sm text-zinc-400">Win Rate</div>
								</div>
								<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
									<div className="text-3xl font-bold text-green-500">
										{stats.totalSubmissions}
									</div>
									<div className="text-sm text-zinc-400">Submissions</div>
								</div>
							</div>

							{/* Detailed Stats */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<h3 className="text-lg font-semibold text-pink-400">
										Performance
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-zinc-400">
												Average Votes per Submission
											</span>
											<span className="text-white">
												{stats.averageVotes.toFixed(1)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Current Win Streak</span>
											<span className="text-white">{stats.winStreak}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Best Win Streak</span>
											<span className="text-white">{stats.bestWinStreak}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Average Game Time</span>
											<span className="text-white">{averageGameTime}m</span>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-semibold text-pink-400">
										Activity
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-zinc-400">Total Play Time</span>
											<span className="text-white">
												{Math.floor(stats.playTime / 60)}h {stats.playTime % 60}
												m
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">First Game</span>
											<span className="text-white">{stats.firstGame}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-zinc-400">Last Game</span>
											<span className="text-white">{stats.lastGame}</span>
										</div>
									</div>
								</div>
							</div>

							{/* Favorite Themes */}
							<div>
								<h3 className="text-lg font-semibold text-pink-400 mb-4">
									Favorite Themes
								</h3>
								<div className="flex flex-wrap gap-2">
									{stats.favoriteThemes.map((theme, i) => (
										<span
											key={i}
											className="px-3 py-1 bg-pink-900/30 border border-pink-500/30 rounded-full text-pink-300 text-sm"
										>
											{theme}
										</span>
									))}
								</div>
							</div>
						</motion.div>
					)}

					{activeTab === "achievements" && (
						<motion.div
							key="achievements"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-6"
						>
							{/* Achievement Progress */}
							<div className="bg-zinc-800/30 rounded-lg p-4">
								<div className="flex justify-between items-center mb-2">
									<span className="text-zinc-400">Achievement Progress</span>
									<span className="text-white">
										{unlockedAchievements.size}/{allAchievements.length}
									</span>
								</div>
								<div className="w-full bg-zinc-700 rounded-full h-2">
									<div
										className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
										style={{
											width: `${
												(unlockedAchievements.size / allAchievements.length) *
												100
											}%`,
										}}
									/>
								</div>
							</div>

							{/* Achievements Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{allAchievements.map((achievement, i) => {
									const isUnlocked = unlockedAchievements.has(achievement.id);

									return (
										<motion.div
											key={achievement.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: i * 0.05 }}
											className={`rounded-lg p-4 border-2 transition-all ${
												isUnlocked
													? `${getRarityColor(
															achievement.rarity
													  )} bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 shadow-lg ${getRarityGlow(
															achievement.rarity
													  )}`
													: "border-zinc-700 bg-zinc-800/30 opacity-60"
											}`}
										>
											<div className="flex items-center gap-3 mb-2">
												<div
													className={`text-2xl ${
														isUnlocked ? "" : "grayscale"
													}`}
												>
													{achievement.icon}
												</div>
												<div>
													<h3
														className={`font-semibold ${
															isUnlocked ? "text-white" : "text-zinc-500"
														}`}
													>
														{achievement.name}
													</h3>
													<div
														className={`text-xs capitalize ${
															getRarityColor(achievement.rarity).split(" ")[0]
														}`}
													>
														{achievement.rarity}
													</div>
												</div>
											</div>
											<p
												className={`text-sm ${
													isUnlocked ? "text-zinc-300" : "text-zinc-600"
												}`}
											>
												{achievement.description}
											</p>
											{isUnlocked && achievement.unlockedAt && (
												<div className="text-xs text-zinc-500 mt-2">
													Unlocked: {achievement.unlockedAt}
												</div>
											)}
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					)}

					{activeTab === "settings" && (
						<motion.div
							key="settings"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="space-y-6"
						>
							<div className="text-center py-12">
								<div className="text-6xl mb-4">⚙️</div>
								<h3 className="text-xl font-semibold text-zinc-400 mb-2">
									Player Settings
								</h3>
								<p className="text-zinc-500 mb-6">
									Customize your Deep Cut experience
								</p>

								<div className="space-y-4 max-w-md mx-auto">
									<Button
										variant="outline"
										className="w-full"
										onClick={() => {
											localStorage.removeItem(`deep-cut-stats-${playerName}`);
											localStorage.removeItem(
												`deep-cut-achievements-${playerName}`
											);
											alert("Player data reset successfully!");
											window.location.reload();
										}}
									>
										🗑️ Reset All Data
									</Button>

									<Button
										variant="outline"
										className="w-full"
										onClick={() => {
											const data = {
												stats: localStorage.getItem(
													`deep-cut-stats-${playerName}`
												),
												achievements: localStorage.getItem(
													`deep-cut-achievements-${playerName}`
												),
											};
											navigator.clipboard.writeText(JSON.stringify(data));
											alert("Player data copied to clipboard!");
										}}
									>
										📋 Export Data
									</Button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	);
}
