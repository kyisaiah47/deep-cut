"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { GAME_PHASES } from "@/lib/constants";
import { GameError } from "@/lib/error-handling";
import { GameState } from "@/types/game";
import { GameInterfaceSkeleton, AIGenerationLoader } from "./SkeletonLoader";
import { useResponsive } from "@/hooks/useResponsive";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
	const { isMobile, isTablet } = useResponsive();
	const prefersReducedMotion = useReducedMotion();

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
		return <GameInterfaceSkeleton />;
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
						<AIGenerationLoader />
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
				{/* Header - responsive */}
				<div className="bg-white shadow-sm border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div
							className={`flex items-center justify-between ${
								isMobile ? "h-14" : "h-16"
							}`}
						>
							{/* Game info */}
							<div className="flex items-center space-x-2 sm:space-x-4">
								<h1
									className={`font-bold text-gray-900 ${
										isMobile ? "text-lg" : "text-xl"
									}`}
								>
									{isMobile
										? gameState.room_code
										: `Room: ${gameState.room_code}`}
								</h1>
								<div
									className={`text-gray-600 ${
										isMobile ? "text-xs" : "text-sm"
									}`}
								>
									R{gameState.current_round}
								</div>
							</div>

							{/* Timer - responsive */}
							{!isMobile && (
								<div className="flex-1 flex justify-center">
									<SynchronizedTimer
										onPhaseTransition={handlePhaseTransition}
										showControls={true}
									/>
								</div>
							)}

							{/* Connection status */}
							<div className="flex items-center space-x-2 sm:space-x-4">
								<ConnectionStatus showText={!isMobile} />
								{!isMobile && (
									<div className="text-sm text-gray-600">
										{currentPlayer.name}
									</div>
								)}
							</div>
						</div>

						{/* Mobile timer */}
						{isMobile && (
							<div className="pb-3 flex justify-center">
								<SynchronizedTimer
									onPhaseTransition={handlePhaseTransition}
									showControls={false}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Main content - responsive layout */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
					<div
						className={`${
							isMobile || isTablet
								? "space-y-6"
								: "grid grid-cols-1 lg:grid-cols-4 gap-8"
						}`}
					>
						{/* Main game area */}
						<div className={isMobile || isTablet ? "" : "lg:col-span-3"}>
							<AnimatePresence mode="wait">
								<motion.div
									key={gameState.phase}
									initial={
										prefersReducedMotion
											? { opacity: 0 }
											: { opacity: 0, y: 20 }
									}
									animate={{ opacity: 1, y: 0 }}
									exit={
										prefersReducedMotion
											? { opacity: 0 }
											: { opacity: 0, y: -20 }
									}
									transition={{ duration: prefersReducedMotion ? 0.01 : 0.3 }}
								>
									{renderPhaseContent()}
								</motion.div>
							</AnimatePresence>
						</div>

						{/* Sidebar - responsive */}
						<div
							className={`${
								isMobile || isTablet ? "space-y-4" : "lg:col-span-1 space-y-6"
							}`}
						>
							{/* Players list */}
							<div className="bg-white rounded-lg shadow-sm border p-4">
								<h3
									className={`font-semibold text-gray-900 mb-4 ${
										isMobile ? "text-base" : "text-lg"
									}`}
								>
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

							{/* Game info - collapsible on mobile */}
							<div className="bg-white rounded-lg shadow-sm border p-4">
								<h3
									className={`font-semibold text-gray-900 mb-4 ${
										isMobile ? "text-base" : "text-lg"
									}`}
								>
									Game Info
								</h3>
								<div
									className={`space-y-2 ${isMobile ? "text-xs" : "text-sm"}`}
								>
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
