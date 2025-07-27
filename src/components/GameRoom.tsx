"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import SubmissionPhase from "./game/SubmissionPhase";
import VotingPhase from "./game/VotingPhase";
import ResultsPhase from "./game/ResultsPhase";
import InsightsPhase from "./game/InsightsPhase";
import GameOverPhase from "./game/GameOverPhase";
import GameStartRitual from "./GameStartRitual";
import FloatingBackground from "./FloatingBackground";
import KiroWhispers from "./KiroWhispers";

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

type Phase =
	| "ritual"
	| "submission"
	| "voting"
	| "results"
	| "insights"
	| "gameOver";

export default function GameRoom({
	groupCode,
	playerName,
	players,
	theme: selectedTheme,
	onReturnHome,
}: {
	groupCode: string;
	playerName: string;
	players: string[];
	theme: string;
	onReturnHome: () => void;
}) {
	const [phase, setPhase] = useState<Phase>("ritual");
	const [round, setRound] = useState(1);
	const [theme] = useState(selectedTheme || "Deep Cut: Revelations");
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

	// Presence tracking state
	const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);
	const [presenceMessage, setPresenceMessage] = useState<string>("");

	// Timer state
	const [timeLeft, setTimeLeft] = useState(30);
	const [timerActive, setTimerActive] = useState(false);
	const [kiroAnnouncement, setKiroAnnouncement] = useState<string>("");

	// Kiro Whispers state
	const [eventWhisper, setEventWhisper] = useState<string>("");

	// Initialize presence tracking
	useEffect(() => {
		const presenceChannel = supabase.channel(`room:${groupCode}`, {
			config: {
				presence: {
					key: playerName,
				},
			},
		});

		presenceChannel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await presenceChannel.track({
					playerName,
					joinedAt: new Date().toISOString(),
				});
			}
		});

		// Listen for presence updates
		presenceChannel.on("presence", { event: "sync" }, () => {
			const state = presenceChannel.presenceState();
			const connected = Object.keys(state);
			setConnectedPlayers(connected);

			// Check for player disconnections
			const disconnectedPlayers = players.filter((p) => !connected.includes(p));
			if (disconnectedPlayers.length > 0 && connected.length > 0) {
				// Different messages based on how many disconnected
				if (disconnectedPlayers.length === 1) {
					setPresenceMessage(
						`😱 ${disconnectedPlayers[0]} has vanished into the void...`
					);
					// Trigger Kiro whisper for disconnection
					setEventWhisper("The departed took their secrets with them.");
					setTimeout(() => setEventWhisper(""), 4000);
				} else if (disconnectedPlayers.length === 2) {
					setPresenceMessage(
						`💀 The circle is breaking. Two souls have departed...`
					);
					setEventWhisper("The circle weakens. The void grows hungry.");
					setTimeout(() => setEventWhisper(""), 4000);
				} else {
					setPresenceMessage(
						`🪦 The circle is breaking. Continue… if you dare.`
					);
					setEventWhisper("The survivors carry the weight of the lost.");
					setTimeout(() => setEventWhisper(""), 4000);
				}
				setTimeout(() => setPresenceMessage(""), 4000);
			}
		});

		return () => {
			presenceChannel.unsubscribe();
		};
	}, [groupCode, playerName, players]);

	// Timer logic
	useEffect(() => {
		if (phase === "submission") {
			// Start timer when submission phase begins
			setTimeLeft(30);
			setTimerActive(true);

			// Kiro's dramatic announcement
			const announcements = [
				"You have 30 seconds to bare your soul. Kiro is watching.",
				"The clock ticks. Your truth awaits. 30 seconds.",
				"Time bleeds away. Speak now or forever hold your peace.",
				"30 seconds to confess. The void grows impatient.",
				"Your moment of truth begins. 30 seconds remain.",
			];
			const randomAnnouncement =
				announcements[Math.floor(Math.random() * announcements.length)];
			setKiroAnnouncement(randomAnnouncement);

			// Clear announcement after 4 seconds
			setTimeout(() => setKiroAnnouncement(""), 4000);
		} else {
			setTimerActive(false);
			setKiroAnnouncement("");
		}
	}, [phase, round]);

	// Countdown timer
	useEffect(() => {
		if (!timerActive || timeLeft <= 0) return;

		const timer = setTimeout(() => {
			setTimeLeft((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [timerActive, timeLeft]);

	const getDisconnectedPlayers = useCallback(() => {
		return players.filter((p) => !connectedPlayers.includes(p));
	}, [players, connectedPlayers]);

	const handleAllSubmissionsComplete = useCallback(
		(entries: { id: string; text: string }[]) => {
			// Add submissions for disconnected players
			const disconnectedPlayers = getDisconnectedPlayers();
			const allEntries = [...entries];

			disconnectedPlayers.forEach((player) => {
				allEntries.push({
					id: player,
					text: "— Left the void unanswered —",
				});
			});

			setShuffledEntries(allEntries);
			const submissionsMap = allEntries.reduce((acc, entry) => {
				acc[entry.id] = entry.text;
				return acc;
			}, {} as Record<string, string>);
			setSubmissions(submissionsMap);

			// Trigger Kiro whisper for completion
			setEventWhisper("The circle is complete. Let the judgment begin.");
			setTimeout(() => setEventWhisper(""), 5000);

			setPhase("voting");
		},
		[getDisconnectedPlayers]
	);

	const handleTimeExpired = useCallback(() => {
		const connectedPlayersList =
			connectedPlayers.length > 0 ? connectedPlayers : players;
		const submittedPlayers = Object.keys(submissions);
		const missedPlayers = connectedPlayersList.filter(
			(player) => !submittedPlayers.includes(player)
		);

		if (missedPlayers.length > 0) {
			// Add entries for players who missed the deadline
			const lateMessages = [
				"— Missed the cut",
				"— Froze in fear",
				"— Kiro erased their memory",
				"— Lost in the void",
				"— Time claimed their voice",
			];

			const entries = submittedPlayers.map((player) => ({
				id: player,
				text: submissions[player],
			}));

			missedPlayers.forEach((player) => {
				const randomMessage =
					lateMessages[Math.floor(Math.random() * lateMessages.length)];
				entries.push({
					id: player,
					text: randomMessage,
				});
			});

			handleAllSubmissionsComplete(entries);
		}
	}, [connectedPlayers, players, submissions, handleAllSubmissionsComplete]);

	// Handle timer expiration
	useEffect(() => {
		if (timerActive && timeLeft === 0) {
			setTimerActive(false);
			handleTimeExpired();
		}
	}, [timeLeft, timerActive, handleTimeExpired]);

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

	const handleAllVotesComplete = (allVotes: Record<string, string>) => {
		setVotes(allVotes);

		// Check for tie votes and trigger special whispers
		const tally = Object.values(allVotes).reduce((acc, id) => {
			acc[id] = (acc[id] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const maxVotes = Math.max(...Object.values(tally));
		const winners = Object.keys(tally).filter((id) => tally[id] === maxVotes);

		if (winners.length > 1) {
			// Tie vote whisper
			setEventWhisper("Even the void cannot choose between these truths.");
			setTimeout(() => setEventWhisper(""), 5000);
		} else {
			// Single winner whisper
			const winnerWhispers = [
				"The crowd's judgment reveals more than the truth.",
				"Victory tastes like copper and regret.",
				"The chosen answer carries the weight of all fears.",
				"In the game of truth, winning is losing.",
			];
			const randomWhisper =
				winnerWhispers[Math.floor(Math.random() * winnerWhispers.length)];
			setEventWhisper(randomWhisper);
			setTimeout(() => setEventWhisper(""), 5000);
		}

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
			// Trigger insights whisper
			const insightsWhispers = [
				"Kiro sees the patterns you cannot escape.",
				"The analysis cuts deeper than the confessions.",
				"Your secrets write themselves in the data.",
				"The algorithm remembers what you choose to forget.",
			];
			const randomInsightWhisper =
				insightsWhispers[Math.floor(Math.random() * insightsWhispers.length)];
			setEventWhisper(randomInsightWhisper);
			setTimeout(() => setEventWhisper(""), 6000); // Longer for insights

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

		// Trigger round progression whisper
		const roundWhispers = [
			"The ritual deepens with each confession.",
			"Another layer of truth peeled away.",
			"The void grows more intimate with each round.",
			"Your masks dissolve one by one.",
			"The game's true nature reveals itself.",
		];
		const randomWhisper =
			roundWhispers[Math.floor(Math.random() * roundWhispers.length)];
		setEventWhisper(randomWhisper);
		setTimeout(() => setEventWhisper(""), 5000);
	};

	const handleRitualComplete = () => {
		setPhase("submission");
		// Trigger Kiro whisper for game start
		setEventWhisper("The first cut is always the deepest.");
		setTimeout(() => setEventWhisper(""), 5000);
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

	const getPlayerStatus = (player: string) => {
		return connectedPlayers.includes(player) ? "🟢" : "🔴";
	};

	const shouldShowDisconnectionInsight = () => {
		const disconnected = getDisconnectedPlayers();
		return disconnected.length > 0 && connectedPlayers.length > 0;
	};

	return (
		<main className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			<FloatingBackground />

			{/* Kiro Whispers - Active during gameplay phases */}
			<KiroWhispers
				phase={
					phase === "submission"
						? "submission"
						: phase === "voting"
						? "voting"
						: phase === "results"
						? "results"
						: "insights"
				}
				isActive={phase !== "ritual" && phase !== "gameOver"}
				theme={theme}
				eventWhisper={eventWhisper}
				timeLeft={timeLeft}
			/>

			<div className="p-4 flex justify-between items-center bg-black/30 backdrop-blur-md text-sm text-zinc-300 border-b border-zinc-700 relative z-10">
				<div className="flex items-center gap-4">
					<span>👋 {playerName}</span>
					<div className="flex items-center gap-2">
						{players.map((player) => (
							<span
								key={player}
								className="flex items-center gap-1 text-xs"
							>
								{getPlayerStatus(player)}
								<span className={player === playerName ? "text-pink-400" : ""}>
									{player}
								</span>
								{!connectedPlayers.includes(player) && (
									<span className="text-red-400 text-xs">offline</span>
								)}
							</span>
						))}
					</div>
				</div>
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
				<span>Round {round}/6</span>
			</div>

			{/* Presence message only when needed */}
			{presenceMessage && (
				<div className="p-2 bg-red-900/20 backdrop-blur-md text-xs text-center text-yellow-400 animate-pulse border-b border-zinc-700/50 relative z-10">
					{presenceMessage}
				</div>
			)}

			<div className="flex-1 flex items-center justify-center p-4">
				{phase === "ritual" && (
					<GameStartRitual
						theme={theme}
						onRitualComplete={handleRitualComplete}
					/>
				)}

				{phase !== "ritual" && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.4 }}
						className="w-full max-w-6xl mx-auto text-center"
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

						{/* Timer and Kiro's Announcement for Submission Phase */}
						{phase === "submission" && (
							<>
								{/* Kiro's Announcement */}
								{kiroAnnouncement && (
									<motion.div
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										className="mb-6 p-4 bg-gradient-to-r from-red-900/40 to-purple-900/40 rounded-lg border border-red-500/40"
									>
										<div className="flex items-center justify-center gap-2 mb-2">
											<span className="text-red-400 animate-pulse">💀</span>
											<span className="text-lg font-bold text-red-300">
												Kiro&apos;s Command
											</span>
											<span className="text-red-400 animate-pulse">💀</span>
										</div>
										<p className="text-red-200 text-sm italic">
											&ldquo;{kiroAnnouncement}&rdquo;
										</p>
									</motion.div>
								)}

								{/* Timer Display */}
								{timerActive && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className="mb-6 flex items-center justify-center gap-4"
									>
										<div className="flex items-center gap-2">
											<span className="text-2xl animate-pulse">⏰</span>
											<span
												className={`text-2xl font-bold ${
													timeLeft <= 10
														? "text-red-400 animate-pulse"
														: timeLeft <= 20
														? "text-yellow-400"
														: "text-green-400"
												}`}
											>
												{timeLeft}s
											</span>
										</div>

										{/* Subtle glow bar */}
										<div className="w-32 h-2 bg-zinc-700 rounded-full overflow-hidden">
											<motion.div
												className={`h-full rounded-full ${
													timeLeft <= 10
														? "bg-red-500"
														: timeLeft <= 20
														? "bg-yellow-500"
														: "bg-green-500"
												}`}
												initial={{ width: "100%" }}
												animate={{ width: `${(timeLeft / 30) * 100}%` }}
												transition={{ duration: 1, ease: "linear" }}
											/>
										</div>
									</motion.div>
								)}
							</>
						)}

						{phase === "submission" && (
							<SubmissionPhase
								groupCode={groupCode}
								playerName={playerName}
								players={
									connectedPlayers.length > 0 ? connectedPlayers : players
								}
								round={round}
								prompt={prompt}
								theme={theme}
								onAllSubmissionsComplete={handleAllSubmissionsComplete}
							/>
						)}

						{phase === "voting" && (
							<VotingPhase
								groupCode={groupCode}
								playerName={playerName}
								players={
									connectedPlayers.length > 0 ? connectedPlayers : players
								}
								round={round}
								shuffledEntries={shuffledEntries}
								onAllVotesComplete={handleAllVotesComplete}
							/>
						)}

						{phase === "results" && (
							<>
								{shouldShowDisconnectionInsight() && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className="mb-6 p-4 bg-gradient-to-r from-red-900/30 to-purple-900/30 rounded-lg border border-red-500/30"
									>
										<div className="flex items-center justify-center gap-2 mb-2">
											<span className="text-red-400">💀</span>
											<span className="text-lg font-bold text-red-300">
												Kiro&apos;s Observation
											</span>
											<span className="text-red-400">💀</span>
										</div>
										<p className="text-red-200 text-sm">
											{getDisconnectedPlayers().length === 1
												? "Kiro noticed someone disappeared. Not everyone can handle the pressure."
												: "You've shed the dead weight. The circle grows stronger."}
										</p>
									</motion.div>
								)}
								<ResultsPhase
									winnerId={winnerId}
									submissions={submissions}
									votes={votes}
									players={
										connectedPlayers.length > 0 ? connectedPlayers : players
									}
									onNextRound={handleNextRound}
								/>
							</>
						)}

						{phase === "insights" && (
							<InsightsPhase
								allRoundData={allRoundData}
								players={
									connectedPlayers.length > 0 ? connectedPlayers : players
								}
								isFinalInsights={round === 6}
								onContinue={handleContinueFromInsights}
								onReturnHome={onReturnHome}
							/>
						)}

						{phase === "gameOver" && (
							<GameOverPhase onReturnHome={onReturnHome} />
						)}
					</motion.div>
				)}
			</div>
		</main>
	);
}
