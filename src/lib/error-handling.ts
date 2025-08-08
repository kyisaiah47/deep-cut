import { ERROR_TYPES } from "./constants";

export class GameError extends Error {
	public readonly type: string;
	public readonly retryable: boolean;
	public readonly timestamp: string;
	public readonly context?: Record<string, unknown>;

	constructor(
		message: string,
		type: string = ERROR_TYPES.UNKNOWN,
		retryable: boolean = false,
		context?: Record<string, unknown>
	) {
		super(message);
		this.name = "GameError";
		this.type = type;
		this.retryable = retryable;
		this.timestamp = new Date().toISOString();
		this.context = context;
	}
}

export class ConnectionError extends GameError {
	constructor(
		message: string = "Connection failed",
		context?: Record<string, unknown>
	) {
		super(message, ERROR_TYPES.CONNECTION, true, context);
		this.name = "ConnectionError";
	}
}

export class GameStateError extends GameError {
	constructor(
		message: string = "Game state error",
		context?: Record<string, unknown>
	) {
		super(message, ERROR_TYPES.GAME_STATE, false, context);
		this.name = "GameStateError";
	}
}

export class AIGenerationError extends GameError {
	constructor(
		message: string = "AI generation failed",
		context?: Record<string, unknown>
	) {
		super(message, ERROR_TYPES.AI_GENERATION, true, context);
		this.name = "AIGenerationError";
	}
}

export class SynchronizationError extends GameError {
	constructor(
		message: string = "Game synchronization failed",
		context?: Record<string, unknown>
	) {
		super(message, ERROR_TYPES.GAME_STATE, true, context);
		this.name = "SynchronizationError";
	}
}

/**
 * Handle errors with appropriate user messaging
 */
export function handleGameError(error: unknown): {
	message: string;
	retryable: boolean;
} {
	if (error instanceof GameError) {
		return {
			message: error.message,
			retryable: error.retryable,
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			retryable: false,
		};
	}

	return {
		message: "An unexpected error occurred",
		retryable: false,
	};
}

/**
 * Error logging and monitoring
 */
interface ErrorLogEntry {
	error: GameError;
	gameId?: string;
	playerId?: string;
	userAgent: string;
	url: string;
	timestamp: string;
	sessionId?: string;
}

class ErrorLogger {
	private logs: ErrorLogEntry[] = [];
	private maxLogs = 100;
	private sessionId = crypto.randomUUID();

	log(error: GameError, gameId?: string, playerId?: string) {
		const entry: ErrorLogEntry = {
			error,
			gameId,
			playerId,
			userAgent: navigator.userAgent,
			url: window.location.href,
			timestamp: new Date().toISOString(),
			sessionId: this.sessionId,
		};

		this.logs.push(entry);

		// Keep only the most recent logs
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Log to console for debugging
		console.error("Game Error:", {
			message: error.message,
			type: error.type,
			retryable: error.retryable,
			context: error.context,
			gameId,
			playerId,
			timestamp: error.timestamp,
		});

		// In production, you might want to send this to an external service
		if (process.env.NODE_ENV === "production") {
			this.sendToMonitoring(entry);
		}
	}

	private async sendToMonitoring(entry: ErrorLogEntry) {
		try {
			// Send to our error logging API
			await fetch("/api/errors", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(entry),
			});
		} catch (err) {
			console.warn("Failed to send error to monitoring service:", err);
		}
	}

	getLogs(): ErrorLogEntry[] {
		return [...this.logs];
	}

	getRecentErrors(minutes: number = 5): ErrorLogEntry[] {
		const cutoff = new Date(Date.now() - minutes * 60 * 1000);
		return this.logs.filter((log) => new Date(log.timestamp) > cutoff);
	}

	clearLogs() {
		this.logs = [];
	}
}

export const errorLogger = new ErrorLogger();

/**
 * Enhanced error handling with logging
 */
export function logAndHandleError(
	error: unknown,
	gameId?: string,
	playerId?: string
): { message: string; retryable: boolean } {
	const gameError =
		error instanceof GameError
			? error
			: new GameError(
					error instanceof Error ? error.message : "Unknown error occurred"
			  );

	errorLogger.log(gameError, gameId, playerId);
	return handleGameError(gameError);
}

