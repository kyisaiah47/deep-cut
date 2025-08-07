import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GameState, Player, Card } from "@/types/game";
import { GameError, GameStateError } from "@/lib/error-handling";
import { GAME_PHASES, GAME_LIMITS } from "@/lib/constants";
import {
	generateCards,
	distributeCardsToPlayers,
	getCardsForRound,
} from "@/lib/card-generation";
import { canTransitionToPhase } from "@/lib/game-utils";

interface UseRoundManagementOptions {
	gameId: string;
	gameState: GameState | null;
	players: Player[];
	onError?: (error: GameError) => void;
	onPhaseChange?: (phase: GameState["phase"]) => void;
}

interface RoundManagementHook {
	// State
	isInitializingRound: boolean;
	isDistributingCards: boolean;
	roundError: GameError | null;
	cardsDistributed: boolean;
	allPlayersHaveCards: boolean;

	// Actions
	initializeNewRound: () => Promise<void>;
	distributeCardsToAllPlayers: () => Promise<void>;
	validateCardDistribution: () => Promise<boolean>;
	progressToSubmissionPhase: () => Promise<void>;
	resetRoundState: () => void;

	// Computed values
	canStartRound: boolean;
	canDistributeCards: boolean;
	canProgressToSubmission: boolean;
}

export function useRoundManagement({
	gameId,
	gameState,
	players,
	onError,
	onPhaseChange,
}: UseRoundManagementOptions): RoundManagementHook {
	const [isInitializingRound, setIsInitializingRound] = useState(false);
	const [isDistributingCards, setIsDistributingCards] = useState(false);
	const [roundError, setRoundError] = useState<GameError | null>(null);
	const [cardsDistributed, setCardsDistributed] = useState(false);
	const [allPlayersHaveCards, setAllPlayersHaveCards] = useState(false);

	const handleError = useCallback(
		(error: GameError) => {
			setRoundError(error);
			onError?.(error);
		},
		[onError]
	);

	// Initialize a new round with AI card generation
	const initializeNewRound = useCallback(async () => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		setIsInitializingRound(true);
		setRoundError(null);
		setCardsDistributed(false);
		setAllPlayersHaveCards(false);

		try {
			const activePlayers = players.filter((p) => p.is_connected);

			if (activePlayers.length < GAME_LIMITS.MIN_PLAYERS) {
				throw new GameStateError(
					`Need at least ${GAME_LIMITS.MIN_PLAYERS} active players to start round`
				);
			}

			// Generate cards for the round using AI
			const generateResult = await generateCards({
				gameId,
				roundNumber: gameState.current_round,
				playerCount: activePlayers.length,
				theme: undefined, // Could be extended to support themes
			});

			if (!generateResult.success) {
				throw new GameStateError(
					generateResult.error || "Failed to generate cards for round"
				);
			}

			console.log(
				`Round ${gameState.current_round} initialized: ${generateResult.cardsGenerated} cards generated`
			);
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to initialize round");
			handleError(gameError);
			throw gameError;
		} finally {
			setIsInitializingRound(false);
		}
	}, [gameId, gameState, players, handleError]);

	// Distribute cards to all players ensuring unique response cards
	const distributeCardsToAllPlayers = useCallback(async () => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		setIsDistributingCards(true);
		setRoundError(null);

		try {
			const activePlayers = players.filter((p) => p.is_connected);
			const playerIds = activePlayers.map((p) => p.id);

			if (playerIds.length === 0) {
				throw new GameStateError("No active players to distribute cards to");
			}

			// Distribute response cards to players (5 cards per player by default)
			await distributeCardsToPlayers(
				gameId,
				gameState.current_round,
				playerIds,
				5 // Cards per player
			);

			setCardsDistributed(true);

			// Validate that all players received cards
			const distributionValid = await validateCardDistribution();
			setAllPlayersHaveCards(distributionValid);

			if (!distributionValid) {
				throw new GameStateError("Card distribution validation failed");
			}

			console.log(
				`Cards distributed to ${playerIds.length} players for round ${gameState.current_round}`
			);
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to distribute cards");
			handleError(gameError);
			throw gameError;
		} finally {
			setIsDistributingCards(false);
		}
	}, [gameId, gameState, players, handleError]);

	// Validate that all players have received their cards
	const validateCardDistribution = useCallback(async (): Promise<boolean> => {
		if (!gameState) {
			return false;
		}

		try {
			const activePlayers = players.filter((p) => p.is_connected);

			// Check that each active player has received response cards
			for (const player of activePlayers) {
				const { data: playerCards, error } = await supabase
					.from("cards")
					.select("id")
					.eq("game_id", gameId)
					.eq("round_number", gameState.current_round)
					.eq("player_id", player.id)
					.eq("type", "response");

				if (error) {
					console.error("Error validating card distribution:", error);
					return false;
				}

				// Each player should have exactly 5 response cards
				if (!playerCards || playerCards.length !== 5) {
					console.warn(
						`Player ${player.id} has ${
							playerCards?.length || 0
						} cards, expected 5`
					);
					return false;
				}
			}

			// Verify prompt card exists
			const { data: promptCard, error: promptError } = await supabase
				.from("cards")
				.select("id")
				.eq("game_id", gameId)
				.eq("round_number", gameState.current_round)
				.eq("type", "prompt")
				.single();

			if (promptError || !promptCard) {
				console.error("No prompt card found for round:", promptError);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Card distribution validation error:", error);
			return false;
		}
	}, [gameId, gameState, players]);

	// Progress to submission phase after successful card distribution
	const progressToSubmissionPhase = useCallback(async () => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		try {
			// Validate that we can transition to submission phase
			const transitionCheck = canTransitionToPhase(
				gameState.phase,
				GAME_PHASES.SUBMISSION,
				gameState,
				players
			);

			if (!transitionCheck.canTransition) {
				throw new GameStateError(
					transitionCheck.reason || "Cannot transition to submission phase"
				);
			}

			// Ensure all players have cards before transitioning
			const distributionValid = await validateCardDistribution();
			if (!distributionValid) {
				throw new GameStateError(
					"Cannot progress to submission: not all players have cards"
				);
			}

			// Update game phase to submission
			const { error: updateError } = await supabase
				.from("games")
				.update({
					phase: GAME_PHASES.SUBMISSION,
					updated_at: new Date().toISOString(),
				})
				.eq("id", gameId);

			if (updateError) {
				throw new GameStateError(
					`Failed to update game phase: ${updateError.message}`
				);
			}

			onPhaseChange?.(GAME_PHASES.SUBMISSION);

			console.log(`Game ${gameId} progressed to submission phase`);
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to progress to submission phase");
			handleError(gameError);
			throw gameError;
		}
	}, [
		gameId,
		gameState,
		players,
		onPhaseChange,
		validateCardDistribution,
		handleError,
	]);

	// Reset round state
	const resetRoundState = useCallback(() => {
		setRoundError(null);
		setCardsDistributed(false);
		setAllPlayersHaveCards(false);
	}, []);

	// Computed values
	const canStartRound = !!(
		gameState &&
		gameState.phase === GAME_PHASES.DISTRIBUTION &&
		players.filter((p) => p.is_connected).length >= GAME_LIMITS.MIN_PLAYERS &&
		!isInitializingRound
	);

	const canDistributeCards = !!(
		gameState &&
		gameState.phase === GAME_PHASES.DISTRIBUTION &&
		!isDistributingCards &&
		!cardsDistributed
	);

	const canProgressToSubmission = !!(
		gameState &&
		gameState.phase === GAME_PHASES.DISTRIBUTION &&
		cardsDistributed &&
		allPlayersHaveCards &&
		!isInitializingRound &&
		!isDistributingCards
	);

	// Auto-validate card distribution when cards are distributed
	useEffect(() => {
		if (cardsDistributed && gameState) {
			validateCardDistribution().then(setAllPlayersHaveCards);
		}
	}, [cardsDistributed, gameState, validateCardDistribution]);

	// Auto-progress to submission phase when conditions are met
	useEffect(() => {
		if (
			canProgressToSubmission &&
			gameState?.phase === GAME_PHASES.DISTRIBUTION
		) {
			// Add a small delay to ensure all real-time updates are processed
			const timer = setTimeout(() => {
				progressToSubmissionPhase().catch((error) => {
					console.error("Auto-progression to submission failed:", error);
				});
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [canProgressToSubmission, gameState?.phase, progressToSubmissionPhase]);

	return {
		// State
		isInitializingRound,
		isDistributingCards,
		roundError,
		cardsDistributed,
		allPlayersHaveCards,

		// Actions
		initializeNewRound,
		distributeCardsToAllPlayers,
		validateCardDistribution,
		progressToSubmissionPhase,
		resetRoundState,

		// Computed values
		canStartRound,
		canDistributeCards,
		canProgressToSubmission,
	};
}
