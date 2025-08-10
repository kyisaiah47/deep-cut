import {
	generateRoomCode,
	isValidRoomCode,
	generatePlayerId,
	generateGameId,
	isValidGamePhase,
	getNextPhase,
	canTransitionToPhase,
	validateGameState,
	calculateGameProgress,
	getPhaseTimerDuration,
	determineVotingWinners,
	calculateVotingProgress,
	canPlayerPerformAction,
	DEFAULT_GAME_SETTINGS,
} from "../game-utils";
import { GameState, Player, Submission, Card } from "@/types/game";
import { GAME_PHASES, GAME_LIMITS } from "../constants";

describe("game-utils", () => {
	describe("generateRoomCode", () => {
		it("should generate a 6-character room code", () => {
			const code = generateRoomCode();
			expect(code).toHaveLength(6);
			expect(code).toMatch(/^[A-Z0-9]{6}$/);
		});

		it("should generate unique codes", () => {
			const codes = new Set();
			for (let i = 0; i < 100; i++) {
				codes.add(generateRoomCode());
			}
			expect(codes.size).toBeGreaterThan(90); // Should be mostly unique
		});
	});

	describe("isValidRoomCode", () => {
		it("should validate correct room codes", () => {
			expect(isValidRoomCode("ABC123")).toBe(true);
			expect(isValidRoomCode("XYZ789")).toBe(true);
			expect(isValidRoomCode("000000")).toBe(true);
			expect(isValidRoomCode("ZZZZZZ")).toBe(true);
		});

		it("should reject invalid room codes", () => {
			expect(isValidRoomCode("abc123")).toBe(false); // lowercase
			expect(isValidRoomCode("ABC12")).toBe(false); // too short
			expect(isValidRoomCode("ABC1234")).toBe(false); // too long
			expect(isValidRoomCode("ABC-12")).toBe(false); // invalid character
			expect(isValidRoomCode("")).toBe(false); // empty
		});
	});

	describe("generatePlayerId and generateGameId", () => {
		it("should generate valid UUIDs", () => {
			const playerId = generatePlayerId();
			const gameId = generateGameId();

			expect(playerId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
			);
			expect(gameId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
			);
		});

		it("should generate unique IDs", () => {
			const ids = new Set();
			for (let i = 0; i < 100; i++) {
				ids.add(generatePlayerId());
				ids.add(generateGameId());
			}
			expect(ids.size).toBe(200); // All should be unique
		});
	});

	describe("isValidGamePhase", () => {
		it("should validate correct game phases", () => {
			expect(isValidGamePhase("lobby")).toBe(true);
			expect(isValidGamePhase("distribution")).toBe(true);
			expect(isValidGamePhase("submission")).toBe(true);
			expect(isValidGamePhase("voting")).toBe(true);
			expect(isValidGamePhase("results")).toBe(true);
		});

		it("should reject invalid game phases", () => {
			expect(isValidGamePhase("invalid")).toBe(false);
			expect(isValidGamePhase("")).toBe(false);
			expect(isValidGamePhase("LOBBY")).toBe(false); // case sensitive
		});
	});

	describe("getNextPhase", () => {
		it("should return correct next phases", () => {
			expect(getNextPhase("lobby")).toBe("distribution");
			expect(getNextPhase("distribution")).toBe("submission");
			expect(getNextPhase("submission")).toBe("voting");
			expect(getNextPhase("voting")).toBe("results");
			expect(getNextPhase("results")).toBe("distribution"); // cycles back
		});

		it("should handle invalid phases", () => {
			expect(getNextPhase("invalid")).toBe("distribution");
		});
	});

	describe("canTransitionToPhase", () => {
		const mockGameState: GameState = {
			id: "game-1",
			room_code: "ABC123",
			phase: GAME_PHASES.LOBBY,
			current_round: 1,
			target_score: 7,
			max_players: 8,
			submission_timer: 60,
			voting_timer: 30,
			host_id: "player-1",
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		const mockPlayers: Player[] = [
			{
				id: "player-1",
				game_id: "game-1",
				name: "Player 1",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "player-2",
				game_id: "game-1",
				name: "Player 2",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			},
		];

		it("should allow valid phase transitions", () => {
			const result = canTransitionToPhase(
				GAME_PHASES.LOBBY,
				GAME_PHASES.DISTRIBUTION,
				mockGameState,
				mockPlayers
			);
			expect(result.canTransition).toBe(true);
		});

		it("should reject transitions with insufficient players", () => {
			const singlePlayer = [mockPlayers[0]];
			const result = canTransitionToPhase(
				GAME_PHASES.LOBBY,
				GAME_PHASES.DISTRIBUTION,
				mockGameState,
				singlePlayer
			);
			expect(result.canTransition).toBe(false);
			expect(result.reason).toContain("Need at least");
		});

		it("should reject invalid phase transitions", () => {
			const result = canTransitionToPhase(
				GAME_PHASES.LOBBY,
				GAME_PHASES.VOTING,
				mockGameState,
				mockPlayers
			);
			expect(result.canTransition).toBe(false);
		});

		it("should check submission requirements for voting transition", () => {
			const gameInSubmission = {
				...mockGameState,
				phase: GAME_PHASES.SUBMISSION,
			};
			const submissions: Submission[] = [
				{
					id: "sub-1",
					game_id: "game-1",
					player_id: "player-1",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 0,
					submitted_at: "2023-01-01T00:00:00Z",
				},
			];

			// Not enough submissions
			let result = canTransitionToPhase(
				GAME_PHASES.SUBMISSION,
				GAME_PHASES.VOTING,
				gameInSubmission,
				mockPlayers,
				submissions
			);
			expect(result.canTransition).toBe(false);
			expect(result.reason).toContain("Waiting for");

			// Enough submissions
			submissions.push({
				id: "sub-2",
				game_id: "game-1",
				player_id: "player-2",
				round_number: 1,
				prompt_card_id: "prompt-1",
				response_cards: [],
				votes: 0,
				submitted_at: "2023-01-01T00:00:00Z",
			});

			result = canTransitionToPhase(
				GAME_PHASES.SUBMISSION,
				GAME_PHASES.VOTING,
				gameInSubmission,
				mockPlayers,
				submissions
			);
			expect(result.canTransition).toBe(true);
		});
	});

	describe("validateGameState", () => {
		const mockGameState: GameState = {
			id: "game-1",
			room_code: "ABC123",
			phase: GAME_PHASES.LOBBY,
			current_round: 1,
			target_score: 7,
			max_players: 8,
			submission_timer: 60,
			voting_timer: 30,
			host_id: "player-1",
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		const mockPlayers: Player[] = [
			{
				id: "player-1",
				game_id: "game-1",
				name: "Player 1",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			},
		];

		it("should validate correct game state", () => {
			const result = validateGameState(mockGameState, mockPlayers, [], []);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should detect missing identifiers", () => {
			const invalidState = { ...mockGameState, id: "" };
			const result = validateGameState(invalidState, mockPlayers, [], []);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Game missing required identifiers");
		});

		it("should detect invalid phase", () => {
			const invalidState = { ...mockGameState, phase: "invalid" as any };
			const result = validateGameState(invalidState, mockPlayers, [], []);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Invalid game phase");
		});

		it("should detect missing host", () => {
			const invalidState = { ...mockGameState, host_id: "nonexistent" };
			const result = validateGameState(invalidState, mockPlayers, [], []);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("Game host not found in players");
		});
	});

	describe("calculateGameProgress", () => {
		const mockGameState: GameState = {
			id: "game-1",
			room_code: "ABC123",
			phase: GAME_PHASES.RESULTS,
			current_round: 3,
			target_score: 5,
			max_players: 8,
			submission_timer: 60,
			voting_timer: 30,
			host_id: "player-1",
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		it("should detect game end when target score is reached", () => {
			const players: Player[] = [
				{
					id: "player-1",
					game_id: "game-1",
					name: "Winner",
					score: 5,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "player-2",
					game_id: "game-1",
					name: "Player 2",
					score: 3,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
			];

			const result = calculateGameProgress(mockGameState, players);
			expect(result.shouldEndGame).toBe(true);
			expect(result.winners).toHaveLength(1);
			expect(result.winners[0].id).toBe("player-1");
			expect(result.maxScore).toBe(5);
			expect(result.roundsPlayed).toBe(2);
		});

		it("should handle tied winners", () => {
			const players: Player[] = [
				{
					id: "player-1",
					game_id: "game-1",
					name: "Winner 1",
					score: 5,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "player-2",
					game_id: "game-1",
					name: "Winner 2",
					score: 5,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
			];

			const result = calculateGameProgress(mockGameState, players);
			expect(result.shouldEndGame).toBe(true);
			expect(result.winners).toHaveLength(2);
		});

		it("should not end game when target score not reached", () => {
			const players: Player[] = [
				{
					id: "player-1",
					game_id: "game-1",
					name: "Player 1",
					score: 3,
					is_connected: true,
					joined_at: "2023-01-01T00:00:00Z",
				},
			];

			const result = calculateGameProgress(mockGameState, players);
			expect(result.shouldEndGame).toBe(false);
			expect(result.winners).toHaveLength(0);
		});
	});

	describe("getPhaseTimerDuration", () => {
		const mockGameState: GameState = {
			id: "game-1",
			room_code: "ABC123",
			phase: GAME_PHASES.SUBMISSION,
			current_round: 1,
			target_score: 7,
			max_players: 8,
			submission_timer: 60,
			voting_timer: 30,
			host_id: "player-1",
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		it("should return correct timer durations", () => {
			expect(getPhaseTimerDuration(GAME_PHASES.SUBMISSION, mockGameState)).toBe(
				60
			);
			expect(getPhaseTimerDuration(GAME_PHASES.VOTING, mockGameState)).toBe(30);
		});

		it("should return null for phases without timers", () => {
			expect(
				getPhaseTimerDuration(GAME_PHASES.LOBBY, mockGameState)
			).toBeNull();
			expect(
				getPhaseTimerDuration(GAME_PHASES.DISTRIBUTION, mockGameState)
			).toBeNull();
			expect(
				getPhaseTimerDuration(GAME_PHASES.RESULTS, mockGameState)
			).toBeNull();
		});
	});

	describe("determineVotingWinners", () => {
		it("should determine single winner", () => {
			const submissions: Submission[] = [
				{
					id: "sub-1",
					game_id: "game-1",
					player_id: "player-1",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 3,
					submitted_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "sub-2",
					game_id: "game-1",
					player_id: "player-2",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 1,
					submitted_at: "2023-01-01T00:00:00Z",
				},
			];

			const result = determineVotingWinners(submissions);
			expect(result.winners).toHaveLength(1);
			expect(result.winners[0].id).toBe("sub-1");
			expect(result.maxVotes).toBe(3);
			expect(result.hasTie).toBe(false);
		});

		it("should handle ties", () => {
			const submissions: Submission[] = [
				{
					id: "sub-1",
					game_id: "game-1",
					player_id: "player-1",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 2,
					submitted_at: "2023-01-01T00:00:00Z",
				},
				{
					id: "sub-2",
					game_id: "game-1",
					player_id: "player-2",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 2,
					submitted_at: "2023-01-01T00:00:00Z",
				},
			];

			const result = determineVotingWinners(submissions);
			expect(result.winners).toHaveLength(2);
			expect(result.maxVotes).toBe(2);
			expect(result.hasTie).toBe(true);
		});

		it("should handle empty submissions", () => {
			const result = determineVotingWinners([]);
			expect(result.winners).toHaveLength(0);
			expect(result.maxVotes).toBe(0);
			expect(result.hasTie).toBe(false);
		});
	});

	describe("canPlayerPerformAction", () => {
		const mockGameState: GameState = {
			id: "game-1",
			room_code: "ABC123",
			phase: GAME_PHASES.SUBMISSION,
			current_round: 1,
			target_score: 7,
			max_players: 8,
			submission_timer: 60,
			voting_timer: 30,
			host_id: "player-1",
			created_at: "2023-01-01T00:00:00Z",
			updated_at: "2023-01-01T00:00:00Z",
		};

		const mockPlayers: Player[] = [
			{
				id: "player-1",
				game_id: "game-1",
				name: "Host",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "player-2",
				game_id: "game-1",
				name: "Player 2",
				score: 0,
				is_connected: true,
				joined_at: "2023-01-01T00:00:00Z",
			},
		];

		it("should allow valid actions", () => {
			const result = canPlayerPerformAction(
				"submit",
				"player-1",
				mockGameState,
				mockPlayers
			);
			expect(result.canPerform).toBe(true);
		});

		it("should reject actions for nonexistent players", () => {
			const result = canPlayerPerformAction(
				"submit",
				"nonexistent",
				mockGameState,
				mockPlayers
			);
			expect(result.canPerform).toBe(false);
			expect(result.reason).toBe("Player not found");
		});

		it("should reject actions for disconnected players", () => {
			const disconnectedPlayers = [
				{ ...mockPlayers[0], is_connected: false },
				mockPlayers[1],
			];
			const result = canPlayerPerformAction(
				"submit",
				"player-1",
				mockGameState,
				disconnectedPlayers
			);
			expect(result.canPerform).toBe(false);
			expect(result.reason).toBe("Player not connected");
		});

		it("should enforce host-only actions", () => {
			const lobbyState = { ...mockGameState, phase: GAME_PHASES.LOBBY };

			// Host can start game
			let result = canPlayerPerformAction(
				"start_game",
				"player-1",
				lobbyState,
				mockPlayers
			);
			expect(result.canPerform).toBe(true);

			// Non-host cannot start game
			result = canPlayerPerformAction(
				"start_game",
				"player-2",
				lobbyState,
				mockPlayers
			);
			expect(result.canPerform).toBe(false);
			expect(result.reason).toBe("Only host can start game");
		});

		it("should check phase requirements", () => {
			// Can't submit in voting phase
			const votingState = { ...mockGameState, phase: GAME_PHASES.VOTING };
			const result = canPlayerPerformAction(
				"submit",
				"player-1",
				votingState,
				mockPlayers
			);
			expect(result.canPerform).toBe(false);
			expect(result.reason).toBe("Not in submission phase");
		});
	});

	describe("DEFAULT_GAME_SETTINGS", () => {
		it("should have correct default values", () => {
			expect(DEFAULT_GAME_SETTINGS.maxPlayers).toBe(8);
			expect(DEFAULT_GAME_SETTINGS.submissionTimer).toBe(60);
			expect(DEFAULT_GAME_SETTINGS.votingTimer).toBe(30);
			expect(DEFAULT_GAME_SETTINGS.targetScore).toBe(7);
		});
	});
});
