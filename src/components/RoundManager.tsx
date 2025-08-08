"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useGameActions } from "@/hooks";
import { GAME_PHASES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Users, CreditCard, CheckCircle } from "lucide-react";

interface RoundManagerProps {
	className?: string;
}

export function RoundManager({ className }: RoundManagerProps) {
	const { gameState, players, isHost, currentRoundCards, connectedPlayers } =
		useGame();

	const {
		startGame,
		startNewRound,
		isRoundInProgress,
		canStartNewRound,
		roundPhase,
	} = useGameActions();

	if (!gameState) {
		return null;
	}

	const activePlayers = connectedPlayers.length;
	const promptCard = currentRoundCards.find((card) => card.type === "prompt");
	const responseCards = currentRoundCards.filter(
		(card) => card.type === "response"
	);

	const handleStartGame = async () => {
		try {
			await startGame();
		} catch (error) {
			console.error("Failed to start game:", error);
		}
	};

	const handleStartNewRound = async () => {
		try {
			await startNewRound();
		} catch (error) {
			console.error("Failed to start new round:", error);
		}
	};

	const getRoundPhaseDisplay = () => {
		switch (roundPhase) {
			case "initializing":
				return {
					label: "Generating Cards",
					icon: <Loader2 className="h-4 w-4 animate-spin" />,
					color: "bg-blue-500",
				};
			case "distributing":
				return {
					label: "Distributing Cards",
					icon: <CreditCard className="h-4 w-4" />,
					color: "bg-yellow-500",
				};
			case "ready":
				return {
					label: "Ready for Submissions",
					icon: <CheckCircle className="h-4 w-4" />,
					color: "bg-green-500",
				};
			case "complete":
				return {
					label: "Round Complete",
					icon: <CheckCircle className="h-4 w-4" />,
					color: "bg-gray-500",
				};
			default:
				return null;
		}
	};

	const phaseDisplay = getRoundPhaseDisplay();

	return (
		<div className={className}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Round {gameState.current_round}</span>
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="flex items-center gap-1"
							>
								<Users className="h-3 w-3" />
								{activePlayers} players
							</Badge>
							{phaseDisplay && (
								<Badge
									variant="outline"
									className={`flex items-center gap-1 text-white ${phaseDisplay.color}`}
								>
									{phaseDisplay.icon}
									{phaseDisplay.label}
								</Badge>
							)}
						</div>
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Game Phase Status */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center p-3 bg-gray-50 rounded-lg">
							<div className="text-sm text-gray-600">Phase</div>
							<div className="font-semibold capitalize">
								{gameState.phase.replace("_", " ")}
							</div>
						</div>

						<div className="text-center p-3 bg-gray-50 rounded-lg">
							<div className="text-sm text-gray-600">Cards Generated</div>
							<div className="font-semibold">
								{currentRoundCards.length > 0 ? (
									<span className="text-green-600">
										{currentRoundCards.length} cards
									</span>
								) : (
									<span className="text-gray-400">None</span>
								)}
							</div>
						</div>

						<div className="text-center p-3 bg-gray-50 rounded-lg">
							<div className="text-sm text-gray-600">Distribution</div>
							<div className="font-semibold">
								{gameState.phase === GAME_PHASES.SUBMISSION ||
								gameState.phase === GAME_PHASES.VOTING ||
								gameState.phase === GAME_PHASES.RESULTS ? (
									<span className="text-green-600">Complete</span>
								) : gameState.phase === GAME_PHASES.DISTRIBUTION ? (
									<span className="text-yellow-600">In Progress</span>
								) : (
									<span className="text-gray-400">Pending</span>
								)}
							</div>
						</div>
					</div>

					{/* Round Progress Indicator */}
					<AnimatePresence>
						{isRoundInProgress && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="bg-blue-50 border border-blue-200 rounded-lg p-4"
							>
								<div className="flex items-center gap-3">
									<Loader2 className="h-5 w-5 animate-spin text-blue-600" />
									<div>
										<div className="font-medium text-blue-900">
											Round in Progress
										</div>
										<div className="text-sm text-blue-700">
											{roundPhase === "initializing" &&
												"AI is generating cards for this round..."}
											{roundPhase === "distributing" &&
												"Distributing cards to all players..."}
											{roundPhase === "ready" &&
												"Cards distributed! Players can now submit."}
											{roundPhase === "complete" &&
												"Round complete! Waiting for next phase."}
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Card Information */}
					{currentRoundCards.length > 0 && (
						<div className="space-y-3">
							<h4 className="font-medium">Round Cards</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{promptCard && (
									<div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
										<div className="text-sm font-medium text-purple-800 mb-1">
											Prompt Card
										</div>
										<div className="text-sm text-purple-700">
											{promptCard.text}
										</div>
									</div>
								)}

								<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
									<div className="text-sm font-medium text-green-800 mb-1">
										Response Cards
									</div>
									<div className="text-sm text-green-700">
										{responseCards.length} cards generated
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Host Actions */}
					{isHost && (
						<div className="flex gap-2 pt-4 border-t">
							{gameState.phase === GAME_PHASES.LOBBY && (
								<Button
									onClick={handleStartGame}
									disabled={activePlayers < 3}
									className="flex items-center gap-2"
								>
									<Play className="h-4 w-4" />
									Start Game
								</Button>
							)}

							{canStartNewRound && (
								<Button
									onClick={handleStartNewRound}
									disabled={isRoundInProgress}
									className="flex items-center gap-2"
								>
									<Play className="h-4 w-4" />
									Start New Round
								</Button>
							)}
						</div>
					)}

					{/* Non-host status */}
					{!isHost && gameState.phase === GAME_PHASES.LOBBY && (
						<div className="text-center text-gray-600 py-4">
							Waiting for host to start the game...
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
