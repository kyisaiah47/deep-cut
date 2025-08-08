"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "./ui/badge";
import { Player } from "@/types/game";

interface ScoreDisplayProps {
	players: Player[];
	targetScore: number;
	highlightedPlayerId?: string;
	showRankings?: boolean;
	compact?: boolean;
	className?: string;
}

interface AnimatedScoreProps {
	currentScore: number;
	previousScore?: number;
	duration?: number;
}

function AnimatedScore({
	currentScore,
	previousScore,
	duration = 1000,
}: AnimatedScoreProps) {
	const [displayScore, setDisplayScore] = useState(
		previousScore || currentScore
	);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (previousScore !== undefined && previousScore !== currentScore) {
			setIsAnimating(true);

			// Animate the score change
			const startTime = Date.now();
			const startScore = previousScore;
			const scoreDiff = currentScore - startScore;

			const animateScore = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Use easing function for smooth animation
				const easeOutCubic = 1 - Math.pow(1 - progress, 3);
				const newScore = Math.round(startScore + scoreDiff * easeOutCubic);

				setDisplayScore(newScore);

				if (progress < 1) {
					requestAnimationFrame(animateScore);
				} else {
					setIsAnimating(false);
				}
			};

			requestAnimationFrame(animateScore);
		} else {
			setDisplayScore(currentScore);
		}
	}, [currentScore, previousScore, duration]);

	return (
		<motion.span
			className={`font-bold ${isAnimating ? "text-green-600" : ""}`}
			animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
			transition={{ duration: 0.3 }}
		>
			{displayScore}
		</motion.span>
	);
}

