"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import FloatingBackground from "./FloatingBackground";

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
			<FloatingBackground />
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
				<p className="text-xs text-zinc-500 italic -mt-2">
					💡 Tip: Use the same username if reconnecting to an existing game
				</p>
				<input
					type="text"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setError("");
					}}
					placeholder="Your name..."
					className="w-full px-4 py-2 rounded bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
				/>
				<Button
					onClick={handleSubmit}
					className="w-full hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
