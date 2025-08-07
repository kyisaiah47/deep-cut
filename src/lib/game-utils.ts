import { v4 as uuidv4 } from "uuid";
import { GameState, Player, Submission, Card } from "@/types/game";
import { GAME_PHASES, GAME_LIMITS } from "./constants";

/**
 * Generate a unique 6-character room code
 */
export function generateRoomCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
	return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
	return uuidv4();
}

/**
 * Generate a unique game ID
 */
export function generateGameId(): string {
	return uuidv4();
}

/**
 * Check if a game phase is valid
 */
export function isValidGamePhase(
	phase: string
): phase is "lobby" | "distribution" | "submission" | "voting" | "results" {
	return ["lobby", "distribution", "submission", "voting", "results"].includes(
		phase
	);
}

/**
 * Get the next game phase
 */
export function getNextPhase(currentPhase: string): string {
	const phases = ["lobby", "distribution", "submission", "voting", "results"];
	const currentIndex = phases.indexOf(currentPhase);

	if (currentIndex === -1 || currentIndex === phases.length - 1) {
		return "distribution"; // After results, go back to distribution for next round
	}

	return phases[currentIndex + 1];
}

/**
 * Default game settings
 */
export const DEFAULT_GAME_SETTINGS = {
	maxPlayers: 8,
	submissionTimer: 60,
	votingTimer: 30,
	targetScore: 7,
} as const;

/**
 * Game Phase Transition and Validation Utilities
 */

/**
 * Check if game can transition to the next phase
 */
export function canTransitionToPhase(
	currentPhase: GameState["phase"],
	targetPhase: GameState["phase"],
	gameState: GameState,
	players: Player[],
	submissions?: Submission[]
): { canTransition: boolean; reason?: string } {
	// Can't transition to the same phase
	if (currentPhase === targetPhase) {
		return { canTransition: false, reason: "Already in target phase" };
	}

	// Check minimum players for game start
	const activePlayers = players.filter((p) => p.is_connected);
	if (activePlayers.length < GAME_LIMITS.MIN_PLAYERS) {
		return {
			canTransition: false,
			reason: `Need at least ${GAME_LIMITS.MIN_PLAYERS} players`,
		};
	}

	switch (targetPhase) {
		case GAME_PHASES.LOBBY:
			// Can always go back to lobby (game reset)
			return { canTransition: true };

		case GAME_PHASES.DISTRIBUTION:
			// Can transition from lobby (game start) or results (next round)
			if (
				currentPhase === GAME_PHASES.LOBBY ||
				currentPhase === GAME_PHASES.RESULTS
			) {
				return { canTransition: true };
			}
			return {
				canTransition: false,
				reason: "Invalid phase transition to distribution",
			};

		case GAME_PHASES.SUBMISSION:
			// Can only transition from distribution when cards are distributed
			if (currentPhase === GAME_PHASES.DISTRIBUTION) {
				return { canTransition: true };
			}
			return { canTransition: false, reason: "Must distribute cards first" };

		case GAME_PHASES.VOTING:
			// Can only transition from submission when all players have submitted
			if (currentPhase === GAME_PHASES.SUBMISSION) {
				const expectedSubmissions = activePlayers.length;
				const actualSubmissions =
					submissions?.filter((s) => s.round_number === gameState.current_round)
						.length || 0;

				if (actualSubmissions >= expectedSubmissions) {
					return { canTransition: true };
				}
				return {
					canTransition: false,
					reason: `Waiting for ${
						expectedSubmissions - actualSubmissions
					} more submissions`,
				};
			}
			return {
				canTransition: false,
				reason: "Must complete submissions first",
			};

		case GAME_PHASES.RESULTS:
			// Can only transition from voting when voting is complete
			if (currentPhase === GAME_PHASES.VOTING) {
				return { canTransition: true };
			}
			return { canTransition: false, reason: "Must complete voting first" };

		default:
			return { canTransition: false, reason: "Unknown target phase" };
	}
}

/**
 * Validate game state for consistency
 */
