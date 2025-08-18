"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

		if (!formData.playerName.trim()) {
			newErrors.playerName = "Name required!";
		} else if (
			formData.playerName.length > GAME_LIMITS.MAX_PLAYER_NAME_LENGTH
		) {
			newErrors.playerName = `Too long! Max ${GAME_LIMITS.MAX_PLAYER_NAME_LENGTH} chars`;
		}

		if (!formData.roomCode.trim()) {
			newErrors.roomCode = "Room code required!";
		} else if (!isValidRoomCode(formData.roomCode.toUpperCase())) {
			newErrors.roomCode = "Invalid code format!";
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
			const response = await fetch("/api/games/join", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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
				<div
					className="absolute -top-2 -left-2 text-lg animate-spin"
					style={{ animationDuration: "3s" }}
				>
					🎭
				</div>
				<div className="absolute -top-2 -right-2 text-lg chaos-float">🎮</div>

				<h3 className="neon-heading neon-text-magenta text-sm mb-3 graffiti-scribble">
					WHO ARE YOU?
				</h3>

				<input
					type="text"
					value={formData.playerName}
					onChange={(e) => handleInputChange("playerName", e.target.value)}
					className={`w-full px-3 py-2 bg-surface-darker border-2 rounded-arcade text-white placeholder-soft-lavender/50 font-body focus:outline-none transition-all duration-300 text-sm ${
						errors.playerName
							? "border-neon-magenta shadow-neon-magenta chaos-shake"
							: "border-electric-blue/50 focus:border-neon-magenta focus:shadow-neon-magenta"
					}`}
					placeholder="Your player name..."
					maxLength={GAME_LIMITS.MAX_PLAYER_NAME_LENGTH}
					disabled={isLoading}
				/>
				{errors.playerName && (
					<p className="mt-1 text-xs text-neon-magenta font-body chaos-glitch">
						💥 {errors.playerName}
					</p>
				)}
			</motion.div>

			{/* Room Code Section */}
			<motion.div
				className="chaos-border rounded-arcade p-3 relative"
				whileHover={{ scale: 1.02 }}
			>
				<div className="absolute -top-2 -left-2 text-lg chaos-shake">🔑</div>
				<div className="absolute -top-2 -right-2 text-lg animate-bounce">
					🚪
				</div>

				<h3 className="neon-heading neon-text-cyan text-sm mb-3 strike-through">
					SECRET CODE
				</h3>

				<input
					type="text"
					value={formData.roomCode}
					onChange={(e) => handleInputChange("roomCode", e.target.value)}
					className={`w-full px-3 py-3 bg-surface-darker border-2 rounded-arcade text-white placeholder-soft-lavender/50 focus:outline-none transition-all duration-300 text-center text-xl font-display font-bold tracking-[0.2em] ${
						errors.roomCode
							? "border-neon-magenta shadow-neon-magenta chaos-shake"
							: "border-electric-blue/50 focus:border-neon-cyan focus:shadow-neon-cyan"
					}`}
					placeholder="ABC123"
					maxLength={GAME_LIMITS.ROOM_CODE_LENGTH}
					disabled={isLoading}
					style={{ textTransform: "uppercase" }}
				/>
				{errors.roomCode && (
					<p className="mt-1 text-xs text-neon-magenta font-body chaos-glitch">
						💥 {errors.roomCode}
					</p>
				)}
				<p className="mt-1 text-xs text-soft-lavender font-body text-center">
					Get the code from your host! 🎪
				</p>
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
				className="w-full neon-button border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-stage disabled:opacity-50 disabled:cursor-not-allowed py-3 relative overflow-hidden"
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
			>
				{/* Chaotic background elements */}
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-1 left-2 text-xs">🎮</div>
					<div className="absolute top-1 right-2 text-xs">💫</div>
					<div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
						🚀
					</div>
				</div>

				<span className="relative z-10">
					{isLoading ? "🌪️ JOINING CHAOS..." : "🎪 JOIN THE MAYHEM"}
				</span>
			</motion.button>
		</form>
	);
}
