"use client";

import React from "react";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { PlayerList } from "./PlayerList";
import { ConnectionStatus } from "./ConnectionStatus";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { HostControlPanel } from "./HostControlPanel";

interface GameLobbyProps {
	className?: string;
}

export function GameLobby({ className = "" }: GameLobbyProps) {
	const {
		gameState,
		players,
		currentPlayer,
		isHost,
		handlePlayerLeave,
		connectedPlayers,
		disconnectedPlayers,
	} = useGame();

	// Game start is now handled by HostControlPanel

	// Host transfer functionality (currently unused but available for future use)
	// const handleTransferHost = async (newHostId: string) => {
	// 	if (!isHost) return;

	// 	try {
	// 		await transferHost(newHostId);
	// 	} catch (error) {
	// 		console.error("Failed to transfer host:", error);
	// 	}
	// };

	const handleKickPlayer = async (playerId: string) => {
		if (!isHost || playerId === currentPlayer?.id) return;

		try {
			await handlePlayerLeave(playerId);
		} catch (error) {
			console.error("Failed to kick player:", error);
		}
	};

	if (!gameState || !currentPlayer) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading game...</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${className}`}
		>
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8"
				>
					<h1 className="text-4xl font-bold text-gray-800 mb-2">Game Lobby</h1>
					<div className="flex items-center justify-center space-x-4">
						<p className="text-lg text-gray-600">
							Room Code:{" "}
							<span className="font-mono font-bold text-blue-600">
								{gameState.room_code}
							</span>
						</p>
						<ConnectionStatus />
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Player List */}
					<div className="lg:col-span-2">
						<PlayerList
							players={players}
							currentPlayerId={currentPlayer.id}
							showConnectionStatus={true}
							className="h-fit"
						/>

						{/* Connection Status Summary */}
						{disconnectedPlayers.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
							>
								<h4 className="font-semibold text-yellow-800 mb-2">
									Disconnected Players ({disconnectedPlayers.length})
								</h4>
								<div className="space-y-1">
									{disconnectedPlayers.map((player) => (
										<div
											key={player.id}
											className="flex items-center justify-between"
										>
											<span className="text-yellow-700">{player.name}</span>
											{isHost && (
												<button
													onClick={() => handleKickPlayer(player.id)}
													className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
												>
													Remove
												</button>
											)}
										</div>
									))}
								</div>
							</motion.div>
						)}
					</div>

					{/* Game Controls */}
					<div className="space-y-4">
						{/* Game Settings Display */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							className="bg-white rounded-lg shadow-md p-4"
						>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold text-gray-800">
									Game Settings
								</h3>
								{isHost && (
									<GameSettingsPanel
										gameState={gameState}
										playerId={currentPlayer.id}
										isHost={isHost}
										onError={(error) => console.error("Settings error:", error)}
									/>
								)}
							</div>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Target Score:</span>
									<span className="font-medium">{gameState.target_score}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Max Players:</span>
									<span className="font-medium">{gameState.max_players}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Submission Timer:</span>
									<span className="font-medium">
										{gameState.submission_timer}s
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Voting Timer:</span>
									<span className="font-medium">{gameState.voting_timer}s</span>
								</div>
							</div>
						</motion.div>

						{/* Host Controls */}
						{isHost && (
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.1 }}
							>
								<HostControlPanel
									gameState={gameState}
									players={players}
									currentPlayerId={currentPlayer.id}
									isHost={isHost}
									onError={(error) =>
										console.error("Host control error:", error)
									}
								/>
							</motion.div>
						)}

						{/* Player Status */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="bg-white rounded-lg shadow-md p-4"
						>
							<h3 className="text-lg font-semibold text-gray-800 mb-3">
								Status
							</h3>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Connected:</span>
									<span className="font-medium text-green-600">
										{connectedPlayers.length}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Disconnected:</span>
									<span className="font-medium text-red-600">
										{disconnectedPlayers.length}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Total:</span>
									<span className="font-medium">{players.length}</span>
								</div>
							</div>
						</motion.div>

						{/* Instructions */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.3 }}
							className="bg-blue-50 rounded-lg p-4"
						>
							<h3 className="text-lg font-semibold text-blue-800 mb-2">
								How to Play
							</h3>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• Wait for all players to join</li>
								<li>• Host starts the game when ready</li>
								<li>• Create funny card combinations</li>
								<li>• Vote for the funniest submissions</li>
								<li>• First to {gameState.target_score} points wins!</li>
							</ul>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}
