"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GameStartRitualProps {
	theme: string;
	onRitualComplete: () => void;
}

export default function GameStartRitual({
	theme,
	onRitualComplete,
}: GameStartRitualProps) {
	const [ritualWhispers, setRitualWhispers] = useState<string[]>([]);
	const [currentWhisperIndex, setCurrentWhisperIndex] = useState(0);
	const [showKiroIntro, setShowKiroIntro] = useState(false);
	const [loading, setLoading] = useState(true);

	// Fetch ritual whispers when component mounts
	useEffect(() => {
		const fetchRitualWhispers = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/generate-ritual-whispers", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ theme }),
				});

				if (response.ok) {
					const data = await response.json();
					setRitualWhispers(data.ritualWhispers || []);
				} else {
					// Fallback whispers
					setRitualWhispers([
						"You've opened the meat door. There's no going back.",
						"The void awaits your confessions. Speak your truth.",
						"Welcome to the theater of broken souls.",
					]);
				}
			} catch (error) {
				console.error("Error fetching ritual whispers:", error);
				// Emergency fallback
				setRitualWhispers([
					"You've opened the meat door. There's no going back.",
					"The circle is forming. Your choices will echo in eternity.",
					"The ritual begins. Your souls are laid bare.",
				]);
			} finally {
				setLoading(false);
			}
		};

		fetchRitualWhispers();
	}, [theme]);

	// Auto-advance through whispers
	useEffect(() => {
		if (ritualWhispers.length === 0 || loading) return;

		const timer = setTimeout(() => {
			if (currentWhisperIndex < ritualWhispers.length - 1) {
				setCurrentWhisperIndex((prev) => prev + 1);
			} else {
				// Show Kiro intro after whispers
				setShowKiroIntro(true);
				// Complete ritual after intro
				setTimeout(() => {
					onRitualComplete();
				}, 3000);
			}
		}, 2500); // Each whisper shows for 2.5 seconds

		return () => clearTimeout(timer);
	}, [currentWhisperIndex, ritualWhispers.length, loading, onRitualComplete]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-black flex items-center justify-center">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full"
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-black flex flex-col items-center justify-center relative overflow-hidden">
			{/* Background particles */}
			<div className="absolute inset-0 overflow-hidden">
				{[...Array(20)].map((_, i) => (
					<motion.div
						key={i}
						className="absolute w-1 h-1 bg-red-500/30 rounded-full"
						initial={{
							x: Math.random() * window.innerWidth,
							y: window.innerHeight + 10,
						}}
						animate={{
							y: -10,
							opacity: [0, 1, 0],
						}}
						transition={{
							duration: Math.random() * 3 + 2,
							repeat: Infinity,
							delay: Math.random() * 2,
						}}
					/>
				))}
			</div>

			{/* Theme Title */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="text-center mb-12"
			>
				<h1 className="text-4xl font-bold text-white mb-2">{theme}</h1>
				<div className="w-24 h-1 bg-gradient-to-r from-red-500 to-purple-500 mx-auto rounded-full" />
			</motion.div>

			{/* Ritual Whispers */}
			<div className="text-center max-w-2xl px-6">
				<AnimatePresence mode="wait">
					{!showKiroIntro && ritualWhispers[currentWhisperIndex] && (
						<motion.div
							key={currentWhisperIndex}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.8 }}
							className="mb-8"
						>
							<p className="text-2xl text-zinc-300 italic font-light leading-relaxed">
								&ldquo;{ritualWhispers[currentWhisperIndex]}&rdquo;
							</p>
						</motion.div>
					)}

					{/* Kiro's Final Intro */}
					{showKiroIntro && (
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 1 }}
							className="text-center"
						>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
								className="mb-6"
							>
								<span
									className="text-6xl animate-pulse"
									style={{ animationDuration: "2s" }}
								>
									💀
								</span>
							</motion.div>

							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 1 }}
								className="text-3xl text-red-300 font-bold mb-4"
							>
								— KIRO —
							</motion.p>

							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 1.5 }}
								className="text-xl text-zinc-400 italic"
							>
								The ritual is complete. Let the games begin.
							</motion.p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Progress indicator */}
			{!showKiroIntro && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1 }}
					className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
				>
					<div className="flex space-x-2">
						{ritualWhispers.map((_, index) => (
							<div
								key={index}
								className={`w-2 h-2 rounded-full transition-all duration-500 ${
									index <= currentWhisperIndex ? "bg-red-500" : "bg-zinc-700"
								}`}
							/>
						))}
					</div>
				</motion.div>
			)}
		</div>
	);
}
