import { useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Player, GameEvent } from "@/types/game";
import { GameError, ConnectionError } from "@/lib/error-handling";

interface UsePlayerEventsOptions {
	gameId: string;
	playerId: string;
	onPlayerJoined?: (player: Player) => void;
	onPlayerLeft?: (playerId: string) => void;
	onPlayerUpdated?: (player: Player) => void;
	onHostTransferred?: (newHostId: string, oldHostId: string) => void;
	onError?: (error: GameError) => void;
}

interface PlayerEventsHook {
	broadcastPlayerJoined: (player: Player) => Promise<void>;
	broadcastPlayerLeft: (playerId: string) => Promise<void>;
	broadcastHostTransfer: (
		newHostId: string,
		oldHostId: string
	) => Promise<void>;
}

export function usePlayerEvents({
	gameId,
	playerId,
	onPlayerJoined,
	onPlayerLeft,
	onPlayerUpdated,
	onHostTransferred,
	onError,
}: UsePlayerEventsOptions): PlayerEventsHook {
	// Set up real-time subscriptions for player events
	useEffect(() => {
		if (!gameId) return;

		const channel = supabase
			.channel(`player-events-${gameId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "players",
					filter: `game_id=eq.${gameId}`,
				},
				(payload) => {
					const newPlayer = payload.new as Player;
					if (newPlayer.id !== playerId) {
						onPlayerJoined?.(newPlayer);
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "players",
					filter: `game_id=eq.${gameId}`,
				},
				(payload) => {
					const updatedPlayer = payload.new as Player;
					onPlayerUpdated?.(updatedPlayer);
				}
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "players",
					filter: `game_id=eq.${gameId}`,
				},
				(payload) => {
					const deletedPlayer = payload.old as Player;
					if (deletedPlayer.id !== playerId) {
						onPlayerLeft?.(deletedPlayer.id);
					}
				}
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "games",
					filter: `id=eq.${gameId}`,
				},
				(payload) => {
					const oldGame = payload.old as { host_id: string };
					const newGame = payload.new as { host_id: string };

					// Check if host changed
					if (oldGame.host_id !== newGame.host_id) {
						onHostTransferred?.(newGame.host_id, oldGame.host_id);
					}
				}
			)
			.subscribe((status) => {
				if (status === "CHANNEL_ERROR") {
					const error = new ConnectionError(
						"Player events subscription failed"
					);
					onError?.(error);
				}
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [
		gameId,
		playerId,
		onPlayerJoined,
		onPlayerLeft,
		onPlayerUpdated,
		onHostTransferred,
		onError,
	]);

	// Broadcast functions for game events
	const broadcastPlayerJoined = useCallback(
		async (player: Player) => {
			try {
				const event: GameEvent = {
					type: "player_joined",
					gameId,
					data: { player },
					timestamp: new Date().toISOString(),
				};

				// For now, we'll use a simple broadcast through Supabase channels
				const channel = supabase.channel(`game-events-${gameId}`);
				await channel.send({
					type: "broadcast",
					event: "player_joined",
					payload: event,
				});
			} catch (error) {
				console.error("Failed to broadcast player joined:", error);
			}
		},
		[gameId]
	);

	const broadcastPlayerLeft = useCallback(
		async (leftPlayerId: string) => {
			try {
				const event: GameEvent = {
					type: "player_left",
					gameId,
					data: { playerId: leftPlayerId },
					timestamp: new Date().toISOString(),
				};

				const channel = supabase.channel(`game-events-${gameId}`);
				await channel.send({
					type: "broadcast",
					event: "player_left",
					payload: event,
				});
			} catch (error) {
				console.error("Failed to broadcast player left:", error);
			}
		},
		[gameId]
	);

	const broadcastHostTransfer = useCallback(
		async (newHostId: string, oldHostId: string) => {
			try {
				const event: GameEvent = {
					type: "player_left", // Using player_left as it can trigger host transfer
					gameId,
					data: { newHostId, oldHostId },
					timestamp: new Date().toISOString(),
				};

				const channel = supabase.channel(`game-events-${gameId}`);
				await channel.send({
					type: "broadcast",
					event: "host_transferred",
					payload: event,
				});
			} catch (error) {
				console.error("Failed to broadcast host transfer:", error);
			}
		},
		[gameId]
	);

	return {
		broadcastPlayerJoined,
		broadcastPlayerLeft,
		broadcastHostTransfer,
	};
}

// Utility function to show player notifications
export function usePlayerNotifications() {
	const showPlayerJoined = useCallback((player: Player) => {
		// This could be enhanced with a toast notification system
		console.log(`${player.name} joined the game`);
	}, []);

	const showPlayerLeft = useCallback((playerName: string) => {
		console.log(`${playerName} left the game`);
	}, []);

	const showHostTransferred = useCallback((newHostName: string) => {
		console.log(`${newHostName} is now the host`);
	}, []);

	return {
		showPlayerJoined,
		showPlayerLeft,
		showHostTransferred,
	};
}
