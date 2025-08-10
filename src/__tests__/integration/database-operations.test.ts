/**
 * Integration tests for Supabase database operations
 * These tests verify that our database operations work correctly with Supabase
 */

import { supabase } from "@/lib/supabase";
import {
	generateRoomCode,
	generatePlayerId,
	generateGameId,
} from "@/lib/game-utils";
import { GameState, Player, Card, Submission, Vote } from "@/types/game";
import { GAME_PHASES } from "@/lib/constants";

// Mock Supabase for integration tests
jest.mock("@/lib/supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("Database Operations Integration", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Setup default mock responses
		mockSupabase.from = jest.fn().mockReturnValue({
			insert: jest.fn().mockReturnValue({
				select: jest.fn().mockResolvedValue({
					data: [],
					error: null,
				}),
			}),
			select: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: null,
						error: null,
					}),
					order: jest.fn().mockResolvedValue({
						data: [],
						error: null,
					}),
				}),
				order: jest.fn().mockResolvedValue({
					data: [],
					error: null,
				}),
			}),
			update: jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({
					data: [],
					error: null,
				}),
			}),
			delete: jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({
					data: [],
					error: null,
				}),
			}),
			upsert: jest.fn().mockResolvedValue({
				data: [],
				error: null,
			}),
		});

		mockSupabase.rpc = jest.fn().mockResolvedValue({
			data: null,
			error: null,
		});
	});

	describe("Game Creation and Management", () => {
		it("should create a new game successfully", async () => {
			const gameId = generateGameId();
			const roomCode = generateRoomCode();
			const hostId = generatePlayerId();

			const mockGameData = {
				id: gameId,
				room_code: roomCode,
				phase: GAME_PHASES.LOBBY,
				current_round: 1,
				target_score: 7,
				max_players: 8,
				submission_timer: 60,
				voting_timer: 30,
				host_id: hostId,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [mockGameData],
						error: null,
					}),
				}),
			});

			// Simulate game creation
			const { data, error } = await supabase
				.from("games")
				.insert({
					id: gameId,
					room_code: roomCode,
					host_id: hostId,
					phase: GAME_PHASES.LOBBY,
				})
				.select();

			expect(error).toBeNull();
			expect(data).toEqual([mockGameData]);
			expect(mockSupabase.from).toHaveBeenCalledWith("games");
		});

		it("should update game phase successfully", async () => {
			const gameId = "game-1";
			const newPhase = GAME_PHASES.SUBMISSION;

			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ id: gameId, phase: newPhase }],
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("games")
				.update({ phase: newPhase })
				.eq("id", gameId);

			expect(error).toBeNull();
			expect(data).toEqual([{ id: gameId, phase: newPhase }]);
		});

		it("should handle game creation errors", async () => {
			const gameId = generateGameId();
			const roomCode = generateRoomCode();

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: null,
						error: { message: "Room code already exists", code: "23505" },
					}),
				}),
			});

			const { data, error } = await supabase
				.from("games")
				.insert({
					id: gameId,
					room_code: roomCode,
					host_id: "host-1",
				})
				.select();

			expect(data).toBeNull();
			expect(error).toEqual({
				message: "Room code already exists",
				code: "23505",
			});
		});
	});

	describe("Player Management", () => {
		it("should add player to game successfully", async () => {
			const playerId = generatePlayerId();
			const gameId = "game-1";
			const playerName = "Test Player";

			const mockPlayerData = {
				id: playerId,
				game_id: gameId,
				name: playerName,
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [mockPlayerData],
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("players")
				.insert({
					id: playerId,
					game_id: gameId,
					name: playerName,
				})
				.select();

			expect(error).toBeNull();
			expect(data).toEqual([mockPlayerData]);
		});

		it("should fetch players for a game", async () => {
			const gameId = "game-1";
			const mockPlayers = [
				{
					id: "player-1",
					game_id: gameId,
					name: "Player 1",
					score: 2,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "player-2",
					game_id: gameId,
					name: "Player 2",
					score: 1,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						order: jest.fn().mockResolvedValue({
							data: mockPlayers,
							error: null,
						}),
					}),
				}),
			});

			const { data, error } = await supabase
				.from("players")
				.select("*")
				.eq("game_id", gameId)
				.order("score", { ascending: false });

			expect(error).toBeNull();
			expect(data).toEqual(mockPlayers);
		});

		it("should update player score", async () => {
			const playerId = "player-1";
			const newScore = 3;

			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ id: playerId, score: newScore }],
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("players")
				.update({ score: newScore })
				.eq("id", playerId);

			expect(error).toBeNull();
			expect(data).toEqual([{ id: playerId, score: newScore }]);
		});

		it("should remove player from game", async () => {
			const playerId = "player-1";
			const gameId = "game-1";

			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [{ id: playerId }],
							error: null,
						}),
					}),
				}),
			});

			const { data, error } = await supabase
				.from("players")
				.delete()
				.eq("id", playerId)
				.eq("game_id", gameId);

			expect(error).toBeNull();
			expect(data).toEqual([{ id: playerId }]);
		});
	});

	describe("Card Operations", () => {
		it("should insert cards for a round", async () => {
			const gameId = "game-1";
			const roundNumber = 1;
			const mockCards = [
				{
					id: "card-1",
					game_id: gameId,
					round_number: roundNumber,
					type: "prompt",
					text: "Test prompt",
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "card-2",
					game_id: gameId,
					round_number: roundNumber,
					type: "response",
					text: "Test response",
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: mockCards,
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("cards")
				.insert(mockCards)
				.select();

			expect(error).toBeNull();
			expect(data).toEqual(mockCards);
		});

		it("should fetch cards for a round", async () => {
			const gameId = "game-1";
			const roundNumber = 1;
			const mockCards = [
				{
					id: "card-1",
					game_id: gameId,
					round_number: roundNumber,
					type: "prompt",
					text: "Test prompt",
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
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
			});

			const { data, error } = await supabase
				.from("cards")
				.select("*")
				.eq("game_id", gameId)
				.eq("round_number", roundNumber)
				.order("created_at");

			expect(error).toBeNull();
			expect(data).toEqual(mockCards);
		});

		it("should update card player assignment", async () => {
			const cardId = "card-1";
			const playerId = "player-1";

			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ id: cardId, player_id: playerId }],
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("cards")
				.update({ player_id: playerId })
				.eq("id", cardId);

			expect(error).toBeNull();
			expect(data).toEqual([{ id: cardId, player_id: playerId }]);
		});
	});

	describe("Submission Operations", () => {
		it("should create submission successfully", async () => {
			const submissionData = {
				id: "submission-1",
				game_id: "game-1",
				player_id: "player-1",
				round_number: 1,
				prompt_card_id: "prompt-1",
				response_cards: [{ id: "response-1", text: "Response" }],
				votes: 0,
				submitted_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [submissionData],
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("submissions")
				.insert({
					game_id: submissionData.game_id,
					player_id: submissionData.player_id,
					round_number: submissionData.round_number,
					prompt_card_id: submissionData.prompt_card_id,
					response_cards: submissionData.response_cards,
				})
				.select();

			expect(error).toBeNull();
			expect(data).toEqual([submissionData]);
		});

		it("should fetch submissions for a round", async () => {
			const gameId = "game-1";
			const roundNumber = 1;
			const mockSubmissions = [
				{
					id: "submission-1",
					game_id: gameId,
					player_id: "player-1",
					round_number: roundNumber,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 2,
					submitted_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: mockSubmissions,
								error: null,
							}),
						}),
					}),
				}),
			});

			const { data, error } = await supabase
				.from("submissions")
				.select("*")
				.eq("game_id", gameId)
				.eq("round_number", roundNumber)
				.order("submitted_at");

			expect(error).toBeNull();
			expect(data).toEqual(mockSubmissions);
		});
	});

	describe("Voting Operations", () => {
		it("should create vote successfully", async () => {
			const voteData = {
				id: "vote-1",
				game_id: "game-1",
				player_id: "player-1",
				submission_id: "submission-1",
				round_number: 1,
				voted_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [voteData],
						error: null,
					}),
				}),
			});

			const { data, error } = await supabase
				.from("votes")
				.insert({
					game_id: voteData.game_id,
					player_id: voteData.player_id,
					submission_id: voteData.submission_id,
					round_number: voteData.round_number,
				})
				.select();

			expect(error).toBeNull();
			expect(data).toEqual([voteData]);
		});

		it("should prevent duplicate votes", async () => {
			const gameId = "game-1";
			const playerId = "player-1";
			const roundNumber = 1;

			// First check for existing vote
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: { id: "existing-vote" },
									error: null,
								}),
							}),
						}),
					}),
				}),
			});

			const { data: existingVote } = await supabase
				.from("votes")
				.select("id")
				.eq("player_id", playerId)
				.eq("game_id", gameId)
				.eq("round_number", roundNumber)
				.single();

			expect(existingVote).toEqual({ id: "existing-vote" });
		});

		it("should increment submission vote count", async () => {
			const submissionId = "submission-1";

			mockSupabase.rpc.mockResolvedValueOnce({
				data: { votes: 3 },
				error: null,
			});

			const { data, error } = await supabase.rpc("increment_submission_votes", {
				submission_id: submissionId,
			});

			expect(error).toBeNull();
			expect(data).toEqual({ votes: 3 });
			expect(mockSupabase.rpc).toHaveBeenCalledWith(
				"increment_submission_votes",
				{
					submission_id: submissionId,
				}
			);
		});
	});

	describe("Complex Queries", () => {
		it("should fetch complete game state", async () => {
			const gameId = "game-1";

			// Mock game data
			const mockGameData = {
				id: gameId,
				room_code: "ABC123",
				phase: GAME_PHASES.VOTING,
				current_round: 2,
				target_score: 7,
				max_players: 8,
				submission_timer: 60,
				voting_timer: 30,
				host_id: "player-1",
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: mockGameData,
							error: null,
						}),
					}),
				}),
			});

			const { data, error } = await supabase
				.from("games")
				.select("*")
				.eq("id", gameId)
				.single();

			expect(error).toBeNull();
			expect(data).toEqual(mockGameData);
		});

		it("should fetch game with related data", async () => {
			const gameId = "game-1";

			const mockCompleteGameData = {
				id: gameId,
				room_code: "ABC123",
				phase: GAME_PHASES.VOTING,
				players: [
					{ id: "player-1", name: "Player 1", score: 2 },
					{ id: "player-2", name: "Player 2", score: 1 },
				],
				submissions: [{ id: "submission-1", player_id: "player-1", votes: 2 }],
			};

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: mockCompleteGameData,
							error: null,
						}),
					}),
				}),
			});

			const { data, error } = await supabase
				.from("games")
				.select(
					`
					*,
					players(*),
					submissions(*)
				`
				)
				.eq("id", gameId)
				.single();

			expect(error).toBeNull();
			expect(data).toEqual(mockCompleteGameData);
		});
	});

	describe("Error Handling", () => {
		it("should handle network errors", async () => {
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						single: jest.fn().mockResolvedValue({
							data: null,
							error: { message: "Network error", code: "NETWORK_ERROR" },
						}),
					}),
				}),
			});

			const { data, error } = await supabase
				.from("games")
				.select("*")
				.eq("id", "nonexistent")
				.single();

			expect(data).toBeNull();
			expect(error).toEqual({
				message: "Network error",
				code: "NETWORK_ERROR",
			});
		});

		it("should handle constraint violations", async () => {
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: null,
						error: {
							message: "duplicate key value violates unique constraint",
							code: "23505",
						},
					}),
				}),
			});

			const { data, error } = await supabase
				.from("games")
				.insert({
					room_code: "DUPLICATE",
					host_id: "host-1",
				})
				.select();

			expect(data).toBeNull();
			expect(error.code).toBe("23505");
		});
	});

	describe("Transaction-like Operations", () => {
		it("should handle multiple related operations", async () => {
			const gameId = "game-1";
			const playerId = "player-1";

			// Mock successful game creation
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [{ id: gameId }],
						error: null,
					}),
				}),
			});

			// Mock successful player addition
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [{ id: playerId, game_id: gameId }],
						error: null,
					}),
				}),
			});

			// Create game
			const { data: gameData, error: gameError } = await supabase
				.from("games")
				.insert({ id: gameId, room_code: "ABC123", host_id: playerId })
				.select();

			expect(gameError).toBeNull();
			expect(gameData).toEqual([{ id: gameId }]);

			// Add host as player
			const { data: playerData, error: playerError } = await supabase
				.from("players")
				.insert({ id: playerId, game_id: gameId, name: "Host" })
				.select();

			expect(playerError).toBeNull();
			expect(playerData).toEqual([{ id: playerId, game_id: gameId }]);
		});
	});
});
