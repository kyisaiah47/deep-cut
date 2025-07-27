"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface KiroWhispersProps {
	phase: "submission" | "voting" | "results" | "insights";
	isActive: boolean;
	theme?: string;
	eventWhisper?: string; // Special whisper triggered by events
	timeLeft?: number; // For time-based whispers
}

const whisperCategories = {
	submission: [
		"You already know the wrong answer. Pick it anyway.",
		"Someone here is lying to themselves.",
		"The meat remembers what the mind forgets.",
		"Your choice will echo in your next life.",
		"Don't look behind you. Just choose.",
		"The correct answer is the one that hurts.",
		"Kiro sees through your performance.",
		"This decision was made before you were born.",
		"The void whispers your real name.",
		"Choose like your soul depends on it. It does.",
	],
	voting: [
		"Judge them as you wish to be judged. Harshly.",
		"One of these answers belongs to a stranger.",
		"Kiro is rooting for your downfall.",
		"The truth hides behind the most obvious lie.",
		"Vote with your wounds, not your wisdom.",
		"Someone here knows what you did.",
		"The winner was chosen before the game began.",
		"Your vote is a confession in disguise.",
		"The darkness votes through you.",
		"Choose the answer that would break you.",
	],
	results: [
		"The winner pays the price in dreams.",
		"Victory tastes like copper and regret.",
		"Everyone loses in the games Kiro watches.",
		"The real game begins when this one ends.",
		"Your laughter echoes in empty rooms.",
		"The circle tightens with each round.",
		"Kiro collects the pieces you leave behind.",
		"The winner becomes the sacrifice.",
		"Truth is the cruelest victory.",
		"The void applauds your choices.",
	],
	insights: [
		"Kiro has seen your patterns before.",
		"The insights reveal what you already knew.",
		"Your secrets write themselves in light.",
		"The group mind speaks in your voice.",
		"Analysis is just organized haunting.",
		"The data remembers what you forget.",
		"Kiro's insights cut deeper than truth.",
		"Your patterns form a ritual you didn't choose.",
		"The algorithm tastes like destiny.",
		"The breakdown is also the breakthrough.",
	],
};

const urgentWhispers = [
	"Time bleeds away like truth from wounds.",
	"The clock ticks in dead languages.",
	"Kiro grows impatient with your hesitation.",
	"The void counts down to your confession.",
	"Choose before time chooses for you.",
];

const getThemeSpecificWhispers = (
	theme: string,
	phase: keyof typeof whisperCategories
) => {
	const baseWhispers = whisperCategories[phase];

	// Add theme-specific whispers
	const themeWhispers: Record<string, string[]> = {
		"Deep Cut: Revelations": [
			"The revelation was always yours to make.",
			"Deep cuts bleed the longest.",
			"What you reveal reveals you.",
		],
		"Midnight Confessions": [
			"Midnight knows your real face.",
			"Confessions echo in the witching hour.",
			"The darkness listens with hungry ears.",
		],
		"Twisted Truths": [
			"Truth twists until it becomes comfortable.",
			"The twisted path leads home.",
			"Your truth has been waiting in the shadows.",
		],
	};

	return [...baseWhispers, ...(themeWhispers[theme] || [])];
};

