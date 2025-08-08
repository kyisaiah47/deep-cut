"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, GameSettings } from "@/types/game";
import { GAME_LIMITS } from "@/lib/constants";
import { useHostControls } from "@/hooks/useHostControls";

interface GameSettingsPanelProps {
	gameState: GameState;
	playerId: string;
	isHost: boolean;
	onError?: (error: Error) => void;
	className?: string;
}

export function GameSettingsPanel({
	gameState,
	playerId,
	isHost,
	onError,
	className = "",
}: GameSettingsPanelProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [settings, setSettings] = useState<GameSettings>({
		maxPlayers: gameState.max_players,
		submissionTimer: gameState.submission_timer,
		votingTimer: gameState.voting_timer,
		targetScore: gameState.target_score,
	});

	const { updateGameSettings, isUpdatingSettings } = useHostControls({
		gameId: gameState.id,
		playerId,
		isHost,
		onError,
		onSettingsUpdate: () => {
			// Settings will be updated via real-time subscription
			setIsOpen(false);
		},
	});

	const handleSettingChange = (key: keyof GameSettings, value: number) => {
		setSettings((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleSaveSettings = async () => {
		try {
			// Only send changed settings
			const changes: Partial<GameSettings> = {};

			if (settings.maxPlayers !== gameState.max_players) {
				changes.maxPlayers = settings.maxPlayers;
			}
			if (settings.submissionTimer !== gameState.submission_timer) {
				changes.submissionTimer = settings.submissionTimer;
			}
			if (settings.votingTimer !== gameState.voting_timer) {
				changes.votingTimer = settings.votingTimer;
			}
			if (settings.targetScore !== gameState.target_score) {
				changes.targetScore = settings.targetScore;
			}

			if (Object.keys(changes).length > 0) {
				await updateGameSettings(changes);
			} else {
				setIsOpen(false);
			}
		} catch (error) {
			console.error("Failed to save settings:", error);
		}
	};

	const handleCancel = () => {
		// Reset to current game state
		setSettings({
			maxPlayers: gameState.max_players,
			submissionTimer: gameState.submission_timer,
			votingTimer: gameState.voting_timer,
			targetScore: gameState.target_score,
		});
		setIsOpen(false);
	};

	// Only show for host and in lobby phase
	if (!isHost || gameState.phase !== "lobby") {
		return null;
	}

	return (
		<div className={`relative ${className}`}>
			{/* Settings Button */}
			<button
				onClick={() => setIsOpen(true)}
				className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
			>
				<span>⚙️</span>
				<span>Game Settings</span>
			</button>

			{/* Settings Modal */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black bg-opacity-50 z-40"
							onClick={handleCancel}
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="fixed inset-0 z-50 flex items-center justify-center p-4"
						>
							<div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
								{/* Header */}
								<div className="flex items-center justify-between p-6 border-b">
									<h2 className="text-xl font-semibold text-gray-900">
										Game Settings
									</h2>
									<button
										onClick={handleCancel}
										className="text-gray-400 hover:text-gray-600 text-2xl"
									>
										×
									</button>
								</div>

								{/* Content */}
								<div className="p-6 space-y-6">
									{/* Max Players */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Maximum Players
										</label>
										<div className="flex items-center space-x-4">
											<input
												type="range"
												min={GAME_LIMITS.MIN_PLAYERS}
												max={GAME_LIMITS.MAX_PLAYERS}
												value={settings.maxPlayers}
												onChange={(e) =>
													handleSettingChange(
														"maxPlayers",
														parseInt(e.target.value)
													)
												}
												className="flex-1"
											/>
											<span className="w-8 text-center font-medium">
												{settings.maxPlayers}
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{GAME_LIMITS.MIN_PLAYERS}-{GAME_LIMITS.MAX_PLAYERS}{" "}
											players
										</p>
									</div>

									{/* Target Score */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Target Score to Win
										</label>
										<div className="flex items-center space-x-4">
											<input
												type="range"
												min={GAME_LIMITS.MIN_TARGET_SCORE}
												max={GAME_LIMITS.MAX_TARGET_SCORE}
												value={settings.targetScore}
												onChange={(e) =>
													handleSettingChange(
														"targetScore",
														parseInt(e.target.value)
													)
												}
												className="flex-1"
											/>
											<span className="w-8 text-center font-medium">
												{settings.targetScore}
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{GAME_LIMITS.MIN_TARGET_SCORE}-
											{GAME_LIMITS.MAX_TARGET_SCORE} points
										</p>
									</div>

									{/* Submission Timer */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Submission Timer
										</label>
										<div className="flex items-center space-x-4">
											<input
												type="range"
												min={30}
												max={300}
												step={15}
												value={settings.submissionTimer}
												onChange={(e) =>
													handleSettingChange(
														"submissionTimer",
														parseInt(e.target.value)
													)
												}
												className="flex-1"
											/>
											<span className="w-12 text-center font-medium">
												{settings.submissionTimer}s
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-1">30-300 seconds</p>
									</div>

									{/* Voting Timer */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Voting Timer
										</label>
										<div className="flex items-center space-x-4">
											<input
												type="range"
												min={15}
												max={120}
												step={5}
												value={settings.votingTimer}
												onChange={(e) =>
													handleSettingChange(
														"votingTimer",
														parseInt(e.target.value)
													)
												}
												className="flex-1"
											/>
											<span className="w-12 text-center font-medium">
												{settings.votingTimer}s
											</span>
										</div>
										<p className="text-xs text-gray-500 mt-1">15-120 seconds</p>
									</div>
								</div>

								{/* Footer */}
								<div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
									<button
										onClick={handleCancel}
										disabled={isUpdatingSettings}
										className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										onClick={handleSaveSettings}
										disabled={isUpdatingSettings}
										className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
									>
										{isUpdatingSettings && (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										)}
										<span>Save Settings</span>
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
