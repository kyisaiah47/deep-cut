import { ERROR_TYPES } from "./constants";

export class GameError extends Error {
	public readonly type: string;
	public readonly retryable: boolean;

	constructor(
		message: string,
		type: string = ERROR_TYPES.UNKNOWN,
		retryable: boolean = false
	) {
		super(message);
		this.name = "GameError";
		this.type = type;
		this.retryable = retryable;
	}
}

export class ConnectionError extends GameError {
	constructor(message: string = "Connection failed") {
		super(message, ERROR_TYPES.CONNECTION, true);
		this.name = "ConnectionError";
	}
}

export class GameStateError extends GameError {
	constructor(message: string = "Game state error") {
		super(message, ERROR_TYPES.GAME_STATE, false);
		this.name = "GameStateError";
	}
}

export class AIGenerationError extends GameError {
	constructor(message: string = "AI generation failed") {
		super(message, ERROR_TYPES.AI_GENERATION, true);
		this.name = "AIGenerationError";
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
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			if (attempt === maxRetries) {
				break;
			}

			// Exponential backoff: baseDelay * 2^attempt
			const delay = baseDelay * Math.pow(2, attempt);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}
