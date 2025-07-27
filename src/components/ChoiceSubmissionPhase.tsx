"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChoiceCard from "./game/ChoiceCard";

interface PlayerChoices {
	[player: string]: string[];
}

const kiroCommentaries = [
	"One of these choices is a lie you've told yourself.",
	"Don't take too long. The void is patient, but I'm not.",
	"Your truth is written in the shadows between these words.",
	"Choose the one that haunts you at 3 AM.",
	"The correct answer died with your innocence.",
	"Which confession will you wear like a crown?",
	"Your choice echoes in dimensions you cannot see.",
	"Pick the one that makes your reflection blink first.",
];

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
	const [kiroCommentary, setKiroCommentary] = useState<string>("");
	const [showCommentary, setShowCommentary] = useState(false);

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

	// Kiro commentary timer
	useEffect(() => {
		if (loading || submitted) return;

		const showRandomCommentary = () => {
			const randomComment =
				kiroCommentaries[Math.floor(Math.random() * kiroCommentaries.length)];
			setKiroCommentary(randomComment);
			setShowCommentary(true);

			// Hide after 4 seconds
			setTimeout(() => setShowCommentary(false), 4000);
		};

		// Show first commentary after 8 seconds
		const firstTimer = setTimeout(showRandomCommentary, 8000);

		// Then show random commentary every 15-20 seconds
		const intervalTimer = setInterval(() => {
			if (Math.random() > 0.3) {
				// 70% chance to show
				showRandomCommentary();
			}
		}, 15000 + Math.random() * 5000);

		return () => {
			clearTimeout(firstTimer);
			clearInterval(intervalTimer);
		};
	}, [loading, submitted]);

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
			<div className="relative min-h-[60vh] flex items-center justify-center">
				{/* Atmospheric background */}
				<div className="absolute inset-0 bg-gradient-to-br from-zinc-900/60 via-purple-900/20 to-red-900/30 rounded-lg backdrop-blur-sm" />

				{/* Floating particles */}
				{[...Array(8)].map((_, i) => (
					<motion.div
						key={i}
						className="absolute w-1 h-1 bg-red-500/40 rounded-full"
						animate={{
							x: [0, Math.random() * 100 - 50],
							y: [0, Math.random() * 100 - 50],
							opacity: [0.2, 0.8, 0.2],
						}}
						transition={{
							duration: 3 + Math.random() * 2,
							repeat: Infinity,
							ease: "easeInOut",
						}}
						style={{
							left: `${20 + Math.random() * 60}%`,
							top: `${20 + Math.random() * 60}%`,
						}}
					/>
				))}

				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full relative z-10"
				/>
				<span className="ml-4 text-white relative z-10">
					Kiro is crafting your fate...
				</span>
			</div>
		);
	}

	return (
		<div className="relative max-w-4xl mx-auto">
			{/* Atmospheric background mist */}
			<div className="absolute inset-0 bg-gradient-to-br from-zinc-900/40 via-purple-900/20 to-red-900/20 rounded-2xl backdrop-blur-sm border border-zinc-700/30" />

			{/* Floating atmospheric particles */}
			{[...Array(12)].map((_, i) => (
				<motion.div
					key={i}
					className="absolute w-1 h-1 bg-red-400/30 rounded-full"
					animate={{
						x: [0, Math.random() * 200 - 100],
						y: [0, Math.random() * 200 - 100],
						opacity: [0.1, 0.6, 0.1],
						scale: [0.5, 1.2, 0.5],
					}}
					transition={{
						duration: 4 + Math.random() * 3,
						repeat: Infinity,
						ease: "easeInOut",
						delay: Math.random() * 2,
					}}
					style={{
						left: `${10 + Math.random() * 80}%`,
						top: `${10 + Math.random() * 80}%`,
					}}
				/>
			))}

			<div className="relative z-10 p-8">
				{/* Prompt Section with Surreal Styling */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8"
				>
					<motion.h2
						className="text-3xl text-zinc-100 text-center mb-3 relative"
						animate={{
							textShadow: [
								"0 0 10px rgba(239, 68, 68, 0.3)",
								"0 0 20px rgba(239, 68, 68, 0.5)",
								"0 0 10px rgba(239, 68, 68, 0.3)",
							],
						}}
						transition={{ duration: 3, repeat: Infinity }}
					>
						{prompt}
						{/* Subtle flicker underline */}
						<motion.div
							className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"
							animate={{
								width: ["20%", "60%", "20%"],
								opacity: [0.3, 0.8, 0.3],
							}}
							transition={{ duration: 2.5, repeat: Infinity }}
						/>
					</motion.h2>

					<motion.p
						className="text-sm text-zinc-400 text-center italic"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
					>
						Choose wisely. Kiro is watching through the cracks.
					</motion.p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3 }}
					className="text-center mb-8"
				>
					<div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-900/40 to-red-900/40 rounded-full border border-purple-500/30">
						<span className="text-lg font-medium text-purple-200">
							{currentPlayer}
						</span>
						<span className="text-zinc-400 text-sm ml-2">
							• Your private choices
						</span>
					</div>
				</motion.div>

				{/* Error message with atmospheric styling */}
				{error && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="mb-6 p-4 bg-gradient-to-r from-red-900/60 to-purple-900/40 rounded-lg border border-red-500/50"
					>
						<div className="flex items-center justify-center gap-2">
							<span className="text-red-400 animate-pulse">⚠️</span>
							<span className="text-red-200 text-sm">{error}</span>
						</div>
					</motion.div>
				)}

				{/* Mystical Choice Cards Grid */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3, duration: 0.5 }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto"
				>
					{currentPlayerChoices.map((choice, index) => (
						<ChoiceCard
							key={index}
							text={choice}
							selected={selectedChoice === choice}
							onSelect={() => setSelectedChoice(choice)}
							disabled={disabled || submitted}
							index={index}
						/>
					))}
				</motion.div>

				{/* Mystical Submit Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
					className="relative max-w-md mx-auto"
				>
					<motion.button
						onClick={handleSubmit}
						disabled={disabled || submitted || !selectedChoice}
						className={`
							w-full py-4 px-8 rounded-xl font-bold text-lg relative overflow-hidden
							transition-all duration-300 border-2
							${
								submitted
									? "bg-gradient-to-r from-green-900/60 to-emerald-900/60 border-green-400/60 text-green-200"
									: selectedChoice
									? "bg-gradient-to-r from-pink-900/80 to-red-900/80 border-pink-500 text-pink-100 hover:from-pink-800/80 hover:to-red-800/80 hover:border-pink-400"
									: "bg-gradient-to-r from-zinc-800/60 to-zinc-900/60 border-zinc-600 text-zinc-500 cursor-not-allowed"
							}
							${disabled && !submitted ? "opacity-50" : ""}
						`}
						whileHover={
							selectedChoice && !submitted && !disabled
								? {
										scale: 1.02,
										boxShadow: "0 0 30px rgba(236, 72, 153, 0.4)",
								  }
								: {}
						}
						whileTap={
							selectedChoice && !submitted && !disabled ? { scale: 0.98 } : {}
						}
					>
						{/* Button text with mystical styling */}
						<span className="relative z-10 flex items-center justify-center gap-2">
							{submitted ? (
								<>
									<motion.span
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="text-xl"
									>
										✦
									</motion.span>
									<span>Choice Sealed in Darkness</span>
									<motion.span
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="text-xl"
									>
										✦
									</motion.span>
								</>
							) : selectedChoice ? (
								<>
									<motion.span
										animate={{ rotate: 360 }}
										transition={{
											duration: 2,
											repeat: Infinity,
											ease: "linear",
										}}
										className="text-xl"
									>
										◆
									</motion.span>
									<span>Offer to Kiro</span>
									<motion.span
										animate={{ rotate: -360 }}
										transition={{
											duration: 2,
											repeat: Infinity,
											ease: "linear",
										}}
										className="text-xl"
									>
										◆
									</motion.span>
								</>
							) : (
								<>
									<span className="text-zinc-400">⬦</span>
									<span>Select Your Fate</span>
									<span className="text-zinc-400">⬦</span>
								</>
							)}
						</span>

						{/* Mystical button glow */}
						{selectedChoice && !submitted && (
							<motion.div
								className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20"
								animate={{ opacity: [0.2, 0.4, 0.2] }}
								transition={{ duration: 2, repeat: Infinity }}
							/>
						)}
					</motion.button>
				</motion.div>

				{/* Kiro's whispered approval */}
				{selectedChoice && !submitted && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-6 text-center"
					>
						<p className="text-zinc-500 text-sm italic flex items-center justify-center gap-2">
							<motion.span
								animate={{ rotate: [0, 10, -10, 0] }}
								transition={{ duration: 2, repeat: Infinity }}
							>
								💀
							</motion.span>
							<span className="text-red-400">
								&ldquo;{selectedChoice}&rdquo;
							</span>
							<span>- Kiro&apos;s interest is piqued...</span>
						</p>
					</motion.div>
				)}
			</div>

			{/* Kiro Commentary Bubble */}
			<AnimatePresence>
				{showCommentary && kiroCommentary && !submitted && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: -20 }}
						className="absolute top-4 right-4 max-w-xs p-4 bg-gradient-to-br from-red-900/80 to-purple-900/80 rounded-lg border border-red-500/50 backdrop-blur-md"
					>
						<div className="flex items-start gap-2">
							<motion.span
								animate={{ scale: [1, 1.2, 1] }}
								transition={{ duration: 2, repeat: Infinity }}
								className="text-red-400 text-sm"
							>
								👁️
							</motion.span>
							<div>
								<p className="text-red-200 text-xs font-semibold mb-1">
									Kiro whispers:
								</p>
								<p className="text-red-100 text-xs italic leading-relaxed">
									&ldquo;{kiroCommentary}&rdquo;
								</p>
							</div>
						</div>

						{/* Speech bubble tail */}
						<div className="absolute bottom-0 right-6 transform translate-y-1/2 w-3 h-3 bg-red-900/80 border-r border-b border-red-500/50 rotate-45" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
