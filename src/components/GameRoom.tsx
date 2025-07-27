"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SubmissionPhase from "./game/SubmissionPhase";
import VotingPhase from "./game/VotingPhase";
import ResultsPhase from "./game/ResultsPhase";
import GameOverPhase from "./game/GameOverPhase";

// Enhanced prompts with associated emojis
const prompts = [
	{ text: "Invent a new law that only applies to your group.", emoji: "🧠" },
	{ text: "Name a forbidden dance move.", emoji: "💃" },
	{ text: "What’s the worst thing to say on a first date?", emoji: "💔" },
];

type Phase = "submission" | "voting" | "results" | "gameOver";

export default function GameRoom({
	groupCode,
	playerName,
	players,
	onReturnHome,
}: {
	groupCode: string;
	playerName: string;
	players: string[];
	onReturnHome: () => void;
}) {
	const [phase, setPhase] = useState<Phase>("submission");
	const [round, setRound] = useState(1);
	const [shuffledEntries, setShuffledEntries] = useState<
		{ id: string; text: string }[]
	>([]);
	const [votes, setVotes] = useState<Record<string, string>>({});
	const [submissions, setSubmissions] = useState<Record<string, string>>({});

	useEffect(() => {
		if (round > prompts.length) {
			setPhase("gameOver");
		}
	}, [round]);

	const { text: prompt, emoji: promptEmoji } = prompts[round - 1] ?? {
		text: "",
		emoji: "",
	};

	const handleAllSubmissionsComplete = (
		entries: { id: string; text: string }[]
	) => {
		setShuffledEntries(entries);
		const submissionsMap = entries.reduce((acc, entry) => {
			acc[entry.id] = entry.text;
			return acc;
		}, {} as Record<string, string>);
		setSubmissions(submissionsMap);
		setPhase("voting");
	};

	const handleAllVotesComplete = (allVotes: Record<string, string>) => {
		setVotes(allVotes);
		setPhase("results");
	};

	const handleNextRound = () => {
		setRound((prev) => prev + 1);
		setPhase("submission");
		setSubmissions({});
		setVotes({});
		setShuffledEntries([]);
	};

	const tally = Object.values(votes).reduce((acc, id) => {
		acc[id] = (acc[id] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const winnerId = Object.keys(tally).reduce((top, id) => {
		return tally[id] > (tally[top] || 0) ? id : top;
	}, "");

	return (
		<main className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900 text-white">
			<div className="p-4 flex justify-between items-center bg-zinc-800 text-sm text-zinc-300 border-b border-zinc-700">
				<span>👋 {playerName}</span>
				<span>
					Group Code:{" "}
					<code className="text-yellow-300 font-mono">{groupCode}</code>
				</span>
				<span>Round {round}</span>
			</div>

			<div className="flex-grow flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-4xl p-6 mx-auto text-center"
				>
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="text-lg text-zinc-300 mb-6"
					>
						{promptEmoji} {prompt}
					</motion.p>

					{phase === "submission" && (
						<SubmissionPhase
							groupCode={groupCode}
							playerName={playerName}
							players={players}
							round={round}
							prompt={prompt}
							onAllSubmissionsComplete={handleAllSubmissionsComplete}
						/>
					)}

					{phase === "voting" && (
						<VotingPhase
							groupCode={groupCode}
							playerName={playerName}
							players={players}
							round={round}
							shuffledEntries={shuffledEntries}
							onAllVotesComplete={handleAllVotesComplete}
						/>
					)}

					{phase === "results" && (
						<ResultsPhase
							winnerId={winnerId}
							submissions={submissions}
							votes={votes}
							players={players}
							onNextRound={handleNextRound}
						/>
					)}

					{phase === "gameOver" && (
						<GameOverPhase onReturnHome={onReturnHome} />
					)}
				</motion.div>
			</div>
		</main>
	);
}
