"use client";

import { motion } from "framer-motion";

interface ChoiceCardProps {
	text: string;
	selected: boolean;
	onSelect: () => void;
	disabled?: boolean;
	index: number;
}

export default function ChoiceCard({
	text,
	selected,
	onSelect,
	disabled = false,
	index,
}: ChoiceCardProps) {
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
							? "border-pink-400 shadow-2xl shadow-pink-500/40"
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
								radial-gradient(circle at 25% 25%, rgba(236, 72, 153, 0.3) 0%, transparent 25%),
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
								"0 0 20px rgba(236, 72, 153, 0.3)",
								"0 0 40px rgba(236, 72, 153, 0.5)",
								"0 0 20px rgba(236, 72, 153, 0.3)",
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
						{selected ? "✦" : "◆"}
					</motion.div>

					{/* Choice Text */}
					<div className="flex-1 flex items-center justify-center text-center">
						<motion.p
							className={`
								text-lg font-serif leading-relaxed transition-all duration-300
								${selected ? "text-pink-100 font-semibold" : "text-zinc-200"}
								drop-shadow-lg
							`}
							initial={{ opacity: 0.8 }}
							animate={{ opacity: selected ? 1 : 0.9 }}
						>
							{text}
						</motion.p>
					</div>

					{/* Selection Indicator */}
					<motion.div
						className={`
							absolute bottom-4 w-6 h-6 rounded-full border-2 transition-all duration-300
							${
								selected
									? "bg-pink-500 border-pink-400 shadow-lg shadow-pink-500/50"
									: "border-zinc-500 bg-transparent"
							}
						`}
						whileHover={{ scale: 1.1 }}
					>
						{selected && (
							<motion.div
								initial={{ scale: 0, rotate: -180 }}
								animate={{ scale: 1, rotate: 0 }}
								className="w-3 h-3 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
							/>
						)}
					</motion.div>

					{/* Corner Decorations */}
					<div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-zinc-600 opacity-40" />
					<div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-zinc-600 opacity-40" />
					<div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-zinc-600 opacity-40" />
					<div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-zinc-600 opacity-40" />
				</div>

				{/* Floating Particles Effect */}
				{selected && (
					<div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
						{[...Array(6)].map((_, i) => (
							<motion.div
								key={i}
								className="absolute w-1 h-1 bg-pink-400 rounded-full"
								initial={{
									x: `${Math.random() * 100}%`,
									y: "100%",
									opacity: 0,
								}}
								animate={{
									y: "-20%",
									opacity: [0, 1, 0],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									delay: i * 0.5,
									ease: "easeOut",
								}}
								style={{
									left: `${10 + i * 15}%`,
								}}
							/>
						))}
					</div>
				)}
			</div>

			{/* Card Shadow */}
			<div
				className={`
					absolute inset-0 rounded-xl -z-10 transition-all duration-300
					${
						selected
							? "bg-gradient-to-br from-pink-500/20 to-red-500/20 blur-xl scale-110"
							: "bg-black/30 blur-lg scale-105 group-hover:scale-110"
					}
				`}
			/>
		</motion.div>
	);
}
