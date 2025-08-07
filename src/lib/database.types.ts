// Database types for Supabase integration
// These types should be generated from your Supabase schema

export interface Database {
	public: {
		Tables: {
			games: {
				Row: {
					id: string;
					room_code: string;
					phase: "lobby" | "distribution" | "submission" | "voting" | "results";
					current_round: number;
					target_score: number;
					max_players: number;
					submission_timer: number;
					voting_timer: number;
					host_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					room_code: string;
					phase?:
						| "lobby"
						| "distribution"
						| "submission"
						| "voting"
						| "results";
					current_round?: number;
					target_score?: number;
					max_players?: number;
					submission_timer?: number;
					voting_timer?: number;
					host_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					room_code?: string;
					phase?:
						| "lobby"
						| "distribution"
						| "submission"
						| "voting"
						| "results";
					current_round?: number;
					target_score?: number;
					max_players?: number;
					submission_timer?: number;
					voting_timer?: number;
					host_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			players: {
				Row: {
					id: string;
					game_id: string;
					name: string;
					score: number;
					is_connected: boolean;
					joined_at: string;
				};
				Insert: {
					id?: string;
					game_id: string;
					name: string;
					score?: number;
					is_connected?: boolean;
					joined_at?: string;
				};
				Update: {
					id?: string;
					game_id?: string;
					name?: string;
					score?: number;
					is_connected?: boolean;
					joined_at?: string;
				};
			};
			cards: {
				Row: {
					id: string;
					game_id: string;
					round_number: number;
					type: "prompt" | "response";
					text: string;
					player_id: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					game_id: string;
					round_number: number;
					type: "prompt" | "response";
					text: string;
					player_id?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					game_id?: string;
					round_number?: number;
					type?: "prompt" | "response";
					text?: string;
					player_id?: string | null;
					created_at?: string;
				};
			};
			submissions: {
				Row: {
					id: string;
					game_id: string;
					player_id: string;
					round_number: number;
					prompt_card_id: string;
					response_cards: Record<string, unknown>; // JSONB
					votes: number;
					submitted_at: string;
				};
				Insert: {
					id?: string;
					game_id: string;
					player_id: string;
					round_number: number;
					prompt_card_id: string;
					response_cards: Record<string, unknown>; // JSONB
					votes?: number;
					submitted_at?: string;
				};
				Update: {
					id?: string;
					game_id?: string;
					player_id?: string;
					round_number?: number;
					prompt_card_id?: string;
					response_cards?: Record<string, unknown>; // JSONB
					votes?: number;
					submitted_at?: string;
				};
			};
			votes: {
				Row: {
					id: string;
					game_id: string;
					player_id: string;
					submission_id: string;
					round_number: number;
					voted_at: string;
				};
				Insert: {
					id?: string;
					game_id: string;
					player_id: string;
					submission_id: string;
					round_number: number;
					voted_at?: string;
				};
				Update: {
					id?: string;
					game_id?: string;
					player_id?: string;
					submission_id?: string;
					round_number?: number;
					voted_at?: string;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
	};
}
