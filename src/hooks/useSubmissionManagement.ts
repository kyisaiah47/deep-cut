import { useState, useEffect, useCallback, useMemo } from "react";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "./useGameActions";
import { Card, Submission } from "@/types/game";
import { CARD_TYPES, GAME_PHASES } from "@/lib/constants";
import { GameError, GameStateError } from "@/lib/error-handling";

interface SubmissionValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

interface SubmissionStatus {
	hasSubmitted: boolean;
	canSubmit: boolean;
	timeRemaining: number;
	submissionCount: number;
	totalPlayers: number;
	allSubmitted: boolean;
}

interface UseSubmissionManagementOptions {
	onSubmissionComplete?: () => void;
	onError?: (error: GameError) => void;
	autoSubmitOnTimeout?: boolean;
	maxResponseCards?: number;
}

interface SubmissionManagementHook {
	// State
	selectedResponseCardIds: string[];
	isSubmitting: boolean;
	submissionError: string | null;
	submissionStatus: SubmissionStatus;

	// Cards
	promptCards: Card[];
	responseCards: Card[];
	availableCards: Card[];

	// Actions
	selectCard: (cardId: string) => void;
	deselectCard: (cardId: string) => void;
	clearSelection: () => void;
	submitCards: () => Promise<void>;
	validateSubmission: () => SubmissionValidation;

	// Computed values
	canSubmit: boolean;
	hasValidSelection: boolean;
	selectedCards: Card[];
}