/**
 * Retry function with exponential backoff and enhanced logging
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000,
	context?: { gameId?: string; playerId?: string; operation?: string }
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Log the retry attempt
			const gameError =
				error instanceof GameError
					? error
					: new GameError(
							error instanceof Error ? error.message : "Retry attempt failed",
							ERROR_TYPES.UNKNOWN,
							true,
							{ ...context, attempt, maxRetries }
					  );

			errorLogger.log(gameError, context?.gameId, context?.playerId);

			if (attempt === maxRetries) {
				break;
			}

			// Exponential backoff: baseDelay * 2^attempt with jitter
			const jitter = Math.random() * 0.1 * baseDelay;
			const delay = baseDelay * Math.pow(2, attempt) + jitter;
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Connection recovery with progressive backoff
 */
export class ConnectionRecovery {
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private baseDelay = 1000;
	private maxDelay = 30000;
	private reconnectTimeout: NodeJS.Timeout | null = null;

	async attemptReconnection(
		reconnectFn: () => Promise<void>,
		onSuccess?: () => void,
		onFailure?: (error: GameError) => void,
		context?: { gameId?: string; playerId?: string }
	): Promise<void> {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		try {
			await reconnectFn();
			this.reconnectAttempts = 0;
			onSuccess?.();
		} catch (error) {
			this.reconnectAttempts++;

			const connectionError = new ConnectionError(
				`Reconnection attempt ${this.reconnectAttempts} failed`,
				{ ...context, attempt: this.reconnectAttempts }
			);

			errorLogger.log(connectionError, context?.gameId, context?.playerId);

			if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				const finalError = new ConnectionError(
					"Maximum reconnection attempts exceeded",
					{ ...context, totalAttempts: this.reconnectAttempts }
				);
				onFailure?.(finalError);
				return;
			}

			// Progressive backoff with jitter
			const delay = Math.min(
				this.baseDelay * Math.pow(1.5, this.reconnectAttempts - 1),
				this.maxDelay
			);
			const jitter = Math.random() * 0.2 * delay;

			this.reconnectTimeout = setTimeout(() => {
				this.attemptReconnection(reconnectFn, onSuccess, onFailure, context);
			}, delay + jitter);
		}
	}

	reset() {
		this.reconnectAttempts = 0;
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	getAttempts(): number {
		return this.reconnectAttempts;
	}
}

/**
 * Game state synchronization recovery
 */
export async function recoverGameState(
	gameId: string,
	playerId: string,
	expectedPhase?: string
): Promise<{
	success: boolean;
	synchronized: boolean;
	error?: GameError;
}> {
	try {
		// Import supabase here to avoid circular dependencies
		const { supabase } = await import("@/lib/supabase");

		// Fetch current game state
		const { data: gameState, error: gameError } = await supabase
			.from("games")
			.select("*")
			.eq("id", gameId)
			.single();

		if (gameError) {
			throw new SynchronizationError(
				`Failed to fetch game state: ${gameError.message}`,
				{ gameId, playerId }
			);
		}

		// Check if player is still in the game
		const { data: player, error: playerError } = await supabase
			.from("players")
			.select("*")
			.eq("id", playerId)
			.eq("game_id", gameId)
			.single();

		if (playerError) {
			throw new SynchronizationError(
				`Player not found in game: ${playerError.message}`,
				{ gameId, playerId }
			);
		}

		// Update player connection status
		await supabase
			.from("players")
			.update({ is_connected: true })
			.eq("id", playerId);

		// Check if we're synchronized with expected phase
		const synchronized = !expectedPhase || gameState.phase === expectedPhase;

		return {
			success: true,
			synchronized,
		};
	} catch (error) {
		const syncError =
			error instanceof GameError
				? error
				: new SynchronizationError("Failed to recover game state", {
						gameId,
						playerId,
				  });

		errorLogger.log(syncError, gameId, playerId);

		return {
			success: false,
			synchronized: false,
			error: syncError,
		};
	}
}
