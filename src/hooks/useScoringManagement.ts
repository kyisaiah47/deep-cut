import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useGame } from "@/contexts/GameContext";
import { GameState, Player, Submission, Vote } from "@/types/game";
import { GameError, GameStateError } from "@/lib/error-handling";
import {
	calculateGameProgress,
	determineVotingWinners,
} from "@/lib/game-utils";
import { GAME_PHASES } from "@/lib/constants";

interface RoundResult {
	roundNumber: number;
	winners: Player[];
	winningSubmissions: Submission[];
	maxVotes: number;
	hasTie: boolean;
	allSubmissions: Submission[];
}

interface GameResult {
	finalWinners: Player[];
	finalRankings: Player[];
	totalRounds: number;
	gameEndedAt: string;
}

interface ScoreUpdate {
	playerId: string;
	playerName: string;
	oldScore: number;
	newScore: number;
	pointsAwarded: number;
}

interface UseScoringManagementOptions {
	onRoundComplete?: (result: RoundResult) => void;
	onGameComplete?: (result: GameResult) => void;
	onScoreUpdate?: (updates: ScoreUpdate[]) => void;
	onError?: (error: GameError) => void;
}

interface ScoringManagementHook {
	// State
	isCalculatingScores: boolean;
	isProcessingRoundEnd: boolean;
	scoringError: GameError | null;
	lastRoundResult: RoundResult | null;
	gameResult: GameResult | null;

	// Actions
	calculateRoundWinners: () => Promise<RoundResult>;
	awardPointsToWinners: (winners: Player[]) => Promise<ScoreUpdate[]>;
	processRoundEnd: () => Promise<void>;
	checkGameEnd: () => Promise<boolean>;
	finalizeGame: () => Promise<GameResult>;
	resetGame: () => Promise<void>;

	// Computed values
	currentRoundWinners: Player[];
	gameWinners: Player[];
	shouldEndGame: boolean;
	playerRankings: Player[];
	roundsCompleted: number;
	canProcessRoundEnd: boolean;
}

