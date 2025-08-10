import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GameEvent } from "@/types/game";
import {
	ConnectionError,
	ConnectionRecovery,
	errorLogger,
} from "@/lib/error-handling";
import { performanceMonitor } from "@/lib/performance-monitor";

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
	reconnectAttempts: number;
	lastError: ConnectionError | null;
}

export function useRealtimeSubscription({
	gameId,
	onGameEvent,
	onConnectionChange,
	onError,
}: UseRealtimeSubscriptionOptions): RealtimeSubscriptionHook {
	const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
	const isConnectedRef = useRef(false);
	const connectionRecoveryRef = useRef(new ConnectionRecovery());
	const [reconnectAttempts, setReconnectAttempts] = useState(0);
	const [lastError, setLastError] = useState<ConnectionError | null>(null);

	const disconnect = useCallback(() => {
		if (channelRef.current) {
			supabase.removeChannel(channelRef.current);
			channelRef.current = null;
		}
		connectionRecoveryRef.current.reset();
		isConnectedRef.current = false;
		setReconnectAttempts(0);
		setLastError(null);
		onConnectionChange?.(false);
	}, [onConnectionChange]);

	const connect = useCallback(async () => {
		if (!gameId) return;

		// Start measuring connection time
		const endConnectionTimer =
			performanceMonitor.measureRealtimeLatency("connection");

		// Clean up existing connection
		if (channelRef.current) {
			supabase.removeChannel(channelRef.current);
			channelRef.current = null;
		}

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

					if (isNowConnected) {
						// Connection successful, measure latency
						endConnectionTimer({ gameId, status });

						// Reset recovery state
						connectionRecoveryRef.current.reset();
						setReconnectAttempts(0);
						setLastError(null);
					} else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
						// Record connection failure
						endConnectionTimer({ gameId, status, success: false });

						const error = new ConnectionError(
							`Real-time connection ${status.toLowerCase().replace("_", " ")}`,
							{ gameId, status }
						);

						setLastError(error);
						errorLogger.log(error, gameId);
						onError?.(error);

						// Record reconnection attempt
						performanceMonitor.recordReconnection();

						// Use connection recovery for automatic reconnection
						connectionRecoveryRef.current.attemptReconnection(
							connect,
							() => {
								setReconnectAttempts(0);
								setLastError(null);
							},
							(finalError) => {
								setLastError(finalError);
								onError?.(finalError);
							},
							{ gameId }
						);

						setReconnectAttempts(connectionRecoveryRef.current.getAttempts());
					}
				});

			channelRef.current = channel;
		} catch (err) {
			endConnectionTimer({ gameId, success: false, error: err });

			const error = new ConnectionError(
				"Failed to establish real-time connection",
				{ gameId }
			);
			setLastError(error);
			errorLogger.log(error, gameId);
			onError?.(error);
		}
	}, [gameId, onConnectionChange, onError]);

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
		reconnectAttempts,
		lastError,
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
