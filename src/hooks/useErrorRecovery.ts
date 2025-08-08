import { useState, useCallback, useEffect } from "react";
import {
	GameError,
	ConnectionError,
	GameStateError,
	SynchronizationError,
	ConnectionRecovery,
	recoverGameState,
	errorLogger,
} from "@/lib/error-handling";

interface UseErrorRecoveryOptions {
	gameId?: string;
	playerId?: string;
	onError?: (error: GameError) => void;
	onRecoverySuccess?: () => void;
	onRecoveryFailure?: (error: GameError) => void;
}

interface ErrorRecoveryHook {
	error: GameError | null;
	isRecovering: boolean;
	recoveryAttempts: number;
	setError: (error: GameError | null) => void;
	recoverFromError: () => Promise<void>;
	clearError: () => void;
	reportError: (error: GameError) => void;
}

export function useErrorRecovery({
	gameId,
	playerId,
	onError,
	onRecoverySuccess,
	onRecoveryFailure,
}: UseErrorRecoveryOptions = {}): ErrorRecoveryHook {
	const [error, setError] = useState<GameError | null>(null);
	const [isRecovering, setIsRecovering] = useState(false);
	const [recoveryAttempts, setRecoveryAttempts] = useState(0);
	const [connectionRecovery] = useState(() => new ConnectionRecovery());

	// Clear error when gameId or playerId changes
	useEffect(() => {
		setError(null);
		setRecoveryAttempts(0);
		connectionRecovery.reset();
	}, [gameId, playerId, connectionRecovery]);

	const clearError = useCallback(() => {
		setError(null);
		setRecoveryAttempts(0);
		connectionRecovery.reset();
	}, [connectionRecovery]);

	const reportError = useCallback(
		(gameError: GameError | null) => {
			if (gameError) {
				setError(gameError);
				errorLogger.log(gameError, gameId, playerId);
				onError?.(gameError);
			} else {
				setError(null);
			}
		},
		[gameId, playerId, onError]
	);

	const recoverFromError = useCallback(async () => {
		if (!error || isRecovering) return;

		setIsRecovering(true);
		setRecoveryAttempts((prev) => prev + 1);

		try {
			switch (error.type) {
				case "connection": {
					// For connection errors, attempt to reconnect
					await connectionRecovery.attemptReconnection(
						async () => {
							// Test connection by making a simple request
							if (gameId && playerId) {
								const recovery = await recoverGameState(gameId, playerId);
								if (!recovery.success) {
									throw (
										recovery.error ||
										new ConnectionError("Connection test failed")
									);
								}
							}
						},
						() => {
							clearError();
							onRecoverySuccess?.();
						},
						(recoveryError) => {
							setError(recoveryError);
							onRecoveryFailure?.(recoveryError);
						},
						{ gameId, playerId }
					);
					break;
				}

				case "game_state": {
					// For game state errors, attempt to resynchronize
					if (gameId && playerId) {
						const recovery = await recoverGameState(gameId, playerId);

						if (recovery.success) {
							if (recovery.synchronized) {
								clearError();
								onRecoverySuccess?.();
							} else {
								// Game state has changed, but we're now synchronized
								const syncError = new SynchronizationError(
									"Game state has changed while you were disconnected. You've been synchronized with the current state.",
									{ gameId, playerId, synchronized: true }
								);
								setError(syncError);
								onRecoverySuccess?.(); // Still consider this a success
							}
						} else {
							const recoveryError =
								recovery.error ||
								new GameStateError("Failed to recover game state");
							setError(recoveryError);
							onRecoveryFailure?.(recoveryError);
						}
					} else {
						throw new GameStateError("Missing game or player ID for recovery");
					}
					break;
				}

				case "ai_generation": {
					// For AI generation errors, just clear the error as the system should have fallbacks
					clearError();
					onRecoverySuccess?.();
					break;
				}

				default: {
					// For unknown errors, try a general recovery
					if (gameId && playerId) {
						const recovery = await recoverGameState(gameId, playerId);
						if (recovery.success) {
							clearError();
							onRecoverySuccess?.();
						} else {
							const recoveryError =
								recovery.error || new GameError("Recovery failed");
							setError(recoveryError);
							onRecoveryFailure?.(recoveryError);
						}
					} else {
						// Can't recover without game context, just clear the error
						clearError();
						onRecoverySuccess?.();
					}
					break;
				}
			}
		} catch (err) {
			const recoveryError =
				err instanceof GameError
					? err
					: new GameError("Recovery attempt failed", "unknown", true, {
							originalError: error.message,
							attempt: recoveryAttempts + 1,
					  });

			setError(recoveryError);
			errorLogger.log(recoveryError, gameId, playerId);
			onRecoveryFailure?.(recoveryError);
		} finally {
			setIsRecovering(false);
		}
	}, [
		error,
		isRecovering,
		recoveryAttempts,
		gameId,
		playerId,
		connectionRecovery,
		clearError,
		onRecoverySuccess,
		onRecoveryFailure,
	]);

	return {
		error,
		isRecovering,
		recoveryAttempts,
		setError: reportError,
		recoverFromError,
		clearError,
		reportError,
	};
}

// Hook for automatic error recovery
export function useAutoErrorRecovery(options: UseErrorRecoveryOptions = {}) {
	const errorRecovery = useErrorRecovery(options);
	const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);

	// Automatically attempt recovery for retryable errors
	useEffect(() => {
		if (
			autoRecoveryEnabled &&
			errorRecovery.error?.retryable &&
			!errorRecovery.isRecovering &&
			errorRecovery.recoveryAttempts < 3
		) {
			// Delay automatic recovery to avoid rapid retries
			const timeout = setTimeout(() => {
				errorRecovery.recoverFromError();
			}, 2000 * Math.pow(2, errorRecovery.recoveryAttempts)); // Exponential backoff

			return () => clearTimeout(timeout);
		}
	}, [
		autoRecoveryEnabled,
		errorRecovery.error,
		errorRecovery.isRecovering,
		errorRecovery.recoveryAttempts,
		errorRecovery.recoverFromError,
	]);

	return {
		...errorRecovery,
		autoRecoveryEnabled,
		setAutoRecoveryEnabled,
	};
}
