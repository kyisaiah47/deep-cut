"use client";

import { useState } from "react";
import { DEFAULT_GAME_SETTINGS } from "@/lib/game-utils";
import { GAME_LIMITS } from "@/lib/constants";

interface CreateGameFormProps {
	onGameCreated: (roomCode: string, playerId: string) => void;
}

interface GameSettings {
	playerName: string;
	maxPlayers: number;
	targetScore: number;
	submissionTimer: number;
	votingTimer: number;
}

interface FormErrors {
	playerName?: string;
	maxPlayers?: string;
	targetScore?: string;
	submissionTimer?: string;
	votingTimer?: string;
	general?: string;
}

export function CreateGameForm({ onGameCreated }: CreateGameFormProps) {
	const [settings, setSettings] = useState<GameSettings>({
		playerName: "",
		maxPlayers: DEFAULT_GAME_SETTINGS.maxPlayers,
		targetScore: DEFAULT_GAME_SETTINGS.targetScore,
		submissionTimer: DEFAULT_GAME_SETTINGS.submissionTimer,
		votingTimer: DEFAULT_GAME_SETTINGS.votingTimer,
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		// Validate player name
		if (!settings.playerName.trim()) {
			newErrors.playerName = "Player name is required";
		} else if (
			settings.playerName.length > GAME_LIMITS.MAX_PLAYER_NAME_LENGTH
		) {
			newErrors.playerName = `Player name must be ${GAME_LIMITS.MAX_PLAYER_NAME_LENGTH} characters or less`;
		}

		// Validate max players
		if (
			settings.maxPlayers < GAME_LIMITS.MIN_PLAYERS ||
			settings.maxPlayers > GAME_LIMITS.MAX_PLAYERS
		) {
			newErrors.maxPlayers = `Max players must be between ${GAME_LIMITS.MIN_PLAYERS} and ${GAME_LIMITS.MAX_PLAYERS}`;
		}

		// Validate target score
		if (
			settings.targetScore < GAME_LIMITS.MIN_TARGET_SCORE ||
			settings.targetScore > GAME_LIMITS.MAX_TARGET_SCORE
		) {
			newErrors.targetScore = `Target score must be between ${GAME_LIMITS.MIN_TARGET_SCORE} and ${GAME_LIMITS.MAX_TARGET_SCORE}`;
		}

		// Validate timers
		if (settings.submissionTimer < 30 || settings.submissionTimer > 300) {
			newErrors.submissionTimer =
				"Submission timer must be between 30 and 300 seconds";
		}

		if (settings.votingTimer < 15 || settings.votingTimer > 120) {
			newErrors.votingTimer = "Voting timer must be between 15 and 120 seconds";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setErrors({});

		try {
			const response = await fetch("/api/games/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					playerName: settings.playerName.trim(),
					gameSettings: {
						maxPlayers: settings.maxPlayers,
						targetScore: settings.targetScore,
						submissionTimer: settings.submissionTimer,
						votingTimer: settings.votingTimer,
					},
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to create game");
			}

			onGameCreated(data.roomCode, data.playerId);
		} catch (error) {
			console.error("Error creating game:", error);
			setErrors({
				general:
					error instanceof Error ? error.message : "Failed to create game",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (
		field: keyof GameSettings,
		value: string | number
	) => {
		setSettings((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear field-specific error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: undefined,
			}));
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-4"
		>
			{/* Player Name */}
			<div>
				<label
					htmlFor="playerName"
					className="block text-sm font-medium text-white mb-2"
				>
					Your Name
				</label>
				<input
					type="text"
					id="playerName"
					value={settings.playerName}
					onChange={(e) => handleInputChange("playerName", e.target.value)}
					className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
						errors.playerName ? "border-red-500" : "border-white/20"
					}`}
					placeholder="Enter your name"
					maxLength={GAME_LIMITS.MAX_PLAYER_NAME_LENGTH}
					disabled={isLoading}
				/>
				{errors.playerName && (
					<p className="mt-1 text-sm text-red-400">{errors.playerName}</p>
				)}
			</div>

			{/* Game Settings */}
			<div className="space-y-4 pt-4 border-t border-white/20">
				<h3 className="text-lg font-medium text-white">Game Settings</h3>

				{/* Max Players */}
				<div>
					<label
						htmlFor="maxPlayers"
						className="block text-sm font-medium text-white mb-2"
					>
						Max Players ({GAME_LIMITS.MIN_PLAYERS}-{GAME_LIMITS.MAX_PLAYERS})
					</label>
					<input
						type="number"
						id="maxPlayers"
						value={settings.maxPlayers}
						onChange={(e) =>
							handleInputChange("maxPlayers", parseInt(e.target.value))
						}
						min={GAME_LIMITS.MIN_PLAYERS}
						max={GAME_LIMITS.MAX_PLAYERS}
						className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							errors.maxPlayers ? "border-red-500" : "border-white/20"
						}`}
						disabled={isLoading}
					/>
					{errors.maxPlayers && (
						<p className="mt-1 text-sm text-red-400">{errors.maxPlayers}</p>
					)}
				</div>

				{/* Target Score */}
				<div>
					<label
						htmlFor="targetScore"
						className="block text-sm font-medium text-white mb-2"
					>
						Target Score ({GAME_LIMITS.MIN_TARGET_SCORE}-
						{GAME_LIMITS.MAX_TARGET_SCORE})
					</label>
					<input
						type="number"
						id="targetScore"
						value={settings.targetScore}
						onChange={(e) =>
							handleInputChange("targetScore", parseInt(e.target.value))
						}
						min={GAME_LIMITS.MIN_TARGET_SCORE}
						max={GAME_LIMITS.MAX_TARGET_SCORE}
						className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							errors.targetScore ? "border-red-500" : "border-white/20"
						}`}
						disabled={isLoading}
					/>
					{errors.targetScore && (
						<p className="mt-1 text-sm text-red-400">{errors.targetScore}</p>
					)}
				</div>

				{/* Submission Timer */}
				<div>
					<label
						htmlFor="submissionTimer"
						className="block text-sm font-medium text-white mb-2"
					>
						Submission Timer (30-300 seconds)
					</label>
					<input
						type="number"
						id="submissionTimer"
						value={settings.submissionTimer}
						onChange={(e) =>
							handleInputChange("submissionTimer", parseInt(e.target.value))
						}
						min={30}
						max={300}
						step={15}
						className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							errors.submissionTimer ? "border-red-500" : "border-white/20"
						}`}
						disabled={isLoading}
					/>
					{errors.submissionTimer && (
						<p className="mt-1 text-sm text-red-400">
							{errors.submissionTimer}
						</p>
					)}
				</div>

				{/* Voting Timer */}
				<div>
					<label
						htmlFor="votingTimer"
						className="block text-sm font-medium text-white mb-2"
					>
						Voting Timer (15-120 seconds)
					</label>
					<input
						type="number"
						id="votingTimer"
						value={settings.votingTimer}
						onChange={(e) =>
							handleInputChange("votingTimer", parseInt(e.target.value))
						}
						min={15}
						max={120}
						step={15}
						className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							errors.votingTimer ? "border-red-500" : "border-white/20"
						}`}
						disabled={isLoading}
					/>
					{errors.votingTimer && (
						<p className="mt-1 text-sm text-red-400">{errors.votingTimer}</p>
					)}
				</div>
			</div>

			{/* General Error */}
			{errors.general && (
				<div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
					<p className="text-sm text-red-400">{errors.general}</p>
				</div>
			)}

			{/* Submit Button */}
			<button
				type="submit"
				disabled={isLoading}
				className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
			>
				{isLoading ? "Creating Game..." : "Create Game"}
			</button>
		</form>
	);
}