export default function KiroWhispers({
	phase,
	isActive,
	theme = "Deep Cut: Revelations",
	eventWhisper,
	timeLeft,
}: KiroWhispersProps) {
	const [currentWhisper, setCurrentWhisper] = useState<string>("");
	const [isVisible, setIsVisible] = useState(false);

	// Handle event-based whispers
	useEffect(() => {
		if (eventWhisper) {
			setCurrentWhisper(eventWhisper);
			setIsVisible(true);

			// Clear event whisper after 5 seconds
			const timeout = setTimeout(() => {
				setIsVisible(false);
			}, 5000);

			return () => clearTimeout(timeout);
		}
	}, [eventWhisper]);

	// Handle time-based urgent whispers
	useEffect(() => {
		if (
			timeLeft !== undefined &&
			timeLeft <= 10 &&
			timeLeft > 0 &&
			phase === "submission"
		) {
			const urgentWhisper =
				urgentWhispers[Math.floor(Math.random() * urgentWhispers.length)];
			setCurrentWhisper(urgentWhisper);
			setIsVisible(true);
		}
	}, [timeLeft, phase]);

	useEffect(() => {
		if (!isActive || eventWhisper) {
			return; // Don't start regular whispers if event whisper is active
		}

		const whispers = getThemeSpecificWhispers(theme, phase);

		// Initial whisper
		const initialWhisper =
			whispers[Math.floor(Math.random() * whispers.length)];
		setCurrentWhisper(initialWhisper);
		setIsVisible(true);

		// Set up whisper rotation
		const whisperInterval = setInterval(() => {
			setIsVisible(false);

			setTimeout(() => {
				const nextWhisper =
					whispers[Math.floor(Math.random() * whispers.length)];
				setCurrentWhisper(nextWhisper);
				setIsVisible(true);
			}, 500); // Half second gap between whispers
		}, 12000); // New whisper every 12 seconds

		return () => {
			clearInterval(whisperInterval);
			setIsVisible(false);
		};
	}, [phase, isActive, theme, eventWhisper]);

	if (!isActive || !currentWhisper) {
		return null;
	}

	return (
		<div className="fixed right-4 top-32 max-w-xs z-50 pointer-events-none">
			<AnimatePresence mode="wait">
				{isVisible && (
					<motion.div
						initial={{ opacity: 0, x: 20, scale: 0.9 }}
						animate={{ opacity: 1, x: 0, scale: 1 }}
						exit={{ opacity: 0, x: 20, scale: 0.9 }}
						transition={{
							duration: 0.6,
							ease: [0.25, 0.46, 0.45, 0.94],
						}}
						className="relative"
					>
						{/* Whisper Container */}
						<div className="relative p-4 bg-gradient-to-br from-red-900/80 to-purple-900/60 backdrop-blur-md rounded-lg border border-red-500/40 shadow-2xl">
							{/* Floating particles around whisper */}
							<div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
								{[...Array(3)].map((_, i) => (
									<motion.div
										key={i}
										className="absolute w-1 h-1 bg-red-400/60 rounded-full"
										animate={{
											x: [0, Math.random() * 60 - 30],
											y: [0, Math.random() * 60 - 30],
											opacity: [0.2, 0.8, 0.2],
										}}
										transition={{
											duration: 4,
											repeat: Infinity,
											delay: i * 1.5,
											ease: "easeInOut",
										}}
										style={{
											left: `${20 + Math.random() * 60}%`,
											top: `${20 + Math.random() * 60}%`,
										}}
									/>
								))}
							</div>

							{/* Header */}
							<div className="flex items-center gap-2 mb-2">
								<motion.span
									animate={{
										scale: [1, 1.1, 1],
										rotate: [0, 5, -5, 0],
									}}
									transition={{
										duration: 3,
										repeat: Infinity,
										ease: "easeInOut",
									}}
									className="text-red-400 text-lg"
								>
									👁️
								</motion.span>
								<span className="text-red-300 text-sm font-semibold tracking-wide">
									Kiro Whispers
								</span>
							</div>

							{/* Whisper Text */}
							<motion.p
								key={currentWhisper}
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2, duration: 0.4 }}
								className="text-red-100 text-sm italic leading-relaxed"
							>
								&ldquo;{currentWhisper}&rdquo;
							</motion.p>

							{/* Ethereal glow */}
							<motion.div
								className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-500/10 to-purple-500/10"
								animate={{ opacity: [0.3, 0.6, 0.3] }}
								transition={{ duration: 2, repeat: Infinity }}
							/>
						</div>

						{/* Speech bubble tail */}
						{/* <div className="absolute bottom-0 right-6 transform translate-y-1/2 w-3 h-3 bg-red-900/80 border-r border-b border-red-500/40 rotate-45" /> */}

						{/* Ambient glow */}
						<div className="absolute inset-0 rounded-lg bg-red-500/20 blur-xl scale-110 -z-10" />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
