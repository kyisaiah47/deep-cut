import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NeonErrorStateProps {
	isVisible: boolean;
	message: string;
	type?: "error" | "warning" | "info";
	onDismiss?: () => void;
	className?: string;
}

export function NeonErrorState({
	isVisible,
	message,
	type = "error",
	onDismiss,
	className = "",
}: NeonErrorStateProps) {
	const getErrorStyling = () => {
		switch (type) {
			case "error":
				return {
					bg: "bg-surface-darker/90",
					border: "border-neon-magenta",
					text: "text-neon-magenta",
					glow: "shadow-neon-magenta",
					icon: "💀",
					prefix: "BAD INPUT",
				};
			case "warning":
				return {
					bg: "bg-surface-darker/90",
					border: "border-sun-yellow",
					text: "text-sun-yellow",
					glow: "shadow-[0_0_20px_rgba(255,210,58,0.5)]",
					icon: "⚠️",
					prefix: "YIKES",
				};
			case "info":
				return {
					bg: "bg-surface-darker/90",
					border: "border-neon-cyan",
					text: "text-neon-cyan",
					glow: "shadow-neon-cyan",
					icon: "ℹ️",
					prefix: "FYI",
				};
		}
	};

	const styling = getErrorStyling();

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8, y: -20 }}
					className={`fixed bottom-4 right-4 max-w-md z-50 ${className}`}
				>
					<motion.div
						className={`
							${styling.bg} ${styling.border} ${styling.glow}
							border-2 rounded-arcade p-4 backdrop-blur-sm
							chaos-shake relative overflow-hidden
						`}
						animate={{
							borderColor: [
								styling.border.split("-")[1] +
									"-" +
									styling.border.split("-")[2],
								"rgba(255, 255, 255, 0.5)",
								styling.border.split("-")[1] +
									"-" +
									styling.border.split("-")[2],
							],
						}}
						transition={{ duration: 0.5, repeat: Infinity }}
					>
						{/* Glitch background effect */}
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
							animate={{ x: ["-100%", "100%"] }}
							transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
						/>

						{/* Error content */}
						<div className="relative z-10 flex items-start gap-3">
							<motion.div
								className="text-2xl"
								animate={{ rotate: [0, -10, 10, 0] }}
								transition={{ duration: 0.5, repeat: Infinity }}
							>
								{styling.icon}
							</motion.div>

							<div className="flex-1">
								{/* Glitch prefix */}
								<motion.div
									className={`font-display font-black uppercase text-sm ${styling.text} mb-1`}
									animate={{
										textShadow: [
											"0 0 10px currentColor",
											"2px 0 10px #ff3af2, -2px 0 10px #00e5ff",
											"0 0 10px currentColor",
										],
									}}
									transition={{ duration: 0.3, repeat: Infinity }}
								>
									{styling.prefix}
								</motion.div>

								{/* Error message */}
								<p
									className={`font-body text-sm ${styling.text} leading-relaxed`}
								>
									{message}
								</p>
							</div>

							{/* Dismiss button */}
							{onDismiss && (
								<motion.button
									onClick={onDismiss}
									className={`
										${styling.text} hover:text-white
										font-display font-bold text-lg
										w-6 h-6 flex items-center justify-center
										transition-colors duration-200
									`}
									whileHover={{ scale: 1.2, rotate: 90 }}
									whileTap={{ scale: 0.9 }}
								>
									×
								</motion.button>
							)}
						</div>

						{/* Chaotic decorations */}
						<div className="absolute -top-2 -left-2 text-lg opacity-60">💥</div>
						<div className="absolute -bottom-2 -right-2 text-lg opacity-60">
							🔥
						</div>

						{/* Scribbled border effect */}
						<svg className="absolute inset-0 w-full h-full pointer-events-none">
							<rect
								x="2"
								y="2"
								width="calc(100% - 4px)"
								height="calc(100% - 4px)"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								strokeDasharray="5,5"
								opacity="0.3"
								rx="12"
							/>
						</svg>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// Preset error components for common use cases
export function BadInputError({
	isVisible,
	message,
	onDismiss,
}: {
	isVisible: boolean;
	message: string;
	onDismiss?: () => void;
}) {
	return (
		<NeonErrorState
			isVisible={isVisible}
			message={message}
			type="error"
			onDismiss={onDismiss}
		/>
	);
}

export function MemeWarning({
	isVisible,
	message,
	onDismiss,
}: {
	isVisible: boolean;
	message: string;
	onDismiss?: () => void;
}) {
	return (
		<NeonErrorState
			isVisible={isVisible}
			message={message}
			type="warning"
			onDismiss={onDismiss}
		/>
	);
}

export function ChaosInfo({
	isVisible,
	message,
	onDismiss,
}: {
	isVisible: boolean;
	message: string;
	onDismiss?: () => void;
}) {
	return (
		<NeonErrorState
			isVisible={isVisible}
			message={message}
			type="info"
			onDismiss={onDismiss}
		/>
	);
}
