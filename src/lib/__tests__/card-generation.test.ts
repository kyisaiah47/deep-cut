import {
	generateCards,
	getCardsForRound,
	getPromptCard,
	getResponseCards,
	distributeCardsToPlayers,
	getPlayerCards,
	clearExpiredCache,
	moderateContent,
	validateCardContent,
} from "../card-generation";
import { supabase } from "../supabase";

// Mock Supabase
jest.mock("../supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("card-generation", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Clear cache between tests
		clearExpiredCache();
	});

	describe("generateCards", () => {
		const mockOptions = {
			gameId: "game-1",
			roundNumber: 1,
			playerCount: 4,
			theme: "funny",
		};

		it("should generate cards successfully via edge function", async () => {
			const mockResponse = {
				success: true,
				cardsGenerated: 25,
				promptCard: {
					id: "prompt-1",
					type: "prompt",
					text: "Test prompt",
				},
				responseCardsCount: 24,
			};

			mockSupabase.functions.invoke.mockResolvedValue({
				data: mockResponse,
				error: null,
			});

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: [],
								error: null,
							}),
						}),
					}),
				}),
			} as any);

			const result = await generateCards(mockOptions);

			expect(result.success).toBe(true);
			expect(result.cardsGenerated).toBe(25);
			expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
				"generate-cards",
				{
					body: mockOptions,
				}
			);
		});

		it("should use fallback generation when edge function fails", async () => {
			mockSupabase.functions.invoke.mockResolvedValue({
				data: null,
				error: { message: "Edge function failed" },
			});

			// Mock fallback card insertion
			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [
							{
								id: "fallback-prompt",
								type: "prompt",
								text: "Fallback prompt",
								game_id: "game-1",
								round_number: 1,
								player_id: null,
								created_at: "2023-01-01T00:00:00Z",
							},
						],
						error: null,
					}),
				}),
			} as any);

			const result = await generateCards(mockOptions);

			expect(result.success).toBe(true);
			expect(result.cardsGenerated).toBeGreaterThan(0);
		});

		it("should return error when both edge function and fallback fail", async () => {
			mockSupabase.functions.invoke.mockResolvedValue({
				data: null,
				error: { message: "Edge function failed" },
			});

			mockSupabase.from.mockReturnValue({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: null,
						error: { message: "Database error" },
					}),
				}),
			} as any);

			const result = await generateCards(mockOptions);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe("getCardsForRound", () => {
		it("should fetch cards for a specific round", async () => {
			const mockCards = [
				{
					id: "card-1",
					type: "prompt",
					text: "Test prompt",
					game_id: "game-1",
					round_number: 1,
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: mockCards,
								error: null,
							}),
						}),
					}),
				}),
			} as any);

			const result = await getCardsForRound("game-1", 1);

			expect(result).toEqual(mockCards);
			expect(mockSupabase.from).toHaveBeenCalledWith("cards");
		});

		it("should handle database errors", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: null,
								error: { message: "Database error" },
							}),
						}),
					}),
				}),
			} as any);

			await expect(getCardsForRound("game-1", 1)).rejects.toThrow(
				"Failed to fetch cards"
			);
		});
	});

	describe("getPromptCard", () => {
		it("should fetch prompt card for a round", async () => {
			const mockPrompt = {
				id: "prompt-1",
				type: "prompt",
				text: "Test prompt",
				game_id: "game-1",
				round_number: 1,
				player_id: null,
				created_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: mockPrompt,
									error: null,
								}),
							}),
						}),
					}),
				}),
			} as any);

			const result = await getPromptCard("game-1", 1);

			expect(result).toEqual(mockPrompt);
		});

		it("should return null when no prompt card found", async () => {
			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: null,
									error: { code: "PGRST116" }, // No rows returned
								}),
							}),
						}),
					}),
				}),
			} as any);

			const result = await getPromptCard("game-1", 1);

			expect(result).toBeNull();
		});
	});

	describe("distributeCardsToPlayers", () => {
		it("should distribute cards to players successfully", async () => {
			const mockResponseCards = Array.from({ length: 20 }, (_, i) => ({
				id: `response-${i}`,
				type: "response",
				text: `Response ${i}`,
				game_id: "game-1",
				round_number: 1,
				player_id: null,
				created_at: "2023-01-01T00:00:00Z",
			}));

			// Mock getResponseCards
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								order: jest.fn().mockResolvedValue({
									data: mockResponseCards,
									error: null,
								}),
							}),
						}),
					}),
				}),
			} as any);

			// Mock upsert for distribution
			mockSupabase.from.mockReturnValueOnce({
				upsert: jest.fn().mockResolvedValue({
					error: null,
				}),
			} as any);

			const playerIds = ["player-1", "player-2", "player-3"];
			await distributeCardsToPlayers("game-1", 1, playerIds, 5);

			expect(mockSupabase.from).toHaveBeenCalledWith("cards");
		});

		it("should throw error when not enough cards", async () => {
			const mockResponseCards = Array.from({ length: 5 }, (_, i) => ({
				id: `response-${i}`,
				type: "response",
				text: `Response ${i}`,
				game_id: "game-1",
				round_number: 1,
				player_id: null,
				created_at: "2023-01-01T00:00:00Z",
			}));

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								order: jest.fn().mockResolvedValue({
									data: mockResponseCards,
									error: null,
								}),
							}),
						}),
					}),
				}),
			} as any);

			const playerIds = ["player-1", "player-2", "player-3"];
			await expect(
				distributeCardsToPlayers("game-1", 1, playerIds, 5)
			).rejects.toThrow("Not enough response cards");
		});
	});

	describe("getPlayerCards", () => {
		it("should fetch cards for a specific player", async () => {
			const mockPlayerCards = [
				{
					id: "card-1",
					type: "response",
					text: "Player card 1",
					game_id: "game-1",
					round_number: 1,
					player_id: "player-1",
					created_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValue({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								eq: jest.fn().mockReturnValue({
									order: jest.fn().mockResolvedValue({
										data: mockPlayerCards,
										error: null,
									}),
								}),
							}),
						}),
					}),
				}),
			} as any);

			const result = await getPlayerCards("game-1", 1, "player-1");

			expect(result).toEqual(mockPlayerCards);
		});
	});

	describe("moderateContent", () => {
		it("should filter inappropriate words", () => {
			const text = "This is explicit content that is inappropriate";
			const result = moderateContent(text);

			expect(result).toBe("This is [FILTERED] content that is [FILTERED]");
		});

		it("should be case insensitive", () => {
			const text = "This is EXPLICIT content";
			const result = moderateContent(text);

			expect(result).toBe("This is [FILTERED] content");
		});

		it("should return original text if no inappropriate words", () => {
			const text = "This is perfectly fine content";
			const result = moderateContent(text);

			expect(result).toBe(text);
		});
	});

	describe("validateCardContent", () => {
		it("should validate correct card content", () => {
			const result = validateCardContent("This is a valid card");

			expect(result.isValid).toBe(true);
			expect(result.reason).toBeUndefined();
		});

		it("should reject empty content", () => {
			const result = validateCardContent("");

			expect(result.isValid).toBe(false);
			expect(result.reason).toBe("Card text cannot be empty");
		});

		it("should reject content that is too long", () => {
			const longText = "a".repeat(201);
			const result = validateCardContent(longText);

			expect(result.isValid).toBe(false);
			expect(result.reason).toBe("Card text is too long (max 200 characters)");
		});

		it("should reject filtered content", () => {
			const result = validateCardContent("This contains [FILTERED] content");

			expect(result.isValid).toBe(false);
			expect(result.reason).toBe("Card contains inappropriate content");
		});
	});

	describe("clearExpiredCache", () => {
		it("should clear expired cache entries", () => {
			// This test would require mocking the internal cache
			// For now, just ensure it doesn't throw
			expect(() => clearExpiredCache()).not.toThrow();
		});
	});
});
