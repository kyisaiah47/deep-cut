import { renderHook, act, waitFor } from "@testing-library/react";
import { useScoringManagement } from "../useScoringManagement";
import { useGame } from "@/contexts/GameContext";
import { supabase } from "@/lib/supabase";
import { GameState, Player, Submission, Vote } from "@/types/game";
import { GAME_PHASES } from "@/lib/constants";

// Mock dependencies
jest.mock("@/contexts/GameContext");
jest.mock("@/lib/supabase");

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe("useScoringManagement", () => {
	const mockGameState: GameState = {
		id: "game-1",
		room_code: "ABC123",
		phase: GAME_PHASES.VOTING,
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
			name: "Alice",
			score: 2,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "player-2",
			game_id: "game-1",
			name: "Bob",
			score: 1,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "player-3",
			game_id: "game-1",
			name: "Charlie",
			score: 0,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
	];

	const mockSubmissions: Submission[] = [
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

	const mockVotes: Vote[] = [
		{
			id: "vote-1",
			game_id: "game-1",
			player_id: "player-3",
			submission_id: "sub-1",
			round_number: 1,
			voted_at: "2023-01-01T00:00:00Z",
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseGame.mockReturnValue({
			gameState: mockGameState,
			players: mockPlayers,
			submissions: mockSubmissions,
			votes: mockVotes,
			currentPlayer: mockPlayers[0],
			isHost: true,
			isConnected: true,
			currentRoundCards: [],
			connectedPlayers: mockPlayers,
			updateGamePhase: jest.fn(),
			refetchGameState: jest.fn(),
			broadcastEvent: jest.fn(),
		});

		// Mock Supabase responses
		mockSupabase.from = jest.fn().mockReturnValue({
			update: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({ error: null }),
				}),
			}),
			select: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					order: jest.fn().mockResolvedValue({
						data: mockPlayers,
						error: null,
					}),
				}),
			}),
		});
	});

	it("should calculate round winners correctly", async () => {
		const { result } = renderHook(() => useScoringManagement());

		await act(async () => {
			const roundResult = await result.current.calculateRoundWinners();

			expect(roundResult.winners).toHaveLength(1);
			expect(roundResult.winners[0].id).toBe("player-1");
			expect(roundResult.maxVotes).toBe(3);
			expect(roundResult.hasTie).toBe(false);
		});
	});

	it("should handle tie situations correctly", async () => {
		// Mock submissions with tied votes
		const tiedSubmissions = [
			{ ...mockSubmissions[0], votes: 2 },
			{ ...mockSubmissions[1], votes: 2 },
		];

		mockUseGame.mockReturnValue({
			...mockUseGame(),
			submissions: tiedSubmissions,
		});

		const { result } = renderHook(() => useScoringManagement());

		await act(async () => {
			const roundResult = await result.current.calculateRoundWinners();

			expect(roundResult.winners).toHaveLength(2);
			expect(roundResult.hasTie).toBe(true);
			expect(roundResult.maxVotes).toBe(2);
		});
	});

	it("should award points to winners", async () => {
		const { result } = renderHook(() => useScoringManagement());

		await act(async () => {
			const winners = [mockPlayers[0]];
			const scoreUpdates = await result.current.awardPointsToWinners(winners);

			expect(scoreUpdates).toHaveLength(1);
			expect(scoreUpdates[0].playerId).toBe("player-1");
			expect(scoreUpdates[0].pointsAwarded).toBe(1);
			expect(scoreUpdates[0].newScore).toBe(3);
		});

		expect(mockSupabase.from).toHaveBeenCalledWith("players");
	});

	it("should detect game end correctly", async () => {
		// Mock player with target score reached
		const playersWithWinner = [
			{ ...mockPlayers[0], score: 7 },
			...mockPlayers.slice(1),
		];

		mockUseGame.mockReturnValue({
			...mockUseGame(),
			players: playersWithWinner,
		});

		const { result } = renderHook(() => useScoringManagement());

		expect(result.current.shouldEndGame).toBe(true);
		expect(result.current.gameWinners).toHaveLength(1);
		expect(result.current.gameWinners[0].id).toBe("player-1");
	});

	it("should process round end correctly", async () => {
		const onRoundComplete = jest.fn();
		const { result } = renderHook(() =>
			useScoringManagement({ onRoundComplete })
		);

		await act(async () => {
			await result.current.processRoundEnd();
		});

		expect(onRoundComplete).toHaveBeenCalledWith(
			expect.objectContaining({
				roundNumber: 1,
				winners: expect.arrayContaining([
					expect.objectContaining({ id: "player-1" }),
				]),
			})
		);
	});

	it("should finalize game correctly", async () => {
		const onGameComplete = jest.fn();
		const { result } = renderHook(() =>
			useScoringManagement({ onGameComplete })
		);

		await act(async () => {
			const gameResult = await result.current.finalizeGame();

			expect(gameResult.finalWinners).toBeDefined();
			expect(gameResult.finalRankings).toBeDefined();
			expect(gameResult.totalRounds).toBe(0); // current_round - 1
		});

		expect(onGameComplete).toHaveBeenCalled();
		expect(mockSupabase.from).toHaveBeenCalledWith("games");
	});

	it("should reset game correctly", async () => {
		const { result } = renderHook(() => useScoringManagement());

		await act(async () => {
			await result.current.resetGame();
		});

		expect(mockSupabase.from).toHaveBeenCalledWith("players");
		expect(mockSupabase.from).toHaveBeenCalledWith("games");
	});

	it("should provide correct player rankings", () => {
		const { result } = renderHook(() => useScoringManagement());

		const rankings = result.current.playerRankings;

		expect(rankings[0].id).toBe("player-1"); // Highest score (2)
		expect(rankings[1].id).toBe("player-2"); // Second highest (1)
		expect(rankings[2].id).toBe("player-3"); // Lowest score (0)
	});

	it("should handle errors gracefully", async () => {
		const onError = jest.fn();

		// Mock Supabase error
		mockSupabase.from = jest.fn().mockReturnValue({
			update: jest.fn().mockReturnValue({
				eq: jest.fn().mockReturnValue({
					eq: jest.fn().mockResolvedValue({
						error: { message: "Database error" },
					}),
				}),
			}),
		});

		const { result } = renderHook(() => useScoringManagement({ onError }));

		await act(async () => {
			try {
				await result.current.awardPointsToWinners([mockPlayers[0]]);
			} catch (error) {
				// Expected to throw
			}
		});

		expect(onError).toHaveBeenCalled();
	});
});
