"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ChoiceCard from "./game/ChoiceCard";

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
	submissionCount = 0,
	totalPlayers = 0,
}: {
	prompt: string;
	theme: string;
	players: string[];
	currentPlayer: string;
	onSubmit: (answer: string) => void;
	disabled: boolean;
	submissionCount?: number;
	totalPlayers?: number;
}) {
	const [playerChoices, setPlayerChoices] = useState<PlayerChoices>({});
	const [selectedChoice, setSelectedChoice] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [submitted, setSubmitted] = useState(false);

	// Generate themed choices instantly - no API calls
	useEffect(() => {
		const generateThemedChoices = () => {
			const themedChoices: PlayerChoices = {};

			// Create themed choice templates that work for any prompt
			const choiceTemplates = [
				"The most obvious answer everyone's thinking",
				"Something completely unexpected and wild",
				"The answer that would make your mom proud",
				"The choice that breaks all social norms",
				"What you'd say if nobody was watching",
				"The diplomatically safe response",
				"The answer that would get you in trouble",
				"Something weirdly specific and personal",
				"The response that makes absolutely no sense",
				"What your evil twin would choose",
				"The answer that's technically correct but weird",
				"Something that would trend on social media",
				"The choice your therapist would analyze",
				"What you'd say at 3 AM with friends",
				"The answer that requires no explanation",
			];

			players.forEach((player) => {
				// Shuffle and pick 5 random choices for each player
				const shuffled = [...choiceTemplates].sort(() => Math.random() - 0.5);
				themedChoices[player] = shuffled.slice(0, 5);
			});

			setPlayerChoices(themedChoices);
			setLoading(false);
		};

		// Small delay to show the loading spinner briefly for smoothness
		setTimeout(generateThemedChoices, 200);
	}, [prompt, theme, players]);

	const handleSubmit = () => {
		if (!selectedChoice) {
			return;
		}
		setSubmitted(true);
		onSubmit(selectedChoice);
	};

	const currentPlayerChoices = playerChoices[currentPlayer] || [];

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[300px]">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
					className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full"
				/>
				<span
					className="ml-4 text-white"
					style={{
						fontFamily:
							"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
					}}
				>
					Generating your options...
				</span>
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl mx-auto">
			{/* Modern Header */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-8"
			>
				<h2
					className="text-2xl font-semibold text-white mb-2"
					style={{
						fontFamily:
							"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
						fontWeight: "600",
					}}
				>
					{prompt}
				</h2>
				<p
					className="text-zinc-400 text-sm mb-3"
					style={{
						fontFamily:
							"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
					}}
				>
					Choose your submission, {currentPlayer}
				</p>

				{/* Submission Progress */}
				{totalPlayers > 0 && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.1 }}
						className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700/50"
					>
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
								<motion.div
									className="w-3 h-3 rounded-full bg-pink-500"
									animate={{
										scale: submissionCount === totalPlayers ? [1, 1.2, 1] : 1,
									}}
									transition={{ duration: 0.6 }}
								/>
							</div>
							<span className="text-sm font-medium text-zinc-300">
								{submissionCount}/{totalPlayers} submitted
							</span>
						</div>
						{submissionCount === totalPlayers && (
							<motion.span
								initial={{ opacity: 0, scale: 0 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.3 }}
								className="text-green-400 text-sm"
							>
								✓ Moving to voting...
							</motion.span>
						)}
					</motion.div>
				)}
			</motion.div>

			{/* Modern Choice Cards Grid */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1 }}
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
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

			{/* Modern Submit Button */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="flex justify-center"
			>
				<Button
					className={`
						px-8 py-3 rounded-xl font-medium transition-all duration-300
						${
							disabled || !selectedChoice || submitted
								? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
								: "bg-pink-600 hover:bg-pink-500 text-white shadow-lg hover:shadow-pink-500/25 hover:-translate-y-0.5"
						}
					`}
					onClick={handleSubmit}
					disabled={disabled || !selectedChoice || submitted}
					style={{
						fontFamily:
							"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
						fontWeight: "500",
					}}
				>
					{submitted
						? `Submitted • Waiting for ${
								totalPlayers - submissionCount
						  } more...`
						: !selectedChoice
						? "Select your choice first"
						: "Submit answer"}
				</Button>
			</motion.div>
		</div>
	);
}
