"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import FloatingBackground from "./FloatingBackground";

interface KiroIntroProps {
	theme: string;
	onContinue: () => void;
}

export default function KiroIntro({ theme, onContinue }: KiroIntroProps) {
	const [intro, setIntro] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const generateIntro = async () => {
			setIsLoading(true);

			try {
				const response = await fetch("/api/generate-intro", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						theme,
						prompt: `You are Kiro, a cryptic AI host. Based on the theme "${theme}", generate a short 1-sentence intro to welcome the group. Make it poetic, slightly ominous, and atmospheric. Examples: "Welcome to your spiral. Lust meets longing, and none of you will leave the same." or "The masks fall tonight. Your secrets dance with shadows."`,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to generate intro");
				}

				const data = await response.json();
				setIntro(
					data.intro || `Welcome to the realm of ${theme}. Let the games begin.`
				);
			} catch (error) {
				console.error("Error generating intro:", error);

				// Fallback intros based on common theme patterns
				const fallbackIntros = [
					`Welcome to the realm of ${theme}. Your truths await in the shadows.`,
					`The circle forms around ${theme}. None shall escape unchanged.`,
					`${theme} calls to you. Answer, and face what lies beneath.`,
					`Tonight, ${theme} becomes your mirror. Prepare to see clearly.`,
					`The void whispers of ${theme}. Listen closely, for it speaks truth.`,
					`${theme} surrounds you now. Let the unraveling begin.`,
					`Step into the domain of ${theme}. Your masks will not protect you here.`,
					`${theme} awaits your confession. Speak, and be transformed.`,
				];

				const randomIntro =
					fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)];
				setIntro(randomIntro);
			} finally {
				setIsLoading(false);
			}
		};

		generateIntro();
	}, [theme]);

	return (
		<main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-zinc-900 text-white relative overflow-hidden">
			<FloatingBackground />

			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.8 }}
				className="text-center p-8 rounded-2xl shadow-2xl bg-zinc-800/90 backdrop-blur-md max-w-2xl w-full space-y-6 border border-zinc-700 relative z-10"
			>
				{/* Kiro's Avatar */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.5 }}
					className="flex items-center justify-center gap-3 mb-4"
				>
					<span className="text-4xl animate-pulse">💀</span>
					<h2 className="text-2xl font-bold text-red-300 tracking-wide">
						Kiro Speaks
					</h2>
					<span className="text-4xl animate-pulse">💀</span>
				</motion.div>

				{/* Theme Display */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30"
				>
					<p className="text-sm text-zinc-400 mb-1">Your chosen realm:</p>
					<p className="text-xl font-bold text-pink-300">{theme}</p>
				</motion.div>

				{/* Intro Message */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8, duration: 0.7 }}
					className="min-h-[100px] flex items-center justify-center"
				>
					{isLoading ? (
						<div className="flex items-center gap-3 text-zinc-400">
							<span className="animate-spin">🔮</span>
							<span className="text-lg italic">
								Kiro is channeling the spirits...
							</span>
						</div>
					) : (
						<p className="text-lg leading-relaxed text-zinc-200 italic font-medium px-4">
							&ldquo;{intro}&rdquo;
						</p>
					)}
				</motion.div>

				{/* Continue Button */}
				{!isLoading && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 1.2, duration: 0.5 }}
					>
						<Button
							onClick={onContinue}
							className="relative px-8 py-3 font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-purple-600 shadow-[0_0_20px_rgba(255,0,128,0.5)] hover:shadow-[0_0_30px_rgba(255,0,200,0.8)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
						>
							<span className="relative z-10">Enter the Abyss</span>
							<div className="absolute inset-0 rounded-lg blur-md opacity-50 bg-gradient-to-r from-red-600 to-purple-600 z-0" />
						</Button>
					</motion.div>
				)}
			</motion.div>

			{/* Atmospheric Elements */}
			<motion.div
				className="absolute top-10 left-10 text-red-500/30 text-6xl"
				animate={{
					rotate: [0, 10, -10, 0],
					scale: [1, 1.1, 0.9, 1],
				}}
				transition={{
					duration: 4,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			>
				👁️
			</motion.div>

			<motion.div
				className="absolute bottom-10 right-10 text-purple-500/30 text-5xl"
				animate={{
					rotate: [0, -15, 15, 0],
					opacity: [0.3, 0.7, 0.3],
				}}
				transition={{
					duration: 6,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			>
				🕯️
			</motion.div>
		</main>
	);
}
