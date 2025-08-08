"use client";

import { useCallback } from "react";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "@/hooks/useGameActions";
import { useSubmissionManagement } from "@/hooks/useSubmissionManagement";
import { useVotingManagement } from "@/hooks/useVotingManagement";

export function useAutoActions() {
	const { gameState, currentPlayer, currentRoundCards } = useGame();
	const { submitCards } = useGameActions();
	const { selectedCards } = useSubmissionManagement();
	const {
		selectedSubmissionId,
		availableSubmissions,
		submitVote,
		selectSubmission,
	} = useVotingManagement();

	// Auto-submit cards when submission timer expires
	const handleAutoSubmission = useCallback(async () => {
		if (!currentPlayer || !gameState) {
			return;
		}

		// Check if player has already submitted
		const hasSubmitted = selectedCards.length > 0; // This would need to be checked properly
		if (hasSubmitted) {
			return;
		}

		// Get player's cards for current round
		const playerCards = currentRoundCards.filter(
			(card) => card.player_id === currentPlayer.id
		);

		const promptCards = playerCards.filter((card) => card.type === "prompt");
		const responseCards = playerCards.filter(
			(card) => card.type === "response"
		);

		if (promptCards.length === 0 || responseCards.length === 0) {
			console.warn("No cards available for auto-submission");
			return;
		}

		// Auto-submit with selected cards, or select first card if none selected
		const cardsToSubmit =
			selectedCards.length > 0
				? selectedCards.map((card) => card.id)
				: responseCards.slice(0, 1).map((card) => card.id);

		if (cardsToSubmit.length > 0) {
			const promptCard = promptCards[0];
			try {
				await submitCards(promptCard.id, cardsToSubmit);
				console.log("Auto-submission completed");
			} catch (error) {
				console.error("Auto-submission failed:", error);
				throw error;
			}
		}
	}, [currentPlayer, gameState, currentRoundCards, selectedCards, submitCards]);

	// Auto-vote when voting timer expires
	const handleAutoVoting = useCallback(async () => {
		if (!currentPlayer || !gameState) {
			return;
		}

		// Auto-vote for selected submission, or first submission if none selected
		const submissionToVote =
			selectedSubmissionId || availableSubmissions[0]?.id;

		if (submissionToVote) {
			try {
				// Select the submission if not already selected
				if (!selectedSubmissionId && availableSubmissions[0]) {
					selectSubmission(availableSubmissions[0].id);
				}
				await submitVote();
				console.log("Auto-voting completed");
			} catch (error) {
				console.error("Auto-voting failed:", error);
				throw error;
			}
		}
	}, [
		currentPlayer,
		gameState,
		selectedSubmissionId,
		availableSubmissions,
		submitVote,
		selectSubmission,
	]);

	return {
		handleAutoSubmission,
		handleAutoVoting,
	};
}
