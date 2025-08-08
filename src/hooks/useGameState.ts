import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GameState, Player, Card, Submission } from "@/types/game";
import {
	GameError,
	ConnectionError,
	GameStateError,
	SynchronizationError,
	retryWithBackoff,
	recoverGameState,
	errorLogger,
} from "@/lib/error-handling";
// Removed unused imports

interface UseGameStateOptions {
	gameId: string;
	playerId: string;
	onError?: (error: GameError) => void;
}

interface GameStateHook {
	gameState: GameState | null;
	players: Player[];
	cards: Card[];
	submissions: Submission[];
	loading: boolean;
	error: GameError | null;
	isConnected: boolean;
	updateGamePhase: (phase: GameState["phase"]) => Promise<void>;
	updatePlayerConnection: (connected: boolean) => Promise<void>;
	refetchGameState: () => Promise<void>;
	recoverFromError: () => Promise<void>;
	isRecovering: boolean;
}

export function useGameState({
	gameId,
	playerId,
	onError,
}: UseGameStateOptions): GameStateHook {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [cards, setCards] = useState<Card[]>([]);
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<GameError | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isRecovering, setIsRecovering] = useState(false);

	const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(
		null
	);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Clear error when gameId or playerId changes
	useEffect(() => {
		setError(null);
	}, [gameId, playerId]);

	// Fetch initial game state
	const fetchGameState = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch game state
			const { data: game, error: gameError } = await supabase
				.from("games")
				.select("*")
				.eq("id", gameId)
				.single();

			if (gameError) {
				throw new GameStateError(`Failed to fetch game: ${gameError.message}`, {
					gameId,
					playerId,
					operation: "fetchGame",
				});
			}

			setGameState(game);

			// Fetch players
			const { data: playersData, error: playersError } = await supabase
				.from("players")
				.select("*")
				.eq("game_id", gameId)
				.order("joined_at", { ascending: true });

			if (playersError) {
				throw new GameStateError(
					`Failed to fetch players: ${playersError.message}`,
					{ gameId, playerId, operation: "fetchPlayers" }
				);
			}

			setPlayers(playersData || []);

			// Fetch cards for current round
			const { data: cardsData, error: cardsError } = await supabase
				.from("cards")
				.select("*")
				.eq("game_id", gameId)
				.eq("round_number", game.current_round);

			if (cardsError) {
				throw new GameStateError(
					`Failed to fetch cards: ${cardsError.message}`,
					{
						gameId,
						playerId,
						operation: "fetchCards",
						round: game.current_round,
					}
				);
			}

			setCards(cardsData || []);

			// Fetch submissions for current round
			const { data: submissionsData, error: submissionsError } = await supabase
				.from("submissions")
				.select("*")
				.eq("game_id", gameId)
				.eq("round_number", game.current_round);

			if (submissionsError) {
				throw new GameStateError(
					`Failed to fetch submissions: ${submissionsError.message}`,
					{
						gameId,
						playerId,
						operation: "fetchSubmissions",
						round: game.current_round,
					}
				);
			}

			setSubmissions(submissionsData || []);
			setIsConnected(true);
		} catch (err) {
			const gameError =
				err instanceof GameError
					? err
					: new GameStateError("Failed to fetch game state", {
							gameId,
							playerId,
					  });
			setError(gameError);
			errorLogger.log(gameError, gameId, playerId);
			onError?.(gameError);
		} finally {
			setLoading(false);
		}
	}, [gameId, playerId, onError]);

	// Refetch game state with retry logic
	const refetchGameState = useCallback(async () => {
		try {
			await retryWithBackoff(fetchGameState, 3, 1000, {
				gameId,
				playerId,
				operation: "refetchGameState",
			});
		} catch (err) {
			const gameError =
				err instanceof GameError
					? err
					: new ConnectionError("Failed to reconnect", { gameId, playerId });
			setError(gameError);
			errorLogger.log(gameError, gameId, playerId);
			onError?.(gameError);
		}
	}, [fetchGameState, gameId, playerId, onError]);

	// Recover from error with game state synchronization
	const recoverFromError = useCallback(async () => {
		setIsRecovering(true);
		try {
			const recovery = await recoverGameState(
				gameId,
				playerId,
				gameState?.phase
			);

			if (recovery.success) {
				// Clear error and refetch state
				setError(null);
				await refetchGameState();

				if (!recovery.synchronized) {
					// Game state has changed, notify user
					const syncError = new SynchronizationError(
						"Game state has changed while you were disconnected",
						{ gameId, playerId, expectedPhase: gameState?.phase }
					);
					setError(syncError);
					errorLogger.log(syncError, gameId, playerId);
					onError?.(syncError);
				}
			} else {
				setError(recovery.error || new GameStateError("Recovery failed"));
			}
		} catch (err) {
			const recoveryError = new GameStateError("Failed to recover from error", {
				gameId,
				playerId,
			});
			setError(recoveryError);
			errorLogger.log(recoveryError, gameId, playerId);
			onError?.(recoveryError);
		} finally {
			setIsRecovering(false);
		}
	}, [gameId, playerId, gameState?.phase, refetchGameState, onError]);

	// Update game phase
	const updateGamePhase = useCallback(
		async (phase: GameState["phase"]) => {
			try {
				const { error: updateError } = await supabase
					.from("games")
					.update({
						phase,
						updated_at: new Date().toISOString(),
					})
					.eq("id", gameId);

				if (updateError) {
					throw new GameStateError(
						`Failed to update game phase: ${updateError.message}`,
						{ gameId, playerId, phase, operation: "updateGamePhase" }
					);
				}
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to update game phase", {
								gameId,
								playerId,
								phase,
						  });
				setError(gameError);
				errorLogger.log(gameError, gameId, playerId);
				onError?.(gameError);
				throw gameError;
			}
		},
		[gameId, playerId, onError]
	);

	// Update player connection status
	const updatePlayerConnection = useCallback(
		async (connected: boolean) => {
			try {
				const { error: updateError } = await supabase
					.from("players")
					.update({ is_connected: connected })
					.eq("id", playerId)
					.eq("game_id", gameId);

				if (updateError) {
					throw new GameStateError(
						`Failed to update connection status: ${updateError.message}`,
						{ gameId, playerId, connected, operation: "updatePlayerConnection" }
					);
				}
			} catch (err) {
				const gameError =
					err instanceof GameError
						? err
						: new GameStateError("Failed to update connection", {
								gameId,
								playerId,
								connected,
						  });
				setError(gameError);
				errorLogger.log(gameError, gameId, playerId);
				onError?.(gameError);
			}
		},
		[gameId, playerId, onError]
	);

	// Set up real-time subscriptions
	useEffect(() => {
		if (!gameId) return;

		const setupSubscriptions = async () => {
			try {
				// Subscribe to game state changes
				const gameSubscription = supabase
					.channel(`game-${gameId}`)
					.on(
						"postgres_changes",
						{
							event: "*",
							schema: "public",
							table: "games",
							filter: `id=eq.${gameId}`,
						},
						(payload) => {
							if (payload.eventType === "UPDATE" && payload.new) {
								setGameState(payload.new as GameState);
							}
						}
					)
					.on(
						"postgres_changes",
						{
							event: "*",
							schema: "public",
							table: "players",
							filter: `game_id=eq.${gameId}`,
						},
						(payload) => {
							if (payload.eventType === "INSERT" && payload.new) {
								setPlayers((prev) => [...prev, payload.new as Player]);
							} else if (payload.eventType === "UPDATE" && payload.new) {
								setPlayers((prev) =>
									prev.map((p) =>
										p.id === payload.new.id ? (payload.new as Player) : p
									)
								);
							} else if (payload.eventType === "DELETE" && payload.old) {
								setPlayers((prev) =>
									prev.filter((p) => p.id !== payload.old.id)
								);
							}
						}
					)
					.on(
						"postgres_changes",
						{
							event: "*",
							schema: "public",
							table: "cards",
							filter: `game_id=eq.${gameId}`,
						},
						(payload) => {
							if (payload.eventType === "INSERT" && payload.new) {
								const newCard = payload.new as Card;
								setCards((prev) => {
									// Only add if it's for the current round
									if (
										gameState &&
										newCard.round_number === gameState.current_round
									) {
										return [...prev, newCard];
									}
									return prev;
								});
							}
						}
					)
					.on(
						"postgres_changes",
						{
							event: "*",
							schema: "public",
							table: "submissions",
							filter: `game_id=eq.${gameId}`,
						},
						(payload) => {
							if (payload.eventType === "INSERT" && payload.new) {
								const newSubmission = payload.new as Submission;
								setSubmissions((prev) => {
									// Only add if it's for the current round
									if (
										gameState &&
										newSubmission.round_number === gameState.current_round
									) {
										return [...prev, newSubmission];
									}
									return prev;
								});
							} else if (payload.eventType === "UPDATE" && payload.new) {
								setSubmissions((prev) =>
									prev.map((s) =>
										s.id === payload.new.id ? (payload.new as Submission) : s
									)
								);
							}
						}
					)
					.subscribe((status) => {
						if (status === "SUBSCRIBED") {
							setIsConnected(true);
							setError(null);
						} else if (status === "CHANNEL_ERROR") {
							setIsConnected(false);
							const connectionError = new ConnectionError(
								"Real-time connection failed"
							);
							setError(connectionError);
							onError?.(connectionError);

							// Attempt to reconnect after a delay
							if (reconnectTimeoutRef.current) {
								clearTimeout(reconnectTimeoutRef.current);
							}
							reconnectTimeoutRef.current = setTimeout(() => {
								refetchGameState();
							}, 5000);
						}
					});

				subscriptionRef.current = gameSubscription;
			} catch (err) {
				const connectionError = new ConnectionError(
					"Failed to setup real-time subscriptions"
				);
				setError(connectionError);
				onError?.(connectionError);
			}
		};

		// Initial fetch and subscription setup
		fetchGameState().then(() => {
			setupSubscriptions();
		});

		// Cleanup function
		return () => {
			if (subscriptionRef.current) {
				supabase.removeChannel(subscriptionRef.current);
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [gameId, fetchGameState, refetchGameState, onError]);

	// Update player connection status on mount and unmount
	useEffect(() => {
		updatePlayerConnection(true);

		// Update connection status to false when component unmounts
		return () => {
			updatePlayerConnection(false);
		};
	}, [updatePlayerConnection]);

	// Handle page visibility changes
	useEffect(() => {
		const handleVisibilityChange = () => {
			updatePlayerConnection(!document.hidden);
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [updatePlayerConnection]);

	return {
		gameState,
		players,
		cards,
		submissions,
		loading,
		error,
		isConnected,
		updateGamePhase,
		updatePlayerConnection,
		refetchGameState,
		recoverFromError,
		isRecovering,
	};
}
