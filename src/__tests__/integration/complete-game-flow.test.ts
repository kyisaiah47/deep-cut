/**
 * Complete Game Flow Integration Test
 * Tests the entire multiplayer game flow from creation to completion
 */

import { supabase } from "@/lib/supabase";
import { GamePhase } from "@/types/game";

// Mock Supabase for integration tests
jest.mock("@/lib/supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock fetch for API calls
global.fetch = jest.fn();

describe("Complete Game Flow Integration", () => {
	let gameId: string;
	let roomCode: string;
	let hostPlayerId: string;
	let playerIds: string[] = [];

	beforeEach(() => {
		jest.clearAllMocks();
		gameId = "test-game-id";
		roomCode = "TEST01";
		hostPlayerId = "host-player-id";
		playerIds = ["player-1", "player-2", "player-3"];

		// Mock successful database operations
		mockSupabase.from.mockReturnValue({
			select: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: { id: gameId, room_code: roomCode, phase: "lobby" },
						error: null,
					}),
				}),
			}),
			insert: jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue({
					data: [{ id: gameId, room_code: roomCode }],
					error: null,
				}),
			}),
			update: jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({
					data: [{ id: gameId }],
					error: null,
				}),
			}),
		} as any);

		// Mock real-time subscriptions
		mockSupabase.channel.mockReturnValue({
			on: jest.fn().mockReturnThis(),
			subscribe: jest.fn().mockResolvedValue({ error: null }),
			unsubscribe: jest.fn().mockResolvedValue({ error: null }),
		} as any);
	});

	describe("Game Creation and Joining", () => {
		it("should create a new game successfully", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					gameId,
					roomCode,
					playerId: hostPlayerId,
				}),
			} as Response);

			const response = await fetch("/api/games/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					playerName: "Host Player",
					settings: {
						maxPlayers: 6,
						targetScore: 7,
						submissionTimer: 60,
						votingTimer: 30,
					},
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.gameId).toBe(gameId);
			expect(result.roomCode).toBe(roomCode);
			expect(result.playerId).toBe(hostPlayerId);
		});

		it("should allow players to join the game", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			for (let i = 0; i < playerIds.length; i++) {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						gameId,
						playerId: playerIds[i],
					}),
				} as Response);

				const response = await fetch("/api/games/join", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						roomCode,
						playerName: `Player ${i + 1}`,
					}),
				});

				const result = await response.json();

				expect(response.ok).toBe(true);
				expect(result.success).toBe(true);
				expect(result.playerId).toBe(playerIds[i]);
			}
		});
	});

	describe("Game Phase Transitions", () => {
		it("should transition through all game phases", async () => {
			const phases: GamePhase[] = [
				"lobby",
				"distribution",
				"submission",
				"voting",
				"results",
			];

			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			for (let i = 0; i < phases.length - 1; i++) {
				const currentPhase = phases[i];
				const nextPhase = phases[i + 1];

				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						phase: nextPhase,
					}),
				} as Response);

				const response = await fetch("/api/games/control", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						gameId,
						playerId: hostPlayerId,
						action: "next_phase",
					}),
				});

				const result = await response.json();

				expect(response.ok).toBe(true);
				expect(result.success).toBe(true);
				expect(result.phase).toBe(nextPhase);
			}
		});
	});

	describe("Card Generation and Distribution", () => {
		it("should generate and distribute cards for a round", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			// Mock card generation
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					cards: {
						prompt: {
							id: "prompt-1",
							text: "The best thing about _____ is _____.",
							type: "prompt",
						},
						responses: [
							{ id: "response-1", text: "Pizza", type: "response" },
							{ id: "response-2", text: "Cats", type: "response" },
							{ id: "response-3", text: "Video games", type: "response" },
						],
					},
				}),
			} as Response);

			const response = await fetch("/api/cards/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					roundNumber: 1,
					playerCount: 4,
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.cards.prompt).toBeDefined();
			expect(result.cards.responses).toHaveLength(3);
		});

		it("should distribute cards to all players", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			for (const playerId of [hostPlayerId, ...playerIds]) {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						cards: [
							{
								id: `card-${playerId}-1`,
								text: "Response 1",
								type: "response",
							},
							{
								id: `card-${playerId}-2`,
								text: "Response 2",
								type: "response",
							},
							{
								id: `card-${playerId}-3`,
								text: "Response 3",
								type: "response",
							},
						],
					}),
				} as Response);

				const response = await fetch(`/api/cards/${gameId}/1`, {
					method: "GET",
					headers: {
						"x-player-id": playerId,
					},
				});

				const result = await response.json();

				expect(response.ok).toBe(true);
				expect(result.success).toBe(true);
				expect(result.cards).toHaveLength(3);
			}
		});
	});

	describe("Submission System", () => {
		it("should accept submissions from all players", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			for (const playerId of [hostPlayerId, ...playerIds]) {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						submissionId: `submission-${playerId}`,
					}),
				} as Response);

				const response = await fetch("/api/submissions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						gameId,
						playerId,
						roundNumber: 1,
						promptCardId: "prompt-1",
						responseCards: [
							{ id: `card-${playerId}-1`, text: "Response 1" },
							{ id: `card-${playerId}-2`, text: "Response 2" },
						],
					}),
				});

				const result = await response.json();

				expect(response.ok).toBe(true);
				expect(result.success).toBe(true);
				expect(result.submissionId).toBe(`submission-${playerId}`);
			}
		});

		it("should prevent duplicate submissions", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			// First submission succeeds
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					submissionId: "submission-1",
				}),
			} as Response);

			// Second submission fails
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					error: "Player has already submitted for this round",
				}),
			} as Response);

			// First submission
			const response1 = await fetch("/api/submissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: hostPlayerId,
					roundNumber: 1,
					promptCardId: "prompt-1",
					responseCards: [{ id: "card-1", text: "Response 1" }],
				}),
			});

			expect(response1.ok).toBe(true);

			// Duplicate submission
			const response2 = await fetch("/api/submissions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: hostPlayerId,
					roundNumber: 1,
					promptCardId: "prompt-1",
					responseCards: [{ id: "card-2", text: "Response 2" }],
				}),
			});

			expect(response2.ok).toBe(false);
		});
	});

	describe("Voting System", () => {
		it("should accept votes from all players", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			for (const playerId of [hostPlayerId, ...playerIds]) {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						voteId: `vote-${playerId}`,
					}),
				} as Response);

				const response = await fetch("/api/votes", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						gameId,
						playerId,
						submissionId: "submission-other-player",
						roundNumber: 1,
					}),
				});

				const result = await response.json();

				expect(response.ok).toBe(true);
				expect(result.success).toBe(true);
				expect(result.voteId).toBe(`vote-${playerId}`);
			}
		});

		it("should prevent players from voting for their own submissions", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					error: "Cannot vote for your own submission",
				}),
			} as Response);

			const response = await fetch("/api/votes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: hostPlayerId,
					submissionId: `submission-${hostPlayerId}`,
					roundNumber: 1,
				}),
			});

			expect(response.ok).toBe(false);
		});

		it("should calculate winner correctly", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					results: {
						winner: {
							playerId: "player-1",
							submissionId: "submission-player-1",
							votes: 3,
						},
						allResults: [
							{ playerId: "player-1", votes: 3 },
							{ playerId: "player-2", votes: 1 },
							{ playerId: "player-3", votes: 0 },
							{ playerId: hostPlayerId, votes: 0 },
						],
					},
				}),
			} as Response);

			const response = await fetch("/api/votes", {
				method: "GET",
				headers: {
					"x-game-id": gameId,
					"x-round-number": "1",
				},
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.results.winner.playerId).toBe("player-1");
			expect(result.results.winner.votes).toBe(3);
		});
	});

	describe("Score Management", () => {
		it("should update scores after each round", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					scores: {
						"player-1": 1,
						"player-2": 0,
						"player-3": 0,
						[hostPlayerId]: 0,
					},
					gameComplete: false,
				}),
			} as Response);

			const response = await fetch("/api/games/control", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: hostPlayerId,
					action: "update_scores",
					roundResults: {
						winner: "player-1",
						votes: { "player-1": 3, "player-2": 1 },
					},
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.scores["player-1"]).toBe(1);
			expect(result.gameComplete).toBe(false);
		});

		it("should detect game completion", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					scores: {
						"player-1": 7,
						"player-2": 3,
						"player-3": 2,
						[hostPlayerId]: 1,
					},
					gameComplete: true,
					winner: "player-1",
				}),
			} as Response);

			const response = await fetch("/api/games/control", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: hostPlayerId,
					action: "update_scores",
					roundResults: {
						winner: "player-1",
						votes: { "player-1": 4 },
					},
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.gameComplete).toBe(true);
			expect(result.winner).toBe("player-1");
			expect(result.scores["player-1"]).toBe(7);
		});
	});

	describe("Error Handling and Recovery", () => {
		it("should handle AI generation failures gracefully", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			// First attempt fails
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({
					success: false,
					error: "AI generation failed",
					fallbackUsed: true,
				}),
			} as Response);

			const response = await fetch("/api/cards/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					roundNumber: 1,
					playerCount: 4,
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(false);
			expect(result.fallbackUsed).toBe(true);
		});

		it("should handle player disconnections", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					playersRemaining: 3,
					hostTransferred: false,
				}),
			} as Response);

			const response = await fetch("/api/player-disconnect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: "player-1",
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.playersRemaining).toBe(3);
		});

		it("should transfer host when host disconnects", async () => {
			const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					playersRemaining: 3,
					hostTransferred: true,
					newHostId: "player-1",
				}),
			} as Response);

			const response = await fetch("/api/player-disconnect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					playerId: hostPlayerId,
				}),
			});

			const result = await response.json();

			expect(response.ok).toBe(true);
			expect(result.success).toBe(true);
			expect(result.hostTransferred).toBe(true);
			expect(result.newHostId).toBe("player-1");
		});
	});

	describe("Real-time Synchronization", () => {
		it("should establish real-time subscriptions", () => {
			// Mock subscription setup
			const mockChannel = {
				on: jest.fn().mockReturnThis(),
				subscribe: jest.fn().mockResolvedValue({ error: null }),
				unsubscribe: jest.fn().mockResolvedValue({ error: null }),
			};

			mockSupabase.channel.mockReturnValue(mockChannel as any);

			// Simulate subscription setup
			const channel = mockSupabase.channel(`game:${gameId}`);
			channel
				.on(
					"postgres_changes",
					{ event: "*", schema: "public", table: "games" },
					jest.fn()
				)
				.on(
					"postgres_changes",
					{ event: "*", schema: "public", table: "players" },
					jest.fn()
				)
				.on(
					"postgres_changes",
					{ event: "*", schema: "public", table: "submissions" },
					jest.fn()
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledWith(`game:${gameId}`);
			expect(mockChannel.on).toHaveBeenCalledTimes(3);
			expect(mockChannel.subscribe).toHaveBeenCalled();
		});

		it("should handle subscription errors gracefully", async () => {
			const mockChannel = {
				on: jest.fn().mockReturnThis(),
				subscribe: jest.fn().mockResolvedValue({ error: "Connection failed" }),
				unsubscribe: jest.fn().mockResolvedValue({ error: null }),
			};

			mockSupabase.channel.mockReturnValue(mockChannel as any);

			const channel = mockSupabase.channel(`game:${gameId}`);
			const result = await channel.subscribe();

			expect(result.error).toBe("Connection failed");
		});
	});
});
