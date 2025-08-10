/**
 * Performance tests for real-time synchronization under load
 * These tests verify that the system can handle multiple concurrent games and players
 */

import { supabase } from "@/lib/supabase";
import {
	generateRoomCode,
	generatePlayerId,
	generateGameId,
} from "@/lib/game-utils";
import { GAME_PHASES } from "@/lib/constants";

// Mock Supabase for performance tests
jest.mock("@/lib/supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock performance.now for timing measurements
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, "performance", {
	value: { now: mockPerformanceNow },
});

describe("Real-time Synchronization Performance", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Mock performance timing
		let currentTime = 0;
		mockPerformanceNow.mockImplementation(() => {
			currentTime += Math.random() * 10; // Simulate variable timing
			return currentTime;
		});

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
		});

		// Mock real-time subscriptions
		const mockChannel = {
			on: jest.fn().mockReturnThis(),
			subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
			unsubscribe: jest.fn(),
		};
		mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
	});

	describe("Multiple Concurrent Games", () => {
		it("should handle 10 concurrent games with 8 players each", async () => {
			const startTime = performance.now();
			const numberOfGames = 10;
			const playersPerGame = 8;
			const games: any[] = [];
			const players: any[] = [];

			// Create multiple games concurrently
			const gameCreationPromises = Array.from(
				{ length: numberOfGames },
				async (_, gameIndex) => {
					const gameId = generateGameId();
					const roomCode = generateRoomCode();
					const hostId = generatePlayerId();

					const gameData = {
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

					games.push(gameData);

					// Mock game creation
					mockSupabase.from.mockReturnValueOnce({
						insert: jest.fn().mockReturnValue({
							select: jest.fn().mockResolvedValue({
								data: [gameData],
								error: null,
							}),
						}),
					});

					const { data: createdGame } = await supabase
						.from("games")
						.insert({
							id: gameId,
							room_code: roomCode,
							host_id: hostId,
						})
						.select();

					// Create players for this game
					const gamePlayerPromises = Array.from(
						{ length: playersPerGame },
						async (_, playerIndex) => {
							const playerId = playerIndex === 0 ? hostId : generatePlayerId();
							const playerData = {
								id: playerId,
								game_id: gameId,
								name: `Player ${playerIndex + 1} Game ${gameIndex + 1}`,
								score: 0,
								is_connected: true,
								joined_at: new Date(
									Date.now() + playerIndex * 100
								).toISOString(),
							};

							players.push(playerData);

							mockSupabase.from.mockReturnValueOnce({
								insert: jest.fn().mockReturnValue({
									select: jest.fn().mockResolvedValue({
										data: [playerData],
										error: null,
									}),
								}),
							});

							return supabase
								.from("players")
								.insert({
									id: playerId,
									game_id: gameId,
									name: playerData.name,
								})
								.select();
						}
					);

					await Promise.all(gamePlayerPromises);
					return createdGame;
				}
			);

			const gameResults = await Promise.all(gameCreationPromises);
			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Performance assertions
			expect(gameResults).toHaveLength(numberOfGames);
			expect(players).toHaveLength(numberOfGames * playersPerGame);
			expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
			expect(mockSupabase.from).toHaveBeenCalledTimes(
				numberOfGames + numberOfGames * playersPerGame
			);
		});

		it("should handle rapid phase transitions across multiple games", async () => {
			const numberOfGames = 5;
			const phases = [
				GAME_PHASES.DISTRIBUTION,
				GAME_PHASES.SUBMISSION,
				GAME_PHASES.VOTING,
				GAME_PHASES.RESULTS,
			];

			const startTime = performance.now();
			const phaseTransitionPromises: Promise<any>[] = [];

			// Create phase transitions for multiple games simultaneously
			for (let gameIndex = 0; gameIndex < numberOfGames; gameIndex++) {
				const gameId = generateGameId();

				for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
					const phase = phases[phaseIndex];

					mockSupabase.from.mockReturnValueOnce({
						update: jest.fn().mockReturnValue({
							eq: jest.fn().mockResolvedValue({
								data: [
									{
										id: gameId,
										phase: phase,
										updated_at: new Date().toISOString(),
									},
								],
								error: null,
							}),
						}),
					});

					const transitionPromise = supabase
						.from("games")
						.update({
							phase: phase,
							updated_at: new Date().toISOString(),
						})
						.eq("id", gameId);

					phaseTransitionPromises.push(transitionPromise);
				}
			}

			const results = await Promise.all(phaseTransitionPromises);
			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Performance assertions
			expect(results).toHaveLength(numberOfGames * phases.length);
			expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds

			// All transitions should succeed
			results.forEach((result) => {
				expect(result.error).toBeNull();
				expect(result.data).toHaveLength(1);
			});
		});
	});

	describe("High-Frequency Updates", () => {
		it("should handle 100 rapid player score updates", async () => {
			const numberOfUpdates = 100;
			const gameId = generateGameId();
			const playerId = generatePlayerId();

			const startTime = performance.now();
			const updatePromises: Promise<any>[] = [];

			// Create rapid score updates
			for (let i = 0; i < numberOfUpdates; i++) {
				mockSupabase.from.mockReturnValueOnce({
					update: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [
								{
									id: playerId,
									score: i + 1,
									updated_at: new Date(Date.now() + i).toISOString(),
								},
							],
							error: null,
						}),
					}),
				});

				const updatePromise = supabase
					.from("players")
					.update({
						score: i + 1,
						updated_at: new Date(Date.now() + i).toISOString(),
					})
					.eq("id", playerId);

				updatePromises.push(updatePromise);
			}

			const results = await Promise.all(updatePromises);
			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Performance assertions
			expect(results).toHaveLength(numberOfUpdates);
			expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds

			// All updates should succeed
			results.forEach((result, index) => {
				expect(result.error).toBeNull();
				expect(result.data[0].score).toBe(index + 1);
			});
		});

		it("should handle burst of submission creations", async () => {
			const numberOfSubmissions = 50;
			const gameId = generateGameId();
			const roundNumber = 1;

			const startTime = performance.now();
			const submissionPromises: Promise<any>[] = [];

			// Create burst of submissions
			for (let i = 0; i < numberOfSubmissions; i++) {
				const playerId = generatePlayerId();
				const submissionData = {
					id: `submission-${i}`,
					game_id: gameId,
					player_id: playerId,
					round_number: roundNumber,
					prompt_card_id: "prompt-1",
					response_cards: [{ id: `response-${i}`, text: `Response ${i}` }],
					votes: 0,
					submitted_at: new Date(Date.now() + i * 10).toISOString(),
				};

				mockSupabase.from.mockReturnValueOnce({
					insert: jest.fn().mockReturnValue({
						select: jest.fn().mockResolvedValue({
							data: [submissionData],
							error: null,
						}),
					}),
				});

				const submissionPromise = supabase
					.from("submissions")
					.insert({
						game_id: submissionData.game_id,
						player_id: submissionData.player_id,
						round_number: submissionData.round_number,
						prompt_card_id: submissionData.prompt_card_id,
						response_cards: submissionData.response_cards,
					})
					.select();

				submissionPromises.push(submissionPromise);
			}

			const results = await Promise.all(submissionPromises);
			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Performance assertions
			expect(results).toHaveLength(numberOfSubmissions);
			expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds

			// All submissions should succeed
			results.forEach((result, index) => {
				expect(result.error).toBeNull();
				expect(result.data[0].id).toBe(`submission-${index}`);
			});
		});
	});

	describe("Real-time Subscription Performance", () => {
		it("should handle multiple simultaneous subscriptions efficiently", async () => {
			const numberOfGames = 20;
			const subscriptionsPerGame = 4; // games, players, submissions, votes
			const totalSubscriptions = numberOfGames * subscriptionsPerGame;

			const startTime = performance.now();
			const subscriptions: any[] = [];

			// Create multiple subscriptions for each game
			for (let gameIndex = 0; gameIndex < numberOfGames; gameIndex++) {
				const gameId = generateGameId();
				const tables = ["games", "players", "submissions", "votes"];

				tables.forEach((table) => {
					const subscription = supabase
						.channel(`${table}_${gameId}`)
						.on(
							"postgres_changes",
							{
								event: "*",
								schema: "public",
								table,
								filter: `game_id=eq.${gameId}`,
							},
							jest.fn()
						)
						.subscribe();

					subscriptions.push(subscription);
				});
			}

			const endTime = performance.now();
			const subscriptionTime = endTime - startTime;

			// Performance assertions
			expect(subscriptions).toHaveLength(totalSubscriptions);
			expect(subscriptionTime).toBeLessThan(1000); // Should complete within 1 second
			expect(mockSupabase.channel).toHaveBeenCalledTimes(totalSubscriptions);

			// Test cleanup performance
			const cleanupStartTime = performance.now();
			subscriptions.forEach((subscription) => {
				subscription.unsubscribe();
			});
			const cleanupEndTime = performance.now();
			const cleanupTime = cleanupEndTime - cleanupStartTime;

			expect(cleanupTime).toBeLessThan(500); // Cleanup should be fast
		});

		it("should handle high-frequency subscription events", async () => {
			const gameId = generateGameId();
			const numberOfEvents = 200;
			let eventsProcessed = 0;
			let subscriptionCallback: (payload: any) => void;

			// Setup subscription with callback tracking
			const mockChannel = {
				on: jest.fn().mockImplementation((event, config, callback) => {
					subscriptionCallback = callback;
					return mockChannel;
				}),
				subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
				unsubscribe: jest.fn(),
			};

			mockSupabase.channel.mockReturnValue(mockChannel);

			const eventCallback = jest.fn().mockImplementation(() => {
				eventsProcessed++;
			});

			// Create subscription
			supabase
				.channel(`game_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "games",
						filter: `id=eq.${gameId}`,
					},
					eventCallback
				)
				.subscribe();

			// Simulate high-frequency events
			const startTime = performance.now();

			for (let i = 0; i < numberOfEvents; i++) {
				const eventPayload = {
					eventType: "UPDATE",
					new: {
						id: gameId,
						phase: i % 2 === 0 ? GAME_PHASES.SUBMISSION : GAME_PHASES.VOTING,
						updated_at: new Date(Date.now() + i).toISOString(),
					},
					old: {
						id: gameId,
						phase: i % 2 === 0 ? GAME_PHASES.VOTING : GAME_PHASES.SUBMISSION,
						updated_at: new Date(Date.now() + i - 1).toISOString(),
					},
				};

				subscriptionCallback!(eventPayload);
			}

			const endTime = performance.now();
			const processingTime = endTime - startTime;

			// Performance assertions
			expect(eventsProcessed).toBe(numberOfEvents);
			expect(processingTime).toBeLessThan(1000); // Should process within 1 second
			expect(eventCallback).toHaveBeenCalledTimes(numberOfEvents);
		});
	});

	describe("Memory and Resource Management", () => {
		it("should efficiently manage memory during long-running games", async () => {
			const gameId = generateGameId();
			const numberOfRounds = 20;
			const playersPerRound = 8;
			const submissionsPerRound = playersPerRound;

			const startTime = performance.now();
			let totalOperations = 0;

			// Simulate a long-running game with many rounds
			for (let round = 1; round <= numberOfRounds; round++) {
				// Create submissions for this round
				const submissionPromises = Array.from(
					{ length: submissionsPerRound },
					async (_, index) => {
						const playerId = generatePlayerId();
						const submissionData = {
							id: `submission-${round}-${index}`,
							game_id: gameId,
							player_id: playerId,
							round_number: round,
							prompt_card_id: `prompt-${round}`,
							response_cards: [
								{ id: `response-${round}-${index}`, text: `Response ${index}` },
							],
							votes: Math.floor(Math.random() * 3),
							submitted_at: new Date().toISOString(),
						};

						mockSupabase.from.mockReturnValueOnce({
							insert: jest.fn().mockReturnValue({
								select: jest.fn().mockResolvedValue({
									data: [submissionData],
									error: null,
								}),
							}),
						});

						totalOperations++;
						return supabase
							.from("submissions")
							.insert({
								game_id: submissionData.game_id,
								player_id: submissionData.player_id,
								round_number: submissionData.round_number,
								prompt_card_id: submissionData.prompt_card_id,
								response_cards: submissionData.response_cards,
							})
							.select();
					}
				);

				await Promise.all(submissionPromises);

				// Update game phase for next round
				mockSupabase.from.mockReturnValueOnce({
					update: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [
								{
									id: gameId,
									current_round: round + 1,
									phase: GAME_PHASES.DISTRIBUTION,
									updated_at: new Date().toISOString(),
								},
							],
							error: null,
						}),
					}),
				});

				await supabase
					.from("games")
					.update({
						current_round: round + 1,
						phase: GAME_PHASES.DISTRIBUTION,
					})
					.eq("id", gameId);

				totalOperations++;
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Performance assertions
			const expectedOperations = numberOfRounds * (submissionsPerRound + 1); // +1 for phase update
			expect(totalOperations).toBe(expectedOperations);
			expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
			expect(mockSupabase.from).toHaveBeenCalledTimes(expectedOperations);
		});

		it("should handle connection cleanup efficiently", async () => {
			const numberOfConnections = 100;
			const connections: any[] = [];

			// Create many connections
			const startTime = performance.now();

			for (let i = 0; i < numberOfConnections; i++) {
				const gameId = generateGameId();
				const connection = supabase
					.channel(`game_${gameId}`)
					.on(
						"postgres_changes",
						{
							event: "*",
							schema: "public",
							table: "games",
							filter: `id=eq.${gameId}`,
						},
						jest.fn()
					)
					.subscribe();

				connections.push(connection);
			}

			const connectionTime = performance.now() - startTime;

			// Cleanup all connections
			const cleanupStartTime = performance.now();
			connections.forEach((connection) => {
				connection.unsubscribe();
			});
			const cleanupTime = performance.now() - cleanupStartTime;

			// Performance assertions
			expect(connections).toHaveLength(numberOfConnections);
			expect(connectionTime).toBeLessThan(2000); // Connection creation should be fast
			expect(cleanupTime).toBeLessThan(1000); // Cleanup should be very fast
		});
	});

	describe("Stress Testing", () => {
		it("should maintain performance under extreme load", async () => {
			const numberOfGames = 50;
			const playersPerGame = 8;
			const actionsPerPlayer = 10; // submissions, votes, etc.
			const totalActions = numberOfGames * playersPerGame * actionsPerPlayer;

			const startTime = performance.now();
			const actionPromises: Promise<any>[] = [];

			// Generate massive load
			for (let gameIndex = 0; gameIndex < numberOfGames; gameIndex++) {
				const gameId = generateGameId();

				for (let playerIndex = 0; playerIndex < playersPerGame; playerIndex++) {
					const playerId = generatePlayerId();

					for (
						let actionIndex = 0;
						actionIndex < actionsPerPlayer;
						actionIndex++
					) {
						// Alternate between different types of actions
						if (actionIndex % 3 === 0) {
							// Submission
							mockSupabase.from.mockReturnValueOnce({
								insert: jest.fn().mockReturnValue({
									select: jest.fn().mockResolvedValue({
										data: [
											{
												id: `submission-${gameIndex}-${playerIndex}-${actionIndex}`,
												game_id: gameId,
												player_id: playerId,
											},
										],
										error: null,
									}),
								}),
							});

							const submissionPromise = supabase
								.from("submissions")
								.insert({
									game_id: gameId,
									player_id: playerId,
									round_number: 1,
									prompt_card_id: "prompt-1",
									response_cards: [],
								})
								.select();

							actionPromises.push(submissionPromise);
						} else if (actionIndex % 3 === 1) {
							// Vote
							mockSupabase.from.mockReturnValueOnce({
								insert: jest.fn().mockReturnValue({
									select: jest.fn().mockResolvedValue({
										data: [
											{
												id: `vote-${gameIndex}-${playerIndex}-${actionIndex}`,
												game_id: gameId,
												player_id: playerId,
											},
										],
										error: null,
									}),
								}),
							});

							const votePromise = supabase
								.from("votes")
								.insert({
									game_id: gameId,
									player_id: playerId,
									submission_id: "submission-1",
									round_number: 1,
								})
								.select();

							actionPromises.push(votePromise);
						} else {
							// Score update
							mockSupabase.from.mockReturnValueOnce({
								update: jest.fn().mockReturnValue({
									eq: jest.fn().mockResolvedValue({
										data: [
											{
												id: playerId,
												score: actionIndex,
											},
										],
										error: null,
									}),
								}),
							});

							const scorePromise = supabase
								.from("players")
								.update({ score: actionIndex })
								.eq("id", playerId);

							actionPromises.push(scorePromise);
						}
					}
				}
			}

			// Execute all actions concurrently
			const results = await Promise.all(actionPromises);
			const endTime = performance.now();
			const totalTime = endTime - startTime;

			// Performance assertions
			expect(results).toHaveLength(totalActions);
			expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds

			// All actions should succeed
			results.forEach((result) => {
				expect(result.error).toBeNull();
				expect(result.data).toHaveLength(1);
			});

			// Calculate performance metrics
			const actionsPerSecond = totalActions / (totalTime / 1000);
			expect(actionsPerSecond).toBeGreaterThan(100); // Should handle at least 100 actions/second
		});
	});
});
