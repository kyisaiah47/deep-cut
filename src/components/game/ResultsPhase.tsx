"use client";

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
	players,
	onNextRound,
	isProgressing = false,
}: ResultsPhaseProps) {
	// Calculate vote tally for visual representation
	const voteTally = Object.values(votes).reduce((acc, votedFor) => {
		acc[votedFor] = (acc[votedFor] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const maxVotes = Math.max(...Object.values(voteTally));

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
					🏆
				</motion.div>
				<h2 className="text-2xl font-bold text-yellow-400 mb-2">
					{winnerId} Wins!
				</h2>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
					className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700/50"
				>
					<p className="text-base text-zinc-200 italic leading-relaxed">
						&ldquo;{submissions[winnerId]}&rdquo;
					</p>
				</motion.div>
				<div className="mt-3 flex items-center justify-center gap-2">
					<span className="text-yellow-400 font-medium text-sm">
						{voteTally[winnerId] || 0} votes
					</span>
					<div className="flex gap-1">
						{Array.from({ length: Math.min(voteTally[winnerId] || 0, 5) }).map(
							(_, i) => (
								<motion.span
									key={i}
									initial={{ opacity: 0, scale: 0 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: 0.8 + i * 0.1 }}
									className="text-yellow-400 text-sm"
								>
									⭐
								</motion.span>
							)
						)}
						{(voteTally[winnerId] || 0) > 5 && (
							<span className="text-yellow-400 text-sm">
								+{(voteTally[winnerId] || 0) - 5}
							</span>
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
										playerId === winnerId
											? "bg-yellow-500/15 border-yellow-500/30"
											: "bg-zinc-700/50 border-zinc-600/50"
									}`}
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<span
												className={`font-medium text-sm ${
													playerId === winnerId
														? "text-yellow-300"
														: "text-zinc-200"
												}`}
											>
												{playerId}
											</span>
											{playerId === winnerId && (
												<span className="text-yellow-400 text-sm">👑</span>
											)}
										</div>
										<div className="flex items-center gap-2">
											<span
												className={`font-bold text-sm ${
													playerId === winnerId
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
												playerId === winnerId
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

				{/* Individual Votes - Compact Grid */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6, duration: 0.6 }}
					className="bg-zinc-800/90 backdrop-blur-sm rounded-2xl p-4 border border-zinc-700/50"
				>
					<h3 className="text-lg font-semibold text-white mb-3 text-center">
						🗳️ Individual Votes
					</h3>

					<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-60 overflow-y-auto">
						{players.map((player, index) => (
							<motion.div
								key={player}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.8 + index * 0.02 }}
								className="flex items-center justify-between p-2 bg-zinc-700/50 rounded-lg border border-zinc-600/30"
							>
								<span className="text-zinc-200 font-medium text-sm truncate">
									{player}
								</span>
								<span className="text-zinc-400 text-xs mx-1">→</span>
								<span
									className={`font-medium text-sm truncate ${
										votes[player] === winnerId
											? "text-yellow-300"
											: "text-zinc-300"
									}`}
								>
									{votes[player]}
								</span>
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
					disabled={isProgressing}
					size="lg"
					className={`px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
						isProgressing
							? "bg-gray-600 text-gray-400 cursor-not-allowed"
							: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
					}`}
				>
					<span className="mr-2">{isProgressing ? "⏳" : "🚀"}</span>
					{isProgressing ? "Starting Next Round..." : "Continue to Next Round"}
				</Button>
			</motion.div>
		</motion.div>
	);
}
