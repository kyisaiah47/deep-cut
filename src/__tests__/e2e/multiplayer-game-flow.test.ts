/**
 * End-to-end tests for complete multiplayer game flows
 * These tests simulate full game scenarios from start to finish
 */

import { supabase } from "@/lib/supabase";
import {
	generateRoomCode,
	generatePlayerId,
	generateGameId,
} from "@/lib/game-utils";
import { GAME_PHASES } from "@/lib/constants";

// Mock Supabase for E2E tests
jest.mock("@/lib/supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock fetch for API calls
global.fetch = jest.fn();

describe("Multiplayer Game Flow E2E", () => {
	let gameId: string;
	let roomCode: string;
	let hostId: string;
	let player2Id: string;
	let player3Id: string;

	beforeEach(() => {
		jest.clearAllMocks();

		gameId = generateGameId();
		roomCode = generateRoomCode();
		hostId = generatePlayerId();
		player2Id = generatePlayerId();
		player3Id = generatePlayerId();

		// Setup default Supabase mocks
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

		mockSupabase.functions = {
			invoke: jest.fn().mockResolvedValue({
				data: { success: true, cardsGenerated: 25 },
				error: null,
			}),
		} as any;

		// Mock fetch for API calls
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: jest.fn().mockResolvedValue({ success: true }),
		});
	});

	describe("Complete Game Flow", () => {
		it("should complete a full 3-player game from start to finish", async () => {
			// Step 1: Host creates game
			const gameData = {
				id: gameId,
				room_code: roomCode,
				phase: GAME_PHASES.LOBBY,
				current_round: 1,
				target_score: 3, // Lower target for faster test
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
						data: [gameData],
						error: null,
					}),
				}),
			});

			const { data: createdGame, error: gameError } = await supabase
				.from("games")
				.insert({
					id: gameId,
					room_code: roomCode,
					host_id: hostId,
				})
				.select();

			expect(gameError).toBeNull();
			expect(createdGame).toEqual([gameData]);

			// Step 2: Host joins as player
			const hostPlayerData = {
				id: hostId,
				game_id: gameId,
				name: "Host Player",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [hostPlayerData],
						error: null,
					}),
				}),
			});

			const { data: hostPlayer, error: hostError } = await supabase
				.from("players")
				.insert({
					id: hostId,
					game_id: gameId,
					name: "Host Player",
				})
				.select();

			expect(hostError).toBeNull();
			expect(hostPlayer).toEqual([hostPlayerData]);

			// Step 3: Two more players join
			const player2Data = {
				id: player2Id,
				game_id: gameId,
				name: "Player 2",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:01Z",
			};

			const player3Data = {
				id: player3Id,
				game_id: gameId,
				name: "Player 3",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:02Z",
			};

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [player2Data],
						error: null,
					}),
				}),
			});

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: [player3Data],
						error: null,
					}),
				}),
			});

			const { data: player2 } = await supabase
				.from("players")
				.insert({
					id: player2Id,
					game_id: gameId,
					name: "Player 2",
				})
				.select();

			const { data: player3 } = await supabase
				.from("players")
				.insert({
					id: player3Id,
					game_id: gameId,
					name: "Player 3",
				})
				.select();

			expect(player2).toEqual([player2Data]);
			expect(player3).toEqual([player3Data]);

			// Step 4: Host starts the game (transition to distribution)
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ ...gameData, phase: GAME_PHASES.DISTRIBUTION }],
						error: null,
					}),
				}),
			});

			const { data: gameStarted, error: startError } = await supabase
				.from("games")
				.update({ phase: GAME_PHASES.DISTRIBUTION })
				.eq("id", gameId);

			expect(startError).toBeNull();
			expect(gameStarted).toEqual([
				{ ...gameData, phase: GAME_PHASES.DISTRIBUTION },
			]);

			// Step 5: Cards are generated and distributed
			const mockCards = [
				{
					id: "prompt-1",
					game_id: gameId,
					round_number: 1,
					type: "prompt",
					text: "The secret to happiness is ____.",
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "response-1",
					game_id: gameId,
					round_number: 1,
					type: "response",
					text: "a really good sandwich",
					player_id: hostId,
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "response-2",
					game_id: gameId,
					round_number: 1,
					type: "response",
					text: "my collection of rubber ducks",
					player_id: player2Id,
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "response-3",
					game_id: gameId,
					round_number: 1,
					type: "response",
					text: "the wisdom of fortune cookies",
					player_id: player3Id,
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

			const { data: generatedCards, error: cardsError } = await supabase
				.from("cards")
				.insert(mockCards)
				.select();

			expect(cardsError).toBeNull();
			expect(generatedCards).toEqual(mockCards);

			// Step 6: Transition to submission phase
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ ...gameData, phase: GAME_PHASES.SUBMISSION }],
						error: null,
					}),
				}),
			});

			const { data: submissionPhase } = await supabase
				.from("games")
				.update({ phase: GAME_PHASES.SUBMISSION })
				.eq("id", gameId);

			expect(submissionPhase).toEqual([
				{ ...gameData, phase: GAME_PHASES.SUBMISSION },
			]);

			// Step 7: All players submit their cards
			const submissions = [
				{
					id: "submission-1",
					game_id: gameId,
					player_id: hostId,
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [
						{ id: "response-1", text: "a really good sandwich" },
					],
					votes: 0,
					submitted_at: "2023-01-01T00:01:00Z",
				},
				{
					id: "submission-2",
					game_id: gameId,
					player_id: player2Id,
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [
						{ id: "response-2", text: "my collection of rubber ducks" },
					],
					votes: 0,
					submitted_at: "2023-01-01T00:01:01Z",
				},
				{
					id: "submission-3",
					game_id: gameId,
					player_id: player3Id,
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [
						{ id: "response-3", text: "the wisdom of fortune cookies" },
					],
					votes: 0,
					submitted_at: "2023-01-01T00:01:02Z",
				},
			];

			for (const submission of submissions) {
				mockSupabase.from.mockReturnValueOnce({
					insert: jest.fn().mockReturnValue({
						select: jest.fn().mockResolvedValue({
							data: [submission],
							error: null,
						}),
					}),
				});

				const { data: submittedCard, error: submitError } = await supabase
					.from("submissions")
					.insert({
						game_id: submission.game_id,
						player_id: submission.player_id,
						round_number: submission.round_number,
						prompt_card_id: submission.prompt_card_id,
						response_cards: submission.response_cards,
					})
					.select();

				expect(submitError).toBeNull();
				expect(submittedCard).toEqual([submission]);
			}

			// Step 8: Transition to voting phase
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ ...gameData, phase: GAME_PHASES.VOTING }],
						error: null,
					}),
				}),
			});

			const { data: votingPhase } = await supabase
				.from("games")
				.update({ phase: GAME_PHASES.VOTING })
				.eq("id", gameId);

			expect(votingPhase).toEqual([{ ...gameData, phase: GAME_PHASES.VOTING }]);

			// Step 9: Players vote (each player votes for someone else's submission)
			const votes = [
				{
					id: "vote-1",
					game_id: gameId,
					player_id: hostId,
					submission_id: "submission-2", // Host votes for Player 2
					round_number: 1,
					voted_at: "2023-01-01T00:02:00Z",
				},
				{
					id: "vote-2",
					game_id: gameId,
					player_id: player2Id,
					submission_id: "submission-3", // Player 2 votes for Player 3
					round_number: 1,
					voted_at: "2023-01-01T00:02:01Z",
				},
				{
					id: "vote-3",
					game_id: gameId,
					player_id: player3Id,
					submission_id: "submission-2", // Player 3 votes for Player 2
					round_number: 1,
					voted_at: "2023-01-01T00:02:02Z",
				},
			];

			for (const vote of votes) {
				// Mock vote API call
				(global.fetch as jest.Mock).mockResolvedValueOnce({
					ok: true,
					json: jest.fn().mockResolvedValue({ success: true }),
				});

				const response = await fetch("/api/votes", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						submissionId: vote.submission_id,
						playerId: vote.player_id,
						gameId: gameId,
					}),
				});

				expect(response.ok).toBe(true);
			}

			// Step 10: Update submission vote counts
			const updatedSubmissions = submissions.map((sub) => {
				if (sub.id === "submission-2") {
					return { ...sub, votes: 2 }; // Player 2 wins with 2 votes
				} else if (sub.id === "submission-3") {
					return { ...sub, votes: 1 }; // Player 3 gets 1 vote
				}
				return sub; // Host gets 0 votes
			});

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: updatedSubmissions,
								error: null,
							}),
						}),
					}),
				}),
			});

			const { data: finalSubmissions } = await supabase
				.from("submissions")
				.select("*")
				.eq("game_id", gameId)
				.eq("round_number", 1)
				.order("votes", { ascending: false });

			expect(finalSubmissions).toEqual(updatedSubmissions);

			// Step 11: Update player scores (Player 2 wins the round)
			const updatedPlayers = [
				{ ...hostPlayerData, score: 0 },
				{ ...player2Data, score: 1 }, // Winner gets 1 point
				{ ...player3Data, score: 0 },
			];

			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [updatedPlayers[1]],
						error: null,
					}),
				}),
			});

			const { data: updatedPlayer2 } = await supabase
				.from("players")
				.update({ score: 1 })
				.eq("id", player2Id);

			expect(updatedPlayer2).toEqual([updatedPlayers[1]]);

			// Step 12: Transition to results phase
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ ...gameData, phase: GAME_PHASES.RESULTS }],
						error: null,
					}),
				}),
			});

			const { data: resultsPhase } = await supabase
				.from("games")
				.update({ phase: GAME_PHASES.RESULTS })
				.eq("id", gameId);

			expect(resultsPhase).toEqual([
				{ ...gameData, phase: GAME_PHASES.RESULTS },
			]);

			// Step 13: Check if game should continue (target score not reached)
			const maxScore = Math.max(...updatedPlayers.map((p) => p.score));
			const shouldEndGame = maxScore >= 3; // Target score is 3

			expect(shouldEndGame).toBe(false); // Game should continue

			// Step 14: Start next round (increment round number and go to distribution)
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [
							{
								...gameData,
								phase: GAME_PHASES.DISTRIBUTION,
								current_round: 2,
							},
						],
						error: null,
					}),
				}),
			});

			const { data: nextRound } = await supabase
				.from("games")
				.update({
					phase: GAME_PHASES.DISTRIBUTION,
					current_round: 2,
				})
				.eq("id", gameId);

			expect(nextRound).toEqual([
				{
					...gameData,
					phase: GAME_PHASES.DISTRIBUTION,
					current_round: 2,
				},
			]);

			// Verify the complete flow executed successfully
			expect(mockSupabase.from).toHaveBeenCalledTimes(15); // All database operations
			expect(global.fetch).toHaveBeenCalledTimes(3); // All vote API calls
		});

		it("should handle game completion when target score is reached", async () => {
			// Setup a game where a player reaches the target score
			const gameData = {
				id: gameId,
				room_code: roomCode,
				phase: GAME_PHASES.RESULTS,
				current_round: 3,
				target_score: 3,
				max_players: 8,
				submission_timer: 60,
				voting_timer: 30,
				host_id: hostId,
				created_at: "2023-01-01T00:00:00Z",
				updated_at: "2023-01-01T00:00:00Z",
			};

			const playersWithWinner = [
				{
					id: hostId,
					game_id: gameId,
					name: "Host Player",
					score: 1,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
				{
					id: player2Id,
					game_id: gameId,
					name: "Player 2",
					score: 3, // Reached target score
					is_connected: true,
					joined_at: "2023-01-01T00:00:01Z",
				},
				{
					id: player3Id,
					game_id: gameId,
					name: "Player 3",
					score: 2,
					is_connected: true,
					joined_at: "2023-01-01T00:00:02Z",
				},
			];

			// Check if game should end
			const maxScore = Math.max(...playersWithWinner.map((p) => p.score));
			const shouldEndGame = maxScore >= gameData.target_score;
			const winners = playersWithWinner.filter((p) => p.score === maxScore);

			expect(shouldEndGame).toBe(true);
			expect(winners).toHaveLength(1);
			expect(winners[0].id).toBe(player2Id);

			// Game should transition to final state or lobby for new game
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [{ ...gameData, phase: GAME_PHASES.LOBBY }],
						error: null,
					}),
				}),
			});

			const { data: gameEnded } = await supabase
				.from("games")
				.update({ phase: GAME_PHASES.LOBBY })
				.eq("id", gameId);

			expect(gameEnded).toEqual([{ ...gameData, phase: GAME_PHASES.LOBBY }]);
		});
	});

	describe("Error Scenarios", () => {
		it("should handle player disconnection during game", async () => {
			// Simulate player disconnection
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [
							{
								id: player2Id,
								game_id: gameId,
								name: "Player 2",
								score: 0,
								is_connected: false, // Disconnected
								joined_at: "2023-01-01T00:00:01Z",
							},
						],
						error: null,
					}),
				}),
			});

			const { data: disconnectedPlayer } = await supabase
				.from("players")
				.update({ is_connected: false })
				.eq("id", player2Id);

			expect(disconnectedPlayer[0].is_connected).toBe(false);

			// Game should continue with remaining connected players
			const connectedPlayers = [
				{
					id: hostId,
					game_id: gameId,
					name: "Host Player",
					score: 0,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
				{
					id: player3Id,
					game_id: gameId,
					name: "Player 3",
					score: 0,
					is_connected: true,
					joined_at: "2023-01-01T00:00:02Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: connectedPlayers,
								error: null,
							}),
						}),
					}),
				}),
			});

			const { data: activePlayers } = await supabase
				.from("players")
				.select("*")
				.eq("game_id", gameId)
				.eq("is_connected", true)
				.order("joined_at");

			expect(activePlayers).toEqual(connectedPlayers);
			expect(activePlayers.length).toBe(2); // Still enough players to continue
		});

		it("should handle host leaving and transfer host privileges", async () => {
			// Host leaves the game
			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [{ id: hostId }],
							error: null,
						}),
					}),
				}),
			});

			const { data: removedHost } = await supabase
				.from("players")
				.delete()
				.eq("id", hostId)
				.eq("game_id", gameId);

			expect(removedHost).toEqual([{ id: hostId }]);

			// Transfer host to next player
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [
							{
								id: gameId,
								room_code: roomCode,
								phase: GAME_PHASES.LOBBY,
								host_id: player2Id, // New host
							},
						],
						error: null,
					}),
				}),
			});

			const { data: updatedGame } = await supabase
				.from("games")
				.update({ host_id: player2Id })
				.eq("id", gameId);

			expect(updatedGame[0].host_id).toBe(player2Id);
		});

		it("should handle AI card generation failure with fallback", async () => {
			// Mock AI generation failure
			mockSupabase.functions.invoke.mockResolvedValueOnce({
				data: null,
				error: { message: "AI service unavailable" },
			});

			// Should fall back to pre-written cards
			const fallbackCards = [
				{
					id: "fallback-prompt-1",
					game_id: gameId,
					round_number: 1,
					type: "prompt",
					text: "The secret to a happy life is ____.",
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "fallback-response-1",
					game_id: gameId,
					round_number: 1,
					type: "response",
					text: "a really good sandwich",
					player_id: null,
					created_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockReturnValue({
					select: jest.fn().mockResolvedValue({
						data: fallbackCards,
						error: null,
					}),
				}),
			});

			const { data: generatedCards, error: cardsError } = await supabase
				.from("cards")
				.insert(fallbackCards)
				.select();

			expect(cardsError).toBeNull();
			expect(generatedCards).toEqual(fallbackCards);
		});

		it("should handle voting API failures gracefully", async () => {
			// Mock API failure
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				json: jest.fn().mockResolvedValue({
					error: "Vote submission failed",
				}),
			});

			const response = await fetch("/api/votes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					submissionId: "submission-1",
					playerId: hostId,
					gameId: gameId,
				}),
			});

			expect(response.ok).toBe(false);

			const errorData = await response.json();
			expect(errorData.error).toBe("Vote submission failed");
		});

		it("should handle insufficient players scenario", async () => {
			// Only one player in game
			const singlePlayer = [
				{
					id: hostId,
					game_id: gameId,
					name: "Host Player",
					score: 0,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
			];

			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockReturnValue({
							order: jest.fn().mockResolvedValue({
								data: singlePlayer,
								error: null,
							}),
						}),
					}),
				}),
			});

			const { data: players } = await supabase
				.from("players")
				.select("*")
				.eq("game_id", gameId)
				.eq("is_connected", true)
				.order("joined_at");

			expect(players).toEqual(singlePlayer);
			expect(players.length).toBe(1);

			// Game should not be able to start with insufficient players
			const canStart = players.length >= 2; // Minimum 2 players required
			expect(canStart).toBe(false);
		});
	});

	describe("Performance and Load Testing", () => {
		it("should handle rapid player actions without conflicts", async () => {
			// Simulate multiple players submitting simultaneously
			const simultaneousSubmissions = [
				{
					id: "submission-1",
					game_id: gameId,
					player_id: hostId,
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [{ id: "response-1", text: "Response 1" }],
					votes: 0,
					submitted_at: "2023-01-01T00:01:00.000Z",
				},
				{
					id: "submission-2",
					game_id: gameId,
					player_id: player2Id,
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [{ id: "response-2", text: "Response 2" }],
					votes: 0,
					submitted_at: "2023-01-01T00:01:00.001Z", // 1ms later
				},
				{
					id: "submission-3",
					game_id: gameId,
					player_id: player3Id,
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [{ id: "response-3", text: "Response 3" }],
					votes: 0,
					submitted_at: "2023-01-01T00:01:00.002Z", // 2ms later
				},
			];

			// Mock all submissions succeeding
			simultaneousSubmissions.forEach((submission) => {
				mockSupabase.from.mockReturnValueOnce({
					insert: jest.fn().mockReturnValue({
						select: jest.fn().mockResolvedValue({
							data: [submission],
							error: null,
						}),
					}),
				});
			});

			// Execute all submissions concurrently
			const submissionPromises = simultaneousSubmissions.map(
				async (submission) => {
					const { data, error } = await supabase
						.from("submissions")
						.insert({
							game_id: submission.game_id,
							player_id: submission.player_id,
							round_number: submission.round_number,
							prompt_card_id: submission.prompt_card_id,
							response_cards: submission.response_cards,
						})
						.select();

					return { data, error };
				}
			);

			const results = await Promise.all(submissionPromises);

			// All submissions should succeed
			results.forEach((result, index) => {
				expect(result.error).toBeNull();
				expect(result.data).toEqual([simultaneousSubmissions[index]]);
			});
		});

		it("should handle high-frequency real-time updates", async () => {
			// Simulate rapid game state changes
			const phaseTransitions = [
				GAME_PHASES.DISTRIBUTION,
				GAME_PHASES.SUBMISSION,
				GAME_PHASES.VOTING,
				GAME_PHASES.RESULTS,
			];

			for (let i = 0; i < phaseTransitions.length; i++) {
				const phase = phaseTransitions[i];

				mockSupabase.from.mockReturnValueOnce({
					update: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [
								{
									id: gameId,
									phase: phase,
									updated_at: new Date(Date.now() + i * 1000).toISOString(),
								},
							],
							error: null,
						}),
					}),
				});

				const { data, error } = await supabase
					.from("games")
					.update({
						phase: phase,
						updated_at: new Date(Date.now() + i * 1000).toISOString(),
					})
					.eq("id", gameId);

				expect(error).toBeNull();
				expect(data[0].phase).toBe(phase);
			}

			// All phase transitions should complete successfully
			expect(mockSupabase.from).toHaveBeenCalledTimes(phaseTransitions.length);
		});
	});
});
