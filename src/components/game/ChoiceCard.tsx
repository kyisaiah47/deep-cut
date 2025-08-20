"use client";

import { motion } from "framer-motion";

interface ChoiceCardProps {
	text: string;
	selected: boolean;
	onSelect: () => void;
	disabled: boolean;
	index: number;
}

export default function ChoiceCard({
	text,
	selected,
	onSelect,
	disabled,
	index,
}: ChoiceCardProps) {
	return (
		<motion.button
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.1 }}
			onClick={onSelect}
			disabled={disabled}
			className={`
				p-4 rounded-xl text-left transition-all duration-300 transform
				backdrop-blur-md border-2
				${
					selected
						? "bg-pink-500/20 border-pink-500 shadow-lg shadow-pink-500/25 scale-[1.02]"
						: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]"
				}
				${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
			`}
			whileHover={disabled ? {} : { y: -2 }}
			whileTap={disabled ? {} : { scale: 0.98 }}
		>
			<div className="flex items-center justify-between">
				<span
					className="text-white text-sm leading-relaxed"
					style={{
						fontFamily:
							"'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
					}}
				>
					{text}
				</span>
				{selected && (
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className="ml-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0"
					>
						<span className="text-white text-xs">✓</span>
					</motion.div>
				)}
			</div>
		</motion.button>
	);
}
