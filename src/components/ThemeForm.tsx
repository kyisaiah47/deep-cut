"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import FloatingBackground from "./FloatingBackground";

const kiroMessages = [
	"Choose your arena of destruction...",
	"What realm shall we corrupt?",
	"Pick the battlefield for chaos...",
	"The theme shapes your doom.",
];

export default function ThemeForm({
	onSubmit,
}: {
	onSubmit: (theme: string) => void;
}) {
	const [selectedTheme, setSelectedTheme] = useState("");
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
		if (selectedTheme.trim()) {
			confetti({ spread: 70, particleCount: 120, origin: { y: 0.6 } });
			onSubmit(selectedTheme.trim());
		} else {
			setError("Please enter a theme.");
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			<FloatingBackground />
			{/* Theme Selection Form */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="text-center p-6 rounded-2xl shadow-xl bg-zinc-800/90 backdrop-blur-md max-w-md w-full space-y-4 border border-zinc-700 relative z-10"
			>
				<h2 className="text-xl font-bold text-white animate-pulse drop-shadow">
					Choose Your Theme
				</h2>
				<p className="text-sm text-zinc-400">
					Enter any theme you want - it can be a word, phrase, or concept!
				</p>
				<div className="space-y-3">
					<input
						type="text"
						value={selectedTheme}
						onChange={(e) => {
							setSelectedTheme(e.target.value);
							setError("");
						}}
						placeholder="e.g. 'Embarrassing childhood memories', 'Work drama', 'Secret crushes'..."
						className="w-full px-4 py-3 rounded-lg bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center border-2 border-zinc-600 focus:border-pink-500 transition-colors hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
						maxLength={100}
					/>
				</div>
				<Button
					onClick={handleSubmit}
					disabled={!selectedTheme.trim()}
					className="w-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
				>
					Continue
				</Button>
				{error && <p className="text-sm text-red-400 italic">{error}</p>}{" "}
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
