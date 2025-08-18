import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmojiStormProps {
	isActive: boolean;
	duration?: number;
	intensity?: "low" | "medium" | "high" | "chaos";
	type?: "celebration" | "meme" | "chaos" | "winner";
	onComplete?: () => void;
}

const CELEBRATION_EMOJIS = [
	"🎉",
	"🎊",
	"🏆",
	"👑",
	"💯",
	"🔥",
	"⭐",
	"🌟",
	"💫",
	"✨",
];
const MEME_EMOJIS = [
	"😂",
	"💀",
	"🤡",
	"👾",
	"🎮",
	"🔥",
	"💯",
	"🚀",
	"⚡",
	"💥",
];
const CHAOS_EMOJIS = [
	"💀",
	"🔥",
	"😂",
	"⚡",
	"👾",
	"🎲",
	"💥",
	"🤖",
	"🎪",
	"🎯",
	"🚀",
	"💫",
];
const WINNER_EMOJIS = [
	"👑",
	"🏆",
	"🥇",
	"🎉",
	"🎊",
	"💯",
	"🔥",
	"⭐",
	"🌟",
	"💫",
	"✨",
	"🎪",
];

export function EmojiStorm({
	isActive,
	duration = 3000,
	intensity = "medium",
	type = "celebration",
	onComplete,
}: EmojiStormProps) {
	const [emojis, setEmojis] = useState<
		Array<{
			id: string;
			emoji: string;
			x: number;
			y: number;
			rotation: number;
			scale: number;
			velocity: { x: number; y: number };
			spin: number;
		}>
	>([]);

	const getEmojiSet = () => {
		switch (type) {
			case "celebration":
				return CELEBRATION_EMOJIS;
			case "meme":
				return MEME_EMOJIS;
			case "chaos":
				return CHAOS_EMOJIS;
			case "winner":
				return WINNER_EMOJIS;
		}
	};

	const getEmojiCount = () => {
		switch (intensity) {
			case "low":
				return 20;
			case "medium":
				return 40;
			case "high":
				return 60;
			case "chaos":
				return 100;
		}
	};

	useEffect(() => {
		if (!isActive) {
			setEmojis([]);
			return;
		}

		const emojiSet = getEmojiSet();
		const count = getEmojiCount();
		const newEmojis = [];

		for (let i = 0; i < count; i++) {
			newEmojis.push({
				id: `emoji-${i}`,
				emoji: emojiSet[Math.floor(Math.random() * emojiSet.length)],
				x: Math.random() * window.innerWidth,
				y: -50 - Math.random() * 200,
				rotation: Math.random() * 360,
				scale: 0.5 + Math.random() * 1.5,
				velocity: {
					x: (Math.random() - 0.5) * 8,
					y: Math.random() * 3 + 2,
				},
				spin: (Math.random() - 0.5) * 720,
			});
		}

		setEmojis(newEmojis);

		const timeout = setTimeout(() => {
			setEmojis([]);
			onComplete?.();
		}, duration);

		return () => clearTimeout(timeout);
	}, [isActive, duration, intensity, type, onComplete]);

	return (
		<div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
			<AnimatePresence>
				{emojis.map((emoji) => (
					<motion.div
						key={emoji.id}
						initial={{
							x: emoji.x,
							y: emoji.y,
							rotate: emoji.rotation,
							scale: 0,
						}}
						animate={{
							x: emoji.x + emoji.velocity.x * 100,
							y: window.innerHeight + 100,
							rotate: emoji.rotation + emoji.spin,
							scale: [0, emoji.scale, emoji.scale, 0],
						}}
						exit={{
							opacity: 0,
							scale: 0,
						}}
						transition={{
							duration: duration / 1000,
							ease: "easeOut",
							times: [0, 0.1, 0.9, 1],
						}}
						className="absolute text-4xl select-none"
						style={{
							filter:
								intensity === "chaos"
									? `hue-rotate(${Math.random() * 360}deg) saturate(1.5)`
									: "none",
						}}
					>
						{emoji.emoji}
					</motion.div>
				))}
			</AnimatePresence>

			{/* Additional chaos effects for high intensity */}
			{(intensity === "high" || intensity === "chaos") && isActive && (
				<div className="absolute inset-0">
					{/* Screen flash effect */}
					<motion.div
						className="absolute inset-0 bg-white"
						animate={{
							opacity: [0, 0.3, 0, 0.2, 0],
						}}
						transition={{
							duration: 0.5,
							repeat: 3,
							repeatDelay: 0.3,
						}}
					/>

					{/* Neon pulse rings */}
					{Array.from({ length: 3 }).map((_, i) => (
						<motion.div
							key={`ring-${i}`}
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-neon-cyan rounded-full"
							animate={{
								scale: [0, 4],
								opacity: [1, 0],
							}}
							transition={{
								duration: 2,
								delay: i * 0.3,
								repeat: intensity === "chaos" ? Infinity : 0,
								repeatDelay: 1,
							}}
							style={{
								width: "100px",
								height: "100px",
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// Preset emoji storms for specific game events
export function WinnerEmojiStorm({
	isActive,
	onComplete,
}: {
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<EmojiStorm
			isActive={isActive}
			duration={4000}
			intensity="high"
			type="winner"
			onComplete={onComplete}
		/>
	);
}

export function MemeEmojiStorm({
	isActive,
	onComplete,
}: {
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<EmojiStorm
			isActive={isActive}
			duration={2500}
			intensity="chaos"
			type="meme"
			onComplete={onComplete}
		/>
	);
}

export function CelebrationEmojiStorm({
	isActive,
	onComplete,
}: {
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<EmojiStorm
			isActive={isActive}
			duration={3000}
			intensity="medium"
			type="celebration"
			onComplete={onComplete}
		/>
	);
}