export function useScoringManagement({
	onRoundComplete,
	onGameComplete,
	onScoreUpdate,
	onError,
}: UseScoringManagementOptions = {}): ScoringManagementHook {
	const { gameState, players, submissions } = useGame();

	// TODO: This should be moved to GameContext for better performance
	const [votes, setVotes] = useState<Vote[]>([]);

	// Fetch votes for current game
	useEffect(() => {
		if (!gameState) return;

		const fetchVotes = async () => {
			const { data, error } = await supabase
				.from("votes")
				.select("*")
				.eq("game_id", gameState.id);

			if (!error && data) {
				setVotes(data);
			}
		};

		fetchVotes();
	}, [gameState]);

	const [isCalculatingScores, setIsCalculatingScores] = useState(false);
	const [isProcessingRoundEnd, setIsProcessingRoundEnd] = useState(false);
	const [scoringError, setScoringError] = useState<GameError | null>(null);
	const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(
		null
	);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);

	const handleError = useCallback(
		(error: GameError) => {
			setScoringError(error);
			onError?.(error);
		},
		[onError]
	);

	// Calculate winners for the current round based on votes
	const calculateRoundWinners = useCallback(async (): Promise<RoundResult> => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		setIsCalculatingScores(true);
		setScoringError(null);

		try {
			// Get submissions for current round
			const currentRoundSubmissions = submissions.filter(
				(sub) => sub.round_number === gameState.current_round
			);

			if (currentRoundSubmissions.length === 0) {
				throw new GameStateError("No submissions found for current round");
			}

			// Determine voting winners
			const votingResult = determineVotingWinners(currentRoundSubmissions);

			// Get player data for winners
			const winnerPlayers = votingResult.winners
				.map((submission) =>
					players.find((player) => player.id === submission.player_id)
				)
				.filter((player): player is Player => player !== undefined);

			const roundResult: RoundResult = {
				roundNumber: gameState.current_round,
				winners: winnerPlayers,
				winningSubmissions: votingResult.winners,
				maxVotes: votingResult.maxVotes,
				hasTie: votingResult.hasTie,
				allSubmissions: currentRoundSubmissions,
			};

			setLastRoundResult(roundResult);
			return roundResult;
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to calculate round winners");
			handleError(gameError);
			throw gameError;
		} finally {
			setIsCalculatingScores(false);
		}
	}, [gameState, submissions, players, handleError]);

	// Award points to round winners
	const awardPointsToWinners = useCallback(
		async (winners: Player[]): Promise<ScoreUpdate[]> => {
			if (!gameState) {
				throw new GameStateError("Game state not available");
			}

			const scoreUpdates: ScoreUpdate[] = [];

			try {
				// Award 1 point to each winner
				for (const winner of winners) {
					const oldScore = winner.score;
					const newScore = oldScore + 1;
					const pointsAwarded = 1;

					// Update player score in database
					const { error: updateError } = await supabase
						.from("players")
						.update({ score: newScore })
						.eq("id", winner.id)
						.eq("game_id", gameState.id);

					if (updateError) {
						throw new GameStateError(
							`Failed to update score for ${winner.name}: ${updateError.message}`
						);
					}

					scoreUpdates.push({
						playerId: winner.id,
						playerName: winner.name,
						oldScore,
						newScore,
						pointsAwarded,
					});
				}

				onScoreUpdate?.(scoreUpdates);
				return scoreUpdates;
			} catch (error) {
				const gameError =
					error instanceof GameError
						? error
						: new GameStateError("Failed to award points");
				handleError(gameError);
				throw gameError;
			}
		},
		[gameState, onScoreUpdate, handleError]
	);

	// Process the end of a round (calculate winners and award points)
	const processRoundEnd = useCallback(async () => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		setIsProcessingRoundEnd(true);
		setScoringError(null);

		try {
			// Calculate round winners
			const roundResult = await calculateRoundWinners();

			// Award points to winners
			await awardPointsToWinners(roundResult.winners);

			// Notify about round completion
			onRoundComplete?.(roundResult);

			console.log(
				`Round ${gameState.current_round} completed. Winners:`,
				roundResult.winners.map((w) => w.name)
			);
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to process round end");
			handleError(gameError);
			throw gameError;
		} finally {
			setIsProcessingRoundEnd(false);
		}
	}, [
		gameState,
		calculateRoundWinners,
		awardPointsToWinners,
		onRoundComplete,
		handleError,
	]);

	// Check if the game should end based on target score
	const checkGameEnd = useCallback(async (): Promise<boolean> => {
		if (!gameState) {
			return false;
		}

		try {
			// Refetch latest player scores to ensure accuracy
			const { data: latestPlayers, error } = await supabase
				.from("players")
				.select("*")
				.eq("game_id", gameState.id)
				.order("score", { ascending: false });

			if (error) {
				throw new GameStateError(
					`Failed to fetch latest scores: ${error.message}`
				);
			}

			const gameProgress = calculateGameProgress(
				gameState,
				latestPlayers || []
			);
			return gameProgress.shouldEndGame;
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to check game end");
			handleError(gameError);
			return false;
		}
	}, [gameState, handleError]);

	// Finalize the game and create final results
	const finalizeGame = useCallback(async (): Promise<GameResult> => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		try {
			// Get final player standings
			const { data: finalPlayers, error } = await supabase
				.from("players")
				.select("*")
				.eq("game_id", gameState.id)
				.order("score", { ascending: false });

			if (error) {
				throw new GameStateError(
					`Failed to fetch final standings: ${error.message}`
				);
			}

			const gameProgress = calculateGameProgress(gameState, finalPlayers || []);

			const result: GameResult = {
				finalWinners: gameProgress.winners,
				finalRankings: finalPlayers || [],
				totalRounds: gameProgress.roundsPlayed,
				gameEndedAt: new Date().toISOString(),
			};

			// Update game phase to results
			const { error: phaseError } = await supabase
				.from("games")
				.update({
					phase: GAME_PHASES.RESULTS,
					updated_at: new Date().toISOString(),
				})
				.eq("id", gameState.id);

			if (phaseError) {
				throw new GameStateError(
					`Failed to update game phase: ${phaseError.message}`
				);
			}

			setGameResult(result);
			onGameComplete?.(result);

			console.log(
				"Game finalized. Winners:",
				result.finalWinners.map((w) => w.name)
			);
			return result;
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to finalize game");
			handleError(gameError);
			throw gameError;
		}
	}, [gameState, onGameComplete, handleError]);

	// Reset game to start a new one
	const resetGame = useCallback(async () => {
		if (!gameState) {
			throw new GameStateError("Game state not available");
		}

		try {
			// Reset all player scores
			const { error: resetScoresError } = await supabase
				.from("players")
				.update({ score: 0 })
				.eq("game_id", gameState.id);

			if (resetScoresError) {
				throw new GameStateError(
					`Failed to reset scores: ${resetScoresError.message}`
				);
			}

			// Reset game state
			const { error: resetGameError } = await supabase
				.from("games")
				.update({
					phase: GAME_PHASES.LOBBY,
					current_round: 1,
					updated_at: new Date().toISOString(),
				})
				.eq("id", gameState.id);

			if (resetGameError) {
				throw new GameStateError(
					`Failed to reset game: ${resetGameError.message}`
				);
			}

			// Clear local state
			setLastRoundResult(null);
			setGameResult(null);
			setScoringError(null);

			console.log("Game reset successfully");
		} catch (error) {
			const gameError =
				error instanceof GameError
					? error
					: new GameStateError("Failed to reset game");
			handleError(gameError);
			throw gameError;
		}
	}, [gameState, handleError]);

	// Computed values
	const currentRoundWinners = useMemo(() => {
		return lastRoundResult?.winners || [];
	}, [lastRoundResult]);

	const gameWinners = useMemo(() => {
		if (!gameState) return [];
		const gameProgress = calculateGameProgress(gameState, players);
		return gameProgress.winners;
	}, [gameState, players]);

	const shouldEndGame = useMemo(() => {
		if (!gameState) return false;
		const gameProgress = calculateGameProgress(gameState, players);
		return gameProgress.shouldEndGame;
	}, [gameState, players]);

	const playerRankings = useMemo(() => {
		return [...players].sort((a, b) => {
			// Sort by score descending, then by name ascending for ties
			if (b.score !== a.score) {
				return b.score - a.score;
			}
			return a.name.localeCompare(b.name);
		});
	}, [players]);

	const roundsCompleted = useMemo(() => {
		if (!gameState) return 0;
		return gameState.current_round - 1;
	}, [gameState]);

	const canProcessRoundEnd = useMemo(() => {
		return !!(
			gameState &&
			gameState.phase === GAME_PHASES.VOTING &&
			!isProcessingRoundEnd &&
			!isCalculatingScores &&
			submissions.filter((sub) => sub.round_number === gameState.current_round)
				.length > 0
		);
	}, [gameState, isProcessingRoundEnd, isCalculatingScores, submissions]);

	// Auto-process round end when voting is complete
	useEffect(() => {
		if (canProcessRoundEnd && gameState?.phase === GAME_PHASES.VOTING) {
			// Check if all eligible voters have voted
			const currentRoundSubmissions = submissions.filter(
				(sub) => sub.round_number === gameState.current_round
			);

			const submissionPlayerIds = currentRoundSubmissions.map(
				(sub) => sub.player_id
			);

			const eligibleVoters = players.filter(
				(player) =>
					!submissionPlayerIds.includes(player.id) && player.is_connected
			);

			const currentRoundVotes = votes.filter(
				(vote) => vote.round_number === gameState.current_round
			);

			const allVoted = currentRoundVotes.length >= eligibleVoters.length;

			if (allVoted) {
				// Add a small delay to ensure all real-time updates are processed
				const timer = setTimeout(() => {
					processRoundEnd().catch((error) => {
						console.error("Auto-processing round end failed:", error);
					});
				}, 2000);

				return () => clearTimeout(timer);
			}
		}
	}, [
		canProcessRoundEnd,
		gameState,
		submissions,
		players,
		votes,
		processRoundEnd,
	]);

	return {
		// State
		isCalculatingScores,
		isProcessingRoundEnd,
		scoringError,
		lastRoundResult,
		gameResult,

		// Actions
		calculateRoundWinners,
		awardPointsToWinners,
		processRoundEnd,
		checkGameEnd,
		finalizeGame,
		resetGame,

		// Computed values
		currentRoundWinners,
		gameWinners,
		shouldEndGame,
		playerRankings,
		roundsCompleted,
		canProcessRoundEnd,
	};
}
