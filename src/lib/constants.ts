// Application constants

export const GAME_PHASES = {
	LOBBY: "lobby",
	DISTRIBUTION: "distribution",
	SUBMISSION: "submission",
	VOTING: "voting",
	RESULTS: "results",
} as const;

export const CARD_TYPES = {
	PROMPT: "prompt",
	RESPONSE: "response",
} as const;

export const GAME_EVENTS = {
	PLAYER_JOINED: "player_joined",
	PLAYER_LEFT: "player_left",
	PHASE_CHANGE: "phase_change",
	CARDS_DISTRIBUTED: "cards_distributed",
	SUBMISSION_RECEIVED: "submission_received",
	VOTING_COMPLETE: "voting_complete",
} as const;

export const ERROR_TYPES = {
	CONNECTION: "connection",
	GAME_STATE: "game_state",
	AI_GENERATION: "ai_generation",
	UNKNOWN: "unknown",
} as const;

export const TIMER_DURATIONS = {
	DEFAULT_SUBMISSION: 60, // seconds
	DEFAULT_VOTING: 30, // seconds
} as const;

export const GAME_LIMITS = {
	MIN_PLAYERS: 3,
	MAX_PLAYERS: 8,
	MIN_TARGET_SCORE: 3,
	MAX_TARGET_SCORE: 15,
	ROOM_CODE_LENGTH: 6,
	MAX_PLAYER_NAME_LENGTH: 50,
} as const;

export const ANIMATION_DURATIONS = {
	CARD_HOVER: 0.2,
	CARD_SELECT: 0.3,
	PHASE_TRANSITION: 0.5,
	STAGGER_DELAY: 0.1,
} as const;
