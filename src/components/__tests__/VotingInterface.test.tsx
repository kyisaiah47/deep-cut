import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VotingInterface } from "../VotingInterface";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "@/hooks/useGameActions";
import { GAME_PHASES } from "@/lib/constants";

// Mock the hooks
jest.mock("@/contexts/GameContext");
jest.mock("@/hooks/useGameActions");

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;
const mockUseGameActions = useGameActions as jest.MockedFunction<
	typeof useGameActions
>;

describe("VotingInterface", () => {
	const mockSubmitVote = jest.fn();

	const mockGameState = {
		id: "game-1",
		room_code: "ABC123",
		phase: GAME_PHASES.VOTING as const,
		current_round: 1,
		target_score: 7,
		max_players: 8,
		submission_timer: 60,
		voting_timer: 30,
		host_id: "host-1",
		created_at: "2023-01-01T00:00:00Z",
		updated_at: "2023-01-01T00:00:00Z",
	};

	const mockCurrentPlayer = {
		id: "player-1",
		game_id: "game-1",
		name: "Test Player",
		score: 0,
		is_connected: true,
		joined_at: "2023-01-01T00:00:00Z",
	};

	const mockPlayers = [
		mockCurrentPlayer,
		{
			id: "player-2",
			game_id: "game-1",
			name: "Player 2",
			score: 0,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "player-3",
			game_id: "game-1",
			name: "Player 3",
			score: 0,
			is_connected: true,
			joined_at: "2023-01-01T00:00:00Z",
		},
	];

	const mockSubmissions = [
		{
			id: "submission-1",
			game_id: "game-1",
			player_id: "player-2",
			round_number: 1,
			prompt_card_id: "prompt-1",
			response_cards: [
				{
					id: "response-1",
					text: "Funny response 1",
					type: "response" as const,
				},
			],
			votes: 0,
			submitted_at: "2023-01-01T00:00:00Z",
		},
		{
			id: "submission-2",
			game_id: "game-1",
			player_id: "player-3",
			round_number: 1,
			prompt_card_id: "prompt-1",
			response_cards: [
				{
					id: "response-2",
					text: "Funny response 2",
					type: "response" as const,
				},
			],
			votes: 0,
			submitted_at: "2023-01-01T00:00:00Z",
		},
	];

	const mockCurrentRoundCards = [
		{
			id: "prompt-1",
			game_id: "game-1",
			round_number: 1,
			type: "prompt" as const,
			text: "Test prompt card",
			created_at: "2023-01-01T00:00:00Z",
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseGame.mockReturnValue({
			gameState: mockGameState,
			currentPlayer: mockCurrentPlayer,
			submissions: mockSubmissions,
			votes: [],
			players: mockPlayers,
			currentRoundCards: mockCurrentRoundCards,
			// Add other required properties with default values
			isHost: false,
			updateGamePhase: jest.fn(),
			refetchGameState: jest.fn(),
			broadcastEvent: jest.fn(),
		} as any);

		mockUseGameActions.mockReturnValue({
			submitVote: mockSubmitVote,
			// Add other required properties with default values
			startGame: jest.fn(),
			startNewRound: jest.fn(),
			transitionToNextPhase: jest.fn(),
			transitionToPhase: jest.fn(),
			submitCards: jest.fn(),
			voteForSubmission: jest.fn(),
			updateGameSettings: jest.fn(),
			kickPlayer: jest.fn(),
			leaveGame: jest.fn(),
			reconnectToGame: jest.fn(),
			isRoundInProgress: false,
			canStartNewRound: false,
			roundPhase: null,
		});
	});

	it("displays all submissions anonymously during voting phase", () => {
		render(<VotingInterface />);

		expect(screen.getByText("Vote for the Funniest")).toBeInTheDocument();
		expect(screen.getByText("Test prompt card")).toBeInTheDocument();
		expect(screen.getByText("Funny response 1")).toBeInTheDocument();
		expect(screen.getByText("Funny response 2")).toBeInTheDocument();
	});

	it("allows player to select a submission", () => {
		render(<VotingInterface />);

		const firstSubmission = screen.getByText("Funny response 1").closest("div");
		fireEvent.click(firstSubmission!);

		// Should show selection indicator
		expect(screen.getByText("✓")).toBeInTheDocument();
	});

	it("prevents voting for own submission", () => {
		// Mock submissions where current player has submitted
		const submissionsWithOwnSubmission = [
			...mockSubmissions,
			{
				id: "submission-3",
				game_id: "game-1",
				player_id: "player-1", // Current player's submission
				round_number: 1,
				prompt_card_id: "prompt-1",
				response_cards: [
					{ id: "response-3", text: "Own response", type: "response" as const },
				],
				votes: 0,
				submitted_at: "2023-01-01T00:00:00Z",
			},
		];

		mockUseGame.mockReturnValue({
			...mockUseGame(),
			submissions: submissionsWithOwnSubmission,
		} as any);

		render(<VotingInterface />);

		// Should not show own submission
		expect(screen.queryByText("Own response")).not.toBeInTheDocument();
		// Should still show other submissions
		expect(screen.getByText("Funny response 1")).toBeInTheDocument();
		expect(screen.getByText("Funny response 2")).toBeInTheDocument();
	});

	it("submits vote when button is clicked", async () => {
		render(<VotingInterface />);

		// Select a submission
		const firstSubmission = screen.getByText("Funny response 1").closest("div");
		fireEvent.click(firstSubmission!);

		// Click submit vote button
		const submitButton = screen.getByText("Submit Vote");
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockSubmitVote).toHaveBeenCalledWith("submission-1");
		});
	});

	it("shows voting progress indicator", () => {
		render(<VotingInterface />);

		expect(screen.getByText("Voting Progress")).toBeInTheDocument();
		expect(screen.getByText("0/1 votes")).toBeInTheDocument(); // 1 eligible voter (current player)
	});

	it("displays winner indicator after voting ends", () => {
		// Mock completed voting state
		const submissionsWithVotes = mockSubmissions.map((sub, index) => ({
			...sub,
			votes: index === 0 ? 2 : 1, // First submission wins
		}));

		const mockVotes = [
			{
				id: "vote-1",
				game_id: "game-1",
				player_id: "player-1",
				submission_id: "submission-1",
				round_number: 1,
				voted_at: "2023-01-01T00:00:00Z",
			},
		];

		mockUseGame.mockReturnValue({
			...mockUseGame(),
			submissions: submissionsWithVotes,
			votes: mockVotes,
		} as any);

		render(<VotingInterface />);

		// Should show winner indicator
		expect(screen.getByText("🏆 Winner")).toBeInTheDocument();
		// Should reveal player names
		expect(screen.getByText("Submitted by: Player 2")).toBeInTheDocument();
	});

	it("handles tie-breaking by showing multiple winners", () => {
		// Mock tie situation
		const submissionsWithTie = mockSubmissions.map((sub) => ({
			...sub,
			votes: 1, // Both submissions have same votes
		}));

		mockUseGame.mockReturnValue({
			...mockUseGame(),
			submissions: submissionsWithTie,
			votes: [
				{
					id: "vote-1",
					game_id: "game-1",
					player_id: "player-1",
					submission_id: "submission-1",
					round_number: 1,
					voted_at: "2023-01-01T00:00:00Z",
				},
			],
		} as any);

		render(<VotingInterface />);

		// Should show multiple winner indicators
		const winnerBadges = screen.getAllByText("🏆 Winner");
		expect(winnerBadges).toHaveLength(2);
	});

	it("shows voted state after player votes", () => {
		// Mock state where player has voted
		const mockVotes = [
			{
				id: "vote-1",
				game_id: "game-1",
				player_id: "player-1",
				submission_id: "submission-1",
				round_number: 1,
				voted_at: "2023-01-01T00:00:00Z",
			},
		];

		mockUseGame.mockReturnValue({
			...mockUseGame(),
			votes: mockVotes,
		} as any);

		render(<VotingInterface />);

		expect(
			screen.getByText("Vote Submitted Successfully!")
		).toBeInTheDocument();
		expect(screen.getByText("🗳️")).toBeInTheDocument();
	});

	it("does not render when not in voting phase", () => {
		mockUseGame.mockReturnValue({
			...mockUseGame(),
			gameState: {
				...mockGameState,
				phase: GAME_PHASES.SUBMISSION as const,
			},
		} as any);

		const { container } = render(<VotingInterface />);
		expect(container.firstChild).toBeNull();
	});

	it("shows waiting message when no submissions available", () => {
		mockUseGame.mockReturnValue({
			...mockUseGame(),
			submissions: [],
		} as any);

		render(<VotingInterface />);

		expect(
			screen.getByText("Waiting for submissions to be available for voting...")
		).toBeInTheDocument();
	});
});
