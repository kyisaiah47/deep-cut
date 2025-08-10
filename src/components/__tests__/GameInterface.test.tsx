import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameInterface } from "../GameInterface";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "@/hooks/useGameActions";
import { useTimerManagement } from "@/hooks/useTimerManagement";
import { GAME_PHASES } from "@/lib/constants";

// Mock dependencies
jest.mock("@/contexts/GameContext");
jest.mock("@/hooks/useGameActions");
jest.mock("@/hooks/useTimerManagement");

const mockUseGame = useGame as jest.MockedFunction<typeof useGame>;
const mockUseGameActions = useGameActions as jest.MockedFunction<
	typeof useGameActions
>;
const mockUseTimerManagement = useTimerManagement as jest.MockedFunction<
	typeof useTimerManagement
>;

describe("GameInterface", () => {
	const mockGameState = {
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

	const mockPlayers = [
		{
			id: "player-1",
			game_id: "game-1",
			name: "Host Player",
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

	const mockCurrentPlayer = mockPlayers[0];

	const mockGameActions = {
		startGame: jest.fn(),
		startNewRound: jest.fn(),
		transitionToNextPhase: jest.fn(),
		transitionToPhase: jest.fn(),
		submitCards: jest.fn(),
		submitVote: jest.fn(),
		voteForSubmission: jest.fn(),
		updateGameSettings: jest.fn(),
		kickPlayer: jest.fn(),
		leaveGame: jest.fn(),
		reconnectToGame: jest.fn(),
		isRoundInProgress: false,
		canStartNewRound: true,
		roundPhase: null,
	};

	const mockTimerState = {
		timeRemaining: 0,
		isActive: false,
		isPaused: false,
		phase: null,
		startedAt: null,
		duration: 0,
		startTimer: jest.fn(),
		pauseTimer: jest.fn(),
		resumeTimer: jest.fn(),
		stopTimer: jest.fn(),
		syncTimer: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseGame.mockReturnValue({
			gameState: mockGameState,
			players: mockPlayers,
			submissions: [],
			votes: [],
			currentPlayer: mockCurrentPlayer,
			isHost: true,
			currentRoundCards: [],
			isConnected: true,
			connectedPlayers: mockPlayers,
			updateGamePhase: jest.fn(),
			refetchGameState: jest.fn(),
			broadcastEvent: jest.fn(),
		});

		mockUseGameActions.mockReturnValue(mockGameActions);
		mockUseTimerManagement.mockReturnValue(mockTimerState);
	});

	describe("Lobby Phase", () => {
		it("should render lobby interface", () => {
			render(<GameInterface />);

			expect(screen.getByText("Game Lobby")).toBeInTheDocument();
			expect(screen.getByText("Room Code: ABC123")).toBeInTheDocument();
			expect(screen.getByText("Host Player")).toBeInTheDocument();
			expect(screen.getByText("Player 2")).toBeInTheDocument();
		});

		it("should show start game button for host", () => {
			render(<GameInterface />);

			expect(screen.getByText("Start Game")).toBeInTheDocument();
		});

		it("should not show start game button for non-host", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isHost: false,
				currentPlayer: mockPlayers[1],
			});

			render(<GameInterface />);

			expect(screen.queryByText("Start Game")).not.toBeInTheDocument();
		});

		it("should call startGame when start button clicked", async () => {
			render(<GameInterface />);

			const startButton = screen.getByText("Start Game");
			fireEvent.click(startButton);

			await waitFor(() => {
				expect(mockGameActions.startGame).toHaveBeenCalled();
			});
		});

		it("should show game settings panel for host", () => {
			render(<GameInterface />);

			expect(screen.getByText("Game Settings")).toBeInTheDocument();
		});

		it("should show waiting message for non-host", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isHost: false,
				currentPlayer: mockPlayers[1],
			});

			render(<GameInterface />);

			expect(
				screen.getByText("Waiting for host to start the game...")
			).toBeInTheDocument();
		});
	});

	describe("Distribution Phase", () => {
		beforeEach(() => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.DISTRIBUTION },
			});
		});

		it("should render distribution interface", () => {
			render(<GameInterface />);

			expect(screen.getByText("Distributing Cards...")).toBeInTheDocument();
			expect(
				screen.getByText(
					"Please wait while cards are being generated and distributed."
				)
			).toBeInTheDocument();
		});

		it("should show loading spinner during distribution", () => {
			render(<GameInterface />);

			expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
		});

		it("should show round information", () => {
			render(<GameInterface />);

			expect(screen.getByText("Round 1")).toBeInTheDocument();
		});
	});

	describe("Submission Phase", () => {
		const mockCards = [
			{
				id: "prompt-1",
				game_id: "game-1",
				round_number: 1,
				type: "prompt" as const,
				text: "Test prompt card",
				created_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "response-1",
				game_id: "game-1",
				round_number: 1,
				type: "response" as const,
				text: "Test response 1",
				created_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "response-2",
				game_id: "game-1",
				round_number: 1,
				type: "response" as const,
				text: "Test response 2",
				created_at: "2023-01-01T00:00:00Z",
			},
		];

		beforeEach(() => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
				currentRoundCards: mockCards,
			});

			mockUseTimerManagement.mockReturnValue({
				...mockTimerState,
				timeRemaining: 45,
				isActive: true,
				phase: GAME_PHASES.SUBMISSION,
				duration: 60,
			});
		});

		it("should render submission interface", () => {
			render(<GameInterface />);

			expect(screen.getByText("Submit Your Cards")).toBeInTheDocument();
			expect(screen.getByText("Test prompt card")).toBeInTheDocument();
			expect(screen.getByText("Test response 1")).toBeInTheDocument();
			expect(screen.getByText("Test response 2")).toBeInTheDocument();
		});

		it("should show timer during submission phase", () => {
			render(<GameInterface />);

			expect(screen.getByText("0:45")).toBeInTheDocument();
		});

		it("should allow card selection", () => {
			render(<GameInterface />);

			const responseCard = screen.getByText("Test response 1");
			fireEvent.click(responseCard);

			expect(responseCard.closest("div")).toHaveClass("selected");
		});

		it("should enable submit button when cards selected", () => {
			render(<GameInterface />);

			const responseCard = screen.getByText("Test response 1");
			fireEvent.click(responseCard);

			const submitButton = screen.getByText("Submit Cards");
			expect(submitButton).not.toBeDisabled();
		});

		it("should call submitCards when submit button clicked", async () => {
			render(<GameInterface />);

			const responseCard = screen.getByText("Test response 1");
			fireEvent.click(responseCard);

			const submitButton = screen.getByText("Submit Cards");
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(mockGameActions.submitCards).toHaveBeenCalledWith("prompt-1", [
					"response-1",
				]);
			});
		});

		it("should show submission status for other players", () => {
			const mockSubmissions = [
				{
					id: "submission-1",
					game_id: "game-1",
					player_id: "player-2",
					round_number: 1,
					prompt_card_id: "prompt-1",
					response_cards: [],
					votes: 0,
					submitted_at: "2023-01-01T00:00:00Z",
				},
			];

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
				currentRoundCards: mockCards,
				submissions: mockSubmissions,
			});

			render(<GameInterface />);

			expect(screen.getByText("Player 2: ✓ Submitted")).toBeInTheDocument();
			expect(screen.getByText("Host Player: ⏳ Waiting")).toBeInTheDocument();
		});
	});

	describe("Voting Phase", () => {
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
				player_id: "player-1",
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

		beforeEach(() => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.VOTING },
				submissions: mockSubmissions,
			});

			mockUseTimerManagement.mockReturnValue({
				...mockTimerState,
				timeRemaining: 25,
				isActive: true,
				phase: GAME_PHASES.VOTING,
				duration: 30,
			});
		});

		it("should render voting interface", () => {
			render(<GameInterface />);

			expect(screen.getByText("Vote for the Funniest")).toBeInTheDocument();
			expect(screen.getByText("Funny response 1")).toBeInTheDocument();
			// Should not show own submission
			expect(screen.queryByText("Funny response 2")).not.toBeInTheDocument();
		});

		it("should show voting timer", () => {
			render(<GameInterface />);

			expect(screen.getByText("0:25")).toBeInTheDocument();
		});

		it("should allow voting on submissions", () => {
			render(<GameInterface />);

			const submission = screen.getByText("Funny response 1").closest("div");
			fireEvent.click(submission!);

			expect(submission).toHaveClass("selected");
		});

		it("should call submitVote when vote button clicked", async () => {
			render(<GameInterface />);

			const submission = screen.getByText("Funny response 1").closest("div");
			fireEvent.click(submission!);

			const voteButton = screen.getByText("Submit Vote");
			fireEvent.click(voteButton);

			await waitFor(() => {
				expect(mockGameActions.submitVote).toHaveBeenCalledWith("submission-1");
			});
		});

		it("should show voting progress", () => {
			render(<GameInterface />);

			expect(screen.getByText("Voting Progress")).toBeInTheDocument();
			expect(screen.getByText("0/1 votes")).toBeInTheDocument();
		});
	});

	describe("Results Phase", () => {
		const mockSubmissionsWithVotes = [
			{
				id: "submission-1",
				game_id: "game-1",
				player_id: "player-2",
				round_number: 1,
				prompt_card_id: "prompt-1",
				response_cards: [
					{
						id: "response-1",
						text: "Winning response",
						type: "response" as const,
					},
				],
				votes: 3,
				submitted_at: "2023-01-01T00:00:00Z",
			},
			{
				id: "submission-2",
				game_id: "game-1",
				player_id: "player-1",
				round_number: 1,
				prompt_card_id: "prompt-1",
				response_cards: [
					{ id: "response-2", text: "Second place", type: "response" as const },
				],
				votes: 1,
				submitted_at: "2023-01-01T00:00:00Z",
			},
		];

		beforeEach(() => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.RESULTS },
				submissions: mockSubmissionsWithVotes,
			});
		});

		it("should render results interface", () => {
			render(<GameInterface />);

			expect(screen.getByText("Round Results")).toBeInTheDocument();
			expect(screen.getByText("🏆 Winner")).toBeInTheDocument();
			expect(screen.getByText("Winning response")).toBeInTheDocument();
			expect(screen.getByText("Submitted by: Player 2")).toBeInTheDocument();
		});

		it("should show all submissions with vote counts", () => {
			render(<GameInterface />);

			expect(screen.getByText("3 votes")).toBeInTheDocument();
			expect(screen.getByText("1 vote")).toBeInTheDocument();
		});

		it("should show next round button for host", () => {
			render(<GameInterface />);

			expect(screen.getByText("Start Next Round")).toBeInTheDocument();
		});

		it("should call startNewRound when next round button clicked", async () => {
			render(<GameInterface />);

			const nextRoundButton = screen.getByText("Start Next Round");
			fireEvent.click(nextRoundButton);

			await waitFor(() => {
				expect(mockGameActions.startNewRound).toHaveBeenCalled();
			});
		});

		it("should show waiting message for non-host", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.RESULTS },
				submissions: mockSubmissionsWithVotes,
				isHost: false,
				currentPlayer: mockPlayers[1],
			});

			render(<GameInterface />);

			expect(
				screen.getByText("Waiting for host to start next round...")
			).toBeInTheDocument();
		});
	});

	describe("Error Handling", () => {
		it("should show error message when game state is null", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: null,
			});

			render(<GameInterface />);

			expect(screen.getByText("Game not found")).toBeInTheDocument();
		});

		it("should show error message when current player is null", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				currentPlayer: null,
			});

			render(<GameInterface />);

			expect(screen.getByText("Player not found")).toBeInTheDocument();
		});

		it("should show connection error when not connected", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isConnected: false,
			});

			render(<GameInterface />);

			expect(screen.getByText("Connection Lost")).toBeInTheDocument();
			expect(screen.getByText("Reconnect")).toBeInTheDocument();
		});

		it("should call reconnectToGame when reconnect button clicked", async () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				isConnected: false,
			});

			render(<GameInterface />);

			const reconnectButton = screen.getByText("Reconnect");
			fireEvent.click(reconnectButton);

			await waitFor(() => {
				expect(mockGameActions.reconnectToGame).toHaveBeenCalled();
			});
		});
	});

	describe("Responsive Design", () => {
		it("should adapt layout for mobile", () => {
			// Mock mobile viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 375,
			});

			render(<GameInterface />);

			const gameContainer = screen.getByTestId("game-interface");
			expect(gameContainer).toHaveClass("mobile-layout");
		});

		it("should show mobile-specific UI elements", () => {
			// Mock mobile viewport
			Object.defineProperty(window, "innerWidth", {
				writable: true,
				configurable: true,
				value: 375,
			});

			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
				currentRoundCards: [
					{
						id: "response-1",
						game_id: "game-1",
						round_number: 1,
						type: "response" as const,
						text: "Test response",
						created_at: "2023-01-01T00:00:00Z",
					},
				],
			});

			render(<GameInterface />);

			expect(
				screen.getByText("💡 Tap cards to select them")
			).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have proper ARIA labels", () => {
			render(<GameInterface />);

			expect(screen.getByRole("main")).toHaveAttribute(
				"aria-label",
				"Game interface"
			);
		});

		it("should support keyboard navigation", () => {
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
				currentRoundCards: [
					{
						id: "response-1",
						game_id: "game-1",
						round_number: 1,
						type: "response" as const,
						text: "Test response",
						created_at: "2023-01-01T00:00:00Z",
					},
				],
			});

			render(<GameInterface />);

			const responseCard = screen.getByRole("button", {
				name: /select card: test response/i,
			});

			// Test keyboard interaction
			fireEvent.keyDown(responseCard, { key: "Enter" });
			expect(responseCard).toHaveAttribute("aria-pressed", "true");
		});

		it("should announce phase changes to screen readers", () => {
			const { rerender } = render(<GameInterface />);

			// Change phase
			mockUseGame.mockReturnValue({
				...mockUseGame(),
				gameState: { ...mockGameState, phase: GAME_PHASES.SUBMISSION },
			});

			rerender(<GameInterface />);

			expect(screen.getByRole("status")).toHaveTextContent(
				"Game phase changed to submission"
			);
		});
	});
});
