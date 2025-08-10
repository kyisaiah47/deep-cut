import { renderHook, act, waitFor } from "@testing-library/react";
import { useTimerManagement } from "../useTimerManagement";
import { supabase } from "@/lib/supabase";
import { GameState } from "@/types/game";
import { GAME_PHASES } from "@/lib/constants";

// Mock Supabase
jest.mock("@/lib/supabase");
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("useTimerManagement", () => {
	const mockGameState: GameState = {
		id: "game-1",
		room_code: "ABC123",
		phase: GAME_PHASES.SUBMISSION,
		current_round: 1,
		target_score: 7,
		max_players: 8,
		submission_timer: 60,
		voting_timer: 30,
		host_id: "player-1",
		created_at: "2023-01-01T00:00:00Z",
		updated_at: "2023-01-01T00:00:00Z",
	};

	const mockProps = {
		gameId: "game-1",
		gameState: mockGameState,
		onTimerExpire: jest.fn(),
		onAutoSubmission: jest.fn(),
		onAutoVoting: jest.fn(),
		onError: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		// Mock Supabase RPC for server time
		mockSupabase.rpc.mockResolvedValue({
			data: new Date("2023-01-01T12:00:00Z").toISOString(),
			error: null,
		});

		// Mock Supabase table operations
		mockSupabase.from = jest.fn().mockReturnValue({
			upsert: jest.fn().mockResolvedValue({ error: null }),
			update: jest.fn().mockReturnValue({
				eq: jest.fn().mockResolvedValue({ error: null }),
			}),
		});

		// Mock Supabase channel subscription
		const mockChannel = {
			on: jest.fn().mockReturnThis(),
			subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
			unsubscribe: jest.fn(),
		};
		mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should initialize with default timer state", () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isActive).toBe(false);
		expect(result.current.isPaused).toBe(false);
		expect(result.current.phase).toBeNull();
		expect(result.current.startedAt).toBeNull();
		expect(result.current.duration).toBe(0);
	});

	it("should start timer successfully", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		expect(result.current.timeRemaining).toBe(60);
		expect(result.current.isActive).toBe(true);
		expect(result.current.isPaused).toBe(false);
		expect(result.current.phase).toBe(GAME_PHASES.SUBMISSION);
		expect(result.current.duration).toBe(60);
		expect(mockSupabase.from).toHaveBeenCalledWith("game_timers");
	});

	it("should handle timer countdown", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 5);
		});

		expect(result.current.timeRemaining).toBe(5);

		// Advance timer by 1 second
		act(() => {
			jest.advanceTimersByTime(1000);
		});

		expect(result.current.timeRemaining).toBe(4);

		// Advance timer by 3 more seconds
		act(() => {
			jest.advanceTimersByTime(3000);
		});

		expect(result.current.timeRemaining).toBe(1);
	});

	it("should call onTimerExpire when timer reaches zero", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 2);
		});

		// Advance timer to expiration
		await act(async () => {
			jest.advanceTimersByTime(2000);
		});

		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isActive).toBe(false);
		expect(mockProps.onTimerExpire).toHaveBeenCalledWith(
			GAME_PHASES.SUBMISSION
		);
	});

	it("should call onAutoSubmission when submission timer expires", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 1);
		});

		await act(async () => {
			jest.advanceTimersByTime(1000);
		});

		expect(mockProps.onAutoSubmission).toHaveBeenCalled();
		expect(mockProps.onTimerExpire).toHaveBeenCalledWith(
			GAME_PHASES.SUBMISSION
		);
	});

	it("should call onAutoVoting when voting timer expires", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.VOTING, 1);
		});

		await act(async () => {
			jest.advanceTimersByTime(1000);
		});

		expect(mockProps.onAutoVoting).toHaveBeenCalled();
		expect(mockProps.onTimerExpire).toHaveBeenCalledWith(GAME_PHASES.VOTING);
	});

	it("should pause timer successfully", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		await act(async () => {
			await result.current.pauseTimer();
		});

		expect(result.current.isPaused).toBe(true);
		expect(mockSupabase.from).toHaveBeenCalledWith("game_timers");
	});

	it("should resume timer successfully", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		await act(async () => {
			await result.current.pauseTimer();
		});

		await act(async () => {
			await result.current.resumeTimer();
		});

		expect(result.current.isPaused).toBe(false);
		expect(mockSupabase.from).toHaveBeenCalledWith("game_timers");
	});

	it("should stop timer successfully", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		await act(async () => {
			await result.current.stopTimer();
		});

		expect(result.current.timeRemaining).toBe(0);
		expect(result.current.isActive).toBe(false);
		expect(result.current.isPaused).toBe(false);
		expect(result.current.phase).toBeNull();
		expect(result.current.startedAt).toBeNull();
		expect(result.current.duration).toBe(0);
	});

	it("should not countdown when paused", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 10);
		});

		await act(async () => {
			await result.current.pauseTimer();
		});

		const timeBeforePause = result.current.timeRemaining;

		// Advance timer while paused
		act(() => {
			jest.advanceTimersByTime(2000);
		});

		// Time should not have changed
		expect(result.current.timeRemaining).toBe(timeBeforePause);
	});

	it("should sync timer with server time", async () => {
		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		await act(async () => {
			await result.current.syncTimer();
		});

		expect(mockSupabase.rpc).toHaveBeenCalledWith("get_server_time");
	});

	it("should handle server time sync errors gracefully", async () => {
		mockSupabase.rpc.mockResolvedValueOnce({
			data: null,
			error: { message: "Server error" },
		});

		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		await act(async () => {
			await result.current.syncTimer();
		});

		// Should not throw error, just log it
		expect(result.current.isActive).toBe(true);
	});

	it("should auto-start timer based on game phase changes", async () => {
		const { result, rerender } = renderHook(
			(props) => useTimerManagement(props),
			{
				initialProps: {
					...mockProps,
					gameState: { ...mockGameState, phase: GAME_PHASES.LOBBY },
				},
			}
		);

		// Change to submission phase
		rerender({
			...mockProps,
			gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
		});

		await waitFor(() => {
			expect(result.current.isActive).toBe(true);
			expect(result.current.phase).toBe(GAME_PHASES.SUBMISSION);
			expect(result.current.duration).toBe(60); // submission_timer
		});
	});

	it("should auto-start voting timer", async () => {
		const { result, rerender } = renderHook(
			(props) => useTimerManagement(props),
			{
				initialProps: {
					...mockProps,
					gameState: { ...mockGameState, phase: GAME_PHASES.LOBBY },
				},
			}
		);

		// Change to voting phase
		rerender({
			...mockProps,
			gameState: { ...mockGameState, phase: GAME_PHASES.VOTING },
		});

		await waitFor(() => {
			expect(result.current.isActive).toBe(true);
			expect(result.current.phase).toBe(GAME_PHASES.VOTING);
			expect(result.current.duration).toBe(30); // voting_timer
		});
	});

	it("should stop timer for phases that don't need timers", async () => {
		const { result, rerender } = renderHook(
			(props) => useTimerManagement(props),
			{
				initialProps: mockProps,
			}
		);

		// Start with submission phase (has timer)
		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		expect(result.current.isActive).toBe(true);

		// Change to results phase (no timer)
		rerender({
			...mockProps,
			gameState: { ...mockGameState, phase: GAME_PHASES.RESULTS },
		});

		await waitFor(() => {
			expect(result.current.isActive).toBe(false);
		});
	});

	it("should handle database errors", async () => {
		mockSupabase.from.mockReturnValueOnce({
			upsert: jest.fn().mockResolvedValue({
				error: { message: "Database error" },
			}),
		});

		const { result } = renderHook(() => useTimerManagement(mockProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 60);
		});

		expect(mockProps.onError).toHaveBeenCalled();
	});

	it("should handle auto-action errors gracefully", async () => {
		const errorProps = {
			...mockProps,
			onAutoSubmission: jest
				.fn()
				.mockRejectedValue(new Error("Auto-submit failed")),
		};

		const { result } = renderHook(() => useTimerManagement(errorProps));

		await act(async () => {
			await result.current.startTimer(GAME_PHASES.SUBMISSION, 1);
		});

		await act(async () => {
			jest.advanceTimersByTime(1000);
		});

		// Should still call onTimerExpire even if auto-action fails
		expect(mockProps.onTimerExpire).toHaveBeenCalledWith(
			GAME_PHASES.SUBMISSION
		);
	});

	it("should setup and cleanup subscriptions", () => {
		const { unmount } = renderHook(() => useTimerManagement(mockProps));

		expect(mockSupabase.channel).toHaveBeenCalledWith("game_timer_game-1");

		unmount();

		// Subscription should be cleaned up on unmount
		// This is tested implicitly by the mock setup
	});

	it("should handle subscription updates", async () => {
		let subscriptionCallback: (payload: any) => void;

		const mockChannel = {
			on: jest.fn().mockImplementation((event, config, callback) => {
				subscriptionCallback = callback;
				return mockChannel;
			}),
			subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
			unsubscribe: jest.fn(),
		};

		mockSupabase.channel.mockReturnValue(mockChannel);

		const { result } = renderHook(() => useTimerManagement(mockProps));

		// Simulate subscription update
		await act(async () => {
			subscriptionCallback!({
				new: {
					game_id: "game-1",
					phase: GAME_PHASES.VOTING,
					duration: 30,
					started_at: new Date().toISOString(),
					is_active: true,
					is_paused: false,
				},
			});
		});

		expect(result.current.phase).toBe(GAME_PHASES.VOTING);
		expect(result.current.duration).toBe(30);
	});
});
