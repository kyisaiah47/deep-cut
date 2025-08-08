"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Player } from "@/types/game";

interface GameResultsProps {
	finalWinners: Player[];
	finalRankings: Player[];
	totalRounds: number;
	targetScore: number;
	onPlayAgain?: () => void;
	onReturnToLobby?: () => void;
	showPlayAgainButton?: boolean;
	className?: string;
}

export function GameResults({
	finalWinners,
	finalRankings,
	totalRounds,
	targetScore,
	onPlayAgain,
	onReturnToLobby,
	showPlayAgainButton = true,
	className = "",
}: GameResultsProps) {
	const [showConfetti, setShowConfetti] = useState(true);
	const [showFullRankings, setShowFullRankings] = useState(false);

	// Create confetti particles
	const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		delay: Math.random() * 2,
		color: [
			"bg-yellow-400",
			"bg-blue-400",
			"bg-green-400",
			"bg-red-400",
			"bg-purple-400",
			"bg-pink-400",
		][Math.floor(Math.random() * 6)],
	}));

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className={`relative space-y-8 ${className}`}
		>
			{/* Confetti animation */}
			<AnimatePresence>
				{showConfetti && (
					<div className="absolute inset-0 pointer-events-none overflow-hidden">
						{confettiParticles.map((particle) => (
							<motion.div
								key={particle.id}
								initial={{
									y: -20,
									x: `${particle.x}%`,
									rotate: 0,
									opacity: 1,
								}}
								animate={{
									y: "100vh",
									rotate: 360,
									opacity: 0,
								}}
								transition={{
									duration: 3,
									delay: particle.delay,
									ease: "easeOut",
								}}
								onAnimationComplete={() => {
									if (particle.id === confettiParticles.length - 1) {
										setShowConfetti(false);
									}
								}}
								className={`absolute w-3 h-3 ${particle.color} rounded-full`}
							/>
						))}
					</div>
				)}
			</AnimatePresence>

			{/* Game Over Header */}
			<motion.div
				initial={{ y: -50, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="text-center"
			>
				<motion.h1
					initial={{ scale: 0.5 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
					className="text-4xl font-bold text-gray-900 mb-2"
				>
					🎉 Game Over! 🎉
				</motion.h1>
				<p className="text-lg text-gray-600">
					Completed in {totalRounds} round{totalRounds !== 1 ? "s" : ""}
				</p>
			</motion.div>

			{/* Winners Celebration */}
			<motion.div
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.6 }}
				className="text-center py-8 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-300 rounded-xl"
			>
				<motion.div
					initial={{ rotate: -180, scale: 0 }}
					animate={{ rotate: 0, scale: 1 }}
					transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
					className="text-6xl mb-4"
				>
					🏆
				</motion.div>

				<h2 className="text-2xl font-bold text-gray-900 mb-4">
					{finalWinners.length > 1 ? "Champions!" : "Champion!"}
				</h2>

				<div className="flex flex-wrap justify-center gap-3 mb-4">
					{finalWinners.map((winner, index) => (
						<motion.div
							key={winner.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 1 + index * 0.2 }}
							className="text-center"
						>
							<Badge
								variant="default"
								className="bg-yellow-500 text-white text-xl px-6 py-3 mb-2"
							>
								{winner.name}
							</Badge>
							<div className="text-sm text-gray-600">
								{winner.score} point{winner.score !== 1 ? "s" : ""}
							</div>
						</motion.div>
					))}
				</div>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.5 }}
					className="text-gray-700"
				>
					{finalWinners.length > 1
						? `Tied with ${finalWinners[0].score} points!`
						: `Won with ${finalWinners[0]?.score || 0} points!`}
				</motion.p>
			</motion.div>

			{/* Final Rankings */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1.2 }}
				className="space-y-4"
			>
				<div className="flex items-center justify-between">
					<h3 className="text-xl font-semibold text-gray-900">
						Final Rankings
					</h3>
					{finalRankings.length > 5 && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFullRankings(!showFullRankings)}
						>
							{showFullRankings ? "Show Less" : "Show All"}
						</Button>
					)}
				</div>

				<div className="space-y-3">
					<AnimatePresence mode="popLayout">
						{(showFullRankings ? finalRankings : finalRankings.slice(0, 5)).map(
							(player, index) => {
								const isWinner = finalWinners.some((w) => w.id === player.id);
								const rank = index + 1;

								return (
									<motion.div
										key={player.id}
										layout
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: 20 }}
										transition={{ delay: 1.4 + index * 0.1 }}
										className={`
										flex items-center justify-between p-4 rounded-lg border
										${
											isWinner
												? "bg-yellow-50 border-yellow-300 shadow-md"
												: "bg-white border-gray-200"
										}
									`}
										whileHover={{ scale: 1.02 }}
									>
										<div className="flex items-center gap-4">
											{/* Rank */}
											<motion.div
												className={`
												flex items-center justify-center w-10 h-10 rounded-full font-bold
												${
													rank === 1
														? "bg-yellow-100 text-yellow-800 text-lg"
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

											{/* Player info */}
											<div className="flex flex-col">
												<span className="font-semibold text-gray-900">
													{player.name}
												</span>
												{!player.is_connected && (
													<span className="text-xs text-red-500">
														Disconnected
													</span>
												)}
											</div>

											{/* Winner badge */}
											{isWinner && (
												<motion.div
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													transition={{ delay: 1.6 + index * 0.1 }}
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

										{/* Score and progress */}
										<div className="flex items-center gap-4">
											{/* Progress bar */}
											<div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
												<motion.div
													className={`
													h-full rounded-full
													${isWinner ? "bg-yellow-500" : rank <= 3 ? "bg-green-500" : "bg-blue-500"}
												`}
													initial={{ width: "0%" }}
													animate={{
														width: `${Math.min(
															(player.score / targetScore) * 100,
															100
														)}%`,
													}}
													transition={{
														duration: 1.5,
														delay: 1.8 + index * 0.1,
														ease: "easeOut",
													}}
												/>
											</div>

											{/* Score */}
											<div className="text-right">
												<div className="text-xl font-bold text-gray-900">
													{player.score}
												</div>
												<div className="text-xs text-gray-500">
													/ {targetScore}
												</div>
											</div>
										</div>
									</motion.div>
								);
							}
						)}
					</AnimatePresence>

					{/* Show remaining count */}
					{!showFullRankings && finalRankings.length > 5 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 2 }}
							className="text-center text-gray-500 text-sm"
						>
							... and {finalRankings.length - 5} more players
						</motion.div>
					)}
				</div>
			</motion.div>

			{/* Action buttons */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 2.2 }}
				className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
			>
				{showPlayAgainButton && onPlayAgain && (
					<Button
						onClick={onPlayAgain}
						size="lg"
						className="min-w-40"
					>
						🎮 Play Again
					</Button>
				)}
				{onReturnToLobby && (
					<Button
						onClick={onReturnToLobby}
						variant="outline"
						size="lg"
						className="min-w-40"
					>
						Return to Lobby
					</Button>
				)}
			</motion.div>

			{/* Game stats */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 2.4 }}
				className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200"
			>
				<p>
					Thanks for playing! Game completed with {finalRankings.length} players
					in {totalRounds} round{totalRounds !== 1 ? "s" : ""}.
				</p>
			</motion.div>
		</motion.div>
	);
}
