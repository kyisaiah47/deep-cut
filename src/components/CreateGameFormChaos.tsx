"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

		if (!settings.playerName.trim()) {
			newErrors.playerName = "Name required!";
		} else if (
			settings.playerName.length > GAME_LIMITS.MAX_PLAYER_NAME_LENGTH
		) {
			newErrors.playerName = `Too long! Max ${GAME_LIMITS.MAX_PLAYER_NAME_LENGTH} chars`;
		}

		if (
			settings.maxPlayers < GAME_LIMITS.MIN_PLAYERS ||
			settings.maxPlayers > GAME_LIMITS.MAX_PLAYERS
		) {
			newErrors.maxPlayers = `${GAME_LIMITS.MIN_PLAYERS}-${GAME_LIMITS.MAX_PLAYERS} players only!`;
		}

		if (
			settings.targetScore < GAME_LIMITS.MIN_TARGET_SCORE ||
			settings.targetScore > GAME_LIMITS.MAX_TARGET_SCORE
		) {
			newErrors.targetScore = `${GAME_LIMITS.MIN_TARGET_SCORE}-${GAME_LIMITS.MAX_TARGET_SCORE} points!`;
		}

		if (settings.submissionTimer < 30 || settings.submissionTimer > 300) {
			newErrors.submissionTimer = "30-300 seconds!";
		}

		if (settings.votingTimer < 15 || settings.votingTimer > 120) {
			newErrors.votingTimer = "15-120 seconds!";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsLoading(true);
		setErrors({});

		try {
			const response = await fetch("/api/games/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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
		setSettings((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-3"
		>
			{/* Player Identity Section */}
			<motion.div
				className="chaos-border rounded-arcade p-3 relative"
				whileHover={{ scale: 1.02 }}
			>
				<div className="absolute -top-2 -left-2 text-lg animate-bounce">🎭</div>
				<div className="absolute -top-2 -right-2 text-lg chaos-spin">⚡</div>

				<h3 className="neon-heading neon-text-cyan text-sm mb-3 strike-through">
					WHO ARE YOU?
				</h3>

				<input
					type="text"
					value={settings.playerName}
					onChange={(e) => handleInputChange("playerName", e.target.value)}
					className={`w-full px-3 py-2 bg-surface-darker border-2 rounded-arcade text-white placeholder-soft-lavender/50 font-body focus:outline-none transition-all duration-300 text-sm ${
						errors.playerName
							? "border-neon-magenta shadow-neon-magenta chaos-shake"
							: "border-electric-blue/50 focus:border-neon-cyan focus:shadow-neon-cyan"
					}`}
					placeholder="Your epic name..."
					maxLength={GAME_LIMITS.MAX_PLAYER_NAME_LENGTH}
					disabled={isLoading}
				/>
				{errors.playerName && (
					<p className="mt-1 text-xs text-neon-magenta font-body chaos-glitch">
						💥 {errors.playerName}
					</p>
				)}
			</motion.div>

			{/* Game Rules Section */}
			<motion.div
				className="chaos-border rounded-arcade p-3 relative"
				whileHover={{ scale: 1.02 }}
			>
				<div className="absolute -top-2 -left-2 text-lg chaos-float">🎮</div>
				<div className="absolute -top-2 -right-2 text-lg animate-pulse">🎯</div>

				<h3 className="neon-heading neon-text-lime text-sm mb-3 graffiti-underline">
					GAME RULES
				</h3>

				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-xs font-display font-bold text-soft-lavender mb-1 uppercase">
							👥 Players
						</label>
						<input
							type="number"
							value={settings.maxPlayers}
							onChange={(e) =>
								handleInputChange("maxPlayers", parseInt(e.target.value))
							}
							min={GAME_LIMITS.MIN_PLAYERS}
							max={GAME_LIMITS.MAX_PLAYERS}
							className={`w-full px-2 py-2 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 text-sm ${
								errors.maxPlayers
									? "border-neon-magenta shadow-neon-magenta"
									: "border-electric-blue/50 focus:border-acid-lime focus:shadow-neon-lime"
							}`}
							disabled={isLoading}
						/>
					</div>

					<div>
						<label className="block text-xs font-display font-bold text-soft-lavender mb-1 uppercase">
							🏆 Score
						</label>
						<input
							type="number"
							value={settings.targetScore}
							onChange={(e) =>
								handleInputChange("targetScore", parseInt(e.target.value))
							}
							min={GAME_LIMITS.MIN_TARGET_SCORE}
							max={GAME_LIMITS.MAX_TARGET_SCORE}
							className={`w-full px-2 py-2 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 text-sm ${
								errors.targetScore
									? "border-neon-magenta shadow-neon-magenta"
									: "border-electric-blue/50 focus:border-sun-yellow focus:shadow-[0_0_20px_rgba(255,210,58,0.5)]"
							}`}
							disabled={isLoading}
						/>
					</div>
				</div>

				{(errors.maxPlayers || errors.targetScore) && (
					<div className="mt-2 space-y-1">
						{errors.maxPlayers && (
							<p className="text-xs text-neon-magenta font-body">
								💥 {errors.maxPlayers}
							</p>
						)}
						{errors.targetScore && (
							<p className="text-xs text-neon-magenta font-body">
								💥 {errors.targetScore}
							</p>
						)}
					</div>
				)}
			</motion.div>

			{/* Time Chaos Section */}
			<motion.div
				className="chaos-border rounded-arcade p-3 relative"
				whileHover={{ scale: 1.02 }}
			>
				<div className="absolute -top-2 -left-2 text-lg chaos-shake">⏰</div>
				<div className="absolute -top-2 -right-2 text-lg animate-bounce">
					💥
				</div>

				<h3 className="neon-heading neon-text-magenta text-sm mb-3 strike-through">
					TIME PRESSURE
				</h3>

				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-xs font-display font-bold text-soft-lavender mb-1 uppercase">
							⚡ Submit
						</label>
						<input
							type="number"
							value={settings.submissionTimer}
							onChange={(e) =>
								handleInputChange("submissionTimer", parseInt(e.target.value))
							}
							min={30}
							max={300}
							step={15}
							className={`w-full px-2 py-2 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 text-sm ${
								errors.submissionTimer
									? "border-neon-magenta shadow-neon-magenta"
									: "border-electric-blue/50 focus:border-neon-cyan focus:shadow-neon-cyan"
							}`}
							disabled={isLoading}
						/>
					</div>

					<div>
						<label className="block text-xs font-display font-bold text-soft-lavender mb-1 uppercase">
							🗳️ Vote
						</label>
						<input
							type="number"
							value={settings.votingTimer}
							onChange={(e) =>
								handleInputChange("votingTimer", parseInt(e.target.value))
							}
							min={15}
							max={120}
							step={15}
							className={`w-full px-2 py-2 bg-surface-darker border-2 rounded-arcade text-white font-body focus:outline-none transition-all duration-300 text-sm ${
								errors.votingTimer
									? "border-neon-magenta shadow-neon-magenta"
									: "border-electric-blue/50 focus:border-neon-magenta focus:shadow-neon-magenta"
							}`}
							disabled={isLoading}
						/>
					</div>
				</div>

				{(errors.submissionTimer || errors.votingTimer) && (
					<div className="mt-2 space-y-1">
						{errors.submissionTimer && (
							<p className="text-xs text-neon-magenta font-body">
								💥 {errors.submissionTimer}
							</p>
						)}
						{errors.votingTimer && (
							<p className="text-xs text-neon-magenta font-body">
								💥 {errors.votingTimer}
							</p>
						)}
					</div>
				)}
			</motion.div>

			{/* General Error */}
			{errors.general && (
				<motion.div
					className="p-3 bg-surface-darker border-2 border-neon-magenta rounded-arcade shadow-neon-magenta chaos-shake"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
				>
					<p className="text-xs text-neon-magenta font-body">
						⚠️ {errors.general}
					</p>
				</motion.div>
			)}

			{/* Chaotic Submit Button */}
			<motion.button
				type="submit"
				disabled={isLoading}
				className="w-full neon-button border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-stage disabled:opacity-50 disabled:cursor-not-allowed py-3 relative overflow-hidden"
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
			>
				{/* Chaotic background elements */}
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-1 left-2 text-xs">🚀</div>
					<div className="absolute top-1 right-2 text-xs">💥</div>
					<div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
						⚡
					</div>
				</div>

				<span className="relative z-10">
					{isLoading ? "🌪️ CREATING CHAOS..." : "🎪 UNLEASH THE CHAOS"}
				</span>
			</motion.button>
		</form>
	);
}
