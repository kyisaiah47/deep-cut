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

// Import lightweight components directly
import { RoundManager } from "./RoundManager";
import { PlayerList } from "./PlayerList";
import { ConnectionStatus } from "./ConnectionStatus";
import { ErrorBoundary } from "./ErrorBoundary";
import { SynchronizedTimer } from "./SynchronizedTimer";

// Import lazy-loaded components
import {
	SuspenseGameLobby,
	SuspenseSubmissionInterface,
	SuspenseVotingInterface,
	SuspenseScoreManager,
	SuspenseHostControlPanel,
} from "./LazyComponents";

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
						<SuspenseGameLobby />
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
						<SuspenseSubmissionInterface />
					</div>
				);

			case GAME_PHASES.VOTING:
				return (
					<div className="space-y-6">
						<SuspenseVotingInterface />
					</div>
				);

			case GAME_PHASES.RESULTS:
				return (
					<div className="space-y-6">
						<SuspenseScoreManager onError={handleError} />
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
			<div className={`min-h-screen bg-stage ${className}`}>
				{/* Neon Arcade Header */}
				<div className="bg-surface-dark border-b-2 border-neon-cyan shadow-neon-cyan">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div
							className={`flex items-center justify-between ${
								isMobile ? "h-16" : "h-20"
							}`}
						>
							{/* Game info with neon styling */}
							<div className="flex items-center space-x-2 sm:space-x-6">
								<h1
									className={`neon-heading neon-text-cyan ${
										isMobile ? "text-lg" : "text-2xl"
									}`}
								>
									{isMobile
										? gameState.room_code
										: `ROOM: ${gameState.room_code}`}
								</h1>
								<div
									className={`font-display font-bold neon-text-lime ${
										isMobile ? "text-sm" : "text-lg"
									}`}
								>
									ROUND {gameState.current_round}
								</div>
							</div>

							{/* Neon Timer - responsive */}
							{!isMobile && (
								<div className="flex-1 flex justify-center">
									<div className="neon-timer">
										<SynchronizedTimer
											onPhaseTransition={handlePhaseTransition}
											showControls={true}
										/>
									</div>
								</div>
							)}

							{/* Connection status with neon styling */}
							<div className="flex items-center space-x-2 sm:space-x-4">
								<ConnectionStatus showText={!isMobile} />
								{!isMobile && (
									<div className="font-body text-sm text-soft-lavender font-medium">
										{currentPlayer.name}
									</div>
								)}
							</div>
						</div>

						{/* Mobile neon timer */}
						{isMobile && (
							<div className="pb-4 flex justify-center">
								<div className="neon-timer scale-75">
									<SynchronizedTimer
										onPhaseTransition={handlePhaseTransition}
										showControls={false}
									/>
								</div>
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
							{/* Neon Players scoreboard */}
							<div className="scoreboard p-6">
								<h3
									className={`neon-heading neon-text-magenta mb-6 ${
										isMobile ? "text-sm" : "text-lg"
									}`}
								>
									PLAYERS ({players.length})
								</h3>
								<PlayerList
									players={players}
									currentPlayerId={currentPlayer.id}
								/>
							</div>

							{/* Host Controls (when not in lobby) */}
							{isHost && gameState.phase !== GAME_PHASES.LOBBY && (
								<SuspenseHostControlPanel
									gameState={gameState}
									players={players}
									currentPlayerId={currentPlayer.id}
									isHost={isHost}
									onError={(error: unknown) => handleError(error as GameError)}
								/>
							)}

							{/* Neon Score display (when not in results phase) */}
							{gameState.phase !== GAME_PHASES.RESULTS &&
								gameState.phase !== GAME_PHASES.LOBBY && (
									<div className="scoreboard p-6">
										<SuspenseScoreManager onError={handleError} />
									</div>
								)}

							{/* Neon Game info panel */}
							<div className="bg-surface-dark border-2 border-electric-blue rounded-arcade p-6 shadow-neon-blue">
								<h3
									className={`neon-heading neon-text-blue mb-6 ${
										isMobile ? "text-sm" : "text-lg"
									}`}
								>
									GAME STATUS
								</h3>
								<div
									className={`space-y-3 font-body ${
										isMobile ? "text-xs" : "text-sm"
									}`}
								>
									<div className="flex justify-between items-center">
										<span className="text-soft-lavender">Phase:</span>
										<span className="font-bold text-neon-cyan uppercase tracking-wide">
											{gameState.phase.replace("_", " ")}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-soft-lavender">Target Score:</span>
										<span className="font-bold text-sun-yellow">
											{gameState.target_score}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-soft-lavender">Max Players:</span>
										<span className="font-bold text-acid-lime">
											{gameState.max_players}
										</span>
									</div>
									{gameState.phase === GAME_PHASES.SUBMISSION && (
										<div className="flex justify-between items-center">
											<span className="text-soft-lavender">Submit Timer:</span>
											<span className="font-bold text-neon-magenta">
												{gameState.submission_timer}s
											</span>
										</div>
									)}
									{gameState.phase === GAME_PHASES.VOTING && (
										<div className="flex justify-between items-center">
											<span className="text-soft-lavender">Vote Timer:</span>
											<span className="font-bold text-neon-magenta">
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
