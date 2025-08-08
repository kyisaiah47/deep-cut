import { useCallback, useState } from "react";
import { GameSettings } from "@/types/game";
import { GameError, GameStateError } from "@/lib/error-handling";

interface UseHostControlsOptions {
	gameId: string;
	playerId: string;
	isHost: boolean;
	onError?: (error: GameError) => void;
	onSettingsUpdate?: (settings: Partial<GameSettings>) => void;
	onHostTransfer?: (newHostId: string) => void;
	onGameControl?: (action: string) => void;
}

interface HostControlsHook {
	updateGameSettings: (settings: Partial<GameSettings>) => Promise<void>;
	transferHost: (newHostId: string) => Promise<void>;
	startGame: () => Promise<void>;
	pauseGame: () => Promise<void>;
	resetGame: () => Promise<void>;
	isUpdatingSettings: boolean;
	isTransferringHost: boolean;
	isControllingGame: boolean;
}

export function useHostControls({
	gameId,
	playerId,
	isHost,
	onError,
	onSettingsUpdate,
	onHostTransfer,
	onGameControl,
}: UseHostControlsOptions): HostControlsHook {
	const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
	const [isTransferringHost, setIsTransferringHost] = useState(false);
	const [isControllingGame, setIsControllingGame] = useState(false);

	// Update game settings
	const updateGameSettings = useCallback(
		async (settings: Partial<GameSettings>) => {
			if (!isHost) {
				const error = new GameStateError("Only host can update settings");
				onError?.(error);
				throw error;
			}

			setIsUpdatingSettings(true);
			try {
				const response = await fetch("/api/games/settings", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						gameId,
						playerId,
						settings,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new GameStateError(data.error || "Failed to update settings");
				}

				onSettingsUpdate?.(settings);
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to update game settings");
				onError?.(gameError);
				throw gameError;
			} finally {
				setIsUpdatingSettings(false);
			}
		},
		[gameId, playerId, isHost, onError, onSettingsUpdate]
	);

	// Transfer host privileges
	const transferHost = useCallback(
		async (newHostId: string) => {
			if (!isHost) {
				const error = new GameStateError("Only host can transfer privileges");
				onError?.(error);
				throw error;
			}

			if (newHostId === playerId) {
				const error = new GameStateError("Cannot transfer host to yourself");
				onError?.(error);
				throw error;
			}

			setIsTransferringHost(true);
			try {
				const response = await fetch("/api/games/transfer-host", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						gameId,
						currentHostId: playerId,
						newHostId,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new GameStateError(data.error || "Failed to transfer host");
				}

				onHostTransfer?.(newHostId);
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to transfer host privileges");
				onError?.(gameError);
				throw gameError;
			} finally {
				setIsTransferringHost(false);
			}
		},
		[gameId, playerId, isHost, onError, onHostTransfer]
	);

	// Game control actions
	const performGameControl = useCallback(
		async (action: "start" | "pause" | "reset") => {
			if (!isHost) {
				const error = new GameStateError("Only host can control the game");
				onError?.(error);
				throw error;
			}

			setIsControllingGame(true);
			try {
				const response = await fetch("/api/games/control", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						gameId,
						playerId,
						action,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new GameStateError(data.error || `Failed to ${action} game`);
				}

				onGameControl?.(action);
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError(`Failed to ${action} game`);
				onError?.(gameError);
				throw gameError;
			} finally {
				setIsControllingGame(false);
			}
		},
		[gameId, playerId, isHost, onError, onGameControl]
	);

	// Specific game control methods
	const startGame = useCallback(
		() => performGameControl("start"),
		[performGameControl]
	);
	const pauseGame = useCallback(
		() => performGameControl("pause"),
		[performGameControl]
	);
	const resetGame = useCallback(
		() => performGameControl("reset"),
		[performGameControl]
	);

	return {
		updateGameSettings,
		transferHost,
		startGame,
		pauseGame,
		resetGame,
		isUpdatingSettings,
		isTransferringHost,
		isControllingGame,
	};
}
