"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface VoteCardProps {
	text: string;
	selected: boolean;
	onSelect: () => void;
	disabled?: boolean;
	index: number;
}

function VoteCard({
	text,
	selected,
	onSelect,
	disabled = false,
	index,
}: VoteCardProps) {
	return (
		<motion.div
			initial={{
				opacity: 0,
				y: 20,
				rotateX: -15,
				rotateY: Math.random() * 20 - 10,
			}}
			animate={{
				opacity: 1,
				y: 0,
				rotateX: 0,
				rotateY: 0,
			}}
			transition={{
				delay: index * 0.1,
				type: "spring",
				stiffness: 120,
				damping: 15,
			}}
			whileHover={
				!disabled
					? {
							scale: selected ? 1.08 : 1.05,
							rotateY: Math.random() * 6 - 3,
							rotateX: Math.random() * 4 - 2,
							y: -8,
							transition: { duration: 0.3 },
					  }
					: {}
			}
			whileTap={!disabled ? { scale: 0.98 } : {}}
			onClick={!disabled ? onSelect : undefined}
			className={`
				relative group cursor-pointer select-none
				${disabled ? "cursor-not-allowed opacity-50" : ""}
			`}
			style={{
				perspective: "1000px",
				transformStyle: "preserve-3d",
			}}
		>
			{/* Card Base - Tarot-like proportions */}
			<div
				className={`
					relative w-full aspect-[3/4] rounded-xl overflow-hidden
					bg-gradient-to-br from-zinc-900 via-zinc-800 to-black
					border-2 transition-all duration-300
					${
						selected
							? "border-purple-400 shadow-2xl shadow-purple-500/40"
							: "border-zinc-600 group-hover:border-zinc-500"
					}
				`}
				style={{
					backgroundImage: `
						radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
						radial-gradient(circle at 80% 80%, rgba(75, 0, 130, 0.1) 0%, transparent 50%),
						linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 100%)
					`,
				}}
			>
				{/* Mystical Background Pattern */}
				<div className="absolute inset-0 opacity-10">
					<div
						className="w-full h-full"
						style={{
							backgroundImage: `
								radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.3) 0%, transparent 25%),
								radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.3) 0%, transparent 25%),
								conic-gradient(from 0deg at 50% 50%, rgba(0,0,0,0) 0deg, rgba(255,255,255,0.1) 45deg, rgba(0,0,0,0) 90deg)
							`,
						}}
					/>
				</div>

				{/* Selection Glow */}
				{selected && (
					<motion.div
						className="absolute inset-0 rounded-xl"
						animate={{
							boxShadow: [
								"0 0 20px rgba(147, 51, 234, 0.3)",
								"0 0 40px rgba(147, 51, 234, 0.5)",
								"0 0 20px rgba(147, 51, 234, 0.3)",
							],
						}}
						transition={{ duration: 2, repeat: Infinity }}
					/>
				)}

				{/* Hover Glow Effect */}
				<motion.div
					className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					style={{ pointerEvents: "none" }}
				/>

				{/* Inner Content Container */}
				<div className="relative h-full flex flex-col justify-center items-center p-6">
					{/* Mystical Symbol at Top */}
					<motion.div
						className="absolute top-4 text-2xl opacity-60"
						animate={selected ? { rotate: 360 } : {}}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					>
						{selected ? "⚡" : "◇"}
					</motion.div>

					{/* Vote Text */}
					<div className="flex-1 flex items-center justify-center text-center">
						<motion.p
							className={`
								text-lg font-serif leading-relaxed transition-all duration-300
								${selected ? "text-purple-100 font-semibold" : "text-zinc-200"}
								drop-shadow-lg italic
							`}
							initial={{ opacity: 0.8 }}
							animate={{ opacity: selected ? 1 : 0.9 }}
						>
							&ldquo;{text}&rdquo;
						</motion.p>
					</div>

					{/* Selection Indicator */}
					<motion.div
						className={`
							absolute bottom-4 w-6 h-6 rounded-full border-2 transition-all duration-300
							${
								selected
									? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50"
									: "border-zinc-500 bg-transparent"
							}
						`}
						animate={selected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
						transition={{ duration: 0.5, repeat: selected ? Infinity : 0 }}
					>
						{selected && (
							<motion.div
								className="w-full h-full rounded-full bg-white/20"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.2 }}
							/>
						)}
					</motion.div>

					{/* Mystical Corner Decorations */}
					<div className="absolute top-2 left-2 text-xs text-zinc-600">◈</div>
					<div className="absolute top-2 right-2 text-xs text-zinc-600">◈</div>
					<div className="absolute bottom-2 left-2 text-xs text-zinc-600">
						◈
					</div>
					<div className="absolute bottom-2 right-2 text-xs text-zinc-600">
						◈
					</div>
				</div>
			</div>
		</motion.div>
	);
}

