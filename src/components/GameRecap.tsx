"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface GameRecapProps {
	gameData: {
		theme: string;
		players: string[];
		rounds: number;
		totalVotes: number;
		champion: string;
		funniest: string;
		mostControversial: string;
		insights: string[];
		duration: number; // in minutes
	};
	onClose: () => void;
}

export default function GameRecap({ gameData, onClose }: GameRecapProps) {
	const [activeTab, setActiveTab] = useState<"summary" | "stats" | "share">(
		"summary"
	);

	const generateShareText = () => {
		return (
			`🎭 Just played Deep Cut: ${gameData.theme}!\n\n` +
			`👑 Champion: ${gameData.champion}\n` +
			`😂 Funniest: ${gameData.funniest}\n` +
			`🔥 Most Controversial: ${gameData.mostControversial}\n\n` +
			`${gameData.rounds} rounds of pure chaos with ${gameData.players.length} players!\n\n` +
			`Play at: [your-domain].com`
		);
	};

	const handleShare = async () => {
		const shareData = {
			title: `Deep Cut: ${gameData.theme}`,
			text: generateShareText(),
			url: window.location.origin,
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch {
				// Fallback to clipboard
				navigator.clipboard.writeText(generateShareText());
			}
		} else {
			navigator.clipboard.writeText(generateShareText());
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
		>
			<motion.div
				initial={{ y: 20 }}
				animate={{ y: 0 }}
				className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
			>
				{/* Header */}
				<div className="text-center mb-6">
					<h2 className="text-3xl font-bold text-pink-500 mb-2">
						Game Complete!
					</h2>
					<p className="text-zinc-400">Theme: {gameData.theme}</p>
				</div>

				{/* Tabs */}
				<div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
					{(["summary", "stats", "share"] as const).map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`flex-1 py-2 px-4 rounded-md capitalize transition-colors ${
								activeTab === tab
									? "bg-pink-600 text-white"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							{tab}
						</button>
					))}
				</div>

				{/* Content */}
				{activeTab === "summary" && (
					<div className="space-y-6">
						{/* Champions */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
								<div className="text-2xl mb-2">👑</div>
								<div className="text-sm text-zinc-400">Champion</div>
								<div className="font-semibold text-yellow-400">
									{gameData.champion}
								</div>
							</div>
							<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
								<div className="text-2xl mb-2">😂</div>
								<div className="text-sm text-zinc-400">Funniest</div>
								<div className="font-semibold text-pink-400">
									{gameData.funniest}
								</div>
							</div>
							<div className="bg-zinc-800/50 rounded-lg p-4 text-center">
								<div className="text-2xl mb-2">🔥</div>
								<div className="text-sm text-zinc-400">Most Controversial</div>
								<div className="font-semibold text-red-400">
									{gameData.mostControversial}
								</div>
							</div>
						</div>

						{/* Key Insights */}
						<div>
							<h3 className="text-lg font-semibold mb-3 text-pink-400">
								Kiro&apos;s Final Insights
							</h3>
							<div className="space-y-2">
								{gameData.insights.map((insight, i) => (
									<motion.div
										key={i}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: i * 0.1 }}
										className="bg-red-900/20 border border-red-500/30 rounded-lg p-3"
									>
										<p className="text-red-200 text-sm italic">
											&ldquo;{insight}&rdquo;
										</p>
									</motion.div>
								))}
							</div>
						</div>
					</div>
				)}

				{activeTab === "stats" && (
					<div className="space-y-6">
						{/* Game Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="text-center">
								<div className="text-2xl font-bold text-pink-500">
									{gameData.rounds}
								</div>
								<div className="text-sm text-zinc-400">Rounds</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-500">
									{gameData.players.length}
								</div>
								<div className="text-sm text-zinc-400">Players</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-yellow-500">
									{gameData.totalVotes}
								</div>
								<div className="text-sm text-zinc-400">Total Votes</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-500">
									{gameData.duration}m
								</div>
								<div className="text-sm text-zinc-400">Duration</div>
							</div>
						</div>

						{/* Player List */}
						<div>
							<h3 className="text-lg font-semibold mb-3 text-pink-400">
								Players
							</h3>
							<div className="space-y-2">
								{gameData.players.map((player, i) => (
									<div
										key={i}
										className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
									>
										<span className="text-white">{player}</span>
										<div className="text-sm text-zinc-400">
											{player === gameData.champion && "👑 Champion"}
											{player === gameData.funniest && "😂 Funniest"}
											{player === gameData.mostControversial &&
												"🔥 Controversial"}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{activeTab === "share" && (
					<div className="space-y-6">
						{/* Share Preview */}
						<div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-600">
							<div className="text-sm text-zinc-400 mb-2">Share Preview:</div>
							<div className="text-white whitespace-pre-line text-sm">
								{generateShareText()}
							</div>
						</div>

						{/* Share Options */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Button
								onClick={handleShare}
								className="bg-pink-600 hover:bg-pink-700"
							>
								📱 Share
							</Button>
							<Button
								onClick={() =>
									navigator.clipboard.writeText(generateShareText())
								}
								variant="outline"
							>
								📋 Copy Text
							</Button>
							<Button
								onClick={() =>
									navigator.clipboard.writeText(window.location.origin)
								}
								variant="outline"
							>
								🔗 Copy Link
							</Button>
						</div>
					</div>
				)}

				{/* Close Button */}
				<div className="mt-8 text-center">
					<Button
						onClick={onClose}
						variant="outline"
						className="px-8"
					>
						Close
					</Button>
				</div>
			</motion.div>
		</motion.div>
	);
}
