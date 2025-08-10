import {
	GameError,
	ConnectionError,
	GameStateError,
	AIGenerationError,
	SynchronizationError,
	handleGameError,
	logAndHandleError,
	retryWithBackoff,
	ConnectionRecovery,
	recoverGameState,
	errorLogger,
} from "../error-handling";
import { ERROR_TYPES } from "../constants";

// Mock fetch for error logging
global.fetch = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
	value: {
		randomUUID: jest.fn(() => "mock-uuid"),
	},
});

// Mock navigator
Object.defineProperty(global, "navigator", {
	value: {
		userAgent: "test-user-agent",
	},
});

// Mock window
Object.defineProperty(global, "window", {
	value: {
		location: {
			href: "http://localhost:3000/test",
		},
	},
});

describe("error-handling", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		errorLogger.clearLogs();
	});

	describe("GameError", () => {
		it("should create error with correct properties", () => {
			const error = new GameError("Test error", ERROR_TYPES.CONNECTION, true, {
				gameId: "game-1",
			});

			expect(error.message).toBe("Test error");
			expect(error.type).toBe(ERROR_TYPES.CONNECTION);
			expect(error.retryable).toBe(true);
			expect(error.context).toEqual({ gameId: "game-1" });
			expect(error.timestamp).toBeDefined();
			expect(error.name).toBe("GameError");
		});

		it("should use default values", () => {
			const error = new GameError("Test error");

			expect(error.type).toBe(ERROR_TYPES.UNKNOWN);
			expect(error.retryable).toBe(false);
			expect(error.context).toBeUndefined();
		});
	});

	describe("Specific Error Classes", () => {
		it("should create ConnectionError correctly", () => {
			const error = new ConnectionError("Connection failed", {
				gameId: "game-1",
			});

			expect(error.name).toBe("ConnectionError");
			expect(error.type).toBe(ERROR_TYPES.CONNECTION);
			expect(error.retryable).toBe(true);
			expect(error.message).toBe("Connection failed");
		});

		it("should create GameStateError correctly", () => {
			const error = new GameStateError("Invalid state");

			expect(error.name).toBe("GameStateError");
			expect(error.type).toBe(ERROR_TYPES.GAME_STATE);
			expect(error.retryable).toBe(false);
		});

		it("should create AIGenerationError correctly", () => {
			const error = new AIGenerationError("AI failed");

			expect(error.name).toBe("AIGenerationError");
			expect(error.type).toBe(ERROR_TYPES.AI_GENERATION);
			expect(error.retryable).toBe(true);
		});

		it("should create SynchronizationError correctly", () => {
			const error = new SynchronizationError("Sync failed");

			expect(error.name).toBe("SynchronizationError");
			expect(error.type).toBe(ERROR_TYPES.GAME_STATE);
			expect(error.retryable).toBe(true);
		});
	});

	describe("handleGameError", () => {
		it("should handle GameError correctly", () => {
			const error = new GameError("Test error", ERROR_TYPES.CONNECTION, true);
			const result = handleGameError(error);

			expect(result.message).toBe("Test error");
			expect(result.retryable).toBe(true);
		});

		it("should handle regular Error", () => {
			const error = new Error("Regular error");
			const result = handleGameError(error);

			expect(result.message).toBe("Regular error");
			expect(result.retryable).toBe(false);
		});

		it("should handle unknown error", () => {
			const result = handleGameError("string error");

			expect(result.message).toBe("An unexpected error occurred");
			expect(result.retryable).toBe(false);
		});
	});

	describe("ErrorLogger", () => {
		it("should log errors correctly", () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const error = new GameError("Test error");

			errorLogger.log(error, "game-1", "player-1");

			const logs = errorLogger.getLogs();
			expect(logs).toHaveLength(1);
			expect(logs[0].error).toBe(error);
			expect(logs[0].gameId).toBe("game-1");
			expect(logs[0].playerId).toBe("player-1");
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should limit log entries", () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();

			// Add more than maxLogs entries
			for (let i = 0; i < 150; i++) {
				errorLogger.log(new GameError(`Error ${i}`));
			}

			const logs = errorLogger.getLogs();
			expect(logs.length).toBeLessThanOrEqual(100);

			consoleSpy.mockRestore();
		});

		it("should get recent errors", () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();

			errorLogger.log(new GameError("Recent error"));

			const recentErrors = errorLogger.getRecentErrors(5);
			expect(recentErrors).toHaveLength(1);

			consoleSpy.mockRestore();
		});

		it("should clear logs", () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();

			errorLogger.log(new GameError("Test error"));
			expect(errorLogger.getLogs()).toHaveLength(1);

			errorLogger.clearLogs();
			expect(errorLogger.getLogs()).toHaveLength(0);

			consoleSpy.mockRestore();
		});
	});

	describe("logAndHandleError", () => {
		it("should log and handle GameError", () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const error = new GameError("Test error", ERROR_TYPES.CONNECTION, true);

			const result = logAndHandleError(error, "game-1", "player-1");

			expect(result.message).toBe("Test error");
			expect(result.retryable).toBe(true);
			expect(errorLogger.getLogs()).toHaveLength(1);

			consoleSpy.mockRestore();
		});

		it("should convert regular errors to GameError", () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const error = new Error("Regular error");

			const result = logAndHandleError(error);

			expect(result.message).toBe("Regular error");
			expect(errorLogger.getLogs()).toHaveLength(1);
			expect(errorLogger.getLogs()[0].error).toBeInstanceOf(GameError);

			consoleSpy.mockRestore();
		});
	});

	describe("retryWithBackoff", () => {
		it("should succeed on first attempt", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const mockFn = jest.fn().mockResolvedValue("success");

			const result = await retryWithBackoff(mockFn);

			expect(result).toBe("success");
			expect(mockFn).toHaveBeenCalledTimes(1);

			consoleSpy.mockRestore();
		});

		it("should retry on failure and eventually succeed", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const mockFn = jest
				.fn()
				.mockRejectedValueOnce(new Error("Attempt 1 failed"))
				.mockRejectedValueOnce(new Error("Attempt 2 failed"))
				.mockResolvedValue("success");

			const result = await retryWithBackoff(mockFn, 3, 10);

			expect(result).toBe("success");
			expect(mockFn).toHaveBeenCalledTimes(3);

			consoleSpy.mockRestore();
		});

		it("should throw after max retries", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const mockFn = jest.fn().mockRejectedValue(new Error("Always fails"));

			await expect(retryWithBackoff(mockFn, 2, 10)).rejects.toThrow(
				"Always fails"
			);
			expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries

			consoleSpy.mockRestore();
		});

		it("should log retry attempts", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const mockFn = jest
				.fn()
				.mockRejectedValueOnce(new Error("Retry test"))
				.mockResolvedValue("success");

			await retryWithBackoff(mockFn, 2, 10, {
				gameId: "game-1",
				operation: "test",
			});

			expect(errorLogger.getLogs()).toHaveLength(1);
			expect(errorLogger.getLogs()[0].error.context).toMatchObject({
				gameId: "game-1",
				operation: "test",
				attempt: 0,
				maxRetries: 2,
			});

			consoleSpy.mockRestore();
		});
	});

	describe("ConnectionRecovery", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it("should succeed on first reconnection attempt", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const recovery = new ConnectionRecovery();
			const mockReconnect = jest.fn().mockResolvedValue(undefined);
			const mockOnSuccess = jest.fn();

			await recovery.attemptReconnection(mockReconnect, mockOnSuccess);

			expect(mockReconnect).toHaveBeenCalledTimes(1);
			expect(mockOnSuccess).toHaveBeenCalled();
			expect(recovery.getAttempts()).toBe(0);

			consoleSpy.mockRestore();
		});

		it("should retry on failure", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const recovery = new ConnectionRecovery();
			const mockReconnect = jest
				.fn()
				.mockRejectedValueOnce(new Error("Connection failed"))
				.mockResolvedValue(undefined);
			const mockOnSuccess = jest.fn();

			const reconnectionPromise = recovery.attemptReconnection(
				mockReconnect,
				mockOnSuccess
			);

			// Fast-forward time to trigger retry
			jest.advanceTimersByTime(2000);

			await reconnectionPromise;

			expect(mockReconnect).toHaveBeenCalledTimes(2);
			expect(mockOnSuccess).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should call onFailure after max attempts", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();
			const recovery = new ConnectionRecovery();
			const mockReconnect = jest
				.fn()
				.mockRejectedValue(new Error("Always fails"));
			const mockOnFailure = jest.fn();

			// Simulate multiple failed attempts
			for (let i = 0; i < 10; i++) {
				try {
					await recovery.attemptReconnection(
						mockReconnect,
						undefined,
						mockOnFailure
					);
				} catch (error) {
					// Expected to fail
				}
			}

			expect(mockOnFailure).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should reset attempts", () => {
			const recovery = new ConnectionRecovery();
			// Simulate some failed attempts by accessing private property
			(recovery as any).reconnectAttempts = 5;

			recovery.reset();

			expect(recovery.getAttempts()).toBe(0);
		});
	});

	describe("recoverGameState", () => {
		it("should recover game state successfully", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();

			// Mock supabase import
			jest.doMock("@/lib/supabase", () => ({
				supabase: {
					from: jest.fn().mockReturnValue({
						select: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: { id: "game-1", phase: "voting" },
									error: null,
								}),
							}),
						}),
						update: jest.fn().mockReturnValue({
							eq: jest.fn().mockResolvedValue({ error: null }),
						}),
					}),
				},
			}));

			const result = await recoverGameState("game-1", "player-1", "voting");

			expect(result.success).toBe(true);
			expect(result.synchronized).toBe(true);

			consoleSpy.mockRestore();
		});

		it("should handle game state fetch error", async () => {
			const consoleSpy = jest.spyOn(console, "error").mockImplementation();

			// Mock supabase import with error
			jest.doMock("@/lib/supabase", () => ({
				supabase: {
					from: jest.fn().mockReturnValue({
						select: jest.fn().mockReturnValue({
							eq: jest.fn().mockReturnValue({
								single: jest.fn().mockResolvedValue({
									data: null,
									error: { message: "Game not found" },
								}),
							}),
						}),
					}),
				},
			}));

			const result = await recoverGameState("game-1", "player-1");

			expect(result.success).toBe(false);
			expect(result.error).toBeInstanceOf(SynchronizationError);

			consoleSpy.mockRestore();
		});
	});
});
