import { renderHook, act, waitFor } from "@testing-library/react";
import {
	useCardGeneration,
	useGameCards,
	useCardDistribution,
} from "../useCardGeneration";
import * as cardGeneration from "../../lib/card-generation";

// Mock the card generation library
jest.mock("../../lib/card-generation");

const mockCardGeneration = cardGeneration as jest.Mocked<typeof cardGeneration>;

describe("useCardGeneration", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("useCardGeneration hook", () => {
		it("should initialize with default state", () => {
			const { result } = renderHook(() => useCardGeneration());

			expect(result.current.isGenerating).toBe(false);
			expect(result.current.generationError).toBeNull();
			expect(result.current.lastGenerationResult).toBeNull();
		});

		it("should generate cards successfully", async () => {
			const mockResult = {
				success: true,
				cardsGenerated: 25,
				responseCardsCount: 24,
				promptCard: {
					id: "prompt-1",
					type: "prompt" as const,
					text: "Test prompt",
				},
			};

			mockCardGeneration.generateCards.mockResolvedValue(mockResult);

			const { result } = renderHook(() => useCardGeneration());

			let generationResult;
			await act(async () => {
				generationResult = await result.current.generateCardsForRound({
					gameId: "game-1",
					roundNumber: 1,
					playerCount: 4,
				});
			});

			expect(result.current.isGenerating).toBe(false);
			expect(result.current.generationError).toBeNull();
			expect(result.current.lastGenerationResult).toEqual(mockResult);
			expect(generationResult).toEqual(mockResult);
		});

		it("should handle generation failure", async () => {
			const mockResult = {
				success: false,
				cardsGenerated: 0,
				responseCardsCount: 0,
				error: "AI generation failed",
			};

			mockCardGeneration.generateCards.mockResolvedValue(mockResult);

			const { result } = renderHook(() => useCardGeneration());

			await act(async () => {
				await result.current.generateCardsForRound({
					gameId: "game-1",
					roundNumber: 1,
					playerCount: 4,
				});
			});

			expect(result.current.isGenerating).toBe(false);
			expect(result.current.generationError).toBe("AI generation failed");
			expect(result.current.lastGenerationResult).toEqual(mockResult);
		});

		it("should handle generation exception", async () => {
			const error = new Error("Network error");
			mockCardGeneration.generateCards.mockRejectedValue(error);

			const { result } = renderHook(() => useCardGeneration());

			await act(async () => {
				const generationResult = await result.current.generateCardsForRound({
					gameId: "game-1",
					roundNumber: 1,
					playerCount: 4,
				});

				expect(generationResult.success).toBe(false);
				expect(generationResult.error).toBe("Network error");
			});

			expect(result.current.isGenerating).toBe(false);
			expect(result.current.generationError).toBe("Network error");
		});

		it("should set isGenerating during generation", async () => {
			let resolveGeneration: (value: any) => void;
			const generationPromise = new Promise((resolve) => {
				resolveGeneration = resolve;
			});

			mockCardGeneration.generateCards.mockReturnValue(generationPromise);

			const { result } = renderHook(() => useCardGeneration());

			act(() => {
				result.current.generateCardsForRound({
					gameId: "game-1",
					roundNumber: 1,
					playerCount: 4,
				});
			});

			expect(result.current.isGenerating).toBe(true);

			await act(async () => {
				resolveGeneration!({
					success: true,
					cardsGenerated: 25,
					responseCardsCount: 24,
				});
				await generationPromise;
			});

			expect(result.current.isGenerating).toBe(false);
		});

		it("should clear error", () => {
			const { result } = renderHook(() => useCardGeneration());

			act(() => {
				// Manually set error for testing
				(result.current as any).setGenerationError("Test error");
			});

			act(() => {
				result.current.clearError();
			});

			expect(result.current.generationError).toBeNull();
		});

		it("should clear cache", () => {
			const { result } = renderHook(() => useCardGeneration());

			act(() => {
				result.current.clearCache();
			});

			expect(mockCardGeneration.clearExpiredCache).toHaveBeenCalled();
		});

		it("should clear expired cache periodically", () => {
			renderHook(() => useCardGeneration());

			// Fast-forward time by 1 minute
			act(() => {
				jest.advanceTimersByTime(60000);
			});

			expect(mockCardGeneration.clearExpiredCache).toHaveBeenCalled();
		});
	});

	describe("useGameCards hook", () => {
		const mockCards = [
			{
				id: "card-1",
				game_id: "game-1",
				round_number: 1,
				type: "prompt" as const,
				text: "Test prompt",
				created_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "card-2",
				game_id: "game-1",
				round_number: 1,
				type: "response" as const,
				text: "Test response",
				created_at: "2023-01-01T00:00:00Z",
			},
		];

		it("should initialize with default state", () => {
			const { result } = renderHook(() => useGameCards());

			expect(result.current.cards).toEqual([]);
			expect(result.current.promptCard).toBeNull();
			expect(result.current.responseCards).toEqual([]);
			expect(result.current.playerCards).toEqual([]);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it("should load cards for round successfully", async () => {
			const promptCard = mockCards[0];
			const responseCards = [mockCards[1]];

			mockCardGeneration.getCardsForRound.mockResolvedValue(mockCards);
			mockCardGeneration.getPromptCard.mockResolvedValue(promptCard);
			mockCardGeneration.getResponseCards.mockResolvedValue(responseCards);

			const { result } = renderHook(() => useGameCards());

			await act(async () => {
				await result.current.loadCardsForRound("game-1", 1);
			});

			expect(result.current.cards).toEqual(mockCards);
			expect(result.current.promptCard).toEqual(promptCard);
			expect(result.current.responseCards).toEqual(responseCards);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it("should handle loading error", async () => {
			const error = new Error("Failed to load cards");
			mockCardGeneration.getCardsForRound.mockRejectedValue(error);

			const { result } = renderHook(() => useGameCards());

			await act(async () => {
				await result.current.loadCardsForRound("game-1", 1);
			});

			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBe("Failed to load cards");
		});

		it("should load player cards successfully", async () => {
			const playerCards = [mockCards[1]];
			mockCardGeneration.getPlayerCards.mockResolvedValue(playerCards);

			const { result } = renderHook(() => useGameCards());

			await act(async () => {
				await result.current.loadPlayerCards("game-1", 1, "player-1");
			});

			expect(result.current.playerCards).toEqual(playerCards);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
		});

		it("should distribute cards successfully", async () => {
			mockCardGeneration.distributeCardsToPlayers.mockResolvedValue();
			mockCardGeneration.getCardsForRound.mockResolvedValue(mockCards);
			mockCardGeneration.getPlayerCards.mockResolvedValue([mockCards[1]]);

			const { result } = renderHook(() => useGameCards());

			// First load cards to set current game/round
			await act(async () => {
				await result.current.loadCardsForRound("game-1", 1);
			});

			await act(async () => {
				await result.current.distributeCards("game-1", 1, ["player-1"], 5);
			});

			expect(mockCardGeneration.distributeCardsToPlayers).toHaveBeenCalledWith(
				"game-1",
				1,
				["player-1"],
				5
			);
		});

		it("should refresh cards", async () => {
			mockCardGeneration.getCardsForRound.mockResolvedValue(mockCards);
			mockCardGeneration.getPromptCard.mockResolvedValue(mockCards[0]);
			mockCardGeneration.getResponseCards.mockResolvedValue([mockCards[1]]);
			mockCardGeneration.getPlayerCards.mockResolvedValue([mockCards[1]]);

			const { result } = renderHook(() => useGameCards());

			// First load cards to set current game/round/player
			await act(async () => {
				await result.current.loadCardsForRound("game-1", 1);
				await result.current.loadPlayerCards("game-1", 1, "player-1");
			});

			await act(async () => {
				await result.current.refreshCards();
			});

			expect(mockCardGeneration.getCardsForRound).toHaveBeenCalledTimes(2);
			expect(mockCardGeneration.getPlayerCards).toHaveBeenCalledTimes(2);
		});

		it("should clear error", () => {
			const { result } = renderHook(() => useGameCards());

			act(() => {
				result.current.clearError();
			});

			expect(result.current.error).toBeNull();
		});
	});

	describe("useCardDistribution hook", () => {
		it("should initialize with default state", () => {
			const { result } = renderHook(() => useCardDistribution());

			expect(result.current.isDistributing).toBe(false);
			expect(result.current.distributionError).toBeNull();
			expect(result.current.distributionComplete).toBe(false);
		});

		it("should distribute cards successfully", async () => {
			mockCardGeneration.distributeCardsToPlayers.mockResolvedValue();

			const { result } = renderHook(() => useCardDistribution());

			let distributionResult;
			await act(async () => {
				distributionResult = await result.current.distributeCardsToAllPlayers(
					"game-1",
					1,
					["player-1", "player-2"],
					5
				);
			});

			expect(distributionResult).toBe(true);
			expect(result.current.isDistributing).toBe(false);
			expect(result.current.distributionComplete).toBe(true);
			expect(result.current.distributionError).toBeNull();
		});

		it("should handle distribution error", async () => {
			const error = new Error("Distribution failed");
			mockCardGeneration.distributeCardsToPlayers.mockRejectedValue(error);

			const { result } = renderHook(() => useCardDistribution());

			let distributionResult;
			await act(async () => {
				distributionResult = await result.current.distributeCardsToAllPlayers(
					"game-1",
					1,
					["player-1", "player-2"],
					5
				);
			});

			expect(distributionResult).toBe(false);
			expect(result.current.isDistributing).toBe(false);
			expect(result.current.distributionComplete).toBe(false);
			expect(result.current.distributionError).toBe("Distribution failed");
		});

		it("should set isDistributing during distribution", async () => {
			let resolveDistribution: () => void;
			const distributionPromise = new Promise<void>((resolve) => {
				resolveDistribution = resolve;
			});

			mockCardGeneration.distributeCardsToPlayers.mockReturnValue(
				distributionPromise
			);

			const { result } = renderHook(() => useCardDistribution());

			act(() => {
				result.current.distributeCardsToAllPlayers(
					"game-1",
					1,
					["player-1", "player-2"],
					5
				);
			});

			expect(result.current.isDistributing).toBe(true);

			await act(async () => {
				resolveDistribution!();
				await distributionPromise;
			});

			expect(result.current.isDistributing).toBe(false);
		});

		it("should reset distribution", () => {
			const { result } = renderHook(() => useCardDistribution());

			act(() => {
				result.current.resetDistribution();
			});

			expect(result.current.distributionComplete).toBe(false);
			expect(result.current.distributionError).toBeNull();
		});

		it("should clear error", () => {
			const { result } = renderHook(() => useCardDistribution());

			act(() => {
				result.current.clearError();
			});

			expect(result.current.distributionError).toBeNull();
		});
	});
});
