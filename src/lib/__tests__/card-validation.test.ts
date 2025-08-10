import {
	validateCardSelection,
	canSelectCard,
	getSelectionStatusMessage,
} from "../card-validation";
import { Card } from "../../types/game";
import { CARD_TYPES } from "../constants";

describe("card-validation", () => {
	const mockPromptCard: Card = {
		id: "prompt-1",
		game_id: "game-1",
		round_number: 1,
		type: "prompt",
		text: "Test prompt card",
		created_at: "2023-01-01T00:00:00Z",
	};

	const mockResponseCards: Card[] = [
		{
			id: "response-1",
			game_id: "game-1",
			round_number: 1,
			type: "response",
			text: "Response card 1",
			created_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "response-2",
			game_id: "game-1",
			round_number: 1,
			type: "response",
			text: "Response card 2",
			created_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "response-3",
			game_id: "game-1",
			round_number: 1,
			type: "response",
			text: "Response card 3",
			created_at: "2023-01-01T00:00:00Z",
		},
	];

	describe("validateCardSelection", () => {
		it("should validate correct card selection", () => {
			const selectedCards = [mockResponseCards[0], mockResponseCards[1]];
			const result = validateCardSelection(selectedCards);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should require minimum response cards", () => {
			const selectedCards: Card[] = [];
			const result = validateCardSelection(selectedCards, {
				minResponseCards: 2,
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"At least 2 response cards must be selected"
			);
		});

		it("should enforce maximum response cards", () => {
			const selectedCards = [...mockResponseCards];
			const result = validateCardSelection(selectedCards, {
				maxResponseCards: 2,
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"No more than 2 response cards can be selected"
			);
		});

		it("should require prompt card when specified", () => {
			const selectedCards = [mockResponseCards[0]];
			const result = validateCardSelection(selectedCards, {
				requirePromptCard: true,
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("A prompt card must be selected");
		});

		it("should reject multiple prompt cards", () => {
			const multiplePrompts = [
				mockPromptCard,
				{ ...mockPromptCard, id: "prompt-2", text: "Another prompt" },
			];
			const result = validateCardSelection(multiplePrompts);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Only one prompt card can be selected");
		});

		it("should detect duplicate cards when not allowed", () => {
			const duplicateCards = [
				mockResponseCards[0],
				{ ...mockResponseCards[0], id: "duplicate" },
			];
			const result = validateCardSelection(duplicateCards, {
				allowDuplicates: false,
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Duplicate cards cannot be selected");
		});

		it("should allow duplicates when specified", () => {
			const duplicateCards = [
				mockResponseCards[0],
				{ ...mockResponseCards[0], id: "duplicate" },
			];
			const result = validateCardSelection(duplicateCards, {
				allowDuplicates: true,
			});

			expect(result.isValid).toBe(true);
		});

		it("should provide warnings for edge cases", () => {
			const selectedCards = mockResponseCards;
			const result = validateCardSelection(selectedCards, {
				maxResponseCards: 3,
			});

			expect(result.warnings).toContain(
				"Maximum number of response cards selected"
			);
		});
	});

	describe("canSelectCard", () => {
		it("should allow selecting valid card", () => {
			const currentSelection = [mockResponseCards[0]];
			const result = canSelectCard(mockResponseCards[1], currentSelection);

			expect(result.canSelect).toBe(true);
			expect(result.reason).toBeUndefined();
		});

		it("should reject already selected card", () => {
			const currentSelection = [mockResponseCards[0]];
			const result = canSelectCard(mockResponseCards[0], currentSelection);

			expect(result.canSelect).toBe(false);
			expect(result.reason).toBe("Card is already selected");
		});

		it("should reject duplicate text when not allowed", () => {
			const currentSelection = [mockResponseCards[0]];
			const duplicateCard = {
				...mockResponseCards[1],
				text: mockResponseCards[0].text,
			};
			const result = canSelectCard(duplicateCard, currentSelection, {
				allowDuplicates: false,
			});

			expect(result.canSelect).toBe(false);
			expect(result.reason).toBe("Duplicate card text not allowed");
		});

		it("should reject second prompt card", () => {
			const currentSelection = [mockPromptCard];
			const anotherPrompt = {
				...mockPromptCard,
				id: "prompt-2",
				text: "Another prompt",
			};
			const result = canSelectCard(anotherPrompt, currentSelection);

			expect(result.canSelect).toBe(false);
			expect(result.reason).toBe("Only one prompt card allowed");
		});

		it("should reject response card when at maximum", () => {
			const currentSelection = mockResponseCards.slice(0, 3);
			const anotherResponse = {
				...mockResponseCards[0],
				id: "response-4",
				text: "Another response",
			};
			const result = canSelectCard(anotherResponse, currentSelection, {
				maxResponseCards: 3,
			});

			expect(result.canSelect).toBe(false);
			expect(result.reason).toBe("Maximum 3 response cards allowed");
		});
	});

	describe("getSelectionStatusMessage", () => {
		it("should prompt for prompt card when required", () => {
			const selectedCards: Card[] = [];
			const message = getSelectionStatusMessage(selectedCards, {
				requirePromptCard: true,
			});

			expect(message).toBe("Select a prompt card to continue");
		});

		it("should prompt for more response cards", () => {
			const selectedCards: Card[] = [];
			const message = getSelectionStatusMessage(selectedCards, {
				minResponseCards: 2,
			});

			expect(message).toBe("Select 2 more response cards");
		});

		it("should indicate when ready to submit", () => {
			const selectedCards = mockResponseCards;
			const message = getSelectionStatusMessage(selectedCards, {
				maxResponseCards: 3,
			});

			expect(message).toBe("Maximum cards selected - ready to submit!");
		});

		it("should show current selection progress", () => {
			const selectedCards = [mockResponseCards[0]];
			const message = getSelectionStatusMessage(selectedCards, {
				maxResponseCards: 3,
			});

			expect(message).toBe("1/3 cards selected (2 more allowed)");
		});

		it("should handle singular/plural correctly", () => {
			const selectedCards: Card[] = [];
			const message = getSelectionStatusMessage(selectedCards, {
				minResponseCards: 1,
			});

			expect(message).toBe("Select 1 more response card");
		});
	});
});
