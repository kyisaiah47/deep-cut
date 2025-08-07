// Core game data structures based on design document

export interface Player {
	id: string;
	game_id: string;
	name: string;
	score: number;
	is_connected: boolean;
	joined_at: string;
}

export interface GameSettings {
	maxPlayers: number;
	submissionTimer: number;
	votingTimer: number;
	targetScore: number;
}

export interface GameState {
	id: string;
	room_code: string;
	phase: "lobby" | "distribution" | "submission" | "voting" | "results";
	current_round: number;
	target_score: number;
	max_players: number;
	submission_timer: number;
	voting_timer: number;
	host_id: string;
	created_at: string;
	updated_at: string;
}

export interface Card {
	id: string;
	game_id: string;
	round_number: number;
	type: "prompt" | "response";
	text: string;
	player_id?: string;
	created_at: string;
	isSelected?: boolean;
}

export interface Submission {
	id: string;
	game_id: string;
	player_id: string;
	round_number: number;
	prompt_card_id: string;
	response_cards: Card[];
	votes: number;
	submitted_at: string;
}

export interface Vote {
	id: string;
	game_id: string;
	player_id: string;
	submission_id: string;
	round_number: number;
	voted_at: string;
}

export interface GameEvent {
	type:
		| "player_joined"
		| "player_left"
		| "phase_change"
		| "cards_distributed"
		| "submission_received"
		| "voting_complete";
	gameId: string;
	data: Record<string, unknown>;
	timestamp: string;
}

// Component prop interfaces
export interface PlayerListProps {
	players: Player[];
	currentPlayerId: string;
}

export interface CardDisplayProps {
	cards: Card[];
	onCardSelect: (cardId: string) => void;
	selectable: boolean;
	animationDelay?: number;
}

export interface TimerProps {
	duration: number;
	onExpire: () => void;
	isActive: boolean;
}

export interface VotingInterfaceProps {
	submissions: Submission[];
	onVote: (submissionId: string) => void;
	hasVoted: boolean;
}

export interface GameRoomProps {
	roomCode: string;
	playerId: string;
}

// Error handling interfaces
export interface ErrorBoundaryState {
	hasError: boolean;
	errorType: "connection" | "game_state" | "ai_generation" | "unknown";
	retryCount: number;
}
