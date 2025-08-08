import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "./Timer";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "@/hooks/useGameActions";
import { Submission, Card } from "@/types/game";
import { GAME_PHASES } from "@/lib/constants";

interface VotingInterfaceProps {
	onVotingComplete?: () => void;
	className?: string;
}

interface SubmissionWithCards extends Submission {
	promptCard: Card;
	responseCardsData: Card[];
}

export function VotingInterface({
	onVotingComplete,
	className = "",
}: VotingInterfaceProps) {
	const {
		gameState,
		currentPlayer,
		submissions,
		votes,
		players,
		currentRoundCards,
	} = useGame();

	const { submitVote } = useGameActions();

	const [selectedSubmissionId, setSelectedSubmissionId] = useState<
		string | null
	>(null);
	const [isVoting, setIsVoting] = useState(false);
	const [votingError, setVotingError] = useState<string | null>(null);
	const [hasVoted, setHasVoted] = useState(false);

	// Check if current player has already voted
	useEffect(() => {
		if (currentPlayer && gameState) {
			const playerVote = votes.find(
				(vote) =>
					vote.player_id === currentPlayer.id &&
					vote.round_number === gameState.current_round
			);
			setHasVoted(!!playerVote);
		}
	}, [currentPlayer, gameState, votes]);

	// Reset state when round changes
	useEffect(() => {
		setSelectedSubmissionId(null);
		setVotingError(null);
		setIsVoting(false);
	}, [gameState?.current_round]);

	// Get submissions for current round with card data
	const currentRoundSubmissions = useMemo((): SubmissionWithCards[] => {
		if (!gameState) return [];

		return submissions
			.filter((sub) => sub.round_number === gameState.current_round)
			.map((submission) => {
				// Find the prompt card
				const promptCard = currentRoundCards.find(
					(card) => card.id === submission.prompt_card_id
				);

				// Find the response cards from the submission data
				const responseCardsData = submission.response_cards || [];

				return {
					...submission,
					promptCard: promptCard || {
						id: submission.prompt_card_id,
						game_id: submission.game_id,
						round_number: submission.round_number,
						type: "prompt" as const,
						text: "Unknown prompt",
						created_at: "",
					},
					responseCardsData,
				};
			})
			.filter((sub) => sub.player_id !== currentPlayer?.id); // Don't show player's own submission
	}, [submissions, gameState, currentRoundCards, currentPlayer]);

	// Calculate voting status
	const votingStatus = useMemo(() => {
		const eligibleVoters = players.filter(
			(player) =>
				!currentRoundSubmissions.some((sub) => sub.player_id === player.id)
		);
		const votesThisRound = votes.filter(
			(vote) => vote.round_number === gameState?.current_round
		);

		return {
			voted: votesThisRound.length,
			total: eligibleVoters.length,
			percentage:
				eligibleVoters.length > 0
					? (votesThisRound.length / eligibleVoters.length) * 100
					: 0,
			allVoted: votesThisRound.length >= eligibleVoters.length,
		};
	}, [players, currentRoundSubmissions, votes, gameState?.current_round]);

	// Handle submission selection
	const handleSubmissionSelect = useCallback(
		(submissionId: string) => {
			if (hasVoted) return;
			setSelectedSubmissionId(submissionId);
			setVotingError(null);
		},
		[hasVoted]
	);

	// Handle vote submission
	const handleVote = useCallback(async () => {
		if (!selectedSubmissionId || !currentPlayer || !gameState || hasVoted) {
			setVotingError("Please select a submission to vote for");
			return;
		}

		setIsVoting(true);
		setVotingError(null);

		try {
			await submitVote(selectedSubmissionId);
			setHasVoted(true);
			onVotingComplete?.();
		} catch (error) {
			setVotingError(
				error instanceof Error ? error.message : "Failed to submit vote"
			);
		} finally {
			setIsVoting(false);
		}
	}, [
		selectedSubmissionId,
		currentPlayer,
		gameState,
		hasVoted,
		submitVote,
		onVotingComplete,
	]);

	// Handle automatic voting when timer expires
	const handleTimerExpire = useCallback(async () => {
		if (hasVoted || !currentPlayer) return;

		// Auto-vote for selected submission, or first submission if none selected
		const submissionToVote =
			selectedSubmissionId || currentRoundSubmissions[0]?.id;

		if (submissionToVote) {
			try {
				await submitVote(submissionToVote);
				setHasVoted(true);

				// Trigger voting completion check
				onVotingComplete?.();
			} catch (error) {
				console.error("Auto-voting failed:", error);
				setVotingError("Failed to auto-submit vote");
			}
		}
	}, [
		hasVoted,
		currentPlayer,
		selectedSubmissionId,
		currentRoundSubmissions,
		submitVote,
		onVotingComplete,
	]);

	// Don't render if not in voting phase
	if (gameState?.phase !== GAME_PHASES.VOTING) {
		return null;
	}

	// Don't render if no submissions available
	if (currentRoundSubmissions.length === 0) {
		return (
			<div className={`text-center py-8 ${className}`}>
				<p className="text-gray-500 text-lg">
					Waiting for submissions to be available for voting...
				</p>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className={`space-y-6 ${className}`}
		>
			{/* Header with timer and status */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
				<div className="text-center sm:text-left">
					<h2 className="text-xl font-bold text-gray-900">
						{hasVoted ? "Vote Submitted!" : "Vote for the Funniest"}
					</h2>
					<p className="text-sm text-gray-600">
						{hasVoted
							? "Waiting for other players to vote..."
							: "Select the submission you think is the funniest"}
					</p>
				</div>

				{!hasVoted && (
					<Timer
						duration={gameState?.voting_timer || 30}
						onExpire={handleTimerExpire}
						isActive={!hasVoted}
						label="Voting Time"
						className="flex-shrink-0"
					/>
				)}
			</div>

			{/* Voting status indicator */}
			<div className="bg-white border rounded-lg p-4">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-gray-700">
						Voting Progress
					</span>
					<span className="text-sm text-gray-600">
						{votingStatus.voted}/{votingStatus.total} votes
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<motion.div
						className="bg-purple-500 h-2 rounded-full"
						initial={{ width: "0%" }}
						animate={{ width: `${votingStatus.percentage}%` }}
						transition={{ duration: 0.5 }}
					/>
				</div>
			</div>

			{/* Submissions display */}
			<AnimatePresence mode="wait">
				{hasVoted ? (
					<motion.div
						key="voted"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="text-center py-12 bg-purple-50 border border-purple-200 rounded-lg"
					>
						<div className="text-purple-600 text-4xl mb-4">🗳️</div>
						<h3 className="text-lg font-semibold text-purple-800 mb-2">
							Vote Submitted Successfully!
						</h3>
						<p className="text-purple-700">
							Waiting for {votingStatus.total - votingStatus.voted} more votes.
						</p>
					</motion.div>
				) : (
					<motion.div
						key="voting"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="space-y-4"
					>
						{/* Submissions grid */}
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{currentRoundSubmissions.map((submission, index) => (
								<motion.div
									key={submission.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className={`
										relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
										${
											selectedSubmissionId === submission.id
												? "border-purple-500 bg-purple-50 shadow-lg"
												: "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
										}
									`}
									onClick={() => handleSubmissionSelect(submission.id)}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									{/* Selection indicator */}
									{selectedSubmissionId === submission.id && (
										<motion.div
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
										>
											<span className="text-white text-sm">✓</span>
										</motion.div>
									)}

									{/* Prompt card */}
									<div className="mb-3">
										<div className="text-xs font-medium text-gray-500 mb-1">
											PROMPT
										</div>
										<div className="p-3 bg-gray-900 text-white rounded-lg text-sm font-medium">
											{submission.promptCard.text}
										</div>
									</div>

									{/* Response cards */}
									<div className="space-y-2">
										<div className="text-xs font-medium text-gray-500">
											RESPONSE
										</div>
										{submission.responseCardsData.map((card, cardIndex) => (
											<div
												key={cardIndex}
												className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
											>
												{card.text}
											</div>
										))}
									</div>

									{/* Vote count and player reveal (shown after voting ends) */}
									{votingStatus.allVoted && (
										<div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
											<div className="flex items-center justify-between">
												<Badge
													variant="secondary"
													className="text-xs"
												>
													{submission.votes} vote
													{submission.votes !== 1 ? "s" : ""}
												</Badge>
												{/* Show winner indicator */}
												{submission.votes > 0 &&
													submission.votes ===
														Math.max(
															...currentRoundSubmissions.map((s) => s.votes)
														) && (
														<Badge
															variant="default"
															className="text-xs bg-yellow-500 text-white"
														>
															🏆 Winner
														</Badge>
													)}
											</div>
											{/* Reveal player name */}
											<div className="text-xs text-gray-600">
												Submitted by:{" "}
												{players.find((p) => p.id === submission.player_id)
													?.name || "Unknown Player"}
											</div>
										</div>
									)}
								</motion.div>
							))}
						</div>

						{/* Error message */}
						{votingError && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 bg-red-50 border border-red-200 rounded-lg"
							>
								<p className="text-red-700 text-sm">{votingError}</p>
							</motion.div>
						)}

						{/* Vote button */}
						<div className="flex justify-center">
							<Button
								onClick={handleVote}
								disabled={isVoting || hasVoted || !selectedSubmissionId}
								size="lg"
								className="min-w-32"
							>
								{isVoting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
										Voting...
									</>
								) : (
									"Submit Vote"
								)}
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
