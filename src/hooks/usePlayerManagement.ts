import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Player, GameState } from "@/types/game";
import { GameError, GameStateError } from "@/lib/error-handling";

interface UsePlayerManagementOptions {
	gameId: string;
	playerId: string;
	players: Player[];
	gameState: GameState | null;
	onError?: (error: GameError) => void;
	onHostTransfer?: (newHostId: string) => void;
}

interface PlayerManagementHook {
	updateConnectionStatus: (connected: boolean) => Promise<void>;
	transferHost: (newHostId: string) => Promise<void>;
	removeDisconnectedPlayers: () => Promise<void>;
	handlePlayerLeave: (leavingPlayerId: string) => Promise<void>;
}

export function usePlayerManagement({
	gameId,
	playerId,
	players,
	gameState,
	onError,
	onHostTransfer,
}: UsePlayerManagementOptions): PlayerManagementHook {
	const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastHeartbeatRef = useRef<Date>(new Date());

	// Update player connection status
	const updateConnectionStatus = useCallback(
		async (connected: boolean) => {
			try {
				const { error } = await supabase
					.from("players")
					.update({
						is_connected: connected,
					})
					.eq("id", playerId)
					.eq("game_id", gameId);

				if (error) {
					throw new GameStateError(
						`Failed to update connection status: ${error.message}`
					);
				}

				lastHeartbeatRef.current = new Date();
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to update connection status");
				onError?.(gameError);
				throw gameError;
			}
		},
		[gameId, playerId, onError]
	);

	// Transfer host to another player
	const transferHost = useCallback(
		async (newHostId: string) => {
			try {
				// Verify the new host is a valid player in the game
				const newHost = players.find((p) => p.id === newHostId);
				if (!newHost) {
					throw new GameStateError("Invalid player selected for host transfer");
				}

				// Update the game's host_id
				const { error } = await supabase
					.from("games")
					.update({
						host_id: newHostId,
						updated_at: new Date().toISOString(),
					})
					.eq("id", gameId);

				if (error) {
					throw new GameStateError(`Failed to transfer host: ${error.message}`);
				}

				onHostTransfer?.(newHostId);
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to transfer host");
				onError?.(gameError);
				throw gameError;
			}
		},
		[gameId, players, onError, onHostTransfer]
	);

	// Remove players who have been disconnected for too long
	const removeDisconnectedPlayers = useCallback(async () => {
		try {
			const disconnectThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

			// Find players who have been disconnected for too long
			const playersToRemove = players.filter(
				(player) =>
					!player.is_connected &&
					new Date(player.joined_at) < disconnectThreshold
			);

			if (playersToRemove.length === 0) return;

			// Remove disconnected players
			const { error } = await supabase
				.from("players")
				.delete()
				.in(
					"id",
					playersToRemove.map((p) => p.id)
				)
				.eq("game_id", gameId);

			if (error) {
				throw new GameStateError(
					`Failed to remove disconnected players: ${error.message}`
				);
			}

			// If the host was removed, transfer to the next available player
			const removedHostId = playersToRemove.find(
				(p) => p.id === gameState?.host_id
			)?.id;

			if (removedHostId) {
				const remainingPlayers = players.filter(
					(p) => !playersToRemove.some((removed) => removed.id === p.id)
				);

				if (remainingPlayers.length > 0) {
					// Transfer to the first remaining connected player
					const newHost = remainingPlayers.find((p) => p.is_connected);
					if (newHost) {
						await transferHost(newHost.id);
					}
				}
			}
		} catch (err) {
			const gameError =
				err instanceof GameError
					? err
					: new GameStateError("Failed to clean up disconnected players");
			onError?.(gameError);
		}
	}, [players, gameId, gameState?.host_id, transferHost, onError]);

	// Handle when a player leaves the game
	const handlePlayerLeave = useCallback(
		async (leavingPlayerId: string) => {
			try {
				// Remove the player from the game
				const { error } = await supabase
					.from("players")
					.delete()
					.eq("id", leavingPlayerId)
					.eq("game_id", gameId);

				if (error) {
					throw new GameStateError(`Failed to remove player: ${error.message}`);
				}

				// If the leaving player was the host, transfer to another player
				if (leavingPlayerId === gameState?.host_id) {
					const remainingPlayers = players.filter(
						(p) => p.id !== leavingPlayerId && p.is_connected
					);

					if (remainingPlayers.length > 0) {
						// Transfer to the first remaining connected player
						await transferHost(remainingPlayers[0].id);
					}
				}
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to handle player leave");
				onError?.(gameError);
				throw gameError;
			}
		},
		[gameId, gameState?.host_id, players, transferHost, onError]
	);

	// Set up heartbeat to maintain connection status
	useEffect(() => {
		const startHeartbeat = () => {
			// Send heartbeat every 30 seconds
			heartbeatIntervalRef.current = setInterval(() => {
				updateConnectionStatus(true).catch((error) => {
					console.error("Heartbeat failed:", error);
				});
			}, 30000);
		};

		startHeartbeat();

		return () => {
			if (heartbeatIntervalRef.current) {
				clearInterval(heartbeatIntervalRef.current);
			}
		};
	}, [updateConnectionStatus]);

	// Handle page visibility changes
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Page is hidden, mark as potentially disconnected
				updateConnectionStatus(false).catch(console.error);
			} else {
				// Page is visible, mark as connected
				updateConnectionStatus(true).catch(console.error);
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [updateConnectionStatus]);

	// Handle online/offline events
	useEffect(() => {
		const handleOnline = () => {
			updateConnectionStatus(true).catch(console.error);
		};

		const handleOffline = () => {
			updateConnectionStatus(false).catch(console.error);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [updateConnectionStatus]);

	// Handle beforeunload to mark as disconnected
	useEffect(() => {
		const handleBeforeUnload = () => {
			// Use sendBeacon for reliable delivery during page unload
			const data = JSON.stringify({
				playerId,
				gameId,
				connected: false,
			});

			navigator.sendBeacon("/api/player-disconnect", data);
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [playerId, gameId]);

	// Periodic cleanup of disconnected players (only for host)
	useEffect(() => {
		if (gameState?.host_id !== playerId) return;

		const cleanupInterval = setInterval(() => {
			removeDisconnectedPlayers().catch(console.error);
		}, 60000); // Check every minute

		return () => {
			clearInterval(cleanupInterval);
		};
	}, [gameState?.host_id, playerId, removeDisconnectedPlayers]);

	return {
		updateConnectionStatus,
		transferHost,
		removeDisconnectedPlayers,
		handlePlayerLeave,
	};
}
