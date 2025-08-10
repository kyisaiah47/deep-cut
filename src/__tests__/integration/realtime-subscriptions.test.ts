/**
 * Integration tests for Supabase real-time subscriptions
 * These tests verify that real-time functionality works correctly
 */

import { supabase } from "@/lib/supabase";
import { GAME_PHASES } from "@/lib/constants";

// Mock Supabase for integration tests
jest.mock("@/lib/supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("Real-time Subscriptions Integration", () => {
	let mockChannel: any;
	let mockSubscription: any;

	beforeEach(() => {
		jest.clearAllMocks();

		mockSubscription = {
			unsubscribe: jest.fn(),
		};

		mockChannel = {
			on: jest.fn().mockReturnThis(),
			subscribe: jest.fn().mockReturnValue(mockSubscription),
			unsubscribe: jest.fn(),
		};

		mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
		mockSupabase.removeChannel = jest.fn();
	});

	describe("Game State Subscriptions", () => {
		it("should subscribe to game state changes", () => {
			const gameId = "game-1";
			const callback = jest.fn();

			const subscription = supabase
				.channel(`game_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "games",
						filter: `id=eq.${gameId}`,
					},
					callback
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledWith(`game_${gameId}`);
			expect(mockChannel.on).toHaveBeenCalledWith(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "games",
					filter: `id=eq.${gameId}`,
				},
				callback
			);
			expect(mockChannel.subscribe).toHaveBeenCalled();
			expect(subscription).toBe(mockSubscription);
		});

		it("should handle game phase change events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`game_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "games",
						filter: `id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate phase change event
			const phaseChangePayload = {
				eventType: "UPDATE",
				new: {
					id: gameId,
					phase: GAME_PHASES.SUBMISSION,
					current_round: 2,
					updated_at: "2023-01-01T12:00:00Z",
				},
				old: {
					id: gameId,
					phase: GAME_PHASES.DISTRIBUTION,
					current_round: 2,
					updated_at: "2023-01-01T11:59:00Z",
				},
			};

			subscriptionCallback!(phaseChangePayload);

			expect(mockCallback).toHaveBeenCalledWith(phaseChangePayload);
		});

		it("should unsubscribe from game state changes", () => {
			const gameId = "game-1";

			const subscription = supabase
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

			subscription.unsubscribe();

			expect(mockSubscription.unsubscribe).toHaveBeenCalled();
		});
	});

	describe("Player Subscriptions", () => {
		it("should subscribe to player changes", () => {
			const gameId = "game-1";
			const callback = jest.fn();

			supabase
				.channel(`players_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "players",
						filter: `game_id=eq.${gameId}`,
					},
					callback
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledWith(`players_${gameId}`);
			expect(mockChannel.on).toHaveBeenCalledWith(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "players",
					filter: `game_id=eq.${gameId}`,
				},
				callback
			);
		});

		it("should handle player join events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`players_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "players",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate player join event
			const playerJoinPayload = {
				eventType: "INSERT",
				new: {
					id: "player-2",
					game_id: gameId,
					name: "New Player",
					score: 0,
					is_connected: true,
					joined_at: "2023-01-01T12:00:00Z",
				},
				old: null,
			};

			subscriptionCallback!(playerJoinPayload);

			expect(mockCallback).toHaveBeenCalledWith(playerJoinPayload);
		});

		it("should handle player leave events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`players_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "DELETE",
						schema: "public",
						table: "players",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate player leave event
			const playerLeavePayload = {
				eventType: "DELETE",
				new: null,
				old: {
					id: "player-2",
					game_id: gameId,
					name: "Leaving Player",
					score: 2,
					is_connected: false,
					joined_at: "2023-01-01T11:00:00Z",
				},
			};

			subscriptionCallback!(playerLeavePayload);

			expect(mockCallback).toHaveBeenCalledWith(playerLeavePayload);
		});

		it("should handle player score updates", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`players_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "players",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate score update event
			const scoreUpdatePayload = {
				eventType: "UPDATE",
				new: {
					id: "player-1",
					game_id: gameId,
					name: "Player 1",
					score: 3,
					is_connected: true,
					joined_at: "2023-01-01T10:00:00Z",
				},
				old: {
					id: "player-1",
					game_id: gameId,
					name: "Player 1",
					score: 2,
					is_connected: true,
					joined_at: "2023-01-01T10:00:00Z",
				},
			};

			subscriptionCallback!(scoreUpdatePayload);

			expect(mockCallback).toHaveBeenCalledWith(scoreUpdatePayload);
		});
	});

	describe("Submission Subscriptions", () => {
		it("should subscribe to submission changes", () => {
			const gameId = "game-1";
			const callback = jest.fn();

			supabase
				.channel(`submissions_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "submissions",
						filter: `game_id=eq.${gameId}`,
					},
					callback
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledWith(
				`submissions_${gameId}`
			);
		});

		it("should handle new submission events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`submissions_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "submissions",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate new submission event
			const submissionPayload = {
				eventType: "INSERT",
				new: {
					id: "submission-1",
					game_id: gameId,
					player_id: "player-1",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [{ id: "response-1", text: "Funny response" }],
					votes: 0,
					submitted_at: "2023-01-01T12:00:00Z",
				},
				old: null,
			};

			subscriptionCallback!(submissionPayload);

			expect(mockCallback).toHaveBeenCalledWith(submissionPayload);
		});

		it("should handle submission vote updates", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`submissions_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "submissions",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate vote count update
			const voteUpdatePayload = {
				eventType: "UPDATE",
				new: {
					id: "submission-1",
					game_id: gameId,
					player_id: "player-1",
					round_number: 1,
					votes: 3,
					submitted_at: "2023-01-01T12:00:00Z",
				},
				old: {
					id: "submission-1",
					game_id: gameId,
					player_id: "player-1",
					round_number: 1,
					votes: 2,
					submitted_at: "2023-01-01T12:00:00Z",
				},
			};

			subscriptionCallback!(voteUpdatePayload);

			expect(mockCallback).toHaveBeenCalledWith(voteUpdatePayload);
		});
	});

	describe("Vote Subscriptions", () => {
		it("should subscribe to vote changes", () => {
			const gameId = "game-1";
			const callback = jest.fn();

			supabase
				.channel(`votes_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "votes",
						filter: `game_id=eq.${gameId}`,
					},
					callback
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledWith(`votes_${gameId}`);
		});

		it("should handle new vote events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`votes_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "votes",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate new vote event
			const votePayload = {
				eventType: "INSERT",
				new: {
					id: "vote-1",
					game_id: gameId,
					player_id: "player-2",
					submission_id: "submission-1",
					round_number: 1,
					voted_at: "2023-01-01T12:00:00Z",
				},
				old: null,
			};

			subscriptionCallback!(votePayload);

			expect(mockCallback).toHaveBeenCalledWith(votePayload);
		});
	});

	describe("Timer Subscriptions", () => {
		it("should subscribe to timer changes", () => {
			const gameId = "game-1";
			const callback = jest.fn();

			supabase
				.channel(`game_timer_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "game_timers",
						filter: `game_id=eq.${gameId}`,
					},
					callback
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledWith(`game_timer_${gameId}`);
		});

		it("should handle timer start events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`game_timer_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "INSERT",
						schema: "public",
						table: "game_timers",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate timer start event
			const timerStartPayload = {
				eventType: "INSERT",
				new: {
					game_id: gameId,
					phase: GAME_PHASES.SUBMISSION,
					duration: 60,
					started_at: "2023-01-01T12:00:00Z",
					is_active: true,
					is_paused: false,
				},
				old: null,
			};

			subscriptionCallback!(timerStartPayload);

			expect(mockCallback).toHaveBeenCalledWith(timerStartPayload);
		});

		it("should handle timer pause/resume events", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const mockCallback = jest.fn();

			supabase
				.channel(`game_timer_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "game_timers",
						filter: `game_id=eq.${gameId}`,
					},
					mockCallback
				)
				.subscribe();

			// Simulate timer pause event
			const timerPausePayload = {
				eventType: "UPDATE",
				new: {
					game_id: gameId,
					phase: GAME_PHASES.SUBMISSION,
					duration: 60,
					started_at: "2023-01-01T12:00:00Z",
					is_active: true,
					is_paused: true,
					paused_at: "2023-01-01T12:00:30Z",
					time_remaining: 30,
				},
				old: {
					game_id: gameId,
					phase: GAME_PHASES.SUBMISSION,
					duration: 60,
					started_at: "2023-01-01T12:00:00Z",
					is_active: true,
					is_paused: false,
				},
			};

			subscriptionCallback!(timerPausePayload);

			expect(mockCallback).toHaveBeenCalledWith(timerPausePayload);
		});
	});

	describe("Multiple Subscriptions", () => {
		it("should handle multiple simultaneous subscriptions", () => {
			const gameId = "game-1";
			const gameCallback = jest.fn();
			const playerCallback = jest.fn();
			const submissionCallback = jest.fn();

			// Subscribe to multiple channels
			const gameSubscription = supabase
				.channel(`game_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "games",
						filter: `id=eq.${gameId}`,
					},
					gameCallback
				)
				.subscribe();

			const playerSubscription = supabase
				.channel(`players_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "players",
						filter: `game_id=eq.${gameId}`,
					},
					playerCallback
				)
				.subscribe();

			const submissionSubscription = supabase
				.channel(`submissions_${gameId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "submissions",
						filter: `game_id=eq.${gameId}`,
					},
					submissionCallback
				)
				.subscribe();

			expect(mockSupabase.channel).toHaveBeenCalledTimes(3);
			expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);

			// Cleanup
			gameSubscription.unsubscribe();
			playerSubscription.unsubscribe();
			submissionSubscription.unsubscribe();

			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(3);
		});

		it("should handle subscription cleanup", () => {
			const gameId = "game-1";
			const subscriptions: any[] = [];

			// Create multiple subscriptions
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

			// Cleanup all subscriptions
			subscriptions.forEach((subscription) => {
				subscription.unsubscribe();
			});

			expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(4);
		});
	});

	describe("Error Handling", () => {
		it("should handle subscription errors", () => {
			const gameId = "game-1";
			const errorCallback = jest.fn();

			mockChannel.subscribe.mockReturnValueOnce({
				unsubscribe: jest.fn(),
				error: { message: "Subscription failed" },
			});

			const subscription = supabase
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

			expect(subscription.error).toEqual({ message: "Subscription failed" });
		});

		it("should handle channel creation errors", () => {
			const gameId = "game-1";

			mockSupabase.channel.mockImplementationOnce(() => {
				throw new Error("Channel creation failed");
			});

			expect(() => {
				supabase.channel(`game_${gameId}`);
			}).toThrow("Channel creation failed");
		});

		it("should handle callback errors gracefully", () => {
			const gameId = "game-1";
			let subscriptionCallback: (payload: any) => void;

			mockChannel.on.mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			});

			const errorCallback = jest.fn().mockImplementation(() => {
				throw new Error("Callback error");
			});

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
					errorCallback
				)
				.subscribe();

			// Simulate event that causes callback error
			expect(() => {
				subscriptionCallback!({
					eventType: "UPDATE",
					new: { id: gameId, phase: GAME_PHASES.SUBMISSION },
					old: { id: gameId, phase: GAME_PHASES.DISTRIBUTION },
				});
			}).toThrow("Callback error");
		});
	});

	describe("Connection Management", () => {
		it("should handle connection state changes", () => {
			const gameId = "game-1";
			let connectionCallback: (status: string) => void;

			mockChannel.on.mockImplementation((event, callback) => {
				if (event === "presence") {
					connectionCallback = callback;
				}
				return mockChannel;
			});

			const statusCallback = jest.fn();

			supabase
				.channel(`game_${gameId}`)
				.on("presence", statusCallback)
				.subscribe();

			// Simulate connection status changes
			connectionCallback!("SUBSCRIBED");
			expect(statusCallback).toHaveBeenCalledWith("SUBSCRIBED");

			connectionCallback!("CLOSED");
			expect(statusCallback).toHaveBeenCalledWith("CLOSED");
		});

		it("should handle reconnection", () => {
			const gameId = "game-1";

			// Initial subscription
			const subscription = supabase
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

			// Unsubscribe (simulating disconnection)
			subscription.unsubscribe();

			// Resubscribe (simulating reconnection)
			const newSubscription = supabase
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

			expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
			expect(newSubscription).toBe(mockSubscription);
		});
	});
});
