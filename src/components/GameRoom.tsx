"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
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
	theme: selectedTheme,
	onReturnHome,
}: {
	groupCode: string;
	playerName: string;
	players: string[];
	theme: string;
	onReturnHome: () => void;
}) {
	const [phase, setPhase] = useState<Phase>("submission");
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
	const [roundProgression, setRoundProgression] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	// Timer state
	const [timeLeft, setTimeLeft] = useState(30);
	const [timerActive, setTimerActive] = useState(false);

	// Set mounted state to prevent hydration issues
	useEffect(() => {
		setIsMounted(true);
	}, []);

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
				} else if (disconnectedPlayers.length === 2) {
					setPresenceMessage(
						`💀 The circle is breaking. Two souls have departed...`
					);
				} else {
					setPresenceMessage(
						`🪦 The circle is breaking. Continue… if you dare.`
					);
				}
				setTimeout(() => setPresenceMessage(""), 4000);
			}
		});

		return () => {
			presenceChannel.unsubscribe();
		};
	}, [groupCode, playerName, players]);

	// Subscribe to round progression changes
	useEffect(() => {
		const roundSubscription = supabase
			.channel(`round-progression-${groupCode}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "rooms",
					filter: `room_code=eq.${groupCode}`,
				},
				(payload) => {
					if (
						payload.new?.current_round &&
						payload.new.current_round !== round
					) {
						const newRound = payload.new.current_round;
						setRound(newRound);
						setPhase("submission");
						setSubmissions({});
						setVotes({});
						setShuffledEntries([]);
						setRoundProgression(false);
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(roundSubscription);
		};
	}, [groupCode, round]);

	// Timer logic
	useEffect(() => {
		if (phase === "submission") {
			// Start timer when submission phase begins
			setTimeLeft(30);
			setTimerActive(true);
		} else {
			setTimerActive(false);
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

	const { text: prompt } = prompts[round - 1] ?? {
		text: "",
		emoji: "",
	};

	const handleAllVotesComplete = useCallback(
		(allVotes: Record<string, string>) => {
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
		},
		[round, submissions, prompt]
	);

	const handleNextRound = async () => {
		if (roundProgression) return; // Prevent multiple clicks

		try {
			setRoundProgression(true);
			const { error } = await supabase
				.from("rooms")
				.update({ current_round: round + 1 })
				.eq("room_code", groupCode);

			if (error) {
				console.error("Error progressing round:", error);
				setRoundProgression(false);
			}
		} catch (error) {
			console.error("Error progressing round:", error);
			setRoundProgression(false);
		}
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

	const shouldShowDisconnectionInsight = () => {
		const disconnected = getDisconnectedPlayers();
		return disconnected.length > 0 && connectedPlayers.length > 0;
	};

	return (
		<main className="min-h-screen flex flex-col bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			<FloatingBackground />

			<div className="p-4 grid grid-cols-3 items-center bg-gradient-to-r from-black/30 via-zinc-900/40 to-black/30 backdrop-blur-lg text-sm relative z-10">
				{/* Left Column - Player Info */}
				<div className="flex items-center gap-2 justify-self-start">
					{players.map((player) => (
						<div
							key={player}
							className={`
								flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200
								${
									player === playerName
										? "bg-pink-500/15 border border-pink-500/25"
										: "bg-white/3 border border-white/8 hover:bg-white/8"
								}
							`}
						>
							<span
								className={`
								w-1.5 h-1.5 rounded-full animate-pulse
								${
									isMounted && connectedPlayers.includes(player)
										? "bg-green-400"
										: "bg-red-400"
								}
							`}
							/>
							<span
								className={`text-xs ${
									player === playerName
										? "text-pink-300 font-medium"
										: "text-zinc-300"
								}`}
								style={{
									fontFamily:
										"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
								}}
							>
								{player}
							</span>
							{isMounted && !connectedPlayers.includes(player) && (
								<span className="text-red-400 text-xs opacity-75">offline</span>
							)}
						</div>
					))}
				</div>

				{/* Center Column - Round Info */}
				<div className="relative justify-self-center">
					<div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/8 to-pink-500/8 px-3 py-1 rounded-lg border border-purple-500/15 backdrop-blur-sm">
						<span className="text-2xl">🎯</span>
						<span
							className="text-white font-mono text-base font-bold"
							style={{
								fontFamily:
									"'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
							}}
						>
							Round {round}/6
						</span>
					</div>
				</div>

				{/* Right Column - Group Code */}
				<div className="relative justify-self-end">
					<div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/8 to-purple-500/8 px-2 py-1 rounded-md border border-blue-500/15 backdrop-blur-sm">
						<span
							className="text-blue-300 text-xs uppercase tracking-wide font-medium"
							style={{
								fontFamily:
									"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
							}}
						>
							Code
						</span>
						<button
							onClick={handleCopyCode}
							className="text-white font-mono text-xs font-medium cursor-pointer hover:text-blue-300 hover:bg-blue-500/15 focus:outline-none focus:ring-2 focus:ring-blue-400 px-1 py-0.5 rounded transition-all duration-200 hover:scale-105"
							title="Click to copy"
							style={{
								fontFamily:
									"'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
							}}
						>
							{groupCode}
						</button>
					</div>
					{isMounted && copied && (
						<motion.span
							initial={{ opacity: 0, y: 10, scale: 0.8 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -10, scale: 0.8 }}
							className="absolute top-10 right-0 text-xs text-green-300 bg-green-500/15 border border-green-500/25 px-2 py-1 rounded-md whitespace-nowrap backdrop-blur-sm z-20"
						>
							✓ Copied!
						</motion.span>
					)}
				</div>
			</div>

			{/* Presence message only when needed */}
			{isMounted && presenceMessage && (
				<div className="p-2 bg-red-900/20 backdrop-blur-md text-xs text-center text-yellow-400 animate-pulse border-b border-zinc-700/50 relative z-10">
					{presenceMessage}
				</div>
			)}

			<div className="flex-1 flex items-center justify-center p-4">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-6xl mx-auto text-center"
				>
					{/* Timer Display for Submission Phase */}
					{isMounted && phase === "submission" && timerActive && (
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

					{phase === "submission" && (
						<SubmissionPhase
							groupCode={groupCode}
							playerName={playerName}
							players={connectedPlayers.length > 0 ? connectedPlayers : players}
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
							players={connectedPlayers.length > 0 ? connectedPlayers : players}
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
											Disconnection Notice
										</span>
										<span className="text-red-400">💀</span>
									</div>
									<p className="text-red-200 text-sm">
										{getDisconnectedPlayers().length === 1
											? "Someone disappeared. Not everyone can handle the pressure."
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
								isProgressing={roundProgression}
							/>
						</>
					)}

					{phase === "insights" && (
						<InsightsPhase
							allRoundData={allRoundData}
							players={connectedPlayers.length > 0 ? connectedPlayers : players}
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
