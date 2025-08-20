"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface GameStartRitualProps {
	theme: string;
	onRitualComplete: () => void;
}

export default function GameStartRitual({
	theme,
	onRitualComplete,
}: GameStartRitualProps) {
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		// Show content immediately
		setShowContent(true);

		// Auto-complete ritual after 3 seconds
		const timer = setTimeout(() => {
			onRitualComplete();
		}, 3000);

		return () => clearTimeout(timer);
	}, [onRitualComplete]);

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
							y: Math.random() * window.innerHeight,
						}}
						animate={{
							y: [null, -100],
							opacity: [0.3, 0, 0.3],
						}}
						transition={{
							duration: 3 + Math.random() * 2,
							repeat: Infinity,
							delay: Math.random() * 2,
						}}
					/>
				))}
			</div>

			{showContent && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, ease: "easeOut" }}
					className="text-center space-y-8 max-w-md mx-auto px-6"
				>
					{/* Ritual Symbol */}
					<motion.div
						animate={{
							rotate: [0, 360],
							scale: [1, 1.1, 1],
						}}
						transition={{
							duration: 4,
							repeat: Infinity,
							ease: "linear",
						}}
						className="text-8xl text-red-500/80 mb-8"
					>
						👁️
					</motion.div>

					{/* Theme Declaration */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.8 }}
						className="space-y-4"
					>
						<h2 className="text-4xl font-bold text-white mb-4 tracking-wide">
							The Ritual Begins
						</h2>
						<div className="p-4 bg-gradient-to-r from-purple-900/40 to-red-900/40 rounded-lg border border-red-500/30">
							<p className="text-lg font-medium text-red-200">{theme}</p>
						</div>
					</motion.div>

					{/* Loading indicator */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1.5 }}
						className="flex items-center justify-center gap-2 text-zinc-400"
					>
						<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
						<div
							className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
							style={{ animationDelay: "0.2s" }}
						/>
						<div
							className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
							style={{ animationDelay: "0.4s" }}
						/>
					</motion.div>
				</motion.div>
			)}
		</div>
	);
}
