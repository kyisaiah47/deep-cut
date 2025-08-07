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
					className="block text-sm font-medium text-white mb-2"
				>
					Your Name
				</label>
				<input
					type="text"
					id="playerName"
					value={formData.playerName}
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

			{/* Room Code */}
			<div>
				<label
					htmlFor="roomCode"
					className="block text-sm font-medium text-white mb-2"
				>
					Room Code
				</label>
				<input
					type="text"
					id="roomCode"
					value={formData.roomCode}
					onChange={(e) => handleInputChange("roomCode", e.target.value)}
					className={`w-full px-3 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-wider ${
						errors.roomCode ? "border-red-500" : "border-white/20"
					}`}
					placeholder="ABC123"
					maxLength={GAME_LIMITS.ROOM_CODE_LENGTH}
					disabled={isLoading}
					style={{ textTransform: "uppercase" }}
				/>
				{errors.roomCode && (
					<p className="mt-1 text-sm text-red-400">{errors.roomCode}</p>
				)}
				<p className="mt-1 text-xs text-white/60">
					Enter the 6-character room code shared by the host
				</p>
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
				className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
			>
				{isLoading ? "Joining Game..." : "Join Game"}
			</button>
		</form>
	);
}
