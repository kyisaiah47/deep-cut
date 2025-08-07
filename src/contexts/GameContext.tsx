"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { GameState, Player, Card, Submission, GameEvent } from "@/types/game";
import { GameError } from "@/lib/error-handling";
import { useGameState } from "@/hooks/useGameState";
import {
	useRealtimeSubscription,
	broadcastGameEvent,
} from "@/hooks/useRealtimeSubscription";
import { usePlayerManagement } from "@/hooks/usePlayerManagement";
import {
	usePlayerEvents,
	usePlayerNotifications,
} from "@/hooks/usePlayerEvents";

interface GameContextValue {
	// Game state
	gameState: GameState | null;
	players: Player[];
	cards: Card[];
	submissions: Submission[];

	// Connection state
	loading: boolean;
	error: GameError | null;
	isConnected: boolean;

	// Current player info
	currentPlayer: Player | null;
	isHost: boolean;

	// Actions
	updateGamePhase: (phase: GameState["phase"]) => Promise<void>;
	refetchGameState: () => Promise<void>;
	broadcastEvent: (
		event: Omit<GameEvent, "gameId" | "timestamp">
	) => Promise<void>;

	// Player management actions
	transferHost: (newHostId: string) => Promise<void>;
	handlePlayerLeave: (playerId: string) => Promise<void>;
	updateConnectionStatus: (connected: boolean) => Promise<void>;

	// Computed values
	canStartGame: boolean;
	isGameActive: boolean;
	currentRoundCards: Card[];
	playerSubmissions: Submission[];
	connectedPlayers: Player[];
	disconnectedPlayers: Player[];
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
	children: React.ReactNode;
	gameId: string;
	playerId: string;
	onError?: (error: GameError) => void;
}

export function GameProvider({
	children,
	gameId,
	playerId,
	onError,
}: GameProviderProps) {
	// Use the game state hook
	const {
		gameState,
		players,
		cards,
		submissions,
		loading,
		error,
		isConnected: gameStateConnected,
		updateGamePhase,
		refetchGameState,
	} = useGameState({
		gameId,
		playerId,
		onError,
	});

	// Player notifications
	const { showPlayerJoined, showPlayerLeft, showHostTransferred } =
		usePlayerNotifications();

	// Handle player events
	const handlePlayerJoined = useCallback(
		(player: Player) => {
			showPlayerJoined(player);
		},
		[showPlayerJoined]
	);

	const handlePlayerLeft = useCallback(
		(leftPlayerId: string) => {
			const leftPlayer = players.find((p) => p.id === leftPlayerId);
			if (leftPlayer) {
				showPlayerLeft(leftPlayer.name);
			}
		},
		[players, showPlayerLeft]
	);

	const handleHostTransferred = useCallback(
		(newHostId: string) => {
			const newHost = players.find((p) => p.id === newHostId);
			if (newHost) {
				showHostTransferred(newHost.name);
			}
		},
		[players, showHostTransferred]
	);

	// Use player management hooks
	const { updateConnectionStatus, transferHost, handlePlayerLeave } =
		usePlayerManagement({
			gameId,
			playerId,
			players,
			gameState,
			onError,
			onHostTransfer: handleHostTransferred,
		});

	// Use player events for real-time updates
	usePlayerEvents({
		gameId,
		playerId,
		onPlayerJoined: handlePlayerJoined,
		onPlayerLeft: handlePlayerLeft,
		onHostTransferred: handleHostTransferred,
		onError,
	});

	// Handle game events from real-time subscriptions
	const handleGameEvent = useCallback((event: GameEvent) => {
		// Handle specific game events if needed
		switch (event.type) {
			case "player_joined":
			case "player_left":
			case "phase_change":
			case "cards_distributed":
			case "submission_received":
			case "voting_complete":
				// These are handled by the database subscriptions in useGameState
				break;
			default:
				console.log("Received game event:", event);
		}
	}, []);

	// Use real-time subscription for game events
	const { isConnected: realtimeConnected } = useRealtimeSubscription({
		gameId,
		onGameEvent: handleGameEvent,
		onError,
	});

	// Broadcast game event
	const broadcastEvent = useCallback(
		async (event: Omit<GameEvent, "gameId" | "timestamp">) => {
			try {
				await broadcastGameEvent(gameId, event);
			} catch (err) {
				console.error("Failed to broadcast game event:", err);
			}
		},
		[gameId]
	);

	// Computed values
	const contextValue = useMemo((): GameContextValue => {
		const currentPlayer = players.find((p) => p.id === playerId) || null;
		const isHost = gameState?.host_id === playerId;
		const isConnected = gameStateConnected && realtimeConnected;

		// Game can start if we have minimum players and are in lobby phase
		const canStartGame =
			isHost && gameState?.phase === "lobby" && players.length >= 3; // Minimum players from constants

		// Game is active if not in lobby phase
		const isGameActive = gameState?.phase !== "lobby";

		// Cards for current round
		const currentRoundCards = gameState
			? cards.filter((card) => card.round_number === gameState.current_round)
			: [];

		// Submissions for current player in current round
		const playerSubmissions = gameState
			? submissions.filter(
					(sub) =>
						sub.player_id === playerId &&
						sub.round_number === gameState.current_round
			  )
			: [];

		// Connected and disconnected players
		const connectedPlayers = players.filter((p) => p.is_connected);
		const disconnectedPlayers = players.filter((p) => !p.is_connected);

		return {
			// Game state
			gameState,
			players,
			cards,
			submissions,

			// Connection state
			loading,
			error,
			isConnected,

			// Current player info
			currentPlayer,
			isHost,

			// Actions
			updateGamePhase,
			refetchGameState,
			broadcastEvent,

			// Player management actions
			transferHost,
			handlePlayerLeave,
			updateConnectionStatus,

			// Computed values
			canStartGame,
			isGameActive,
			currentRoundCards,
			playerSubmissions,
			connectedPlayers,
			disconnectedPlayers,
		};
	}, [
		gameState,
		players,
		cards,
		submissions,
		loading,
		error,
		gameStateConnected,
		realtimeConnected,
		playerId,
		updateGamePhase,
		refetchGameState,
		broadcastEvent,
		transferHost,
		handlePlayerLeave,
		updateConnectionStatus,
	]);

	return (
		<GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
	);
}

// Hook to use the game context
export function useGame(): GameContextValue {
	const context = useContext(GameContext);

	if (!context) {
		throw new Error("useGame must be used within a GameProvider");
	}

	return context;
}

// Hook to get current player specifically
export function useCurrentPlayer(): Player | null {
	const { currentPlayer } = useGame();
	return currentPlayer;
}

// Hook to check if current user is host
export function useIsHost(): boolean {
	const { isHost } = useGame();
	return isHost;
}

// Hook to get game phase
export function useGamePhase(): GameState["phase"] | null {
	const { gameState } = useGame();
	return gameState?.phase || null;
}
