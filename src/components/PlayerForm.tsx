"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

const kiroMessages = [
	"Kiro sees into your soul...",
	"Only the bold survive the cut.",
	"Whispers of chaos fill the void...",
	"Welcome to your reckoning.",
];

export default function PlayerForm({
	onSubmit,
}: {
	onSubmit: (name: string) => void;
}) {
	const [name, setName] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		const rotate = () => {
			setMessage(kiroMessages[Math.floor(Math.random() * kiroMessages.length)]);
		};
		rotate();
		const interval = setInterval(rotate, 5000);
		return () => clearInterval(interval);
	}, []);

	const handleSubmit = () => {
		if (name.trim()) {
			confetti({ spread: 70, particleCount: 120, origin: { y: 0.6 } });
			onSubmit(name.trim());
		} else {
			setError("Name cannot be empty.");
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			{/* Floating Emojis */}
			{["💀", "✂️", "🎭"].map((emoji, i) => (
				<motion.div
					key={i}
					className="absolute text-7xl pointer-events-none"
					style={{ top: `${20 + i * 20}%`, left: `${20 + i * 30}%` }}
					animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
					transition={{ repeat: Infinity, duration: 4 + i }}
				>
					{emoji}
				</motion.div>
			))}

			{/* Neon Glow & Form */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800/90 backdrop-blur-md max-w-sm w-full space-y-4 border border-zinc-700 relative z-10"
			>
				<h2 className="text-xl font-bold text-white animate-pulse drop-shadow">
					Enter Your Name
				</h2>
				<input
					type="text"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setError("");
					}}
					placeholder="Your name..."
					className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center"
				/>
				<Button
					onClick={handleSubmit}
					className="w-full"
				>
					Continue
				</Button>
				{error && <p className="text-sm text-red-400 italic">{error}</p>}
				<p className="text-sm text-zinc-400 italic">{message}</p>
			</motion.div>

			{/* Watermark */}
			<motion.div
				className="absolute bottom-4 right-4 text-zinc-600 text-xs z-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.6 }}
				transition={{ delay: 2 }}
			>
				💀 Deep Cut
			</motion.div>
		</main>
	);
}
