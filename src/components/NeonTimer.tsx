import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface NeonTimerProps {
	duration: number; // in seconds
	isActive: boolean;
	onComplete?: () => void;
	size?: number;
	strokeWidth?: number;
	showNumbers?: boolean;
	color?: "cyan" | "magenta" | "blue" | "lime";
}

export function NeonTimer({
	duration,
	isActive,
	onComplete,
	size = 120,
	strokeWidth = 8,
	showNumbers = true,
	color = "cyan",
}: NeonTimerProps) {
	const [timeLeft, setTimeLeft] = useState(duration);
	const [isWarning, setIsWarning] = useState(false);

	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const progress = timeLeft / duration;
	const strokeDasharray = circumference;
	const strokeDashoffset = circumference * (1 - progress);

	const colorMap = {
		cyan: {
			stroke: "#00E5FF",
			glow: "0 0 20px rgba(0, 229, 255, 0.8)",
			text: "text-neon-cyan",
		},
		magenta: {
			stroke: "#FF3AF2",
			glow: "0 0 20px rgba(255, 58, 242, 0.8)",
			text: "text-neon-magenta",
		},
		blue: {
			stroke: "#4D7CFF",
			glow: "0 0 20px rgba(77, 124, 255, 0.8)",
			text: "text-electric-blue",
		},
		lime: {
			stroke: "#B6FF3A",
			glow: "0 0 20px rgba(182, 255, 58, 0.8)",
			text: "text-acid-lime",
		},
	};

	const currentColor = colorMap[color];

	useEffect(() => {
		if (!isActive) {
			setTimeLeft(duration);
			return;
		}

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				const newTime = prev - 0.1;

				// Warning state when less than 10 seconds
				setIsWarning(newTime <= 10);

				if (newTime <= 0) {
					clearInterval(interval);
					onComplete?.();
					return 0;
				}

				return newTime;
			});
		}, 100);

		return () => clearInterval(interval);
	}, [isActive, duration, onComplete]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return mins > 0
			? `${mins}:${secs.toString().padStart(2, "0")}`
			: secs.toString();
	};

	return (
		<div className="relative flex items-center justify-center">
			{/* Background circle */}
			<svg
				width={size}
				height={size}
				className="transform -rotate-90"
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="rgba(255, 255, 255, 0.1)"
					strokeWidth={strokeWidth}
				/>

				{/* Progress circle */}
				<motion.circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={currentColor.stroke}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={strokeDasharray}
					strokeDashoffset={strokeDashoffset}
					style={{
						filter: `drop-shadow(${currentColor.glow})`,
					}}
					animate={
						isWarning
							? {
									stroke: ["#FF3AF2", currentColor.stroke, "#FF3AF2"],
							  }
							: {}
					}
					transition={
						isWarning
							? {
									duration: 0.5,
									repeat: Infinity,
									ease: "easeInOut",
							  }
							: {}
					}
				/>
			</svg>

			{/* Time display */}
			{showNumbers && (
				<motion.div
					className={`
						absolute inset-0 flex items-center justify-center
						font-display font-bold text-2xl ${currentColor.text}
					`}
					style={{
						textShadow: currentColor.glow,
					}}
					animate={
						isWarning
							? {
									scale: [1, 1.1, 1],
							  }
							: {}
					}
					transition={
						isWarning
							? {
									duration: 0.5,
									repeat: Infinity,
									ease: "easeInOut",
							  }
							: {}
					}
				>
					{formatTime(timeLeft)}
				</motion.div>
			)}

			{/* Pulse effect when warning */}
			{isWarning && (
				<motion.div
					className="absolute inset-0 rounded-full border-2 border-neon-magenta"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.8, 0, 0.8],
					}}
					transition={{
						duration: 1,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				/>
			)}
		</div>
	);
}

// Preset timer components for different game phases
export function SubmissionTimer({
	duration,
	isActive,
	onComplete,
}: {
	duration: number;
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<div className="flex flex-col items-center space-y-2">
			<div className="neon-heading neon-text-cyan text-sm">
				SUBMIT YOUR CARDS
			</div>
			<NeonTimer
				duration={duration}
				isActive={isActive}
				onComplete={onComplete}
				color="cyan"
			/>
		</div>
	);
}

export function VotingTimer({
	duration,
	isActive,
	onComplete,
}: {
	duration: number;
	isActive: boolean;
	onComplete?: () => void;
}) {
	return (
		<div className="flex flex-col items-center space-y-2">
			<div className="neon-heading neon-text-magenta text-sm">
				CAST YOUR VOTES
			</div>
			<NeonTimer
				duration={duration}
				isActive={isActive}
				onComplete={onComplete}
				color="magenta"
			/>
		</div>
	);
}
