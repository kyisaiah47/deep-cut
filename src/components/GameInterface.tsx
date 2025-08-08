"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { GAME_PHASES } from "@/lib/constants";
import { GameError } from "@/lib/error-handling";
import { GameState } from "@/types/game";

// Import all game phase components
import { GameLobby } from "./GameLobby";
import { RoundManager } from "./RoundManager";
import { SubmissionInterface } from "./SubmissionInterface";
import { VotingInterface } from "./VotingInterface";
import { ScoreManager } from "./ScoreManager";
import { PlayerList } from "./PlayerList";
import { ConnectionStatus } from "./ConnectionStatus";
import { ErrorBoundary } from "./ErrorBoundary";
import { SynchronizedTimer } from "./SynchronizedTimer";
import { HostControlPanel } from "./HostControlPanel";

interface GameInterfaceProps {
	className?: string;
}

export function GameInterface({ className = "" }: GameInterfaceProps) {
	const { gameState, players, currentPlayer, isHost, updateGamePhase } =
		useGame();
	const [gameError, setGameError] = useState<GameError | null>(null);

	const handleError = (error: GameError) => {
		setGameError(error);
		console.error("Game error:", error);
	};

	const handlePhaseTransition = async (phase: GameState["phase"]) => {
		try {
			// Handle automatic phase transitions when timers expire
			switch (phase) {
				case "submission":
					// Move to voting phase when submission timer expires
					await updateGamePhase("voting");
					break;
				case "voting":
					// Move to results phase when voting timer expires
					await updateGamePhase("results");
					break;
				default:
					console.log(`No automatic transition defined for phase: ${phase}`);
			}
		} catch (error) {
			console.error("Failed to handle phase transition:", error);
			handleError(error as GameError);
		}
	};

	if (!gameState || !currentPlayer) {
		return (
			<div
				className={`min-h-screen flex items-center justify-center ${className}`}
			>
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading game...</p>
				</div>
			</div>
		);
	}

	const renderPhaseContent = () => {
		switch (gameState.phase) {
			case GAME_PHASES.LOBBY:
				return (
					<div className="space-y-6">
						<GameLobby />
						<RoundManager />
					</div>
				);

			case GAME_PHASES.DISTRIBUTION:
				return (
					<div className="space-y-6">
						<RoundManager />
						<div className="text-center py-8">
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="space-y-4"
							>
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
								<h3 className="text-lg font-semibold text-gray-900">
									Preparing Round {gameState.current_round}
								</h3>
								<p className="text-gray-600">
									AI is generating cards and distributing them to players...
								</p>
							</motion.div>
						</div>
					</div>
				);

			case GAME_PHASES.SUBMISSION:
				return (
					<div className="space-y-6">
						<SubmissionInterface />
					</div>
				);

			case GAME_PHASES.VOTING:
				return (
					<div className="space-y-6">
						<VotingInterface />
					</div>
				);

			case GAME_PHASES.RESULTS:
				return (
					<div className="space-y-6">
						<ScoreManager onError={handleError} />
					</div>
				);

			default:
				return (
					<div className="text-center py-8">
						<p className="text-gray-600">
							Unknown game phase: {gameState.phase}
						</p>
					</div>
				);
		}
	};

	return (
		<ErrorBoundary>
			<div
				className={`min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 ${className}`}
			>
				{/* Header */}
				<div className="bg-white shadow-sm border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							{/* Game info */}
							<div className="flex items-center space-x-4">
								<h1 className="text-xl font-bold text-gray-900">
									Room: {gameState.room_code}
								</h1>
								<div className="text-sm text-gray-600">
									Round {gameState.current_round}
								</div>
							</div>

							{/* Timer */}
							<div className="flex-1 flex justify-center">
								<SynchronizedTimer
									onPhaseTransition={handlePhaseTransition}
									showControls={true}
								/>
							</div>

							{/* Connection status */}
							<div className="flex items-center space-x-4">
								<ConnectionStatus showText={false} />
								<div className="text-sm text-gray-600">
									{currentPlayer.name}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main content */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
						{/* Main game area */}
						<div className="lg:col-span-3">
							<AnimatePresence mode="wait">
								<motion.div
									key={gameState.phase}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.3 }}
								>
									{renderPhaseContent()}
								</motion.div>
							</AnimatePresence>
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1 space-y-6">
							{/* Players list */}
							<div className="bg-white rounded-lg shadow-sm border p-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Players ({players.length})
								</h3>
								<PlayerList
									players={players}
									currentPlayerId={currentPlayer.id}
								/>
							</div>

							{/* Host Controls (when not in lobby) */}
							{isHost && gameState.phase !== GAME_PHASES.LOBBY && (
								<HostControlPanel
									gameState={gameState}
									players={players}
									currentPlayerId={currentPlayer.id}
									isHost={isHost}
									onError={(error) => handleError(error as GameError)}
								/>
							)}

							{/* Score display (when not in results phase) */}
							{gameState.phase !== GAME_PHASES.RESULTS &&
								gameState.phase !== GAME_PHASES.LOBBY && (
									<div className="bg-white rounded-lg shadow-sm border p-4">
										<ScoreManager onError={handleError} />
									</div>
								)}

							{/* Game info */}
							<div className="bg-white rounded-lg shadow-sm border p-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-4">
									Game Info
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-gray-600">Phase:</span>
										<span className="font-medium capitalize">
											{gameState.phase.replace("_", " ")}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Target Score:</span>
										<span className="font-medium">
											{gameState.target_score}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-600">Max Players:</span>
										<span className="font-medium">{gameState.max_players}</span>
									</div>
									{gameState.phase === GAME_PHASES.SUBMISSION && (
										<div className="flex justify-between">
											<span className="text-gray-600">Submission Timer:</span>
											<span className="font-medium">
												{gameState.submission_timer}s
											</span>
										</div>
									)}
									{gameState.phase === GAME_PHASES.VOTING && (
										<div className="flex justify-between">
											<span className="text-gray-600">Voting Timer:</span>
											<span className="font-medium">
												{gameState.voting_timer}s
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Error display */}
				<AnimatePresence>
					{gameError && (
						<motion.div
							initial={{ opacity: 0, y: 50 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 50 }}
							className="fixed bottom-4 right-4 max-w-md"
						>
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
								<div className="flex items-start">
									<div className="flex-shrink-0">
										<div className="w-5 h-5 text-red-400">⚠️</div>
									</div>
									<div className="ml-3">
										<h3 className="text-sm font-medium text-red-800">
											Game Error
										</h3>
										<div className="mt-1 text-sm text-red-700">
											{gameError.message}
										</div>
										<div className="mt-3">
											<button
												onClick={() => setGameError(null)}
												className="text-sm font-medium text-red-800 hover:text-red-900"
											>
												Dismiss
											</button>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</ErrorBoundary>
	);
}
