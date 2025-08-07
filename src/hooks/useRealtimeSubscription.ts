import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { GameEvent } from "@/types/game";
import { ConnectionError } from "@/lib/error-handling";

interface UseRealtimeSubscriptionOptions {
	gameId: string;
	onGameEvent?: (event: GameEvent) => void;
	onConnectionChange?: (connected: boolean) => void;
	onError?: (error: ConnectionError) => void;
}

interface RealtimeSubscriptionHook {
	isConnected: boolean;
	reconnect: () => void;
	disconnect: () => void;
}

export function useRealtimeSubscription({
	gameId,
	onGameEvent,
	onConnectionChange,
	onError,
}: UseRealtimeSubscriptionOptions): RealtimeSubscriptionHook {
	const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
	const isConnectedRef = useRef(false);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const disconnect = useCallback(() => {
		if (channelRef.current) {
			supabase.removeChannel(channelRef.current);
			channelRef.current = null;
		}
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}
		isConnectedRef.current = false;
		onConnectionChange?.(false);
	}, [onConnectionChange]);

	const connect = useCallback(() => {
		if (!gameId) return;

		// Clean up existing connection
		disconnect();

		try {
			const channel = supabase
				.channel(`game-events-${gameId}`)
				.subscribe((status) => {
					const wasConnected = isConnectedRef.current;
					const isNowConnected = status === "SUBSCRIBED";

					isConnectedRef.current = isNowConnected;

					if (wasConnected !== isNowConnected) {
						onConnectionChange?.(isNowConnected);
					}

					if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
						const error = new ConnectionError(
							`Real-time connection ${status.toLowerCase().replace("_", " ")}`
						);
						onError?.(error);

						// Attempt to reconnect after a delay
						if (reconnectTimeoutRef.current) {
							clearTimeout(reconnectTimeoutRef.current);
						}
						reconnectTimeoutRef.current = setTimeout(() => {
							connect();
						}, 3000);
					}
				});

			channelRef.current = channel;
		} catch (err) {
			const error = new ConnectionError(
				"Failed to establish real-time connection"
			);
			onError?.(error);
		}
	}, [gameId, onConnectionChange, onError, disconnect]);

	const reconnect = useCallback(() => {
		connect();
	}, [connect]);

	// Set up connection on mount and gameId change
	useEffect(() => {
		connect();
		return disconnect;
	}, [connect, disconnect]);

	// Handle page visibility changes for connection management
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Page is hidden, we might want to reduce connection activity
				// but keep the connection alive for now
			} else {
				// Page is visible, ensure we're connected
				if (!isConnectedRef.current) {
					reconnect();
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [reconnect]);

	// Handle online/offline events
	useEffect(() => {
		const handleOnline = () => {
			if (!isConnectedRef.current) {
				reconnect();
			}
		};

		const handleOffline = () => {
			// Connection will be handled by the subscription status callback
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [reconnect]);

	return {
		isConnected: isConnectedRef.current,
		reconnect,
		disconnect,
	};
}

// Simplified broadcast function - for now just log the event
export async function broadcastGameEvent(
	gameId: string,
	event: Omit<GameEvent, "gameId" | "timestamp">
): Promise<void> {
	// For now, just log the event. In a full implementation, this would
	// use Supabase's broadcast functionality or a custom events table
	console.log("Broadcasting game event:", {
		gameId,
		...event,
		timestamp: new Date().toISOString(),
	});
}
