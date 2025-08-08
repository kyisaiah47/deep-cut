"use client";

import React, { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { useGameActions } from "@/hooks/useGameActions";
import { useScoringManagement } from "@/hooks/useScoringManagement";
import { ScoreDisplay } from "./ScoreDisplay";
import { RoundResults } from "./RoundResults";
import { GameResults } from "./GameResults";
import { Button } from "./ui/button";
import { GAME_PHASES } from "@/lib/constants";
import { GameError } from "@/lib/error-handling";

interface ScoreManagerProps {
	onError?: (error: GameError) => void;
	className?: string;
}

export function ScoreManager({ onError, className = "" }: ScoreManagerProps) {
	const { gameState, players, currentPlayer, isHost, currentRoundCards } =
		useGame();
	const { transitionToPhase } = useGameActions({ onError });

	const [showRoundResults, setShowRoundResults] = useState(false);
	const [showGameResults, setShowGameResults] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const {
		isProcessingRoundEnd,
		lastRoundResult,
		gameResult,
		shouldEndGame,
		playerRankings,
		processRoundEnd,
		finalizeGame,
		resetGame: resetScoring,
	} = useScoringManagement({
		onRoundComplete: (result) => {
			console.log("Round completed:", result);
			setShowRoundResults(true);
		},
		onGameComplete: (result) => {
			console.log("Game completed:", result);
			setShowGameResults(true);
		},
		onScoreUpdate: (updates) => {
			console.log("Score updates:", updates);
		},
		onError,
	});

	// Handle automatic game end detection
	useEffect(() => {
		if (
			shouldEndGame &&
			gameState?.phase === GAME_PHASES.RESULTS &&
			!showGameResults
		) {
			const timer = setTimeout(() => {
				finalizeGame().catch((error) => {
					console.error("Failed to finalize game:", error);
					onError?.(error);
				});
			}, 3000); // Show round results for 3 seconds before game results

			return () => clearTimeout(timer);
		}
	}, [shouldEndGame, gameState?.phase, showGameResults, finalizeGame, onError]);

	// Handle phase transitions after round results
	const handleContinueToNextRound = useCallback(async () => {
		if (!gameState || !isHost) return;

		setIsTransitioning(true);
		setShowRoundResults(false);

		try {
			if (shouldEndGame) {
				// Game should end, finalize it
				await finalizeGame();
			} else {
				// Continue to next round
				await transitionToPhase(GAME_PHASES.DISTRIBUTION);
			}
		} catch (error) {
			console.error("Failed to continue to next round:", error);
			onError?.(error as GameError);
		} finally {
			setIsTransitioning(false);
		}
	}, [
		gameState,
		isHost,
		shouldEndGame,
		finalizeGame,
		transitionToPhase,
		onError,
	]);

	// Handle play again
	const handlePlayAgain = useCallback(async () => {
		if (!isHost) return;

		setIsTransitioning(true);
		setShowGameResults(false);

		try {
			await resetScoring();
			// The resetScoring function should handle transitioning back to lobby
		} catch (error) {
			console.error("Failed to reset game:", error);
			onError?.(error as GameError);
		} finally {
			setIsTransitioning(false);
		}
	}, [isHost, resetScoring, onError]);

	// Handle return to lobby
	const handleReturnToLobby = useCallback(async () => {
		if (!isHost) return;

		setIsTransitioning(true);
		setShowGameResults(false);

		try {
			await transitionToPhase(GAME_PHASES.LOBBY);
		} catch (error) {
			console.error("Failed to return to lobby:", error);
			onError?.(error as GameError);
		} finally {
			setIsTransitioning(false);
		}
	}, [isHost, transitionToPhase, onError]);

	// Don't render anything if no game state
	if (!gameState) {
		return null;
	}

	// Show game results if game is complete
	if (showGameResults && gameResult) {
		return (
			<div className={className}>
				<GameResults
					finalWinners={gameResult.finalWinners}
					finalRankings={gameResult.finalRankings}
					totalRounds={gameResult.totalRounds}
					targetScore={gameState.target_score}
					onPlayAgain={isHost ? handlePlayAgain : undefined}
					onReturnToLobby={isHost ? handleReturnToLobby : undefined}
					showPlayAgainButton={isHost}
				/>

				{/* Loading overlay for transitions */}
				<AnimatePresence>
					{isTransitioning && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
						>
							<div className="bg-white rounded-lg p-6 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
								<p className="text-gray-700">Setting up new game...</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		);
	}

	// Show round results if available
	if (showRoundResults && lastRoundResult) {
		const promptCard = currentRoundCards.find(
			(card) =>
				card.type === "prompt" &&
				card.round_number === lastRoundResult.roundNumber
		);

		return (
			<div className={className}>
				<RoundResults
					roundNumber={lastRoundResult.roundNumber}
					winners={lastRoundResult.winners}
					winningSubmissions={lastRoundResult.winningSubmissions}
					allSubmissions={lastRoundResult.allSubmissions}
					maxVotes={lastRoundResult.maxVotes}
					hasTie={lastRoundResult.hasTie}
					promptCard={promptCard}
					onContinue={isHost ? handleContinueToNextRound : undefined}
					showContinueButton={isHost}
				/>

				{/* Loading overlay for transitions */}
				<AnimatePresence>
					{isTransitioning && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
						>
							<div className="bg-white rounded-lg p-6 text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
								<p className="text-gray-700">
									{shouldEndGame
										? "Finalizing game..."
										: "Starting next round..."}
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		);
	}

	// Show processing state during round end calculation
	if (isProcessingRoundEnd) {
		return (
			<div className={`text-center py-12 ${className}`}>
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="space-y-4"
				>
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
					<h3 className="text-lg font-semibold text-gray-900">
						Calculating Round Results...
					</h3>
					<p className="text-gray-600">
						Tallying votes and determining winners
					</p>
				</motion.div>
			</div>
		);
	}

	// Default: Show current score display
	return (
		<div className={className}>
			<ScoreDisplay
				players={playerRankings}
				targetScore={gameState.target_score}
				highlightedPlayerId={currentPlayer?.id}
				showRankings={true}
				compact={false}
			/>

			{/* Show game progress info */}
			{gameState.phase !== GAME_PHASES.LOBBY && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-6 p-4 bg-gray-50 rounded-lg"
				>
					<div className="flex items-center justify-between text-sm text-gray-600">
						<span>Round {gameState.current_round}</span>
						<span>Target: {gameState.target_score} points to win</span>
					</div>

					{/* Show phase-specific information */}
					{gameState.phase === GAME_PHASES.RESULTS && (
						<div className="mt-2 text-center">
							<p className="text-sm text-gray-700">
								{shouldEndGame
									? "Game will end after this round!"
									: "Get ready for the next round!"}
							</p>
						</div>
					)}
				</motion.div>
			)}

			{/* Debug info for development */}
			{process.env.NODE_ENV === "development" && (
				<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
					<div>Phase: {gameState.phase}</div>
					<div>Should End Game: {shouldEndGame ? "Yes" : "No"}</div>
					<div>Processing Round End: {isProcessingRoundEnd ? "Yes" : "No"}</div>
					<div>Show Round Results: {showRoundResults ? "Yes" : "No"}</div>
					<div>Show Game Results: {showGameResults ? "Yes" : "No"}</div>
				</div>
			)}
		</div>
	);
}
