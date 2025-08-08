"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TimerProps {
	duration: number; // Duration in seconds
	timeRemaining: number; // Current time remaining
	onExpire: () => void;
	isActive: boolean;
	isPaused?: boolean;
	label?: string;
	showProgress?: boolean;
	showControls?: boolean;
	onPause?: () => void;
	onResume?: () => void;
	className?: string;
}

export function Timer({
	duration,
	timeRemaining,
	onExpire,
	isActive,
	isPaused = false,
	label,
	showProgress = true,
	showControls = false,
	onPause,
	onResume,
	className = "",
}: TimerProps) {
	const [isExpired, setIsExpired] = useState(false);

	// Reset expired state when timer becomes active
	useEffect(() => {
		if (isActive && timeRemaining > 0) {
			setIsExpired(false);
		}
	}, [isActive, timeRemaining]);

	// Handle timer expiration
	useEffect(() => {
		if (isActive && timeRemaining === 0 && !isExpired) {
			setIsExpired(true);
			onExpire();
		}
	}, [isActive, timeRemaining, isExpired, onExpire]);

	// Format time display
	const formatTime = useCallback((seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}, []);

	// Calculate progress percentage
	const progress =
		duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;

	// Determine color based on time remaining
	const getTimerColor = () => {
		if (isPaused) return "text-yellow-600";
		const percentage = (timeRemaining / duration) * 100;
		if (percentage > 50) return "text-green-600";
		if (percentage > 25) return "text-yellow-600";
		return "text-red-600";
	};

	const getProgressColor = () => {
		if (isPaused) return "bg-yellow-500";
		const percentage = (timeRemaining / duration) * 100;
		if (percentage > 50) return "bg-green-500";
		if (percentage > 25) return "bg-yellow-500";
		return "bg-red-500";
	};

	// Handle pause/resume
	const handlePauseResume = useCallback(() => {
		if (isPaused) {
			onResume?.();
		} else {
			onPause?.();
		}
	}, [isPaused, onPause, onResume]);

	if (!isActive) {
		return null;
	}

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={`timer-${isActive}`}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				className={`flex flex-col items-center space-y-3 ${className}`}
			>
				{label && (
					<div className="flex items-center space-x-2">
						<span className="text-sm font-medium text-gray-600">{label}</span>
						{isPaused && (
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
							>
								PAUSED
							</motion.span>
						)}
					</div>
				)}

				<div className="flex items-center space-x-3">
					<motion.div
						className={`text-3xl font-bold ${getTimerColor()}`}
						animate={{
							scale:
								timeRemaining <= 10 && timeRemaining > 0 && !isPaused
									? [1, 1.1, 1]
									: 1,
						}}
						transition={{
							duration: 0.5,
							repeat:
								timeRemaining <= 10 && timeRemaining > 0 && !isPaused
									? Infinity
									: 0,
						}}
					>
						{formatTime(timeRemaining)}
					</motion.div>

					{showControls && (onPause || onResume) && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handlePauseResume}
							className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
							title={isPaused ? "Resume Timer" : "Pause Timer"}
						>
							{isPaused ? (
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
										clipRule="evenodd"
									/>
								</svg>
							) : (
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</motion.button>
					)}
				</div>

				{showProgress && (
					<div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden">
						<motion.div
							className={`h-full ${getProgressColor()} transition-colors duration-300`}
							initial={{ width: "0%" }}
							animate={{ width: `${progress}%` }}
							transition={{
								duration: isPaused ? 0 : 0.3,
								ease: "easeOut",
							}}
						/>
					</div>
				)}

				<AnimatePresence>
					{timeRemaining <= 5 && timeRemaining > 0 && !isPaused && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{
								opacity: 1,
								y: 0,
								scale: [1, 1.05, 1],
							}}
							exit={{ opacity: 0, y: -10 }}
							transition={{
								scale: {
									duration: 0.5,
									repeat: Infinity,
									repeatType: "reverse",
								},
							}}
							className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full"
						>
							⚠️ Time running out!
						</motion.div>
					)}
				</AnimatePresence>

				{isPaused && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-xs text-gray-500 text-center"
					>
						Timer is paused
					</motion.div>
				)}
			</motion.div>
		</AnimatePresence>
	);
}
