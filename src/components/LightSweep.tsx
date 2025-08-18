import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LightSweepProps {
	isActive: boolean;
	direction?: "left-to-right" | "right-to-left" | "top-to-bottom" | "radial";
	color?: "cyan" | "magenta" | "blue" | "lime" | "rainbow";
	intensity?: "low" | "medium" | "high";
	duration?: number;
	onComplete?: () => void;
}

export function LightSweep({
	isActive,
	direction = "left-to-right",
	color = "cyan",
	intensity = "medium",
	duration = 2,
	onComplete,
}: LightSweepProps) {
	const getColorGradient = () => {
		switch (color) {
			case "cyan":
				return "from-transparent via-neon-cyan/80 to-transparent";
			case "magenta":
				return "from-transparent via-neon-magenta/80 to-transparent";
			case "blue":
				return "from-transparent via-electric-blue/80 to-transparent";
			case "lime":
				return "from-transparent via-acid-lime/80 to-transparent";
			case "rainbow":
				return "from-neon-cyan/60 via-neon-magenta/80 via-electric-blue/60 via-acid-lime/80 to-neon-cyan/60";
		}
	};

	const getIntensityOpacity = () => {
		switch (intensity) {
			case "low":
				return "opacity-40";
			case "medium":
				return "opacity-70";
			case "high":
				return "opacity-90";
		}
	};

	const getSweepAnimation = () => {
		switch (direction) {
			case "left-to-right":
				return {
					initial: { x: "-100%" },
					animate: { x: "100%" },
				};
			case "right-to-left":
				return {
					initial: { x: "100%" },
					animate: { x: "-100%" },
				};
			case "top-to-bottom":
				return {
					initial: { y: "-100%" },
					animate: { y: "100%" },
				};
			case "radial":
				return {
					initial: { scale: 0, opacity: 0 },
					animate: { scale: 3, opacity: [0, 1, 0] },
				};
		}
	};

	const sweepAnimation = getSweepAnimation();

	return (
		<AnimatePresence>
			{isActive && (
				<motion.div
					className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onAnimationComplete={onComplete}
				>
					{direction === "radial" ? (
						<motion.div
							className={`
								absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
								w-32 h-32 rounded-full
								bg-gradient-radial ${getColorGradient()} ${getIntensityOpacity()}
								blur-xl
							`}
							{...sweepAnimation}
							transition={{ duration, ease: "easeOut" }}
						/>
					) : (
						<motion.div
							className={`
								absolute inset-0
								${
									direction.includes("left") || direction.includes("right")
										? `bg-gradient-to-r ${getColorGradient()}`
										: `bg-gradient-to-b ${getColorGradient()}`
								}
								${getIntensityOpacity()}
								blur-sm
							`}
							{...sweepAnimation}
							transition={{ duration, ease: "easeInOut" }}
						/>
					)}

					{/* Additional particle effects for high intensity */}
					{intensity === "high" && (
						<div className="absolute inset-0">
							{Array.from({ length: 20 }).map((_, i) => (
								<motion.div
									key={i}
									className="absolute w-2 h-2 bg-white rounded-full"
									style={{
										left: `${Math.random() * 100}%`,
										top: `${Math.random() * 100}%`,
									}}
									animate={{
										scale: [0, 1, 0],
										opacity: [0, 1, 0],
									}}
									transition={{
										duration: duration / 2,
										delay: Math.random() * duration,
									}}
								/>
							))}
						</div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// Preset light sweeps for common game events
export function NewRoundSweep({
	isActive,
	onComplete,
}: {
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<LightSweep
			isActive={isActive}
			direction="left-to-right"
			color="rainbow"
			intensity="high"
			duration={1.5}
			onComplete={onComplete}
		/>
	);
}

export function WinnerRevealSweep({
	isActive,
	onComplete,
}: {
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<LightSweep
			isActive={isActive}
			direction="radial"
			color="rainbow"
			intensity="high"
			duration={2}
			onComplete={onComplete}
		/>
	);
}

export function PhaseTransitionSweep({
	isActive,
	color = "cyan",
	onComplete,
}: {
	isActive: boolean;
	color?: "cyan" | "magenta" | "blue" | "lime";
	onComplete?: () => void;
}) {
	return (
		<LightSweep
			isActive={isActive}
			direction="top-to-bottom"
			color={color}
			intensity="medium"
			duration={1}
			onComplete={onComplete}
		/>
	);
}
