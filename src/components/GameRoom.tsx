// 👇 Updated GameRoom to support multiple prompts and rounds

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SubmissionPhase from "./game/SubmissionPhase";
import VotingPhase from "./game/VotingPhase";
import ResultsPhase from "./game/ResultsPhase";
import GameOverPhase from "./game/GameOverPhase";

type Phase = "submission" | "voting" | "results" | "gameOver";

const prompts = [
	"Invent a new law that only applies to your group.",
	"Name a forbidden dance move.",
	"What’s the worst thing to say on a first date?",
];

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

	const prompt = prompts[round - 1] ?? "";

	const handleAllSubmissionsComplete = (
		entries: { id: string; text: string }[]
	) => {
		setShuffledEntries(entries);
		// Store submissions for results phase
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

	// Calculate winner for results phase
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
