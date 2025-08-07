import { useCallback, useEffect, useState } from "react";
import { GameState, Player, GameEvent } from "@/types/game";
import { GameError, GameStateError } from "@/lib/error-handling";
import { GAME_PHASES, GAME_EVENTS } from "@/lib/constants";
import { useRoundManagement } from "./useRoundManagement";
import { useGame } from "@/contexts/GameContext";

interface UseRoundOrchestratorOptions {
	onError?: (error: GameError) => void;
	onRoundComplete?: (roundNumber: number) => void;
}

interface RoundOrchestratorHook {
	// State
	currentRoundNumber: number;
	isRoundInProgress: boolean;
	roundPhase: "initializing" | "distributing" | "ready" | "complete" | null;
	roundError: GameError | null;

	// Actions
	startNewRound: () => Promise<void>;
	handlePhaseTransition: (newPhase: GameState["phase"]) => Promise<void>;
	handleDistributionPhase: () => Promise<void>;
	resetRound: () => void;

	// Status
	canStartNewRound: boolean;
	isDistributionPhase: boolean;
	isSubmissionReady: boolean;
}

export function useRoundOrchestrator({
	onError,
	onRoundComplete,
}: UseRoundOrchestratorOptions = {}): RoundOrchestratorHook {
	const { gameState, players, isHost, updateGamePhase, broadcastEvent } =
		useGame();

	const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
	const [isRoundInProgress, setIsRoundInProgress] = useState(false);
	const [roundPhase, setRoundPhase] = useState<
		"initializing" | "distributing" | "ready" | "complete" | null
	>(null);
	const [roundError, setRoundError] = useState<GameError | null>(null);

	const handleError = useCallback(
		(error: GameError) => {
			setRoundError(error);
			onError?.(error);
		},
		[onError]
	);

	// Initialize round management hook
	const {
		isInitializingRound,
		isDistributingCards,
		cardsDistributed,
		allPlayersHaveCards,
		initializeNewRound,
		distributeCardsToAllPlayers,
		validateCardDistribution,
		progressToSubmissionPhase,
		resetRoundState,
		canStartRound,
		canDistributeCards,
		canProgressToSubmission,
	} = useRoundManagement({
		gameId: gameState?.id || "",
		gameState,
		players,
		onError: handleError,
		onPhaseChange: async (phase) => {
			if (phase === GAME_PHASES.SUBMISSION) {
				setRoundPhase("ready");
				await broadcastEvent({
					type: GAME_EVENTS.CARDS_DISTRIBUTED,
					data: {
						round: currentRoundNumber,
						playersCount: players.filter((p) => p.is_connected).length,
					},
				});
			}
		},
	});

	// Start a new round (host only)
	const startNewRound = useCallback(async () => {
		if (!gameState || !isHost) {
			throw new GameStateError("Only host can start new round");
		}

		if (!canStartRound) {
			throw new GameStateError("Cannot start round in current state");
		}

		setIsRoundInProgress(true);
		setRoundPhase("initializing");
		setRoundError(null);

		try {
			// Initialize the round with AI card generation
			await initializeNewRound();

			setRoundPhase("distributing");

			// Automatically distribute cards after initialization
			await distributeCardsToAllPlayers();

			// Broadcast round start event
			await broadcastEvent({
				type: GAME_EVENTS.PHASE_CHANGE,
				data: {
					phase: GAME_PHASES.DISTRIBUTION,
					round: gameState.current_round,
					action: "round_started",
				},
			});
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to start new round");
			handleError(gameError);
			setRoundPhase(null);
			setIsRoundInProgress(false);
			throw gameError;
		}
	}, [
		gameState,
		isHost,
		canStartRound,
		initializeNewRound,
		distributeCardsToAllPlayers,
		broadcastEvent,
		handleError,
	]);

	// Handle phase transitions during round
	const handlePhaseTransition = useCallback(
		async (newPhase: GameState["phase"]) => {
			if (!gameState) return;

			try {
				switch (newPhase) {
					case GAME_PHASES.DISTRIBUTION:
						// Starting distribution phase
						setRoundPhase("initializing");
						setIsRoundInProgress(true);
						break;

					case GAME_PHASES.SUBMISSION:
						// Cards distributed, ready for submissions
						setRoundPhase("ready");
						break;

					case GAME_PHASES.VOTING:
						// Submissions complete, ready for voting
						setRoundPhase("complete");
						break;

					case GAME_PHASES.RESULTS:
						// Voting complete, showing results
						setRoundPhase("complete");
						onRoundComplete?.(currentRoundNumber);
						break;

					case GAME_PHASES.LOBBY:
						// Game reset
						resetRound();
						break;
				}
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to handle phase transition");
				handleError(gameError);
			}
		},
		[gameState, currentRoundNumber, onRoundComplete, handleError]
	);

	// Handle distribution phase logic
	const handleDistributionPhase = useCallback(async () => {
		if (!gameState || gameState.phase !== GAME_PHASES.DISTRIBUTION) {
			return;
		}

		if (!isHost) {
			// Non-host players just wait for cards to be distributed
			return;
		}

		try {
			// If cards haven't been distributed yet, distribute them
			if (canDistributeCards) {
				setRoundPhase("distributing");
				await distributeCardsToAllPlayers();
			}

			// If cards are distributed and validated, progress to submission
			if (canProgressToSubmission) {
				await progressToSubmissionPhase();
			}
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to handle distribution phase");
			handleError(gameError);
		}
	}, [
		gameState,
		isHost,
		canDistributeCards,
		canProgressToSubmission,
		distributeCardsToAllPlayers,
		progressToSubmissionPhase,
		handleError,
	]);

	// Reset round state
	const resetRound = useCallback(() => {
		setIsRoundInProgress(false);
		setRoundPhase(null);
		setRoundError(null);
		resetRoundState();
	}, [resetRoundState]);

	// Update current round number when game state changes
	useEffect(() => {
		if (gameState) {
			setCurrentRoundNumber(gameState.current_round);
		}
	}, [gameState?.current_round]);

	// Handle automatic distribution phase logic
	useEffect(() => {
		if (gameState?.phase === GAME_PHASES.DISTRIBUTION && isHost) {
			handleDistributionPhase();
		}
	}, [gameState?.phase, isHost, handleDistributionPhase]);

	// Update round phase based on game state and card distribution status
	useEffect(() => {
		if (!gameState) return;

		switch (gameState.phase) {
			case GAME_PHASES.DISTRIBUTION:
				if (isInitializingRound) {
					setRoundPhase("initializing");
				} else if (isDistributingCards) {
					setRoundPhase("distributing");
				} else if (allPlayersHaveCards) {
					setRoundPhase("ready");
				}
				break;

			case GAME_PHASES.SUBMISSION:
				setRoundPhase("ready");
				break;

			case GAME_PHASES.VOTING:
			case GAME_PHASES.RESULTS:
				setRoundPhase("complete");
				break;

			case GAME_PHASES.LOBBY:
				setRoundPhase(null);
				setIsRoundInProgress(false);
				break;
		}
	}, [
		gameState?.phase,
		isInitializingRound,
		isDistributingCards,
		allPlayersHaveCards,
	]);

	// Computed values
	const canStartNewRound = !!(
		gameState &&
		isHost &&
		(gameState.phase === GAME_PHASES.LOBBY ||
			gameState.phase === GAME_PHASES.RESULTS) &&
		!isRoundInProgress
	);

	const isDistributionPhase = gameState?.phase === GAME_PHASES.DISTRIBUTION;

	const isSubmissionReady = !!(
		gameState?.phase === GAME_PHASES.SUBMISSION && roundPhase === "ready"
	);

	return {
		// State
		currentRoundNumber,
		isRoundInProgress,
		roundPhase,
		roundError,

		// Actions
		startNewRound,
		handlePhaseTransition,
		handleDistributionPhase,
		resetRound,

		// Status
		canStartNewRound,
		isDistributionPhase,
		isSubmissionReady,
	};
}
