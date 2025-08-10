import { renderHook, act, waitFor } from "@testing-library/react";
import { useGameActions } from "../useGameActions";
import { useGame } from "@/contexts/GameContext";
import { useRoundOrchestrator } from "../useRoundOrchestrator";
import { supabase } from "@/lib/supabase";
import { GameState, Player } from "@/types/game";
import { GAME_PHASES } from "@/lib/constants";

// Mock dependencies
jest.mock("@/contexts/GameContext");
jest.mock("../useRoundOrchestrator");
jest.mock("@/lib/supabase");

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;
const mockUseRoundOrchestrator = useRoundOrchestrator as jest.MockedFunction<
	typeof useRoundOrchestrator
>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock fetch for API calls
global.fetch = jest.fn();

describe("useGameActions", () => {
	const mockGameState: GameState = {
		id: "game-1",
		room_code: "ABC123",
		phase: GAME_PHASES.LOBBY,
		current_round: 1,
		target_score: 7,
		max_players: 8,
		submission_timer: 60,
		voting_timer: 30,
		host_id: "player-1",
		created_at: "2023-01-01T00:00:00Z",
		updated_at: "2023-01-01T00:00:00Z",
	};

	const mockPlayers: Player[] = [
		{
			id: "player-1",
			game_id: "game-1",
			name: "Host Player",
			score: 0,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "player-2",
			game_id: "game-1",
			name: "Player 2",
			score: 0,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
	];

	const mockCurrentPlayer = mockPlayers[0];

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseGame.mockReturnValue({
			gameState: mockGameState,
			players: mockPlayers,
			submissions: [],
			currentPlayer: mockCurrentPlayer,
			isHost: true,
			updateGamePhase: jest.fn(),
			refetchGameState: jest.fn(),
			broadcastEvent: jest.fn(),
			// Add other required properties
			votes: [],
			currentRoundCards: [],
			isConnected: true,
			connectedPlayers: mockPlayers,
		});

		mockUseRoundOrchestrator.mockReturnValue({
			isRoundInProgress: false,
			roundPhase: null,
			canStartNewRound: true,
			startNewRound: jest.fn(),
			handlePhaseTransition: jest.fn(),
		});

		// Mock Supabase responses
		mockSupabase.from = jest.fn().mockReturnValue({
			insert: jest.fn().mockResolvedValue({ error: null }),
			update: jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			}),
			delete: jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			}),
			select: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					single: jest.fn().mockResolvedValue({
						data: null,
						error: { code: "PGRST116" }, // No rows returned
					}),
				}),
				in: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						data: [],
						error: null,
					}),
				}),
			}),
		});

		mockSupabase.rpc = jest.fn().mockResolvedValue({ error: null });
	});

	describe("startGame", () => {
		it("should start game successfully", async () => {
			const mockUpdateGamePhase = jest.fn();
			const mockBroadcastEvent = jest.fn();

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				updateGamePhase: mockUpdateGamePhase,
				broadcastEvent: mockBroadcastEvent,
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.startGame();
			});

			expect(mockUpdateGamePhase).toHaveBeenCalledWith("distribution");
			expect(mockBroadcastEvent).toHaveBeenCalledWith({
				type: "phase_change",
				data: { phase: "distribution", round: 1 },
			});
		});

		it("should throw error when not host", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isHost: false,
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(result.current.startGame()).rejects.toThrow(
					"Only host can start game"
				);
			});
		});

		it("should throw error when game already started", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(result.current.startGame()).rejects.toThrow(
					"Game already started"
				);
			});
		});
	});

	describe("submitCards", () => {
		it("should submit cards successfully", async () => {
			const mockBroadcastEvent = jest.fn();
			const submissionGameState = {
				...mockGameState,
				phase: GAME_PHASES.SUBMISSION,
			};

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: submissionGameState,
				broadcastEvent: mockBroadcastEvent,
			});

			// Mock card fetch
			mockSupabase.from.mockReturnValueOnce({
				select: jest.fn().mockReturnValue({
					in: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({
							data: [
								{
									id: "response-1",
									text: "Response card",
									type: "response",
								},
							],
							error: null,
						}),
					}),
				}),
			});

			// Mock submission insert
			mockSupabase.from.mockReturnValueOnce({
				insert: jest.fn().mockResolvedValue({ error: null }),
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.submitCards("prompt-1", ["response-1"]);
			});

			expect(mockBroadcastEvent).toHaveBeenCalledWith({
				type: "submission_received",
				data: {
					playerId: "player-1",
					playerName: "Host Player",
					round: 1,
				},
			});
		});

		it("should throw error when not in submission phase", async () => {
			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(
					result.current.submitCards("prompt-1", ["response-1"])
				).rejects.toThrow("Not in submission phase");
			});
		});

		it("should throw error when no response cards selected", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(
					result.current.submitCards("prompt-1", [])
				).rejects.toThrow("Must select at least one response card");
			});
		});
	});

	describe("submitVote", () => {
		it("should submit vote via API successfully", async () => {
			const mockBroadcastEvent = jest.fn();
			const votingGameState = { ...mockGameState, phase: GAME_PHASES.VOTING };

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: votingGameState,
				broadcastEvent: mockBroadcastEvent,
			});

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: jest.fn().mockResolvedValue({ success: true }),
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.submitVote("submission-1");
			});

			expect(global.fetch).toHaveBeenCalledWith("/api/votes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					submissionId: "submission-1",
					playerId: "player-1",
					gameId: "game-1",
				}),
			});

			expect(mockBroadcastEvent).toHaveBeenCalled();
		});

		it("should handle API error", async () => {
			const votingGameState = { ...mockGameState, phase: GAME_PHASES.VOTING };

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: votingGameState,
			});

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				json: jest.fn().mockResolvedValue({ error: "Vote failed" }),
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(result.current.submitVote("submission-1")).rejects.toThrow(
					"Vote failed"
				);
			});
		});
	});

	describe("updateGameSettings", () => {
		it("should update settings successfully", async () => {
			const mockBroadcastEvent = jest.fn();

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				broadcastEvent: mockBroadcastEvent,
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.updateGameSettings({ target_score: 10 });
			});

			expect(mockSupabase.from).toHaveBeenCalledWith("games");
			expect(mockBroadcastEvent).toHaveBeenCalled();
		});

		it("should throw error when not host", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isHost: false,
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(
					result.current.updateGameSettings({ target_score: 10 })
				).rejects.toThrow("Only host can change settings");
			});
		});

		it("should throw error when game is not in lobby", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(
					result.current.updateGameSettings({ target_score: 10 })
				).rejects.toThrow("Cannot change settings during game");
			});
		});
	});

	describe("kickPlayer", () => {
		it("should kick player successfully", async () => {
			const mockBroadcastEvent = jest.fn();

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				broadcastEvent: mockBroadcastEvent,
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.kickPlayer("player-2");
			});

			expect(mockSupabase.from).toHaveBeenCalledWith("players");
			expect(mockBroadcastEvent).toHaveBeenCalledWith({
				type: "player_left",
				data: {
					playerId: "player-2",
					kicked: true,
					kickedBy: "player-1",
				},
			});
		});

		it("should throw error when not host", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isHost: false,
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(result.current.kickPlayer("player-2")).rejects.toThrow(
					"Insufficient permissions"
				);
			});
		});

		it("should throw error when trying to kick self", async () => {
			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(result.current.kickPlayer("player-1")).rejects.toThrow(
					"Cannot kick yourself"
				);
			});
		});
	});

	describe("leaveGame", () => {
		it("should leave game and transfer host", async () => {
			const mockBroadcastEvent = jest.fn();

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				broadcastEvent: mockBroadcastEvent,
			});

			// Mock host transfer
			mockSupabase.from.mockReturnValueOnce({
				update: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			});

			// Mock player deletion
			mockSupabase.from.mockReturnValueOnce({
				delete: jest.fn().mockReturnValue({
					eq: jest.fn().mockReturnValue({
						eq: jest.fn().mockResolvedValue({ error: null }),
					}),
				}),
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.leaveGame();
			});

			expect(mockBroadcastEvent).toHaveBeenCalledWith({
				type: "player_left",
				data: {
					playerId: "player-1",
					playerName: "Host Player",
				},
			});
		});
	});

	describe("error handling", () => {
		it("should call onError callback when provided", async () => {
			const mockOnError = jest.fn();
			const mockUpdateGamePhase = jest
				.fn()
				.mockRejectedValue(new Error("Update failed"));

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				updateGamePhase: mockUpdateGamePhase,
			});

			const { result } = renderHook(() =>
				useGameActions({ onError: mockOnError })
			);

			await act(async () => {
				await expect(result.current.startGame()).rejects.toThrow();
			});

			expect(mockOnError).toHaveBeenCalled();
		});
	});

	describe("round orchestrator integration", () => {
		it("should use round orchestrator for new round", async () => {
			const mockStartRound = jest.fn();

			mockUseRoundOrchestrator.mockReturnValue({
				isRoundInProgress: false,
				roundPhase: null,
				canStartNewRound: true,
				startNewRound: mockStartRound,
				handlePhaseTransition: jest.fn(),
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await result.current.startNewRound();
			});

			expect(mockStartRound).toHaveBeenCalled();
		});

		it("should throw error when cannot start new round", async () => {
			mockUseRoundOrchestrator.mockReturnValue({
				isRoundInProgress: true,
				roundPhase: "initializing",
				canStartNewRound: false,
				startNewRound: jest.fn(),
				handlePhaseTransition: jest.fn(),
			});

			const { result } = renderHook(() => useGameActions());

			await act(async () => {
				await expect(result.current.startNewRound()).rejects.toThrow(
					"Cannot start new round"
				);
			});
		});
	});
});
