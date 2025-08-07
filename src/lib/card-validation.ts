import { Card } from "../types/game";
import { CARD_TYPES } from "./constants";

export interface CardSelectionValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface CardSelectionRules {
	minResponseCards?: number;
	maxResponseCards?: number;
	requirePromptCard?: boolean;
	allowDuplicates?: boolean;
}

/**
 * Validates card selection based on game rules
 */
export function validateCardSelection(
	selectedCards: Card[],
	rules: CardSelectionRules = {}
): CardSelectionValidation {
	const {
		minResponseCards = 1,
		maxResponseCards = 3,
		requirePromptCard = false,
		allowDuplicates = false,
	} = rules;

	const errors: string[] = [];
	const warnings: string[] = [];

	// Separate cards by type
	const promptCards = selectedCards.filter(
		(card) => card.type === CARD_TYPES.PROMPT
	);
	const responseCards = selectedCards.filter(
		(card) => card.type === CARD_TYPES.RESPONSE
	);

	// Check prompt card requirement
	if (requirePromptCard && promptCards.length === 0) {
		errors.push("A prompt card must be selected");
	}

	if (promptCards.length > 1) {
		errors.push("Only one prompt card can be selected");
	}

	// Check response card count
	if (responseCards.length < minResponseCards) {
		errors.push(
			`At least ${minResponseCards} response card${
				minResponseCards > 1 ? "s" : ""
			} must be selected`
		);
	}

	if (responseCards.length > maxResponseCards) {
		errors.push(
			`No more than ${maxResponseCards} response card${
				maxResponseCards > 1 ? "s" : ""
			} can be selected`
		);
	}

	// Check for duplicates
	if (!allowDuplicates) {
		const cardTexts = selectedCards.map((card) => card.text);
		const uniqueTexts = new Set(cardTexts);
		if (cardTexts.length !== uniqueTexts.size) {
			errors.push("Duplicate cards cannot be selected");
		}
	}

	// Warnings for edge cases
	if (responseCards.length === maxResponseCards) {
		warnings.push("Maximum number of response cards selected");
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Checks if a card can be selected given current selection and rules
 */
export function canSelectCard(
	card: Card,
	currentSelection: Card[],
	rules: CardSelectionRules = {}
): { canSelect: boolean; reason?: string } {
	const { maxResponseCards = 3, allowDuplicates = false } = rules;

	// Check if card is already selected
	if (currentSelection.some((selected) => selected.id === card.id)) {
		return { canSelect: false, reason: "Card is already selected" };
	}

	// Check for duplicates
	if (
		!allowDuplicates &&
		currentSelection.some((selected) => selected.text === card.text)
	) {
		return { canSelect: false, reason: "Duplicate card text not allowed" };
	}

	// Check prompt card limits
	if (card.type === CARD_TYPES.PROMPT) {
		const promptCount = currentSelection.filter(
			(c) => c.type === CARD_TYPES.PROMPT
		).length;
		if (promptCount >= 1) {
			return { canSelect: false, reason: "Only one prompt card allowed" };
		}
	}

	// Check response card limits
	if (card.type === CARD_TYPES.RESPONSE) {
		const responseCount = currentSelection.filter(
			(c) => c.type === CARD_TYPES.RESPONSE
		).length;
		if (responseCount >= maxResponseCards) {
			return {
				canSelect: false,
				reason: `Maximum ${maxResponseCards} response cards allowed`,
			};
		}
	}

	return { canSelect: true };
}

/**
 * Gets selection status message for UI display
 */
export function getSelectionStatusMessage(
	selectedCards: Card[],
	rules: CardSelectionRules = {}
): string {
	const {
		minResponseCards = 1,
		maxResponseCards = 3,
		requirePromptCard = false,
	} = rules;

	const responseCards = selectedCards.filter(
		(card) => card.type === CARD_TYPES.RESPONSE
	);
	const promptCards = selectedCards.filter(
		(card) => card.type === CARD_TYPES.PROMPT
	);

	if (requirePromptCard && promptCards.length === 0) {
		return "Select a prompt card to continue";
	}

	if (responseCards.length < minResponseCards) {
		const needed = minResponseCards - responseCards.length;
		return `Select ${needed} more response card${needed > 1 ? "s" : ""}`;
	}

	if (responseCards.length === maxResponseCards) {
		return "Maximum cards selected - ready to submit!";
	}

	const remaining = maxResponseCards - responseCards.length;
	return `${responseCards.length}/${maxResponseCards} cards selected (${remaining} more allowed)`;
}