export function ScoreDisplay({
	players,
	targetScore,
	highlightedPlayerId,
	showRankings = true,
	compact = false,
	className = "",
}: ScoreDisplayProps) {
	const [previousScores, setPreviousScores] = useState<Record<string, number>>(
		{}
	);

	// Track score changes for animations
	useEffect(() => {
		const newScores: Record<string, number> = {};
		players.forEach((player) => {
			newScores[player.id] = player.score;
		});

		// Update previous scores after a delay to allow for animations
		const timer = setTimeout(() => {
			setPreviousScores(newScores);
		}, 1500);

		return () => clearTimeout(timer);
	}, [players]);

	// Sort players by score (descending) and then by name for ties
	const sortedPlayers = [...players].sort((a, b) => {
		if (b.score !== a.score) {
			return b.score - a.score;
		}
		return a.name.localeCompare(b.name);
	});

	// Get the highest score
	const highestScore = Math.max(...players.map((p) => p.score), 0);

	// Determine rank for each player
	const getPlayerRank = (player: Player): number => {
		return sortedPlayers.findIndex((p) => p.id === player.id) + 1;
	};

	// Check if player is winning
	const isWinning = (player: Player): boolean => {
		return player.score === highestScore && player.score > 0;
	};

	// Check if player has reached target score
	const hasReachedTarget = (player: Player): boolean => {
		return player.score >= targetScore;
	};

	if (compact) {
		return (
			<div className={`flex flex-wrap gap-2 ${className}`}>
				{sortedPlayers.map((player) => (
					<motion.div
						key={player.id}
						layout
						className={`
							flex items-center gap-2 px-3 py-1 rounded-full text-sm
							${
								highlightedPlayerId === player.id
									? "bg-purple-100 border-2 border-purple-300"
									: "bg-gray-100 border border-gray-200"
							}
							${isWinning(player) ? "ring-2 ring-yellow-400" : ""}
						`}
						whileHover={{ scale: 1.05 }}
					>
						<span className="font-medium">{player.name}</span>
						<AnimatedScore
							currentScore={player.score}
							previousScore={previousScores[player.id]}
						/>
						{hasReachedTarget(player) && (
							<motion.span
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								className="text-yellow-500"
							>
								🏆
							</motion.span>
						)}
					</motion.div>
				))}
			</div>
		);
	}

	return (
		<div className={`space-y-3 ${className}`}>
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900">
					{showRankings ? "Leaderboard" : "Scores"}
				</h3>
				<div className="text-sm text-gray-600">
					Target: {targetScore} points
				</div>
			</div>

			<div className="space-y-2">
				<AnimatePresence mode="popLayout">
					{sortedPlayers.map((player, index) => {
						const rank = getPlayerRank(player);
						const isHighlighted = highlightedPlayerId === player.id;
						const isPlayerWinning = isWinning(player);
						const reachedTarget = hasReachedTarget(player);

						return (
							<motion.div
								key={player.id}
								layout
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ delay: index * 0.1 }}
								className={`
									flex items-center justify-between p-3 rounded-lg border
									${
										isHighlighted
											? "bg-purple-50 border-purple-200 shadow-md"
											: "bg-white border-gray-200"
									}
									${isPlayerWinning ? "ring-2 ring-yellow-400" : ""}
								`}
								whileHover={{ scale: 1.02 }}
							>
								<div className="flex items-center gap-3">
									{/* Rank indicator */}
									{showRankings && (
										<motion.div
											className={`
												flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
												${
													rank === 1
														? "bg-yellow-100 text-yellow-800"
														: rank === 2
														? "bg-gray-100 text-gray-700"
														: rank === 3
														? "bg-orange-100 text-orange-700"
														: "bg-gray-50 text-gray-600"
												}
											`}
											whileHover={{ scale: 1.1 }}
										>
											{rank === 1
												? "🥇"
												: rank === 2
												? "🥈"
												: rank === 3
												? "🥉"
												: rank}
										</motion.div>
									)}

									{/* Player name */}
									<div className="flex flex-col">
										<span className="font-medium text-gray-900">
											{player.name}
										</span>
										{!player.is_connected && (
											<span className="text-xs text-red-500">Disconnected</span>
										)}
									</div>

									{/* Winner indicator */}
									{reachedTarget && (
										<motion.div
											initial={{ scale: 0, rotate: -180 }}
											animate={{ scale: 1, rotate: 0 }}
											transition={{ type: "spring", stiffness: 200 }}
										>
											<Badge
												variant="default"
												className="bg-yellow-500 text-white"
											>
												🏆 Winner
											</Badge>
										</motion.div>
									)}
								</div>

								<div className="flex items-center gap-3">
									{/* Progress bar */}
									<div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
										<motion.div
											className={`
												h-full rounded-full
												${
													reachedTarget
														? "bg-yellow-500"
														: isPlayerWinning
														? "bg-green-500"
														: "bg-blue-500"
												}
											`}
											initial={{ width: "0%" }}
											animate={{
												width: `${Math.min(
													(player.score / targetScore) * 100,
													100
												)}%`,
											}}
											transition={{ duration: 1, ease: "easeOut" }}
										/>
									</div>

									{/* Score display */}
									<div className="text-right">
										<div className="text-lg font-bold text-gray-900">
											<AnimatedScore
												currentScore={player.score}
												previousScore={previousScores[player.id]}
											/>
											<span className="text-sm text-gray-500 ml-1">
												/ {targetScore}
											</span>
										</div>
									</div>
								</div>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>

			{/* Game progress indicator */}
			<div className="mt-4 p-3 bg-gray-50 rounded-lg">
				<div className="flex items-center justify-between text-sm text-gray-600">
					<span>Game Progress</span>
					<span>
						{players.filter((p) => hasReachedTarget(p)).length} of{" "}
						{players.length} players reached target
					</span>
				</div>
				<div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
					<motion.div
						className="h-full bg-purple-500 rounded-full"
						initial={{ width: "0%" }}
						animate={{
							width: `${
								(players.filter((p) => hasReachedTarget(p)).length /
									players.length) *
								100
							}%`,
						}}
						transition={{ duration: 1, ease: "easeOut" }}
					/>
				</div>
			</div>
		</div>
	);
}
