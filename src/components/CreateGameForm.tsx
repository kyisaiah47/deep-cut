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
					className="block text-sm font-display font-bold text-neon-cyan mb-3 uppercase tracking-wide"
				>
					⚡ Your Name
				</label>
				<input
					type="text"
					id="playerName"
					value={settings.playerName}
					onChange={(e) => handleInputChange("playerName", e.target.value)}
					className={`w-full px-4 py-3 bg-surface-darker border-2 rounded-arcade text-white placeholder-soft-lavender/50 font-body focus:outline-none transition-all duration-300 ${
						errors.playerName
							? "border-neon-magenta shadow-neon-magenta"
							: "border-electric-blue/50 focus:border-neon-cyan focus:shadow-neon-cyan"
					}`}
					placeholder="Enter your player name"
					maxLength={GAME_LIMITS.MAX_PLAYER_NAME_LENGTH}
					disabled={isLoading}
				/>
				{errors.playerName && (
					<p className="mt-2 text-sm text-neon-magenta font-body">
						{errors.playerName}
					</p>
				)}
			</div>

			{/* Game Settings */}
			<div className="space-y-6 pt-6 border-t border-electric-blue/30">
				<h3 className="neon-heading neon-text-lime text-lg">
					🎮 Game Settings
				</h3>

				{/* Max Players */}
				<div>
					<label
						htmlFor="maxPlayers"
						className="block text-sm font-display font-bold text-soft-lavender mb-2 uppercase"
					>
						👥 Max Players ({GAME_LIMITS.MIN_PLAYERS}-{GAME_LIMITS.MAX_PLAYERS})
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
						className={`w-full px-4 py-3 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 ${
							errors.maxPlayers
								? "border-neon-magenta shadow-neon-magenta"
								: "border-electric-blue/50 focus:border-acid-lime focus:shadow-neon-lime"
						}`}
						disabled={isLoading}
					/>
					{errors.maxPlayers && (
						<p className="mt-2 text-sm text-neon-magenta font-body">
							{errors.maxPlayers}
						</p>
					)}
				</div>

				{/* Target Score */}
				<div>
					<label
						htmlFor="targetScore"
						className="block text-sm font-display font-bold text-soft-lavender mb-2 uppercase"
					>
						🏆 Target Score ({GAME_LIMITS.MIN_TARGET_SCORE}-
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
						className={`w-full px-4 py-3 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 ${
							errors.targetScore
								? "border-neon-magenta shadow-neon-magenta"
								: "border-electric-blue/50 focus:border-sun-yellow focus:shadow-[0_0_20px_rgba(255,210,58,0.5)]"
						}`}
						disabled={isLoading}
					/>
					{errors.targetScore && (
						<p className="mt-2 text-sm text-neon-magenta font-body">
							{errors.targetScore}
						</p>
					)}
				</div>

				{/* Submission Timer */}
				<div>
					<label
						htmlFor="submissionTimer"
						className="block text-sm font-display font-bold text-soft-lavender mb-2 uppercase"
					>
						⏱️ Submission Timer (30-300 seconds)
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
						className={`w-full px-4 py-3 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 ${
							errors.submissionTimer
								? "border-neon-magenta shadow-neon-magenta"
								: "border-electric-blue/50 focus:border-neon-cyan focus:shadow-neon-cyan"
						}`}
						disabled={isLoading}
					/>
					{errors.submissionTimer && (
						<p className="mt-2 text-sm text-neon-magenta font-body">
							{errors.submissionTimer}
						</p>
					)}
				</div>

				{/* Voting Timer */}
				<div>
					<label
						htmlFor="votingTimer"
						className="block text-sm font-display font-bold text-soft-lavender mb-2 uppercase"
					>
						🗳️ Voting Timer (15-120 seconds)
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
						className={`w-full px-4 py-3 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 ${
							errors.votingTimer
								? "border-neon-magenta shadow-neon-magenta"
								: "border-electric-blue/50 focus:border-neon-magenta focus:shadow-neon-magenta"
						}`}
						disabled={isLoading}
					/>
					{errors.votingTimer && (
						<p className="mt-2 text-sm text-neon-magenta font-body">
							{errors.votingTimer}
						</p>
					)}
				</div>
			</div>

			{/* General Error */}
			{errors.general && (
				<div className="p-4 bg-surface-darker border-2 border-neon-magenta rounded-arcade shadow-neon-magenta">
					<p className="text-sm text-neon-magenta font-body">
						⚠️ {errors.general}
					</p>
				</div>
			)}

			{/* Submit Button */}
			<button
				type="submit"
				disabled={isLoading}
				className="w-full neon-button border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-stage disabled:opacity-50 disabled:cursor-not-allowed py-4"
			>
				{isLoading ? "🚀 Creating Game..." : "🎪 Create Game"}
			</button>
		</form>
	);
}