export function validateGameState(
	gameState: GameState,
	players: Player[],
	cards: Card[],
	_submissions: Submission[]
): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Validate basic game state
	if (!gameState.id || !gameState.room_code) {
		errors.push("Game missing required identifiers");
	}

	if (!isValidGamePhase(gameState.phase)) {
		errors.push("Invalid game phase");
	}

	if (gameState.current_round < 1) {
		errors.push("Invalid round number");
	}

	// Validate players
	const activePlayers = players.filter((p) => p.is_connected);
	if (
		activePlayers.length < GAME_LIMITS.MIN_PLAYERS &&
		gameState.phase !== GAME_PHASES.LOBBY
	) {
		errors.push("Not enough active players for current phase");
	}

	if (players.length > gameState.max_players) {
		errors.push("Too many players for game settings");
	}

	// Validate host exists
	const host = players.find((p) => p.id === gameState.host_id);
	if (!host) {
		errors.push("Game host not found in players");
	}

	// Phase-specific validations
	switch (gameState.phase) {
		case GAME_PHASES.SUBMISSION:
		case GAME_PHASES.VOTING:
		case GAME_PHASES.RESULTS:
			// Should have cards for current round
			const roundCards = cards.filter(
				(c) => c.round_number === gameState.current_round
			);
			if (roundCards.length === 0) {
				errors.push("No cards found for current round");
			}
			break;
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Calculate game progress and determine if game should end
 */
export function calculateGameProgress(
	gameState: GameState,
	players: Player[]
): {
	shouldEndGame: boolean;
	winners: Player[];
	maxScore: number;
	roundsPlayed: number;
} {
	const maxScore = Math.max(...players.map((p) => p.score), 0);
	const winners = players.filter(
		(p) => p.score === maxScore && p.score >= gameState.target_score
	);
	const shouldEndGame = winners.length > 0;
	const roundsPlayed = gameState.current_round - 1; // current_round is the next round to play

	return {
		shouldEndGame,
		winners,
		maxScore,
		roundsPlayed,
	};
}

/**
 * Get phase-specific timer duration
 */
export function getPhaseTimerDuration(
	phase: GameState["phase"],
	gameState: GameState
): number | null {
	switch (phase) {
		case GAME_PHASES.SUBMISSION:
			return gameState.submission_timer;
		case GAME_PHASES.VOTING:
			return gameState.voting_timer;
		default:
			return null; // No timer for other phases
	}
}

/**
 * Check if player can perform action in current phase
 */
export function canPlayerPerformAction(
	action: "submit" | "vote" | "start_game" | "change_settings",
	playerId: string,
	gameState: GameState,
	players: Player[],
	submissions?: Submission[]
): { canPerform: boolean; reason?: string } {
	const player = players.find((p) => p.id === playerId);
	if (!player) {
		return { canPerform: false, reason: "Player not found" };
	}

	if (!player.is_connected) {
		return { canPerform: false, reason: "Player not connected" };
	}

	const isHost = gameState.host_id === playerId;

	switch (action) {
		case "submit":
			if (gameState.phase !== GAME_PHASES.SUBMISSION) {
				return { canPerform: false, reason: "Not in submission phase" };
			}

			// Check if player already submitted
			const hasSubmitted = submissions?.some(
				(s) =>
					s.player_id === playerId && s.round_number === gameState.current_round
			);

			if (hasSubmitted) {
				return {
					canPerform: false,
					reason: "Already submitted for this round",
				};
			}

			return { canPerform: true };

		case "vote":
			if (gameState.phase !== GAME_PHASES.VOTING) {
				return { canPerform: false, reason: "Not in voting phase" };
			}
			return { canPerform: true };

		case "start_game":
			if (!isHost) {
				return { canPerform: false, reason: "Only host can start game" };
			}

			if (gameState.phase !== GAME_PHASES.LOBBY) {
				return { canPerform: false, reason: "Game already started" };
			}

			const activePlayers = players.filter((p) => p.is_connected);
			if (activePlayers.length < GAME_LIMITS.MIN_PLAYERS) {
				return {
					canPerform: false,
					reason: `Need at least ${GAME_LIMITS.MIN_PLAYERS} players`,
				};
			}

			return { canPerform: true };

		case "change_settings":
			if (!isHost) {
				return { canPerform: false, reason: "Only host can change settings" };
			}

			if (gameState.phase !== GAME_PHASES.LOBBY) {
				return {
					canPerform: false,
					reason: "Cannot change settings during game",
				};
			}

			return { canPerform: true };

		default:
			return { canPerform: false, reason: "Unknown action" };
	}
}
