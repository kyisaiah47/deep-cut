"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PlayerSubmission from "./PlayerSubmission";
import VoteSection from "./VoteSection";

export default function GameRoom({
	groupCode,
	playerName,
}: {
	groupCode: string;
	playerName: string;
}) {
	const [submissions, setSubmissions] = useState<Record<string, string>>({});
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [shuffledEntries, setShuffledEntries] = useState<
		{ id: string; text: string }[]
	>([]);
	const players = ["Player 1", "Player 2", "Player 3"];
	const prompt = "Invent a new law that only applies to your group.";

	const handleSubmit = (player: string, answer: string) => {
		const updated = { ...submissions, [player]: answer };
		setSubmissions(updated);
		if (Object.keys(updated).length === players.length) {
			const entries = Object.entries(updated).map(([id, text]) => ({
				id,
				text,
			}));
			setShuffledEntries(entries.sort(() => Math.random() - 0.5));
		}
	};

	const handleVote = (voter: string, voteFor: string) => {
		setVotes((prev) => ({ ...prev, [voter]: voteFor }));
	};

	const tally = Object.values(votes).reduce((acc, id) => {
		acc[id] = (acc[id] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const winnerId = Object.keys(tally).reduce((top, id) => {
		return tally[id] > (tally[top] || 0) ? id : top;
	}, "");

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4 }}
			className="w-full max-w-4xl p-6"
		>
			<h2 className="text-2xl font-semibold">Welcome, {playerName}!</h2>
			<h2 className="text-2xl font-semibold mb-2">
				Group Code:{" "}
				<span className="font-mono bg-zinc-700 px-2 py-1 rounded text-yellow-300">
					{groupCode}
				</span>
			</h2>
			<h3 className="text-3xl font-semibold mb-4 mt-2">
				Round 1: Classic Mode
			</h3>
			<p className="text-lg mb-6 text-zinc-300">{prompt}</p>

			{Object.keys(submissions).length < players.length ? (
				<div className="grid gap-6">
					{players.map((player) => (
						<PlayerSubmission
							key={player}
							player={player}
							onSubmit={(answer) => handleSubmit(player, answer)}
							disabled={!!submissions[player]}
						/>
					))}
				</div>
			) : Object.keys(votes).length < players.length ? (
				<div className="space-y-6">
					{players.map((player) => (
						<VoteSection
							key={player}
							player={player}
							entries={shuffledEntries.filter((e) => e.id !== player)}
							onVote={(voteFor) => handleVote(player, voteFor)}
							disabled={!!votes[player]}
						/>
					))}
				</div>
			) : (
				<div className="mt-8 bg-zinc-800 p-6 rounded-xl">
					<h3 className="text-2xl font-bold mb-2">🏆 Winner: {winnerId}</h3>
					<p className="text-zinc-300 mb-4 italic">"{submissions[winnerId]}"</p>
					<h4 className="text-lg font-semibold mt-4 mb-2">Final Votes</h4>
					<ul className="text-zinc-200 space-y-1">
						{players.map((p) => (
							<li key={p}>
								{p} voted for <strong>{votes[p]}</strong>
							</li>
						))}
					</ul>
				</div>
			)}
		</motion.div>
	);
}
