import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreDisplayProps {
	score: number;
	previousScore?: number;
	playerName: string;
	isCurrentPlayer?: boolean;
	rank?: number;
	maxScore?: number;
}

export function NeonScoreDisplay({
	score,
	previousScore = 0,
	playerName,
	isCurrentPlayer = false,
	rank,
	maxScore,
}: ScoreDisplayProps) {
	const [displayScore, setDisplayScore] = useState(previousScore);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (score !== displayScore) {
			setIsAnimating(true);

			// Animate score change with odometer effect
			const duration = 800;
			const steps = Math.abs(score - displayScore);
			const stepDuration = duration / Math.max(steps, 1);

			let currentStep = 0;
			const interval = setInterval(() => {
				currentStep++;
				const progress = currentStep / steps;
				const newScore = Math.round(
					previousScore + (score - previousScore) * progress
				);

				setDisplayScore(newScore);

				if (currentStep >= steps) {
					clearInterval(interval);
					setDisplayScore(score);
					setIsAnimating(false);
				}
			}, stepDuration);

			return () => clearInterval(interval);
		}
	}, [score, displayScore, previousScore]);

	const getRankColor = (rank?: number) => {
		switch (rank) {
			case 1:
				return "text-sun-yellow";
			case 2:
				return "text-soft-lavender";
			case 3:
				return "text-neon-cyan";
			default:
				return "text-white";
		}
	};

	const getRankIcon = (rank?: number) => {
		switch (rank) {
			case 1:
				return "👑";
			case 2:
				return "🥈";
			case 3:
				return "🥉";
			default:
				return "⚡";
		}
	};

	return (
		<motion.div
			className={`
				flex items-center justify-between p-4 rounded-arcade
				bg-gradient-to-r from-surface-dark to-surface-darker
				border-2 transition-all duration-300
				${
					isCurrentPlayer
						? "border-neon-cyan shadow-neon-cyan"
						: "border-electric-blue/50"
				}
			`}
			whileHover={{ scale: 1.02 }}
			layout
		>
			{/* Player info */}
			<div className="flex items-center space-x-3">
				{rank && (
					<motion.div
						className="text-2xl"
						animate={isAnimating ? { rotate: [0, 360] } : {}}
						transition={{ duration: 0.5 }}
					>
						{getRankIcon(rank)}
					</motion.div>
				)}
				<div>
					<div className={`font-body font-bold ${getRankColor(rank)}`}>
						{playerName}
					</div>
					{isCurrentPlayer && (
						<div className="text-xs text-neon-cyan font-display">YOU</div>
					)}
				</div>
			</div>

			{/* Score display with odometer effect */}
			<div className="flex items-center space-x-2">
				<AnimatePresence mode="wait">
					<motion.div
						key={displayScore}
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -20, opacity: 0 }}
						transition={{ duration: 0.3 }}
						className={`
							font-display font-bold text-2xl
							${isAnimating ? "animate-arcade-flicker" : ""}
							${getRankColor(rank)}
						`}
						style={{
							textShadow: `0 0 10px currentColor`,
						}}
					>
						{displayScore.toLocaleString()}
					</motion.div>
				</AnimatePresence>

				{maxScore && (
					<div className="text-soft-lavender text-sm font-body">
						/ {maxScore}
					</div>
				)}
			</div>

			{/* Progress bar for target score */}
			{maxScore && (
				<div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-darker rounded-b-arcade overflow-hidden">
					<motion.div
						className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
						initial={{ width: `${(previousScore / maxScore) * 100}%` }}
						animate={{ width: `${(score / maxScore) * 100}%` }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					/>
				</div>
			)}
		</motion.div>
	);
}

interface ScoreboardProps {
	players: Array<{
		id: string;
		name: string;
		score: number;
		previousScore?: number;
	}>;
	currentPlayerId: string;
	targetScore?: number;
	title?: string;
}

export function NeonScoreboard({
	players,
	currentPlayerId,
	targetScore,
	title = "LEADERBOARD",
}: ScoreboardProps) {
	// Sort players by score (descending)
	const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

	return (
		<div className="space-y-4">
			{/* Meme-style scoreboard header */}
			<motion.div
				className="text-center relative"
				animate={{
					textShadow: [
						"0 0 20px rgba(255, 58, 242, 0.8)",
						"0 0 40px rgba(255, 58, 242, 1)",
						"0 0 20px rgba(255, 58, 242, 0.8)",
					],
				}}
				transition={{ duration: 2, repeat: Infinity }}
			>
				<h3 className="punk-heading neon-text-magenta text-2xl">{title} 💀</h3>
				{/* Graffiti underline */}
				<svg className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-2 pointer-events-none">
					<path
						d="M0,1 Q16,3 32,1 T64,1"
						stroke="#B6FF3A"
						strokeWidth="2"
						fill="none"
						opacity="0.7"
					/>
				</svg>
			</motion.div>

			<div className="space-y-3">
				{sortedPlayers.map((player, index) => (
					<NeonScoreDisplay
						key={player.id}
						score={player.score}
						previousScore={player.previousScore}
						playerName={player.name}
						isCurrentPlayer={player.id === currentPlayerId}
						rank={index + 1}
						maxScore={targetScore}
					/>
				))}
			</div>

			{targetScore && (
				<div className="text-center pt-4 border-t border-electric-blue/30 relative">
					<div className="text-soft-lavender text-sm font-body">
						First to {targetScore} points wins! 🏆
					</div>
					{/* Meme sticker */}
					<div className="absolute -top-2 -right-2 bg-neon-magenta text-stage text-xs font-bold px-2 py-1 rounded transform rotate-12">
						NO CAP
					</div>
				</div>
			)}
		</div>
	);
}
