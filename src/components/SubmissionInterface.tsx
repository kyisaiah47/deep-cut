import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardDisplay } from "./CardDisplay";
import { Timer } from "./Timer";
import { Button } from "./ui/button";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "@/hooks/useGameActions";
import { Card } from "@/types/game";
import { CARD_TYPES, GAME_PHASES } from "@/lib/constants";

interface SubmissionInterfaceProps {
	onSubmissionComplete?: () => void;
	className?: string;
}

export function SubmissionInterface({
	onSubmissionComplete,
	className = "",
}: SubmissionInterfaceProps) {
	const {
		gameState,
		currentPlayer,
		currentRoundCards,
		playerSubmissions,
		players,
		submissions,
	} = useGame();

	const { submitCards } = useGameActions();

	const [selectedResponseCardIds, setSelectedResponseCardIds] = useState<
		string[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionError, setSubmissionError] = useState<string | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);

	// Check if current player has already submitted
	useEffect(() => {
		if (currentPlayer && gameState) {
			const playerSubmission = playerSubmissions.find(
				(sub) =>
					sub.player_id === currentPlayer.id &&
					sub.round_number === gameState.current_round
			);
			setHasSubmitted(!!playerSubmission);
		}
	}, [currentPlayer, gameState, playerSubmissions]);

	// Reset selection when round changes
	useEffect(() => {
		setSelectedResponseCardIds([]);
		setSubmissionError(null);
		setIsSubmitting(false);
	}, [gameState?.current_round]);

	// Get cards for current player
	const playerCards = useMemo(() => {
		if (!currentPlayer) return { promptCards: [], responseCards: [] };

		const promptCards = currentRoundCards.filter(
			(card) =>
				card.type === CARD_TYPES.PROMPT && card.player_id === currentPlayer.id
		);

		const responseCards = currentRoundCards.filter(
			(card) =>
				card.type === CARD_TYPES.RESPONSE && card.player_id === currentPlayer.id
		);

		return { promptCards, responseCards };
	}, [currentRoundCards, currentPlayer]);

	// Handle card selection
	const handleCardSelect = useCallback((cardId: string) => {
		setSelectedResponseCardIds((prev) => {
			if (prev.includes(cardId)) {
				// Deselect card
				return prev.filter((id) => id !== cardId);
			} else {
				// Select card (limit to 1 for now, can be made configurable)
				return [cardId];
			}
		});
		setSubmissionError(null);
	}, []);

	// Handle submission
	const handleSubmit = useCallback(async () => {
		if (!currentPlayer || !gameState || selectedResponseCardIds.length === 0) {
			setSubmissionError("Please select at least one response card");
			return;
		}

		const promptCard = playerCards.promptCards[0];
		if (!promptCard) {
			setSubmissionError("No prompt card available");
			return;
		}

		setIsSubmitting(true);
		setSubmissionError(null);

		try {
			await submitCards(promptCard.id, selectedResponseCardIds);
			setHasSubmitted(true);
			onSubmissionComplete?.();
		} catch (error) {
			setSubmissionError(
				error instanceof Error ? error.message : "Failed to submit cards"
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		currentPlayer,
		gameState,
		selectedResponseCardIds,
		playerCards.promptCards,
		submitCards,
		onSubmissionComplete,
	]);

	// Handle automatic submission when timer expires
	const handleTimerExpire = useCallback(async () => {
		if (
			hasSubmitted ||
			!currentPlayer ||
			selectedResponseCardIds.length === 0
		) {
			return;
		}

		// Auto-submit with selected cards, or select first card if none selected
		const cardsToSubmit =
			selectedResponseCardIds.length > 0
				? selectedResponseCardIds
				: playerCards.responseCards.slice(0, 1).map((card) => card.id);

		if (cardsToSubmit.length > 0) {
			const promptCard = playerCards.promptCards[0];
			if (promptCard) {
				try {
					await submitCards(promptCard.id, cardsToSubmit);
					setHasSubmitted(true);
				} catch (error) {
					console.error("Auto-submission failed:", error);
				}
			}
		}
	}, [
		hasSubmitted,
		currentPlayer,
		selectedResponseCardIds,
		playerCards,
		submitCards,
	]);

	// Calculate submission status for all players
	const submissionStatus = useMemo(() => {
		const totalPlayers = players.length;
		const submittedCount = submissions.filter(
			(sub) => sub.round_number === gameState?.current_round
		).length;

		return {
			submitted: submittedCount,
			total: totalPlayers,
			percentage: totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0,
		};
	}, [players, submissions, gameState?.current_round]);

	// Don't render if not in submission phase
	if (gameState?.phase !== GAME_PHASES.SUBMISSION) {
		return null;
	}

	// Don't render if no cards available
	if (
		playerCards.promptCards.length === 0 ||
		playerCards.responseCards.length === 0
	) {
		return (
			<div className={`text-center py-8 ${className}`}>
				<p className="text-gray-500 text-lg">
					Waiting for cards to be distributed...
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
						{hasSubmitted ? "Submission Complete!" : "Submit Your Cards"}
					</h2>
					<p className="text-sm text-gray-600">
						{hasSubmitted
							? "Waiting for other players..."
							: "Select your response cards and submit before time runs out"}
					</p>
				</div>

				{!hasSubmitted && (
					<Timer
						duration={gameState?.submission_timer || 60}
						onExpire={handleTimerExpire}
						isActive={!hasSubmitted}
						label="Time Remaining"
						className="flex-shrink-0"
					/>
				)}
			</div>

			{/* Submission status indicator */}
			<div className="bg-white border rounded-lg p-4">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-gray-700">
						Submission Progress
					</span>
					<span className="text-sm text-gray-600">
						{submissionStatus.submitted}/{submissionStatus.total} players
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<motion.div
						className="bg-blue-500 h-2 rounded-full"
						initial={{ width: "0%" }}
						animate={{ width: `${submissionStatus.percentage}%` }}
						transition={{ duration: 0.5 }}
					/>
				</div>
			</div>

			{/* Card display */}
			<AnimatePresence mode="wait">
				{hasSubmitted ? (
					<motion.div
						key="submitted"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="text-center py-12 bg-green-50 border border-green-200 rounded-lg"
					>
						<div className="text-green-600 text-4xl mb-4">✓</div>
						<h3 className="text-lg font-semibold text-green-800 mb-2">
							Cards Submitted Successfully!
						</h3>
						<p className="text-green-700">
							Waiting for {submissionStatus.total - submissionStatus.submitted}{" "}
							more players to submit their cards.
						</p>
					</motion.div>
				) : (
					<motion.div
						key="submission"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="space-y-6"
					>
						{/* Cards display */}
						<CardDisplay
							cards={[...playerCards.promptCards, ...playerCards.responseCards]}
							selectedCardIds={selectedResponseCardIds}
							onCardSelect={handleCardSelect}
							selectable={!hasSubmitted}
							maxSelections={1} // Can be made configurable
							title="Your Cards"
						/>

						{/* Error message */}
						{submissionError && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3 bg-red-50 border border-red-200 rounded-lg"
							>
								<p className="text-red-700 text-sm">{submissionError}</p>
							</motion.div>
						)}

						{/* Submit button */}
						<div className="flex justify-center">
							<Button
								onClick={handleSubmit}
								disabled={
									isSubmitting ||
									hasSubmitted ||
									selectedResponseCardIds.length === 0
								}
								size="lg"
								className="min-w-32"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
										Submitting...
									</>
								) : (
									"Submit Cards"
								)}
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
