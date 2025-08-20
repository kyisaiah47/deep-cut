"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VoteSectionProps {
	entries: { id: string; text: string }[];
	onVote: (voteFor: string) => void;
	disabled: boolean;
	currentVoteCount?: number;
	totalPlayers?: number;
}

export default function VoteSection({
	entries,
	onVote,
	disabled,
	currentVoteCount = 0,
	totalPlayers = 0,
}: VoteSectionProps) {
	if (disabled) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center p-8"
			>
				<div className="text-6xl mb-4">✅</div>
				<h3 className="text-xl font-semibold text-green-400 mb-2">
					Vote Submitted!
				</h3>
				<p className="text-zinc-400">
					Waiting for other players to cast their votes...
				</p>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full max-w-4xl mx-auto"
		>
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-white mb-2">Cast Your Vote</h2>
				<p className="text-zinc-400 mb-2">
					Choose the answer you think is most fitting
				</p>
				{totalPlayers > 0 && (
					<p className="text-sm text-zinc-500">
						Votes collected: {currentVoteCount}/{totalPlayers}
					</p>
				)}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{entries.map((entry, index) => (
					<motion.div
						key={entry.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="group"
					>
						<Button
							onClick={() => onVote(entry.id)}
							className="w-full p-6 h-auto text-left bg-zinc-800/90 border border-zinc-700 hover:border-pink-500/50 hover:bg-zinc-700/90 transition-all duration-200"
						>
							<div className="flex flex-col gap-2">
								<div className="text-sm text-zinc-400 font-medium">
									Option {index + 1}
								</div>
								<div className="text-base text-white group-hover:text-pink-200">
									{entry.text}
								</div>
							</div>
						</Button>
					</motion.div>
				))}
			</div>
		</motion.div>
	);
}
