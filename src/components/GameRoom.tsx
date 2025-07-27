"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PlayerSubmission from "./PlayerSubmission";
import VoteSection from "./VoteSection";

type Phase = "submission" | "voting" | "results";

export default function GameRoom({
	groupCode,
	playerName,
	players,
}: {
	groupCode: string;
	playerName: string;
	players: string[];
}) {
	const [phase, setPhase] = useState<Phase>("submission");
	const [prompt, setPrompt] = useState<string>("");
	const [submissions, setSubmissions] = useState<Record<string, string>>({});
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [shuffledEntries, setShuffledEntries] = useState<
		{ id: string; text: string }[]
	>([]);

	// Static prompt for now
	useEffect(() => {
		setPrompt("Invent a new law that only applies to your group.");
	}, []);

	useEffect(() => {
		if (
			phase === "submission" &&
			Object.keys(submissions).length === players.length
		) {
			const entries = Object.entries(submissions).map(([id, text]) => ({
				id,
				text,
			}));
			setShuffledEntries(entries.sort(() => Math.random() - 0.5));
			setPhase("voting");
		}
	}, [submissions, phase, players.length]);

	useEffect(() => {
		if (phase === "voting" && Object.keys(votes).length === players.length) {
			setPhase("results");
		}
	}, [votes, phase, players.length]);

	const handleSubmit = (answer: string) => {
		setSubmissions((prev) => ({ ...prev, [playerName]: answer }));
	};

	const handleVote = (voteFor: string) => {
		setVotes((prev) => ({ ...prev, [playerName]: voteFor }));
	};

	const tally = Object.values(votes).reduce((acc, id) => {
		acc[id] = (acc[id] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const winnerId = Object.keys(tally).reduce((top, id) => {
		return tally[id] > (tally[top] || 0) ? id : top;
	}, "");

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
				className="flex flex-col items-center text-center px-6 max-w-xl w-full gap-8"
			>
				<div>
					<h2 className="text-2xl font-semibold">Welcome, {playerName}!</h2>
					<h2 className="text-2xl font-semibold mt-1">
						Group Code:{" "}
						<span className="font-mono bg-zinc-700 px-2 py-1 rounded text-yellow-300">
							{groupCode}
						</span>
					</h2>
					<h3 className="text-4xl font-bold mt-4">🔥 Round 1: Classic Mode</h3>
					<p className="text-lg text-zinc-300 mt-2">{prompt}</p>
				</div>

				{/* Game Phase Views */}
				{phase === "submission" && (
					<PlayerSubmission
						player={playerName}
						onSubmit={handleSubmit}
						disabled={!!submissions[playerName]}
					/>
				)}

				{phase === "voting" && (
					<VoteSection
						player={playerName}
						entries={shuffledEntries.filter((e) => e.id !== playerName)}
						onVote={handleVote}
						disabled={!!votes[playerName]}
					/>
				)}

				{phase === "results" && (
					<div className="bg-zinc-800 p-6 rounded-xl w-full">
						<h3 className="text-2xl font-bold mb-2">🏆 Winner: {winnerId}</h3>
						<p className="text-zinc-300 mb-4 italic">
							"{submissions[winnerId]}"
						</p>
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
		</main>
	);
}
