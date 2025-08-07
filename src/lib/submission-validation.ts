import { Card, GameState, Player, Submission } from "@/types/game";
import { CARD_TYPES, GAME_PHASES } from "./constants";

export interface SubmissionValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface SubmissionData {
	promptCardId: string;
	responseCardIds: string[];
	playerId: string;
	gameId: string;
}

/**
 * Validates a card submission before it's sent to the server
 */
export function validateSubmission(
	submissionData: SubmissionData,
	gameState: GameState,
	players: Player[],
	cards: Card[],
	existingSubmissions: Submission[]
): SubmissionValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const { promptCardId, responseCardIds, playerId, gameId } = submissionData;

	// Check if game is in submission phase
	if (gameState.phase !== GAME_PHASES.SUBMISSION) {
		errors.push("Game is not in submission phase");
	}

	// Check if player exists and is connected
	const player = players.find((p) => p.id === playerId);
	if (!player) {
		errors.push("Player not found in game");
	} else if (!player.is_connected) {
		warnings.push("Player appears to be disconnected");
	}

	// Check if player has already submitted
	const existingSubmission = existingSubmissions.find(
		(sub) =>
			sub.player_id === playerId && sub.round_number === gameState.current_round
	);

	if (existingSubmission) {
		errors.push("Player has already submitted for this round");
	}

	// Validate prompt card
	const promptCard = cards.find((card) => card.id === promptCardId);
	if (!promptCard) {
		errors.push("Prompt card not found");
	} else {
		if (promptCard.type !== CARD_TYPES.PROMPT) {
			errors.push("Invalid prompt card type");
		}
		if (promptCard.game_id !== gameId) {
			errors.push("Prompt card does not belong to this game");
		}
		if (promptCard.round_number !== gameState.current_round) {
			errors.push("Prompt card is not for the current round");
		}
	}

	// Validate response cards
	if (!Array.isArray(responseCardIds) || responseCardIds.length === 0) {
		errors.push("At least one response card must be selected");
	} else {
		// Check each response card
		const responseCards = cards.filter((card) =>
			responseCardIds.includes(card.id)
		);

		if (responseCards.length !== responseCardIds.length) {
			errors.push("Some response cards were not found");
		}

		responseCards.forEach((card, index) => {
			if (card.type !== CARD_TYPES.RESPONSE) {
				errors.push(`Response card ${index + 1} has invalid type`);
			}
			if (card.game_id !== gameId) {
				errors.push(`Response card ${index + 1} does not belong to this game`);
			}
			if (card.round_number !== gameState.current_round) {
				errors.push(`Response card ${index + 1} is not for the current round`);
			}
			if (card.player_id !== playerId) {
				errors.push(
					`Response card ${index + 1} does not belong to this player`
				);
			}
		});

		// Check for duplicate response cards
		const uniqueCardIds = new Set(responseCardIds);
		if (uniqueCardIds.size !== responseCardIds.length) {
			errors.push("Duplicate response cards are not allowed");
		}

		// Check response card limits (configurable)
		const maxResponseCards = 3; // This could be made configurable
		if (responseCardIds.length > maxResponseCards) {
			errors.push(`Cannot select more than ${maxResponseCards} response cards`);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validates if a player can submit cards in the current game state
 */
export function canPlayerSubmit(
	playerId: string,
	gameState: GameState,
	players: Player[],
	existingSubmissions: Submission[]
): { canSubmit: boolean; reason?: string } {
	// Check if game is in submission phase
	if (gameState.phase !== GAME_PHASES.SUBMISSION) {
		return { canSubmit: false, reason: "Game is not in submission phase" };
	}

	// Check if player exists
	const player = players.find((p) => p.id === playerId);
	if (!player) {
		return { canSubmit: false, reason: "Player not found in game" };
	}

	// Check if player has already submitted
	const hasSubmitted = existingSubmissions.some(
		(sub) =>
			sub.player_id === playerId && sub.round_number === gameState.current_round
	);

	if (hasSubmitted) {
		return { canSubmit: false, reason: "Player has already submitted" };
	}

	return { canSubmit: true };
}

/**
 * Calculates submission statistics for the current round
 */
export function getSubmissionStats(
	gameState: GameState,
	players: Player[],
	submissions: Submission[]
) {
	const currentRoundSubmissions = submissions.filter(
		(sub) => sub.round_number === gameState.current_round
	);

	const totalPlayers = players.length;
	const submittedCount = currentRoundSubmissions.length;
	const pendingCount = totalPlayers - submittedCount;
	const completionPercentage =
		totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0;

	// Get players who have/haven't submitted
	const submittedPlayerIds = new Set(
		currentRoundSubmissions.map((sub) => sub.player_id)
	);

	const playersSubmitted = players.filter((player) =>
		submittedPlayerIds.has(player.id)
	);

	const playersPending = players.filter(
		(player) => !submittedPlayerIds.has(player.id)
	);

	return {
		total: totalPlayers,
		submitted: submittedCount,
		pending: pendingCount,
		completionPercentage,
		allSubmitted: submittedCount >= totalPlayers,
		playersSubmitted,
		playersPending,
		submissions: currentRoundSubmissions,
	};
}

/**
 * Formats submission data for display
 */
export function formatSubmissionForDisplay(
	submission: Submission,
	promptCard: Card,
	hidePlayerInfo: boolean = false
) {
	return {
		id: submission.id,
		playerId: hidePlayerInfo ? null : submission.player_id,
		promptCard,
		responseCards: submission.response_cards as Card[],
		votes: submission.votes,
		submittedAt: submission.submitted_at,
		roundNumber: submission.round_number,
	};
}

/**
 * Checks if all players have submitted for the current round
 */
export function areAllSubmissionsComplete(
	gameState: GameState,
	players: Player[],
	submissions: Submission[]
): boolean {
	const currentRoundSubmissions = submissions.filter(
		(sub) => sub.round_number === gameState.current_round
	);

	return currentRoundSubmissions.length >= players.length;
}
