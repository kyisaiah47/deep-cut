"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SubmissionPhase from "./game/SubmissionPhase";
import VotingPhase from "./game/VotingPhase";
import ResultsPhase from "./game/ResultsPhase";
import InsightsPhase from "./game/InsightsPhase";
import GameOverPhase from "./game/GameOverPhase";
import FloatingBackground from "./FloatingBackground";

// Enhanced prompts with associated emojis (6 rounds)
const prompts = [
	{ text: "Invent a new law that only applies to your group.", emoji: "🧠" },
	{ text: "Name a forbidden dance move.", emoji: "💃" },
	{ text: "What's the worst thing to say on a first date?", emoji: "💔" },
	{ text: "Create a new holiday that everyone should celebrate.", emoji: "🎉" },
	{ text: "Describe the worst superpower to have.", emoji: "💥" },
	{
		text: "What's the most ridiculous conspiracy theory you can imagine?",
		emoji: "🛸",
	},
];

type Phase = "submission" | "voting" | "results" | "insights" | "gameOver";

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
	const [copied, setCopied] = useState(false);
	const [allRoundData, setAllRoundData] = useState<{
		[round: number]: {
			submissions: Record<string, string>;
			votes: Record<string, string>;
			prompt: string;
		};
	}>({});

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(groupCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Copy failed silently
		}
	};

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

		// Store this round's data
		setAllRoundData((prev) => ({
			...prev,
			[round]: {
				submissions,
				votes: allVotes,
				prompt,
			},
		}));

		// Show insights after round 3, and comprehensive insights after round 6 (final)
		if (round === 3 || round === 6) {
			setPhase("insights");
		} else {
			setPhase("results");
		}
	};

	const handleNextRound = () => {
		setRound((prev) => prev + 1);
		setPhase("submission");
		setSubmissions({});
		setVotes({});
		setShuffledEntries([]);
	};

	const handleContinueFromInsights = () => {
		if (round === 6) {
			// Final insights - this will be handled by the enhanced InsightsPhase
			return;
		}
		setPhase("results");
	};

	const tally = Object.values(votes).reduce((acc, id) => {
		acc[id] = (acc[id] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const winnerId = Object.keys(tally).reduce((top, id) => {
		return (tally[id] || 0) > (tally[top] || 0) ? id : top;
	}, "");

	return (
		<main className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			<FloatingBackground />
			<div className="p-4 flex justify-between items-center bg-black/30 backdrop-blur-md text-sm text-zinc-300 border-b border-zinc-700 relative z-10">
				<span>👋 {playerName}</span>
				<span className="relative">
					Group Code:{" "}
					<button
						onClick={handleCopyCode}
						className="text-pink-500 font-mono cursor-pointer hover:text-pink-400 hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-pink-500 px-2 py-1 rounded transition-all duration-200"
						title="Click to copy"
					>
						{groupCode}
					</button>
					{copied && (
						<span className="absolute top-8 transform -translate-x-1/2 text-xs text-green-400 bg-zinc-800 px-2 py-1 rounded whitespace-nowrap">
							Copied!
						</span>
					)}
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
						className="text-lg font-medium leading-tight mb-8 px-4 drop-shadow-[0_0_2px_#ec489888]"
					>
						<span
							className="mr-2 text-2xl animate-pulse"
							style={{ animationDuration: "2.5s" }}
						>
							{promptEmoji}
						</span>
						<span>{prompt}</span>
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

					{phase === "insights" && (
						<InsightsPhase
							allRoundData={allRoundData}
							players={players}
							isFinalInsights={round === 6}
							onContinue={handleContinueFromInsights}
							onReturnHome={onReturnHome}
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
