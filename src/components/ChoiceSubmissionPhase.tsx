"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PlayerChoices {
	[player: string]: string[];
}

export default function ChoiceSubmissionPhase({
	prompt,
	theme,
	players,
	currentPlayer,
	onSubmit,
	disabled,
}: {
	prompt: string;
	theme: string;
	players: string[];
	currentPlayer: string;
	onSubmit: (answer: string) => void;
	disabled: boolean;
}) {
	const [playerChoices, setPlayerChoices] = useState<PlayerChoices>({});
	const [selectedChoice, setSelectedChoice] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");

	// Generate choices when component mounts
	useEffect(() => {
		const generateChoices = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/generate-choices", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						prompt,
						theme,
						players,
					}),
				});

				if (response.ok) {
					const data = await response.json();
					setPlayerChoices(data.playerChoices);
				} else {
					setError("Failed to generate choices. Using fallback options.");
					// Fallback choices will be handled by the API
					const fallbackData = await response.json();
					setPlayerChoices(fallbackData.playerChoices || {});
				}
			} catch (err) {
				console.error("Error generating choices:", err);
				setError("Connection error. Using fallback options.");
				// Create basic fallback
				const fallback: PlayerChoices = {};
				players.forEach((player) => {
					fallback[player] = [
						"Something mysteriously hilarious",
						"A chaotic neutral choice",
						"The void whispers this answer",
						"Kiro's personal favorite",
						"The choice that defies explanation",
					];
				});
				setPlayerChoices(fallback);
			} finally {
				setLoading(false);
			}
		};

		generateChoices();
	}, [prompt, theme, players]);

	const handleSubmit = () => {
		if (!selectedChoice) {
			setError("Please select one of Kiro's offerings.");
			return;
		}
		setError("");
		setSubmitted(true);
		onSubmit(selectedChoice);
	};

	const currentPlayerChoices = playerChoices[currentPlayer] || [];

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full"
				/>
				<span className="ml-4 text-white">
					Kiro is crafting your choices...
				</span>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto">
			{/* Player identification */}
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-6"
			>
				<h2 className="text-xl font-semibold text-white mb-2">
					{currentPlayer}
				</h2>
				<p className="text-zinc-400 text-sm">
					Choose from Kiro&apos;s twisted offerings
				</p>
			</motion.div>

			{/* Error message */}
			{error && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="mb-4 p-3 bg-red-900/40 border border-red-500/40 rounded-lg text-red-200 text-sm text-center"
				>
					{error}
				</motion.div>
			)}

			{/* Choice selection */}
			<div className="space-y-3 mb-6">
				{currentPlayerChoices.map((choice, index) => (
					<motion.button
						key={index}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.1 }}
						onClick={() => !disabled && !submitted && setSelectedChoice(choice)}
						disabled={disabled || submitted}
						className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
							selectedChoice === choice
								? "bg-pink-500/20 border-pink-500 text-pink-100 shadow-lg shadow-pink-500/20"
								: "bg-zinc-900/60 border-zinc-700 text-white hover:bg-zinc-800/60 hover:border-zinc-600"
						} ${
							disabled || submitted
								? "opacity-50 cursor-not-allowed"
								: "cursor-pointer"
						}`}
					>
						<div className="flex items-center">
							<div
								className={`w-4 h-4 rounded-full border-2 mr-3 ${
									selectedChoice === choice
										? "bg-pink-500 border-pink-500"
										: "border-zinc-600"
								}`}
							/>
							<span className="font-medium">{choice}</span>
						</div>
					</motion.button>
				))}
			</div>

			{/* Submit button */}
			<motion.button
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				onClick={handleSubmit}
				disabled={disabled || submitted || !selectedChoice}
				className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
					submitted
						? "bg-green-500/20 border-green-500/40 text-green-300"
						: selectedChoice
						? "bg-pink-500 text-black hover:bg-pink-400 hover:shadow-lg"
						: "bg-zinc-700 text-zinc-400 cursor-not-allowed"
				} ${disabled && !submitted ? "opacity-50" : ""}`}
			>
				{submitted
					? "✓ Choice submitted"
					: selectedChoice
					? "Submit to Kiro"
					: "Select a choice"}
			</motion.button>

			{/* Kiro's whisper */}
			{selectedChoice && !submitted && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="mt-4 text-center"
				>
					<p className="text-zinc-500 text-xs italic">
						💀 &ldquo;{selectedChoice}&rdquo; - Kiro approves...
					</p>
				</motion.div>
			)}
		</div>
	);
}
