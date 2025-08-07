import { v4 as uuidv4 } from "uuid";

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
