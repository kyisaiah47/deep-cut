"use client";

import { motion } from "framer-motion";

const icons = ["😈", "👻", "🤡", "😎", "🧠", "🎩"];

export default function FloatingBackground() {
	return (
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
	);
}
