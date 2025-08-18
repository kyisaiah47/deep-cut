"use client";

import { useState } from "react";
import { isValidRoomCode } from "@/lib/game-utils";
import { GAME_LIMITS } from "@/lib/constants";

interface JoinGameFormProps {
	onGameJoined: (roomCode: string, playerId: string) => void;
}

interface FormData {
	playerName: string;
	roomCode: string;
}

interface FormErrors {
	playerName?: string;
	roomCode?: string;
	general?: string;
}

export function JoinGameForm({ onGameJoined }: JoinGameFormProps) {
	const [formData, setFormData] = useState<FormData>({
		playerName: "",
		roomCode: "",
	});

	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		// Validate player name
		if (!formData.playerName.trim()) {
			newErrors.playerName = "Player name is required";
		} else if (
			formData.playerName.length > GAME_LIMITS.MAX_PLAYER_NAME_LENGTH
		) {
			newErrors.playerName = `Player name must be ${GAME_LIMITS.MAX_PLAYER_NAME_LENGTH} characters or less`;
		}

		// Validate room code
		if (!formData.roomCode.trim()) {
			newErrors.roomCode = "Room code is required";
		} else if (!isValidRoomCode(formData.roomCode.toUpperCase())) {
			newErrors.roomCode =
				"Room code must be 6 characters (letters and numbers)";
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
			const response = await fetch("/api/games/join", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					playerName: formData.playerName.trim(),
					roomCode: formData.roomCode.toUpperCase(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to join game");
			}

			onGameJoined(data.roomCode, data.playerId);
		} catch (error) {
			console.error("Error joining game:", error);
			setErrors({
				general: error instanceof Error ? error.message : "Failed to join game",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: field === "roomCode" ? value.toUpperCase() : value,
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
					className="block text-sm font-display font-bold text-neon-magenta mb-3 uppercase tracking-wide"
				>
					🎮 Your Name
				</label>
				<input
					type="text"
					id="playerName"
					value={formData.playerName}
					onChange={(e) => handleInputChange("playerName", e.target.value)}
					className={`w-full px-4 py-3 bg-surface-darker border-2 rounded-arcade text-white placeholder-soft-lavender/50 font-body focus:outline-none transition-all duration-300 ${
						errors.playerName
							? "border-neon-magenta shadow-neon-magenta"
							: "border-electric-blue/50 focus:border-neon-magenta focus:shadow-neon-magenta"
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

			{/* Room Code */}
			<div>
				<label
					htmlFor="roomCode"
					className="block text-sm font-display font-bold text-neon-cyan mb-3 uppercase tracking-wide"
				>
					🔑 Room Code
				</label>
				<input
					type="text"
					id="roomCode"
					value={formData.roomCode}
					onChange={(e) => handleInputChange("roomCode", e.target.value)}
					className={`w-full px-4 py-4 bg-surface-darker border-2 rounded-arcade text-white placeholder-soft-lavender/50 focus:outline-none transition-all duration-300 text-center text-2xl font-display font-bold tracking-[0.3em] ${
						errors.roomCode
							? "border-neon-magenta shadow-neon-magenta"
							: "border-electric-blue/50 focus:border-neon-cyan focus:shadow-neon-cyan"
					}`}
					placeholder="ABC123"
					maxLength={GAME_LIMITS.ROOM_CODE_LENGTH}
					disabled={isLoading}
					style={{ textTransform: "uppercase" }}
				/>
				{errors.roomCode && (
					<p className="mt-2 text-sm text-neon-magenta font-body">
						{errors.roomCode}
					</p>
				)}
				<p className="mt-2 text-xs text-soft-lavender font-body text-center">
					Enter the 6-character room code shared by the host
				</p>
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
				className="w-full neon-button border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-stage disabled:opacity-50 disabled:cursor-not-allowed py-4"
			>
				{isLoading ? "🚀 Joining Game..." : "🎪 Join Game"}
			</button>
		</form>
	);
}
