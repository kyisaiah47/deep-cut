"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "@/types/game";
import { supabase } from "@/lib/supabase";

export interface TimerState {
	timeRemaining: number;
	isActive: boolean;
	isPaused: boolean;
	phase: GameState["phase"] | null;
	startedAt: Date | null;
	duration: number;
}

export interface TimerActions {
	startTimer: (phase: GameState["phase"], duration: number) => Promise<void>;
	pauseTimer: () => Promise<void>;
	resumeTimer: () => Promise<void>;
	stopTimer: () => Promise<void>;
	syncTimer: () => Promise<void>;
}

interface UseTimerManagementProps {
	gameId: string;
	gameState: GameState | null;
	onTimerExpire: (phase: GameState["phase"]) => void;
	onAutoSubmission?: () => Promise<void>;
	onAutoVoting?: () => Promise<void>;
	onError?: (error: Error) => void;
}

export function useTimerManagement({
	gameId,
	gameState,
	onTimerExpire,
	onAutoSubmission,
	onAutoVoting,
	onError,
}: UseTimerManagementProps): TimerState & TimerActions {
	const [timerState, setTimerState] = useState<TimerState>({
		timeRemaining: 0,
		isActive: false,
		isPaused: false,
		phase: null,
		startedAt: null,
		duration: 0,
	});

	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Clear intervals on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			if (syncTimeoutRef.current) {
				clearTimeout(syncTimeoutRef.current);
			}
		};
	}, []);

	// Sync timer with server time
	const syncTimer = useCallback(async () => {
		try {
			if (!gameState || !timerState.isActive || !timerState.startedAt) {
				return;
			}

			// Get server time from Supabase
			const { data, error } = await supabase.rpc("get_server_time");

			if (error) {
				console.error("Failed to get server time:", error);
				return;
			}

			const serverTime = new Date(data);
			const elapsedSeconds = Math.floor(
				(serverTime.getTime() - timerState.startedAt.getTime()) / 1000
			);

			const newTimeRemaining = Math.max(
				0,
				timerState.duration - elapsedSeconds
			);

			setTimerState((prev) => ({
				...prev,
				timeRemaining: newTimeRemaining,
			}));

			// If timer expired, trigger callbacks
			if (newTimeRemaining === 0 && timerState.phase) {
				// Handle auto-actions before phase transition
				if (timerState.phase === "submission" && onAutoSubmission) {
					try {
						await onAutoSubmission();
					} catch (error) {
						console.error("Auto-submission failed:", error);
					}
				} else if (timerState.phase === "voting" && onAutoVoting) {
					try {
						await onAutoVoting();
					} catch (error) {
						console.error("Auto-voting failed:", error);
					}
				}

				onTimerExpire(timerState.phase);
			}
		} catch (error) {
			console.error("Timer sync error:", error);
			onError?.(error as Error);
		}
	}, [
		gameState,
		timerState.isActive,
		timerState.startedAt,
		timerState.duration,
		timerState.phase,
		onTimerExpire,
		onError,
	]);

	// Start timer for a specific phase
	const startTimer = useCallback(
		async (phase: GameState["phase"], duration: number) => {
			try {
				// Get server time for synchronization
				const { data: serverTimeData, error: timeError } = await supabase.rpc(
					"get_server_time"
				);

				if (timeError) {
					throw new Error(`Failed to get server time: ${timeError.message}`);
				}

				const startTime = new Date(serverTimeData);

				// Store timer state in database for synchronization
				const { error: updateError } = await supabase
					.from("game_timers")
					.upsert({
						game_id: gameId,
						phase,
						duration,
						started_at: startTime.toISOString(),
						is_active: true,
						is_paused: false,
					});

				if (updateError) {
					throw new Error(
						`Failed to store timer state: ${updateError.message}`
					);
				}

				setTimerState({
					timeRemaining: duration,
					isActive: true,
					isPaused: false,
					phase,
					startedAt: startTime,
					duration,
				});
			} catch (error) {
				console.error("Failed to start timer:", error);
				onError?.(error as Error);
			}
		},
		[gameId, onError]
	);

	// Pause timer
	const pauseTimer = useCallback(async () => {
		try {
			const { error } = await supabase
				.from("game_timers")
				.update({
					is_paused: true,
					paused_at: new Date().toISOString(),
					time_remaining: timerState.timeRemaining,
				})
				.eq("game_id", gameId);

			if (error) {
				throw new Error(`Failed to pause timer: ${error.message}`);
			}

			setTimerState((prev) => ({
				...prev,
				isPaused: true,
			}));
		} catch (error) {
			console.error("Failed to pause timer:", error);
			onError?.(error as Error);
		}
	}, [gameId, timerState.timeRemaining, onError]);

	// Resume timer
	const resumeTimer = useCallback(async () => {
		try {
			// Get server time for synchronization
			const { data: serverTimeData, error: timeError } = await supabase.rpc(
				"get_server_time"
			);

			if (timeError) {
				throw new Error(`Failed to get server time: ${timeError.message}`);
			}

			const resumeTime = new Date(serverTimeData);

			const { error } = await supabase
				.from("game_timers")
				.update({
					is_paused: false,
					started_at: resumeTime.toISOString(),
					duration: timerState.timeRemaining, // Use remaining time as new duration
				})
				.eq("game_id", gameId);

			if (error) {
				throw new Error(`Failed to resume timer: ${error.message}`);
			}

			setTimerState((prev) => ({
				...prev,
				isPaused: false,
				startedAt: resumeTime,
				duration: prev.timeRemaining,
			}));
		} catch (error) {
			console.error("Failed to resume timer:", error);
			onError?.(error as Error);
		}
	}, [gameId, timerState.timeRemaining, onError]);

	// Stop timer
	const stopTimer = useCallback(async () => {
		try {
			const { error } = await supabase
				.from("game_timers")
				.update({ is_active: false })
				.eq("game_id", gameId);

			if (error) {
				throw new Error(`Failed to stop timer: ${error.message}`);
			}

			setTimerState({
				timeRemaining: 0,
				isActive: false,
				isPaused: false,
				phase: null,
				startedAt: null,
				duration: 0,
			});
		} catch (error) {
			console.error("Failed to stop timer:", error);
			onError?.(error as Error);
		}
	}, [gameId, onError]);

	// Timer countdown effect
	useEffect(() => {
		if (!timerState.isActive || timerState.isPaused) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		intervalRef.current = setInterval(() => {
			setTimerState((prev) => {
				if (prev.timeRemaining <= 1) {
					// Timer expired - handle auto-actions
					if (prev.phase) {
						// Handle auto-actions asynchronously
						(async () => {
							try {
								if (prev.phase === "submission" && onAutoSubmission) {
									await onAutoSubmission();
								} else if (prev.phase === "voting" && onAutoVoting) {
									await onAutoVoting();
								}
							} catch (error) {
								console.error(
									`Auto-action failed for phase ${prev.phase}:`,
									error
								);
							} finally {
								if (prev.phase) {
									onTimerExpire(prev.phase);
								}
							}
						})();
					}

					return {
						...prev,
						timeRemaining: 0,
						isActive: false,
					};
				}
				return {
					...prev,
					timeRemaining: prev.timeRemaining - 1,
				};
			});
		}, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [
		timerState.isActive,
		timerState.isPaused,
		onTimerExpire,
		onAutoSubmission,
		onAutoVoting,
	]);

	// Periodic sync with server (every 10 seconds)
	useEffect(() => {
		if (!timerState.isActive || timerState.isPaused) {
			return;
		}

		const syncInterval = setInterval(() => {
			syncTimer();
		}, 10000);

		return () => clearInterval(syncInterval);
	}, [timerState.isActive, timerState.isPaused, syncTimer]);

	// Subscribe to timer updates from other clients
	useEffect(() => {
		if (!gameId) return;

		const subscription = supabase
			.channel(`game_timer_${gameId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "game_timers",
					filter: `game_id=eq.${gameId}`,
				},
				async (payload) => {
					const timerData = payload.new as any;

					if (!timerData) return;

					// Update local timer state based on server data
					if (timerData.is_active && !timerData.is_paused) {
						// Calculate current time remaining
						const { data: serverTimeData } = await supabase.rpc(
							"get_server_time"
						);
						const serverTime = new Date(serverTimeData);
						const startTime = new Date(timerData.started_at);
						const elapsedSeconds = Math.floor(
							(serverTime.getTime() - startTime.getTime()) / 1000
						);
						const timeRemaining = Math.max(
							0,
							timerData.duration - elapsedSeconds
						);

						setTimerState({
							timeRemaining,
							isActive: timerData.is_active,
							isPaused: timerData.is_paused,
							phase: timerData.phase,
							startedAt: startTime,
							duration: timerData.duration,
						});
					} else {
						setTimerState({
							timeRemaining: timerData.time_remaining || 0,
							isActive: timerData.is_active,
							isPaused: timerData.is_paused,
							phase: timerData.phase,
							startedAt: timerData.started_at
								? new Date(timerData.started_at)
								: null,
							duration: timerData.duration || 0,
						});
					}
				}
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [gameId]);

	// Auto-start timers based on game phase changes
	useEffect(() => {
		if (!gameState) return;

		const shouldStartTimer = () => {
			// Only start timer if we're not already running one for this phase
			if (timerState.isActive && timerState.phase === gameState.phase) {
				return false;
			}

			switch (gameState.phase) {
				case "submission":
					return gameState.submission_timer > 0;
				case "voting":
					return gameState.voting_timer > 0;
				default:
					return false;
			}
		};

		const getTimerDuration = () => {
			switch (gameState.phase) {
				case "submission":
					return gameState.submission_timer;
				case "voting":
					return gameState.voting_timer;
				default:
					return 0;
			}
		};

		if (shouldStartTimer()) {
			const duration = getTimerDuration();
			startTimer(gameState.phase, duration);
		} else if (gameState.phase === "lobby" || gameState.phase === "results") {
			// Stop timer for phases that don't need timers
			stopTimer();
		}
	}, [
		gameState?.phase,
		gameState?.submission_timer,
		gameState?.voting_timer,
		timerState.isActive,
		timerState.phase,
		startTimer,
		stopTimer,
		gameState,
	]);

	return {
		...timerState,
		startTimer,
		pauseTimer,
		resumeTimer,
		stopTimer,
		syncTimer,
	};
}
