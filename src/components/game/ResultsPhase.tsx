"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ResultsPhaseProps {
	winnerId: string;
	submissions: Record<string, string>;
	votes: Record<string, string>;
	players: string[];
	onNextRound: () => void;
	isProgressing?: boolean;
}

export default function ResultsPhase({
	winnerId,
	submissions,
	votes,
	players, // eslint-disable-line @typescript-eslint/no-unused-vars
	onNextRound,
	isProgressing = false,
}: ResultsPhaseProps) {
	const [countdown, setCountdown] = useState(3);

	// Countdown effect when component mounts
	useEffect(() => {
		const interval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, []); // Empty dependency array - runs once on mount

	// Calculate vote tally for visual representation
	const voteTally = Object.values(votes).reduce((acc, votedFor) => {
		acc[votedFor] = (acc[votedFor] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const maxVotes = Math.max(...Object.values(voteTally));

	// Check for ties - find all players with the maximum votes
	const winners = Object.entries(voteTally).filter(
		([, votes]) => votes === maxVotes
	);
	const isTie = winners.length > 1;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className="w-full max-w-4xl mx-auto h-full max-h-[80vh] flex flex-col space-y-4 overflow-hidden"
		>
			{/* Winner Announcement - Fixed size */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.2, duration: 0.6 }}
				className="text-center p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/20 backdrop-blur-sm flex-shrink-0"
			>
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.4 }}
					className="text-4xl mb-3"
				>
					{isTie ? "🤝" : "🏆"}
				</motion.div>
				<h2 className="text-2xl font-bold text-yellow-400 mb-2">
					{isTie ? "It's a Tie!" : `${winnerId} Wins!`}
				</h2>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
					className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700/50"
				>
					{isTie ? (
						<div className="space-y-2">
							{winners.map(([playerId]) => (
								<p
									key={playerId}
									className="text-base text-zinc-200 italic leading-relaxed"
								>
									<span className="text-yellow-300 font-medium">
										{playerId}:
									</span>{" "}
									&ldquo;{submissions[playerId]}&rdquo;
								</p>
							))}
						</div>
					) : (
						<p className="text-base text-zinc-200 italic leading-relaxed">
							&ldquo;{submissions[winnerId]}&rdquo;
						</p>
					)}
				</motion.div>
				<div className="mt-3 flex items-center justify-center gap-2">
					<span className="text-yellow-400 font-medium text-sm">
						{isTie
							? `${maxVotes} votes each`
							: `${voteTally[winnerId] || 0} votes`}
					</span>
					<div className="flex gap-1">
						{Array.from({ length: Math.min(maxVotes, 5) }).map((_, i) => (
							<motion.span
								key={i}
								initial={{ opacity: 0, scale: 0 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.8 + i * 0.1 }}
								className="text-yellow-400 text-sm"
							>
								⭐
							</motion.span>
						))}
						{maxVotes > 5 && (
							<span className="text-yellow-400 text-sm">+{maxVotes - 5}</span>
						)}
					</div>
				</div>
			</motion.div>

			{/* Scrollable Content Container */}
			<div className="flex-1 overflow-y-auto space-y-4 pr-2">
				{/* Voting Breakdown */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4, duration: 0.6 }}
					className="bg-zinc-800/90 backdrop-blur-sm rounded-2xl p-4 border border-zinc-700/50"
				>
					<h3 className="text-lg font-semibold text-white mb-4 text-center">
						📊 Vote Breakdown
					</h3>

					<div className="space-y-3">
						{Object.entries(voteTally)
							.sort(([, a], [, b]) => b - a)
							.map(([playerId, voteCount], index) => (
								<motion.div
									key={playerId}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.6 + index * 0.05 }}
									className={`p-3 rounded-lg border transition-all duration-200 ${
										voteCount === maxVotes
											? "bg-yellow-500/15 border-yellow-500/30"
											: "bg-zinc-700/50 border-zinc-600/50"
									}`}
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<span
												className={`font-medium text-sm ${
													voteCount === maxVotes
														? "text-yellow-300"
														: "text-zinc-200"
												}`}
											>
												{playerId}
											</span>
											{voteCount === maxVotes && (
												<span className="text-yellow-400 text-sm">
													{isTie ? "🤝" : "👑"}
												</span>
											)}
										</div>
										<div className="flex items-center gap-2">
											<span
												className={`font-bold text-sm ${
													voteCount === maxVotes
														? "text-yellow-300"
														: "text-zinc-300"
												}`}
											>
												{voteCount} vote{voteCount !== 1 ? "s" : ""}
											</span>
										</div>
									</div>

									{/* Vote bar */}
									<div className="w-full bg-zinc-700 rounded-full h-1.5 overflow-hidden mb-2">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${(voteCount / maxVotes) * 100}%` }}
											transition={{ delay: 0.8 + index * 0.05, duration: 0.6 }}
											className={`h-full rounded-full ${
												voteCount === maxVotes
													? "bg-gradient-to-r from-yellow-400 to-orange-400"
													: "bg-gradient-to-r from-zinc-500 to-zinc-400"
											}`}
										/>
									</div>

									<p className="text-xs text-zinc-400 italic overflow-hidden">
										<span className="block truncate">
											&ldquo;{submissions[playerId]}&rdquo;
										</span>
									</p>
								</motion.div>
							))}
					</div>
				</motion.div>
			</div>

			{/* Next Round Button - Fixed at bottom */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.8, duration: 0.6 }}
				className="text-center flex-shrink-0 pt-2"
			>
				<Button
					onClick={onNextRound}
					disabled={isProgressing || countdown > 0}
					size="lg"
					className={`px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
						isProgressing || countdown > 0
							? "bg-gray-600 text-gray-400 cursor-not-allowed"
							: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
					}`}
				>
					<span className="mr-2">
						{isProgressing ? "⏳" : countdown > 0 ? "⏰" : "🚀"}
					</span>
					{isProgressing
						? "Starting Next Round..."
						: countdown > 0
						? `Ready in ${countdown}...`
						: "Continue to Next Round"}
				</Button>
			</motion.div>
		</motion.div>
	);
}