export function useSubmissionManagement({
	onSubmissionComplete,
	onError,
	autoSubmitOnTimeout = true,
	maxResponseCards = 1,
}: UseSubmissionManagementOptions = {}): SubmissionManagementHook {
	const {
		gameState,
		currentPlayer,
		currentRoundCards,
		playerSubmissions,
		players,
		submissions,
	} = useGame();

	const { submitCards: submitCardsAction } = useGameActions({ onError });

	const [selectedResponseCardIds, setSelectedResponseCardIds] = useState<
		string[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionError, setSubmissionError] = useState<string | null>(null);

	// Reset state when round changes
	useEffect(() => {
		setSelectedResponseCardIds([]);
		setSubmissionError(null);
		setIsSubmitting(false);
	}, [gameState?.current_round]);

	// Get player's cards for current round
	const { promptCards, responseCards } = useMemo(() => {
		if (!currentPlayer || !gameState) {
			return { promptCards: [], responseCards: [] };
		}

		const playerPromptCards = currentRoundCards.filter(
			(card) =>
				card.type === CARD_TYPES.PROMPT && card.player_id === currentPlayer.id
		);

		const playerResponseCards = currentRoundCards.filter(
			(card) =>
				card.type === CARD_TYPES.RESPONSE && card.player_id === currentPlayer.id
		);

		return {
			promptCards: playerPromptCards,
			responseCards: playerResponseCards,
		};
	}, [currentRoundCards, currentPlayer, gameState]);

	// Get available cards (all player cards)
	const availableCards = useMemo(() => {
		return [...promptCards, ...responseCards];
	}, [promptCards, responseCards]);

	// Get selected cards
	const selectedCards = useMemo(() => {
		return responseCards.filter((card) =>
			selectedResponseCardIds.includes(card.id)
		);
	}, [responseCards, selectedResponseCardIds]);

	// Calculate submission status
	const submissionStatus = useMemo((): SubmissionStatus => {
		const hasSubmitted = playerSubmissions.some(
			(sub) =>
				sub.player_id === currentPlayer?.id &&
				sub.round_number === gameState?.current_round
		);

		const submissionCount = submissions.filter(
			(sub) => sub.round_number === gameState?.current_round
		).length;

		const totalPlayers = players.length;
		const allSubmitted = submissionCount >= totalPlayers;

		const canSubmit =
			!hasSubmitted &&
			gameState?.phase === GAME_PHASES.SUBMISSION &&
			promptCards.length > 0 &&
			responseCards.length > 0;

		return {
			hasSubmitted,
			canSubmit,
			timeRemaining: gameState?.submission_timer || 0,
			submissionCount,
			totalPlayers,
			allSubmitted,
		};
	}, [
		playerSubmissions,
		currentPlayer,
		gameState,
		submissions,
		players,
		promptCards,
		responseCards,
	]);

	// Validate current selection
	const validateSubmission = useCallback((): SubmissionValidation => {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check if player has submitted
		if (submissionStatus.hasSubmitted) {
			errors.push("You have already submitted for this round");
		}

		// Check if in correct phase
		if (gameState?.phase !== GAME_PHASES.SUBMISSION) {
			errors.push("Not in submission phase");
		}

		// Check if prompt card exists
		if (promptCards.length === 0) {
			errors.push("No prompt card available");
		}

		// Check if response cards are selected
		if (selectedResponseCardIds.length === 0) {
			errors.push("Please select at least one response card");
		}

		// Check maximum selection limit
		if (selectedResponseCardIds.length > maxResponseCards) {
			errors.push(`Cannot select more than ${maxResponseCards} response cards`);
		}

		// Check if selected cards exist and belong to player
		const invalidCards = selectedResponseCardIds.filter(
			(cardId) => !responseCards.some((card) => card.id === cardId)
		);

		if (invalidCards.length > 0) {
			errors.push("Some selected cards are invalid");
		}

		// Warnings
		if (selectedResponseCardIds.length < maxResponseCards) {
			warnings.push(`You can select up to ${maxResponseCards} response cards`);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}, [
		submissionStatus.hasSubmitted,
		gameState?.phase,
		promptCards,
		selectedResponseCardIds,
		maxResponseCards,
		responseCards,
	]);

	// Check if current selection is valid for submission
	const hasValidSelection = useMemo(() => {
		return validateSubmission().isValid;
	}, [validateSubmission]);

	// Check if can submit
	const canSubmit = useMemo(() => {
		return submissionStatus.canSubmit && hasValidSelection && !isSubmitting;
	}, [submissionStatus.canSubmit, hasValidSelection, isSubmitting]);

	// Select a card
	const selectCard = useCallback(
		(cardId: string) => {
			// Only allow selecting response cards
			const card = responseCards.find((c) => c.id === cardId);
			if (!card) return;

			setSelectedResponseCardIds((prev) => {
				// If already selected, do nothing
				if (prev.includes(cardId)) return prev;

				// If at max limit, replace the first selected card
				if (prev.length >= maxResponseCards) {
					return [...prev.slice(1), cardId];
				}

				// Add to selection
				return [...prev, cardId];
			});

			setSubmissionError(null);
		},
		[responseCards, maxResponseCards]
	);

	// Deselect a card
	const deselectCard = useCallback((cardId: string) => {
		setSelectedResponseCardIds((prev) => prev.filter((id) => id !== cardId));
		setSubmissionError(null);
	}, []);

	// Clear all selections
	const clearSelection = useCallback(() => {
		setSelectedResponseCardIds([]);
		setSubmissionError(null);
	}, []);

	// Submit cards
	const submitCards = useCallback(async () => {
		const validation = validateSubmission();
		if (!validation.isValid) {
			setSubmissionError(validation.errors[0] || "Invalid submission");
			return;
		}

		const promptCard = promptCards[0];
		if (!promptCard) {
			setSubmissionError("No prompt card available");
			return;
		}

		setIsSubmitting(true);
		setSubmissionError(null);

		try {
			await submitCardsAction(promptCard.id, selectedResponseCardIds);
			onSubmissionComplete?.();
		} catch (error) {
			const errorMessage =
				error instanceof GameError ? error.message : "Failed to submit cards";
			setSubmissionError(errorMessage);
			onError?.(
				error instanceof GameError ? error : new GameStateError(errorMessage)
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		validateSubmission,
		promptCards,
		selectedResponseCardIds,
		submitCardsAction,
		onSubmissionComplete,
		onError,
	]);

	// Auto-submit when timer expires (if enabled)
	useEffect(() => {
		if (
			!autoSubmitOnTimeout ||
			submissionStatus.hasSubmitted ||
			!submissionStatus.canSubmit
		) {
			return;
		}

		// Auto-select first response card if none selected
		if (selectedResponseCardIds.length === 0 && responseCards.length > 0) {
			setSelectedResponseCardIds([responseCards[0].id]);
		}
	}, [
		autoSubmitOnTimeout,
		submissionStatus.hasSubmitted,
		submissionStatus.canSubmit,
		selectedResponseCardIds.length,
		responseCards,
	]);

	return {
		// State
		selectedResponseCardIds,
		isSubmitting,
		submissionError,
		submissionStatus,

		// Cards
		promptCards,
		responseCards,
		availableCards,

		// Actions
		selectCard,
		deselectCard,
		clearSelection,
		submitCards,
		validateSubmission,

		// Computed values
		canSubmit,
		hasValidSelection,
		selectedCards,
	};
}
