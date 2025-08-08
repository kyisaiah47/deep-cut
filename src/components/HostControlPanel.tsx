"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, Player } from "@/types/game";
import { useHostControls } from "@/hooks/useHostControls";

interface HostControlPanelProps {
	gameState: GameState;
	players: Player[];
	currentPlayerId: string;
	isHost: boolean;
	onError?: (error: Error) => void;
	className?: string;
}

export function HostControlPanel({
	gameState,
	players,
	currentPlayerId,
	isHost,
	onError,
	className = "",
}: HostControlPanelProps) {
	const [showTransferModal, setShowTransferModal] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	const {
		transferHost,
		startGame,
		pauseGame,
		resetGame,
		isTransferringHost,
		isControllingGame,
	} = useHostControls({
		gameId: gameState.id,
		playerId: currentPlayerId,
		isHost,
		onError,
		onHostTransfer: () => {
			setShowTransferModal(false);
		},
		onGameControl: (action) => {
			if (action === "reset") {
				setShowResetConfirm(false);
			}
		},
	});

	const handleTransferHost = async (newHostId: string) => {
		try {
			await transferHost(newHostId);
		} catch (error) {
			console.error("Failed to transfer host:", error);
		}
	};

	const handleStartGame = async () => {
		try {
			await startGame();
		} catch (error) {
			console.error("Failed to start game:", error);
		}
	};

	const handlePauseGame = async () => {
		try {
			await pauseGame();
		} catch (error) {
			console.error("Failed to pause game:", error);
		}
	};

	const handleResetGame = async () => {
		try {
			await resetGame();
		} catch (error) {
			console.error("Failed to reset game:", error);
		}
	};

	// Only show for host
	if (!isHost) {
		return null;
	}

	const connectedPlayers = players.filter((p) => p.is_connected);
	const canStartGame =
		gameState.phase === "lobby" && connectedPlayers.length >= 3;
	const isGameActive = gameState.phase !== "lobby";
	const eligibleForTransfer = players.filter(
		(p) => p.id !== currentPlayerId && p.is_connected
	);

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Game Control Buttons */}
			<div className="bg-white rounded-lg shadow-sm border p-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Host Controls
				</h3>

				<div className="space-y-3">
					{/* Start Game Button */}
					{gameState.phase === "lobby" && (
						<button
							onClick={handleStartGame}
							disabled={!canStartGame || isControllingGame}
							className={`
								w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2
								${
									canStartGame && !isControllingGame
										? "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
										: "bg-gray-300 text-gray-500 cursor-not-allowed"
								}
							`}
						>
							{isControllingGame && (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							)}
							<span>
								{canStartGame
									? "Start Game"
									: `Need ${3 - connectedPlayers.length} more players`}
							</span>
						</button>
					)}

					{/* Pause Game Button */}
					{isGameActive && gameState.phase !== "results" && (
						<button
							onClick={handlePauseGame}
							disabled={isControllingGame}
							className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
						>
							{isControllingGame && (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							)}
							<span>⏸️</span>
							<span>Pause Game</span>
						</button>
					)}

					{/* Reset Game Button */}
					<button
						onClick={() => setShowResetConfirm(true)}
						disabled={isControllingGame}
						className="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
					>
						<span>🔄</span>
						<span>Reset Game</span>
					</button>

					{/* Transfer Host Button */}
					{eligibleForTransfer.length > 0 && (
						<button
							onClick={() => setShowTransferModal(true)}
							disabled={isTransferringHost}
							className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
						>
							{isTransferringHost && (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							)}
							<span>👑</span>
							<span>Transfer Host</span>
						</button>
					)}
				</div>
			</div>

			{/* Transfer Host Modal */}
			<AnimatePresence>
				{showTransferModal && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black bg-opacity-50 z-40"
							onClick={() => setShowTransferModal(false)}
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="fixed inset-0 z-50 flex items-center justify-center p-4"
						>
							<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
								{/* Header */}
								<div className="flex items-center justify-between p-6 border-b">
									<h2 className="text-xl font-semibold text-gray-900">
										Transfer Host Privileges
									</h2>
									<button
										onClick={() => setShowTransferModal(false)}
										className="text-gray-400 hover:text-gray-600 text-2xl"
									>
										×
									</button>
								</div>

								{/* Content */}
								<div className="p-6">
									<p className="text-gray-600 mb-4">
										Select a player to transfer host privileges to:
									</p>
									<div className="space-y-2">
										{eligibleForTransfer.map((player) => (
											<button
												key={player.id}
												onClick={() => handleTransferHost(player.id)}
												disabled={isTransferringHost}
												className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-3"
											>
												<div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
													{player.name.charAt(0).toUpperCase()}
												</div>
												<div>
													<div className="font-medium">{player.name}</div>
													<div className="text-sm text-gray-500">
														Score: {player.score}
													</div>
												</div>
											</button>
										))}
									</div>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
									<button
										onClick={() => setShowTransferModal(false)}
										disabled={isTransferringHost}
										className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
									>
										Cancel
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Reset Confirmation Modal */}
			<AnimatePresence>
				{showResetConfirm && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black bg-opacity-50 z-40"
							onClick={() => setShowResetConfirm(false)}
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="fixed inset-0 z-50 flex items-center justify-center p-4"
						>
							<div className="bg-white rounded-lg shadow-xl max-w-md w-full">
								{/* Header */}
								<div className="flex items-center justify-between p-6 border-b">
									<h2 className="text-xl font-semibold text-gray-900">
										Reset Game
									</h2>
									<button
										onClick={() => setShowResetConfirm(false)}
										className="text-gray-400 hover:text-gray-600 text-2xl"
									>
										×
									</button>
								</div>

								{/* Content */}
								<div className="p-6">
									<p className="text-gray-600 mb-4">
										Are you sure you want to reset the game? This will:
									</p>
									<ul className="text-sm text-gray-600 space-y-1 mb-4">
										<li>• Return to lobby phase</li>
										<li>• Reset all player scores to 0</li>
										<li>• Clear all game data (cards, submissions, votes)</li>
										<li>• Start fresh from round 1</li>
									</ul>
									<p className="text-red-600 text-sm font-medium">
										This action cannot be undone.
									</p>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
									<button
										onClick={() => setShowResetConfirm(false)}
										disabled={isControllingGame}
										className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										onClick={handleResetGame}
										disabled={isControllingGame}
										className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
									>
										{isControllingGame && (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										)}
										<span>Reset Game</span>
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
