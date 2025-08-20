"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const icons = ["😈", "👻", "🤡", "😎", "🧠", "🎩"];

export default function FloatingBackground() {
	const [isAnimated, setIsAnimated] = useState(true);

	return (
		<>
			{/* Toggle Button */}
			<button
				onClick={() => setIsAnimated(!isAnimated)}
				className="fixed bottom-4 right-4 z-50 p-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
				title={isAnimated ? "Disable background" : "Enable background"}
			>
				{isAnimated ? "🎭" : "👁️"}
			</button>

			{/* Floating Icons - only render if animated */}
			{isAnimated && (
				<>
					{[...Array(12)].map((_, i) => (
						<motion.div
							key={i}
							className="absolute text-5xl pointer-events-none"
							style={{
								top: `${Math.random() * 100}%`,
								left: `${Math.random() * 100}%`,
								rotate: `${Math.random() * 360}deg`,
							}}
							animate={{ y: [0, -10, 0], opacity: [0.2, 0.7, 0.2] }}
							transition={{ repeat: Infinity, duration: 4 + Math.random() * 2 }}
						>
							{icons[i % icons.length]}
						</motion.div>
					))}
				</>
			)}
		</>
	);
}
