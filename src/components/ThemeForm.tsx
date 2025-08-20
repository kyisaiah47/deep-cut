"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import FloatingBackground from "./FloatingBackground";
import { cn } from "@/lib/utils";

const kiroMessages = [
	"Choose your arena of destruction...",
	"What realm shall we corrupt?",
	"Pick the battlefield for chaos...",
	"The theme shapes your doom.",
];

export default function ThemeForm({
	onSubmit,
}: {
	onSubmit: (theme: string) => void | Promise<void>;
}) {
	const [selectedTheme, setSelectedTheme] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const rotate = () => {
			setMessage(kiroMessages[Math.floor(Math.random() * kiroMessages.length)]);
		};
		rotate();
		const interval = setInterval(rotate, 5000);
		return () => clearInterval(interval);
	}, []);

	const handleSubmit = async () => {
		if (selectedTheme.trim()) {
			setIsSubmitting(true);
			setError("");

			try {
				confetti({ spread: 70, particleCount: 120, origin: { y: 0.6 } });
				await onSubmit(selectedTheme.trim());
			} catch (error) {
				console.error("Error submitting theme:", error);
				setError("Failed to save theme. Please try again.");
			} finally {
				setIsSubmitting(false);
			}
		} else {
			setError("Please enter a theme.");
		}
	};

	const handleRandomTheme = async () => {
		setIsGenerating(true);
		setError("");

		try {
			const response = await fetch("/api/generate-random-theme", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `
Generate a fun, weird, or emotionally charged game theme for a chaotic friend group. 
Make it unexpected and slightly unhinged but still appropriate for adults. 
Examples: 'Daddy Issues & Deli Meats', 'Corporate Nightmares', 'Childhood Traumas & Snacks'. 
Just return the theme name only, nothing else.`,
								},
							],
						},
					],
				}),
			});

			if (!response.ok) throw new Error("Gemini API request failed");

			const data = await response.json();
			const theme =
				data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
				"Chaotic Friendship Dynamics";

			setSelectedTheme(theme);
		} catch (error) {
			console.error("Error generating theme:", error);
			// Fallback to predefined chaotic themes
			const fallbackThemes = [
				"Daddy Issues & Deli Meats",
				"Corporate Nightmares",
				"Childhood Traumas & Snacks",
				"Toxic Ex Stories",
				"Family Drama & Fast Food",
				"Quarter Life Crisis Vibes",
				"Awkward First Dates",
				"Embarrassing College Memories",
				"Work Gossip & Wine",
				"Secret Guilty Pleasures",
			];
			const randomTheme =
				fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];
			setSelectedTheme(randomTheme);
		} finally {
			setIsGenerating(false);
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
						className="w-full px-4 py-3 rounded-lg bg-zinc-700 text-white outline-none placeholder:text-zinc-400 text-center border-2 border-zinc-600 focus:border-pink-500 transition-colors"
						maxLength={100}
					/>

					<Button
						onClick={handleRandomTheme}
						disabled={isGenerating}
						className={cn(
							"w-full justify-center rounded-md text-white font-semibold",
							"bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-500 bg-[length:300%_300%] animate-rainbow",
							"hover:brightness-110 transition-all duration-200 ease-in-out",
							"disabled:opacity-50 disabled:cursor-not-allowed"
						)}
					>
						{isGenerating ? (
							<>
								<span className="animate-spin mr-2">🎲</span>
								Summoning chaos...
							</>
						) : (
							<>🎲 I&apos;m feeling chaotic</>
						)}
					</Button>
				</div>
				<Button
					onClick={handleSubmit}
					disabled={!selectedTheme.trim() || isSubmitting}
					className="w-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
				>
					{isSubmitting ? (
						<>
							<span className="animate-spin mr-2">💾</span>
							Saving theme...
						</>
					) : (
						"Continue"
					)}
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