export default function VoteSection({
	player,
	entries,
	onVote,
	disabled,
}: {
	player: string;
	entries: { id: string; text: string }[];
	onVote: (id: string) => void;
	disabled: boolean;
}) {
	const [selected, setSelected] = useState("");
	const [voted, setVoted] = useState(false);

	const handleVote = () => {
		if (selected) {
			setVoted(true);
			onVote(selected);
		}
	};

	return (
		<div className="relative max-w-4xl mx-auto">
			{/* Atmospheric background mist */}
			<div className="absolute inset-0 bg-gradient-to-br from-zinc-900/40 via-purple-900/20 to-red-900/20 rounded-2xl backdrop-blur-sm border border-zinc-700/30" />

			{/* Floating atmospheric particles */}
			{[...Array(8)].map((_, i) => (
				<motion.div
					key={i}
					className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
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
				{/* Title Section */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8"
				>
					<motion.h2
						className="text-3xl text-zinc-100 text-center mb-3 relative"
						animate={{
							textShadow: [
								"0 0 10px rgba(147, 51, 234, 0.3)",
								"0 0 20px rgba(147, 51, 234, 0.5)",
								"0 0 10px rgba(147, 51, 234, 0.3)",
							],
						}}
						transition={{ duration: 3, repeat: Infinity }}
					>
						Choose Your Judgment
						{/* Subtle flicker underline */}
						<motion.div
							className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
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
						The void awaits your verdict, {player}.
					</motion.p>
				</motion.div>

				{/* Mystical Vote Cards Grid */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3, duration: 0.5 }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto"
				>
					{entries.map((entry, index) => (
						<VoteCard
							key={entry.id}
							text={entry.text}
							selected={selected === entry.id}
							onSelect={() => setSelected(entry.id)}
							disabled={disabled || voted}
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
					<motion.div
						className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur-lg"
						animate={{
							opacity: [0.5, 0.8, 0.5],
							scale: [0.95, 1.05, 0.95],
						}}
						transition={{ duration: 2, repeat: Infinity }}
					/>

					<Button
						className={`
							relative w-full py-4 px-8 text-lg font-semibold rounded-lg
							transition-all duration-300 transform
							${
								disabled || !selected || voted
									? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
									: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
							}
						`}
						onClick={handleVote}
						disabled={disabled || !selected || voted}
					>
						<motion.span
							animate={
								!disabled && selected && !voted
									? {
											textShadow: [
												"0 0 5px rgba(255,255,255,0.5)",
												"0 0 10px rgba(255,255,255,0.8)",
												"0 0 5px rgba(255,255,255,0.5)",
											],
									  }
									: {}
							}
							transition={{ duration: 1.5, repeat: Infinity }}
						>
							{voted
								? "⚡ Judgment Cast - Awaiting Others..."
								: !selected
								? "⚗️ Select Your Choice First"
								: "⚡ Cast Your Judgment"}
						</motion.span>
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
